/* v21 jsdom 功能测试：AI 悬浮球拖拽贴边冻结（位置记忆）+ 移动端页面美化
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v21-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => {
  const msg = (e && e.message) || String(e);
  if (!/^Not implemented:/.test(msg)) errors.push("jsdomError: " + msg);
});
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));

const dom = new JSDOM(html, {
  url: "https://example.com/",
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

/* 指针事件助手（jsdom 无 PointerEvent 构造器，用 MouseEvent 承载坐标 + pointerId） */
function ptr(type, x, y) {
  const ev = new window.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, button: 0 });
  Object.defineProperty(ev, "pointerId", { value: 1 });
  return ev;
}
function dragFab(x1, y1, x2, y2) {
  const fab = document.getElementById("ai-fab");
  fab.dispatchEvent(ptr("pointerdown", x1, y1));
  fab.dispatchEvent(ptr("pointermove", (x1 + x2) / 2, (y1 + y2) / 2));
  fab.dispatchEvent(ptr("pointermove", x2, y2));
  fab.dispatchEvent(ptr("pointerup", x2, y2));
}
function clickFab() {
  document.getElementById("ai-fab").dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}
function cssFlat() {
  return [...document.styleSheets].map(s => {
    try { return [...s.cssRules].map(r => r.cssText).join("\n"); } catch (e) { return ""; }
  }).join("\n");
}
function cssMedia(cond) {
  return [...document.styleSheets].map(s => {
    try {
      return [...s.cssRules].filter(r => r.type === 4 && r.conditionText === cond).map(r => r.cssText).join("\n");
    } catch (e) { return ""; }
  }).join("\n");
}

setTimeout(runTests, 300);

