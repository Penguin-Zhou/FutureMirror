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
    /* sessionStorage 在隐私模式 / 沙箱 iframe 下可能直接抛异常，
     * 与上面的 localStorage 一样必须包起来，否则整个 init() 会中断。 */
    try { this.token = sessionStorage.getItem("fm_token") || ""; } catch (e) { this.token = ""; }
  },
  backendReady() { return this.ready && !!this.health && this.health.ok; },
  backendModel() { return (this.health && this.health.model) || "后端模型"; },
  /* v67：小助手要的是「后端 + 真模型」两个条件都成立。
   * 后端在线但没配 Key 时，/api/assistant/chat 会 503，
   * 与其先发一次再报错，不如提前判定走本地检索。 */
  assistantReady() { return this.backendReady() && !!this.health.llm_ready; },
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
    if (this.token) {
      /* 公网托管平台的边缘网关会用自己的 JWT 覆盖 Authorization 头，
       * 因此主通道改用自定义头 X-Auth-Token（网关原样透传）；
       * 同时保留 Authorization 供本地开发（无网关）使用。 */
      h["X-Auth-Token"] = this.token;
      h["Authorization"] = "Bearer " + this.token;
    }
    return h;
  },
  async checkHealth(force) {
    const now = Date.now();
    if (!force && this.health && now - this.healthAt < 30000) return this.health;
    if (typeof fetch !== "function") { this.ready = false; return null; }
    const ctrl = new AbortController();
    /* 超时定时器必须在请求结束后清掉，否则每次健康检测都会留下一个 8 秒的空转定时器 */
    const kill = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(this.base + "/api/health", { signal: ctrl.signal });
      const j = await res.json();
      /* asr_ready 决定语音走服务端转写还是浏览器接口：浏览器接口在境内连不上厂商云端，
       * 所以后端具备转写能力时要优先用后端。 */
      this.health = {
        ok: !!j.ok,
        llm_ready: !!j.llm_ready,
        model: j.model || null,
        asr_ready: !!j.asr_ready,
        asr_model: j.asr_model || null,
        /* v67：服务端知识库条数。面板上不显示，但现场核验时能一眼看出
         * 检索是不是真的在后端跑（0 就说明 kb_data.json 没随包发布）。 */
        kb_count: j.kb_count || 0,
      };
    } catch (e) {
      this.health = { ok: false, llm_ready: false, model: null, asr_ready: false, asr_model: null, kb_count: 0 };
    } finally {
      clearTimeout(kill);
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
  /* v67：小助手专用通道。
   * 检索、参考资料编号、限流都在服务端完成，前端只做两件事：
   * 把增量文字贴上屏幕、把服务端给的引用来源列出来。
   * 与通用 chat() 的差别是流首多一帧 meta（模型名 / 引用 / 剩余额度），
   * 以及 429 要能区分出「额度」而不是笼统的「调用失败」。 */
  async assistantChat(question, history, onDelta, onMeta, signal) {
    const res = await fetch(this.base + "/api/assistant/chat", {
      method: "POST",
      signal,
      headers: this.authHeaders(),
      body: JSON.stringify({ question, history: history || [], k: 3 }),
    });
    if (res.status === 429) {
      const wait = (res.headers && res.headers.get("Retry-After")) || "";
      const err = new Error("额度已用完" + (wait ? `（${wait} 秒后可再试）` : ""));
      err.code = "quota";
      err.retryAfter = wait;
      throw err;
    }
    if (res.status === 503) {
      const err = new Error("后端未配置 LLM_API_KEY");
      err.code = "no_key";
      throw err;
    }
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
        let json;
        try { json = JSON.parse(payload); } catch (e) { continue; }
        if (json.meta) { if (onMeta) onMeta(json.meta); continue; }
        if (json.error) throw new Error("后端模型调用失败：" + (json.detail || json.error));
        const delta = json.choices && json.choices[0] && json.choices[0].delta;
        const piece = delta && (delta.content || delta.reasoning_content || delta.text || "");
        if (piece) onDelta(piece);
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
  /* llm 是另一个模块声明的全局变量：未加载时直接引用会抛 ReferenceError，
   * 用 typeof 先探活，保证降级文案一定能输出。 */
  if (typeof llm !== "undefined" && llm) return `${llm.model} @ ${hostOf(llm.baseUrl)}`;
  return "Mock 模式";
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

/* v67：把后端探测从面试页的 LLM 面板里提出来。
 * 原来只有 initLlmPanel() 会调 fmApi.init()，于是小助手在别的页面里
 * base 仍是初始空串：镜像站上凑巧同源可用，Pages / 本地则必然失败——
 * 「能不能用后端」取决于用户先点过哪个页面，这不该是产品行为。
 * 这里只做地址与令牌的读取（纯 storage，不碰 DOM），健康探测交给 boot。 */
try { fmApi.init(); } catch (e) { /* 存储不可用时保持 base 为空，后续请求自然降级 */ }


