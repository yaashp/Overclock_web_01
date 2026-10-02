import os, tempfile
os.environ["NEXORA_DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/t.db"
import pytest
from fastapi.testclient import TestClient

import seed  # noqa: F401  (creates schema + demo data in the temp DB)
from app.main import app

c = TestClient(app)


def login(email, pw):
    r = c.post("/api/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["access_token"]}


ADMIN = lambda: login("admin@nexora.demo", "Admin@123")
NGO_FORM = dict(name="Test Org", email="new@ngo.org", password="Strong@123", confirm_password="Strong@123", ngo_name="New NGO",
                description="Helping people in need.", location="Goa", cause="Health", ngo_darpan_id="GA/2026/9999")


def test_register_ngo_is_pending_and_blocked():
    r = c.post("/api/auth/register/ngo", data={**NGO_FORM, "role": "ADMIN", "account_status": "ACTIVE", "verified": "true"})
    assert r.status_code == 201, r.text
    assert r.json()["user"]["role"] == "NGO" and r.json()["user"]["account_status"] == "PENDING"
    h = {"Authorization": "Bearer " + r.json()["access_token"]}
    assert c.get("/api/ngo/me", headers=h).json()["can_manage"] is False
    assert c.get("/api/ngo/campaigns", headers=h).status_code == 403
    assert c.get("/api/admin/organizers", headers=h).status_code == 403


def test_user_register_rejects_role_injection():
    body = dict(name="Bob Test", email="bob@x.org", password="Strong@123", confirm_password="Strong@123")
    assert c.post("/api/auth/register/user", json={**body, "role": "ADMIN"}).status_code == 422
    r = c.post("/api/auth/register/user", json=body)
    assert r.status_code == 201 and r.json()["user"]["role"] == "USER"
    assert c.post("/api/auth/register/user", json=body).status_code == 409
    h = {"Authorization": "Bearer " + r.json()["access_token"]}
    assert c.get("/api/admin/stats", headers=h).status_code == 403


def test_full_workflow_and_history():
    a = ADMIN()
    pend = {o["email"]: o for o in c.get("/api/admin/organizers/pending", headers=a).json()}["priya@example.com"]
    uid = pend["user_id"]
    assert c.post(f"/api/admin/organizers/{uid}/reject", json={}, headers=a).status_code == 422  # reason required
    assert c.post(f"/api/admin/organizers/{uid}/suspend", json={"reason": "not allowed yet"}, headers=a).status_code == 409
    assert c.post(f"/api/admin/organizers/{uid}/approve", headers=a).status_code == 200
    p = login("priya@example.com", "Demo@123")
    r = c.post("/api/ngo/campaigns", json={"title": "Clean Beach", "description": "Weekend beach clean-up.", "goal_amount": 5000}, headers=p)
    assert r.status_code == 201
    assert c.post(f"/api/admin/organizers/{uid}/suspend", json={"reason": "Pending verification review"}, headers=a).status_code == 200
    r = c.get("/api/ngo/campaigns", headers=p)  # SAME token: blocked immediately
    assert r.status_code == 403 and r.json()["detail"]["code"] == "ORGANIZER_SUSPENDED"
    assert r.json()["detail"]["reason"] == "Pending verification review"
    assert c.post(f"/api/admin/organizers/{uid}/approve", headers=a).status_code == 409  # SUSPENDED -> ACTIVE only via reactivate
    assert c.post(f"/api/admin/organizers/{uid}/reactivate", headers=a).status_code == 200
    assert c.get("/api/ngo/campaigns", headers=p).status_code == 200
    hist = c.get(f"/api/admin/organizers/{uid}", headers=a).json()["history"]
    assert [(h["old_status"], h["new_status"]) for h in hist][::-1] == [(None, "PENDING"), ("PENDING", "ACTIVE"), ("ACTIVE", "SUSPENDED"), ("SUSPENDED", "ACTIVE")]
    assert all(h["changed_by"] in ("Admin", "NEXORA Admin", "System") for h in hist)


def test_rejected_cannot_be_reactivated_and_sees_reason():
    a = ADMIN()
    s = login("sneha@example.com", "Demo@123")
    me = c.get("/api/ngo/me", headers=s).json()
    assert me["user"]["account_status"] == "REJECTED" and "could not be verified" in me["user"]["status_reason"]
    uid = me["user"]["id"]
    assert c.post(f"/api/admin/organizers/{uid}/reactivate", headers=a).status_code == 409
    assert c.post(f"/api/admin/organizers/{uid}/approve", headers=a).status_code == 409


def test_verification_is_independent():
    a = ADMIN()
    ngos = {n["name"]: n for n in c.get("/api/admin/ngos", headers=a).json()}
    g = ngos["Green Mumbai Foundation"]
    assert c.post(f"/api/admin/ngos/{g['id']}/verify", headers=a).status_code == 200
    d = c.get(f"/api/admin/organizers/{g['user_id']}", headers=a).json()
    assert d["ngo"]["verification_status"] == "VERIFIED"
    assert c.post(f"/api/admin/ngos/{g['id']}/verify", headers=a).status_code == 409
    assert "Hope Shelter Network" in [n["name"] for n in c.get("/api/admin/ngos/verified", headers=a).json()]
    # suspended organizer's NGO is hidden publicly even though VERIFIED
    assert "Hope Shelter Network" not in [n["name"] for n in c.get("/api/ngos").json()]
    assert "Udaan Education Trust" in [n["name"] for n in c.get("/api/ngos").json()]


def test_stats_and_auth_errors():
    a = ADMIN()
    s = c.get("/api/admin/stats", headers=a).json()
    assert set(s) >= {"pending_organizers", "active_organizers", "suspended_organizers", "verified_ngos"}
    assert c.get("/api/admin/stats").status_code == 401
    assert c.get("/api/admin/stats", headers={"Authorization": "Bearer junk"}).status_code == 401
    assert c.post("/api/auth/login", json={"email": "admin@nexora.demo", "password": "bad"}).status_code == 401
    assert c.post("/api/ngo/../admin/x").status_code in (404, 405)
