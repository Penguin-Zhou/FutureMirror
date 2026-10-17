"use strict";
/* ============================================================
 * 9. 启动流程：先判断登录，再进入应用
 * ============================================================ */
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
  // 恢复面试会话
  $("chat-body").innerHTML = '<div class="msg msg-system">面试开始：选择模式并发送第一条消息，AI 面试官团队将依次提问</div>';
  $("timeline").innerHTML = '<div class="tl-item" style="color:var(--faint)">面试开始后，这里实时展示 Agent 规划、工具调用与证据记录。</div>';
  if (session.turns.length) restoreSession();
  else { setCurrentSpeaker("规划 Agent"); $("progress-bar").style.width = "0"; }
  // 窄屏默认折叠时间线，避免占满屏幕
  if (matchMedia("(max-width: 860px)").matches) $("timeline-box").removeAttribute("open");
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
  // 应用当前 hash 子路由
  try { applyRoute(); } catch (e) {}
  // v17：滚动渐入（应用静态卡片）
  revealScan();
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


