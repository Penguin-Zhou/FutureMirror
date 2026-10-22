"use strict";
/* ============================================================
 * X. 动效与交互层 v29（Beta 1.0.9 · 专家能力层）
 * 印刷风纪律：位移只用水平/scale，禁止 translateY 上浮入场；
 * 不用 backdrop-filter、不用 box-shadow 投影；reduced-motion 全部停用。
 * 全部能力在元素存在时才挂载，缺失容器不报错。
 * ============================================================ */
(function () {
  const doc = document;
  const win = doc.defaultView || window;
  const RM = () => !!(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const FINE = () => !!(win.matchMedia && win.matchMedia("(pointer: fine)").matches);
  const raf = fn => (win.requestAnimationFrame ? win.requestAnimationFrame(fn) : setTimeout(fn, 16));

  /* ① 自定义准线光标（十字环 + 朱红中心点，仅精细指针且非减弱动效） */
  let cur = null, dot = null, cx = 0, cy = 0, frame = 0, cursorReady = false;
  const HOT = 'a,button,.es-chip,.chip,.bp-th-sort,.bp-board-card,.radar-dot';
  function paintCursor() {
    frame = 0;
    if (cur) { cur.style.transform = "translate3d(" + cx + "px," + cy + "px,0) translate(-50%,-50%)"; cur.classList.add("live"); }
    if (dot) { dot.style.transform = "translate3d(" + (cx - 1) + "px," + (cy - 1) + "px,0)"; dot.classList.add("live"); }
  }
  function initCursor() {
    if (!FINE() || RM() || cursorReady) return false;
    cur = doc.createElement("div"); cur.className = "bp-cursor"; cur.setAttribute("aria-hidden", "true");
    dot = doc.createElement("div"); dot.className = "bp-cursor-dot"; dot.setAttribute("aria-hidden", "true");
    doc.body.appendChild(cur); doc.body.appendChild(dot);
    doc.documentElement.classList.add("bp-cursor-on");
    doc.addEventListener("mousemove", e => {
      cx = e.clientX; cy = e.clientY;
      if (!frame) frame = raf(paintCursor);
    }, { passive: true });
    doc.addEventListener("mouseover", e => {
      const t = e.target; if (t && t.closest && t.closest(HOT) && cur) cur.classList.add("hot");
    });
    doc.addEventListener("mouseout", e => {
      const t = e.target; if (t && t.closest && t.closest(HOT) && cur) cur.classList.remove("hot");
    });
    doc.addEventListener("mouseleave", () => {
      if (cur) cur.classList.remove("live");
      if (dot) dot.classList.remove("live");
    });
    cursorReady = true;
    return true;
  }

  /* ② 磁铁按钮：向光标吸附（小幅位移，非上浮） */
  function initMagnets() {
    if (RM()) return 0;
    const els = doc.querySelectorAll("[data-magnet],.landing-hero .btn,.btn-primary");
    let n = 0;
    Array.prototype.forEach.call(els, el => {
      if (el.__bpMag) return;
      el.__bpMag = 1; n++;
      el.classList.add("bp-magnet");
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.transform = "translate3d(" + (dx * 6).toFixed(2) + "px," + (dy * 3).toFixed(2) + "px,0)";
      }, { passive: true });
      el.addEventListener("mouseleave", () => { el.style.transform = "translate3d(0,0,0)"; });
    });
    return n;
  }

  /* ③ 导航吸顶收缩（56 → 48，下边线加深，非阴影） */
  function initNavShrink() {
    const h = doc.querySelector("header");
    if (!h) return false;
    let st = false;
    const up = () => {
      const y = win.scrollY || doc.documentElement.scrollTop || 0;
      const s = y > 8;
      if (s !== st) { st = s; h.classList.toggle("scrolled", s); }
    };
    win.addEventListener("scroll", up, { passive: true });
    up();
    return true;
  }

  /* ④ 滚动吸附（proximity 柔和，落地页分段对齐） */
  function initSnap() {
    const secs = doc.querySelectorAll(".landing-section");
    Array.prototype.forEach.call(secs, s => s.classList.add("bp-snap-item"));
    if (secs.length) doc.documentElement.classList.add("bp-snap-y");
    return secs.length;
  }

  /* ⑤ 横向画廊：窄屏时把统计卡组转为 scroll-snap 横向廊 */
  function initGalleries() {
    const c = doc.querySelector(".landing-stats");
    if (!c || !win.matchMedia) return false;
    const mq = win.matchMedia("(max-width: 860px)");
    const apply = () => { c.classList.toggle("bp-gallery", !!mq.matches); };
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else if (mq.addListener) mq.addListener(apply);
    return true;
  }

  /* ⑥ View Transition 路由转场（不支持时直接执行，无动画） */
  function withVT(fn) {
    if (RM() || typeof doc.startViewTransition !== "function") { fn(); return false; }
    try { doc.startViewTransition(fn); return true; } catch (e) { fn(); return false; }
  }
  function initViewTransition() {
    const orig = win.showView;
    if (typeof orig !== "function" || orig.__bpVT) return false;
    const wrapped = function (v) { withVT(function () { orig(v); }); };
    wrapped.__bpVT = true;
    win.showView = wrapped;
    return true;
  }

  /* ⑦ 卡片触感反馈（scale 微放 + 墨色描边，禁止上浮） */
  function initTactile() {
    const cs = doc.querySelectorAll(".card,.landing-stat,.page-card");
    Array.prototype.forEach.call(cs, c => c.classList.add("bp-tactile"));
    return cs.length;
  }

  /* ⑧ 可拖拽 / 可调整大小弹窗（transform 平移，不破坏居中布局） */
  function makeDraggable(box, grip) {
    let on = false, sx = 0, sy = 0, ox = 0, oy = 0;
    grip.addEventListener("pointerdown", e => {
      if (e.button) return;
      on = true; sx = e.clientX; sy = e.clientY;
      const m = /translate3d\((-?[\d.]+)px,\s*(-?[\d.]+)px/.exec(box.style.transform || "");
      ox = m ? parseFloat(m[1]) : 0; oy = m ? parseFloat(m[2]) : 0;
      if (grip.setPointerCapture) { try { grip.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    grip.addEventListener("pointermove", e => {
      if (!on) return;
      box.style.transform = "translate3d(" + (ox + e.clientX - sx) + "px," + (oy + e.clientY - sy) + "px,0)";
    });
    grip.addEventListener("pointerup", () => { on = false; });
    grip.addEventListener("pointercancel", () => { on = false; });
  }
  function makeResizable(box, handle) {
    let on = false, sw = 0, sh = 0, sx = 0, sy = 0;
    handle.addEventListener("pointerdown", e => {
      on = true; sw = box.offsetWidth; sh = box.offsetHeight; sx = e.clientX; sy = e.clientY;
      e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
    });
    doc.addEventListener("pointermove", e => {
      if (!on) return;
      box.style.width = Math.max(280, sw + e.clientX - sx) + "px";
      box.style.height = Math.max(160, sh + e.clientY - sy) + "px";
    });
    doc.addEventListener("pointerup", () => { on = false; });
  }
  function initDialogs() {
    const boxes = doc.querySelectorAll(".modal-box");
    Array.prototype.forEach.call(boxes, b => {
      if (b.__bpDlg) return;
      b.__bpDlg = 1;
      const head = b.querySelector(".modal-head") || b;
      head.classList.add("bp-dialog-grip");
      const h = doc.createElement("div");
      h.className = "bp-dialog-resize";
      h.setAttribute("aria-hidden", "true");
      b.appendChild(h);
      makeDraggable(b, head);
      makeResizable(b, h);
    });
    return boxes.length;
  }

  /* ⑨ 可折叠侧边栏（宽度弹簧收放） */
  function toggleAside(el) {
    if (!el) return false;
    const c = el.classList.toggle("collapsed");
    const t = el.querySelector(".bp-aside-toggle");
    if (t) t.textContent = c ? "展开" : "收起";
    return c;
  }
  function initAside() {
    const a = doc.querySelector("[data-aside],#timeline-box");
    if (!a || a.__bpAside) return false;
    a.__bpAside = 1;
    a.classList.add("bp-aside");
    const btn = doc.createElement("button");
    btn.className = "bp-aside-toggle";
    btn.type = "button";
    btn.textContent = "收起";
    btn.addEventListener("click", () => toggleAside(a));
    const summary = a.tagName === "DETAILS" ? a.querySelector("summary") : null;
    if (summary) summary.appendChild(btn);
    else a.insertBefore(btn, a.firstChild);
    return true;
  }

  /* ⑩ 视差：滚动时按 data-speed 差速位移（非入场动画） */
  function initParallax() {
    if (RM()) return 0;
    const els = doc.querySelectorAll("[data-speed]");
    if (!els.length) return 0;
    let ticking = false;
    const up = () => {
      ticking = false;
      const vh = win.innerHeight || 800;
      Array.prototype.forEach.call(els, el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const k = parseFloat(el.getAttribute("data-speed")) || 1;
        const off = (r.top + r.height / 2 - vh / 2) * (k - 1);
        el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
      });
    };
    win.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; raf(up); }
    }, { passive: true });
    up();
    return els.length;
  }

  /* 统一挂载：任一子项失败不影响其余 */
  function initAll() {
    const r = {};
    try { r.cursor = initCursor(); } catch (e) { r.cursor = false; }
    try { r.magnets = initMagnets(); } catch (e) { r.magnets = 0; }
    try { r.navShrink = initNavShrink(); } catch (e) { r.navShrink = false; }
    try { r.snap = initSnap(); } catch (e) { r.snap = 0; }
    try { r.gallery = initGalleries(); } catch (e) { r.gallery = false; }
    try { r.viewTransition = initViewTransition(); } catch (e) { r.viewTransition = false; }
    try { r.tactile = initTactile(); } catch (e) { r.tactile = 0; }
    try { r.dialogs = initDialogs(); } catch (e) { r.dialogs = 0; }
    try { r.aside = initAside(); } catch (e) { r.aside = false; }
    try { r.parallax = initParallax(); } catch (e) { r.parallax = 0; }
    return r;
  }

  /* 自初始化：等待 DOM 就绪（脚本位于 body 末尾，readyState 常为 loading） */
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { initAll(); });
  else initAll();

  window.__bpMotion = {
    init: initAll,
    initCursor: initCursor,
    initMagnets: initMagnets,
    initNavShrink: initNavShrink,
    initSnap: initSnap,
    initGalleries: initGalleries,
    initViewTransition: initViewTransition,
    initTactile: initTactile,
    initDialogs: initDialogs,
    initAside: initAside,
    initParallax: initParallax,
    toggleAside: toggleAside,
    withVT: withVT,
    reduced: RM,
    fine: FINE,
  };
})();
