/* v17 jsdom 测试：蓝图编辑风视觉体系（暖纸 + 蓝图网格 / 墨色 + 衬线标题 / 全直角发丝线 / 单一朱红强调）
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
  console.log("\n=== v17 jsdom 测试（蓝图编辑风视觉体系）===");

  ok(errors.length === 0, "页面脚本加载无错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

  const css = document.querySelector("style").textContent;
  const has = (sel) => css.includes(sel);
  /* 分组选择器友好的规则提取：sel 可出现在选择器列表任意位置 */
  const ruleOf = (sel) => {
    const re = new RegExp("(?:^|[,\\s{])" + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*[,{][^}]*}", "g");
    return (css.match(re) || []).join("\n");
  };
  const ruleHas = (sel, decl) => decl.test(ruleOf(sel));

  /* ---------- A. 主题变量：暖纸 + 墨色 + 单一朱红 ---------- */
  ok(/--brand:\s*#BE3A1E/.test(css), "亮色强调色 = 朱红 #BE3A1E");
  ok(/--ink:\s*#1C1913/.test(css), "亮色文字 = 墨色 #1C1913");
  ok(/--bg:\s*#F4F1E8/.test(css), "亮色背景 = 暖纸 #F4F1E8");
  ok(/--card:\s*#FAF8F1/.test(css), "卡片 = 实色纸面 #FAF8F1（非玻璃半透明）");
  ok(/--bg:\s*#15130F/.test(css), "暗色背景 = 深墨 #15130F");
  ok(/--ink:\s*#EEE8D8/.test(css), "暗色文字 = 纸白 #EEE8D8");
  ok(/--brand:\s*#E85C3A/.test(css), "暗色强调色 = 提亮朱红 #E85C3A");
  ok(/--serif:\s*Georgia/.test(css), "衬线字体变量 --serif 已定义（Georgia）");
  ok(/--mono:\s*ui-monospace/.test(css), "等宽字体变量 --mono 已定义");
  ok(/--glass-border:/.test(css) && /--glass-highlight:/.test(css), "兼容变量已定义（玻璃变量扁平化兜底）");
  ok(/:root\[data-accent="green"\]/.test(css) && /:root\[data-accent="blue"\]/.test(css), "主题色变体（牛客绿 / 科技蓝）保留");

  /* ---------- B. 去玻璃拟态 + 蓝图网格基底 ---------- */
  ok(!/backdrop-filter/.test(css), "全站无 backdrop-filter（玻璃拟态已移除）");
  ok(!/linear-gradient\(135deg, #(4f46e5|6366f1|8b5cf6)/.test(css), "无蓝紫渐变硬编码");
  ok(ruleHas(".card", /background:\s*var\(--card\)/), ".card 实色纸面（无半透明玻璃）");
  ok(ruleHas("body", /background-image:[\s\S]*linear-gradient\(var\(--grid-line\)/), "body 铺设蓝图网格");
  ok(/--grid-line:/.test(css) && /--grid-major:/.test(css), "蓝图网格线变量已定义");
  ok(ruleHas(".page-card", /border-top:\s*2px solid var\(--ink\)/), "page-card 文档式墨色顶规");
  ok(ruleHas(".landing-nav", /border-bottom:\s*2px solid var\(--ink\)/), "落地页导航报头双线");

  /* ---------- C. 衬线标题 ---------- */
  ok(ruleHas(".hero h1", /font-family:\s*var\(--serif\)/), "工作台 Hero 标题衬线化");
  ok(ruleHas(".section-title", /font-family:\s*var\(--serif\)/), "区块标题衬线化");
  ok(ruleHas(".page-header h2", /font-family:\s*var\(--serif\)/), "页头标题衬线化");
  ok(ruleHas(".landing h1.hero-title", /font-family:\s*var\(--serif\)/), "落地页主标题衬线化");
  ok(ruleHas(".auth-left h2", /font-family:\s*var\(--serif\)/), "登录页标题衬线化");
  ok(ruleHas(".feature-block h3", /font-family:\s*var\(--serif\)/), "特性卡标题衬线化");

  /* ---------- D. 悬浮微交互：平面描边，不上浮 ---------- */
  ok(!/translateY\(-\d/.test(css), "全站无 translateY 上浮 hover");
  ok(ruleHas(".card:hover", /border-color:\s*var\(--ink\)/), "卡片 hover = 墨色描边");
  ok(ruleHas(".btn-primary:hover:not(:disabled)", /background:\s*var\(--brand-deep\)/), "主按钮 hover = 朱红加深");
  ok(ruleHas(".feature-block:hover", /background:\s*var\(--bg-deep\)/), "特性卡 hover = 纸面加深");
  ok(ruleHas(".bp-crop::before", /border-top:\s*2px solid var\(--brand\)/), "取景器角标（朱红 L 括线）");

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
      ok(/版本 (beta1\.0(\.\d+)?|v(1[789]|2[012])) · 蓝图编辑风 · (动态层|交互深化层)已就绪/.test(html), "开发者日志版本号已就绪");

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
