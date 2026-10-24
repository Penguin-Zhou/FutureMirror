/* CDP 诊断 v5：instant 滚动 + 等待，区分 smooth 与 snap 锁定 */
const WS = require("ws");
const { spawn } = require("child_process");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 8907;
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
    `--remote-debugging-port=${PORT}`, "--window-size=1280,900", "about:blank",
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
    if (r.exceptionDetails) return { __error: ((r.exceptionDetails.exception || {}).description || "").slice(0, 240) };
    return r.result.value;
  };
  const setViewport = (w, h) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 900 });
  /* instant 滚动探测：分三段跳转，每段等待后读位置 */
  const probe = async (label) => {
    const r = await evalJs(`(async function(){
      const sleep = ms => new Promise(r=>setTimeout(r,ms));
      const out = {label: "${label}", docH: document.documentElement.scrollHeight, winH: window.innerHeight};
      window.scrollTo({top: 400, behavior: "instant"}); await sleep(500);
      out.y400 = window.scrollY;
      window.scrollTo({top: 100000, behavior: "instant"}); await sleep(500);
      out.yMax = window.scrollY;
      out.maxPossible = document.documentElement.scrollHeight - window.innerHeight;
      return JSON.stringify(out);
    })()`);
    console.log(r);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });
  for (let i = 0; i < 30; i++) { await wait(500); const b = await evalJs(`!!window.__bpViz && document.readyState==="complete"`); if (b) break; }

  await setViewport(1280, 900);
  await evalJs(`showView("landing")`);
  await wait(800);
  await probe("landing-desktop");

  await setViewport(390, 844);
  await wait(600);
  await probe("landing-mobile");

  /* app 页（移动端）——先确保在 app 视图 */
  const pages = ["dashboard", "interview", "quiz", "report", "career", "profile"];
  for (const p of pages) {
    await evalJs(`(function(){ location.hash = "#/${p}"; })()`);
    await wait(800);
    const v = await evalJs(`(document.querySelector(".view.active")||{}).id`);
    await probe(`mobile-${p} [${v}]`);
  }

  /* 题库子页签 */
  await evalJs(`location.hash = "#/quiz"`);
  await wait(600);
  for (const tab of ["learn", "exam", "stats", "wrong", "fav"]) {
    await evalJs(`switchQuizTab("${tab}")`);
    await wait(500);
    await probe(`mobile-quiz-${tab}`);
  }

  /* 桌面题库 */
  await setViewport(1280, 900);
  await wait(500);
  await probe("desktop-quiz-learn");
  await evalJs(`switchQuizTab("stats")`);
  await wait(500);
  await probe("desktop-quiz-stats");

  ws.close();
  process.exit(0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
