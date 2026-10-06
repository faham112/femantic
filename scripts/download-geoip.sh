#!/usr/bin/env bash
# Download free DB-IP City Lite (no account). Safe to re-run; skips if file is fresh.
set -Eeuo pipefail

DEST="${1:-${GEOIP_DB_PATH:-/var/lib/femantic/dbip-city-lite.mmdb}}"
YM="${GEOIP_YM:-$(date +%Y-%m)}"
URL="https://download.db-ip.com/free/dbip-city-lite-${YM}.mmdb.gz"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$(dirname "$DEST")"

if [[ -f "$DEST" ]]; then
  # Refresh at most once a month (file newer than ~25 days).
  if find "$DEST" -mtime -25 | grep -q .; then
    echo "GeoIP DB already present and recent: $DEST"
    exit 0
  fi
fi

echo "Downloading $URL"
if ! curl -fsSL --retry 3 --retry-delay 2 -o "$TMP/db.mmdb.gz" "$URL"; then
  # Fall back one month if the new release is not up yet.
  PREV="$(date -d "${YM}-01 -1 month" +%Y-%m 2>/dev/null || date -v-1m -j -f "%Y-%m-01" "${YM}-01" +%Y-%m)"
  URL="https://download.db-ip.com/free/dbip-city-lite-${PREV}.mmdb.gz"
  echo "Retrying $URL"
  curl -fsSL --retry 3 --retry-delay 2 -o "$TMP/db.mmdb.gz" "$URL"
fi

gunzip -c "$TMP/db.mmdb.gz" > "$TMP/db.mmdb"
install -m 0644 "$TMP/db.mmdb" "$DEST"
echo "Installed GeoIP DB: $DEST ($(du -h "$DEST" | cut -f1))"
