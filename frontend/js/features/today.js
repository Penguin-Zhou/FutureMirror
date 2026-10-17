"use strict";
/* ============================================================
 * v15 · 今日推荐岗位（互动模块）
 * ============================================================ */
function renderTodayPicks() {
  const picks = document.getElementById("today-picks");
  if (!picks || typeof CAREER_DB === "undefined") return;

  // 随机抽 4 个岗位
  const shuffled = [...CAREER_DB].sort(() => Math.random() - 0.5).slice(0, 4);
  picks.innerHTML = shuffled.map(c => `
    <div class="today-pick" onclick="startInterviewFor('${c.name.replace(/'/g, "\\'")}')" title="点击开始「${c.name}」模拟面试">
      <div class="today-pick-head">
        <div class="today-pick-icon">${c.icon}</div>
        <div>
          <div class="today-pick-name">${c.name}</div>
          ${c.salary ? `<div class="today-pick-salary">💰 ${c.salary}</div>` : ""}
        </div>
      </div>
      <div class="today-pick-desc">${c.desc}</div>
      <div class="today-pick-cta">开始模拟面试 →</div>
    </div>
  `).join("");

  revealScan();   // v17：新推荐卡片渐入
  try { if (typeof logDev === "function") logDev("info", "今日推荐岗位已刷新"); } catch (e) {}
}

/* ---------- 初始化：渲染今日推荐 ---------- */
(function initTodayPicks() {
  try {
    if (document.getElementById("today-picks")) renderTodayPicks();
  } catch (e) {}
})();

