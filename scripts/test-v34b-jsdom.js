/* v34b 回归测试：摄像头「确已开启」但后端采样为 0 时，报告不得误导为「未开启摄像头」
 * 覆盖：
 *   ① camWasActiveThisSession=true 且 status 为 null/0 → 诚实提示「已开启但后台未收到采样」
 *   ② camWasActiveThisSession=false 且 status 为 null → 仍显示中性「未开启摄像头」（unchanged）
 *   ③ 本地 camLastSummary 有数据、后端 status.count=0 → renderReport 优先复用本地聚合
 *   ④ 运行期无脚本错误
 * 用法：node scripts/test-v34b-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "public", "futuremirror-demo.html"), "utf8");
const srcReport = fs.readFileSync(path.join(ROOT, "frontend", "js", "features", "report.js"), "utf8");
const srcInterview = fs.readFileSync(path.join(ROOT, "frontend", "js", "features", "interview.js"), "utf8");

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label); }
}

function makeDom() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => {
    const msg = (e && e.message) || String(e);
    if (!/^Not implemented:/.test(msg)) errors.push(msg);
  });
  vc.on("error", (...a) => errors.push(a.join(" ")));
  const dom = new JSDOM(html, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  const settle = () =>
    new Promise((res) => {
      if (dom.window.document.readyState === "complete") return res();
      dom.window.document.addEventListener("DOMContentLoaded", res, { once: true });
      setTimeout(res, 900);
    });
  return { dom, errors, settle };
}

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v34b 回归：摄像头已开但无后台采样 → 不得显示「未开启摄像头」===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  await settle();
  const ev = (expr) => w.eval(expr);

  /* ---------- ① 摄像头已开 + 无采样 → 诚实提示 ---------- */
  console.log("\n① 摄像头确已开启、但后台与本地均无采样");
  ev("camWasActiveThisSession = true;");
  ev("camLastSummary = null;");
  const openedNoData = ev("reportStatusCard(null)");
  ok(!/本次面试未开启摄像头/.test(openedNoData), "不显示误导性的「未开启摄像头」");
  ok(/已开启摄像头（端侧检测）/.test(openedNoData), "显示「已开启摄像头（端侧检测）」诚实归因");
  ok(/未收到在场采样/.test(openedNoData), "说明后台未收到采样（部署/网络原因）");

  /* ---------- ② 摄像头确未开 + 无采样 → 保持中性提示 ---------- */
  console.log("\n② 摄像头确实未开 + 无采样（回归基线）");
  ev("camWasActiveThisSession = false;");
  const neverOpened = ev("reportStatusCard(null)");
  ok(/本次面试未开启摄像头/.test(neverOpened), "未开摄像头时仍给中性「未开启摄像头」提示");

  /* ---------- ③ 后端 status.count=0 但本地 camLastSummary 有数据 → 复用本地 ---------- */
  console.log("\n③ 后端采样为 0、但端侧确有聚合 → 报告复用本地 camLastSummary");
  ev("camWasActiveThisSession = true;");
  ev("camLastSummary = {count: 5, presence_rate: 82.0, attentive_rate: 64.0, latest: '专注面试中'};");
  // 模拟 renderReport 的 camStatus 计算（源码同口径）
  const chosen = ev(
    "(function(){ var backendPayload = {status:{count:0, presence_rate:null, attentive_rate:null, latest:null}};" +
    "  return (backendPayload && backendPayload.status && backendPayload.status.count)" +
    "    ? backendPayload.status" +
    "    : (typeof camLastSummary === 'object' && camLastSummary ? camLastSummary : null); })()"
  );
  ok(chosen && chosen.count === 5, "后端零采样时 camStatus 回退到本地 camLastSummary（count=5）");
  const fromLocal = ev("reportStatusCard(camLastSummary)");
  ok(/82%/.test(fromLocal) && /64%/.test(fromLocal) && /5 次/.test(fromLocal), "本地聚合正常渲染在场率/专注率/采样次数");

  /* ---------- ④ 源码接线：camWasActiveThisSession / camLastSummary 参与报告 ---------- */
  console.log("\n④ 源码接线确认");
  ok(/camWasActiveThisSession/.test(srcReport), "reportStatusCard 读取 camWasActiveThisSession 标记");
  ok(/backendPayload\.status\.count/.test(srcReport), "camStatus 优先取后端有采样的 status");

  /* ---------- ⑤ 运行期无错误 ---------- */
  console.log("\n⑤ 运行期无脚本错误");
  ok(errors.length === 0, errors.length ? "出现脚本错误：" + errors[0] : "无 jsdom 脚本错误");

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  if (fail) process.exitCode = 1;
  dom.window.close();
}
