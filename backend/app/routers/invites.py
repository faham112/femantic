from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
import secrets

from app.database import get_db
from app.models import User, InviteToken, Website, ClientWebsiteAccess, UserRole
from app.schemas import InviteTokenCreate, InviteTokenOut, InviteTokenPublic
from app.auth import get_current_user, get_current_pro_or_admin

router = APIRouter(prefix="/api/invites", tags=["Invite Tokens"])


def generate_token() -> str:
    return secrets.token_urlsafe(32)


@router.post("/", response_model=InviteTokenOut, status_code=status.HTTP_201_CREATED)
def create_invite_token(
    data: InviteTokenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_pro_or_admin)
):
    """
    Pro / Admin user generates an Access Token for their clients.
    Client will use the link to register and get restricted access.
    """
    # Validate that all website_ids belong to this user
    owned_ids = {
        w.id for w in db.query(Website).filter(Website.owner_id == current_user.id).all()
    }
    invalid = set(data.allowed_website_ids) - owned_ids
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"You do not own these website IDs: {list(invalid)}"
        )

    expires_at = None
    if data.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=data.expires_in_days)

    token = InviteToken(
        token=generate_token(),
        created_by=current_user.id,
        allowed_website_ids=data.allowed_website_ids,
        allowed_metrics=data.allowed_metrics or ["visitors", "pageviews", "utm"],
        label=data.label,
        max_uses=data.max_uses,
        expires_at=expires_at,
        is_active=True
    )
    db.add(token)
    db.commit()
    db.refresh(token)

    # Attach invite link (frontend base URL can be configured)
    out = InviteTokenOut.model_validate(token)
    out.invite_link = f"/invite/{token.token}"
    return out


@router.get("/", response_model=List[InviteTokenOut])
def list_my_tokens(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_pro_or_admin)
):
    tokens = db.query(InviteToken).filter(
        InviteToken.created_by == current_user.id
    ).order_by(InviteToken.created_at.desc()).all()

    result = []
    for t in tokens:
        out = InviteTokenOut.model_validate(t)
        out.invite_link = f"/invite/{t.token}"
        result.append(out)
    return result


@router.get("/{token_str}", response_model=InviteTokenPublic)
def get_invite_public_info(
    token_str: str,
    db: Session = Depends(get_db)
):
    """
    Public endpoint – used by the invite register page.
    Returns brand name + allowed metrics so client sees who invited them.
    """
    token = db.query(InviteToken).filter(InviteToken.token == token_str).first()
    if not token:
        return InviteTokenPublic(
            is_valid=False,
            message="Invalid or expired invite link",
            allowed_metrics=[],
            brand_name=None,
            label=None
        )

    # Check validity
    if not token.is_active:
        return InviteTokenPublic(
            is_valid=False,
            message="This invite has been deactivated",
            allowed_metrics=[],
            brand_name=None,
            label=token.label
        )

    if token.expires_at and token.expires_at < datetime.now(timezone.utc):
        return InviteTokenPublic(
            is_valid=False,
            message="This invite has expired",
            allowed_metrics=[],
            brand_name=None,
            label=token.label
        )

    if token.used_count >= token.max_uses:
        return InviteTokenPublic(
            is_valid=False,
            message="This invite has reached its maximum uses",
            allowed_metrics=[],
            brand_name=None,
            label=token.label
        )

    creator = db.query(User).filter(User.id == token.created_by).first()
    brand = creator.brand_name or creator.full_name or creator.email if creator else "Femantic"

    return InviteTokenPublic(
        is_valid=True,
        label=token.label,
        brand_name=brand,
        allowed_metrics=token.allowed_metrics or [],
        message=None
    )


@router.delete("/{token_id}", status_code=204)
def revoke_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_pro_or_admin)
):
    token = db.query(InviteToken).filter(
        InviteToken.id == token_id,
        InviteToken.created_by == current_user.id
    ).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    token.is_active = False
    db.commit()
    return None
