# Femantic – Real-Time True Traffic Analytics

Production: **https://analytics.globalcareerhub.org**

Stack: Next.js + FastAPI + PostgreSQL + `femantic.js` tracker. Do not rewrite during testing.

## Deploy

```bash
cd /var/www/html/femantic
git pull origin main
sudo bash scripts/deploy-femantic.sh
```

Set secrets only in `.env` on the VPS (`ADMIN_PASSWORD`, `JWT_SECRET`). Seed does not reset an existing admin password. Do not publish credentials in this README.

## Tracker

```html
<script defer data-site="YOUR_API_KEY"
  src="https://analytics.globalcareerhub.org/tracker/femantic.js"></script>
```

Alternate first-party-style path (same file):

```html
<script defer data-site="YOUR_API_KEY"
  src="https://analytics.globalcareerhub.org/j.js"></script>
```

Custom event: `Femantic.track("signup")`

Ingest is `POST /api/track/{api_key}` — CORS is open on that path so publisher sites can send beacons. Dashboard APIs stay cookie/JWT locked.

## Charts

Dashboard and Audience charts read **aggregated** `/api/track/series/{id}` + `/api/track/stats/{id}`, not raw `events` rows. Heartbeats are events only (duration), never pageviews.
