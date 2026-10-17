/* ============================================================
 * test-frontend-modules.js —— 验证 frontend/ 模块版可独立启动
 *   脚本内置一个静态 HTTP 服务（proper origin，sessionStorage 可用），
 *   用 jsdom 从 http:// 真实加载 frontend/index.html
 *   （27 个外部 script + 3 张 link），断言：
 *   全部脚本执行无错、应用完成初始化、路由/题库/AI 助手可用。
 *   与 test-v*-jsdom.js（单文件版）互补：这里证明「拆开」后行为不减。
 * ============================================================ */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.resolve(__dirname, "..");
const FE = path.join(ROOT, "frontend");
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json" };

let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log("  ✅", name); }
  else { fail++; console.log("  ❌", name); }
};

/* ---------- 静态服务 ---------- */
const server = http.createServer((req, res) => {
  const p = path.join(FE, decodeURIComponent(req.url.split("?")[0]) === "/" ? "index.html" : decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(FE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404); res.end("nf"); return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});

server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port;
  const jsErrors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => {
    const m = e.message || "";
    if (!/^Not implemented:/.test(m) && !/Could not parse CSS/.test(m)) jsErrors.push(m);
  });
  vc.on("error", (...a) => jsErrors.push(a.join(" ")));

  /* 脚本执行前打桩：jsdom 缺失的浏览器 API */
  const beforeParse = w => {
    w.matchMedia = q => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    w.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { try { this.cb([{ isIntersecting: true, target: el }], this); } catch (e) {} }
      unobserve() {} disconnect() {}
    };
  };

  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/index.html`, {
    resources: "usable", runScripts: "dangerously", pretendToBeVisual: true,
    virtualConsole: vc, beforeParse,
  });
  const w = dom.window;

  /* 等加载期初始化（init / bootstrapV10）跑完 */
  setTimeout(() => runChecks(w, jsErrors), 1000);
});

function runChecks(w, jsErrors) {
  console.log("\n-- A. 脚本加载与全局符号（27 模块全部就位） --");
  ok(jsErrors.length === 0, "全部外部脚本执行无未捕获错误" + (jsErrors.length ? "：" + jsErrors[0].slice(0, 200) : ""));
  /* const/let 全局是 Lexical 绑定，不挂 window——用 eval 探活 */
  const g = expr => w.eval(expr);
  ok(g("typeof applyRoute === 'function'"), "router 模块已加载（applyRoute）");
  ok(g("typeof store === 'object' && typeof store.get === 'function'"), "store 模块已加载");
  ok(g("typeof saveProfile === 'function'"), "auth 模块已加载（saveProfile）");
  ok(g("typeof renderQuizPage === 'function'"), "quiz 模块已加载（renderQuizPage）");
  ok(g("typeof toggleAiAssistant === 'function'"), "assistant 模块已加载（toggleAiAssistant）");
  ok(g("typeof fmApi === 'object'"), "api 模块已加载（fmApi）");
  ok(g("Array.isArray(QUIZ_BANK) && QUIZ_BANK.length === 24"), "题库数据已加载（24 题）");
  ok(g("Array.isArray(KB)"), "RAG 知识库已加载");
  ok(g("typeof CAREER_DB !== 'undefined'"), "职业数据库已加载");
  ok(g("typeof QUESTION_BANK !== 'undefined'"), "面试题库已加载");
  ok(g("typeof bootApp === 'function' && typeof bootstrapV10 === 'undefined'"), "boot 模块就位（bootstrap 为 IIFE 不留痕）");

  console.log("\n-- B. 应用初始化（init + bootstrapV10 已跑） --");
  const foot = w.document.querySelector(".sb-footer");
  ok(foot && foot.textContent.includes("beta1.0"), "侧栏版本号 beta1.0（启动流程完整）");
  ok(w.document.querySelectorAll(".app-page[data-page]").length === 10, "10 个应用页面容器就位");
  ok(w.document.querySelectorAll(".app-tabbar .tabbar-item").length === 9, "底部 Tab 9 项就位");
  ok(!!w.document.getElementById("ai-fab"), "AI 悬浮球已注入 DOM");
  ok(w.document.getElementById("ai-fab").className.includes("ai-fab"), "悬浮球承载 ai-fab 样式类");
  ok(!!w.document.getElementById("quiz-pane-learn"), "题库页学习面板容器就位");
  ok(!!w.document.getElementById("quiz-pane-wrong"), "题库页错题本面板容器就位");
  ok(!!w.document.getElementById("llm-status"), "LLM 状态徽章就位（后端适配）");

  console.log("\n-- C. 路由切换（跨模块调用） --");
  w.location.hash = "#/quiz";
  setTimeout(() => {
    ok(w.document.querySelector('.app-page[data-page="quiz"]').classList.contains("active"), "hash 路由切到题库页");
    ok(w.document.querySelectorAll("#quiz-pane-learn .quiz-cat").length === 5, "学习面板渲染 5 个分类");
    ok(w.document.querySelectorAll("#quiz-pane-learn .quiz-cat-lock").length === 3, "游客态 3 个 VIP 分类上锁");
    w.location.hash = "#/profile";
    setTimeout(() => {
      ok(w.document.querySelector('.app-page[data-page="profile"]').classList.contains("active"), "hash 路由切到个人中心");
      ok(!!w.document.getElementById("vip-card-slot"), "个人中心 VIP 卡槽就位");

      console.log("\n-- D. AI 助手开合（assistant 模块跨 v20+v21） --");
      w.eval("toggleAiAssistant()");
      ok(w.document.body.classList.contains("ai-open"), "打开助手同步 body.ai-open");
      ok(!!w.document.getElementById("ai-assistant-panel"), "助手面板存在");
      w.eval("toggleAiAssistant()");
      ok(!w.document.body.classList.contains("ai-open"), "关闭助手移除 body.ai-open");

      console.log(`\n结果：${pass} 通过 / ${fail} 失败（模块版独立启动验证）`);
      server.close();
      process.exit(fail ? 1 : 0);
    }, 250);
  }, 250);
}
