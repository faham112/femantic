"""Country/city from IP (offline MMDB), Cloudflare header, or timezone fallback."""

from __future__ import annotations

import ipaddress
import logging
from pathlib import Path

from app.config import settings

log = logging.getLogger(__name__)

try:
    import maxminddb
except ImportError:  # pragma: no cover
    maxminddb = None

TZ_COUNTRY = {
    "Asia/Karachi": "PK",
    "Asia/Calcutta": "IN",
    "Asia/Kolkata": "IN",
    "Asia/Dubai": "AE",
    "Asia/Riyadh": "SA",
    "Asia/Qatar": "QA",
    "Asia/Kuwait": "KW",
    "Asia/Muscat": "OM",
    "Asia/Tehran": "IR",
    "Asia/Dhaka": "BD",
    "Asia/Kathmandu": "NP",
    "Asia/Colombo": "LK",
    "Asia/Shanghai": "CN",
    "Asia/Hong_Kong": "HK",
    "Asia/Singapore": "SG",
    "Asia/Tokyo": "JP",
    "Asia/Seoul": "KR",
    "Asia/Jakarta": "ID",
    "Asia/Bangkok": "TH",
    "Asia/Manila": "PH",
    "Asia/Ho_Chi_Minh": "VN",
    "Europe/London": "GB",
    "Europe/Paris": "FR",
    "Europe/Berlin": "DE",
    "Europe/Rome": "IT",
    "Europe/Madrid": "ES",
    "Europe/Amsterdam": "NL",
    "Europe/Brussels": "BE",
    "Europe/Zurich": "CH",
    "Europe/Vienna": "AT",
    "Europe/Stockholm": "SE",
    "Europe/Oslo": "NO",
    "Europe/Copenhagen": "DK",
    "Europe/Helsinki": "FI",
    "Europe/Warsaw": "PL",
    "Europe/Prague": "CZ",
    "Europe/Athens": "GR",
    "Europe/Istanbul": "TR",
    "Europe/Moscow": "RU",
    "Europe/Lisbon": "PT",
    "Europe/Dublin": "IE",
    "America/New_York": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "America/Los_Angeles": "US",
    "America/Phoenix": "US",
    "America/Anchorage": "US",
    "Pacific/Honolulu": "US",
    "America/Toronto": "CA",
    "America/Vancouver": "CA",
    "America/Mexico_City": "MX",
    "America/Sao_Paulo": "BR",
    "America/Argentina/Buenos_Aires": "AR",
    "America/Bogota": "CO",
    "America/Lima": "PE",
    "America/Santiago": "CL",
    "Africa/Cairo": "EG",
    "Africa/Lagos": "NG",
    "Africa/Johannesburg": "ZA",
    "Africa/Nairobi": "KE",
    "Africa/Casablanca": "MA",
    "Australia/Sydney": "AU",
    "Australia/Melbourne": "AU",
    "Pacific/Auckland": "NZ",
}

_reader = None
_reader_failed = False


def _open_reader():
    global _reader, _reader_failed
    if _reader is not None or _reader_failed:
        return _reader
    if maxminddb is None:
        log.warning("maxminddb not installed; GeoIP lookups disabled")
        _reader_failed = True
        return None
    path = (settings.GEOIP_DB_PATH or "").strip()
    if not path or not Path(path).is_file():
        log.warning("GeoIP database missing at %s", path or "(unset)")
        _reader_failed = True
        return None
    try:
        _reader = maxminddb.open_database(path)
    except Exception as e:  # pragma: no cover
        log.warning("GeoIP database open failed: %s", e)
        _reader_failed = True
        _reader = None
    return _reader


def _country_from_headers(headers) -> str | None:
    raw = headers.get("CF-IPCountry") or headers.get("X-Country") or headers.get("cf-ipcountry")
    if not raw:
        return None
    code = raw.strip().upper()
    if code and code not in ("XX", "T1", "A1", "A2"):
        return code[:2]
    return None


def lookup_ip(ip: str | None) -> tuple[str | None, str | None]:
    """Return (country_iso, city) from the offline MMDB, or (None, None)."""
    if not ip:
        return None, None
    try:
        addr = ipaddress.ip_address(ip)
        if addr.is_private or addr.is_loopback or addr.is_reserved or addr.is_multicast or addr.is_link_local:
            return None, None
    except ValueError:
        return None, None
    reader = _open_reader()
    if reader is None:
        return None, None
    try:
        rec = reader.get(ip)
    except Exception:
        return None, None
    if not rec or not isinstance(rec, dict):
        return None, None
    country = None
    for key in ("country", "registered_country", "represented_country"):
        block = rec.get(key) or {}
        if isinstance(block, dict) and block.get("iso_code"):
            country = str(block["iso_code"]).strip().upper()[:2]
            break
    city = None
    city_block = rec.get("city") or {}
    names = city_block.get("names") if isinstance(city_block, dict) else None
    if isinstance(names, dict) and names:
        city = names.get("en") or next(iter(names.values()), None)
        if city:
            city = str(city).strip()[:100] or None
    return country or None, city


def geo_from_request(
    headers,
    ip: str | None = None,
    timezone: str | None = None,
) -> tuple[str | None, str | None]:
    """Resolve (country, city). Prefer IP MMDB, then CF header, then timezone."""
    country, city = lookup_ip(ip)
    if not country:
        country = _country_from_headers(headers)
    if not country and timezone:
        country = TZ_COUNTRY.get(timezone.strip())
    return country, city


def country_from_request(headers, timezone: str | None = None) -> str | None:
    """Back-compat: country only (no IP). Prefer geo_from_request when IP is known."""
    country, _ = geo_from_request(headers, ip=None, timezone=timezone)
    return country
