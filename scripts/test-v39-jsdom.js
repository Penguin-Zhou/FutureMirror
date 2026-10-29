/* v39 回归测试：反馈/容错/模式提示/移动端/空状态/无障碍/导出/术语降噪
 * 覆盖：
 *   ① 登录安全警告（醒目、提示勿用真实密码）
 *   ② ⌘K 命令面板顶栏入口（__openCommandPalette 暴露 + 按钮存在）
 *   ③ 投递看板空态引导（无记录时给出「去真实岗位页添加」）
 *   ④ 学习计划空态（无面试数据时不伪装专属计划）
 *   ⑤ 报告页：sr-only 数值表 + CSV 导出函数 + 免责/可信声明
 *   ⑥ 网络监听：initNetworkMonitor 存在、离线态切换状态胶囊
 *   ⑦ 无障碍：导航激活态带 aria-current
 *   ⑧ 术语降噪：标题/描述不再出现「多 Agent 驱动的」字样
 *   ⑨ 个人数据导出：exportUserData 覆盖全部 fm_/g_ 键
 * 用法：node scripts/test-v39-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const DEMO = path.join(ROOT, "public", "futuremirror-demo.html");
if (!fs.existsSync(DEMO)) {
  console.error("❌ 未找到 public/futuremirror-demo.html，请先运行 node scripts/build-demo.js");
  process.exit(1);
}
const html = fs.readFileSync(DEMO, "utf8");

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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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
  console.log("\n=== v39：反馈/容错/模式提示/空状态/无障碍/导出/术语降噪 ===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  const d = w.document;
  await settle();
  w.eval('currentUser = { id: "v39test", name: "测试用户", email: "v39@example.com" };');

  /* ---------- ① 登录安全警告 ---------- */
  console.log("\n① 登录安全警告");
  const warn = d.querySelector(".auth-warn");
  ok(!!warn, "登录弹窗含有醒目安全警告块");
  ok(/请勿使用真实密码/.test(warn ? warn.textContent : ""), "警告明确提示「请勿使用真实密码」");
  ok(/演示级/.test(warn ? warn.textContent : ""), "说明这是演示级登录系统");

  /* ---------- ② ⌘K 命令面板入口 ---------- */
  console.log("\n② ⌘K 命令面板入口");
  ok(!!d.querySelector(".kbd-hint"), "顶栏存在「⌘K 命令面板」入口按钮");
  ok(typeof w.__openCommandPalette === "function", "__openCommandPalette 已暴露给顶栏按钮调用");

  /* ---------- ③ 投递看板空态 ---------- */
  console.log("\n③ 投递看板空态引导");
  w.eval('store.set("fm_apps", []); renderBoard();');
  const cols = d.getElementById("board-columns");
  ok(/投递看板还是空的/.test(cols ? cols.innerHTML : ""), "看板无记录时显示空态引导");
  ok(/去真实岗位页添加/.test(cols ? cols.innerHTML : ""), "空态引导提供「去真实岗位页添加」入口");

  /* ---------- ④ 学习计划：默认诚实展示通用基线计划 ---------- */
  console.log("\n④ 学习计划基线计划");
  w.eval('store.set("fm_plan", null); renderPlanPage();');
  const grid = d.getElementById("lp-grid");
  ok((grid ? grid.querySelectorAll(".lp-day").length : 0) === 7, "学习计划默认渲染 7 张日卡（通用基线）");
  ok(
    /通用基线计划|通用示例/.test(d.querySelector("#lp-src") ? d.querySelector("#lp-src").textContent : ""),
    "明确标注为通用基线/示例（非个人定制），不伪装专属计划"
  );

  /* ---------- ⑤ 报告页 sr-only 表 + CSV 导出 ---------- */
  console.log("\n⑤ 报告页：无障碍数值表 + CSV 导出");
  ok(typeof w.exportReportCsv === "function", "exportReportCsv 已注入全局");
  // 构造一份结构合法的最小面试会话，验证报告渲染会带 sr-only 数值表
  w.eval(`session = {
    turns: [
      { question: "自我介绍", answer: "我叫张三，三年后端经验，主导订单系统，QPS 从 1k 提升到 5k。", agent: "技术" },
      { question: "项目难点", answer: "最大挑战是库存一致性，通过 Redis 分布式锁解决，最终零超卖。", agent: "技术" },
      { question: "压力题", answer: "确实是我考虑不周，我会先复盘再改进，下次提前压测。", agent: "观察员", mode: "pressure" }
    ],
    codeScore: 0.85
  };`);
  try {
    await w.eval("renderReport(true).catch(function(){});");
    await wait(80);
    const reportRoot = d.querySelector(".app-page[data-page='report']") || d.body;
    ok(/sr-only/.test(reportRoot.innerHTML), "报告页含 sr-only 维度数值表（色弱/读屏可访问）");
  } catch (e) {
    ok(false, "renderReport 渲染未抛错（" + (e && e.message) + "）");
  }

  /* ---------- ⑥ 网络监听 ---------- */
  console.log("\n⑥ 网络在线/离线监听");
  ok(typeof w.initNetworkMonitor === "function", "initNetworkMonitor 已注入全局");
  const pill = d.getElementById("status-pill");
  // 模拟离线事件
  try {
    w.eval("if (typeof navigator !== 'undefined') {}");
    const ev = new w.Event("offline");
    w.dispatchEvent(ev);
    await wait(30);
    ok(pill && pill.classList.contains("offline"), "触发 offline 事件后状态胶囊切换为 offline 态");
    w.dispatchEvent(new w.Event("online"));
    await wait(30);
    ok(pill && !pill.classList.contains("offline"), "恢复 online 后 offline 态清除");
  } catch (e) {
    ok(false, "离线事件模拟未抛错（" + (e && e.message) + "）");
  }

  /* ---------- ⑦ 导航 aria-current ---------- */
  console.log("\n⑦ 导航无障碍：aria-current");
  w.eval("navTo('career');");
  await wait(40);
  const activeSb = d.querySelector('.sb-item[data-nav="career"]');
  ok(activeSb && activeSb.getAttribute("aria-current") === "page", "切换到 career 后侧栏该项带 aria-current=page");

  /* ---------- ⑧ 术语降噪 ---------- */
  console.log("\n⑧ 术语降噪");
  ok(!/多 Agent 驱动的/.test(d.title), "页面标题已去除「多 Agent 驱动的」工程术语");
  const metaDesc = d.querySelector('meta[name="description"]');
  ok(metaDesc && !/多 Agent 驱动的/.test(metaDesc.content), "meta description 已去除「多 Agent 驱动的」");

  /* ---------- ⑨ 个人数据导出覆盖全部键 ---------- */
  console.log("\n⑨ 个人数据导出");
  w.eval('store.set("fm_profile", { mbti: "ESTJ" }, true); store.set("g_theme_mode", "auto", true);');
  // 拦截 Blob/URL 以验证导出的快照确实包含 fm_/g_ 键
  let captured = null;
  const RealBlob = w.Blob;
  w.Blob = function (parts, opts) {
    captured = String(parts[0]);
    return new RealBlob(parts, opts);
  };
  try {
    w.eval("exportUserData();");
  } catch (e) {}
  ok(
    captured && /fm_profile/.test(captured) && /g_theme_mode/.test(captured),
    "导出 JSON 快照包含 fm_ 与 g_ 个人数据键"
  );

  /* ---------- 运行期无脚本错误 ---------- */
  console.log("\n⚠ 运行期错误检查");
  ok(
    errors.length === 0,
    "运行期无未捕获脚本错误（" + errors.length + " 条）" + (errors.length ? "：" + errors.slice(0, 3).join(" | ") : "")
  );

  console.log(`\n⑥ v39 结果：${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
}
