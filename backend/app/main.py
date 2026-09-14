from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.database import engine, Base, ensure_columns
from app.routers import auth, users, websites, tracking, admin, memberships, invites, network
from app.websocket import realtime
from app.seed import seed_admin
from app.config import settings

Base.metadata.create_all(bind=engine)
ensure_columns()
seed_admin()

docs = "/docs" if settings.DEBUG else None
app = FastAPI(
    title="Femantic API",
    description="Real-time True Traffic Analytics",
    version="1.6.2",
    docs_url=docs,
    redoc_url=docs and "/redoc",
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

origins = [o.strip() for o in (settings.CORS_ORIGINS or "").split(",") if o.strip()]
allow_all = "*" in origins or not origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=not allow_all,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


class TrackCorsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        open_path = path.startswith("/api/track/") or path in ("/tracker/femantic.js", "/femantic.js", "/j.js")
        if open_path and request.method == "OPTIONS":
            return Response(
                status_code=204,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Max-Age": "86400",
                },
            )
        response = await call_next(request)
        if open_path:
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response


app.add_middleware(TrackCorsMiddleware)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(websites.router)
app.include_router(tracking.router)
app.include_router(network.router)
app.include_router(admin.router)
app.include_router(memberships.router)
app.include_router(invites.router)
app.include_router(realtime.router)

TRACKER_CANDIDATES = [
    Path(__file__).resolve().parent.parent / "static" / "femantic.js",
    Path(__file__).resolve().parents[2] / "tracker" / "femantic.js",
    Path("/app/static/femantic.js"),
    Path("/var/www/html/femantic/tracker/femantic.js"),
    Path("/var/www/html/femantic/backend/static/femantic.js"),
    Path("/var/www/femantic/tracker/femantic.js"),
]

FALLBACK_JS = "(function(){console.warn('[Femantic] tracker file missing on server');})();"


def _tracker_js() -> str:
    for p in TRACKER_CANDIDATES:
        try:
            if p.exists() and p.is_file():
                return p.read_text(encoding="utf-8")
        except Exception:
            continue
    return FALLBACK_JS


@app.get("/")
def root():
    return {"message": "Femantic API", "status": "running", "version": "1.6.2"}


@app.get("/health")
def health():
    return {"status": "healthy"}


def _js_response():
    return Response(
        content=_tracker_js(),
        media_type="application/javascript; charset=utf-8",
        headers={"Cache-Control": "public, max-age=60", "Access-Control-Allow-Origin": "*"},
    )


@app.get("/tracker/femantic.js")
def tracker_script():
    return _js_response()


@app.get("/femantic.js")
def tracker_root():
    return _js_response()


@app.get("/j.js")
def tracker_alias():
    return _js_response()
