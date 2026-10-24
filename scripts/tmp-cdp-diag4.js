/* CDP 诊断 v4：landing 页滚动 + 移动端视口 + 各视图 */
const WS = require("ws");
const { spawn } = require("child_process");
const fs = require("fs");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 8906;
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
    fs.writeFileSync(`/tmp/diag-${name}.png`, Buffer.from(r.data, "base64"));
  };
  const setViewport = (w, h) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 900 });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });
  for (let i = 0; i < 30; i++) { await wait(500); const b = await evalJs(`!!window.__bpViz && document.readyState==="complete"`); if (b) break; }

  /* ===== 桌面 1280×900：landing 页 ===== */
  await setViewport(1280, 900);
  await evalJs(`showView("landing")`);
  await wait(900);
  const land = await evalJs(`(function(){
    var before = window.scrollY;
    window.scrollTo(0, 600);
    var mid = window.scrollY;
    window.scrollTo(0, 100000);
    var end = window.scrollY;
    return JSON.stringify({docH: document.documentElement.scrollHeight, winH: window.innerHeight, before: before, afterScroll600: mid, maxScroll: end, snapY: document.documentElement.classList.contains("bp-snap-y")});
  })()`);
  console.log("LANDING DESKTOP:", land);
  await shot("landing-top");

  /* ===== 移动端 390×844：landing ===== */
  await setViewport(390, 844);
  await wait(600);
  const landM = await evalJs(`(function(){
    window.scrollTo(0, 0);
    window.scrollTo(0, 600);
    var mid = window.scrollY;
    window.scrollTo(0, 100000);
    return JSON.stringify({docH: document.documentElement.scrollHeight, winH: window.innerHeight, afterScroll600: mid, maxScroll: window.scrollY});
  })()`);
  console.log("LANDING MOBILE:", landM);

  /* ===== 移动端：app 各页 ===== */
  const pages = ["dashboard", "interview", "quiz", "report", "match", "career", "profile", "jobs", "resume", "rag"];
  for (const p of pages) {
    await evalJs(`location.hash = "#/${p}"`);
    await wait(700);
    const s = await evalJs(`(function(){
      window.scrollTo(0,0);
      window.scrollTo(0, 500);
      var mid = window.scrollY;
      window.scrollTo(0, 100000);
      return JSON.stringify({page:"${p}", docH: document.documentElement.scrollHeight, winH: window.innerHeight, mid: mid, max: window.scrollY});
    })()`);
    console.log("MOBILE PAGE:", s);
  }

  /* ===== 题库移动端子页签 ===== */
  await evalJs(`location.hash = "#/quiz"`);
  await wait(600);
  for (const tab of ["learn", "exam", "stats", "wrong", "fav"]) {
    await evalJs(`switchQuizTab("${tab}")`);
    await wait(500);
    const s = await evalJs(`(function(){
      window.scrollTo(0,0); window.scrollTo(0, 500); var mid = window.scrollY;
      window.scrollTo(0, 100000);
      return JSON.stringify({tab:"${tab}", docH: document.documentElement.scrollHeight, winH: window.innerHeight, mid: mid, max: window.scrollY});
    })()`);
    console.log("MOBILE QUIZ TAB:", s);
  }
  await shot("mobile-quiz");

  /* ===== 桌面：题库 exam 运行中（先登录拿 VIP） ===== */
  await setViewport(1280, 900);
  await evalJs(`(function(){
    try {
      showView("auth"); switchAuthTab("register");
      document.getElementById("reg-name").value = "诊断";
      document.getElementById("reg-email").value = "diag2@test.com";
      document.getElementById("reg-pass").value = "demo1234";
      doRegister();
    } catch(e) {}
  })()`);
  await wait(1500);
  const lg = await evalJs(`JSON.stringify({user: !!window.currentUser})`);
  console.log("LOGIN2:", lg);
  await evalJs(`location.hash = "#/quiz"`);
  await wait(700);
  await evalJs(`switchQuizTab("exam")`);
  await wait(500);
  const startExamR = await evalJs(`(function(){ try { startExam(); return "ok:" + !!document.querySelector(".quiz-runner"); } catch(e) { return "err:"+e.message; } })()`);
  await wait(1000);
  const ex = await evalJs(`(function(){
    window.scrollTo(0,0); window.scrollTo(0, 500); var mid = window.scrollY;
    window.scrollTo(0, 100000);
    return JSON.stringify({runner: !!document.querySelector(".quiz-runner"), docH: document.documentElement.scrollHeight, winH: window.innerHeight, mid: mid, max: window.scrollY});
  })()`);
  console.log("DESKTOP QUIZ EXAM:", startExamR, ex);
  await shot("quiz-exam-desktop");

  ws.close();
  process.exit(0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
