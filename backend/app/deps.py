"""Authorization dependencies.

The JWT only identifies WHO is calling. Role and account_status are always re-read
from the database, so an Admin's suspension takes effect on the very next request.
"""
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import AccountStatus, OrganizerStatusHistory, Role, User
from .security import decode_token

bearer = HTTPBearer(auto_error=False)

ORGANIZER_MESSAGES = {
    AccountStatus.PENDING: "Your NGO Organizer account is waiting for Admin approval.",
    AccountStatus.REJECTED: "Your NGO Organizer application has been rejected.",
    AccountStatus.SUSPENDED: "Your NGO Organizer account has been suspended.",
}


def latest_reason(db: Session, user_id: int):
    return db.scalar(
        select(OrganizerStatusHistory.reason)
        .where(OrganizerStatusHistory.organizer_id == user_id)
        .order_by(OrganizerStatusHistory.id.desc()).limit(1)
    )


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)) -> User:
    err = HTTPException(401, "Invalid or expired token.", headers={"WWW-Authenticate": "Bearer"})
    if not creds:
        raise err
    try:
        user_id = int(decode_token(creds.credentials)["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise err
    user = db.get(User, user_id)
    if not user:
        raise err
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.ADMIN:
        raise HTTPException(403, "Admin access required.")
    if user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(403, "Admin account is not active.")
    return user


def require_ngo_account(user: User = Depends(get_current_user)) -> User:
    """Any NGO organizer, whatever the status (so they can see their own status/reason)."""
    if user.role != Role.NGO:
        raise HTTPException(403, "NGO Organizer access required.")
    return user


def require_active_ngo(user: User = Depends(require_ngo_account), db: Session = Depends(get_db)) -> User:
    """NGO management gate: role == NGO AND account_status == ACTIVE."""
    if user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(403, {
            "code": f"ORGANIZER_{user.account_status.value}",
            "message": ORGANIZER_MESSAGES[user.account_status],
            "account_status": user.account_status.value,
            "reason": latest_reason(db, user.id) if user.account_status != AccountStatus.PENDING else None,
        })
    return user
