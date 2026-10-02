"""Create demo data. Run from the backend/ folder:  python seed.py   (add --reset to wipe the DB first)"""
import sys

from app.database import Base, SessionLocal, engine
from app.models import AccountStatus as S, NGO, OrganizerStatusHistory as H, Role, User, VerificationStatus as V
from app.security import hash_password

if "--reset" in sys.argv:
    Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
db = SessionLocal()


def add_user(name, email, pw, role, status, phone=None):
    u = db.query(User).filter_by(email=email).first()
    if u:
        return u, False
    u = User(name=name, email=email, password_hash=hash_password(pw), role=role, account_status=status, phone=phone)
    db.add(u)
    db.flush()
    return u, True


admin, _ = add_user("NEXORA Admin", "admin@nexora.demo", "Admin@123", Role.ADMIN, S.ACTIVE)
add_user("Aarav Mehta", "user.demo@nexora.demo", "User@123", Role.USER, S.ACTIVE, "9000000001")

ORGS = [  # name, email, phone, ngo, loc, cause, darpan, 12A, 80G, account, verification, history[(old,new,reason)]
    ("Priya Mehta", "priya@example.com", "9000000002", "Green Mumbai Foundation", "Mumbai, Maharashtra", "Environment",
     "MH/2026/0100001", "AAATG1234A12A", "AAATG1234A80G", S.PENDING, V.PENDING, []),
    ("Rahul Shah", "rahul@example.com", "9000000003", "Udaan Education Trust", "Pune, Maharashtra", "Education",
     "MH/2025/0100002", "AAATU5678B12A", "AAATU5678B80G", S.ACTIVE, V.VERIFIED,
     [("PENDING", "ACTIVE", "NGO information reviewed and approved.")]),
    ("Amit Kumar", "amit@example.com", "9000000004", "Hope Shelter Network", "Delhi", "Shelter",
     "DL/2024/0100003", "AAATH9012C12A", "AAATH9012C80G", S.SUSPENDED, V.VERIFIED,
     [("PENDING", "ACTIVE", "NGO information reviewed and approved."),
      ("ACTIVE", "SUSPENDED", "Account temporarily suspended pending verification review.")]),
    ("Sneha Rao", "sneha@example.com", "9000000005", "Clean Water Trust", "Bengaluru, Karnataka", "Water",
     "KA/2025/0100004", None, None, S.REJECTED, V.REJECTED,
     [("PENDING", "REJECTED", "Submitted NGO registration information could not be verified.")]),
]
for name, email, phone, ngo, loc, cause, dar, a12, g80, st, vs, hist in ORGS:
    u, created = add_user(name, email, "Demo@123", Role.NGO, st, phone)
    if not created:
        continue
    db.add(NGO(user_id=u.id, name=ngo, description=f"{ngo} runs community programmes in {loc}.", location=loc, cause=cause,
               website=f"https://www.{ngo.split()[0].lower()}.example", ngo_darpan_id=dar, registration_12a=a12,
               registration_80g=g80, verified=vs == V.VERIFIED, verification_status=vs,
               rejection_reason="Documents did not match registry." if vs == V.REJECTED else None))
    db.add(H(organizer_id=u.id, changed_by_admin_id=None, old_status=None, new_status="PENDING", reason="Organizer registered; awaiting Admin review."))
    for old, new, reason in hist:
        db.add(H(organizer_id=u.id, changed_by_admin_id=admin.id, old_status=old, new_status=new, reason=reason))
db.commit()
print("Seeded. Admin: admin@nexora.demo / Admin@123 | User: user.demo@nexora.demo / User@123 | Organizers (Demo@123): priya@, rahul@, amit@, sneha@example.com")
