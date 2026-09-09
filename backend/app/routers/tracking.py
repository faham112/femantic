from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from typing import Optional
from datetime import datetime, timedelta, date
from collections import defaultdict
import re
import time

from app.database import get_db
from app.models import Website, PageView, User, Event
from app.schemas import TrackEvent, StatsOverview
from app.auth import get_current_user, user_can_access_website
from app.config import settings

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
    ip = request.client.host if request.client else "unknown"
    if not _rate_ok(ip):
        raise HTTPException(status_code=429, detail="Too many track events")

    website = _site_by_key(db, api_key)
    if not website:
        raise HTTPException(status_code=404, detail="Invalid API key")

    kind = (event.event_type or "pageview").lower()
    if kind in ("heartbeat", "event"):
        try:
            db.add(Event(
                website_id=website.id,
                session_id=event.session_id,
                visitor_id=event.visitor_id or event.session_id,
                event_name=event.event_name or kind,
                event_data=event.event_data or {"path": event.path},
            ))
            db.commit()
        except Exception:
            db.rollback()
        return {"status": "ok", "stored": kind}

    ua = user_agent or event.user_agent or ""
    score, label, is_bot = calculate_traffic_score(ua, event.path, event.referrer)
    country = request.headers.get("CF-IPCountry") or request.headers.get("X-Country") or None
    if country in (None, "XX", "T1"):
        country = None

    pageview = PageView(
        website_id=website.id,
        path=(event.path or "/")[:512],
        title=(event.title or "")[:512] or None,
        referrer=event.referrer[:512] if event.referrer else None,
        user_agent=ua[:1000] if ua else None,
        ip_address=ip[:45] if ip else None,
        country=country[:100] if country else None,
        device=event.device or detect_device(ua),
        browser=detect_browser(ua),
        language=event.language,
        screen_width=event.screen_width,
        screen_height=event.screen_height,
        utm_source=event.utm_source,
        utm_medium=event.utm_medium,
        utm_campaign=event.utm_campaign,
        is_bot=is_bot,
        traffic_score=score,
        traffic_label=label,
        visitor_id=event.visitor_id or event.session_id,
        session_id=None,
    )
    db.add(pageview)
    db.commit()
    return {"status": "ok", "is_bot": is_bot, "traffic_score": score, "traffic_label": label}


def _period_stats(db: Session, website_id: int, since: datetime, until: datetime):
    q = db.query(PageView).filter(
        PageView.website_id == website_id,
        PageView.created_at >= since,
        PageView.created_at < until,
        PageView.traffic_label == "human",
    )
    views = q.count()
    users = (
        db.query(func.count(func.distinct(PageView.visitor_id)))
        .filter(
            PageView.website_id == website_id,
            PageView.created_at >= since,
            PageView.created_at < until,
            PageView.traffic_label == "human",
        )
        .scalar()
        or 0
    )
    bounce = 0.0
    if users:
        singles = (
            db.query(PageView.visitor_id)
            .filter(
                PageView.website_id == website_id,
                PageView.created_at >= since,
                PageView.created_at < until,
                PageView.traffic_label == "human",
            )
            .group_by(PageView.visitor_id)
            .having(func.count(PageView.id) == 1)
            .count()
        )
        bounce = round((singles / users) * 100, 1)
    spans = (
        db.query(
            PageView.visitor_id,
            func.min(PageView.created_at),
            func.max(PageView.created_at),
            func.count(PageView.id),
        )
        .filter(
            PageView.website_id == website_id,
            PageView.created_at >= since,
            PageView.created_at < until,
            PageView.traffic_label == "human",
            PageView.visitor_id.isnot(None),
        )
        .group_by(PageView.visitor_id)
        .all()
    )
    durations = []
    for _vid, mn, mx, cnt in spans:
        if mn and mx and cnt > 1:
            durations.append(max(0, int((mx - mn).total_seconds())))
    avg_dur = int(sum(durations) / len(durations)) if durations else 0
    return views, users, bounce, avg_dur


