"use strict";
/* ============================================================
 * 1. 全局状态 & 工具（store 按用户隔离数据）
 * ============================================================ */
const $ = id => document.getElementById(id);
let currentUser = null;   // { id, email, name, passHash, createdAt }

/* HTML 转义：凡是把用户输入（简历原文、面试回答、岗位名、笔记）拼进 innerHTML
 * 的地方都必须先过这一层，否则一段带标签的文本就能改变 DOM 结构。 */
const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ESC_MAP[c]);
}

/* 数据隔离 key：g_ 前缀表示全局共享；其余按当前用户加前缀（用户 id 自带 u_ 前缀） */
function kk(k) {
  if (k.startsWith("g_")) return k;
  return currentUser ? `${currentUser.id}_${k}` : `guest_${k}`;
}

const store = {
  /**
   * 读取当前用户名下的数据；会话存储优先于本地存储。
   * @template T
   * @param {string} k 键名（`g_` 前缀为全局共享，不加用户前缀）
   * @param {T} [d] 读取失败或不存在时的默认值
   * @returns {T}
   */
  get(k, d) {
    try {
      const key = kk(k);
      // sessionStorage（当前会话，更新鲜）优先，回落 localStorage（长期历史）
      const v = sessionStorage.getItem(key) ?? localStorage.getItem(key);
      return v ? JSON.parse(v) : d;
    } catch { return d; }
  },
  /**
   * 写入当前用户名下的数据。
   * @param {string} k 键名
   * @param {*} v 需可 JSON 序列化的值
   * @param {boolean} [persist] true 写 localStorage（长期），否则写 sessionStorage
   * @returns {void}
   */
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
/* ---------- v39 · 统一输入校验（可读错误 + 内联提示，避免空提交产出无效结果） ---------- */
/**
 * 校验一段文本是否满足最小长度。
 * @param {unknown} value 待校验值
 * @param {number} minLen 最小字符数
 * @param {string} label 字段名称，用于拼错误文案
 * @returns {string} 错误文案；空串表示通过
 */
function checkText(value, minLen, label) {
  const v = String(value == null ? "" : value).trim();
  if (!v) return `请先填写${label}`;
  if (minLen && v.length < minLen) return `${label}过短（至少 ${minLen} 字），请补充具体内容后再提交`;
  return "";
}
/**
 * 校验并把错误挂到输入框旁（内联提示 + aria-invalid），失败时弹出 toast 并聚焦。
 * @param {HTMLInputElement|HTMLTextAreaElement|null} el 输入元素
 * @param {number} minLen 最小字符数
 * @param {string} label 字段名称
 * @returns {boolean} true 表示通过
 */
function guardField(el, minLen, label) {
  if (!el) return true;
  const err = checkText(el.value, minLen, label || "内容");
  let tip = el.parentNode ? el.parentNode.querySelector(".field-error") : null;
  if (err) {
    el.classList.add("invalid");
    el.setAttribute("aria-invalid", "true");
    if (el.parentNode) {
      if (!tip) {
        tip = document.createElement("div");
        tip.className = "field-error";
        tip.setAttribute("role", "alert");
        el.parentNode.appendChild(tip);
      }
      tip.textContent = err;
    }
    toast(err);
    try { el.focus(); } catch { /* 元素不可聚焦时忽略 */ }
    return false;
  }
  el.classList.remove("invalid");
  el.removeAttribute("aria-invalid");
  if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
  return true;
}
/**
 * 清除某输入元素上的错误态（内容变化时调用）。
 * @param {HTMLElement|null} el 输入元素
 * @returns {void}
 */
function clearFieldError(el) {
  if (!el) return;
  el.classList.remove("invalid");
  el.removeAttribute("aria-invalid");
  const tip = el.parentNode ? el.parentNode.querySelector(".field-error") : null;
  if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
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

