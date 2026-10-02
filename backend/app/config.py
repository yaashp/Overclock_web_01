import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("NEXORA_SECRET_KEY", "dev-only-secret-change-me-in-production-0123456789")
ALGORITHM = "HS256"
TOKEN_HOURS = int(os.getenv("NEXORA_TOKEN_HOURS", "8"))
DATABASE_URL = os.getenv("NEXORA_DATABASE_URL", f"sqlite:///{BASE_DIR / 'nexora.db'}")
UPLOAD_DIR = BASE_DIR / "uploads"
FRONTEND_DIR = BASE_DIR.parent / "frontend"
MAX_IMAGE_BYTES = 2 * 1024 * 1024
