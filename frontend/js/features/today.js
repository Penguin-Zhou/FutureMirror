"use strict";
/* ============================================================
 * v38 · 今日推荐岗位（真实岗位 · 每日稳定种子）
 *   改用 career.js 的 REAL_JOBS（企业真实在招岗位），按日期生成稳定种子，
 *   每天刷新但当天内保持一致；每张卡片可「一键添加到投递看板」。
 * ============================================================ */
let todayOffset = 0;   // 「换一批」手动偏移（在每日种子基础上轮转）

function rotateTodayPicks() {
  const n = (typeof REAL_JOBS !== "undefined") ? REAL_JOBS.length : 0;
  if (!n) return;
  todayOffset = (todayOffset + 1) % n;
  renderTodayPicks();
  toast("已换一批真实岗位");
}

function todaySeed() {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

function renderTodayPicks() {
  const picks = document.getElementById("today-picks");
  if (!picks || typeof REAL_JOBS === "undefined") return;

  const n = REAL_JOBS.length;
  if (!n) { picks.innerHTML = `<div class="notice notice-info">暂无推荐岗位。</div>`; return; }
  const k = Math.min(4, n);
  const seed = todaySeed();
  const start = (seed + todayOffset) % Math.max(1, n - k + 1);
  const daily = [];
  for (let i = 0; i < k; i++) daily.push(REAL_JOBS[(start + i) % n]);

  picks.innerHTML = daily.map((j) => `
    <div class="today-pick">
      <div class="today-pick-head">
        <div class="today-pick-icon">🏢</div>
        <div>
          <div class="today-pick-name">${escHtml(j.role)}</div>
          <div class="today-pick-company">${escHtml(j.company)}</div>
        </div>
      </div>
      <div class="today-pick-meta">${escHtml(j.city || "")}${j.salary ? "　·　💰 " + escHtml(j.salary) : ""}</div>
      <div class="today-pick-desc">${escHtml((j.desc || "").slice(0, 64))}</div>
      <div class="today-pick-cta">
        <button class="btn btn-primary btn-sm" type="button" onclick="addRealJobToBoard('${escHtml(j.id)}')">＋ 添加到看板</button>
        ${j.url ? `<a class="btn btn-outline btn-sm" href="${escHtml(j.url).replace(/"/g, "&quot;")}" target="_blank" rel="noopener">官网</a>` : ""}
      </div>
    </div>
  `).join("");

  revealScan();
  try { if (typeof logDev === "function") logDev("info", "今日推荐岗位已刷新（真实岗位）"); } catch (e) {}
}

(function initTodayPicks() {
  try {
    if (document.getElementById("today-picks")) renderTodayPicks();
  } catch (e) {}
})();
