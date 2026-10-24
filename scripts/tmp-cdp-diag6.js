/* CDP 诊断 v6：演示账号登录 → 考试运行态 / 知识点下钻 / 开发者模式 / 看板定位截图 */
const WS = require("ws");
const { spawn } = require("child_process");
const fs = require("fs");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 8908;
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
  const errs = [];
  ws.on("message", raw => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(((m.params.exceptionDetails.exception || {}).description || "exc").slice(0, 200));
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
  const probe = async (label) => {
    const r = await evalJs(`(async function(){
      const sleep = ms => new Promise(r=>setTimeout(r,ms));
      const out = {label: "${label}", docH: document.documentElement.scrollHeight, winH: window.innerHeight};
      window.scrollTo({top: 400, behavior: "instant"}); await sleep(400);
      out.y400 = window.scrollY;
      window.scrollTo({top: 100000, behavior: "instant"}); await sleep(400);
      out.yMax = window.scrollY;
      return JSON.stringify(out);
    })()`);
    console.log(r);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });
  for (let i = 0; i < 30; i++) { await wait(500); const b = await evalJs(`!!window.__bpViz && document.readyState==="complete"`); if (b) break; }

  /* 演示账号登录 */
  const lg = await evalJs(`(async function(){ try { await quickDemoLogin(); return "ok"; } catch(e) { return "err:"+e.message; } })()`);
  console.log("DEMO LOGIN:", lg);
  await wait(1200);
  const who = await evalJs(`JSON.stringify({name: (document.getElementById("profile-name")||{}).textContent, view: (document.querySelector(".view.active")||{}).id})`);
  console.log("WHO:", who);

  /* ===== 题库：知识点学习 → 分类下钻 ===== */
  await evalJs(`location.hash = "#/quiz"`);
  await wait(700);
  const cats = await evalJs(`JSON.stringify([...document.querySelectorAll("#quiz-pane-learn .quiz-cat")].map(c=>c.querySelector(".quiz-cat-name").textContent))`);
  console.log("QUIZ CATEGORIES:", cats);
  if (cats && cats.length) {
    await evalJs(`document.querySelector("#quiz-pane-learn .quiz-cat").click()`);
    await wait(800);
    const drill = await evalJs(`JSON.stringify({items: document.querySelectorAll("#quiz-pane-learn .learn-item").length, docH: document.documentElement.scrollHeight})`);
    console.log("QUIZ DRILL:", drill);
    await probe("quiz-learn-drill");
    await shot("quiz-learn-drill");
  }

  /* ===== 限时小测：开始考试 ===== */
  await evalJs(`switchQuizTab("exam")`);
  await wait(600);
  const ex1 = await evalJs(`(function(){ try { startExam(); return "started:" + !!document.querySelector(".quiz-runner"); } catch(e) { return "err:"+e.message; } })()`);
  await wait(1000);
  const ex2 = await evalJs(`JSON.stringify({runner: !!document.querySelector(".quiz-runner"), q: (document.querySelector(".quiz-q-text")||{}).textContent, opts: document.querySelectorAll(".quiz-opt").length})`);
  console.log("QUIZ EXAM:", ex1, ex2);
  await probe("quiz-exam-running");
  await shot("quiz-exam-running");

  /* ===== 开发者模式滚动 ===== */
  const ev = await evalJs(`(function(){ try { openEvaluatorGate("log"); return "ok"; } catch(e) { return "err:"+e.message; } })()`);
  await wait(1200);
  const ev2 = await evalJs(`JSON.stringify({view: (document.querySelector(".view.active")||{}).id, docH: document.documentElement.scrollHeight})`);
  console.log("EVALUATOR:", ev, ev2);
  await probe("evaluator");
  await shot("evaluator");

  /* ===== 回 app：面试 2 轮 → 报告 → 看板截图 ===== */
  await evalJs(`showView("app")`);
  await wait(600);
  await evalJs(`location.hash = "#/interview"`);
  await wait(700);
  await evalJs(`(function(){ var i=document.getElementById("chat-input"); i.value="我主导了订单系统的缓存改造，使用 Redis 集群做查询缓存，QPS 从 200 提升到 1200，P99 延迟从 80ms 降到 15ms，覆盖 3 个核心场景。"; sendMsg(); })()`);
  await wait(3400);
  await evalJs(`(function(){ var i=document.getElementById("chat-input"); i.value="缓存一致性采用延迟双删加 Canal 消息补偿，数据库 MySQL 主从读写分离，压测过 5000 QPS。"; sendMsg(); })()`);
  await wait(3400);
  await evalJs(`finishInterview()`);
  await wait(2600);
  /* 滚动到看板并截图 */
  await evalJs(`document.getElementById("bp-viz-panel").scrollIntoView()`);
  await wait(900);
  await shot("viz-panel-after-interview");
  const panel = await evalJs(`JSON.stringify({
    note: (document.querySelector("#bp-viz-panel")||{}).textContent.slice(0,60),
    heatCells: document.querySelectorAll("#bp-viz-panel .bp-heat-cell").length,
    firstCellBg: (document.querySelector("#bp-viz-panel .bp-heat-cell")||{}).style ? document.querySelector("#bp-viz-panel .bp-heat-cell").style.background + "/" + document.querySelector("#bp-viz-panel .bp-heat-cell").style.opacity : null,
    liveVals: [...document.querySelectorAll("#bp-viz-panel .bp-live-item")].map(e=>e.textContent)
  })`);
  console.log("VIZ PANEL AFTER INTERVIEW:", panel);

  console.log("EXCEPTIONS:", errs.slice(0, 6));
  ws.close();
  process.exit(0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
