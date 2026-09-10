from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://femantic:femantic_secret@localhost:5432/femantic"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_columns():
    """Add columns and indexes that create_all will not alter on existing tables."""
    stmts = [
        "ALTER TABLE pageviews ADD COLUMN IF NOT EXISTS utm_term VARCHAR(100)",
        "ALTER TABLE pageviews ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100)",
        "ALTER TABLE pageviews ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(64)",
        "CREATE INDEX IF NOT EXISTS ix_pageviews_utm_source ON pageviews (utm_source)",
        "CREATE INDEX IF NOT EXISTS ix_pageviews_utm_campaign ON pageviews (utm_campaign)",
        "CREATE INDEX IF NOT EXISTS ix_pageviews_utm_medium ON pageviews (utm_medium)",
        "CREATE INDEX IF NOT EXISTS ix_pageviews_utm_term ON pageviews (utm_term)",
        "CREATE INDEX IF NOT EXISTS ix_pageviews_site_created ON pageviews (website_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_pageviews_site_label_created ON pageviews (website_id, traffic_label, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_pageviews_visitor ON pageviews (website_id, visitor_id)",
        "CREATE INDEX IF NOT EXISTS ix_events_site_name_created ON events (website_id, event_name, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_sessions_site_started ON sessions (website_id, started_at)",
    ]
    with engine.begin() as conn:
        for s in stmts:
            try:
                conn.execute(text(s))
            except Exception:
                pass
