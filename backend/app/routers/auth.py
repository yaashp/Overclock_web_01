import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import MAX_IMAGE_BYTES, UPLOAD_DIR
from ..database import get_db
from ..deps import get_current_user, latest_reason
from ..models import AccountStatus, NGO, OrganizerStatusHistory, Role, User, VerificationStatus
from ..schemas import LoginIn, NGORegister, UserRegister, ngo_out, user_out
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Auth"])

MAGIC = {b"\xff\xd8\xff": ".jpg", b"\x89PNG\r\n\x1a\n": ".png", b"RIFF": ".webp"}


async def save_image(f: Optional[UploadFile]) -> Optional[str]:
    if not f or not f.filename:
        return None
    data = await f.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Profile image must be 2 MB or smaller.")
    ext = next((e for m, e in MAGIC.items() if data.startswith(m)), None)  # trust bytes, not the filename
    if not ext or (ext == ".webp" and data[8:12] != b"WEBP"):
        raise HTTPException(422, "Profile image must be a JPG, PNG or WEBP file.")
    UPLOAD_DIR.mkdir(exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return f"/uploads/{name}"


def token_response(user, db):
    token, exp = create_access_token(user.id, user.role.value)
    reason = latest_reason(db, user.id) if user.role == Role.NGO and user.account_status != AccountStatus.PENDING else None
    return {"access_token": token, "token_type": "bearer", "expires_at": exp, "user": user_out(user, reason)}


@router.post("/register/user", status_code=201)
def register_user(body: UserRegister, db: Session = Depends(get_db)):
    user = User(name=body.name, email=body.email.lower(), password_hash=hash_password(body.password),
                phone=body.phone, role=Role.USER, account_status=AccountStatus.ACTIVE)  # set by the server only
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "An account with this email already exists.")
    return token_response(user, db)


@router.post("/register/ngo", status_code=201)
async def register_ngo(
    name: str = Form(...), email: str = Form(...), password: str = Form(...), confirm_password: str = Form(...),
    phone: Optional[str] = Form(None), ngo_name: str = Form(...), description: str = Form(...),
    location: str = Form(...), cause: str = Form(...), website: Optional[str] = Form(None),
    ngo_darpan_id: str = Form(...), registration_12a: Optional[str] = Form(None),
    registration_80g: Optional[str] = Form(None), profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """multipart/form-data. role/account_status/verified fields, if sent, are ignored: the server decides."""
    try:
        b = NGORegister(name=name, email=email, password=password, confirm_password=confirm_password, phone=phone,
                        ngo_name=ngo_name, description=description, location=location, cause=cause,
                        website=website or None, ngo_darpan_id=ngo_darpan_id,
                        registration_12a=registration_12a or None, registration_80g=registration_80g or None)
    except ValidationError as ex:
        raise HTTPException(422, [{"loc": ["body", *map(str, x["loc"])], "msg": x["msg"].removeprefix("Value error, ")} for x in ex.errors()])
    image = await save_image(profile_image)
    user = User(name=b.name, email=b.email.lower(), password_hash=hash_password(b.password), phone=b.phone,
                role=Role.NGO, account_status=AccountStatus.PENDING)
    user.ngo = NGO(name=b.ngo_name, description=b.description, location=b.location, cause=b.cause, website=b.website,
                   ngo_darpan_id=b.ngo_darpan_id, registration_12a=b.registration_12a, registration_80g=b.registration_80g,
                   verified=False, verification_status=VerificationStatus.PENDING, profile_image=image)
    db.add(user)
    try:
        db.flush()
        db.add(OrganizerStatusHistory(organizer_id=user.id, changed_by_admin_id=None, old_status=None,
                                      new_status="PENDING", reason="Organizer registered; awaiting Admin review."))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "That email or NGO Darpan ID is already registered.")
    out = token_response(user, db)
    out["message"] = "Your NGO Organizer account is waiting for Admin approval."
    return out


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password.")
    if user.role == Role.ADMIN and user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(403, "Admin account is not active.")
    # NGO organizers may log in whatever their status so they can SEE it; management APIs stay blocked.
    return token_response(user, db)


@router.get("/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    out = {"user": user_out(user, latest_reason(db, user.id) if user.role == Role.NGO and user.account_status != AccountStatus.PENDING else None)}
    if user.ngo:
        out["ngo"] = ngo_out(user.ngo)
    return out
