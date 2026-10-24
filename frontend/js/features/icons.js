"use strict";
/* ============================================================
 * v31 · 全站图标系统（Blueprint Icon Set）
 * 替代原模板化 emoji：24×24 viewBox 线性图标，stroke=currentColor
 * 继承文字色（暗色自动反色），每枚仅一枚朱红 accent（≤5% 纪律）；
 * 直角语言：stroke-linecap/linejoin 取 square/miter，零圆角零渐变零投影。
 * 用法：任何元素加 data-ic="<name>"，本模块在 DOMContentLoaded 时
 *       把内容替换为对应 SVG（保留 aria-hidden，纯装饰不打扰读屏）。
 * ============================================================ */
(function initIcons() {
  /* 笔触公共属性：currentColor + 方头方角 + 1.5 发丝线 */
  const S = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"';
  const A = 'fill="var(--brand)" stroke="none"';   // 朱红 accent
  const BP_ICONS = {
    /* ---- 导航十一枚 ---- */
    dashboard: `<rect x="3.5" y="3.5" width="7" height="7" ${S}/><rect x="13.5" y="3.5" width="7" height="7" ${S}/><rect x="3.5" y="13.5" width="7" height="7" ${S}/><rect x="14.5" y="14.5" width="5" height="5" ${A}/>`,
    match: `<path d="M5 3.5h8l4 4v13H5z" ${S}/><path d="M13 3.5v4h4" ${S}/><circle cx="15.5" cy="15" r="3" ${S}/><path d="M17.6 17.1L20 19.5" ${S}/>`,
    resume: `<path d="M4.5 3.5h9l5 5v12h-14z" ${S}/><path d="M13.5 3.5v5h5" ${S}/><path d="M7.5 12.5l2 2 3.5-3.5" ${S}/><path d="M7.5 16.5h6" ${S}/>`,
    career: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M15.5 8.5L13 13l-4.5 2.5L11 11z" ${S}/><circle cx="12" cy="12" r="1.2" ${A}/>`,
    interview: `<rect x="9.2" y="3" width="5.6" height="10.5" rx="2.8" ${S}/><path d="M6 11.2a6 6 0 0 0 12 0" ${S}/><path d="M12 17.2v3.3" ${S}/><path d="M8.5 20.5h7" ${S}/>`,
    rag: `<path d="M12 6.8C10.2 5.2 7.4 4.6 4.2 5v13.4c3.2-.4 6 .2 7.8 1.6" ${S}/><path d="M12 6.8c1.8-1.6 4.6-2.2 7.8-1.6v13.4c-3.2-.4-6 .2-7.8 1.6" ${S}/><path d="M12 6.8v13.6" ${S}/>`,
    report: `<path d="M3.5 20.5h17" ${S}/><path d="M6 20.5V12" ${S}/><path d="M11 20.5V7" ${S}/><path d="M16 20.5v-6" stroke="var(--brand)" stroke-width="1.5" fill="none" stroke-linecap="square" stroke-linejoin="miter"/>`,
    plan: `<rect x="3.5" y="5" width="17" height="15.5" ${S}/><path d="M3.5 9.5h17" ${S}/><path d="M8 2.8v4" ${S}/><path d="M16 2.8v4" ${S}/><rect x="7" y="13" width="3.4" height="3.4" ${A}/><path d="M13 13.5h4" ${S}/><path d="M13 17h4" ${S}/>`,
    quiz: `<rect x="5.5" y="4.5" width="13" height="16" ${S}/><path d="M9.5 4.5V2.8h5v1.7" ${S}/><path d="M9 12.2l2.2 2.2 4-4.2" stroke="var(--brand)" stroke-width="1.8" fill="none" stroke-linecap="square" stroke-linejoin="miter"/><path d="M9 17.2h6" ${S}/>`,
    profile: `<circle cx="12" cy="8.2" r="3.6" ${S}/><path d="M5.2 20c1.3-3.5 3.9-5.2 6.8-5.2s5.5 1.7 6.8 5.2" ${S}/>`,
    jobs: `<rect x="3.5" y="7.5" width="17" height="12" ${S}/><path d="M9 7.5V5.6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.9" ${S}/><path d="M3.5 12.5h17" ${S}/><rect x="10.8" y="11.2" width="2.4" height="2.6" ${A}/>`,
    /* ---- 顶栏 / 用户菜单 ---- */
    moon: `<path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8 8.6 8.6 0 1 0 20.2 14.6z" ${S}/>`,
    sun: `<circle cx="12" cy="12" r="4.4" ${S}/><path d="M12 2.8v2.4" ${S}/><path d="M12 18.8v2.4" ${S}/><path d="M2.8 12h2.4" ${S}/><path d="M18.8 12h2.4" ${S}/><path d="M5.5 5.5l1.7 1.7" ${S}/><path d="M16.8 16.8l1.7 1.7" ${S}/><path d="M18.5 5.5l-1.7 1.7" ${S}/><path d="M7.2 16.8l-1.7 1.7" ${S}/><circle cx="12" cy="12" r="1.5" ${A}/>`,
    palette: `<circle cx="12" cy="12" r="8.5" ${S}/><circle cx="9" cy="9" r="1.1" ${A}/><circle cx="15" cy="9.4" r="1.1" ${S}/><circle cx="9.6" cy="15" r="1.1" ${S}/>`,
    user: `<circle cx="12" cy="8.2" r="3.6" ${S}/><path d="M5.2 20c1.3-3.5 3.9-5.2 6.8-5.2s5.5 1.7 6.8 5.2" ${S}/>`,
    key: `<circle cx="8" cy="12" r="3.6" ${S}/><path d="M11.6 12h9" ${S}/><path d="M17.2 12v3.2" ${S}/><path d="M20 12v2.4" ${S}/>`,
    users: `<circle cx="9" cy="8.4" r="3.2" ${S}/><path d="M3.4 19.6c1-3.1 3.1-4.7 5.6-4.7s4.6 1.6 5.6 4.7" ${S}/><path d="M15.6 5.6a3.2 3.2 0 0 1 0 5.9" ${S}/><path d="M17.4 15.2c1.6.6 2.7 2 3.2 4.4" ${S}/>`,
    exit: `<path d="M4 4.5h9v15H4z" ${S}/><path d="M12.8 12h7" ${S}/><path d="M16.6 8.8l3.2 3.2-3.2 3.2" ${S}/>`,
    /* ---- 能力 / 特性 ---- */
    agents: `<circle cx="12" cy="5.6" r="2.6" ${S}/><circle cx="5.4" cy="17" r="2.6" ${S}/><circle cx="18.6" cy="17" r="2.6" ${S}/><path d="M10.8 8L6.6 14.6" ${S}/><path d="M13.2 8l4.2 6.6" ${S}/><path d="M8 17h8" ${S}/><circle cx="12" cy="5.6" r="1" ${A}/>`,
    lock: `<rect x="5.5" y="10.5" width="13" height="9.5" ${S}/><path d="M8.6 10.5V7a3.4 3.4 0 0 1 6.8 0v3.5" ${S}/><circle cx="12" cy="15.2" r="1.4" ${A}/>`,
    shield: `<path d="M12 3.5l7 2.6v5.6c0 4.4-2.9 7.4-7 8.8-4.1-1.4-7-4.4-7-8.8V6.1z" ${S}/><path d="M8.8 11.8l2.3 2.3 4.1-4.3" stroke="var(--brand)" stroke-width="1.8" fill="none" stroke-linecap="square" stroke-linejoin="miter"/>`,
    bolt: `<path d="M13.2 2.8L5.6 13.4h5.2l-1.4 7.8 8-10.8h-5.4z" ${S}/>`,
    spark: `<path d="M12 3.2l1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8z" ${S}/><circle cx="18.6" cy="18.4" r="1.6" ${A}/>`,
    clock: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 7v5.4l3.6 2.2" ${S}/>`,
    star: `<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z" ${S}/>`,
    target: `<circle cx="12" cy="12" r="8.5" ${S}/><circle cx="12" cy="12" r="4.8" ${S}/><circle cx="12" cy="12" r="1.4" ${A}/>`,
    bell: `<path d="M12 3.5a5.6 5.6 0 0 1 5.6 5.6c0 4 1.4 5.4 2.4 6.4H4c1-1 2.4-2.4 2.4-6.4A5.6 5.6 0 0 1 12 3.5z" ${S}/><path d="M9.6 19.4a2.6 2.6 0 0 0 4.8 0" ${S}/>`,
    /* ---- 文档 / 操作 ---- */
    doc: `<path d="M5.5 3.5h8l4.5 4.5v12.5h-12.5z" ${S}/><path d="M13.5 3.5v4.5h4.5" ${S}/><path d="M8.5 12.5h7" ${S}/><path d="M8.5 16h5" ${S}/>`,
    upload: `<path d="M12 3.5v11" ${S}/><path d="M7.8 8.2L12 4l4.2 4.2" ${S}/><path d="M4.5 15.5v4h15v-4" ${S}/>`,
    pencil: `<path d="M4.5 19.5h4L20 8l-4-4L4.5 15.5z" ${S}/><path d="M14.5 5.5l4 4" ${S}/><path d="M4.5 19.5l.8-3.3" ${S}/>`,
    search: `<circle cx="10.5" cy="10.5" r="6.5" ${S}/><path d="M15.4 15.4L20.5 20.5" ${S}/>`,
    copy: `<rect x="8.5" y="8.5" width="11" height="11" ${S}/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2" ${S}/>`,
    printer: `<path d="M7 8.5V4h10v4.5" ${S}/><rect x="4" y="8.5" width="16" height="7.5" ${S}/><path d="M7 12.5h10v7.5H7z" ${S}/><rect x="9.4" y="14.8" width="5.2" height="2.4" ${A}/>`,
    refresh: `<path d="M20 12a8 8 0 1 1-2.4-5.7" ${S}/><path d="M20.4 3.6v4h-4" ${S}/>`,
    check: `<path d="M4.5 12.6l4.6 4.6L19.5 6.8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="square" stroke-linejoin="miter"/>`,
    gauge: `<path d="M4 16.5a8.5 8.5 0 1 1 16 0" ${S}/><path d="M12 16.5l4-5.5" stroke="var(--brand)" stroke-width="1.8" fill="none" stroke-linecap="square"/><circle cx="12" cy="16.5" r="1.3" ${S}/><path d="M4 20.5h16" ${S}/>`,
  };
  function bpIcon(name) {
    const body = BP_ICONS[name];
    if (!body) return "";
    return '<svg class="bp-ic" viewBox="0 0 24 24" width="1.15em" height="1.15em" aria-hidden="true" focusable="false">' + body + "</svg>";
  }
  /* 把 [data-ic] 元素内容替换为图标（幂等：同图不重画） */
  function bpIconSwap(root) {
    const scope = root || document;
    if (!scope || !scope.querySelectorAll) return 0;
    let n = 0;
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ic]"), el => {
      const name = el.getAttribute("data-ic");
      if (!name || el.dataset.icDone === name) return;
      const svg = bpIcon(name);
      if (!svg) return;
      el.innerHTML = svg;
      el.dataset.icDone = name;
      n++;
    });
    return n;
  }
  function boot() { bpIconSwap(document); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  window.__bpIcons = { set: BP_ICONS, icon: bpIcon, swap: bpIconSwap };
})();
