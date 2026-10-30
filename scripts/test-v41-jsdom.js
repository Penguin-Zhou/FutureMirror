/* v41 回归测试：移动端适配层（视口 / 导航收敛 / 对话区自适应 / 交互可达）
 * 覆盖：
 *   ① 视口：viewport-fit=cover（刘海屏安全区与 dvh 前提）
 *   ② 导航：窄屏把 6 个次级页面收进「更多」，底栏显式 5 格且不横滑
 *   ③ 「更多」：打开命令面板；次级页面激活时由「更多」承接高亮
 *   ④ 对话区：实测占满剩余视口（不再固定 480px），输入框留在可视区
 *   ⑤ 滚动克制：流式输出不再无条件拽回底部（用户上翻可读）
 *   ⑥ 折叠：代码沙盒窄屏默认收起为一行，点击可展开
 *   ⑦ 顶栏：实测高度写入 --hdr-h，导航条与主内容跟随，不再硬编码 58px
 *   ⑧ 防溢出：关键断点存在（640 收导航、360 极窄、横屏、安全区）
 * 用法：node scripts/test-v41-jsdom.js
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
const css = ["tokens.css", "theme.css", "pages.css"]
  .map((f) => fs.readFileSync(path.join(ROOT, "frontend", "css", f), "utf8"))
  .join("\n");

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
    beforeParse(win) {
      // jsdom 不实现 matchMedia；窄屏分支（导航收敛/对话区高度）依赖它
      win.matchMedia = (q) => ({
        matches: /max-width/.test(q),
        media: q,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        },
      });
    },
  });
  return { dom, errors };
}

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v41 · 移动端适配层 ===\n");
  const { dom, errors } = makeDom();
  const w = dom.window;
  const d = w.document;
  await wait(900);

  /* ---------- ① 视口 ---------- */
  console.log("① 视口与安全区");
  const vp = d.querySelector('meta[name="viewport"]');
  ok(!!vp && /viewport-fit=cover/.test(vp.content), "viewport 含 viewport-fit=cover（刘海屏安全区生效前提）");
  ok(!!vp && /width=device-width/.test(vp.content), "viewport 仍为 device-width（不破坏既有缩放行为）");
  ok(/env\(safe-area-inset-top/.test(css), "顶栏/导航按安全区留位");
  ok(/overflow-wrap:\s*anywhere/.test(css), "长文本/长 URL 换行兜底仍在");

  /* ---------- ② 导航收敛 ---------- */
  console.log("\n② 窄屏导航收敛");
  const moreBtn = d.querySelector(".tabbar-more");
  ok(!!moreBtn, "存在独立「更多」入口（不占用 .tabbar-item 计数）");
  ok(!!moreBtn && /openMobileMore\(\)/.test(moreBtn.getAttribute("onclick") || ""), "「更多」绑定 openMobileMore()");
  ok(!!moreBtn && moreBtn.getAttribute("aria-haspopup") === "dialog", "「更多」声明 aria-haspopup");
  ok(d.querySelectorAll(".app-tabbar .tabbar-item").length === 10, "底部导航 DOM 仍为 10 项（既有口径不变）");
  const secondary = JSON.parse(w.eval("JSON.stringify(SECONDARY_NAV)"));
  ok(Array.isArray(secondary) && secondary.length === 6, "SECONDARY_NAV 收敛 6 个次级页面");
  const hiddenInCss = secondary.every((id) => new RegExp(`\\.tabbar-item\\[data-nav="${id}"\\]`).test(css));
  ok(hiddenInCss, "6 个次级页在 ≤640px 均有隐藏规则（JS 与 CSS 口径一致）");
  ok(/\.tabbar-more\s*\{\s*display:\s*none/.test(css), "桌面端「更多」隐藏（不改变桌面底栏）");

  /* ---------- ③ 「更多」行为 ---------- */
  console.log("\n③ 「更多」与激活态承接");
  ok(
    typeof w.eval("typeof openMobileMore") === "string" && w.eval("typeof openMobileMore") === "function",
    "openMobileMore 可被内联 onclick 调用"
  );
  w.eval('showView("app"); navTo("interview");');
  await wait(120);
  ok(d.body.dataset.page === "interview", "applyRoute 记录当前页（供页面级避让）");
  ok(!d.querySelector(".tabbar-more").classList.contains("active"), "主入口页不点亮「更多」");
  w.eval('navTo("quiz");');
  await wait(120);
  const moreActive = d.querySelector(".tabbar-more");
  ok(!!moreActive && moreActive.classList.contains("active"), "次级页（题库）由「更多」承接激活态");
  ok(!!moreActive && moreActive.getAttribute("aria-current") === "page", "承接态同步 aria-current（读屏可达）");
  w.eval('navTo("interview");');
  await wait(120);

  /* ---------- ④ 对话区自适应 ---------- */
  console.log("\n④ 面试对话区自适应");
  ok(w.eval("typeof fitChatHeight") === "function", "fitChatHeight 存在（实测占满剩余视口）");
  ok(w.eval("typeof syncHeaderHeight") === "function", "syncHeaderHeight 存在（顶栏高度驱动布局）");
  w.eval('showView("app"); navTo("interview");');
  await wait(150);
  w.eval("fitChatHeight();");
  const main = d.querySelector(".chat-main");
  ok(!!main && /px$/.test(main.style.height), "窄屏下对话区高度由 JS 实测写入（非固定 480px）");
  ok(!!main && parseInt(main.style.height, 10) >= 240, "对话区不低于下限（键盘弹出仍可读上下文）");
  ok(/100dvh/.test(css) && /--app-vh/.test(css), "CSS 保留 dvh 与 --app-vh 双兜底（旧 Safari 可降级）");
  ok(/clamp\(\s*240px/.test(css), "对话区高度有下限保护，键盘弹出时不塌成一条");
  /* v42：监听统一收敛到 boot.js 的 initKeyboardGuards（resize + 键盘 + 失焦），
   * 断言改为检查守卫所在文件，语义仍是「键盘起落会重算可视高度」。 */
  ok(
    /visualViewport/.test(
      fs.readFileSync(path.join(ROOT, "frontend", "js", "core", "boot.js"), "utf8") +
        fs.readFileSync(path.join(ROOT, "frontend", "js", "features", "interview.js"), "utf8")
    ),
    "监听 visualViewport（键盘起落时重算可视高度）"
  );

  /* ---------- ⑤ 滚动克制 ---------- */
  console.log("\n⑤ 流式输出不抢用户滚动");
  ok(w.eval("typeof chatAutoScroll") === "function", "chatAutoScroll 存在");
  const body = d.getElementById("chat-body");
  ok(!!body, "对话滚动容器存在");
  // 模拟：内容很高、用户已上翻 → 非强制调用不应回到底部
  Object.defineProperty(body, "scrollHeight", { value: 2000, configurable: true });
  Object.defineProperty(body, "clientHeight", { value: 400, configurable: true });
  body.scrollTop = 200; // 距底 1400px，远离底部
  w.eval("chatAutoScroll();");
  ok(body.scrollTop === 200, "用户上翻时不再被拽回底部（可安心回看历史）");
  w.eval("chatAutoScroll(true);");
  ok(body.scrollTop === 2000, "强制模式（自己发言/结束通知）仍滚到底");
  const ivSrc = fs.readFileSync(path.join(ROOT, "frontend", "js", "features", "interview.js"), "utf8");
  const hardScrolls = (ivSrc.match(/body\.scrollTop = body\.scrollHeight/g) || []).length;
  ok(hardScrolls <= 1, `仅 chatAutoScroll 内部保留 1 处滚底（实际 ${hardScrolls} 处）`);

  /* ---------- ⑥ 折叠 ---------- */
  console.log("\n⑥ 辅助工具折叠");
  ok(w.eval("typeof initMobileCompact") === "function", "initMobileCompact 存在");
  const sandbox = d.getElementById("code-sandbox");
  ok(!!sandbox && sandbox.classList.contains("is-compact"), "代码沙盒纳入折叠体系");
  const toggle = sandbox && sandbox.querySelector(".compact-toggle");
  ok(!!toggle, "折叠条已注入（含展开文案）");
  ok(!!toggle && toggle.getAttribute("aria-expanded") === "false", "折叠条默认 aria-expanded=false");
  ok(
    /\.is-compact:not\(\.expanded\) > \*:not\(\.compact-toggle\)\s*\{\s*display:\s*none !important/.test(css),
    "收起规则用 !important（面板正文含内联 display）"
  );
  toggle.dispatchEvent(new w.Event("click", { bubbles: true }));
  ok(sandbox.classList.contains("expanded") && toggle.getAttribute("aria-expanded") === "true", "点击后展开且状态同步");
  toggle.dispatchEvent(new w.Event("click", { bubbles: true }));
  ok(!sandbox.classList.contains("expanded"), "再次点击可收起");
  ok(!d.querySelector(".llm-panel .compact-toggle"), "不改动默认隐藏的 #llm-panel（避免打开后内容被清空）");

  /* ---------- ⑦ 顶栏偏移 ---------- */
  console.log("\n⑦ 顶栏高度驱动布局");
  ok(/--hdr-h/.test(css), "导航条与主内容跟随 --hdr-h");
  ok(/\.app-tabbar\s*\{\s*top:\s*var\(--hdr-h/.test(css), "导航条定位不再硬编码 58px");
  ok(d.documentElement.style.getPropertyValue("--hdr-h").endsWith("px"), "启动后立即写入实测高度");

  /* ---------- ⑧ 断点与防溢出 ---------- */
  console.log("\n⑧ 关键断点");
  ok(/@media \(max-width: 640px\)/.test(css), "640px 断点（导航收敛 / 对话区压缩）");
  ok(/@media \(max-width: 360px\)/.test(css), "360px 极窄屏断点");
  ok(/orientation: landscape/.test(css), "横屏断点（对话区按视高收缩）");
  ok(/\.vec-bar \{ flex-wrap: wrap/.test(css), "向量索引条按钮换行（320px 不再溢出 37px）");
  ok(
    /\.report-actions[\s\S]{0,220}grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important/.test(css),
    "报告操作按钮网格排布（v44 由两列改三列：六个按钮从三行压到两行，首屏给诊断块让位）"
  );
  ok(/\.dim-tip\s*\{\s*display:\s*none/.test(css), "依赖 hover 的评语气泡在触摸端隐藏");
  ok(/body\[data-page="interview"\] \.ai-fab/.test(css), "面试页悬浮球避让输入栏（不遮挡发送）");

  /* ---------- 无脚本错误 ---------- */
  console.log("\n⑨ 运行健康");
  ok(errors.length === 0, `无脚本错误（${errors.length ? errors[0] : "clean"}）`);

  console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`);
  process.exit(fail ? 1 : 0);
}
