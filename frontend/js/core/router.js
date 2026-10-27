"use strict";
/* ============================================================
 * 0.5 视图路由系统（landing / app / auth）
 * ============================================================ */
const VIEW_KEY = "g_view";

function showView(name) {
  document.querySelectorAll(".view").forEach(v => {
    v.classList.toggle("active", v.id === "view-" + name);
  });
  window.scrollTo(0, 0);
  // 记住当前视图，刷新后仍停在同一页
  try { sessionStorage.setItem(VIEW_KEY, name); } catch (e) {}

  if (name === "app") {
    updateGuestBanner();
    // 应用当前 hash 子路由（#/dashboard · #/match …）
    try { applyRoute(); } catch (e) {}
    // 视图从 display:none 切回后重新布局实时追踪器
    requestAnimationFrame(() => {
      try {
        if (typeof updateLiveTracker === "function" && session.turns && session.turns.length) updateLiveTracker();
      } catch (e) {}
    });
  }
  if (name === "landing") {
    // 每次回到落地页都重播一次数字滚动
    document.querySelectorAll(".landing-stat .val[data-count]").forEach(el => { el.dataset.done = ""; });
    animateLandingCounters();
    // v26：重播 Hero 实录播台 + 刷新导航侦测
    try { if (window.__bpLanding && window.__bpLanding.playMock) window.__bpLanding.playMock(); } catch (e) {}
    try { if (window.__bpScroll && window.__bpScroll.updateSpy) window.__bpScroll.updateSpy(); } catch (e) {}
  }
  // v27：全站交互层编舞（app 子页由 applyRoute 负责，避免双重触发）
  if (name !== "app") {
    try { if (window.__bpApp && window.__bpApp.choreograph) window.__bpApp.choreograph(name); } catch (e) {}
  }
  // v26：离开落地页时清除导航点亮（准线已全站化，输入聚焦自动隐身）
  try { if (window.__bpScroll && window.__bpScroll.updateSpy) window.__bpScroll.updateSpy(); } catch (e) {}
  // v31：滚动吸附只作用于落地页视图——进入挂载、离开拆除（曾全局常驻导致应用内滚动粘滞）
  try { if (window.__bpMotion && window.__bpMotion.setSnap) window.__bpMotion.setSnap(name === "landing"); } catch (e) {}
}

/* 落地页 CTA：已登录进应用，未登录进登录页 */
function enterAppOrAuth() {
  if (currentUser) showView("app");
  else showView("auth");
}

/* 游客横幅：未登录访问主应用时出现 */
function updateGuestBanner() {
  const banner = $("guest-banner");
  if (!banner) return;
  banner.hidden = !!currentUser;
  syncGuestLocks();
}

/* 所有需要登录的功能统一入口 */
function requireLogin() {
  if (currentUser) return true;
  toast("请先登录后使用该功能");
  setTimeout(() => showView("auth"), 400);
  return false;
}

/* 游客模式下给 AI 功能按钮打上 🔒 标记 */
const GUEST_LOCK_SELECTORS = [
  'button[onclick="analyze()"]',
  'button[onclick="sendMsg()"]',
  'button[onclick="askRag()"]',
  'button[onclick="finishInterview()"]',
  'button[onclick="analyzeResume()"]',
  'button[onclick="optimizeWithLLM()"]',
  'button[onclick="recommendCareer()"]',
];
function syncGuestLocks() {
  const locked = !currentUser;
  GUEST_LOCK_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.toggle("guest-locked", locked);
      if (locked) el.setAttribute("title", "登录后解锁");
      else el.removeAttribute("title");
    });
  });
}

/* 落地页数字滚动 */
function animateLandingCounters() {
  document.querySelectorAll(".landing-stat .val[data-count]").forEach(el => {
    if (el.dataset.done === "1") return;
    el.dataset.done = "1";
    const target = +el.dataset.count;
    let cur = 0;
    const step = Math.max(1, Math.round(target / 24));
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(t); }
      el.textContent = cur;
    }, 42);
  });
}

/* 特性卡片鼠标光晕跟随 */
function trackLight(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", (e.clientX - rect.left) + "px");
  el.style.setProperty("--my", (e.clientY - rect.top) + "px");
}

/* 滚动进场动画 */
(function setupReveal() {
  const els = document.querySelectorAll(".feature-block, .workflow-step, .landing-stat, .landing-cta");
  if (!els.length || typeof IntersectionObserver === "undefined") return;
  els.forEach(el => el.classList.add("reveal"));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
})();

/* ============================================================
 * 0.6 应用内子路由（hash 路由）
 * ============================================================ */
