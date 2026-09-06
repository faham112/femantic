from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.database import engine, Base
from app.routers import auth, users, websites, tracking, admin, memberships, invites
from app.websocket import realtime
from app.seed import seed_admin
from app.config import settings

Base.metadata.create_all(bind=engine)
seed_admin()

app = FastAPI(
    title="Femantic API",
    description="Real-time True Traffic Analytics – Multi-user Publytics platform with Invite Tokens",
    version="1.3.0",
)

origins = [o.strip() for o in (settings.CORS_ORIGINS or "*").split(",") if o.strip()]
allow_all = "*" in origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(websites.router)
app.include_router(tracking.router)
app.include_router(admin.router)
app.include_router(memberships.router)
app.include_router(invites.router)
app.include_router(realtime.router)

TRACKER_CANDIDATES = [
    Path(__file__).resolve().parent.parent / "static" / "femantic.js",
    Path(__file__).resolve().parents[2] / "tracker" / "femantic.js",
    Path("/app/static/femantic.js"),
    Path("/var/www/femantic/tracker/femantic.js"),
]


def _tracker_path() -> Path | None:
    for p in TRACKER_CANDIDATES:
        if p.exists():
            return p
    return None


@app.get("/")
def root():
    return {"message": "Welcome to Femantic API", "docs": "/docs", "status": "running", "version": "1.3.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/tracker/femantic.js")
@app.get("/femantic.js")
def tracker_script():
    path = _tracker_path()
    if not path:
        return {"error": "tracker not found"}
    return FileResponse(path, media_type="application/javascript", headers={"Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*"})
