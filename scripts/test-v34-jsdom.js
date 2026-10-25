/* v34 jsdom 测试：评估报告纳入「面试状态（在场率 / 专注率）」
 * 覆盖：① 报告状态区块helper 就绪（reportStatusCard / lastReportStatus）
 *       ② 有采样数据时渲染在场率、专注率、采样次数与最近状态
 *       ③ 未开启摄像头时给出中性提示，指标显示占位符 —
 *       ④ 报告页把服务端 status 或本地 camLastSummary 接进区块（源码接线）
 *       ⑤ Markdown 导出包含「面试状态」小节（有数据 / 无数据两种）
 *       ⑥ 后端报告接口返回 status 聚合（源码接线 + 与状态接口同口径的字段）
 *       ⑦ 蓝图风格指标样式（.status-grid / .status-num）存在且零投影
 *       ⑧ 运行期无脚本错误
 * 用法：node scripts/test-v34-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "public", "futuremirror-demo.html"), "utf8");
const srcReport = fs.readFileSync(path.join(ROOT, "frontend", "js", "features", "report.js"), "utf8");
const srcPrompt = fs.readFileSync(path.join(ROOT, "frontend", "js", "features", "prompt-viewer.js"), "utf8");
const srcInterview = fs.readFileSync(path.join(ROOT, "frontend", "js", "features", "interview.js"), "utf8");
const srcTheme = fs.readFileSync(path.join(ROOT, "frontend", "css", "theme.css"), "utf8");
const srcBackend = fs.readFileSync(path.join(ROOT, "backend", "app", "main.py"), "utf8");

let pass = 0,
  fail = 0;
function ok(cond, label) {
  if (cond) {
    pass++;
    console.log("  ✅ " + label);
  } else {
    fail++;
    console.log("  ❌ " + label);
  }
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
  console.log("\n=== v34 jsdom 测试（报告纳入在场率 / 专注率 · Beta 1.1.2）===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  await settle();
  const ev = (expr) => w.eval(expr);

  /* ---------- ① 模块就绪 ---------- */
  console.log("\n① 报告状态区块模块就绪");
  ok(ev("typeof reportStatusCard === 'function'"), "reportStatusCard() 已定义");
  ok(ev("lastReportStatus === null || typeof lastReportStatus === 'object'"), "lastReportStatus 导出当前状态聚合");

  /* ---------- ② 有数据渲染 ---------- */
  console.log("\n② 有采样数据：在场率 / 专注率 / 采样次数");
  const withData = ev(
    `reportStatusCard({count: 4, presence_rate: 75.0, attentive_rate: 66.7, latest: "暂离（未检测到人脸）"})`
  );
  ok(/id="report-status"/.test(withData), "生成 #report-status 区块");
  ok(/75%/.test(withData) && /66\.7%/.test(withData), "在场率 75% / 专注率 66.7% 已渲染");
  ok(/在场率/.test(withData) && /专注率/.test(withData) && /采样次数/.test(withData), "三项指标标签齐全");
  ok(/4 次/.test(withData), "采样次数 4 次已渲染");
  ok(/最近状态「暂离（未检测到人脸）」/.test(withData), "最近状态取自后端 latest");
  ok(/视频帧始终留在浏览器内/.test(withData), "隐私口径：视频帧不出浏览器");
  ok(
    /class="status-grid"/.test(withData) && /class="status-cell"/.test(withData),
    "使用 status-grid / status-cell 结构"
  );

  /* ---------- ③ 无摄像头时的中性提示 ---------- */
  console.log("\n③ 未开启摄像头：中性提示 + 占位符");
  const noData = ev("reportStatusCard(null)");
  ok(/本次面试未开启摄像头，因此没有在场数据/.test(noData), "给出「未开启摄像头」中性提示");
  ok((noData.match(/—/g) || []).length >= 2, "在场率 / 专注率显示占位符 —");
  ok(/0 次/.test(noData), "采样次数显示 0 次");

  /* ---------- ④ 报告页接线 ---------- */
  console.log("\n④ 报告页接线（服务端 status 优先，本地兜底）");
  ok(/\$\{reportStatusCard\(camStatus\)\}/.test(srcReport), "renderReport 注入 reportStatusCard(camStatus)");
  ok(/backendPayload && backendPayload\.status/.test(srcReport), "优先取服务端返回的 status");
  ok(/camLastSummary/.test(srcReport) && /camLastSummary/.test(srcInterview), "后端不可用时回退本地 camLastSummary");
  ok(/camLastSummary = j;/.test(srcInterview), "camSend 成功后缓存聚合结果");

  /* ---------- ⑤ Markdown 导出 ---------- */
  console.log("\n⑤ Markdown 导出含「面试状态」小节");
  ev(`session.turns = [
    {agent: "技术面试官", question: "讲讲你的项目", mode: "normal", notes: "含量化数据",
     answer: "我负责订单服务，通过分库把延迟从 800ms 降到 120ms，QPS 提升 3 倍。"},
    {agent: "HR 面试官", question: "为什么离职", mode: "pressure", notes: "稳定",
     answer: "希望做更有技术深度的事情，同时团队业务在快速增长，能放大我的经验。"}
  ]`);
  const mdWith = ev(
    `(function(){ lastReportStatus = {count: 4, presence_rate: 75.0, attentive_rate: 66.7, latest: "暂离（未检测到人脸）"}; return reportToMarkdown(); })()`
  );
  ok(/## 面试状态（摄像头在场检测）/.test(mdWith), "导出小节标题存在");
  ok(/在场率：75%/.test(mdWith) && /专注率：66\.7%/.test(mdWith), "Markdown 含在场率 / 专注率");
  ok(/采样次数：4 次/.test(mdWith), "Markdown 含采样次数");
  const mdWithout = ev(`(function(){ lastReportStatus = null; return reportToMarkdown(); })()`);
  ok(/本次面试未开启摄像头，无在场数据/.test(mdWithout), "无摄像头时 Markdown 给出中性说明");

  /* ---------- ⑥ 后端接线 ---------- */
  console.log("\n⑥ 后端报告接口返回 status 聚合");
  ok(/result\["status"\] = _status_summary\(db, interview_id\)/.test(srcBackend), "gen_report 附带 _status_summary");
  ok(
    /"presence_rate": presence_rate/.test(srcBackend) && /"attentive_rate": attentive_rate/.test(srcBackend),
    "聚合字段含在场率 / 专注率"
  );

  /* ---------- ⑦ 视觉：蓝图指标样式 ---------- */
  console.log("\n⑦ 蓝图风格指标样式");
  ok(
    /\.status-grid\s*\{/.test(srcTheme) && /\.status-num\s*\{/.test(srcTheme),
    "theme.css 含 .status-grid / .status-num"
  );
  ok(/\.status-grid\s*\{[^}]*border: 1px solid var\(--line\)/.test(srcTheme), "指标容器用发丝线描边");
  ok(!/\.status-(grid|cell|num|cap)\s*\{[^}]*box-shadow/.test(srcTheme), "指标样式零投影");

  /* ---------- ⑧ 运行期无错误 ---------- */
  console.log("\n⑧ 运行期无脚本错误");
  ok(errors.length === 0, errors.length ? "出现脚本错误：" + errors[0] : "无 jsdom 脚本错误");

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  if (fail) process.exitCode = 1;
  dom.window.close();
}
