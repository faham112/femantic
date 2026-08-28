# Femantic – Real-Time True Traffic Analytics Platform

**Femantic** is a modern multi-user Publytics-style analytics platform.  
Track real-time and true website traffic from one clean dashboard.  
Built for agencies, marketers, and website owners who need accurate visitor insights without the noise of bots and fake traffic.

> “A new journey – track your traffic from here.”

---

## Key Features

- **Real-time & True Traffic Tracking**  
  Live visitor counts, page views, sessions, referrers, devices, countries, and bounce rates – filtered for genuine human traffic.

- **Multi-User System**  
  - Regular users can add their websites, view analytics, and manage their own sites.  
  - **Only Admin** has full power to:
    - Create / edit / delete users
    - Manage API keys for websites
    - Control premium memberships
    - View system-wide statistics

- **Premium Membership (Femantic Pro)**  
  Users can purchase premium plans to unlock advanced features:
  - Unlimited websites
  - Longer data retention
  - Advanced filters & export
  - Priority support
  - Custom domains / white-label options (future)

- **Website API Integration**  
  Simple lightweight tracking script / API endpoint that any website can embed.  
  Works with any tech stack (HTML, React, WordPress, Shopify, etc.).

- **Fully Responsive Design**  
  Completely mobile and desktop responsive.  
  Beautiful, fast, and usable on phones, tablets, and large screens.

- **GitHub Ready + VPS Deployable**  
  Complete source code designed to be pushed to GitHub and deployed on any VPS (Ubuntu, Debian, etc.) with Docker or traditional setup.

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | Next.js 14+ (App Router) + TypeScript + Tailwind CSS |
| Backend        | Python (FastAPI)                    |
| Database       | PostgreSQL                          |
| Authentication | JWT + Role-based access (Admin / User) |
| Real-time      | WebSockets / Server-Sent Events     |
| Deployment     | Docker-ready + VPS friendly         |
| Styling        | Fully responsive (mobile-first)     |

---

## Project Structure

```
femantic/
├── frontend/                 # Next.js application
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
├── backend/                  # Python FastAPI
│   ├── app/
│   ├── api/
│   ├── models/
│   ├── services/
│   └── ...
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started (Development)

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker (optional but recommended)

### 1. Clone the repository
```bash
git clone https://github.com/faham112/femantic.git
cd femantic
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in values.

### 3. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. With Docker (recommended)
```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**First registered user becomes Admin automatically.**

---

## Deployment on VPS

1. Push code to GitHub (already done)
2. On your VPS:
   - Install Docker + Docker Compose
   - Clone the repo
   - Configure `.env`
   - `docker-compose up -d`
3. Point your domain to the VPS
4. Enable HTTPS (Let’s Encrypt / Nginx)

---

## License

Private / Commercial – All rights reserved.

**Femantic** – Track real-time. Track true. Track from here.

Built with ❤️ for accurate analytics.  
Mobile + Desktop responsive by design.
