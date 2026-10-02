import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


def check_password(v: str) -> str:
    if len(v.encode()) > 72:
        raise ValueError("Password must be at most 72 bytes.")
    if len(v) < 8 or not re.search(r"[a-z]", v) or not re.search(r"[A-Z]", v) or not re.search(r"\d", v):
        raise ValueError("Password needs 8+ characters with upper-case, lower-case and a digit.")
    return v


class StrictModel(BaseModel):
    # extra="forbid": a client sending role/account_status/verified gets a 422, never a silent accept.
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class UserRegister(StrictModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str
    confirm_password: str
    phone: Optional[str] = Field(default=None, max_length=20)

    @field_validator("password")
    @classmethod
    def _pw(cls, v):
        return check_password(v)

    @model_validator(mode="after")
    def _match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class NGORegister(UserRegister):
    ngo_name: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=10, max_length=4000)
    location: str = Field(min_length=2, max_length=200)
    cause: str = Field(min_length=2, max_length=120)
    website: Optional[str] = Field(default=None, max_length=255)
    ngo_darpan_id: str = Field(min_length=3, max_length=50)
    registration_12a: Optional[str] = Field(default=None, max_length=50)
    registration_80g: Optional[str] = Field(default=None, max_length=50)


class LoginIn(StrictModel):
    email: str
    password: str


class ReasonIn(StrictModel):
    reason: str = Field(min_length=5, max_length=1000)


class OptionalReasonIn(StrictModel):
    reason: Optional[str] = Field(default=None, max_length=1000)


class NGOProfileUpdate(StrictModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, min_length=10, max_length=4000)
    location: Optional[str] = Field(default=None, min_length=2, max_length=200)
    cause: Optional[str] = Field(default=None, min_length=2, max_length=120)
    website: Optional[str] = Field(default=None, max_length=255)
    ngo_darpan_id: Optional[str] = Field(default=None, min_length=3, max_length=50)
    registration_12a: Optional[str] = Field(default=None, max_length=50)
    registration_80g: Optional[str] = Field(default=None, max_length=50)


class CampaignIn(StrictModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=4000)
    goal_amount: float = Field(ge=0)


def user_out(u, reason=None):
    return {
        "id": u.id, "name": u.name, "email": u.email, "role": u.role.value,
        "account_status": u.account_status.value, "phone": u.phone,
        "profile_image": u.profile_image, "created_at": u.created_at, "status_reason": reason,
    }


def ngo_out(n, private=True):
    d = {
        "id": n.id, "name": n.name, "description": n.description, "location": n.location, "cause": n.cause,
        "website": n.website, "profile_image": n.profile_image, "verified": n.verified,
        "verification_status": n.verification_status.value,
    }
    if private:
        d.update(ngo_darpan_id=n.ngo_darpan_id, registration_12a=n.registration_12a,
                 registration_80g=n.registration_80g, rejection_reason=n.rejection_reason,
                 created_at=n.created_at, user_id=n.user_id)
    return d
