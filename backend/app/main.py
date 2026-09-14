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
app = FastAPI(title="Femantic API", version="1.6.3", docs_url=docs, redoc_url=docs and "/redoc", openapi_url="/openapi.json" if settings.DEBUG else None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TrackCorsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        open_path = path.startswith("/api/track") or path.startswith("/tracker/") or path in ("/femantic.js", "/j.js")
        if request.method == "POST" and path.startswith("/api/track"):
            headers = []
            seen = False
            for k, v in request.scope.get("headers", []):
                if k == b"content-type":
                    headers.append((k, b"application/json"))
                    seen = True
                else:
                    headers.append((k, v))
            if not seen:
                headers.append((b"content-type", b"application/json"))
            request.scope["headers"] = headers
        origin = request.headers.get("origin") or "*"
        ac = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
            "Vary": "Origin",
        }
        if open_path and request.method == "OPTIONS":
            return Response(status_code=204, headers=ac)
        response = await call_next(request)
        if open_path:
            if "access-control-allow-credentials" in response.headers:
                del response.headers["access-control-allow-credentials"]
            for k, v in ac.items():
                response.headers[k] = v
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

@app.get("/")
def root():
    return {"message": "Femantic API", "status": "running", "version": "1.6.3"}

@app.get("/health")
def health():
    return {"status": "healthy"}
