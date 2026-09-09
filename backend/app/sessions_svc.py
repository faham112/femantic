from datetime import datetime, timezone
from sqlalchemy.orm import Session as DB
from app.models import Session
import secrets


def upsert_session(
    db: DB,
    website_id: int,
    visitor_id: str | None,
    session_key: str | None,
    country=None,
    device=None,
    browser=None,
    os=None,
    is_pageview: bool = True,
) -> Session:
    key = (session_key or "").strip() or secrets.token_hex(16)
    row = db.query(Session).filter(Session.session_id == key).first()
    now = datetime.now(timezone.utc)
    if not row:
        row = Session(
            website_id=website_id,
            visitor_id=visitor_id or key,
            session_id=key,
            started_at=now,
            ended_at=now,
            duration=0,
            pageview_count=1 if is_pageview else 0,
            is_bounce=True,
            country=country,
            device=device,
            browser=browser,
            os=os,
        )
        db.add(row)
        db.flush()
        return row
    row.ended_at = now
    if row.started_at:
        start = row.started_at
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        row.duration = min(int((now - start).total_seconds()), 8 * 3600)
    if is_pageview:
        row.pageview_count = (row.pageview_count or 0) + 1
        row.is_bounce = row.pageview_count <= 1
    if country and not row.country:
        row.country = country
    if device and not row.device:
        row.device = device
    if browser and not row.browser:
        row.browser = browser
    if os and not row.os:
        row.os = os
    return row
