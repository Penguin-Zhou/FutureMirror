"use strict";
/* ============================================================
 * 9. 启动流程：先判断登录，再进入应用
 * ============================================================ */
/* v41：把顶栏实测高度写进 --hdr-h。窄屏顶栏可能换行变高，
 * 底部导航条与主内容区据此对齐，不再硬编码 58px 造成遮挡。 */
function syncHeaderHeight() {
  const h = document.querySelector("header");
  if (!h) return;
  try {
    /* 顶栏在落地页/登录页会被隐藏（offsetHeight = 0）。此时不能写 0——
     * 否则回到应用内时导航条会压在顶栏上、内容被盖住，故回落到安全默认值。 */
    const v = Math.round(h.offsetHeight) || 58;
    document.documentElement.style.setProperty("--hdr-h", v + "px");
  } catch (e) { /* 自定义属性不可用时保持 CSS 兜底值 */ }
}

/* v41：窄屏把「辅助工具」折叠成一行——演示时先看到对话，需要时点开。
 * 只处理可见的辅助面板；默认隐藏的面板（如 #llm-panel[hidden]）不碰，
 * 避免用户自行打开时拿到一个被清空的面板。 */
const MOBILE_COMPACT_TARGETS = [
  { sel: "#code-sandbox", off: "💻 代码题沙盒 · 两数之和（点击展开）", on: "💻 收起代码题沙盒" },
];

function initMobileCompact() {
  MOBILE_COMPACT_TARGETS.forEach(cfg => {
    let box;
    try { box = document.querySelector(cfg.sel); } catch (e) { return; }
    // 逻辑测试桩里没有完整 DOM（无 dataset / insertBefore），直接跳过
    if (!box || !box.dataset || !box.classList || typeof box.insertBefore !== "function") return;
    if (box.dataset.compactReady) return;
    box.dataset.compactReady = "1";
    box.classList.add("is-compact");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "compact-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = cfg.off;
    btn.addEventListener("click", () => {
      const on = box.classList.toggle("expanded");
      btn.setAttribute("aria-expanded", on ? "true" : "false");
      btn.textContent = on ? cfg.on : cfg.off;
      fitChatHeight();
    });
    box.insertBefore(btn, box.firstChild);
  });
}

/* v41：面试对话区按「当前视口 - 对话区顶部位置」精确占满剩余空间。
 * 用实测值而非固定 offset，是因为上方内容（页面头/模式条/折叠条）会随宽度变化；
 * 软键盘弹起时 visualViewport 变矮 → 重算 → 输入框始终留在可视区内。 */
