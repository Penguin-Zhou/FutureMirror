"use strict";
/* ============================================================
 * v17 · 滚动渐入（IntersectionObserver 渐进增强）
 * 设计要点：
 * 1) class 由 JS 主动添加——无 JS / IO 不支持时内容保持可见，不会白屏；
 * 2) 动画结束后移除 .reveal/.in，避免与 :hover 的 transform 互相覆盖；
 * 3) prefers-reduced-motion 与 CSS 侧双保险，直接跳过动画。
 * ============================================================ */
const REVEAL_SELECTOR = ".feature-block, .workflow-step, .landing-stat, .hero-mock, .agent, .mcp-item, .stat-card, .quick-entry, .today-pick, .page-card, .career-card";
let revealIO = null;

/* ---- v24 · 滚动进度线：fixed 顶部朱红 2px（rAF 节流，passive 监听） ---- */
function initScrollProgress() {
  if (document.querySelector(".bp-progress")) return;
  const bar = document.createElement("div");
  bar.className = "bp-progress";
  bar.setAttribute("aria-hidden", "true");
  (document.body || document.documentElement).appendChild(bar);
  let ticking = false;
  const update = () => {
    ticking = false;
    const de = document.documentElement;
    const max = de.scrollHeight - de.clientHeight;
    const top = window.scrollY || de.scrollTop || 0;
    const p = max > 4 ? top / max : 0;
    bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)).toFixed(4) + ")";
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}
function initRevealObserver() {
  if (revealIO) return;
  if (!("IntersectionObserver" in window)) return;
  try {
    revealIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        revealIO.unobserve(el);
        el.classList.add("in");
        const cleanup = () => el.classList.remove("reveal", "in");
        el.addEventListener("transitionend", cleanup, { once: true });
        setTimeout(cleanup, 1400);   // 兜底：transitionend 未触发也清理
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
  } catch (e) { revealIO = null; }
}
function revealScan() {
  if (!revealIO) initRevealObserver();
  if (!revealIO) return;
  try {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e) { /* matchMedia 不可用时默认允许动画 */ }
  document.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
    if (el.dataset.rv === "1") return;
    el.dataset.rv = "1";
    el.classList.add("reveal");
    revealIO.observe(el);
  });
}

(function init() {
  syncThemeBtn();
  syncAccentBtn();
  restoreBanner();          // v10：横幅关闭状态（详细初始化见脚本末尾 bootstrapV10）
  syncStatusPill();         // v10：顶栏状态胶囊（applyRoute 也会同步）
  initOnboarding();         // v10：首访引导

  // 表单输入持久化（跟随当前登录用户隔离存储）
  $("resume").addEventListener("input", e => store.set("fm_resume", e.target.value));
  $("jd").addEventListener("input", e => store.set("fm_jd", e.target.value));

  // 快捷键：Ctrl/Cmd+Enter 发送 · Ctrl/Cmd+K 聚焦输入框 · Esc 关闭弹窗
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (currentPage() === "interview") { e.preventDefault(); sendMsg(); }
    }
    if (e.key === "Escape") {
      document.querySelectorAll(".modal:not([hidden])").forEach(m => m.hidden = true);
      closeUserMenu();
      closeNavDropdown();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (currentPage() === "interview") $("chat-input").focus();
    }
  });

  // 游客保护：点击面试输入框时引导登录
  $("chat-input").addEventListener("focus", () => {
    if (!currentUser) {
      $("chat-input").blur();
      requireLogin();
    }
  });

  // 判断登录状态：已登录进主应用，未登录默认落地页
  const user = restoreUser();
  if (user) {
    currentUser = user;
    showView("app");
  } else {
    // 未登录：恢复上次所在视图（仅允许 landing / app 作为游客入口）
    let lastView = "landing";
    try { lastView = sessionStorage.getItem(VIEW_KEY) || "landing"; } catch (e) {}
    showView(lastView === "app" ? "app" : "landing");
  }
  // 注：bootApp() 已移至脚本末尾 bootstrapV10（CAREER_DB 等 const 已初始化后），
  // 避免 init() 早于数据定义执行时 syncCareerCounts 触发 TDZ、导致 applyRoute 等缺失。
  // 落地页数字动画
  animateLandingCounters();
  // v17：滚动渐入（落地页静态卡片）
  revealScan();
  // v24：滚动进度线（阅读/操作进度感知）
  initScrollProgress();
})();

