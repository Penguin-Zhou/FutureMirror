"use strict";
/* ============================================================
 * 3. 主题（g_theme 为全局共享 key，登录页与主应用同步）
 * ============================================================ */
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  store.set("g_theme", t, true);
  syncThemeBtn();
}
function syncThemeBtn() {
  const icon = document.documentElement.dataset.theme === "dark" ? "☀️" : "🌙";
  $("theme-btn").textContent = icon;
  const l = $("theme-btn-l"); if (l) l.textContent = icon;   // 落地页导航同步
}
function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  const radar = $("radar");
  if (radar && radar.innerHTML) renderReport(true);
}

