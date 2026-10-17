/* v15 jsdom 功能测试：工作台精简与互动升级
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v15-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => {
  const msg = (e && e.message) || String(e);
  // jsdom 环境限制（scrollTo 等未实现 API）不属于脚本错误
  if (!/^Not implemented:/.test(msg)) errors.push("jsdomError: " + msg);
});
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));

const dom = new JSDOM(html, {
  url: "https://example.com/",          // 非 opaque origin，避免 sessionStorage SecurityError
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;
const { document } = window;

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label); }
}

/* 等待脚本初始化完成（今日推荐 IIFE 在脚本末尾同步执行，load 时已渲染） */
window.addEventListener("load", () => {});

setTimeout(runTests, 300);

function runTests() {
  console.log("\n=== v15 jsdom 功能测试 ===");

  /* 1. 脚本加载无错误 */
  ok(errors.length === 0, "页面脚本加载无错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

  /* 2. 登录态（供点击跳转测试使用） */
  window.eval("currentUser = { id: 'u_test', email: 't@t.com', name: '测试用户' }");

  /* 3. 今日推荐岗位渲染 */
  const picksBox = document.getElementById("today-picks");
  ok(!!picksBox, "#today-picks 容器存在");
  let picks = picksBox.querySelectorAll(".today-pick");
  ok(picks.length === 4, `今日推荐渲染 4 个岗位卡片（实际 ${picks.length}）`);
  const first = picks[0];
  ok(!!first.querySelector(".today-pick-name"), "推荐卡片含岗位名称");
  ok(!!first.querySelector(".today-pick-salary"), "推荐卡片含薪资");
  ok(!!first.querySelector(".today-pick-desc"), "推荐卡片含简介");
  ok(!!first.querySelector(".today-pick-cta"), "推荐卡片含 CTA");
  ok(!!first.getAttribute("onclick") && first.getAttribute("onclick").includes("startInterviewFor"), "推荐卡片 onclick 调用 startInterviewFor");

  /* 4. 换一批：重新渲染仍为 4 个，且日志有记录 */
  window.eval("renderTodayPicks()");
  picks = picksBox.querySelectorAll(".today-pick");
  ok(picks.length === 4, `「换一批」后仍渲染 4 个卡片（实际 ${picks.length}）`);
  const devLog = document.getElementById("dev-log");
  ok(!!devLog && devLog.textContent.includes("今日推荐岗位已刷新"), "刷新后诊断日志有记录");

  /* 5. 点击推荐卡片 → 跳转面试页 + 目标岗位自动选中（hashchange 异步，稍后断言） */
  const nameOf = (el) => el.querySelector(".today-pick-name").textContent.trim();
  const target = picks[0];
  const targetName = nameOf(target);
  const jdSel = document.getElementById("jd-select");
  ok(jdSel.options.length > 1, `jd-select 选项已填充（${jdSel.options.length} 项）`);
  target.click();
  const career = window.eval(`CAREER_DB.find(c => c.name === ${JSON.stringify(targetName)})`);
  ok(jdSel.value === career.id, `目标岗位自动选中：${targetName}（select=${jdSel.value}）`);
  ok(document.getElementById("jd-preview") && !document.getElementById("jd-preview").hidden, "JD 预览已渲染");

  /* 6. 快速入口：6 张卡片 + 箭头 */
  const qe = document.querySelectorAll(".quick-entries-hero .quick-entry");
  ok(qe.length === 6, `快速入口 6 张卡片（实际 ${qe.length}）`);
  ok([...qe].every(e => e.querySelector(".qe-arrow")), "每张快速入口含滑入箭头");
  ok([...qe].every(e => e.getAttribute("onclick") && e.getAttribute("onclick").includes("switchTab")), "每张快速入口可点击跳转");

  /* 7. 数据看板：4 张可点击 + 右上箭头 */
  const stats = document.querySelectorAll(".stats-row-clickable .stat-card");
  ok(stats.length === 4, `数据看板 4 张卡片（实际 ${stats.length}）`);
  ok([...stats].every(s => s.getAttribute("onclick") && s.getAttribute("onclick").includes("switchTab")), "每张看板卡可点击跳转");
  ok([...stats].every(s => s.querySelector(".stat-arrow")), "每张看板卡含 → 箭头");
  ok(!!document.getElementById("stat-careers-d"), "岗位计数 id 保留（动态更新不失效）");

  /* 8. Agent 圆桌：4 可点击 + 观察员仅提示 */
  const agents = document.querySelectorAll("#agents .agent");
  ok(agents.length === 5, `Agent 圆桌 5 张卡片（实际 ${agents.length}）`);
  const clickable = [...agents].filter(a => a.getAttribute("onclick"));
  ok(clickable.length === 4, `4 张 Agent 卡可点击跳转（实际 ${clickable.length}）`);
  const observer = [...agents].find(a => a.textContent.includes("观察员"));
  ok(!!observer && !observer.getAttribute("onclick") && !!observer.getAttribute("title"), "观察员卡仅 title 提示、不可点击");

  /* 9. dashboard 项目材料已移除 */
  const dash = document.querySelector('.app-page[data-page="dashboard"]');
  ok(!dash.querySelector(".materials"), "dashboard 项目材料区块已删除");
  const materialWords = ["代码仓库", "演示视频", "技术文档", "在线演示", "测试账号"];
  const leakEls = [...dash.querySelectorAll("button, a")].filter(el =>
    materialWords.some(t => el.textContent.includes(t)));
  ok(leakEls.length === 0, `dashboard 无材料类按钮/链接${leakEls.length ? " → 残留: " + leakEls.map(e => e.textContent.trim()).join(" | ") : ""}`);

  /* 10. 开发者模式交付材料保留 */
  const evalView = document.getElementById("view-evaluator");
  ok(!!evalView, "开发者模式视图存在");
  ok(evalView.textContent.includes("交付材料"), "交付材料区块保留在开发者模式");
  ok(evalView.querySelectorAll(".eval-material").length > 0, `交付材料条目完整（${evalView.querySelectorAll(".eval-material").length} 项）`);

  /* 11. 圆桌卡片点击跳转（教练 → 报告页） */
  const coach = [...agents].find(a => a.textContent.includes("教练"));

  /* 12. 新增 CSS 选择器就位 */
  const cssOk = [".today-pick:hover .today-pick-cta", ".quick-entries-hero .quick-entry:hover .qe-arrow",
    ".stats-row-clickable .stat-card:hover .stat-arrow", ".agent:hover .agent-avatar"].every(sel => html.includes(sel));
  ok(cssOk, "v15 新增 hover 动效 CSS 全部就位");

  /* 13. 等待 hashchange 落地：先断言面试页，再点教练断言报告页 */
  setTimeout(() => {
    ok(document.querySelector('.app-page[data-page="interview"]').classList.contains("active"), "点击推荐卡片后面试页激活");
    coach.click();
    setTimeout(() => {
      ok(document.querySelector('.app-page[data-page="report"]').classList.contains("active"), "点击教练卡片跳转评估报告页");
      ok((window.location.hash || "").includes("report"), `hash 已更新（${window.location.hash}）`);
      console.log(`\n结果：${pass} 通过，${fail} 失败`);
      process.exit(fail ? 1 : 0);
    }, 200);
  }, 200);
}