const APP_PAGES = ["dashboard", "match", "resume", "mbti", "career", "interview", "rag", "report", "profile", "jobs", "quiz", "plan"];
const APP_PAGE_TITLES = {
  dashboard: "工作台",
  match: "简历匹配",
  interview: "模拟面试",
  rag: "面经问答",
  resume: "简历优化",
  career: "职业探索",
  mbti: "MBTI 测评",
  report: "评估报告",
  profile: "个人中心",
  jobs: "求职管理",
  quiz: "题库小测",
  plan: "学习计划",
};

function currentPage() {
  const hash = (location.hash || "").replace(/^#\/?/, "");
  return APP_PAGES.includes(hash) ? hash : "dashboard";
}

function navTo(page) {
  if (!APP_PAGES.includes(page)) page = "dashboard";
  if (location.hash !== "#/" + page) location.hash = "#/" + page;
  else applyRoute();   // 相同 hash 时手动触发一次
}

function applyRoute() {
  const page = currentPage();

  // 1) 显示 / 隐藏子页面
  document.querySelectorAll(".app-page").forEach(p => {
    p.classList.toggle("active", p.dataset.page === page);
  });

  // 2) 左侧栏 + 底部 Tab 栏同步激活态（v10：合并为一处，避免三段式冗余）
  document.querySelectorAll(".sb-item, .tabbar-item").forEach(a => {
    a.classList.toggle("active", a.dataset.nav === page);
  });

  // 3) 面包屑
  const bc = $("bc-current");
  if (bc) bc.textContent = APP_PAGE_TITLES[page] || "工作台";

  // 4) 页面标题 + meta 描述
  const title = APP_PAGE_TITLES[page] || "首页";
  document.title = `面镜 FutureMirror · ${title}`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = `面镜 FutureMirror · ${title} · 多 Agent 驱动的 AI 模拟面试与能力成长平台`;

  // 5) 按需渲染
  if (page === "report") { try { renderReport(); } catch (e) {} }
  if (page === "profile") { try { renderProfile(); } catch (e) {} }
  if (page === "jobs") { try { renderJobsPage(); } catch (e) {} }
  if (page === "quiz") { try { renderQuizPage(); } catch (e) {} }
  if (page === "plan") { try { renderPlanPage(); } catch (e) {} }
  if (page === "mbti") { try { renderMbtiPage(); } catch (e) {} }
  if (page === "career") { try { renderRealJobs(); } catch (e) {} }

  // 6) 顶栏状态胶囊同步（游客 / Mock / 真实）
  try { syncStatusPill(); } catch (e) {}

  // 直接置顶（instant），避免切页时看到可见的滚动过程
  window.scrollTo(0, 0);
  // v17：新渲染内容（报告 / 个人中心等）补扫渐入
  revealScan();
  // v27：全站交互层——切页编舞（标题揭载 / 面包屑光标 / 侧栏扫光）+ 新渲染数字滚动
  try { if (window.__bpApp && window.__bpApp.choreograph) window.__bpApp.choreograph("app", page); } catch (e) {}
  try { if (window.__bpApp && window.__bpApp.countUpScan) window.__bpApp.countUpScan(document.querySelector(".app-page.active")); } catch (e) {}
}

/* 状态胶囊：未登录=游客模式；已登录且接入 Key=真实·模型名；否则=Mock 模式 */
function syncStatusPill() {
  const pill = $("status-pill");
  const txt = $("status-text");
  if (!pill || !txt) return;
  pill.classList.remove("real");
  if (!currentUser) {
    txt.textContent = "游客模式";
  } else if (fmApi.backendReady()) {
    // v22：后端模式优先展示
    pill.classList.add("real");
    txt.textContent = fmApi.health.llm_ready
      ? `真实 · 后端 ${fmApi.backendModel()}`
      : "Mock 模式 · 后端未配置 Key";
  } else if (typeof llm !== "undefined" && llm) {
    pill.classList.add("real");
    txt.textContent = `真实 · ${llm.model}`;
  } else {
    txt.textContent = "Mock 模式";
  }
  // v19：VIP 徽章（已登录且享有权益时显示）
  const vipPill = $("vip-pill");
  if (vipPill) vipPill.hidden = !(currentUser && typeof isVip === "function" && isVip());
}


/* 兼容旧版 API：switchTab 现在等价于 navTo */
function switchTab(name) {
  navTo(APP_PAGES.includes(name) ? name : "dashboard");
}

/* v10：顶栏「功能导航」下拉已移除，保留这两个空实现，避免残留 onclick 报错 */
function closeNavDropdown() { /* noop：下拉 UI 已在 v10 下线 */ }

