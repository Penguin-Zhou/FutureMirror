/* CDP 诊断 v8：真实滚轮事件滚动测试 */
const WS = require("ws");
const { spawn } = require("child_process");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 8910;
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
  const shot = async (name) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    require("fs").writeFileSync(`/tmp/diag-${name}.png`, Buffer.from(r.data, "base64"));
  };
  /* 在页面中心 dispatch 若干滚轮事件，看滚动位移 */
  const wheelScroll = async (label, x, y, times) => {
    await evalJs(`window.scrollTo({top:0,behavior:"instant"})`);
    await wait(300);
    for (let i = 0; i < times; i++) {
      await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: x || 640, y: y || 400, deltaX: 0, deltaY: 360 });
      await wait(220);
    }
    await wait(600);
    const r = await evalJs(`JSON.stringify({label:"${label}", y: window.scrollY, docH: document.documentElement.scrollHeight, winH: window.innerHeight, max: document.documentElement.scrollHeight - window.innerHeight})`);
    console.log(r);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });
  for (let i = 0; i < 30; i++) { await wait(500); const b = await evalJs(`!!window.__bpViz && document.readyState==="complete"`); if (b) break; }
  await evalJs(`(async function(){ try { await quickDemoLogin(); } catch(e) {} })()`);
  await wait(1200);

  /* landing 页滚轮 */
  await evalJs(`showView("landing")`);
  await wait(800);
  await wheelScroll("landing-wheel", 640, 400, 8);

  /* app 页滚轮：dashboard（工作台，最高） */
  await evalJs(`location.hash = "#/dashboard"`);
  await wait(800);
  await wheelScroll("dashboard-wheel", 640, 400, 10);

  /* 面试页滚轮（页面中部） */
  await evalJs(`location.hash = "#/interview"`);
  await wait(800);
  await wheelScroll("interview-wheel-mid", 640, 400, 8);
  /* 面试页：鼠标在时间线侧栏上滚动 */
  await wheelScroll("interview-wheel-aside", 1050, 400, 8);

  /* 题库页滚轮 */
  await evalJs(`location.hash = "#/quiz"`);
  await wait(700);
  await wheelScroll("quiz-wheel", 640, 400, 8);
  /* 题库：进入分类下钻后滚轮 */
  await evalJs(`document.querySelector("#quiz-pane-learn .quiz-cat").click()`);
  await wait(800);
  await wheelScroll("quiz-learn-drill-wheel", 640, 400, 8);
  await shot("quiz-drill-wheel");
  /* 考试运行态滚轮 */
  await evalJs(`switchQuizTab("exam"); startQuiz("mix")`);
  await wait(1200);
  await wheelScroll("quiz-exam-wheel", 640, 400, 8);

  ws.close();
  process.exit(0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
