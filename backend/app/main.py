from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import FRONTEND_DIR, UPLOAD_DIR
from .database import Base, engine
from .routers import admin, auth, ngo, public

Base.metadata.create_all(engine)
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="NEXORA API", version="1.0.0")

# Bearer tokens (no cookies) => no credentialed CORS. Tighten allow_origins for production.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(ngo.router)
app.include_router(public.router)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok"}


# Serve the existing NEXORA frontend from the same origin: http://localhost:8000/
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
