/* v47 · 启动守卫断言
 *
 * 起因：线上「开发者模式进不去」——按钮点下去毫无反应。
 * 真相不是功能坏了，而是单文件演示包约 0.9 MB 全内联、主程序位于文档末尾：
 * 网络较慢时（GitHub Pages 冷启动实测约 20 秒）HTML 已经把按钮画出来了，
 * 主程序却还没执行，此时点击内联 onclick 会因函数未定义而静默失败。
 *
 * 守卫要守住四件事：
 *   ① 未就绪期间把状态挂在 html[data-boot] 上（可被样式看见，也可被这里断言）；
 *   ② 拦住这期间的点击，不让它假装成功；
 *   ③ 就绪后自动补发那一次点击，用户不必点第二遍；
 *   ④ 就绪后彻底退出，不再干预任何交互。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) {
    pass++;
    console.log("  ✅ " + name);
  } else {
    fail++;
    console.log("  ❌ " + name);
  }
}

const indexSrc = rd("frontend/index.html");
const pagesCss = rd("frontend/css/pages.css");
const demoHtml = rd("public/futuremirror-demo.html");

/* ---------- 取出守卫脚本本体（index.html 内联，先于样式之后的 head 末尾） ---------- */
const guardSrc = (() => {
  const blocks = [...indexSrc.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  return blocks.find((b) => b.includes("v47 · 启动守卫")) || "";
})();

console.log("\n① 守卫是否存在、挂在哪里");
ok(!!guardSrc, "index.html 内含 v47 启动守卫脚本");
ok(
  indexSrc.indexOf("v47 · 启动守卫") > indexSrc.indexOf('href="css/pages.css"'),
  "守卫位于样式之后（样式先可用，提示不会裸奔）"
);
ok(indexSrc.indexOf("v47 · 启动守卫") < indexSrc.indexOf("</head>"), "守卫位于 head 内（先于 body 渲染就生效）");
ok(/base = "loading"/.test(guardSrc) && /set\(base\)/.test(guardSrc), "启动即打上 data-boot=loading");
ok(document_ok(guardSrc), "守卫自带注释说明后果，而不是只有一行代码");

function document_ok(s) {
  return s.includes("静默失败") && s.includes("补发");
}

console.log("\n② 拦截与放行");
ok(/addEventListener\("click", onClick, true\)/.test(guardSrc), "以捕获阶段监听点击（先于内联 onclick）");
ok(/closest\("\[onclick\]"\)/.test(guardSrc), "只拦「需要主程序才能执行」的内联 onclick 元素");
ok(
  /e\.preventDefault\(\)/.test(guardSrc) && /e\.stopPropagation\(\)/.test(guardSrc),
  "拦住点击：既不默认行为也不继续冒泡"
);
ok(/if \(window\.__fmReady\) return;/.test(guardSrc), "就绪后直接放行（守卫不再参与）");

console.log("\n③ 解除与补发");
ok(
  /addEventListener\("DOMContentLoaded", ready\)/.test(guardSrc),
  "DOMContentLoaded 解除（主程序在文档末尾，DCL 紧随其后）"
);
ok(/addEventListener\("load", ready\)/.test(guardSrc), "load 兜底解除（避免个别环境 DCL 时机差异）");
ok(
  /if \(window\.__fmReady\) return;/.test(guardSrc) && /window\.__fmReady = true/.test(guardSrc),
  "解除是幂等的（只生效一次）"
);
ok(/removeEventListener\("click", onClick, true\)/.test(guardSrc), "解除时摘掉监听，不留残余");
ok(
  /el\.click\(\)/.test(guardSrc) && /document\.contains\(el\)/.test(guardSrc),
  "就绪后补发被拦的那一次点击（元素已不在 DOM 则跳过）"
);
ok(/setTimeout\([\s\S]{0,240}20000\)/.test(guardSrc), "20 秒仍未就绪则升级提示（给出可行动建议）");

console.log("\n④ 反馈样式（三态文案 + 不挡操作）");
["loading", "slow", "wait"].forEach((s) => {
  ok(pagesCss.includes('html[data-boot="' + s + '"]::before'), "data-boot=" + s + " 有可见提示");
});
ok(
  /html\[data-boot="loading"\]::before,[\s\S]{0,400}content: "页面载入中 · 交互稍后可用"/.test(pagesCss),
  "默认文案说明「还在载入」"
);
ok(pagesCss.includes("这次点击已记下，就绪后自动执行"), "被拦时明确回一句「已记下」，不是装作没听见");
ok(pagesCss.includes("载入较慢 · 可刷新页面，或改用国内镜像访问"), "超时后给可执行建议");
ok(/height: 2px/.test(pagesCss) && /background: var\(--brand\)/.test(pagesCss), "顶部 2px 朱红进度条（蓝图线语言）");
ok(/pointer-events: none/.test(pagesCss), "提示条不吃点击");
ok(/prefers-reduced-motion: reduce\)[\s\S]{0,200}animation: none/.test(pagesCss), "减弱动效下不呼吸动画");

