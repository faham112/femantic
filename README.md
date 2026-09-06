# Femantic – Real-Time True Traffic Analytics

Publytics / GA4-style analytics: landing page, dashboard, realtime, site activation, invites, admin.

## Run locally

```bash
git clone https://github.com/faham112/femantic.git
cd femantic
cp .env.example .env
docker-compose up --build
```

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- Tracker: http://localhost:8000/tracker/femantic.js

### Admin login (seeded on backend start)

- Email: `admin@femantic.com`
- Password: `Admin@12345`

Startup also seeds a demo site `demo.femantic.dev` with sample pageviews so the dashboard is not empty.

### Install tracker on a site

```html
<script defer data-site="YOUR_API_OR_PUBLIC_KEY" data-api="http://localhost:8000" src="http://localhost:8000/tracker/femantic.js"></script>
```

## Stack

Next.js 14 + FastAPI + PostgreSQL + Redis + Docker.
