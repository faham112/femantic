from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import secrets

from app.database import get_db
from app.models import User, Website, MembershipStatus, UserRole, ClientWebsiteAccess
from app.schemas import WebsiteCreate, WebsiteOut, WebsiteUpdate
from app.auth import get_current_user, get_current_pro_or_admin, user_can_access_website

router = APIRouter(prefix="/api/websites", tags=["Websites"])


def generate_api_key() -> str:
    return secrets.token_hex(32)


def _owned(db: Session, current_user: User, website_id: int) -> Website:
    q = db.query(Website).filter(Website.id == website_id)
    if current_user.role != UserRole.ADMIN:
        q = q.filter(Website.owner_id == current_user.id)
    website = q.first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    return website


@router.post("/", response_model=WebsiteOut, status_code=201)
def create_website(
    website_in: WebsiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_pro_or_admin),
):
    if current_user.membership == MembershipStatus.FREE and current_user.role != UserRole.ADMIN:
        count = db.query(Website).filter(Website.owner_id == current_user.id).count()
        if count >= 3:
            raise HTTPException(status_code=403, detail="Free plan limited to 3 websites. Upgrade to Premium for unlimited.")

    domain = website_in.domain.lower().strip().replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
    website = Website(
        name=website_in.name.strip() or domain,
        domain=domain,
        api_key=generate_api_key(),
        public_key=secrets.token_hex(12),
        owner_id=current_user.id,
        is_active=True,
    )
    db.add(website)
    db.commit()
    db.refresh(website)
    return website


@router.get("/", response_model=List[WebsiteOut])
def list_my_websites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.ADMIN:
        return db.query(Website).order_by(Website.id.desc()).all()
    if current_user.role == UserRole.CLIENT:
        access_rows = db.query(ClientWebsiteAccess).filter(ClientWebsiteAccess.user_id == current_user.id).all()
        website_ids = [r.website_id for r in access_rows]
        if not website_ids:
            return []
        return db.query(Website).filter(Website.id.in_(website_ids)).all()
    return db.query(Website).filter(Website.owner_id == current_user.id).all()


@router.get("/{website_id}", response_model=WebsiteOut)
def get_website(
    website_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not user_can_access_website(db, current_user, website_id):
        raise HTTPException(status_code=404, detail="Website not found")
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    return website


@router.patch("/{website_id}", response_model=WebsiteOut)
def update_website(
    website_id: int,
    body: WebsiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_pro_or_admin),
):
    website = _owned(db, current_user, website_id)
    if body.name is not None:
        website.name = body.name.strip() or website.name
    if body.domain is not None:
        website.domain = body.domain.lower().strip().replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
    if body.is_active is not None:
        website.is_active = body.is_active
    db.commit()
    db.refresh(website)
    return website


@router.post("/{website_id}/rotate-key", response_model=WebsiteOut)
def rotate_key(
    website_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_pro_or_admin),
):
    website = _owned(db, current_user, website_id)
    website.api_key = generate_api_key()
    db.commit()
    db.refresh(website)
    return website


@router.delete("/{website_id}", status_code=204)
def delete_website(
    website_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_pro_or_admin),
):
    website = _owned(db, current_user, website_id)
    db.delete(website)
    db.commit()
    return None