console.log("\n⑤ 构建产物一致性");
ok(demoHtml.includes("v47 · 启动守卫"), "演示包内含守卫");
ok(demoHtml.includes('data-boot="loading"'), "演示包保留启动态标记");
ok(demoHtml.includes("fm-boot-bar"), "演示包内含进度条样式");
ok(demoHtml.length > 900 * 1024, "演示包仍为单文件全内联（守卫针对的正是这个形态）");

/* ---------- ⑥ 行为：在隔离环境里真跑一遍 ---------- */
(async () => {
  const mini = new JSDOM(
    `<!doctype html><html><head></head><body>
       <button id="needs-js" onclick="window.__clicks = (window.__clicks || 0) + 1">需要主程序</button>
       <button id="plain">纯按钮</button>
     </body></html>`,
    {
      url: "https://example.com/",
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole: new VirtualConsole(),
    }
  );
  const w = mini.window;
  const doc = w.document;
  const mkEvent = (type, opts) => new w.Event(type, Object.assign({ bubbles: true, cancelable: true }, opts || {}));

  w.eval(guardSrc);

  console.log("\n⑥ 未就绪期间的用户动作");
  ok(doc.documentElement.getAttribute("data-boot") === "loading", "守卫启动后 data-boot=loading");
  const needsJs = doc.getElementById("needs-js");
  const e1 = mkEvent("click");
  needsJs.dispatchEvent(e1);
  ok(e1.defaultPrevented === true, "点击需要主程序的按钮被拦下（不再静默失败）");
  ok(w.__clicks === undefined, "拦下时确实没有执行 onclick（函数此刻还不存在）");
  ok(doc.documentElement.getAttribute("data-boot") === "wait", "状态切到 wait：告诉用户「已记下」");
  const e2 = mkEvent("click");
  doc.getElementById("plain").dispatchEvent(e2);
  ok(e2.defaultPrevented === false, "不依赖主程序的元素照常放行");

  console.log("\n⑦ 就绪瞬间");
  doc.dispatchEvent(mkEvent("DOMContentLoaded"));
  ok(w.__fmReady === true, "就绪标记置位");
  ok(doc.documentElement.getAttribute("data-boot") === "ready", "状态切到 ready，提示撤下");
  await new Promise((r) => setTimeout(r, 120));
  ok(w.__clicks === 1, "被拦的那一次点击已自动补发（onclick 执行 1 次）");
  await new Promise((r) => setTimeout(r, 120));
  ok(w.__clicks === 1, "补发只发生一次，不会重复触发");

  console.log("\n⑧ 就绪后不再干预");
  const e3 = mkEvent("click");
  needsJs.dispatchEvent(e3);
  ok(e3.defaultPrevented === false, "就绪后点击正常放行");
  ok(w.__clicks === 2, "就绪后点击照常执行（补发没有污染正常点击）");
  doc.dispatchEvent(mkEvent("DOMContentLoaded"));
  ok(w.__fmReady === true && doc.documentElement.getAttribute("data-boot") === "ready", "重复解除不改变状态（幂等）");

  /* ---------- ⑨ 整包回归：守卫不能挡住真正的开发者模式 ---------- */
  const dom = new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
  });
  const W = dom.window;
  await new Promise((r) => setTimeout(r, 200));

  console.log("\n⑨ 整包回归");
  ok(W.__fmReady === true, "整包载入后守卫已解除");
  ok(W.document.documentElement.getAttribute("data-boot") === "ready", "整包状态为 ready");
  ok((W.document.querySelector(".view.active") || {}).id === "view-landing", "首屏仍是落地页（守卫不影响路由）");
  const gate = W.document.getElementById("eval-gate-modal");
  ok(!!gate && gate.hidden === true, "开发者模式密码框初始关闭");
  W.openEvaluatorGate();
  ok(gate.hidden === false, "点开发者模式 → 密码框打开");
  const codeEl = W.document.querySelector("#eval-gate-modal code");
  const pw = codeEl ? codeEl.textContent.trim() : "";
  ok(pw.length > 0, "密码框内可见提示密码（文档与代码同源）");
  W.document.getElementById("eval-password").value = pw;
  W.submitEvalPassword();
  ok((W.document.querySelector(".view.active") || {}).id === "view-evaluator", "正确密码 → 进入开发者模式");
  ok(
    W.document.querySelectorAll("#view-evaluator section, #view-evaluator .eval-section").length >= 10,
    "开发者模式内容确实渲染出来了"
  );
  W.close();
  mini.window.close();

  console.log("\n结果：" + pass + " 通过，" + fail + " 失败");
  process.exit(fail ? 1 : 0);
})();
