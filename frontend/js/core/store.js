"use strict";
/* ============================================================
 * 1. 全局状态 & 工具（store 按用户隔离数据）
 * ============================================================ */
const $ = id => document.getElementById(id);
let currentUser = null;   // { id, email, name, passHash, createdAt }

/* 数据隔离 key：g_ 前缀表示全局共享；其余按当前用户加前缀（用户 id 自带 u_ 前缀） */
function kk(k) {
  if (k.startsWith("g_")) return k;
  return currentUser ? `${currentUser.id}_${k}` : `guest_${k}`;
}

const store = {
  get(k, d) {
    try {
      const key = kk(k);
      // sessionStorage（当前会话，更新鲜）优先，回落 localStorage（长期历史）
      const v = sessionStorage.getItem(key) ?? localStorage.getItem(key);
      return v ? JSON.parse(v) : d;
    } catch { return d; }
  },
  set(k, v, persist = false) {
    const key = kk(k);
    (persist ? localStorage : sessionStorage).setItem(key, JSON.stringify(v));
    // 写入长期存储时清除同名会话存储，避免读到旧值
    if (persist) sessionStorage.removeItem(key);
  },
};
let toastTimer;
/* v29：第二参 undo 为撤销回调，传入时在 Toast 上追加「撤销」按钮并延长驻留 */
function toast(msg, undo) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  if (typeof undo === "function") {
    t.classList.add("bp-toast-flex");
    const b = document.createElement("button");
    b.className = "toast-undo"; b.type = "button"; b.textContent = "撤销";
    b.addEventListener("click", function () { undo(); t.classList.remove("show"); });
    t.appendChild(b);
  } else {
    t.classList.remove("bp-toast-flex");
  }
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), undo ? 5200 : 2600);
}
function openMaterial(key) {
  if (key === "account") {
    if (navigator.clipboard) navigator.clipboard.writeText(CONFIG.testAccount);
    toast(CONFIG.testAccount + (navigator.clipboard ? "（已复制）" : ""));
    return;
  }
  const url = key === "full" ? (CONFIG.fullAppUrl || CONFIG.repoUrl) : CONFIG[key];
  if (!url) { toast(`「${MATERIAL_LABEL[key]}」链接即将开放（部署后更新）`); return; }
  window.open(url, "_blank", "noopener");
}

