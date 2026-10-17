"use strict";
/* ============================================================
 * 10. 主题色变体（默认紫 / 牛客绿 / 科技蓝）
 * ============================================================ */
const ACCENTS = ["default", "green", "blue"];
const ACCENT_LABELS = { "default": "紫色", "green": "牛客绿", "blue": "科技蓝" };
function cycleAccent() {
  const cur = document.documentElement.dataset.accent || "default";
  const i = ACCENTS.indexOf(cur);
  const next = ACCENTS[(i + 1) % ACCENTS.length];
  document.documentElement.dataset.accent = next;
  store.set("g_accent", next, true);
  syncAccentBtn();
  toast("主题色：" + ACCENT_LABELS[next]);
}
function syncAccentBtn() {
  const cur = document.documentElement.dataset.accent || "default";
  const icon = cur === "green" ? "🟢" : cur === "blue" ? "🔵" : "🟣";
  $("accent-btn").textContent = icon;
  const l = $("accent-btn-l"); if (l) l.textContent = icon;   // 落地页导航同步
}

