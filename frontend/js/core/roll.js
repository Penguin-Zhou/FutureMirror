"use strict";
/* ============================================================
 * 11. 数据看板数字滚动 + Tab 图标胶囊
 * ============================================================ */
function animateCounters() {
  document.querySelectorAll(".stat-num[data-count]").forEach(el => {
    if (el.dataset.done === "1") return;   // 重复进入不重播
    el.dataset.done = "1";
    const target = +el.dataset.count;
    let cur = 0;
    const step = Math.max(1, Math.round(target / 20));
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(t); }
      el.textContent = cur;
    }, 40);
  });
}
function applyTabIcons() {
  const TAB_ICONS = { match: "📄", interview: "🎙️", rag: "📖", report: "📊", resume: "✍️", career: "🧭" };
  document.querySelectorAll(".tab").forEach(t => {
    const key = t.dataset.tab;
    if (TAB_ICONS[key] && !t.querySelector(".tab-icon")) {
      t.innerHTML = `<span class="tab-icon">${TAB_ICONS[key]}</span> ${t.textContent.replace(/^[①-⑨]\s*/, "")}`;
    }
  });
}

