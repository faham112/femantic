from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import User, Website, PageView, UserRole, PlanConfig


def get_config(db: Session) -> PlanConfig:
    row = db.query(PlanConfig).first()
    if row:
        return row
    row = PlanConfig(
        lite_max_sites=1,
        lite_max_pageviews=50000,
        pro_max_sites=20,
        pro_max_pageviews=2000000,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def apply_lite_defaults(db: Session, user: User) -> None:
    cfg = get_config(db)
    user.plan_slug = "lite"
    user.max_sites = cfg.lite_max_sites
    user.max_pageviews_month = cfg.lite_max_pageviews
    user.upgrade_requested = False


def apply_pro_defaults(db: Session, user: User) -> None:
    if user.role == UserRole.ADMIN:
        return
    cfg = get_config(db)
    user.plan_slug = "pro"
    user.max_sites = cfg.pro_max_sites
    user.max_pageviews_month = cfg.pro_max_pageviews
    user.upgrade_requested = False
    if user.role == UserRole.CLIENT:
        return
    user.role = UserRole.PRO


def is_super_user(user: User) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    return user.role == UserRole.PRO and (user.plan_slug or "lite") == "pro"


def month_pageviews(db: Session, user: User) -> int:
    if user.role == UserRole.ADMIN:
        return db.query(func.count(PageView.id)).scalar() or 0
    ids = [w.id for w in db.query(Website.id).filter(Website.owner_id == user.id).all()]
    if not ids:
        return 0
    start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return db.query(func.count(PageView.id)).filter(
        PageView.website_id.in_(ids),
        PageView.created_at >= start,
    ).scalar() or 0


def quota_payload(db: Session, user: User) -> dict:
    used_sites = db.query(func.count(Website.id)).filter(Website.owner_id == user.id).scalar() or 0
    used_pv = month_pageviews(db, user)
    max_sites = user.max_sites if user.max_sites is not None else (999999 if user.role == UserRole.ADMIN else 1)
    max_pv = user.max_pageviews_month if user.max_pageviews_month is not None else (999999999 if user.role == UserRole.ADMIN else 50000)
    if user.role == UserRole.ADMIN:
        max_sites, max_pv = 999999, 999999999
    pct = min(100, int(used_pv / max_pv * 100)) if max_pv else 0
    return {
        "plan_slug": "admin" if user.role == UserRole.ADMIN else (user.plan_slug or "lite"),
        "is_super": is_super_user(user),
        "is_client": user.role == UserRole.CLIENT,
        "used_sites": used_sites,
        "max_sites": max_sites,
        "used_pageviews": used_pv,
        "max_pageviews": max_pv,
        "pct": pct,
        "over_sites": used_sites >= max_sites,
        "over_traffic": used_pv >= max_pv,
        "upgrade_requested": bool(user.upgrade_requested),
    }
