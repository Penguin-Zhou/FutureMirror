from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

load_dotenv()

from .db import (Interview, Report, Turn, User, get_db, hash_password,  # noqa: E402
                 init_db, verify_password)
from .llm import LLM_MODEL, llm_ready, sse_response                    # noqa: E402
from .scoring import score_session                                     # noqa: E402

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
TOKEN_TTL = timedelta(hours=12)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="面镜 FutureMirror API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- 鉴权 ----------------
def make_token(user: User) -> str:
    return jwt.encode(
        {"sub": user.id, "exp": datetime.utcnow() + TOKEN_TTL}, SECRET_KEY, algorithm="HS256"
    )


def current_user(authorization: str = Header(default=""),
                 db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "缺少访问令牌")
    try:
        payload = jwt.decode(authorization[7:], SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "令牌无效或已过期") from None
    user = db.get(User, payload["sub"])
    if not user:
        raise HTTPException(401, "用户不存在")
    return user


def user_payload(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "is_vip": user.is_vip}


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    email: EmailStr
    password: str = Field(min_length=6, max_length=64)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@app.post("/api/auth/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == body.email)):
        raise HTTPException(400, "该邮箱已注册")
    user = User(email=body.email, name=body.name,
                password_hash=hash_password(body.password),
                is_vip=body.email == "demo@futuremirror.app")
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": make_token(user), "user": user_payload(user)}


@app.post("/api/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "邮箱或密码不正确")
    return {"token": make_token(user), "user": user_payload(user)}


@app.get("/api/me")
def me(user: User = Depends(current_user)):
    return user_payload(user)


# ---------------- 健康检查（前端用它显示运行模式） ----------------
@app.get("/api/health")
def health():
    return {"ok": True, "llm_ready": llm_ready(), "model": LLM_MODEL if llm_ready() else None}


# ---------------- 大模型流式对话（Key 只在这一层） ----------------
class ChatIn(BaseModel):
    messages: list[dict]
    mode: str = "general"
    temperature: float | None = None


@app.post("/api/chat/stream")
def chat_stream(body: ChatIn, user: User = Depends(current_user)):
    if not llm_ready():
        raise HTTPException(503, "服务端未配置 LLM_API_KEY，请使用 Mock 模式")
    if not body.messages or len(body.messages) > 40:
        raise HTTPException(400, "messages 数量异常")
    temp = body.temperature if body.temperature is not None else 0.6
    return sse_response(body.messages, temperature=max(0.0, min(1.2, temp)))


# ---------------- 面试会话持久化 ----------------
class CreateInterviewIn(BaseModel):
    mode: str = "general"
    job: str = ""


@app.post("/api/interviews")
def create_interview(body: CreateInterviewIn, user: User = Depends(current_user),
                     db: Session = Depends(get_db)):
    iv = Interview(user_id=user.id, mode=body.mode, job=body.job)
    db.add(iv)
    db.commit()
    db.refresh(iv)
    return {"id": iv.id}


class TurnIn(BaseModel):
    seq: int
    agent: str
    question: str
    answer: str
    notes: str = ""


class SyncTurnsIn(BaseModel):
    turns: list[TurnIn]


@app.post("/api/interviews/{interview_id}/sync")
def sync_turns(interview_id: str, body: SyncTurnsIn,
               user: User = Depends(current_user), db: Session = Depends(get_db)):
    """批量同步一轮会话的问答。

    v22.1：由「先删后插」改为按 seq 幂等去重——重复调用不产生脏数据，
    也不会因前端重试/刷新把已入库的轮次删掉重建。
    """
    iv = db.get(Interview, interview_id)
    if not iv or iv.user_id != user.id:
        raise HTTPException(404, "会话不存在")
    if len(body.turns) > 30:
        raise HTTPException(400, "单次同步轮次过多")
    existing = {t.seq for t in db.scalars(
        select(Turn).where(Turn.interview_id == interview_id)).all()}
    added = 0
    for item in body.turns:
        if item.seq in existing:
            continue
        db.add(Turn(interview_id=interview_id, **item.model_dump()))
        added += 1
    db.commit()
    return {"ok": True, "added": added, "total": len(body.turns)}


class ReportIn(BaseModel):
    match_score: int | None = None
    code_score: float | None = None
    match_gaps: list[str] = []


@app.post("/api/interviews/{interview_id}/report")
def gen_report(interview_id: str, body: ReportIn,
               user: User = Depends(current_user), db: Session = Depends(get_db)):
    iv = db.get(Interview, interview_id)
    if not iv or iv.user_id != user.id:
        raise HTTPException(404, "会话不存在")
    turns = db.scalars(select(Turn).where(Turn.interview_id == interview_id)
                       .order_by(Turn.seq)).all()
    if not turns:
        raise HTTPException(400, "该会话还没有问答记录")
    result = score_session([{"agent": t.agent, "question": t.question,
                             "answer": t.answer, "notes": t.notes,
                             "mode": iv.mode} for t in turns],
                           body.match_score, body.code_score, body.match_gaps)
    old = db.scalar(select(Report).where(Report.interview_id == interview_id))
    if old:
        db.delete(old)
        db.commit()
    db.add(Report(interview_id=interview_id, total=result["total"],
                  dims_json=json.dumps(result["dims"], ensure_ascii=False),
                  plan_json=json.dumps({"plan": result["plan"],
                                        "evidence": result["evidence"]}, ensure_ascii=False)))
    iv.status = "finished"
    db.commit()
    return result


@app.get("/api/interviews")
def list_interviews(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Interview).where(Interview.user_id == user.id)
                      .order_by(Interview.created_at.desc()).limit(20)).all()
    out = []
    for r in rows:
        rep = db.scalar(select(Report).where(Report.interview_id == r.id))
        out.append({"id": r.id, "mode": r.mode, "job": r.job, "status": r.status,
                    "created_at": r.created_at.isoformat(),
                    "total": rep.total if rep else None})
    return out
