"use strict";
/* ============================================================
 * Z2. 媒体加载 v30（Beta 1.1.0 · 完整性补全层）
 * ① 懒加载：<img/iframe data-src> 进入视口才真正取资源（IntersectionObserver，
 *    无 IO 时退化为立即加载，功能不缺失），并补 loading="lazy" 走浏览器原生兜底。
 * ② 渐进加载：data-src-sm 先上低清占位（blur），高清在后台预载完成后无缝替换淡入。
 * ③ 悬停预览：[data-preview] 元素 hover / 键盘 focus 时弹出放大预览浮层，
 *    Esc 或移出即收起；浮层图片同样按需加载。
 * 印刷风纪律：浮层为纸底 + 墨色发丝线（零投影），过渡只做透明度与模糊，不做位移。
 * ============================================================ */
(function () {
  const doc = document;
  const win = doc.defaultView || window;
  const RM = () => !!(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches);
  let lazyIO = null, panel = null, panelImg = null, previewFor = null;

  function el(tag, cls, txt) {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  /* ---------- ① + ② 懒加载 / 渐进加载 ---------- */
  function reveal(node) {
    if (!node) return;
    node.classList.add("bp-media-in");
    node.setAttribute("data-loaded", "1");
  }
  function loadMedia(node) {
    if (!node || node.__bpLoaded) return false;
    node.__bpLoaded = 1;
    const full = node.getAttribute("data-src");
    if (!full) return false;
    node.classList.add("bp-media");
    if (!node.getAttribute("loading")) node.setAttribute("loading", "lazy");
    if (!node.getAttribute("decoding")) node.setAttribute("decoding", "async");

    const small = node.getAttribute("data-src-sm");
    if (small && small !== full && win.Image) {
      /* 先落低清占位，高清在后台预载完成后再替换（渐进 blur-up） */
      node.src = small;
      const pre = new win.Image();
      pre.onload = function () {
        node.src = full;
        reveal(node);
      };
      pre.onerror = function () { reveal(node); };   // 高清失败：低清照样可读
      pre.src = full;
    } else {
      node.addEventListener("load", function () { reveal(node); });
      node.addEventListener("error", function () { reveal(node); });
      node.src = full;
    }
    node.removeAttribute("data-src");
    return true;
  }
  function initLazy(root) {
    const scope = root || doc;
    const nodes = scope.querySelectorAll("img[data-src],iframe[data-src]");
    let n = 0;
    Array.prototype.forEach.call(nodes, node => {
      if (node.__bpLazy) return;
      node.__bpLazy = 1;
      n++;
      if (!("IntersectionObserver" in win)) { loadMedia(node); return; }
      if (!lazyIO) {
        lazyIO = new win.IntersectionObserver(entries => {
          Array.prototype.forEach.call(entries, e => {
            if (e.isIntersecting && e.target) { loadMedia(e.target); lazyIO.unobserve(e.target); }
          });
        }, { rootMargin: "120px" });
      }
      lazyIO.observe(node);
    });
    return n;
  }

  /* ---------- ③ 悬停 / 聚焦预览 ---------- */
  function ensurePanel() {
    if (panel) return panel;
    panel = el("div", "bp-preview");
    panel.setAttribute("aria-hidden", "true");
    panelImg = doc.createElement("img");
    panelImg.alt = "";
    panel.appendChild(panelImg);
    doc.body.appendChild(panel);
    return panel;
  }
  function place(node) {
    const r = node.getBoundingClientRect();
    const w = panel.offsetWidth || 240;
    /* 高度以面板实际渲染为准；图片尚未解码时（首次悬停）按 260 估算
     * （260px 宽面板 + 方形快照图的实际高度），避免按 180 低估导致
     * 图片加载后面板长高、溢出视口底部 */
    const h = panel.offsetHeight || 260;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(8, Math.min(left, (win.innerWidth || 1024) - w - 8));
    panel.style.left = left + "px";
    /* v31.2：垂直翻转——下方空间不足时翻到缩略图上方。
     * 原实现固定放在 r.bottom + 10，缩略图靠近视口底部时面板溢出视口
     * 或被右下角悬浮件（返回顶部 1100 / AI 球 90 / Toast 100）盖住 */
    const vh = win.innerHeight || 768;
    let top = r.bottom + 10 + h > vh - 8 ? r.top - h - 10 : r.bottom + 10;
    top = Math.max(8, Math.min(top, vh - h - 8));
    panel.style.top = top + "px";
  }
  function showPreview(node) {
    const src = node && node.getAttribute("data-preview");
    if (!src) return false;
    ensurePanel();
    previewFor = node;
    panel.classList.add("show");
    place(node);
    if (panelImg.getAttribute("src") !== src) {
      /* 首次取图：图片解码后面板高度才稳定，加载完成后再校准一次位置 */
      panelImg.onload = function () { if (previewFor) place(previewFor); };
      panelImg.removeAttribute("src");
      panelImg.src = src;
    }
    return true;
  }
  function hidePreview() {
    if (!panel) return false;
    panel.classList.remove("show");
    previewFor = null;
    return true;
  }
  function initPreview(root) {
    const scope = root || doc;
    const nodes = scope.querySelectorAll("[data-preview]");
    let n = 0;
    Array.prototype.forEach.call(nodes, node => {
      if (node.__bpPrev) return;
      node.__bpPrev = 1;
      n++;
      if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "0");
      node.addEventListener("mouseenter", () => showPreview(node));
      node.addEventListener("mouseleave", hidePreview);
      node.addEventListener("focus", () => showPreview(node));
      node.addEventListener("blur", hidePreview);
    });
    if (n) {
      doc.addEventListener("keydown", e => { if (e.key === "Escape") hidePreview(); });
      win.addEventListener("scroll", hidePreview, { passive: true });
      if (RM() && panel) panel.style.transition = "none";
    }
    return n;
  }

  function initAll() {
    const r = {};
    try { r.lazy = initLazy(); } catch (e) { r.lazy = 0; }
    try { r.preview = initPreview(); } catch (e) { r.preview = 0; }
    return r;
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { initAll(); });
  else initAll();

  window.__bpMedia = {
    init: initAll,
    initLazy: initLazy,
    initPreview: initPreview,
    loadMedia: loadMedia,
    showPreview: showPreview,
    hidePreview: hidePreview,
    place: place,
    visible: () => !!(panel && panel.classList.contains("show")),
    target: () => previewFor,
    reduced: RM,
  };
})();
