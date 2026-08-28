from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, Membership, MembershipStatus
from app.schemas import MembershipOut, MembershipUpdate
from app.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/memberships", tags=["Memberships"])


@router.get("/me", response_model=MembershipOut)
def get_my_membership(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = db.query(Membership).filter(Membership.user_id == current_user.id).order_by(Membership.id.desc()).first()
    if not membership:
        membership = Membership(
            user_id=current_user.id,
            plan="free",
            status=MembershipStatus.FREE
        )
        db.add(membership)
        db.commit()
        db.refresh(membership)
    return membership


@router.get("/", response_model=List[MembershipOut])
def list_memberships(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return db.query(Membership).all()


@router.patch("/{user_id}", response_model=MembershipOut)
def update_membership(
    user_id: int,
    update: MembershipUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    membership = db.query(Membership).filter(Membership.user_id == user_id).order_by(Membership.id.desc()).first()
    if not membership:
        membership = Membership(user_id=user_id, plan="free", status=MembershipStatus.FREE)
        db.add(membership)

    data = update.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(membership, k, v)

    if update.status:
        user.membership = update.status
    if update.plan == "pro" or update.plan == "premium":
        user.membership = MembershipStatus.PREMIUM
        if not membership.expires_at:
            membership.expires_at = datetime.utcnow() + timedelta(days=365)

    db.commit()
    db.refresh(membership)
    return membership


@router.post("/upgrade")
def request_upgrade(
    current_user: User = Depends(get_current_user)
):
    return {
        "message": "Upgrade to Femantic Pro",
        "plan": "pro",
        "price": "$19/month",
        "features": [
            "Unlimited websites",
            "365-day retention",
            "Advanced filters & CSV export",
            "Detailed geo",
            "API access",
            "Priority support"
        ],
        "checkout_url": None
    }
