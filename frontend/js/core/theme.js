"use strict";
/* ============================================================
 * 3. 主题（g_theme 为全局共享 key，登录页与主应用同步）
 * v29：三态 —— auto（默认·跟随系统）/ light / dark（显式覆盖）
 * ============================================================ */
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  store.set("g_theme", t, true);
  syncThemeBtn();
}
function syncThemeBtn() {
  const d = document.documentElement.dataset.theme === "dark";
  /* v31：主题钮用图标系统（线性 SVG 跟随 currentColor）；__bpIcons 未就绪时
     先放 data-ic 兜底 span，待图标模块 DOMContentLoaded 换装（reveal 初始化早于 icons 加载） */
  const name = d ? "sun" : "moon";
  const svg = (window.__bpIcons && window.__bpIcons.icon) ? window.__bpIcons.icon(name) : "";
  const html = svg || ('<span data-ic="' + name + '">' + (d ? "\u2600\uFE0F" : "\uD83C\uDF19") + "</span>");
  ["theme-btn", "theme-btn-l", "theme-btn-a"].forEach(id => { const b = $(id); if (b) b.innerHTML = html; });
}
function toggleTheme() {
  setThemeMode(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  const radar = $("radar");
  if (radar && radar.innerHTML) renderReport(true);
}

/* ===== v29 · 系统跟随 ===== */
let bpSysMQ = null;
function bpSystemDark() { return !!(bpSysMQ && bpSysMQ.matches); }
function themeMode() { return store.get("g_theme_mode", "auto"); }
function setThemeMode(m) {
  store.set("g_theme_mode", m, true);
  applyTheme(m === "auto" ? (bpSystemDark() ? "dark" : "light") : m);
  const radar = $("radar");
  if (radar && radar.innerHTML) renderReport(true);
}
/* 三态循环：auto → light → dark → auto（供开发者/命令面板用） */
function cycleThemeMode() {
  const cur = themeMode();
  setThemeMode(cur === "auto" ? "light" : cur === "light" ? "dark" : "auto");
  return themeMode();
}
function bpOnSystemTheme() {
  if (themeMode() !== "auto") return;
  applyTheme(bpSystemDark() ? "dark" : "light");
  const radar = $("radar");
  if (radar && radar.innerHTML) renderReport(true);
}
function initThemeFollow() {
  bpSysMQ = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  if (!bpSysMQ) return false;
  if (typeof bpSysMQ.addEventListener === "function") bpSysMQ.addEventListener("change", bpOnSystemTheme);
  else if (typeof bpSysMQ.addListener === "function") bpSysMQ.addListener(bpOnSystemTheme);
  return true;
}
