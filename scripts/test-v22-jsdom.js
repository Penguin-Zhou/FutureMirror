/* ============================================================
 * test-v22-jsdom.js —— 后端适配层（FastAPI 模型网关）测试
 *   覆盖：fmApi 健康检查 / SSE 聊天 / 账号 / 会话报告落库，
 *         streamChat 三级降级（后端 → 直连 Key → Mock），
 *         登录注册后端优先 + 离线兜底，renderReport 服务端评分，
 *         面板 UI 徽章，CSSOM。
 *   方法：window.fetch 打桩，按 URL 路由返回假响应 / SSE 流。
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log("  ✅", name); }
  else { fail++; console.log("  ❌", name); }
};

const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => { if (!/^Not implemented:/.test(e.message)) jsdomErrors.push(e.message); });

const dom = new JSDOM(html, {
  url: "https://example.com/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const w = dom.window;

/* jsdom 缺失 API 打桩 */
w.eval(`
  window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
  window.IntersectionObserver = window.IntersectionObserver || class { constructor(cb){ this.cb = cb; } observe(el){ this.cb([{ isIntersecting: true, target: el }], this); } unobserve(){} disconnect(){} };
`);

/* ---------- fetch 打桩（URL 路由） ---------- */
const fetchLog = [];
let route = {};   // 测试中按需覆盖
function fakeJson(status, obj) {
  return { status, ok: status >= 200 && status < 300, json: async () => obj };
}
function fakeSse(chunks) {
  let i = 0;
  const enc = new w.TextEncoder();
  return {
    status: 200, ok: true,
    body: {
      getReader: () => ({
        read: async () => (i < chunks.length
          ? { done: false, value: enc.encode(chunks[i++]) }
          : { done: true, value: undefined }),
      }),
    },
  };
}
w.fetch = async (url, opts) => {
  const u = String(url);
  const rec = { url: u, method: (opts && opts.method) || "GET", body: null };
  if (opts && opts.body) { try { rec.body = JSON.parse(opts.body); } catch (e) {} }
  fetchLog.push(rec);
  if (route.health !== undefined) return route.health;
  if (u.includes("/api/health")) return fakeJson(200, { ok: true, llm_ready: true, model: "glm-4-flash" });
  if (u.includes("/api/auth/login")) return fakeJson(200, { token: "tok_login", user: { id: "u_be", name: "后端用户", email: "t@t.com", is_vip: false } });
  if (u.includes("/api/auth/register")) return fakeJson(200, { token: "tok_reg", user: { id: "u_reg", name: "新用户", email: "n@t.com", is_vip: false } });
  if (u.includes("/api/interviews") && u.endsWith("/report")) return fakeJson(200, { total: 88, dims: [{ key: "depth", dimension: "内容深度", score: 88, comment: "服务端评分", pool: [] }], plan: [{ day: "Day 1", task: "服务端任务", tag: "综合" }], evidence: [{ agent: "技术面试官", quote: "引", note: "" }], weakest: { dimension: "内容深度", score: 88 } });
  if (u.includes("/api/interviews") && u.includes("/sync")) return fakeJson(200, { ok: true });
  if (u.includes("/api/interviews")) return fakeJson(200, { id: "iv_stub" });
  if (u.includes("/api/chat/stream")) return fakeSse(route.sse || ["data: {\"choices\":[{\"delta\":{\"content\":\"你好\"}}]}\n\n", "data: [DONE]\n\n"]);
  return fakeJson(200, { ok: true });
};

