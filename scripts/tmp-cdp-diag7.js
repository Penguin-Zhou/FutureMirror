/* CDP 诊断 v7：所有页面完整交互态的滚动探测 */
const WS = require("ws");
const { spawn } = require("child_process");
const fs = require("fs");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 8909;
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
  /* 探测：元素级最高点 vs 文档滚动能力 + 实际滚动测试 */
  const probe = async (label) => {
    const r = await evalJs(`(async function(){
      const sleep = ms => new Promise(r=>setTimeout(r,ms));
      const out = {label: "${label}", docH: document.documentElement.scrollHeight, winH: window.innerHeight};
      out.maxPossible = out.docH - out.winH;
      window.scrollTo({top: 100000, behavior: "instant"}); await sleep(450);
      out.yMax = window.scrollY;
      out.ok = out.yMax >= out.maxPossible - 2;
      /* 找出溢出视口且不可达的元素（被裁掉的） */
      const bad = [];
      document.querySelectorAll(".app-page.active *").forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.bottom > window.innerHeight + 600 && !el.closest("[style*='overflow']")) {
          const st = getComputedStyle(el);
          if (st.overflow === "visible" && st.position !== "fixed") bad.push(el.tagName + "." + (el.className||"").toString().slice(0,40) + " bottom=" + Math.round(r.bottom));
        }
      });
      out.farEls = bad.slice(0, 5);
      return JSON.stringify(out);
    })()`);
    console.log(r);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });
  for (let i = 0; i < 30; i++) { await wait(500); const b = await evalJs(`!!window.__bpViz && document.readyState==="complete"`); if (b) break; }
  await evalJs(`(async function(){ try { await quickDemoLogin(); } catch(e) {} })()`);
  await wait(1200);

  /* 1. 职业探索：选专业+技能+兴趣 → 推荐 */
  await evalJs(`location.hash = "#/career"`);
  await wait(700);
  await evalJs(`(function(){
    var chips = document.querySelectorAll("#major-chips .chip-btn"); if (chips[0]) chips[0].click();
    var sk = document.querySelectorAll("#skill-chips .chip-btn"); if (sk[0]) sk[0].click(); if (sk[1]) sk[1].click();
    var it = document.querySelectorAll("#interest-chips .chip-btn"); if (it[0]) it[0].click(); if (it[2]) it[2].click();
    recommendCareer();
  })()`);
  await wait(1500);
  const cr = await evalJs(`JSON.stringify({resultLen: (document.getElementById("career-result")||{}).innerHTML.length, cards: document.querySelectorAll("#career-result .card, #career-result .career-card").length})`);
  console.log("CAREER:", cr);
  await probe("career-with-result");
  await shot("career");

  /* 2. 简历优化：粘贴简历 → 诊断 */
  await evalJs(`location.hash = "#/resume"`);
  await wait(700);
  await evalJs(`(function(){
    var ta = document.querySelector("#view-app .app-page.active textarea");
    if (ta) { ta.value = "张三，计算机科学专业本科。负责电商平台订单系统开发，使用 Java、Spring Boot、MySQL、Redis、Kafka。主导订单查询接口优化，QPS 从 200 提升到 1200，P99 延迟从 80ms 降至 15ms。参与双十一大促保障，负责限流与降级方案设计。手机 13800138000，邮箱 zhang@example.com。"; }
    if (typeof analyzeResume === "function") analyzeResume();
  })()`);
  await wait(2200);
  await probe("resume-with-diag");
  await shot("resume");

  /* 3. 简历匹配：选岗位 → 分析 */
  await evalJs(`location.hash = "#/match"`);
  await wait(700);
  await evalJs(`(function(){
    var sel = document.querySelector("#view-app .app-page.active select");
    if (sel && sel.options.length) { sel.selectedIndex = 1; }
    if (typeof runMatch === "function") runMatch();
    else if (typeof analyzeMatch === "function") analyzeMatch();
  })()`);
  await wait(2200);
  await probe("match-with-result");
  await shot("match");

  /* 4. 面经问答：提问 */
  await evalJs(`location.hash = "#/rag"`);
  await wait(700);
  await evalJs(`(function(){
    var inp = document.querySelector("#view-app .app-page.active input[type=text]");
    if (inp) { inp.value = "MySQL 索引为什么会失效？"; }
    if (typeof askRag === "function") askRag();
    else if (typeof sendRag === "function") sendRag();
  })()`);
  await wait(2500);
  await probe("rag-with-answer");
  await shot("rag");

  /* 5. 求职管理：看板 + 复盘 */
  await evalJs(`location.hash = "#/jobs"`);
  await wait(700);
  await evalJs(`(function(){
    document.getElementById("app-company").value = "测试公司";
    document.getElementById("app-role").value = "后端工程师";
    addApplication();
  })()`);
  await wait(900);
  await probe("jobs-board");
  await evalJs(`switchJobsTab("review")`);
  await wait(600);
  await evalJs(`startReview()`);
  await wait(1200);
  await probe("jobs-review");
  await shot("jobs-review");

  /* 6. 题库：考试运行态 */
  await evalJs(`location.hash = "#/quiz"`);
  await wait(600);
  await evalJs(`startQuiz("mix")`);
  await wait(1200);
  const ex = await evalJs(`JSON.stringify({runner: !!document.querySelector(".quiz-runner"), q: (document.querySelector(".quiz-q-text")||{}).textContent})`);
  console.log("QUIZ EXAM:", ex);
  await probe("quiz-exam-running");
  await shot("quiz-exam-running");
  /* 答一题，出现反馈后再探测 */
  await evalJs(`answerQuiz(0)`);
  await wait(900);
  await probe("quiz-exam-answered");
  await shot("quiz-exam-answered");

  /* 7. 学习数据（有记录后） */
  await evalJs(`switchQuizTab("stats")`);
  await wait(800);
  await probe("quiz-stats-with-data");
  await shot("quiz-stats-with-data");

  /* 8. 个人中心 */
  await evalJs(`location.hash = "#/profile"`);
  await wait(900);
  await probe("profile");

  console.log("EXCEPTIONS:", errs.slice(0, 6));
  ws.close();
  process.exit(0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
