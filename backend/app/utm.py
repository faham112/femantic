from urllib.parse import parse_qs, urlsplit
from typing import Optional, Tuple


def _clip(value: Optional[str], n: int = 100) -> Optional[str]:
    if not value:
        return None
    cleaned = str(value).strip()
    return cleaned[:n] if cleaned else None


def parse_query(path_or_url: Optional[str]) -> dict:
    if not path_or_url:
        return {}
    try:
        raw = path_or_url
        if "?" not in raw and "&" not in raw:
            return {}
        query = raw.split("?", 1)[1] if "?" in raw else raw
        parsed = parse_qs(query, keep_blank_values=False)
        return {k.lower(): (v[0] if v else "") for k, v in parsed.items()}
    except Exception:
        return {}


def resolve_utms(event) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str], Optional[str]]:
    q = parse_query(getattr(event, "path", None))
    source = _clip(getattr(event, "utm_source", None) or q.get("utm_source"))
    medium = _clip(getattr(event, "utm_medium", None) or q.get("utm_medium"))
    campaign = _clip(getattr(event, "utm_campaign", None) or q.get("utm_campaign"))
    term = _clip(getattr(event, "utm_term", None) or q.get("utm_term"))
    content = _clip(getattr(event, "utm_content", None) or q.get("utm_content"))

    if not source:
        if q.get("gclid"):
            source, medium = "google", medium or "cpc"
        elif q.get("fbclid"):
            source, medium = "facebook", medium or "paid"
        elif q.get("msclkid"):
            source, medium = "bing", medium or "cpc"

    return source, medium, campaign, term, content


def referrer_host(referrer: Optional[str]) -> Optional[str]:
    if not referrer:
        return None
    try:
        host = urlsplit(referrer).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        return host or None
    except Exception:
        return referrer[:100]
