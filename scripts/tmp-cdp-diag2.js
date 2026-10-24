/* CDP 诊断 v2：监听控制台 + 分阶段等待 */
const WS = require("ws");
const { spawn } = require("child_process");
const fs = require("fs");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 8903;
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
  const consoleErrors = [];
  ws.on("message", raw => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) {
      consoleErrors.push(m.params.type + ": " + (m.params.args || []).map(a => a.value || a.description || "").join(" ").slice(0, 200));
    }
    if (m.method === "Runtime.exceptionThrown") {
      consoleErrors.push("EXC: " + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || "").slice(0, 300));
    }
  });
  const send = (method, params) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, m => m.error ? rej(new Error(method + ": " + JSON.stringify(m.error))) : res(m.result));
    ws.send(JSON.stringify({ id: i, method, params: params || {} }));
  });
  const evalJs = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) return { __error: (r.exceptionDetails.exception && r.exceptionDetails.exception.description || "").slice(0, 300) };
    return r.result.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");

  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      (function(){
        function simpleHash(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "h"+(h>>>0).toString(36);}
        var user={id:"u_diag01",email:"demo@futuremirror.app",name:"诊断用户",passHash:simpleHash("demo1234"),createdAt:new Date().toISOString()};
        try{localStorage.setItem("g_users",JSON.stringify([user]));}catch(e){}
        try{sessionStorage.setItem("fm_uid",user.id);}catch(e){}
      })();
    `,
  });

  await send("Page.navigate", { url: URL });
  /* 轮询等待 readyState complete 且 __bpViz 就绪 */
  let boot = null;
  for (let i = 0; i < 40; i++) {
    await wait(500);
    boot = await evalJs(`JSON.stringify({
      rs: document.readyState,
      viz: !!window.__bpViz,
      motion: !!window.__bpMotion,
      panel: !!document.getElementById("bp-viz-panel"),
      view: (document.querySelector(".view.active")||{}).id,
      user: !!window.currentUser,
      hash: location.hash
    })`);
    const b = JSON.parse(boot);
    if (b.rs === "complete" && b.viz && b.motion) break;
  }
  console.log("BOOT:", boot);

  /* 登录态恢复：若未登录，尝试手动触发恢复逻辑 */
  const login = await evalJs(`(function(){
    if (window.currentUser) return "already";
    if (typeof restoreUser === "function") { try { restoreUser(); } catch(e) { return "err:"+e.message; } }
    return window.currentUser ? "restored" : "failed";
  })()`);
  console.log("LOGIN:", login);
  await wait(600);

  const pages = ["dashboard", "interview", "quiz", "report"];
  for (const p of pages) {
    await evalJs(`location.hash = "#/${p}"`);
    await wait(1100);
    const s = await evalJs(`JSON.stringify({
      page: "${p}",
      active: (document.querySelector(".app-page.active")||{}).dataset ? document.querySelector(".app-page.active").dataset.page : null,
      docH: document.documentElement.scrollHeight,
      winH: window.innerHeight,
      canScroll: document.documentElement.scrollHeight > window.innerHeight + 4,
      snapY: document.documentElement.classList.contains("bp-snap-y"),
      snapItems: document.querySelectorAll(".bp-snap-item").length
    })`);
    console.log("PAGE:", s);
  }

  /* 面试页按钮清单 */
  await evalJs(`location.hash = "#/interview"`);
  await wait(900);
  const iv = await evalJs(`JSON.stringify({
    headBtns: [...document.querySelectorAll(".app-page.active .chat-head button")].map(b=>b.textContent.trim()),
    pageBtns: [...document.querySelectorAll(".app-page.active button")].map(b=>b.textContent.trim()).slice(0,25)
  })`);
  console.log("INTERVIEW:", iv);

  /* 题库页详情 */
  await evalJs(`location.hash = "#/quiz"`);
  await wait(900);
  const q = await evalJs(`JSON.stringify({
    docH: document.documentElement.scrollHeight,
    winH: window.innerHeight,
    learnLen: (document.getElementById("quiz-pane-learn")||{innerHTML:0}).innerHTML.length,
    tabs: [...document.querySelectorAll(".quiz-tab")].map(t=>t.textContent.trim())
  })`);
  console.log("QUIZ:", q);

  /* 报告页 */
  await evalJs(`location.hash = "#/report"`);
  await wait(1300);
  const rp = await evalJs(`JSON.stringify({
    panel: !!document.getElementById("bp-viz-panel"),
    reportText: ((document.getElementById("report-content")||{}).textContent||"").slice(0,80),
    liveItems: document.querySelectorAll("#bp-viz-panel .bp-live-item").length,
    liveState: (document.querySelector("#bp-viz-panel .bp-live-state")||{}).textContent,
    liveVals: [...document.querySelectorAll("#bp-viz-panel .bp-live-item")].map(e=>e.textContent)
  })`);
  console.log("REPORT:", rp);

  console.log("CONSOLE:", consoleErrors.slice(0, 12));
  ws.close();
  process.exit(0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
