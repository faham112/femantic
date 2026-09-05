from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.auth import get_user_by_email, get_password_hash
from app.database import Base
from app.models import User


def test_get_user_by_email_is_case_insensitive():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    session = Session()
    session.add(User(
        email="Test@Example.com",
        hashed_password=get_password_hash("secret123"),
        full_name="Test User",
        is_active=True,
    ))
    session.commit()

    user = get_user_by_email(session, "test@example.com")

    assert user is not None
    assert user.email == "Test@Example.com"
    assert user.email.lower() == "test@example.com"
