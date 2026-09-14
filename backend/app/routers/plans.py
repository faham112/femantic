from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, MembershipStatus
from app.auth import get_current_user, get_current_admin
from app.plan_svc import get_config, apply_pro_defaults, apply_lite_defaults, quota_payload, is_super_user

router = APIRouter(prefix="/api/plans", tags=["Plans"])


class PlanDefaultsIn(BaseModel):
    lite_max_sites: int | None = None
    lite_max_pageviews: int | None = None
    pro_max_sites: int | None = None
    pro_max_pageviews: int | None = None


class PromoteIn(BaseModel):
    user_id: int
    plan: str = "pro"
    max_sites: int | None = None
    max_pageviews_month: int | None = None


@router.get("/quota")
def my_quota(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return quota_payload(db, user)


@router.get("/defaults")
def defaults(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    c = get_config(db)
    return {
        "lite_max_sites": c.lite_max_sites,
        "lite_max_pageviews": c.lite_max_pageviews,
        "pro_max_sites": c.pro_max_sites,
        "pro_max_pageviews": c.pro_max_pageviews,
    }


@router.put("/defaults")
def save_defaults(body: PlanDefaultsIn, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    c = get_config(db)
    if body.lite_max_sites is not None:
        c.lite_max_sites = max(1, body.lite_max_sites)
    if body.lite_max_pageviews is not None:
        c.lite_max_pageviews = max(1000, body.lite_max_pageviews)
    if body.pro_max_sites is not None:
        c.pro_max_sites = max(1, body.pro_max_sites)
    if body.pro_max_pageviews is not None:
        c.pro_max_pageviews = max(1000, body.pro_max_pageviews)
    db.commit()
    return defaults(db, admin)


@router.post("/request-upgrade")
def request_upgrade(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == UserRole.ADMIN:
        raise HTTPException(400, "Admin already operates the platform")
    if user.role == UserRole.CLIENT:
        raise HTTPException(400, "Invited viewers cannot upgrade. Ask the site owner.")
    if is_super_user(user):
        return {"ok": True, "already": True}
    user.upgrade_requested = True
    db.commit()
    return {"ok": True, "already": False}


@router.post("/promote")
def promote(body: PromoteIn, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role == UserRole.ADMIN:
        raise HTTPException(400, "Cannot change an admin account")
    if body.plan == "pro":
        apply_pro_defaults(db, user)
        user.membership = MembershipStatus.PREMIUM
        if body.max_sites:
            user.max_sites = body.max_sites
        if body.max_pageviews_month:
            user.max_pageviews_month = body.max_pageviews_month
    else:
        apply_lite_defaults(db, user)
        user.membership = MembershipStatus.FREE
        if user.role != UserRole.CLIENT:
            user.role = UserRole.PRO
    db.commit()
    return {"ok": True, "plan_slug": user.plan_slug, "role": user.role.value}
