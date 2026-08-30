"""Create / refresh the constant Super Admin account on startup."""
import logging
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models import User, UserRole, MembershipStatus, UserStatus
from app.auth import get_password_hash

logger = logging.getLogger("femantic.seed")


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
            if hasattr(user, "status"):
                user.status = UserStatus.ACTIVE
            if hasattr(user, "membership") and user.membership is None:
                user.membership = MembershipStatus.FREE
            db.commit()
            logger.info("Admin account refreshed: %s", email)
            return

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
        logger.info("Admin account created: %s", email)
    except Exception as exc:
        db.rollback()
        logger.exception("Admin seed failed: %s", exc)
    finally:
        db.close()
