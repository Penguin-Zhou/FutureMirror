/* CDP 诊断脚本：驱动 Edge headless 检查三个问题页面 */
const WS = require("ws");
const { spawn } = require("child_process");
const fs = require("fs");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 8902;
const URL = "http://127.0.0.1:8901/futuremirror-demo.html";

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
  ws.on("message", raw => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, m => m.error ? rej(new Error(method + ": " + JSON.stringify(m.error))) : res(m.result));
    ws.send(JSON.stringify({ id: i, method, params: params || {} }));
  });
  const evalJs = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) return { __error: r.exceptionDetails.exception && r.exceptionDetails.exception.description };
    return r.result.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");

  /* 播种登录态（本地账号体系：g_users + fm_uid） */
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      (function(){
        function simpleHash(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "h"+(h>>>0).toString(36);}
        var user={id:"u_diag01",email:"demo@futuremirror.app",name:"诊断用户",passHash:simpleHash("demo1234"),createdAt:new Date().toISOString()};
        localStorage.setItem("g_users",JSON.stringify([user]));
        sessionStorage.setItem("fm_uid",user.id);
      })();
    `,
  });

  await send("Page.navigate", { url: URL });
  await wait(2600);

  const boot = await evalJs(`JSON.stringify({
    view: (document.querySelector(".view.active")||{}).id,
    page: (document.querySelector(".app-page.active")||{}).dataset ? document.querySelector(".app-page.active").dataset.page : null,
    user: !!window.currentUser,
    viz: !!document.getElementById("bp-viz-panel"),
    snapY: document.documentElement.classList.contains("bp-snap-y"),
    crosshair: !!document.querySelector(".bp-cross-x")
  })`);
  console.log("BOOT:", boot);

  /* ===== 页面 1：模拟面试 ===== */
  await evalJs(`location.hash = "#/interview"`);
  await wait(900);
  const iv = await evalJs(`JSON.stringify({
    headBtns: [...document.querySelectorAll("#view-app .app-page.active .chat-head button")].map(b=>b.textContent.trim()),
    hasRestart: !!([...document.querySelectorAll("#view-app .app-page.active button")].find(b=>/重新|重来|重置/.test(b.textContent)))
  })`);
  console.log("INTERVIEW:", iv);

  /* ===== 页面 2：题库小测（用户所称"实操能力板块"）===== */
  await evalJs(`location.hash = "#/quiz"`);
  await wait(900);
  const q = await evalJs(`JSON.stringify({
    docH: document.documentElement.scrollHeight,
    winH: window.innerHeight,
    canScroll: document.documentElement.scrollHeight > window.innerHeight + 4,
    paneHTML: (document.getElementById("quiz-pane-learn").innerHTML.length),
    tabs: [...document.querySelectorAll(".quiz-tab")].map(t=>t.textContent.trim())
  })`);
  console.log("QUIZ:", q);
  await send("Page.captureScreenshot", { format: "png" }).then(r =>
    fs.writeFileSync("/tmp/diag-quiz.png", Buffer.from(r.data, "base64")));

  /* ===== 页面 3：评估报告 ===== */
  await evalJs(`location.hash = "#/report"`);
  await wait(1200);
  const rp = await evalJs(`JSON.stringify({
    panel: !!document.getElementById("bp-viz-panel"),
    panelText: (document.getElementById("bp-viz-panel")||{}).textContent ? document.getElementById("bp-viz-panel").textContent.slice(0,120) : null,
    reportEmpty: /请先登录|尚未完成/.test((document.getElementById("report-content")||{}).textContent||""),
    liveItems: document.querySelectorAll("#bp-viz-panel .bp-live-item").length,
    liveText: (document.querySelector("#bp-viz-panel .bp-live-state")||{}).textContent
  })`);
  console.log("REPORT:", rp);
  await send("Page.captureScreenshot", { format: "png" }).then(r =>
    fs.writeFileSync("/tmp/diag-report.png", Buffer.from(r.data, "base64")));

  /* ===== 其他页面抽查：逐个测滚动 ===== */
  const pages = ["dashboard", "match", "resume", "career", "rag", "profile", "jobs"];
  for (const p of pages) {
    await evalJs(`location.hash = "#/${p}"`);
    await wait(600);
    const s = await evalJs(`JSON.stringify({page:"${p}", docH: document.documentElement.scrollHeight, winH: window.innerHeight, canScroll: document.documentElement.scrollHeight > window.innerHeight + 4})`);
    console.log("PAGE:", s);
  }

  ws.close();
  process.exit(0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
