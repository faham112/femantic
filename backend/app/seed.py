"""Create / refresh Super Admin and a demo website with sample traffic."""
import logging
import secrets
from datetime import datetime, timedelta, timezone
from random import choice, randint

from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models import User, UserRole, MembershipStatus, UserStatus, Website, PageView
from app.auth import get_password_hash

logger = logging.getLogger("femantic.seed")

DEMO_DOMAIN = "demo.femantic.dev"
PATHS = ["/", "/blog", "/pricing", "/docs", "/about", "/blog/analytics", "/features"]
REFERRERS = [None, "https://google.com", "https://twitter.com", "https://news.ycombinator.com", "https://facebook.com"]
DEVICES = ["mobile", "desktop", "tablet", "desktop", "mobile"]
BROWSERS = ["Chrome", "Chrome", "Safari", "Firefox", "Edge"]


def seed_admin() -> None:
    db: Session = SessionLocal()
    try:
        email = (settings.ADMIN_EMAIL or "").strip().lower()
        password = settings.ADMIN_PASSWORD
        name = settings.ADMIN_FULL_NAME
        if not email or not password:
            logger.warning("Admin seed skipped: ADMIN_EMAIL / ADMIN_PASSWORD missing")
            return

        user = db.query(User).filter(User.email == email).first()
        hashed = get_password_hash(password)
        if user:
            user.hashed_password = hashed
            user.role = UserRole.ADMIN
            user.full_name = name or user.full_name
            user.is_active = True
            user.status = UserStatus.ACTIVE
            if user.membership is None:
                user.membership = MembershipStatus.FREE
            db.commit()
            logger.info("Admin account refreshed: %s", email)
        else:
            user = User(
                email=email,
                hashed_password=hashed,
                full_name=name,
                role=UserRole.ADMIN,
                membership=MembershipStatus.FREE,
                status=UserStatus.ACTIVE,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info("Admin account created: %s", email)

        _seed_demo_site(db, user)
    except Exception as exc:
        db.rollback()
        logger.exception("Admin seed failed: %s", exc)
    finally:
        db.close()


def _seed_demo_site(db: Session, owner: User) -> None:
    site = db.query(Website).filter(Website.domain == DEMO_DOMAIN).first()
    if not site:
        site = Website(
            name="Femantic Demo",
            domain=DEMO_DOMAIN,
            api_key=secrets.token_hex(32),
            public_key=secrets.token_hex(12),
            owner_id=owner.id,
            is_active=True,
        )
        db.add(site)
        db.commit()
        db.refresh(site)
        logger.info("Demo website created: %s", DEMO_DOMAIN)

    existing = db.query(PageView).filter(PageView.website_id == site.id).count()
    if existing >= 40:
        return

    now = datetime.now(timezone.utc)
    rows = []
    for i in range(80):
        minutes_ago = randint(0, 14 * 24 * 60)
        created = now - timedelta(minutes=minutes_ago)
        path = choice(PATHS)
        ref = choice(REFERRERS)
        rows.append(
            PageView(
                website_id=site.id,
                path=path,
                title=path.strip("/") or "Home",
                referrer=ref,
                visitor_id=f"demo-{randint(1, 35)}",
                device=choice(DEVICES),
                browser=choice(BROWSERS),
                is_bot=False,
                traffic_score=0.95,
                traffic_label="human",
                created_at=created,
            )
        )
    db.add_all(rows)
    db.commit()
    logger.info("Seeded %s demo pageviews", len(rows))
