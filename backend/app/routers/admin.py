from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import require_admin
from ..models import AccountStatus as S, NGO, OrganizerStatusHistory as H, Role, User, VerificationStatus as V
from ..schemas import OptionalReasonIn, ReasonIn, ngo_out, user_out

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

# The ONLY permitted organizer account-status transitions.
TRANSITIONS = {
    "approve": (S.PENDING, S.ACTIVE),
    "reject": (S.PENDING, S.REJECTED),
    "suspend": (S.ACTIVE, S.SUSPENDED),
    "reactivate": (S.SUSPENDED, S.ACTIVE),
}
ACTIONS_FOR = {S.PENDING: ["approve", "reject"], S.ACTIVE: ["suspend"], S.SUSPENDED: ["reactivate"], S.REJECTED: []}


def get_organizer(db: Session, user_id: int) -> User:
    u = db.scalar(select(User).options(joinedload(User.ngo)).where(User.id == user_id, User.role == Role.NGO))
    if not u:
        raise HTTPException(404, "NGO Organizer not found.")
    return u


def row(u: User):
    n = u.ngo
    return {"user_id": u.id, "organizer": u.name, "email": u.email, "ngo_id": n.id if n else None,
            "ngo": n.name if n else None, "account_status": u.account_status.value,
            "ngo_verification": n.verification_status.value if n else None, "created_at": u.created_at}


def hist_out(h: H):
    return {"id": h.id, "organizer_id": h.organizer_id, "changed_by_admin_id": h.changed_by_admin_id,
            "changed_by": h.admin.name if h.admin else "System", "old_status": h.old_status,
            "new_status": h.new_status, "reason": h.reason, "created_at": h.created_at}


def history_for(db, user_id):
    q = select(H).options(joinedload(H.admin)).where(H.organizer_id == user_id).order_by(H.id.desc())
    return [hist_out(h) for h in db.scalars(q)]


def change_status(db: Session, org: User, action: str, admin: User, reason: Optional[str]):
    frm, to = TRANSITIONS[action]
    if org.account_status != frm:  # enforced here, regardless of what the UI shows
        raise HTTPException(409, f"Cannot {action}: account is {org.account_status.value}, must be {frm.value}.")
    old = org.account_status.value
    org.account_status = to
    db.add(H(organizer_id=org.id, changed_by_admin_id=admin.id, old_status=old, new_status=to.value, reason=reason))
    db.commit()  # status change + audit row commit together or not at all
    db.refresh(org)
    return {"message": f"Organizer {action}d: {old} -> {to.value}", "organizer": row(org)}


def listing(db, status: Optional[S] = None, search: Optional[str] = None):
    q = select(User).options(joinedload(User.ngo)).where(User.role == Role.NGO).order_by(User.created_at.desc())
    if status:
        q = q.where(User.account_status == status)
    if search:
        like = f"%{search.lower()}%"
        q = q.join(NGO, NGO.user_id == User.id).where(func.lower(User.name).like(like) | func.lower(User.email).like(like) | func.lower(NGO.name).like(like))
    return [row(u) for u in db.scalars(q).unique()]


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    org = dict(db.execute(select(User.account_status, func.count()).where(User.role == Role.NGO).group_by(User.account_status)).all())
    ngo = dict(db.execute(select(NGO.verification_status, func.count()).group_by(NGO.verification_status)).all())
    g = lambda d, k: d.get(k, 0)
    return {"pending_organizers": g(org, S.PENDING), "active_organizers": g(org, S.ACTIVE),
            "suspended_organizers": g(org, S.SUSPENDED), "rejected_organizers": g(org, S.REJECTED),
            "pending_ngo_verifications": g(ngo, V.PENDING), "verified_ngos": g(ngo, V.VERIFIED),
            "rejected_ngos": g(ngo, V.REJECTED)}


@router.get("/organizers")
def all_organizers(search: Optional[str] = None, db: Session = Depends(get_db)):
    return listing(db, None, search)


