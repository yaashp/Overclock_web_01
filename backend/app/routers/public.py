from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AccountStatus, NGO, User, VerificationStatus
from ..schemas import ngo_out

router = APIRouter(prefix="/api/ngos", tags=["Public NGOs"])


def _public():
    # Publicly visible = verified NGO AND organizer account currently ACTIVE.
    return select(NGO).join(User, User.id == NGO.user_id).where(
        NGO.verification_status == VerificationStatus.VERIFIED, User.account_status == AccountStatus.ACTIVE)


@router.get("")
def list_public(db: Session = Depends(get_db)):
    return [ngo_out(n, private=False) for n in db.scalars(_public())]


@router.get("/{ngo_id}")
def one_public(ngo_id: int, db: Session = Depends(get_db)):
    n = db.scalar(_public().where(NGO.id == ngo_id))
    if not n:
        raise HTTPException(404, "NGO not found.")
    return ngo_out(n, private=False)
