/* v17 jsdom 测试：Arkira 风格视觉升级（深海蓝主题 / 玻璃拟态 / 衬线标题 / 滚动渐入 / 微交互）
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v17-jsdom.js
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

/* jsdom 无 IntersectionObserver：注入一个「立即触发」的假实现，用于验证渐入逻辑 */
function installFakeIO() {
  window.eval(`
    window.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; window.__ioCbs = (window.__ioCbs || []); window.__ioCbs.push(cb); }
      observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
      unobserve() {} disconnect() {}
    };
  `);
}

setTimeout(runTests, 300);

function runTests() {
  console.log("\n=== v17 jsdom 测试（Arkira 风格视觉升级）===");

  ok(errors.length === 0, "页面脚本加载无错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

  const css = document.querySelector("style").textContent;
  const has = (sel) => css.includes(sel);

  /* ---------- A. 主题变量：深海蓝 + 电光蓝 ---------- */
  ok(/--brand:\s*#2E3FE8/.test(css), "亮色品牌色 = 电光蓝 #2E3FE8");
  ok(/--ink:\s*#10163A/.test(css), "亮色文字 = 深海军蓝 #10163A");
  ok(/--bg:\s*#FAFBFF/.test(css), "亮色背景 = 暖白 #FAFBFF");
  ok(/--card:\s*rgba\(255,255,255,0\.75\)/.test(css), "卡片 = 半透明白（玻璃基底）");
  ok(/--bg:\s*#070B1F/.test(css), "暗色背景 = 午夜蓝 #070B1F");
  ok(/--ink:\s*#F0EEE9/.test(css), "暗色文字 = 奶油白 #F0EEE9");
  ok(/--brand:\s*#7C8CFF/.test(css), "暗色品牌色 = 柔光电光蓝 #7C8CFF");
  ok(/--serif:\s*Georgia/.test(css), "衬线字体变量 --serif 已定义（Georgia）");
  ok(/--glass-border:/.test(css) && /--glass-highlight:/.test(css), "玻璃边框 / 高光变量已定义");
  ok(/:root\[data-accent="green"\]/.test(css) && /:root\[data-accent="blue"\]/.test(css), "主题色变体（牛客绿 / 科技蓝）保留");

  /* ---------- B. 玻璃拟态 ---------- */
  ok(/\.glass\s*\{[^}]*backdrop-filter/.test(css), ".glass 通用类含 backdrop-filter");
  ok(/header\s*\{[^}]*backdrop-filter:[^}]*color-mix/.test(css), "顶栏玻璃化（blur + color-mix）");
  ok(/\.card\s*\{[^}]*backdrop-filter:[^}]*var\(--glass-border\)/.test(css), ".card 玻璃拟态（blur + 玻璃边框）");
  ok(/\.app-sidebar\s*\{[^}]*backdrop-filter/.test(css), "侧栏玻璃化");
  ok(/\.landing-nav\s*\{[^}]*backdrop-filter/.test(css), "落地页导航玻璃化");
  ok(/\.hero-mock\s*\{[^}]*backdrop-filter/.test(css), "产品预览 Mock 玻璃化");
  ok(/\.user-dropdown\s*\{[^}]*backdrop-filter/.test(css), "用户下拉菜单玻璃化");

  /* ---------- C. 衬线标题 ---------- */
  ok(/\.hero h1\s*\{[^}]*font-family:\s*var\(--serif\)/.test(css), "工作台 Hero 标题衬线化");
  ok(/\.section-title\s*\{[^}]*font-family:\s*var\(--serif\)/.test(css), "区块标题衬线化");
  ok(/\.page-header h2\s*\{[^}]*font-family:\s*var\(--serif\)/.test(css), "页头标题衬线化");
  ok(/\.landing h1\.hero-title\s*\{[^}]*font-family:\s*var\(--serif\)/.test(css), "落地页主标题衬线化");
  ok(/\.auth-left h2\s*\{[^}]*font-family:\s*var\(--serif\)/.test(css), "登录页标题衬线化");
  ok(/\.feature-block h3\s*\{[^}]*font-family:\s*var\(--serif\)/.test(css), "特性卡标题衬线化");

  /* ---------- D. 悬浮微交互 ---------- */
  ok(/\.btn-primary:hover:not\(:disabled\)[^}]*translateY\(-1px\)/.test(css), "主按钮悬浮上浮");
  ok(/\.card:hover\s*\{[^}]*translateY\(-3px\)/.test(css), "卡片悬浮上浮 + 阴影加深");
  ok(/\.agent:hover\s*\{[^}]*translateY\(-4px\)/.test(css), "Agent 卡悬浮上浮");
  ok(/\.agent:hover \.agent-avatar\s*\{[^}]*scale\(1\.12\)/.test(css), "Agent 头像悬浮缩放旋转");
  ok(/\.feature-block:hover\s*\{[^}]*translateY\(-5px\)/.test(css), "特性卡悬浮上浮");

  /* ---------- E. Bento Grid / 网格布局 ---------- */
  ok(/\.feature-grid\s*\{[^}]*repeat\(3,\s*1fr\)/.test(css), "特性网格 3 列（Bento）");
  ok(/\.workflow\s*\{[^}]*repeat\(4,\s*1fr\)/.test(css), "工作流 4 列");
  ok(/\.landing-stats\s*\{[^}]*repeat\(4,\s*1fr\)/.test(css), "数据条 4 列");
  ok(/\.quick-entries-hero\s*\{[^}]*repeat\(3,\s*1fr\)/.test(css), "快速入口 3 列网格（v15 保留）");

  /* ---------- F. 落地页内容增强 ---------- */
  const tagline = document.querySelector("#view-landing .landing-tagline");
  ok(tagline && tagline.textContent.includes("一次面试，多重机会"), "首屏价值主张标签「一次面试，多重机会」");
  ok(!!document.querySelector("#view-landing .hero-mock .mock-chat"), "产品预览 Mock（对话）存在");
  ok(!!document.querySelector("#view-landing .hero-mock .mock-radar svg"), "产品预览 Mock（雷达图）存在");
  ok(css.includes('fill="color-mix') || document.querySelector('#view-landing .hero-mock polygon[fill="color-mix(in srgb,var(--brand) 30%,transparent)"]') !== null || /color-mix\(in srgb,var\(--brand\) 30%,transparent\)/.test(document.querySelector("#view-landing .hero-mock").innerHTML), "预览雷达填充跟随主题色");
  ok(!!document.querySelector("#view-landing .landing-cta .btn-white"), "底部 CTA 白色按钮");
  ok([...document.querySelectorAll("#view-landing .feature-block p")].some(p => p.textContent.includes("让简历通过机器筛选")), "特性区补充「通过机器筛选」价值描述");

  /* ---------- G. 滚动渐入（IntersectionObserver） ---------- */
  ok(window.eval("typeof revealScan") === "function", "revealScan 函数已定义");
  ok(window.eval("typeof initRevealObserver") === "function", "initRevealObserver 函数已定义");
  ok(window.eval("REVEAL_SELECTOR").includes(".feature-block") && window.eval("REVEAL_SELECTOR").includes(".page-card"), "渐入目标选择器覆盖核心卡片");

  installFakeIO();
  window.eval("revealScan()");
  const fb = document.querySelector("#view-landing .feature-block");
  ok(fb.classList.contains("reveal") && fb.classList.contains("in"), "视口内卡片立即添加 reveal + in");
  const before = document.querySelectorAll("#view-landing .feature-block.reveal").length;
  window.eval("revealScan()");
  ok(document.querySelectorAll("#view-landing .feature-block.reveal").length === before, "重复扫描不会重复处理（data-rv 去重）");

  /* 动画结束后清理 class，避免与 :hover transform 冲突 */
  setTimeout(() => {
    ok(!fb.classList.contains("reveal") && !fb.classList.contains("in"), "动画结束后自动清理 reveal/in（hover 恢复）");

    /* renderTodayPicks 挂接：新推荐卡片也走渐入 */
    window.location.hash = "#/dashboard";
    setTimeout(() => {
      window.eval("renderTodayPicks()");
      const pick = document.querySelector("#today-picks .today-pick");
      ok(pick && pick.classList.contains("reveal"), "换一批后新推荐卡片进入渐入流程");

      /* prefers-reduced-motion 时跳过动画 */
      const realMM = window.matchMedia;
      window.matchMedia = q => ({ matches: /prefers-reduced-motion/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      const probe = document.createElement("div");
      probe.className = "agent";
      probe.id = "reveal-probe";
      document.getElementById("agents").appendChild(probe);
      window.eval("revealScan()");
      ok(!probe.classList.contains("reveal"), "prefers-reduced-motion 下跳过渐入");
      window.matchMedia = realMM;
      probe.remove();

      /* ---------- H. 版本号与回归（v18 起版本号随主线递增） ---------- */
      ok(/beta1\.0|v(1[789]|2[012])/.test(document.querySelector(".sb-footer").textContent), "侧栏版本号为 v17+ / beta1.0");
      ok(/版本 (beta1\.0|v(1[789]|2[012])) · Arkira 风格主题已就绪/.test(html), "开发者日志版本号已就位");

      /* v15/v16 功能回归：今日推荐 / 个人中心 */
      const picks = document.querySelectorAll("#today-picks .today-pick");
      ok(picks.length === 4, `今日推荐渲染 4 张卡片（实际 ${picks.length}）`);
      ok(typeof window.eval("startInterviewFor") === "function", "startInterviewFor 可用（v15 回归）");
      window.location.hash = "#/profile";
      setTimeout(() => {
        ok(document.querySelector('.app-page[data-page="profile"]').classList.contains("active"), "个人中心页可打开（v16 回归）");
        ok(document.getElementById("avatar-picker") !== null, "头像选择器存在（v16 回归）");
        ok(document.getElementById("profile-completion-text") !== null, "完成度组件存在（v16 回归）");

        /* 主题切换仍正常（data-theme 属性） */
        window.eval("toggleTheme()");
        ok(document.documentElement.dataset.theme === "dark", "toggleTheme 切换到暗色");
        window.eval("toggleTheme()");
        ok(document.documentElement.dataset.theme === "light", "toggleTheme 切回亮色");

        ok(errors.length === 0, "全流程无脚本错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));
        console.log(`\n结果：${pass} 通过，${fail} 失败`);
        process.exit(fail ? 1 : 0);
      }, 250);
    }, 250);
  }, 1600);
}
