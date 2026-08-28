from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, users, websites, tracking, admin

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Femantic API",
    description="Real-time True Traffic Analytics – Multi-user Publytics platform",
    version="1.0.0"
)

# CORS – allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(websites.router)
app.include_router(tracking.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Femantic API",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
