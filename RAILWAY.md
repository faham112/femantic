# Femantic — Railway Deploy Guide

Repo is Railway-ready. **Postgres + Redis aap baad mein connect kar sakte ho.**

## 1. New Project

1. [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → `faham112/femantic`

Railway ek service se start karega — usko delete / ignore karke neeche 2 services banao (ya root directory set karo).

## 2. Services (minimum)

### A) Backend (FastAPI)

| Setting | Value |
|--------|--------|
| Root Directory | `backend` |
| Builder | Dockerfile |
| Healthcheck Path | `/health` |
| Public Networking | Enable (generate domain) |

**Variables (abhi placeholders — DB baad mein):**

```
DATABASE_URL=postgresql://user:pass@host:5432/railway
REDIS_URL=redis://default:pass@host:6379
JWT_SECRET=<32+ random chars>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7
ADMIN_EMAIL=admin@femantic.com
ADMIN_PASSWORD=<strong-password>
ADMIN_FULL_NAME=Femantic Admin
CORS_ORIGINS=*
APP_PUBLIC_URL=https://<your-backend>.up.railway.app
DEBUG=false
TRACK_RATE_LIMIT=60
BOT_SCORE_THRESHOLD=0.7
```

> Pehle deploy fail ho sakta hai agar DB unreachable ho — theek hai. DB connect karne ke baad Redeploy.

### B) Frontend (Next.js)

| Setting | Value |
|--------|--------|
| Root Directory | `frontend` |
| Builder | Dockerfile |
| Public Networking | Enable |

**Variables:**

```
NEXT_PUBLIC_API_URL=https://<your-backend>.up.railway.app
```

Dockerfile build ARG bhi `NEXT_PUBLIC_API_URL` use karta hai — Railway pe service variables set karo, phir **Rebuild**.

## 3. Databases (aap baad mein)

1. Project canvas → **+ New** → **Database** → **PostgreSQL**
2. **+ New** → **Database** → **Redis**
3. Backend service → **Variables** → **Add Reference**:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}` (ya Redis ka `REDIS_URL`)
4. Backend **Redeploy**

Schema auto-create hota hai (`Base.metadata.create_all` + seed admin).

Optional: `database/schema.sql` aur migrations manually run kar sakte ho Railway Postgres shell se.

## 4. Tracker embed (deploy ke baad)

Backend public URL use karo:

```html
<script defer data-site="YOUR_API_KEY"
  src="https://<your-backend>.up.railway.app/tracker/femantic.js"></script>
```

Ya:

```html
<script defer data-site="YOUR_API_KEY"
  src="https://<your-backend>.up.railway.app/j.js"></script>
```

Custom event: `Femantic.track("signup")`

## 5. Custom domain (optional)

- Frontend service → Settings → Custom Domain
- Backend service → Settings → Custom Domain
- `CORS_ORIGINS` aur `APP_PUBLIC_URL` / `NEXT_PUBLIC_API_URL` update karke redeploy

## 6. Checklist

- [ ] Backend `/health` → `{"status":"healthy"}`
- [ ] Frontend dashboard opens
- [ ] Login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Postgres + Redis referenced
- [ ] Tracker script 200 OK

## Notes

- VPS scripts (`scripts/deploy-femantic.sh`, systemd) Railway pe use nahi hote.
- `docker-compose.yml` local/dev ke liye rehta hai; Railway pe har service alag hai.
- Redis optional nahi agar rate-limit / sessions Redis pe depend karte hain — production mein Redis add karo.
