from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import secrets

from app.database import get_db
from app.models import User, Website, MembershipStatus, UserRole, ClientWebsiteAccess
from app.schemas import WebsiteCreate, WebsiteOut
from app.auth import get_current_user, get_current_pro_or_admin, user_can_access_website

router = APIRouter(prefix="/api/websites", tags=["Websites"])


def generate_api_key() -> str:
    return secrets.token_hex(32)


@router.post("/", response_model=WebsiteOut, status_code=201)
def create_website(
    website_in: WebsiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_pro_or_admin)
):
    # Free users limited to 3 websites
    if current_user.membership == MembershipStatus.FREE:
        count = db.query(Website).filter(Website.owner_id == current_user.id).count()
        if count >= 3:
            raise HTTPException(
                status_code=403,
                detail="Free plan limited to 3 websites. Upgrade to Premium for unlimited."
            )

    website = Website(
        name=website_in.name,
        domain=website_in.domain.lower().strip(),
        api_key=generate_api_key(),
        owner_id=current_user.id
    )
    db.add(website)
    db.commit()
    db.refresh(website)
    return website


@router.get("/", response_model=List[WebsiteOut])
def list_my_websites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    - Admin / Pro: return websites they own
    - Client: return only websites granted via invite token
    """
    if current_user.role == UserRole.CLIENT:
        access_rows = db.query(ClientWebsiteAccess).filter(
            ClientWebsiteAccess.user_id == current_user.id
        ).all()
        website_ids = [r.website_id for r in access_rows]
        if not website_ids:
            return []
        return db.query(Website).filter(Website.id.in_(website_ids)).all()

    # Pro / Admin see their own websites
    return db.query(Website).filter(Website.owner_id == current_user.id).all()


@router.get("/{website_id}", response_model=WebsiteOut)
def get_website(
    website_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not user_can_access_website(db, current_user, website_id):
        raise HTTPException(status_code=404, detail="Website not found")
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    return website


@router.delete("/{website_id}", status_code=204)
def delete_website(
    website_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_pro_or_admin)
):
    website = db.query(Website).filter(
        Website.id == website_id,
        Website.owner_id == current_user.id
    ).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    db.delete(website)
    db.commit()
    return None
