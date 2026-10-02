from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import latest_reason, require_active_ngo, require_ngo_account
from ..models import AccountStatus, Campaign, NGO, User, VerificationStatus
from ..schemas import CampaignIn, NGOProfileUpdate, ngo_out, user_out
from ..deps import ORGANIZER_MESSAGES

router = APIRouter(prefix="/api/ngo", tags=["NGO Organizer"])


@router.get("/me")
def my_status(user: User = Depends(require_ngo_account), db: Session = Depends(get_db)):
    """Open to any organizer (even PENDING/REJECTED/SUSPENDED) so the UI can explain their status."""
    st = user.account_status
    return {"user": user_out(user, latest_reason(db, user.id) if st != AccountStatus.PENDING else None),
            "ngo": ngo_out(user.ngo), "can_manage": st == AccountStatus.ACTIVE,
            "message": ORGANIZER_MESSAGES.get(st, "Your NGO Organizer account is active.")}


@router.put("/profile")
def update_profile(body: NGOProfileUpdate, user: User = Depends(require_active_ngo), db: Session = Depends(get_db)):
    for k, v in body.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(user.ngo, k, v)
    db.commit()
    return ngo_out(user.ngo)


@router.get("/campaigns")
def my_campaigns(user: User = Depends(require_active_ngo), db: Session = Depends(get_db)):
    q = select(Campaign).where(Campaign.ngo_id == user.ngo.id).order_by(Campaign.id.desc())
    return [{"id": c.id, "title": c.title, "description": c.description, "goal_amount": c.goal_amount, "created_at": c.created_at} for c in db.scalars(q)]


@router.post("/campaigns", status_code=201)
def create_campaign(body: CampaignIn, user: User = Depends(require_active_ngo), db: Session = Depends(get_db)):
    c = Campaign(ngo_id=user.ngo.id, **body.model_dump())
    db.add(c)
    db.commit()
    return {"id": c.id, "title": c.title, "description": c.description, "goal_amount": c.goal_amount}