setTimeout(async () => {
  console.log("\n-- A. 结构与默认态 --");
  ok(jsdomErrors.length === 0, "页面脚本无未捕获错误" + (jsdomErrors.length ? "：" + jsdomErrors[0].slice(0, 160) : ""));
  ok(w.eval("typeof fmApi === 'object' && typeof fmApi.checkHealth === 'function' && typeof fmApi.chat === 'function'"), "fmApi 适配层存在");
  ok(w.eval("typeof streamChat === 'function' && typeof doLogin === 'function'"), "streamChat / doLogin 已改造");
  ok(!!w.document.getElementById("llm-api-base") && !!w.document.getElementById("llm-api-test"), "面板含后端地址输入与检测按钮");
  ok(!!w.document.getElementById("llm-backend-status"), "面板含后端状态徽章");
  ok(!!w.document.getElementById("llm-status"), "顶栏 LLM 模式徽章存在");
  w.eval("fmApi.init()");
  ok(w.eval("fmApi.base") === "http://localhost:8000", "默认后端地址 localhost:8000");
  ok(w.eval("fmApi.token") === "", "游客态无 token");

  console.log("\n-- B. 健康检查与状态徽章 --");
  await w.eval("fmApi.checkHealth(true)");
  ok(fetchLog.some(f => f.url.includes("/api/health")), "GET /api/health 已调用");
  ok(w.eval("fmApi.ready === true"), "健康响应置 ready");
  ok(w.eval("fmApi.backendReady() === true"), "backendReady 为真");
  ok(w.eval("fmApi.backendModel()") === "glm-4-flash", "后端模型名可读");
  w.eval("refreshBackendUi()");
  ok(w.document.getElementById("llm-backend-status").textContent === "已连接 · glm-4-flash", "徽章显示已连接+模型");
  ok(w.document.getElementById("llm-backend-status").className.includes("badge-green"), "已连接徽章为绿色");

  /* 30 秒缓存 */
  const before = fetchLog.filter(f => f.url.includes("/api/health")).length;
  await w.eval("fmApi.checkHealth()");
  ok(fetchLog.filter(f => f.url.includes("/api/health")).length === before, "30 秒内复用健康缓存（不重复探测）");
  await w.eval("fmApi.checkHealth(true)");
  ok(fetchLog.filter(f => f.url.includes("/api/health")).length === before + 1, "force 强制重新探测");

  /* 后端不可达 → 降级 */
  route.health = { status: 0, ok: false, json: async () => ({}) };
  w.fetch = async (url, opts) => { const u = String(url); fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: null }); if (u.includes("/api/health")) throw new Error("Failed to fetch"); return fakeJson(200, {}); };
  await w.eval("fmApi.checkHealth(true)");
  ok(w.eval("fmApi.ready === false && fmApi.backendReady() === false"), "后端不可达时 ready 置假（降级）");
  w.eval("refreshBackendUi()");
  ok(w.document.getElementById("llm-backend-status").textContent === "未连接", "不可达徽章显示未连接");
  ok(w.document.getElementById("llm-backend-status").className.includes("badge-amber"), "未连接徽章为琥珀色");

  /* 恢复健康路由 + 未配置 Key 形态 */
  w.fetch = async (url, opts) => {
    const u = String(url);
    fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: null });
    if (u.includes("/api/health")) return fakeJson(200, { ok: true, llm_ready: false, model: null });
    return fakeJson(200, { ok: true });
  };
  await w.eval("fmApi.checkHealth(true)");
  w.eval("refreshBackendUi()");
  ok(w.document.getElementById("llm-backend-status").textContent === "已连接 · 未配置 Key", "后端在线但无 Key 的徽章文案");

  console.log("\n-- C. SSE 聊天（三级降级第一级） --");
  w.fetch = async (url, opts) => {
    const u = String(url);
    const rec = { url: u, method: (opts && opts.method) || "GET", body: null };
    if (opts && opts.body) { try { rec.body = JSON.parse(opts.body); } catch (e) {} }
    fetchLog.push(rec);
    if (u.includes("/api/chat/stream")) return fakeSse(route.sse || ["data: {\"choices\":[{\"delta\":{\"content\":\"你好\"}}]}\n\n", "data: [DONE]\n\n"]);
    return fakeJson(200, { ok: true });
  };
  route.sse = ["data: {\"choices\":[{\"delta\":{\"content\":\"你好\"}}]}\n\n", "data: {\"choices\":[{\"delta\":{\"content\":\"，世界\"}}]}\n\n", "data: [DONE]\n\n"];
  const pieces = [];
  await w.eval(`streamChat([{role:"user",content:"hi"}], piece => { window.__pieces = (window.__pieces || []); window.__pieces.push(piece); })`);
  ok(fetchLog.some(f => f.url.includes("/api/chat/stream")), "streamChat 走后端 SSE 接口");
  ok(JSON.stringify(w.eval("window.__pieces || []")) === JSON.stringify(["你好", "，世界"]), "SSE 分片增量回调");
  ok(w.eval("fmApi.backendReady()") === true, "后端优先路径生效");

  /* 503 → 明确错误（引导 Mock / 填 Key） */
  w.fetch = async (url, opts) => {
    fetchLog.push({ url: String(url), method: "POST", body: null });
    return { status: 503, ok: false, json: async () => ({ detail: "服务端未配置 LLM_API_KEY" }) };
  };
  let err503 = "";
  try { await w.eval("streamChat([{role:'user',content:'hi'}], () => {})"); } catch (e) { err503 = e.message; }
  ok(err503.includes("后端未配置 LLM_API_KEY"), "503 抛出可读错误（引导降级）");

  /* 上游 error 事件 */
  w.fetch = async () => fakeSse(["data: {\"error\":\"upstream_500\",\"detail\":\"boom\"}\n\n"]);
  let errUp = "";
  try { await w.eval("streamChat([{role:'user',content:'hi'}], () => {})"); } catch (e) { errUp = e.message; }
  ok(errUp.includes("后端模型调用失败") && errUp.includes("boom"), "上游错误事件转为可读异常");

  console.log("\n-- D. 账号与会话落库 --");
  w.fetch = async (url, opts) => {
    const u = String(url);
    const rec = { url: u, method: (opts && opts.method) || "GET", body: null };
    if (opts && opts.body) { try { rec.body = JSON.parse(opts.body); } catch (e) {} }
    fetchLog.push(rec);
    if (u.includes("/api/auth/login")) return fakeJson(200, { token: "tok_login", user: { id: "u_be", name: "后端用户", email: "t@t.com", is_vip: false } });
    if (u.includes("/api/interviews") && u.endsWith("/report")) return fakeJson(200, { total: 88, dims: [{ key: "depth", dimension: "内容深度", score: 88, comment: "服务端评分", pool: [] }], plan: [{ day: "Day 1", task: "服务端任务", tag: "综合" }], evidence: [], weakest: { dimension: "内容深度", score: 88 } });
    if (u.includes("/api/interviews") && u.includes("/sync")) return fakeJson(200, { ok: true });
    if (u.includes("/api/interviews")) return fakeJson(200, { id: "iv_stub" });
    return fakeJson(200, { ok: true });
  };
  const loginUser = await w.eval("fmApi.login('t@t.com','Demo123456')");
  ok(loginUser && loginUser.id === "u_be", "fmApi.login 返回后端用户");
  ok(w.eval("sessionStorage.getItem('fm_token')") === "tok_login", "JWT 写入 sessionStorage");
  ok(w.eval("fmApi.token") === "tok_login", "fmApi 记住 token（后续请求带 Authorization）");

  w.fetch = async () => { fetchLog.push({ url: "/api/auth/login", method: "POST", body: null }); return fakeJson(401, { detail: "邮箱或密码不正确" }); };
  let errLogin = "";
  try { await w.eval("fmApi.login('t@t.com','bad')"); } catch (e) { errLogin = e.message; }
  ok(errLogin === "邮箱或密码不正确", "登录失败透传后端 detail");

  w.fetch = async (url, opts) => {
    const u = String(url);
    fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: null });
    if (u.includes("/api/interviews") && u.endsWith("/report")) return fakeJson(200, { total: 88, dims: [{ key: "depth", dimension: "内容深度", score: 88, comment: "服务端评分", pool: [] }], plan: [{ day: "Day 1", task: "服务端任务", tag: "综合" }], evidence: [], weakest: { dimension: "内容深度", score: 88 } });
    if (u.includes("/api/interviews") && u.includes("/sync")) return fakeJson(200, { ok: true });
    if (u.includes("/api/interviews")) return fakeJson(200, { id: "iv_stub" });
    return fakeJson(200, { ok: true });
  };
  const sess = { mode: "tech", turns: [{ agent: "技术面试官", question: "缓存一致性？", answer: "延迟双删，QPS 200→1200", notes: "" }], codeScore: 0.8 };
  const rep = await w.eval(`(${JSON.stringify(sess)}) && fmApi.syncAndReport(session, null)`);
  /* 上面传的是临时对象，这里改用真实 session 再验一次落库 */
  w.eval(`session = { mode: "tech", turns: [{ agent: "技术面试官", question: "缓存一致性？", answer: "延迟双删，QPS 200→1200", notes: "" }], codeScore: 0.8 }`);
  const rep2 = await w.eval("fmApi.syncAndReport(session, null)");
  ok(rep2 && rep2.total === 88 && rep2.dims.length === 1, "syncAndReport 返回服务端评分");
  ok(w.eval("session.interviewId") === "iv_stub", "interviewId 回写 session（刷新后归属同一会话）");
  const seq = fetchLog.filter(f => f.url.includes("/sync")).length;
  ok(seq >= 1, "问答记录已批量同步（/sync）");
  ok(fetchLog.filter(f => f.url.includes("/api/interviews")).some(f => f.method === "POST"), "会话创建为 POST");

  console.log("\n-- E. 登录流：后端优先 + 离线兜底 --");
  /* 后端在线：走后端登录 */
  w.fetch = async (url, opts) => {
    const u = String(url);
    fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: null });
    if (u.includes("/api/auth/login")) return fakeJson(200, { token: "tok_demo", user: { id: "u_demo", name: "演示用户", email: "demo@futuremirror.app", is_vip: true } });
    return fakeJson(200, { ok: true });
  };
  await w.eval("fmApi.checkHealth(true)");
  w.document.getElementById("login-email").value = "demo@futuremirror.app";
  w.document.getElementById("login-pass").value = "Demo123456";
  await w.eval("doLogin()");
  ok(w.eval("currentUser && currentUser.id") === "u_demo", "doLogin 走后端账号体系");
  ok(w.eval("sessionStorage.getItem('fm_token')") === "tok_demo", "登录后 token 就位");
  ok(w.eval("getProfile().vip") === true, "演示账号进入应用即 VIP（enterApp 权益写入）");
  w.eval("logout()");

  /* 后端登录失败：不回落本地（避免密码误判） */
  w.fetch = async (url, opts) => {
    const u = String(url);
    fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: null });
    if (u.includes("/api/auth/login")) return fakeJson(401, { detail: "邮箱或密码不正确" });
    return fakeJson(200, { ok: true });
  };
  w.document.getElementById("login-email").value = "demo@futuremirror.app";
  w.document.getElementById("login-pass").value = "wrongpass";
  await w.eval("doLogin()");
  ok(w.eval("currentUser") === null, "后端拒绝登录时不落入本地账号");
  ok(w.document.getElementById("login-error") && !w.document.getElementById("login-error").hidden, "登录错误提示展示");
  ok(w.document.getElementById("login-error").textContent.includes("邮箱或密码不正确"), "错误文案透传后端");

  /* 后端不可达：quickDemoLogin 回落本地演示账号（VIP 保留） */
  w.fetch = async (url) => { fetchLog.push({ url: String(url), method: "GET", body: null }); throw new Error("Failed to fetch"); };
  await w.eval("fmApi.checkHealth(true)");
  ok(w.eval("fmApi.backendReady()") === false, "离线探测置为不可用");
  await w.eval("quickDemoLogin()");
  ok(w.eval("currentUser && currentUser.email") === "demo@futuremirror.app", "离线时 quickDemoLogin 回落本地演示账号");
  ok(w.eval("getProfile().vip") === true, "本地演示账号同样获得 VIP");
  w.eval("logout()");

  console.log("\n-- F. renderReport：服务端评分优先 + 离线兜底 --");
  /* 后端在线：用服务端 dims */
  w.fetch = async (url, opts) => {
    const u = String(url);
    fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: null });
    if (u.includes("/api/health")) return fakeJson(200, { ok: true, llm_ready: true, model: "glm-4-flash" });
    if (u.includes("/api/interviews") && u.endsWith("/report")) return fakeJson(200, { total: 88, dims: [{ key: "depth", dimension: "内容深度", score: 88, comment: "服务端评分", pool: ["任务一", "任务二", "任务三"] }, { key: "logic", dimension: "结构逻辑", score: 70, comment: "c2", pool: ["x"] }], plan: [{ day: "Day 1", task: "服务端任务", tag: "综合" }], evidence: [{ agent: "技术面试官", quote: "引", note: "" }], weakest: { dimension: "结构逻辑", score: 70 } });
    if (u.includes("/api/interviews") && u.includes("/sync")) return fakeJson(200, { ok: true });
    if (u.includes("/api/interviews")) return fakeJson(200, { id: "iv_rep" });
    return fakeJson(200, { ok: true });
  };
  await w.eval("fmApi.checkHealth(true)");
  w.eval(`currentUser = { id: "u_rep", email: "r@t.com", name: "报告 tester" };
          session = { mode: "tech", turns: [
            { agent: "技术面试官", question: "缓存一致性？", answer: "用延迟双删，QPS 从 200 提升到 1200，最终上线平稳", notes: "有量化" },
            { agent: "技术面试官", question: "深挖：缓存击穿？", answer: "互斥锁重建，通过压测验证，结果稳定", notes: "" }
          ], codeScore: 0.8 };
          matchResult = null;`);
  await w.eval("renderReport(true)");
  const totalEl = w.document.getElementById("report-total");
  ok(w.eval("session.interviewId") === "iv_rep", "报告生成后 interviewId 已持久化");
  ok(totalEl && totalEl.textContent.includes("88"), "报告总分采用服务端评分（88）");
  ok(w.document.getElementById("report-content").textContent.includes("服务端评分"), "维度评语来自服务端");

  /* 后端离线：回落本地 scoreSession */
  w.fetch = async (url) => { fetchLog.push({ url: String(url), method: "GET", body: null }); throw new Error("Failed to fetch"); };
  await w.eval("fmApi.checkHealth(true)");
  w.eval("session.interviewId = null");
  await w.eval("renderReport(true)");
  const totalEl2 = w.document.getElementById("report-total");
  ok(totalEl2 && /\d/.test(totalEl2.textContent), "离线时报告回退本地评分引擎（不中断）");
  ok(w.eval("session.interviewId") === null, "离线时不写 interviewId");

  console.log("\n-- G. CSSOM（v22 面板样式） --");
  const cssText = [...w.document.styleSheets].map(s => {
    try { return [...s.cssRules].map(r => r.cssText).join("\n"); } catch (e) { return ""; }
  }).join("\n");
  ok(/\.llm-backend-row\s*\{[^}]*border:\s*1px dashed/.test(cssText.replace(/;\s*/g, ";")), "后端地址行虚线强调样式");
  ok(/\.llm-backend-row\s*\{[^}]*background:\s*var\(--brand-bg\)/.test(cssText.replace(/;\s*/g, ";")), "后端地址行品牌底色");
  const printRules = [...w.document.styleSheets].flatMap(s => {
    try {
      return [...s.cssRules].filter(r => r.type === 4 && r.conditionText === "print")
        .flatMap(r => [...r.cssRules].map(x => x.cssText));
    } catch (e) { return []; }
  });
  ok(printRules.some(t => t.includes(".llm-backend-row") && t.includes("display: none")), "打印时隐藏后端配置行");

  console.log("\n-- H. v22.1 修复回归（掉线/后端模式/重复同步/文案） --");
  /* H1 Bug 1：后端登录后用户落 g_users，刷新后 restoreUser 找得回 */
  w.fetch = async (url, opts) => {
    const u = String(url);
    fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: null });
    if (u.includes("/api/auth/login")) return fakeJson(200, { token: "tok_h1", user: { id: "u_h1", name: "后端用户H1", email: "h1@t.com", is_vip: false } });
    return fakeJson(200, { ok: true });
  };
  await w.eval("fmApi.checkHealth(true)");
  w.document.getElementById("login-email").value = "h1@t.com";
  w.document.getElementById("login-pass").value = "Demo123456";
  await w.eval("doLogin()");
  ok(w.eval("loadUsers().some(u => u.id === 'u_h1' && u.isBackend === true)"), "Bug1：后端用户已写入本地用户表（isBackend 标记）");
  ok(w.eval("restoreUser() && restoreUser().id") === "u_h1", "Bug1：刷新后 restoreUser 能找回后端用户（不掉线）");
  ok(w.eval("loadUsers().every(u => !u.isBackend || !u.passHash)"), "Bug1：后端账号本地不留 passHash");
  w.eval("logout()");

  /* H2 Bug 3：同会话重复进报告页只同步一次；轮数变化才重新同步 */
  w.fetch = async (url, opts) => {
    const u = String(url);
    const rec = { url: u, method: (opts && opts.method) || "GET", body: null };
    if (opts && opts.body) { try { rec.body = JSON.parse(opts.body); } catch (e) {} }
    fetchLog.push(rec);
    if (u.includes("/api/health")) return fakeJson(200, { ok: true, llm_ready: true, model: "glm-4-flash" });
    if (u.includes("/api/interviews") && u.endsWith("/report")) return fakeJson(200, { total: 88, dims: [{ key: "depth", dimension: "内容深度", score: 88, comment: "服务端评分", pool: ["a", "b", "c"] }], plan: [{ day: "Day 1", task: "t", tag: "综合" }], evidence: [{ agent: "技术面试官", quote: "引", note: "" }], weakest: { dimension: "内容深度", score: 88 } });
    if (u.includes("/api/interviews") && u.includes("/sync")) return fakeJson(200, { ok: true, added: 2, total: 2 });
    if (u.includes("/api/interviews")) return fakeJson(200, { id: "iv_h2" });
    return fakeJson(200, { ok: true });
  };
  await w.eval("fmApi.checkHealth(true)");
  w.eval(`currentUser = { id: "u_h2", email: "h2@t.com", name: "报告 tester" };
          session = { mode: "tech", turns: [
            { agent: "技术面试官", question: "缓存一致性？", answer: "用延迟双删，QPS 从 200 提升到 1200，最终上线平稳", notes: "有量化" },
            { agent: "技术面试官", question: "深挖：缓存击穿？", answer: "互斥锁重建，通过压测验证，结果稳定", notes: "" }
          ], codeScore: 0.8 };
          matchResult = null;`);
  const syncH2Before = fetchLog.filter(f => f.url.includes("/sync")).length;
  await w.eval("renderReport(true)");   // force：首次必同步
  await w.eval("renderReport()");       // 同签名：不应再同步
  await w.eval("renderReport()");       // 再次切页：仍不应同步
  const syncH2After = fetchLog.filter(f => f.url.includes("/sync")).length;
  ok(syncH2After - syncH2Before === 1, "Bug3：同会话重复渲染报告只 POST 一次 /sync（实际 " + (syncH2After - syncH2Before) + " 次）");
  ok(w.eval("session.interviewId") === "iv_h2", "Bug3：interviewId 仍正确回写");
  w.eval("session.turns.push({ agent: 'HR', question: '职业规划？', answer: '3 年内成为后端负责人，能带 2 人小组', notes: '' })");
  await w.eval("renderReport()");
  ok(fetchLog.filter(f => f.url.includes("/sync")).length === syncH2After + 1, "Bug3：轮数变化后重新同步（增量入库）");
  w.eval("restartInterview()");
  ok(w.eval("session.interviewId") === null, "Bug3：restartInterview 重置 interviewId（新一轮独立入库）");

  /* H3 Bug 2：后端模式下 RAG 走模型（无需直连 Key） */
  w.fetch = async (url, opts) => {
    const u = String(url);
    const rec = { url: u, method: (opts && opts.method) || "GET", body: null };
    if (opts && opts.body) { try { rec.body = JSON.parse(opts.body); } catch (e) {} }
    fetchLog.push(rec);
    if (u.includes("/api/health")) return fakeJson(200, { ok: true, llm_ready: true, model: "glm-4-flash" });
    if (u.includes("/api/chat/stream")) return fakeSse(["data: {\"choices\":[{\"delta\":{\"content\":\"缓存穿透用布隆过滤器\"}}]}\n\n", "data: [DONE]\n\n"]);
    return fakeJson(200, { ok: true });
  };
  await w.eval("fmApi.checkHealth(true)");
  w.eval("llm = null; currentUser = { id: 'u_h3', email: 'h3@t.com', name: 'RAG tester' }");
  w.document.getElementById("rag-input").value = "Redis 缓存穿透";
  const chatH3Before = fetchLog.filter(f => f.url.includes("/api/chat/stream")).length;
  await w.eval("askRag()");
  ok(fetchLog.filter(f => f.url.includes("/api/chat/stream")).length === chatH3Before + 1, "Bug2：后端在线时 RAG 走 /api/chat/stream（不再退化为关键词检索）");
  ok(w.document.getElementById("rag-result").textContent.includes("后端 glm-4-flash"), "Bug2：RAG 回答标注后端模型名（无 llm.model 空引用）");

  /* H4 Bug 2：后端模式下简历深度改写走模型 */
  w.document.getElementById("resume-raw").value = "本科计算机，课程项目：React + Node.js 待办应用，QPS 200。";
  const chatH4Before = fetchLog.filter(f => f.url.includes("/api/chat/stream")).length;
  await w.eval("optimizeWithLLM()");
  ok(fetchLog.filter(f => f.url.includes("/api/chat/stream")).length === chatH4Before + 1, "Bug2：后端在线时简历改写走 /api/chat/stream（不再提示先接 Key）");

  /* H5 Minor 2：health 探测未返回时，doLogin 先预检再走后端分支 */
  w.eval("fmApi.health = null; fmApi.healthAt = 0;");
  fetchLog.length = 0;
  w.fetch = async (url, opts) => {
    const u = String(url);
    fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: null });
    if (u.includes("/api/health")) return fakeJson(200, { ok: true, llm_ready: true, model: "glm-4-flash" });
    if (u.includes("/api/auth/login")) return fakeJson(200, { token: "tok_h5", user: { id: "u_h5", name: "预检用户", email: "h5@t.com", is_vip: false } });
    return fakeJson(200, { ok: true });
  };
  w.document.getElementById("login-email").value = "h5@t.com";
  w.document.getElementById("login-pass").value = "Demo123456";
  await w.eval("doLogin()");
  ok(fetchLog.length >= 2 && fetchLog[0].url.includes("/api/health") && fetchLog[1].url.includes("/api/auth/login"), "Minor2：doLogin 先探测健康再走后端登录（请求顺序正确）");
  ok(w.eval("currentUser && currentUser.id") === "u_h5", "Minor2：预检后正确进入后端账号");
  w.eval("logout()");

  /* H6 Minor 3：后端在线时清除直连 Key 的文案 */
  w.eval("llm = { baseUrl: 'https://x/v1', apiKey: 'k', model: 'm' }; clearLlm()");
  ok(w.eval("llm") === null, "Minor3：clearLlm 清空直连 Key");
  ok(w.document.getElementById("toast").textContent.includes("仍走后端模型"), "Minor3：后端在线时文案为「仍走后端模型」");

  /* H7 Minor 1：后端在线时 toggleLlmMode 不清 Key、不跳面板 */
  w.eval("toggleLlmMode()");
  ok(w.document.getElementById("toast").textContent.includes("后端"), "Minor1：后端在线时提示后端运行形态（不再误导切 Mock）");
  ok(w.eval("fmApi.backendReady()") === true, "Minor1：后端连接不受 toggle 影响");
  w.eval("updateDevLlmMode()");
  ok(w.document.getElementById("dev-llm-mode").textContent.includes("后端真实模式"), "Minor1：开发者模式显示后端真实形态");

  /* H8 Minor 1：诊断导出包含四态 llmMode 与后端信息 */
  w.eval(`window.URL.createObjectURL = b => { window.__blob = b; return "blob:fake"; };
          window.URL.revokeObjectURL = () => {};`);
  w.eval("exportDiagnostic()");
  ok(w.document.getElementById("toast").textContent.includes("诊断报告已下载"), "Minor1：诊断导出成功（Blob 已打桩）");
  const diagText = await Promise.race([
    w.eval(`new Promise(res => { const b = window.__blob; if (!b) return res(""); const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(""); r.readAsText(b); })`),
    new Promise(res => setTimeout(() => res(""), 1500)),
  ]);
  let diag = null;
  try { diag = diagText ? JSON.parse(diagText) : null; } catch (e) {}
  ok(!!diag && diag.state.llmMode === "backend-real", "Minor1：诊断 llmMode=backend-real（后端真实）");
  ok(!!diag && diag.state.backend && diag.state.backend.ready === true, "Minor1：诊断包含后端连接信息");
  ok(!!diag && diag.version === "beta1.0", "Minor1：诊断版本号更新为 beta1.0");

  console.log(`\n结果：${pass} 通过 / ${fail} 失败（v22 后端适配层 + v22.1 修复回归）`);
  process.exit(fail ? 1 : 0);
}, 400);
