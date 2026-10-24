/* CDP 诊断 v9：landing 矮窗口滚轮 + app 视图内 quiz 真实滚轮 */
const WS = require("ws");
const { spawn } = require("child_process");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 8911;
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
    `--remote-debugging-port=${PORT}`, "--window-size=1280,640", "about:blank",
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
  const wheel = async (label, x, y, times) => {
    await evalJs(`window.scrollTo({top:0,behavior:"instant"})`);
    await wait(250);
    const trace = [];
    for (let i = 0; i < times; i++) {
      await send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY: 300 });
      await wait(180);
      const y0 = await evalJs(`window.scrollY`);
      trace.push(y0);
    }
    await wait(500);
    const fin = await evalJs(`JSON.stringify({label:"${label}", trace:${JSON.stringify(trace)}, finalY: window.scrollY, docH: document.documentElement.scrollHeight, winH: window.innerHeight, max: document.documentElement.scrollHeight - window.innerHeight})`);
    console.log(fin);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });
  for (let i = 0; i < 30; i++) { await wait(500); const b = await evalJs(`!!window.__bpViz && document.readyState==="complete"`); if (b) break; }
  await evalJs(`(async function(){ try { await quickDemoLogin(); } catch(e) {} })()`);
  await wait(1000);

  /* A. landing 矮窗口滚轮 */
  await evalJs(`showView("landing")`);
  await wait(800);
  await wheel("landing-640h", 640, 300, 12);

  /* B. app 视图 quiz 页滚轮（用 navTo 保持在 app 视图） */
  await evalJs(`showView("app"); navTo("quiz")`);
  await wait(900);
  const q1 = await evalJs(`JSON.stringify({view: (document.querySelector(".view.active")||{}).id, active: (document.querySelector(".app-page.active")||{}).dataset.page, docH: document.documentElement.scrollHeight})`);
  console.log("QUIZ STATE:", q1);
  await wheel("quiz-app-640h", 640, 300, 12);

  /* C. quiz 分类下钻后滚轮 */
  await evalJs(`document.querySelector("#quiz-pane-learn .quiz-cat").click()`);
  await wait(700);
  await wheel("quiz-drill-640h", 640, 300, 12);

  /* D. dashboard 滚轮 */
  await evalJs(`navTo("dashboard")`);
  await wait(800);
  await wheel("dashboard-640h", 640, 300, 12);

  /* E. interview 滚轮 */
  await evalJs(`navTo("interview")`);
  await wait(800);
  await wheel("interview-640h", 640, 300, 12);

  ws.close();
  process.exit(0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
