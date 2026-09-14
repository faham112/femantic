from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from typing import Optional
from datetime import datetime, timedelta, date
from collections import defaultdict
import re
import time
import logging

from app.database import get_db
from app.models import Website, PageView, User, Event
from app.schemas import TrackEvent, StatsOverview
from app.auth import get_current_user, user_can_access_website
from app.config import settings
from app.geo import country_from_request
from app.utm import resolve_utms
from app.sessions_svc import upsert_session

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/track", tags=["Tracking"])

_hits: dict[str, list[float]] = defaultdict(list)


def _rate_ok(ip: str) -> bool:
    limit = getattr(settings, "TRACK_RATE_LIMIT", 60) or 60
    now = time.time()
    window = [t for t in _hits[ip] if now - t < 60]
    window.append(now)
    _hits[ip] = window[-300:]
    return len(window) <= limit


def calculate_traffic_score(user_agent: Optional[str], path: str, referrer: Optional[str]) -> tuple:
    score = 1.0
    if not user_agent:
        return 0.1, "bot", True
    ua = user_agent.lower()
    bot_patterns = [
        r"bot", r"crawl", r"spider", r"slurp", r"facebookexternalhit",
        r"bingpreview", r"googlebot", r"yandex", r"baidu", r"duckduck",
        r"semrush", r"ahrefs", r"petalbot", r"bytespider",
    ]
    for p in bot_patterns:
        if re.search(p, ua):
            return 0.05, "bot", True
    if any(x in ua for x in ["headless", "phantomjs", "selenium", "puppeteer", "playwright"]):
        score -= 0.6
    if "mozilla" not in ua and "chrome" not in ua and "safari" not in ua:
        score -= 0.3
    score = max(0.0, min(1.0, score))
    if score >= 0.7:
        return score, "human", False
    if score >= 0.35:
        return score, "suspicious", False
    return score, "bot", True


def detect_device(user_agent: Optional[str]) -> str:
    if not user_agent:
        return "unknown"
    ua = user_agent.lower()
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        return "mobile"
    if "tablet" in ua or "ipad" in ua:
        return "tablet"
    return "desktop"


def detect_browser(user_agent: Optional[str]) -> str:
    if not user_agent:
        return "unknown"
    ua = user_agent.lower()
    if "chrome" in ua and "edg" not in ua:
        return "Chrome"
    if "firefox" in ua:
        return "Firefox"
    if "safari" in ua and "chrome" not in ua:
        return "Safari"
    if "edg" in ua:
        return "Edge"
    return "Other"


def detect_os(user_agent: Optional[str]) -> str:
    if not user_agent:
        return "unknown"
    ua = user_agent.lower()
    if "android" in ua:
        return "Android"
    if "iphone" in ua or "ipad" in ua or "ios" in ua:
        return "iOS"
    if "mac os" in ua or "macintosh" in ua:
        return "macOS"
    if "windows" in ua:
        return "Windows"
    if "linux" in ua:
        return "Linux"
    return "Other"


def _site_by_key(db: Session, api_key: str):
    website = db.query(Website).filter(Website.api_key == api_key, Website.is_active == True).first()
    if not website:
        website = db.query(Website).filter(Website.public_key == api_key, Website.is_active == True).first()
    return website


@router.post("/{api_key}")
async def track_pageview(
    api_key: str,
    event: TrackEvent,
    request: Request,
    db: Session = Depends(get_db),
    user_agent: Optional[str] = Header(None),
):
    try:
        ip = request.client.host if request.client else "unknown"
        if not _rate_ok(ip):
            raise HTTPException(status_code=429, detail="Too many track events")

        website = _site_by_key(db, api_key)
        if not website:
            raise HTTPException(status_code=404, detail="Invalid API key")

        kind = (event.event_type or "pageview").lower()
        ua = user_agent or event.user_agent or ""
        device = event.device or detect_device(ua)
        browser = detect_browser(ua)
        os_name = detect_os(ua)
        country = country_from_request(request.headers, event.timezone)

        if kind in ("heartbeat", "event"):
            try:
                upsert_session(
                    db, website.id, event.visitor_id or event.session_id, event.session_id,
                    country=country, device=device, browser=browser, os=os_name, is_pageview=False,
                )
                db.add(Event(
                    website_id=website.id,
                    session_id=event.session_id,
                    visitor_id=event.visitor_id or event.session_id,
                    event_name=event.event_name or kind,
                    event_data=event.event_data or {"path": event.path},
                ))
                db.commit()
            except Exception as e:
                db.rollback()
                log.warning("heartbeat skipped: %s", e)
            return {"status": "ok", "stored": kind}

        score, label, is_bot = calculate_traffic_score(ua, event.path, event.referrer)
        utm_source, utm_medium, utm_campaign, utm_term, utm_content = resolve_utms(event)

        sess_pk = None
        try:
            sess = upsert_session(
                db, website.id, event.visitor_id or event.session_id, event.session_id,
                country=country, device=device, browser=browser, os=os_name, is_pageview=True,
            )
            sess_pk = sess.id if sess else None
        except Exception as e:
            db.rollback()
            log.warning("session upsert failed: %s", e)

        pageview = PageView(
            website_id=website.id,
            path=(event.path or "/")[:512],
            title=(event.title or "")[:512] or None,
            referrer=event.referrer[:512] if event.referrer else None,
            user_agent=ua[:1000] if ua else None,
            ip_address=ip[:45] if ip else None,
            country=country,
            device=device,
            browser=browser,
            os=os_name,
            language=event.language,
            screen_width=event.screen_width,
            screen_height=event.screen_height,
            utm_source=utm_source,
            utm_medium=utm_medium,
            utm_campaign=utm_campaign,
            utm_term=utm_term,
            utm_content=utm_content,
            is_bot=is_bot,
            traffic_score=score,
            traffic_label=label,
            visitor_id=event.visitor_id or event.session_id,
            session_id=sess_pk,
        )
        try:
            db.add(pageview)
            db.commit()
        except Exception as e:
            db.rollback()
            log.warning("pageview with session failed: %s — retry without session", e)
            pageview.session_id = None
            db.add(pageview)
            db.commit()
        return {"status": "ok", "is_bot": is_bot, "traffic_score": score, "traffic_label": label}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log.exception("track failed")
        return {"status": "ok", "stored": False, "error": str(e)[:200]}
