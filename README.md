# NEXORA: backend + connected frontend

```
NEXORA/
├── backend/
│   ├── requirements.txt
│   ├── seed.py                      demo data (admin, user, 4 organizers)
│   ├── NEXORA.postman_collection.json
│   ├── tests/test_flow.py           pytest: workflow, authorization, audit trail
│   └── app/
│       ├── main.py                  FastAPI app, CORS, serves ../frontend at /
│       ├── config.py  database.py   settings, SQLite engine/session
│       ├── models.py                users, ngos, organizer_status_history, campaigns
│       ├── schemas.py               Pydantic models (extra fields are rejected)
│       ├── security.py              bcrypt + JWT
│       ├── deps.py                  get_current_user / require_admin / require_active_ngo
│       └── routers/ auth.py admin.py ngo.py public.py
└── frontend/                        your site + api.js, register.html, register.js
                                     (auth.js, login.html, portal.js, shell.js edited)
```

## Run
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                    # add --reset to wipe and re-seed
uvicorn app.main:app --reload
```
Open http://localhost:8000 (site) or http://localhost:8000/docs (Swagger). Tests: `python -m pytest tests`.
Set `NEXORA_SECRET_KEY` to a long random value before any real deployment.

## Demo logins (created by seed.py)
| Account | Email | Password | State |
|---|---|---|---|
| Admin | admin@nexora.demo | Admin@123 | ACTIVE |
| User | user.demo@nexora.demo | User@123 | ACTIVE |
| Organizer | priya@example.com | Demo@123 | PENDING / verification PENDING |
| Organizer | rahul@example.com | Demo@123 | ACTIVE / VERIFIED |
| Organizer | amit@example.com | Demo@123 | SUSPENDED / VERIFIED |
| Organizer | sneha@example.com | Demo@123 | REJECTED / REJECTED |

## Postman
Import `backend/NEXORA.postman_collection.json` and run the folders in order (tokens are saved automatically).
