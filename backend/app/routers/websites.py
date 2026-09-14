from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import secrets

from app.database import get_db
from app.models import User, Website, UserRole, ClientWebsiteAccess
from app.schemas import WebsiteCreate, WebsiteOut, WebsiteUpdate
from app.auth import get_current_user, get_current_pro_or_admin, user_can_access_website
from app.plan_svc import quota_payload

router = APIRouter(prefix="/api/websites", tags=["Websites"])


def generate_api_key() -> str:
    return secrets.token_hex(32)


def generate_public_key() -> str:
    return secrets.token_urlsafe(10).replace("-", "").replace("_", "").lower()[:16]


def _out(w: Website, hide_key: bool) -> WebsiteOut:
    return WebsiteOut(
        id=w.id,
        name=w.name,
        domain=w.domain,
        api_key=None if hide_key else w.api_key,
        public_key=w.public_key,
        is_active=w.is_active,
        created_at=w.created_at,
        owner_id=w.owner_id,
    )


def ensure_public_key(db: Session, website: Website) -> Website:
    if not website.public_key:
        website.public_key = generate_public_key()
        db.add(website)
        db.commit()
        db.refresh(website)
    return website


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
    q = quota_payload(db, current_user)
    if current_user.role != UserRole.ADMIN and q["over_sites"]:
        raise HTTPException(
            status_code=403,
            detail=f"Site limit reached ({q['used_sites']}/{q['max_sites']}). Upgrade your plan or ask admin.",
        )

    domain = website_in.domain.lower().strip().replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
    website = Website(
        name=website_in.name.strip() or domain,
        domain=domain,
        api_key=generate_api_key(),
        public_key=generate_public_key(),
        owner_id=current_user.id,
        is_active=True,
    )
    db.add(website)
    db.commit()
    db.refresh(website)
    return _out(website, False)


@router.get("/", response_model=List[WebsiteOut])
def list_my_websites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hide = current_user.role == UserRole.CLIENT
    if current_user.role == UserRole.ADMIN:
        rows = db.query(Website).order_by(Website.id.desc()).all()
    elif current_user.role == UserRole.CLIENT:
        access_rows = db.query(ClientWebsiteAccess).filter(ClientWebsiteAccess.user_id == current_user.id).all()
        website_ids = [r.website_id for r in access_rows]
        rows = db.query(Website).filter(Website.id.in_(website_ids)).all() if website_ids else []
    else:
        rows = db.query(Website).filter(Website.owner_id == current_user.id).all()
    dirty = False
    for w in rows:
        if not w.public_key:
            w.public_key = generate_public_key()
            dirty = True
    if dirty:
        db.commit()
        for w in rows:
            db.refresh(w)
    return [_out(w, hide) for w in rows]


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
    return _out(ensure_public_key(db, website), current_user.role == UserRole.CLIENT)


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
    return _out(website, False)


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
    return _out(website, False)


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
