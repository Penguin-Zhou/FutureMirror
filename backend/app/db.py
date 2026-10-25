from __future__ import annotations

import hashlib
import hmac
import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import (Boolean, DateTime, ForeignKey, Integer, String, Text,
                        create_engine, select)
from sqlalchemy.orm import (DeclarativeBase, Mapped, Session, mapped_column,
                            sessionmaker)

def utcnow() -> datetime:
    """naive UTC 时间戳。

    datetime.utcnow() 在 Python 3.12+ 已弃用（3.13 起有 DeprecationWarning），
    这里改用带时区的 now() 再去掉 tzinfo：列里存的仍是 naive UTC，语义不变。
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


DB_URL = os.getenv("DATABASE_URL", "sqlite:///./futuremirror.db")
engine = create_engine(
    DB_URL,
    connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(32), primary_key=True,
                                    default=lambda: "u_" + uuid.uuid4().hex[:12])
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(40))
    password_hash: Mapped[str] = mapped_column(String(200))
    is_vip: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Interview(Base):
    __tablename__ = "interviews"
    id: Mapped[str] = mapped_column(String(32), primary_key=True,
                                    default=lambda: "iv_" + uuid.uuid4().hex[:10])
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    mode: Mapped[str] = mapped_column(String(20), default="general")
    job: Mapped[str] = mapped_column(String(80), default="")
    status: Mapped[str] = mapped_column(String(20), default="running")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Turn(Base):
    __tablename__ = "turns"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    interview_id: Mapped[str] = mapped_column(ForeignKey("interviews.id"), index=True)
    seq: Mapped[int] = mapped_column(Integer)
    agent: Mapped[str] = mapped_column(String(40))
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    notes: Mapped[str] = mapped_column(Text, default="")


class Report(Base):
    __tablename__ = "reports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    interview_id: Mapped[str] = mapped_column(ForeignKey("interviews.id"),
                                              unique=True, index=True)
    total: Mapped[int] = mapped_column(Integer)
    dims_json: Mapped[str] = mapped_column(Text)
    plan_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class InterviewStatusEvent(Base):
    """面试状态采样事件：摄像头开启后前端按节拍上报的在场/专注检测结果。

    v33：前端用 face-api.js 本地识别「人脸是否在场 / 是否专注」，仅把结构化结果
    （不传原始视频帧）发给后端；后端作为状态权威方做持久化、聚合与下发，
    因此「后台检测面试状态」由后端状态服务实现，原始像素不出浏览器。
    """

    __tablename__ = "interview_status_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    interview_id: Mapped[str] = mapped_column(ForeignKey("interviews.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    face_present: Mapped[bool | None] = mapped_column(Boolean, default=None)
    attentive: Mapped[bool | None] = mapped_column(Boolean, default=None)
    label: Mapped[str] = mapped_column(String(40), default="")
    turn: Mapped[int] = mapped_column(Integer, default=0)
    detector: Mapped[str] = mapped_column(String(20), default="faceapi")


def init_db() -> None:
    Base.metadata.create_all(engine)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- 密码：标准库 scrypt，避免引入 bcrypt 编译依赖 ----------
def hash_password(pw: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.scrypt(pw.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${dk.hex()}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        _, salt_hex, hash_hex = stored.split("$")
    except ValueError:
        return False
    dk = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt_hex),
                        n=16384, r=8, p=1, dklen=32)
    return hmac.compare_digest(dk.hex(), hash_hex)