for _name, _st in [("pending", S.PENDING), ("active", S.ACTIVE), ("rejected", S.REJECTED), ("suspended", S.SUSPENDED)]:
    def _make(st):
        def endpoint(search: Optional[str] = None, db: Session = Depends(get_db)):
            return listing(db, st, search)
        return endpoint
    router.add_api_route(f"/organizers/{_name}", _make(_st), methods=["GET"], name=f"{_name}_organizers")


@router.get("/organizers/{user_id}")
def organizer_detail(user_id: int, db: Session = Depends(get_db)):
    u = get_organizer(db, user_id)
    return {"organizer": user_out(u), "ngo": ngo_out(u.ngo) if u.ngo else None,
            "available_actions": ACTIONS_FOR[u.account_status], "history": history_for(db, u.id)}


@router.post("/organizers/{user_id}/approve")
def approve(user_id: int, body: Optional[OptionalReasonIn] = Body(None), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return change_status(db, get_organizer(db, user_id), "approve", admin, (body.reason if body else None) or "NGO information reviewed and approved.")


@router.post("/organizers/{user_id}/reject")
def reject(user_id: int, body: ReasonIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return change_status(db, get_organizer(db, user_id), "reject", admin, body.reason)


@router.post("/organizers/{user_id}/suspend")
def suspend(user_id: int, body: ReasonIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return change_status(db, get_organizer(db, user_id), "suspend", admin, body.reason)


@router.post("/organizers/{user_id}/reactivate")
def reactivate(user_id: int, body: Optional[OptionalReasonIn] = Body(None), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return change_status(db, get_organizer(db, user_id), "reactivate", admin, (body.reason if body else None) or "Suspension lifted by Admin.")


@router.get("/history")
def all_history(limit: int = 50, db: Session = Depends(get_db)):
    q = select(H).options(joinedload(H.admin)).order_by(H.id.desc()).limit(min(max(limit, 1), 200))
    return [hist_out(h) for h in db.scalars(q)]


# ---------- NGO verification: independent of organizer account status ----------

@router.get("/ngos")
def list_ngos(verification: Optional[V] = None, db: Session = Depends(get_db)):
    q = select(NGO).options(joinedload(NGO.owner)).order_by(NGO.created_at.desc())
    if verification:
        q = q.where(NGO.verification_status == verification)
    return [{**ngo_out(n), "organizer": n.owner.name, "account_status": n.owner.account_status.value} for n in db.scalars(q)]


@router.get("/ngos/verified")
def verified_ngos(db: Session = Depends(get_db)):
    return list_ngos(V.VERIFIED, db)


def get_ngo(db, ngo_id):
    n = db.get(NGO, ngo_id)
    if not n:
        raise HTTPException(404, "NGO not found.")
    return n


@router.post("/ngos/{ngo_id}/verify")
def verify_ngo(ngo_id: int, db: Session = Depends(get_db)):
    n = get_ngo(db, ngo_id)
    if n.verification_status != V.PENDING:
        raise HTTPException(409, f"Cannot verify: NGO verification is {n.verification_status.value}, must be PENDING.")
    n.verification_status, n.verified, n.rejection_reason = V.VERIFIED, True, None
    db.commit()
    return {"message": "NGO verified.", "ngo": ngo_out(n)}


@router.post("/ngos/{ngo_id}/reject")
def reject_ngo(ngo_id: int, body: ReasonIn, db: Session = Depends(get_db)):
    n = get_ngo(db, ngo_id)
    if n.verification_status != V.PENDING:
        raise HTTPException(409, f"Cannot reject: NGO verification is {n.verification_status.value}, must be PENDING.")
    n.verification_status, n.verified, n.rejection_reason = V.REJECTED, False, body.reason
    db.commit()
    return {"message": "NGO verification rejected.", "ngo": ngo_out(n)}
