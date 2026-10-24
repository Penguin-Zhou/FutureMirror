/* CDP 诊断 v3：完整用户流（登录 → 面试 → 报告 → 题库各子页） */
const WS = require("ws");
const { spawn } = require("child_process");
const fs = require("fs");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 8905;
const URL = "file:///C:/Users/25435/WorkBuddy/2026-10-16-11-58-34/futuremirror/public/futuremirror-demo.html";

function httpGet(path) {
  return new Promise((res, rej) => {
    require("http").get({ host: "127.0.0.1", port: PORT, path }, r => {
      let d = ""; r.on("data", c => d += c); r.on("end", () => res(JSON.parse(d)));
    }).on("error", rej);
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const edge = spawn(EDGE, [
    "--headless=new", "--disable-gpu", "--no-sandbox",
    `--remote-debugging-port=${PORT}`,
    "--window-size=1280,900",
    "about:blank",
  ], { detached: true, stdio: "ignore" });
  edge.unref();
  await wait(2500);

  const targets = await httpGet("/json/list");
  const page = targets.find(t => t.type === "page");
  const ws = new WS(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise(r => ws.on("open", r));

  let id = 0;
  const pending = new Map();
  const errs = [];
  ws.on("message", raw => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push((m.params.exceptionDetails.exception || {}).description || "exc");
  });
  const send = (method, params) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, m => m.error ? rej(new Error(method + ": " + JSON.stringify(m.error))) : res(m.result));
    ws.send(JSON.stringify({ id: i, method, params: params || {} }));
  });
  const evalJs = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) return { __error: ((r.exceptionDetails.exception || {}).description || "").slice(0, 240) };
    return r.result.value;
  };
  const shot = async (name) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`/tmp/diag-${name}.png`, Buffer.from(r.data, "base64"));
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });
  for (let i = 0; i < 30; i++) { await wait(500); const b = await evalJs(`!!window.__bpViz && !!window.__bpMotion && document.readyState==="complete"`); if (b) break; }
  console.log("boot ok");

  /* ---------- 登录（走 UI 表单） ---------- */
  const reg = await evalJs(`(function(){
    try {
      showView("auth");
      switchAuthTab("register");
      document.getElementById("reg-name").value = "诊断用户";
      document.getElementById("reg-email").value = "diag@test.com";
      document.getElementById("reg-pass").value = "demo1234";
      doRegister();
      return "submitted";
    } catch(e) { return "err:" + e.message; }
  })()`);
  console.log("REGISTER:", reg);
  await wait(1200);
  const lg = await evalJs(`JSON.stringify({user: !!window.currentUser, view: (document.querySelector(".view.active")||{}).id})`);
  console.log("AFTER REGISTER:", lg);

  /* ---------- 模拟面试：发 2 条消息 ---------- */
  await evalJs(`location.hash = "#/interview"`);
  await wait(800);
  await evalJs(`(function(){
    var inp = document.getElementById("chat-input");
    inp.value = "我主导了订单系统的缓存改造，用 Redis 做查询缓存，QPS 从 200 提升到 1200，延迟从 80ms 降到 15ms。";
    sendMsg();
  })()`);
  await wait(3200);
  await evalJs(`(function(){
    var inp = document.getElementById("chat-input");
    inp.value = "缓存一致性用延迟双删加消息队列补偿，数据库用 MySQL 主从加读写分离。";
    sendMsg();
  })()`);
  await wait(3200);
  const iv = await evalJs(`JSON.stringify({
    turns: window.session ? window.session.turns.length : -1,
    msgs: document.querySelectorAll("#chat-body .msg").length,
    headBtns: [...document.querySelectorAll(".app-page.active .chat-head button")].map(b=>b.textContent.trim())
  })`);
  console.log("INTERVIEW AFTER 2 TURNS:", iv);

  /* ---------- 结束面试 → 报告 ---------- */
  await evalJs(`finishInterview()`);
  await wait(2500);
  const rp = await evalJs(`JSON.stringify({
    panel: !!document.getElementById("bp-viz-panel"),
    note: (document.querySelector("#bp-viz-panel")||{}).textContent ? document.getElementById("bp-viz-panel").textContent.slice(0,100) : null,
    liveVals: [...document.querySelectorAll("#bp-viz-panel .bp-live-item")].map(e=>e.textContent),
    liveState: (document.querySelector("#bp-viz-panel .bp-live-state")||{}).textContent,
    radar: !!document.getElementById("radar"),
    planDays: document.querySelectorAll("#plan .plan-day").length,
    docH: document.documentElement.scrollHeight,
    winH: window.innerHeight
  })`);
  console.log("REPORT AFTER INTERVIEW:", rp);
  await shot("report-after");

  /* ---------- 尝试 restartInterview（命令面板路径） ---------- */
  const rs = await evalJs(`(function(){ try { restartInterview(); return "ok"; } catch(e) { return "err:"+e.message; } })()`);
  await wait(1500);
  const rs2 = await evalJs(`JSON.stringify({
    turns: window.session ? window.session.turns.length : -1,
    chatMsgs: document.querySelectorAll("#chat-body .msg").length,
    reportEmpty: /尚未完成/.test((document.getElementById("report-content")||{}).textContent||"")
  })`);
  console.log("RESTART:", rs, rs2);

  /* ---------- 题库各子页签滚动测试 ---------- */
  await evalJs(`location.hash = "#/quiz"`);
  await wait(700);
  for (const tab of ["learn", "exam", "stats", "wrong", "fav"]) {
    const r = await evalJs(`(function(){
      try { switchQuizTab("${tab}"); } catch(e) { return "switchErr:"+e.message; }
      return "ok";
    })()`);
    await wait(700);
    const s = await evalJs(`JSON.stringify({
      tab: "${tab}",
      docH: document.documentElement.scrollHeight,
      winH: window.innerHeight,
      canScroll: document.documentElement.scrollHeight > window.innerHeight + 4,
      paneLen: (document.getElementById("quiz-pane-${tab}")||{innerHTML:0}).innerHTML.length
    })`);
    console.log("QUIZ TAB:", s);
  }
  /* 开始一次限时小测，测进行中滚动 */
  await evalJs(`(function(){ try { switchQuizTab("exam"); startExam(); } catch(e) {} })()`);
  await wait(1200);
  const ex = await evalJs(`JSON.stringify({
    docH: document.documentElement.scrollHeight, winH: window.innerHeight,
    canScroll: document.documentElement.scrollHeight > window.innerHeight + 4,
    runner: !!document.querySelector(".quiz-runner")
  })`);
  console.log("QUIZ EXAM RUNNING:", ex);
  await shot("quiz-exam");

  /* 学习数据页（有数据后） */
  await evalJs(`(function(){ try { switchQuizTab("stats"); } catch(e) {} })()`);
  await wait(800);
  const st = await evalJs(`JSON.stringify({
    docH: document.documentElement.scrollHeight, winH: window.innerHeight,
    canScroll: document.documentElement.scrollHeight > window.innerHeight + 4
  })`);
  console.log("QUIZ STATS:", st);
  await shot("quiz-stats");

  console.log("EXCEPTIONS:", errs.slice(0, 8));
  ws.close();
  process.exit(0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
