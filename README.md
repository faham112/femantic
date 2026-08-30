# Femantic – Real-Time True Traffic Analytics Platform

**Femantic** is a modern multi-user Publytics-style analytics platform.  
Track real-time and true website traffic from one clean dashboard.  
Built for agencies, marketers, and website owners who need accurate visitor insights without the noise of bots and fake traffic.

> “A new journey – track your traffic from here.”

---

## Key Features

- **Real-time & True Traffic Tracking**  
  Live visitor counts, page views, sessions, referrers, devices – with **Traffic Quality Score** (Human / Suspicious / Bot).

- **Multi-User System**  
  - Regular users manage their own websites.  
  - **Only Admin** can manage users, memberships, API keys and system-wide stats.

- **Premium Membership (Femantic Pro)**  
  Free: limited websites + short retention.  
  Pro: unlimited websites, longer retention, advanced reports, export.

- **Dedicated Tracker (`femantic.js`)**  
  Lightweight script that collects path, title, referrer, device, UTM, visitor ID, session ID.

- **Fully Responsive**  
  Mobile-first design – works perfectly on phones, tablets and desktops.

- **Production Ready**  
  Docker Compose (PostgreSQL + Redis + Backend + Frontend), VPS friendly.

---

## Architecture

```
Website → femantic.js → FastAPI /track → Bot Scoring → PostgreSQL
                                              ↓
                                         Redis (realtime)
                                              ↓
                                    Next.js Dashboard (Live)
```

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 + TypeScript + Tailwind  |
| Backend     | Python FastAPI                      |
| Database    | PostgreSQL                          |
| Cache/Queue | Redis                               |
| Tracker     | Lightweight JS (`tracker/femantic.js`) |
| Deploy      | Docker Compose + VPS                |

---

## Quick Start

```bash
git clone https://github.com/faham112/femantic.git
cd femantic
cp .env.example .env

docker-compose up --build
```

- Frontend: http://localhost:3000  
- Backend + Docs: http://localhost:8000/docs  

### Constant Admin credentials

Backend startup seeds / refreshes this Super Admin every time:

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@femantic.com` |
| Password | `Admin@12345`        |
| Name     | Femantic Admin       |

Override with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME` in `.env` or `docker-compose.yml`.

### Tracking Snippet

```html
<script
  src="https://your-domain.com/femantic.js"
  data-site="YOUR_API_OR_PUBLIC_KEY"
  defer>
</script>
```

---

## License

Private / Commercial – All rights reserved.

**Femantic** – Track real-time. Track true. Track from here.  
Fully mobile + desktop responsive by design.
