"use strict";
/* ============================================================
 * 4. 应用内页面路由（hash 路由 —— switchTab 已在 0.6 节转发到 navTo）
 * ============================================================ */
/* 子导航键盘左右切换 */
document.addEventListener("keydown", e => {
  const items = [...document.querySelectorAll(".subnav-item")];
  const i = items.indexOf(document.activeElement);
  if (i < 0) return;
  if (e.key === "ArrowRight") { items[(i + 1) % items.length].focus(); e.preventDefault(); }
  if (e.key === "ArrowLeft") { items[(i - 1 + items.length) % items.length].focus(); e.preventDefault(); }
});

