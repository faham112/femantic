"""Country from Cloudflare header or timezone fallback (no MaxMind required)."""

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


def country_from_request(headers, timezone: str | None = None) -> str | None:
    raw = headers.get("CF-IPCountry") or headers.get("X-Country") or headers.get("cf-ipcountry")
    if raw:
        code = raw.strip().upper()
        if code and code not in ("XX", "T1", "A1", "A2"):
            return code[:2]
    if timezone:
        return TZ_COUNTRY.get(timezone.strip())
    return None
