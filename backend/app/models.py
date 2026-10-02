import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Role(str, enum.Enum):
    USER = "USER"
    NGO = "NGO"
    ADMIN = "ADMIN"


class AccountStatus(str, enum.Enum):  # organizer/account status
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class VerificationStatus(str, enum.Enum):  # public NGO verification: a SEPARATE concept
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


def _enum(e, n):
    return Enum(e, native_enum=False, length=n, validate_strings=True)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(_enum(Role, 10), default=Role.USER)
    account_status: Mapped[AccountStatus] = mapped_column(_enum(AccountStatus, 12), default=AccountStatus.ACTIVE)
    profile_image: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    ngo: Mapped[Optional["NGO"]] = relationship(back_populates="owner", uselist=False)


class NGO(Base):
    __tablename__ = "ngos"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(200))
    cause: Mapped[str] = mapped_column(String(120))
    website: Mapped[Optional[str]] = mapped_column(String(255))
    ngo_darpan_id: Mapped[str] = mapped_column(String(50), unique=True)
    registration_12a: Mapped[Optional[str]] = mapped_column(String(50))
    registration_80g: Mapped[Optional[str]] = mapped_column(String(50))
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(_enum(VerificationStatus, 10), default=VerificationStatus.PENDING)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)
    profile_image: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    owner: Mapped[User] = relationship(back_populates="ngo")


class OrganizerStatusHistory(Base):
    """Append-only audit trail of every organizer account-status change."""
    __tablename__ = "organizer_status_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    changed_by_admin_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))  # NULL = system (self-registration)
    old_status: Mapped[Optional[str]] = mapped_column(String(12))
    new_status: Mapped[str] = mapped_column(String(12))
    reason: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    admin: Mapped[Optional[User]] = relationship(foreign_keys=[changed_by_admin_id])


class Campaign(Base):
    """Minimal example of an NGO-managed resource, protected by the ACTIVE-organizer guard."""
    __tablename__ = "campaigns"
    id: Mapped[int] = mapped_column(primary_key=True)
    ngo_id: Mapped[int] = mapped_column(ForeignKey("ngos.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    goal_amount: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