function runTests() {
  console.log("\n=== v21 jsdom 功能测试（悬浮球拖拽冻结 + 移动端美化）===");
  const fab = document.getElementById("ai-fab");
  const panel = document.getElementById("ai-assistant-panel");
  const flat = cssFlat();
  const m900 = cssMedia("(max-width: 900px)");

  ok(errors.length === 0, "页面脚本加载无错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

  /* 播种测试用户（非 VIP） */
  window.eval("currentUser = { id: 'u_test', email: 't@t.com', name: '演示用户' }");
  window.eval("renderUserMenu()");

  /* ============ A. 结构与默认态 ============ */
  console.log("\n-- A. 结构：FAB 托管与默认冻结位 --");
  ok(!!fab && !!panel, "悬浮球与抽屉存在");
  ok(fab.getAttribute("onclick") === null, "FAB 内联 onclick 已移除（点击/拖拽由 JS 统一托管）");
  ok(/拖动/.test(fab.getAttribute("title") || "") && /冻结/.test(fab.getAttribute("title") || ""), "title 提示「拖动可贴边冻结」");
  ok(fab.getAttribute("aria-label") === "AI 小助手", "aria-label 保留");
  ok(!panel.classList.contains("open"), "抽屉默认收起");
  ok(fab.style.left !== "" && fab.style.right === "auto", "启动后 FAB 切换为 left/top 管理（可拖拽基础）");
  ok(parseFloat(fab.style.left) === window.innerWidth - 16 - 52, "默认冻结在右侧（距右 16px）");
  ok(parseFloat(fab.style.top) === window.innerHeight - 20 - 52, "默认距底 20px");
  ok(fab.classList.contains("hint"), "首次进入显示可拖动提示光环");
  ok(!window.eval("store.get('fm_ai_fab')"), "无历史冻结位时不读取旧值");
  ok(document.querySelector(".sb-footer").textContent.includes("beta1.0"), "侧栏版本号 beta1.0");

  /* ============ B. 点击开合 ============ */
  console.log("\n-- B. 点击开合抽屉 --");
  clickFab();
  ok(panel.classList.contains("open"), "点击 FAB 打开抽屉");
  ok(document.body.classList.contains("ai-open"), "body.ai-open 同步（抽屉打开）");
  const greet = document.getElementById("ai-assistant-messages");
  ok(greet.children.length === 1 && greet.textContent.includes("AI 小助手"), "首次打开输出欢迎语");
  ok(document.getElementById("ai-panel-quick").children.length >= 3, "快捷问题 chips 渲染");
  clickFab();
  ok(!panel.classList.contains("open"), "再次点击收起抽屉");
  ok(!document.body.classList.contains("ai-open"), "body.ai-open 同步（抽屉收起）");

  /* ============ C. 拖拽冻结到左侧 ============ */
  console.log("\n-- C. 拖拽冻结：左侧 + 位置记忆 --");
  dragFab(956, 696, 40, 300);
  const saved = window.eval("store.get('fm_ai_fab')");
  ok(saved && saved.side === "left" && typeof saved.y === "number", "冻结位写入 store（side=left）");
  ok((window.localStorage.getItem("u_test_fm_ai_fab") || "").includes("left"), "冻结位持久化到 localStorage（跨会话保留）");
  ok(document.body.classList.contains("ai-fab-left"), "body.ai-fab-left 镜像标记");
  ok(fab.style.left === "16px", "松手后贴边吸附到左侧 16px");
  ok(document.getElementById("toast").classList.contains("show"), "冻结后 toast 提示");
  clickFab();   // 拖动结束伴随的 click 应被吞掉
  ok(!panel.classList.contains("open"), "拖动后误触的 click 被抑制（不弹抽屉）");
  clickFab();
  ok(panel.classList.contains("open"), "抑制仅一次，后续点击正常开合");
  clickFab();

  /* ============ D. 边界钳制 ============ */
  console.log("\n-- D. 拖拽边界钳制 --");
  dragFab(16, 300, 16, -5000);
  ok(parseFloat(fab.style.top) >= 72, "向上拖出视口时钳制在 72px（顶栏+导航之下）");
  dragFab(16, 300, 16, 9000);
  ok(parseFloat(fab.style.top) <= window.innerHeight - 72, "向下拖出视口时钳制在底边留白内");
  dragFab(16, 300, 5000, 300);
  ok(parseFloat(fab.style.left) <= window.innerWidth - 52 - 4, "向右拖出视口时钳制在右边缘内");
  ok(window.eval("store.get('fm_ai_fab').side") === "right", "越界后仍按中心点判定左右");

  /* ============ E. 右侧冻结 ============ */
  console.log("\n-- E. 拖拽冻结：右侧 --");
  dragFab(500, 300, 980, 300);
  ok(window.eval("store.get('fm_ai_fab').side") === "right", "右侧冻结写入 store");
  ok(!document.body.classList.contains("ai-fab-left"), "右侧冻结移除镜像标记");
  ok(fab.style.left === (window.innerWidth - 16 - 52) + "px", "右侧贴边吸附（距右 16px）");
  clickFab();   // 消费本次拖动残留的 click 抑制标记，避免影响后续用例

  /* ============ F. 位置记忆 API 与视口变化 ============ */
  console.log("\n-- F. 位置记忆与 resize 重钳制 --");
  ok(!!window.FmAiFab && typeof window.FmAiFab.apply === "function", "暴露 FmAiFab 调试 API");
  window.eval("FmAiFab.apply({ side: 'left', y: 300 }, false)");
  ok(fab.style.left === "16px" && fab.style.top === "300px", "按记忆位恢复（left=16, top=300）");
  window.eval("FmAiFab.apply({ side: 'right', y: 300 }, false)");
  ok(fab.style.left === (window.innerWidth - 16 - 52) + "px" && !document.body.classList.contains("ai-fab-left"), "右侧记忆位恢复并移除镜像");
  window.dispatchEvent(new window.Event("resize"));
  setTimeout(() => {
    const y = parseFloat(fab.style.top);
    ok(y >= 72 && y <= window.innerHeight - 72, "resize 后位置重新钳制在合法区间");

    /* ============ G. 冻结相关样式（CSSOM） ============ */
    console.log("\n-- G. 冻结相关样式 --");
    ok(/body\.ai-open \.ai-fab \{[^}]*opacity:\s*0/.test(flat), "抽屉打开时悬浮球隐藏");
    ok(/body\.ai-fab-left \.ai-panel \{\s*left:\s*20px;\s*right:\s*auto;\s*\}/.test(flat), "桌面端左侧冻结时抽屉镜像（min-width:901 媒体内）");
    ok(/\.ai-fab\.dragging \{[^}]*transition:\s*none/.test(flat), "拖拽中禁用过渡（跟手）");
    ok(/\.ai-fab\.dragging \{[^}]*transform:\s*scale\(1\.12\)/.test(flat), "拖拽中放大反馈");
    ok(/\.ai-fab\.hint::after \{[^}]*animation:\s*aiFabPulse/.test(flat), "首次进入提示光环动画");
    ok(/\.ai-fab \{[^}]*touch-action:\s*none/.test(flat), "touch-action:none 保证移动端可拖动");

    /* ============ H. 移动端美化（CSSOM） ============ */
    console.log("\n-- H. 移动端页面美化 --");
    ok(/\.ai-fab \{[^}]*bottom:\s*calc\(20px \+ env\(safe-area-inset-bottom\)\)[^}]*width:\s*48px/.test(m900), "移动端 FAB 48px 且距底含安全区");
    ok(/\.ai-panel::before \{[^}]*width:\s*40px[^}]*height:\s*4px/.test(m900), "AI 抽屉移动端弹层把手");
    ok(/\.ai-panel-foot \{[^}]*padding-bottom:\s*calc\(10px \+ env\(safe-area-inset-bottom\)\)/.test(m900), "输入区预留底部安全区");
    ok(/\.app-main \{[^}]*padding:\s*104px 14px 32px/.test(m900), "主内容区为顶部双栏留位（104px）");
    ok(/\.page-card \{[^}]*border-radius:\s*18px/.test(m900) && /\.card, \.page-card \{[^}]*box-shadow/.test(m900), "卡片大圆角 + 柔和投影");
    ok(/\.btn \{[^}]*min-height:\s*42px/.test(m900), "按钮触控高度 ≥42px");
    ok(/\.tabbar-item:active \{[^}]*transform:\s*scale\(\.94\)/.test(m900), "导航项按压反馈");
    ok(/input\[type="text"\][^}]*font-size:\s*16px/.test(m900), "输入框 16px 防 iOS 聚焦放大");
    ok(/#toast \{[^}]*bottom:\s*calc\(20px \+ env\(safe-area-inset-bottom\)\)/.test(m900), "Toast 贴底含安全区");
    ok(/\.quiz-opt \{[^}]*font-size:\s*14px[^}]*border-radius:\s*14px/.test(m900), "答题选项移动端放大");
    ok(/\.app-tabbar \{[^}]*top:\s*58px/.test(m900), "顶部导航仍定位于顶栏下方（回归）");
    ok(document.querySelectorAll(".app-tabbar .tabbar-item").length === 9, "底部导航 9 项（回归）");
    ok(/\.feature-block \{[^}]*border-radius:\s*16px/.test(cssMedia("(max-width: 640px)")), "首页特性卡小屏圆角");

    /* ============ I. 游客态 ============ */
    console.log("\n-- I. 游客态可用 --");
    window.eval("logout()");
    clickFab();
    ok(panel.classList.contains("open"), "游客也可使用 AI 小助手");
    clickFab();

    ok(errors.length === 0, "全程无脚本错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));
    console.log(`\n结果：${pass} 通过，${fail} 失败`);
    process.exit(fail ? 1 : 0);
  }, 260);
}