@router.get("/stats/{website_id}", response_model=StatsOverview)
def get_stats(
    website_id: int,
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not user_can_access_website(db, current_user, website_id):
        raise HTTPException(status_code=404, detail="Website not found")
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")

    days = max(1, min(days, 90))
    until = datetime.utcnow()
    since = until - timedelta(days=days)
    prev_since = since - timedelta(days=days)

    views, users, bounce, avg_dur = _period_stats(db, website_id, since, until)
    p_views, p_users, p_bounce, _ = _period_stats(db, website_id, prev_since, since)
    total_all = db.query(PageView).filter(PageView.website_id == website_id, PageView.created_at >= since).count()

    top_pages = (
        db.query(PageView.path, func.count(PageView.id).label("views"))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human")
        .group_by(PageView.path).order_by(desc("views")).limit(10).all()
    )
    top_referrers = (
        db.query(PageView.referrer, func.count(PageView.id).label("views"))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human", PageView.referrer.isnot(None))
        .group_by(PageView.referrer).order_by(desc("views")).limit(10).all()
    )
    top_sources = (
        db.query(PageView.utm_source, func.count(PageView.id).label("views"))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human", PageView.utm_source.isnot(None))
        .group_by(PageView.utm_source).order_by(desc("views")).limit(10).all()
    )
    devices_q = (
        db.query(PageView.device, func.count(PageView.id))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human")
        .group_by(PageView.device).all()
    )
    countries_q = (
        db.query(PageView.country, func.count(PageView.id).label("views"))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human", PageView.country.isnot(None))
        .group_by(PageView.country).order_by(desc("views")).limit(10).all()
    )
    base = db.query(PageView).filter(PageView.website_id == website_id, PageView.created_at >= since)
    return StatsOverview(
        total_pageviews=views,
        unique_sessions=users,
        true_traffic=users,
        bounce_rate=bounce,
        avg_duration_seconds=avg_dur,
        previous_users=p_users,
        previous_sessions=p_users,
        previous_pageviews=p_views,
        previous_bounce=p_bounce,
        top_pages=[{"path": p, "views": v} for p, v in top_pages],
        top_referrers=[{"referrer": r or "Direct", "views": v} for r, v in top_referrers],
        top_sources=[{"source": s or "(none)", "views": v} for s, v in top_sources],
        devices={d or "unknown": c for d, c in devices_q},
        countries=[{"country": c, "views": v} for c, v in countries_q],
        humans=views,
        bots=base.filter(PageView.traffic_label == "bot").count(),
        suspicious=base.filter(PageView.traffic_label == "suspicious").count(),
    )


@router.get("/series/{website_id}")
def get_series(
    website_id: int,
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not user_can_access_website(db, current_user, website_id):
        raise HTTPException(status_code=404, detail="Website not found")
    days = max(1, min(days, 90))
    now = datetime.utcnow().date()
    start = now - timedelta(days=days - 1)
    prev_start = start - timedelta(days=days)

    rows = (
        db.query(cast(PageView.created_at, Date).label("d"), func.count(PageView.id))
        .filter(
            PageView.website_id == website_id,
            PageView.traffic_label == "human",
            PageView.created_at >= datetime.combine(prev_start, datetime.min.time()),
        )
        .group_by("d")
        .all()
    )
    by_day = {r[0]: r[1] for r in rows}

    def fill(from_day: date, n: int):
        out = []
        for i in range(n):
            day = from_day + timedelta(days=i)
            out.append(int(by_day.get(day, 0)))
        return out

    return {"current": fill(start, days), "previous": fill(prev_start, days), "days": days}


@router.get("/events/{website_id}")
def list_events(
    website_id: int,
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not user_can_access_website(db, current_user, website_id):
        raise HTTPException(status_code=404, detail="Website not found")
    since = datetime.utcnow() - timedelta(days=max(1, min(days, 90)))
    rows = (
        db.query(Event.event_name, func.count(Event.id).label("count"))
        .filter(Event.website_id == website_id, Event.created_at >= since, Event.event_name != "heartbeat")
        .group_by(Event.event_name)
        .order_by(desc("count"))
        .limit(50)
        .all()
    )
    recent = (
        db.query(Event)
        .filter(Event.website_id == website_id, Event.created_at >= since, Event.event_name != "heartbeat")
        .order_by(Event.created_at.desc())
        .limit(25)
        .all()
    )
    return {
        "totals": [{"name": n, "count": c} for n, c in rows],
        "recent": [
            {"name": e.event_name, "visitor_id": e.visitor_id, "created_at": e.created_at.isoformat() if e.created_at else None}
            for e in recent
        ],
    }
