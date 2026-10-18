"use strict";
/* ============================================================
 * v22 · 后端适配层（FastAPI 模型网关）
 *   - API Key 只存服务端环境变量，前端零接触
 *   - 三级降级：后端真实 → 浏览器直连 Key → 本地 Mock
 *   - 后端不可达时全部功能自动回退，演示不中断
 * ============================================================ */
const FM_API_DEFAULT_BASE = "http://localhost:8000";
const fmApi = {
  base: "",
  token: "",
  health: null,
  healthAt: 0,
  ready: false,
  init() {
    let saved = "";
    try { saved = localStorage.getItem("fm_api_base") || ""; } catch (e) {}
    this.base = (window.FM_API_BASE || saved || FM_API_DEFAULT_BASE).replace(/\/+$/, "");
    this.token = sessionStorage.getItem("fm_token") || "";
  },
  backendReady() { return this.ready && !!this.health && this.health.ok; },
  backendModel() { return (this.health && this.health.model) || "后端模型"; },
  /* 公网静态托管（GitHub Pages / 国内镜像）没有后端是设计如此，不应报成故障：
   * 只有「https 公网 + 后端地址仍是默认 localhost」才算静态部署 */
  isStaticDeploy() {
    try {
      const loc = window.location || {};
      const host = loc.hostname || "";
      const publicHttps = loc.protocol === "https:" && !/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(host);
      return publicHttps && this.base === FM_API_DEFAULT_BASE;
    } catch (e) { return false; }
  },
  authHeaders() {
    const h = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = "Bearer " + this.token;
    return h;
  },
  async checkHealth(force) {
    const now = Date.now();
    if (!force && this.health && now - this.healthAt < 30000) return this.health;
    if (typeof fetch !== "function") { this.ready = false; return null; }
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(this.base + "/api/health", { signal: ctrl.signal });
      const j = await res.json();
      this.health = { ok: !!j.ok, llm_ready: !!j.llm_ready, model: j.model || null };
    } catch (e) {
      this.health = { ok: false, llm_ready: false, model: null };
    }
    this.healthAt = Date.now();
    this.ready = this.health.ok;
    return this.health;
  },
  setBase(url) {
    this.base = (url || "").trim().replace(/\/+$/, "") || FM_API_DEFAULT_BASE;
    try { localStorage.setItem("fm_api_base", this.base); } catch (e) {}
  },
  async chat(messages, onDelta, signal) {
    const res = await fetch(this.base + "/api/chat/stream", {
      method: "POST",
      signal,
      headers: this.authHeaders(),
      body: JSON.stringify({ messages }),
    });
    if (res.status === 503) throw new Error("后端未配置 LLM_API_KEY，请使用 Mock 模式或在面板填写 Key");
    if (!res.ok) throw new Error("后端 HTTP " + res.status);
    if (!res.body) throw new Error("后端响应无 body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (; ;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          if (json.error) throw new Error("后端模型调用失败：" + (json.detail || json.error));
          const delta = json.choices && json.choices[0] && json.choices[0].delta;
          const piece = delta && (delta.content || delta.reasoning_content || delta.text || "");
          if (piece) onDelta(piece);
        } catch (e) {
          if (e.message && e.message.indexOf("Unexpected") !== 0) throw e;
        }
      }
    }
  },
  async login(email, pass) {
    const res = await fetch(this.base + "/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) {
      let detail = "登录失败";
      try { detail = (await res.json()).detail || detail; } catch (e) {}
      throw new Error(detail);
    }
    const { token, user } = await res.json();
    this.token = token;
    sessionStorage.setItem("fm_token", token);
    return user;
  },
  async register(name, email, pass) {
    const res = await fetch(this.base + "/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pass }),
    });
    if (!res.ok) {
      let detail = "注册失败";
      try { detail = (await res.json()).detail || detail; } catch (e) {}
      throw new Error(detail);
    }
    const { token, user } = await res.json();
    this.token = token;
    sessionStorage.setItem("fm_token", token);
    return user;
  },
  async syncAndReport(sess, match) {
    // 1) 建会话（无 interviewId 时）
    if (!sess.interviewId) {
      const res = await fetch(this.base + "/api/interviews", {
        method: "POST", headers: this.authHeaders(),
        body: JSON.stringify({ mode: sess.mode || "general", job: "" }),
      });
      if (!res.ok) throw new Error("创建会话失败 HTTP " + res.status);
      sess.interviewId = (await res.json()).id;
    }
    // 2) 批量同步问答
    const sync = await fetch(this.base + "/api/interviews/" + sess.interviewId + "/sync", {
      method: "POST", headers: this.authHeaders(),
      body: JSON.stringify({ turns: sess.turns.map((t, i) => ({
        seq: i + 1, agent: t.agent, question: t.question,
        answer: t.answer, notes: t.notes || "",
      })) }),
    });
    if (!sync.ok) throw new Error("同步问答失败 HTTP " + sync.status);
    // 3) 服务端生成报告
    const rep = await fetch(this.base + "/api/interviews/" + sess.interviewId + "/report", {
      method: "POST", headers: this.authHeaders(),
      body: JSON.stringify({
        match_score: match ? match.matchScore : null,
        code_score: typeof sess.codeScore === "number" ? sess.codeScore : null,
        match_gaps: match && match.gaps ? match.gaps : [],
      }),
    });
    if (!rep.ok) throw new Error("报告生成失败 HTTP " + rep.status);
    return rep.json();
  },
};

function llmLabel() {
  if (fmApi.backendReady()) return `后端 ${fmApi.backendModel()} @ ${hostOf(fmApi.base)}`;
  if (llm) return `${llm.model} @ ${hostOf(llm.baseUrl)}`;
  return "Mock 模式";   // v22.1：llm 为空时不再抛 TypeError
}

function saveApiBase() {
  const input = $("llm-api-base");
  if (!input) return;
  fmApi.setBase(input.value);
  toast("后端地址已保存，正在检测连接…");
  fmApi.checkHealth(true).then(refreshBackendUi);
}
async function testApiBase() {
  const btn = $("llm-api-test");
  if (btn) btn.disabled = true;
  await fmApi.checkHealth(true);
  refreshBackendUi();
  if (btn) btn.disabled = false;
  const h = fmApi.health;
  if (h && h.ok) toast(h.llm_ready ? `✅ 后端已连接 · ${h.model}` : "✅ 后端已连接（未配置 Key，聊天走 Mock）");
  else if (fmApi.isStaticDeploy()) toast("ℹ️ 在线演示为纯前端版本，未部署后端（预期）：聊天走本地 Mock。需要真实模型请本地启动 backend（README 3.3）后在此填入地址");
  else toast("❌ 后端未连接（" + fmApi.base + "），将使用本地 Key 或 Mock 模式");
}
function refreshBackendUi() {
  const el = $("llm-backend-status");
  if (el) {
    const h = fmApi.health;
    if (h && h.ok) {
      el.textContent = h.llm_ready ? `已连接 · ${h.model}` : "已连接 · 未配置 Key";
      el.className = "badge " + (h.llm_ready ? "badge-green" : "badge-amber");
    } else if (fmApi.isStaticDeploy()) {
      el.textContent = "未部署（在线演示）";
      el.className = "badge badge-amber";
    } else {
      el.textContent = "未连接";
      el.className = "badge badge-amber";
    }
  }
  const input = $("llm-api-base");
  if (input && document.activeElement !== input && !input.value) input.value = fmApi.base;
  updateLlmStatus();
}


