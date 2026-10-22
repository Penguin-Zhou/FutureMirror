"use strict";
/* ============================================================
 * v26 · 滚动驱动层（Blueprint Scroll Kit）
 * 设计要点：
 * 1) 返回顶部：右下角直角墨框按钮 + SVG 朱红进度环（周长映射滚动比例），
 *    超过 600px 才显形——克制的「可返回」感知，不常驻抢视线；
 * 2) 滚动侦测：落地页导航链接随视口所在区块点亮朱红下划线（.active），
 *    与 hover 扫入共用一套 underline 语言；
 * 3) 蓝图绘制线：工作流步骤顶部 2px 墨线入视口时自左向右画出
 *    （scaleX，nth-child stagger 120ms），入过一次即锁定 .bp-drawn；
 * 4) 全部监听 passive + rAF 节流；动效宪法下过渡瞬时化，功能不缺失；
 * 5) 纯增强：任何异常只静默跳过，不影响主流程与内容可见性。
 * ============================================================ */
(function initScrollFx() {
  const reduced = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };
  const FX = (window.__bpScroll = { top: false, spy: false, draw: false, updateSpy: null, initTop: null });

  /* ---------- ① 返回顶部 + 进度环 ---------- */
  const RING_C = 2 * Math.PI * 19;                      // r=19 的周长（viewBox 44）
  function initBackToTop() {
    if (document.getElementById("bp-top")) return;
    const btn = document.createElement("button");
    btn.id = "bp-top";
    btn.className = "bp-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "返回顶部");
    btn.title = "返回顶部";
    btn.innerHTML =
      '<svg class="bp-top-ring" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">' +
      '<circle class="bp-top-bg" cx="22" cy="22" r="19"></circle>' +
      '<circle class="bp-top-fg" cx="22" cy="22" r="19" stroke-dasharray="' + RING_C.toFixed(2) + '" stroke-dashoffset="' + RING_C.toFixed(2) + '"></circle>' +
      "</svg>" +
      '<span class="bp-top-arrow" aria-hidden="true">↑</span>';
    (document.body || document.documentElement).appendChild(btn);

    const ring = btn.querySelector(".bp-top-fg");
    let ticking = false;
    const update = () => {
      ticking = false;
      const de = document.documentElement;
      const max = de.scrollHeight - de.clientHeight;
      const top = window.scrollY || de.scrollTop || 0;
      const p = max > 4 ? Math.min(1, Math.max(0, top / max)) : 0;
      btn.classList.toggle("show", top > 600);
      if (ring) ring.style.strokeDashoffset = (RING_C * (1 - p)).toFixed(2);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    btn.addEventListener("click", () => {
      try {
        window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
      } catch (e) {
        try { window.scrollTo(0, 0); } catch (e2) { /* 老浏览器兜底 */ }
      }
    });
    update();
    FX.top = true;
    FX.initTop = initBackToTop;                         // 暴露给测试（幂等验证）
  }

  /* ---------- ② 滚动侦测（落地页导航点亮） ---------- */
  const SPY_SECTIONS = ["features", "workflow", "stats"];
  function updateScrollSpy() {
    const links = [...document.querySelectorAll('.landing-nav-links a[href^="#"]')];
    if (!links.length) return;
    const onLanding = !!document.querySelector("#view-landing.active");
    if (!onLanding) {
      links.forEach(a => a.classList.remove("active"));
      return;
    }
    const probe = (window.scrollY || 0) + 96;
    let hit = "";
    for (const id of SPY_SECTIONS) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const top = r.top + (window.scrollY || 0);
      if (top <= probe && top + r.height > probe) { hit = id; break; }
    }
    links.forEach(a => a.classList.toggle("active", hit !== "" && a.getAttribute("href") === "#" + hit));
  }
  function initScrollSpy() {
    if (FX.spy) return;
    FX.spy = true;
    FX.updateSpy = updateScrollSpy;                     // 暴露给测试与路由切换
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; updateScrollSpy(); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateScrollSpy();
  }

  /* ---------- ③ 蓝图绘制线（工作流步骤） ---------- */
  function initDrawOnScroll() {
    if (FX.draw) return;
    const steps = [...document.querySelectorAll(".workflow-step")];
    if (!steps.length) return;
    steps.forEach((s, i) => {
      if (!s.querySelector(".ws-draw")) {
        const line = document.createElement("i");
        line.className = "ws-draw";
        line.setAttribute("aria-hidden", "true");
        s.appendChild(line);
      }
      s.style.setProperty("--ws-i", String(i));
    });
    if (!("IntersectionObserver" in window)) {           // 无 IO：直接落笔
      steps.forEach(s => s.classList.add("bp-drawn"));
      FX.draw = true;
      return;
    }
    try {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          en.target.classList.add("bp-drawn");
          io.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.2 });
      steps.forEach(s => io.observe(s));
      FX.draw = true;
    } catch (e) {
      steps.forEach(s => s.classList.add("bp-drawn"));   // IO 异常：静态落笔
      FX.draw = true;
    }
  }

  /* ---------- 入口 ---------- */
  function boot() {
    try { initBackToTop(); } catch (e) {}
    try { initScrollSpy(); } catch (e) {}
    try { initDrawOnScroll(); } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
