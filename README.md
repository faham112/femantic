# Femantic – Real-Time True Traffic Analytics

Production: **https://analytics.globalcareerhub.org**

## Included (priority list)

1. VPS: `git pull origin main && sudo bash scripts/deploy-femantic.sh`
2. DualLineChart → `/api/track/series/{id}`
3. Geo: Cloudflare `CF-IPCountry` + timezone fallback map (MaxMind optional later)
4. Heartbeat stored as Event — not a pageview; used for session duration
5. Login UI has no admin password; set `ADMIN_PASSWORD` + `JWT_SECRET` in `.env`
6. Sidebar pages: Content, Acquisition (UTM), Events
7. Track rate-limit, CORS = production domain only, seed does not reset admin password
8. Plan Management = coming soon (no Stripe checkout)

## Admin (first seed only)

- Email: `admin@femantic.com`
- Password: value of `ADMIN_PASSWORD` (default `Admin@12345` until you change `.env`)

## Tracker

```html
<script defer data-site="YOUR_API_KEY"
  src="https://analytics.globalcareerhub.org/tracker/femantic.js"></script>
```

Custom event: `Femantic.track("signup")`