function fitChatHeight() {
  const main = document.querySelector(".chat-main");
  if (!main) return;
  const page = document.querySelector('.app-page[data-page="interview"]');
  let narrow;
  try { narrow = !!(window.matchMedia && window.matchMedia("(max-width: 900px)").matches); } catch (e) { return; }
  if (!narrow || !page || !page.classList.contains("active")) {
    main.style.height = "";
    main.classList.remove("kb-pinned");
    return;
  }
  try {
    if (typeof main.getBoundingClientRect !== "function") return;
    const bodyEl = document.getElementById("chat-body");
    /* 改高度前先看用户是否贴底，改完按原意图恢复——
     * 否则每次键盘起落都会把正在回看历史的用户强行拽回底部。 */
    let nearBottom = true;
    try {
      if (bodyEl && bodyEl.scrollHeight) {
        nearBottom = bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight < 90;
    }
    } catch (e) {}
    const kb = keyboardInset();
    /* 键盘弹出时布局视口不变、可视视口只剩上半屏，文档已经滚不动了——
     * 唯一可靠做法是把对话卡片固定进可视区（见 CSS §17 的 .kb-pinned）。 */
    if (kb > 0 && document.documentElement.classList.contains("kb-chat")) {
      main.classList.add("kb-pinned");
      main.style.height = "";
      if (nearBottom && bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
      return;
    }
    main.classList.remove("kb-pinned");
    const vv = window.visualViewport;
    const vh = vv && vv.height ? vv.height : window.innerHeight;
    /* iOS 键盘弹起时 visualViewport 会被整体下推（offsetTop > 0），不减掉会算高。 */
    const vTop = vv && typeof vv.offsetTop === "number" ? vv.offsetTop : 0;
    let top = main.getBoundingClientRect().top - vTop;
    if (top > 8) {
      try { window.scrollBy({ top: top - 8, behavior: "auto" }); } catch (e) {}
      top = main.getBoundingClientRect().top - vTop;
    }
    const h = Math.max(160, Math.round(vh - top - 12));
    main.style.height = h + "px";
    if (nearBottom && bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
  } catch (e) { /* 无布局环境（逻辑测试桩）跳过 */ }
}

/* ---------- v42 · 键盘可见性：一切以 visualViewport 为准 ---------- */

/**
 * 软键盘遮挡量（px）：不可知时为 0。
 * 不用 100vh，也不猜固定键盘高度——iOS 键盘从 260 到 336 不等，
 * 且第三方输入法、横屏、工具栏都会改变它。
 */
function keyboardInset() {
  try {
    const vv = window.visualViewport;
    if (!vv || typeof vv.height !== "number") return 0;
    const layout = window.innerHeight || vv.height;
    const hidden = layout - vv.height - (vv.offsetTop || 0);
    return hidden > 24 ? hidden : 0;     // 24px 以内按工具栏抖动处理，不算键盘
  } catch (e) { return 0; }
}

/**
 * 把可视高度与键盘遮挡量写进 CSS 变量，供输入栏与对话区使用：
 *   --app-vh 真实可视高度（等价于 dvh 的实测版）
 *   --kb-h   键盘遮挡高度（键盘收起时为 0）
 * 同时给 <html> 打 .kb-open，便于纯 CSS 做「键盘态」微调。
 */
function syncViewportVars() {
  try {
    const vv = window.visualViewport;
    const h = vv && vv.height ? vv.height : window.innerHeight;
    const root = document.documentElement;
    root.style.setProperty("--app-vh", Math.round(h) + "px");
    root.style.setProperty("--kb-h", Math.round(keyboardInset()) + "px");
    root.classList.toggle("kb-open", keyboardInset() > 0);
  } catch (e) { /* 视口 API 不可用时保持 CSS 的 dvh 兜底 */ }
}

/** v42：可视高度减去上下预留后的「可填满高度」，供对话区使用 */
function visibleFill(reserve) {
  try {
    const vv = window.visualViewport;
    const h = vv && vv.height ? vv.height : window.innerHeight;
    return Math.max(240, Math.round(h - (typeof reserve === "number" ? reserve : 20)));
  } catch (e) { return 240; }
}

/**
 * 键盘起落后把输入行「按」回可视区底部。
 * 只处理窄屏（≤900px）：桌面端键盘不存在，滚动反而打断阅读。
 * @param {number} delay 等待动画结束的毫秒数
 */
function pinInputIntoView(delay) {
  try {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
  } catch (e) { return; }
  setTimeout(() => {
    try {
      const vv = window.visualViewport;
      const bar = document.querySelector(".chat-input");
      if (!bar || typeof bar.getBoundingClientRect !== "function") return;
      const r = bar.getBoundingClientRect();
      const visibleH = vv && vv.height ? vv.height : window.innerHeight;
      const vTop = vv && typeof vv.offsetTop === "number" ? vv.offsetTop : 0;
      const bottom = r.bottom - vTop;
      const over = bottom - visibleH;
      if (over > 0) window.scrollBy({ top: over + 8, behavior: "auto" });
    } catch (e) { /* 无布局环境跳过 */ }
  }, typeof delay === "number" ? delay : 200);
}

/** 输入框聚焦/失焦时同步视口变量并把输入行推回可视区 */
function initKeyboardGuards() {
  syncViewportVars();
  window.addEventListener("resize", () => { syncViewportVars(); fitChatHeight(); });
  const vv = window.visualViewport;
  if (vv && typeof vv.addEventListener === "function") {
    vv.addEventListener("resize", () => { syncViewportVars(); fitChatHeight(); pinInputIntoView(60); });
    vv.addEventListener("scroll", () => { syncViewportVars(); });
  }
  const sel = "#chat-input, #ai-assistant-input, #resume-raw, #jd-text, #code-editor";
  document.addEventListener("focusin", e => {
    const el = e.target;
    if (!el || typeof el.matches !== "function") return;
    if (!el.matches(sel)) return;
    /* 只有「对话输入框」才进入输入态：代码沙盒需要键盘，不能被折叠掉 */
    const chat = el.matches("#chat-input, #ai-assistant-input");
    document.documentElement.classList.toggle("kb-chat", chat);
    syncViewportVars();
    fitChatHeight();
    pinInputIntoView(240);        // 等键盘起落动画结束再对齐
  });
  document.addEventListener("focusout", e => {
    const el = e.target;
    if (!el || typeof el.matches !== "function") return;
    if (!el.matches(sel)) return;
    document.documentElement.classList.remove("kb-chat");
    syncViewportVars();
    setTimeout(() => { syncViewportVars(); fitChatHeight(); }, 260);
  });
  // 键盘收起（视口恢复）时统一重算，避免「输入栏悬在半空」
  window.addEventListener("resize", () => {
    if (keyboardInset() === 0) document.documentElement.classList.remove("kb-chat");
  });
}

/* ============================================================
 * v42 · 首页信息优先级裁剪（只在窄屏生效）
 *   落地页有 7 屏内容：功能矩阵 1926px、流程图 921px、数字统计 328px…
 *   手机上全量堆叠 = 一条 5700px 的滚动条，10 秒内看不到「面试闭环」。
 *   做法：窄屏把密集模块收成一行折叠条，首屏只剩价值主张 + 一个主 CTA。
 *   DOM 结构不变（section 只是被折叠），所以打印、复制、测试、桌面布局全部照旧。
 * ============================================================ */
const LANDING_FOLD_TARGETS = [
  { sel: ".hero-spec", title: "运行规格", hint: "在线后端 · GLM-4-Flash · 确定性评分引擎" },
  { sel: ".hero-mock", title: "面试实录样例", hint: "看一段真实追问与量化回答" },
  { sel: "#features", title: "功能矩阵", hint: "8 个业务模块 · 求职全流程闭环" },
  { sel: "#workflow", title: "四步流程", hint: "简历 → 面试 → 报告 → 计划" },
  { sel: "#stats", title: "关键数字", hint: "5 Agent · 24 岗位 · 2081 断言" },
];

function initMobileLandingFold() {
  const land = document.querySelector("#view-landing");
  LANDING_FOLD_TARGETS.forEach((cfg, i) => {
    let box;
    try { box = document.querySelector(cfg.sel); } catch (e) { return; }
    if (!box || !box.dataset || !box.classList || typeof box.insertBefore !== "function") return;
    // 只折叠落地页内部的模块（dashboard 里的 #stats 不受影响）
    if (land && box.closest && box.closest("#view-landing") !== land) return;
    if (box.dataset.foldReady) return;
    box.dataset.foldReady = "1";
    const panelId = "fm-fold-" + i;
    box.id = box.id || panelId;
    box.classList.add("is-foldable");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fold-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", box.id);
    btn.innerHTML =
      `<span class="ft-chev" aria-hidden="true">▸</span>` +
      `<span class="ft-title">${cfg.title}</span>` +
      `<span class="ft-hint">${cfg.hint}</span>`;
    btn.addEventListener("click", () => {
      const on = box.classList.toggle("fold-open");
      btn.setAttribute("aria-expanded", on ? "true" : "false");
      if (on) requestAnimationFrame(fitChatHeight);
    });
    box.parentNode.insertBefore(btn, box);
  });
  applyMobileLandingFold();
}

/** 依据当前宽度决定折叠条是否生效：宽屏一律展开（桌面布局零变化） */
function applyMobileLandingFold() {
  let narrow = false;
  try {
    narrow = !!(window.matchMedia && window.matchMedia("(max-width: 640px)").matches);
  } catch (e) { narrow = false; }
  document.querySelectorAll(".is-foldable").forEach(box => {
    if (!box.classList) return;
    const btn = box.parentNode ? box.parentNode.querySelector('.fold-toggle[aria-controls="' + box.id + '"]') : null;
    const on = !narrow || box.classList.contains("fold-open");
    box.classList.toggle("fold-hidden", !on);
    if (btn && !narrow) btn.setAttribute("aria-expanded", "true");
    else if (btn) btn.setAttribute("aria-expanded", box.classList.contains("fold-open") ? "true" : "false");
  });
}

function bootApp() {
  // 更新用户菜单
  renderUserMenu();
  // 游客横幅 / 功能按钮锁定态
  updateGuestBanner();
  // 主题色按钮状态同步 + 数据看板动画
  // 注：applyTabIcons() 随 v8 移除 .tabs 后已空转，不再调用（函数保留在 §11）
  syncAccentBtn();
  animateCounters();
  // 加载当前用户数据（依赖 currentUser，故放在这里）
  initMobileCompact();
  initMobileLandingFold();
  syncHeaderHeight();
  window.addEventListener("resize", syncHeaderHeight);
  window.addEventListener("resize", applyMobileLandingFold);
  // v42：键盘/视口守卫（visualViewport 变化时重算可视高度与对话区）
  initKeyboardGuards();
  session = store.get("fm_session", { mode: "general", turns: [] });
  matchResult = store.get("fm_match", null);
  turn = session.turns.length;
  // 恢复 LLM 面板状态
  initLlmPanel();
  // 恢复简历文本（JD 的恢复交给 bootstrapV10 里的 restoreJdSelection）
  const savedResume = store.get("fm_resume", "");
  if (savedResume) $("resume").value = savedResume;
  // 恢复匹配报告
  if (matchResult) {
    $("match-result").innerHTML = `<div class="match-result card" style="padding:16px;margin-top:16px">
      <div class="match-body"><b style="font-size:13.5px">已恢复上次匹配报告</b>（匹配分 ${matchResult.matchScore}）
      <div style="margin-top:8px">${matchResult.skills.slice(0, 8).map(s => `<span class="chip chip-green">${s}</span>`).join("")}
      ${matchResult.gaps.slice(0, 5).map(g => `<span class="chip chip-red">${g}</span>`).join("")}</div></div></div>`;
  } else {
    $("match-result").innerHTML = "";
  }
  // 恢复面试会话（v24：初始态升级为蓝图空状态引导；有历史会话时由 restoreSession 重建，不渲染空态）
  if (!session.turns.length) {
    $("chat-body").innerHTML = `<div class="empty-state">
    <span class="es-eyebrow">READY · 面试待开始</span>
    <div class="es-title">向 AI 面试官团队发出第一条消息</div>
    <div class="es-desc">规划 / 技术 / 观察员三位面试官将依次提问、检索知识库并记录证据，5 轮后可生成可解释评分报告。</div>
    <div class="es-actions">
      <button class="es-chip" onclick="fillChatSuggestion('我是计算机专业应届生，想应聘 Java 后端开发，请面试我')">Java 后端 · 校招</button>
      <button class="es-chip" onclick="fillChatSuggestion('我有两年前端经验，想挑战大厂 P6，请模拟一场技术面试')">前端 · 社招进阶</button>
      <button class="es-chip" onclick="fillChatSuggestion('我是产品经理，准备转行 AI 方向，请帮我做一场交叉面试')">转行 · 交叉面试</button>
    </div>
    <div class="es-hint"><kbd>Enter</kbd> 发送 · <kbd>Ctrl/⌘+K</kbd> 聚焦输入框 · <kbd>Ctrl/⌘+Enter</kbd> 发送</div>
  </div>`;
  } else {
    $("chat-body").innerHTML = "";
  }
  $("timeline").innerHTML = '<div class="tl-item" style="color:var(--faint)">面试开始后，这里实时展示提问规划、资料检索与证据记录。</div>';
  if (session.turns.length) restoreSession();
  else { setCurrentSpeaker("提问规划"); $("progress-bar").style.width = "0"; }
  // 窄屏默认折叠时间线，避免占满屏幕（matchMedia 在个别环境缺失，防御性跳过）
  try { if (window.matchMedia && window.matchMedia("(max-width: 860px)").matches) $("timeline-box").removeAttribute("open"); } catch (e) {}
  // 重置报告缓存，避免跨用户复用
  lastReportSig = "";
  // v10：首访引导 + 知识库容量展示 + 侧栏面试进度
  initOnboarding();
  updateKbCount();
  // beta1.0：向量索引（缓存命中即用，未命中现算 hashing 向量，毫秒级）
  try { ensureVecIndex(); renderVecBar(); } catch (e) {}
  syncCareerCounts();
  syncSidebarBadge();
  syncStatusPill();
  // v39：网络在线/离线监听——断网时明确告知用户已降级本地模式
  initNetworkMonitor();
  // 应用当前 hash 子路由
  try { applyRoute(); } catch (e) {}
  // v17：滚动渐入（应用静态卡片）
  revealScan();
}

/* v39：网络在线/离线监听。
 * 断网 → 提示已降级本地 Mock；恢复 → 提示已回到在线模式。
 * 同时把离线态写进状态胶囊，避免用户误以为仍在真实后端。 */
function initNetworkMonitor() {
  const apply = (online) => {
    try {
      const pill = $("status-pill");
      const txt = $("status-text");
      if (pill) pill.classList.toggle("offline", !online);
      if (txt && !txt.dataset.base) txt.dataset.base = txt.textContent;
      if (txt) txt.textContent = online
        ? (txt.dataset.base || "Mock 模式")
        : "离线 · 本地 Mock";
    } catch (e) {}
    if (typeof syncStatusPill === "function") {
      try { syncStatusPill(); } catch (e) {}
    }
  };
  if (typeof window.addEventListener !== "function") return;
  if (!navigator.onLine) {
    apply(false);
    toast("⚠️ 当前处于离线状态，已切换为本地 Mock 模式（功能流程不中断）");
  }
  window.addEventListener("offline", () => {
    apply(false);
    toast("⚠️ 网络已断开，已自动降级为本地 Mock 模式（流程不中断）");
  });
  window.addEventListener("online", () => {
    apply(true);
    toast("✅ 网络已恢复，正在重新连接后端…");
  });
}

/* ---- v10 · 首访引导卡 ---- */
function initOnboarding() {
  const box = $("onboarding");
  if (!box) return;
  try {
    if (localStorage.getItem("g_onboarding_done") === "1") { box.hidden = true; return; }
  } catch (e) {}
  box.hidden = false;
}
function dismissOnboarding() {
  const box = $("onboarding");
  if (box) box.hidden = true;
  try { localStorage.setItem("g_onboarding_done", "1"); } catch (e) {}
}

/* ---- v10 · 横幅可关闭（会话级记忆） ---- */
function dismissBanner() {
  const b = $("demo-banner");
  if (b) b.style.display = "none";
  try { sessionStorage.setItem("g_banner_dismissed", "1"); } catch (e) {}
}
function restoreBanner() {
  const b = $("demo-banner");
  if (!b) return;
  try {
    if (sessionStorage.getItem("g_banner_dismissed") === "1") b.style.display = "none";
  } catch (e) {}
}

/* ---- v10 · 知识库容量展示 ---- */
function updateKbCount() {
  if (typeof KB === "undefined" || !Array.isArray(KB)) return;   // 同上：防御 TDZ
  const el = $("kb-count");
  if (el) el.textContent = `知识库 ${KB.length} 条`;
}

/* ---- v10 · 岗位数量集中派生，避免文案与数据脱节 ---- */
function syncCareerCounts() {
  // init() 执行时 CAREER_DB 尚未初始化（TDZ），此处需防御；真正的赋值由脚本末尾 bootstrapV10 完成
  if (typeof CAREER_DB === "undefined" || !Array.isArray(CAREER_DB)) return;
  const n = CAREER_DB.length;
  // 文案占位（落地页特性卡 + 职业探索页说明）
  document.querySelectorAll(".js-career-count").forEach(el => { el.textContent = String(n); });
  // 数字滚动动画的目标值
  ["stat-careers-l", "stat-careers-d"].forEach(id => {
    const el = $(id);
    if (el) el.dataset.count = String(n);
  });
}

/* ---- v10 · 侧栏「模拟面试」进度徽章 ---- */
function syncSidebarBadge() {
  const badge = $("sb-interview-badge");
  if (!badge) return;
  const n = session.turns ? session.turns.length : 0;
  badge.textContent = `${n}/5`;
  if (n >= 5) {
    badge.style.background = "color-mix(in srgb, var(--green) 16%, transparent)";
    badge.style.color = "var(--green)";
  } else {
    badge.style.background = "var(--brand-bg)";
    badge.style.color = "var(--brand)";
  }
}

/* ---- v10 · 快捷键帮助 ---- */
function showShortcuts() {
  alert([
    "快捷键：",
    "Ctrl / Cmd + Enter  发送面试回答",
    "Ctrl / Cmd + K      聚焦输入框",
    "Esc                 关闭弹窗与下拉",
  ].join("\n"));
}


