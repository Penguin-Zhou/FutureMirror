"use strict";
/* ============================================================
 * v25 · 蓝图粒子层（Canvas 粒子场 + Hero 视差 + 点击涟漪）
 * 设计要点（Blueprint Editorial 语言，杜绝 AI 模板星空）：
 * 1) 方形墨点 + 发丝线连线 + 稀疏朱红标记点——工程图纸「测绘点」气质；
 *    严禁圆形光点 / 发光 blur / 彩色渐变，密度刻意压低（≤90 点）；
 * 2) 全站 fixed 背景层（z-index 0 · pointer-events none），
 *    .landing / .app-shell 抬升 z-index 1，内容永不被粒子遮挡；
 * 3) 交互：光标 110px 半径内粒子受轻微斥力（推开而非吸附），
 *    窗口点击产生朱红方形涟漪（仅落地页视图激活，避免应用内误触）；
 * 4) Hero 视差：鼠标移动时规格面板与预览窗反向微移（±7px），
 *    空间深度感而非「上浮」——与零上浮设计语言不冲突；
 * 5) 性能护栏：DPR 适配（上限 2x）、面积封顶、document.hidden 暂停、
 *    连线仅阈值内计算（n≤90 时 O(n²) 可接受）、主题切换重读色板；
 * 6) 降级链：无 canvas → 无 2d context → reduced-motion → 静态渲染一帧停笔。
 * ============================================================ */
(function initBlueprintFx() {
  const FX = (window.__bpFx = { running: false, staticOnly: false, particles: 0 });
  const reduced = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };

  /* ---------- 色板：跟随 data-theme 重读 ---------- */
  let palette = { dot: "#1C1913", mark: "#BE3A1E", line: "28,25,19", theme: "" };
  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    const t = document.documentElement.dataset.theme || "light";
    if (t === palette.theme) return palette;
    palette = {
      theme: t,
      dot: (cs.getPropertyValue("--ink") || "#1C1913").trim(),
      mark: (cs.getPropertyValue("--brand") || "#BE3A1E").trim(),
      line: t === "dark" ? "238,232,216" : "28,25,19",
    };
    return palette;
  }

  /* ---------- 粒子场 ---------- */
  function startParticles() {
    const canvas = document.createElement("canvas");
    canvas.className = "bp-particles";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return; }               // 无 2d 上下文：整体降级

    const P = readPalette();
    let W = 0, H = 0, dpr = 1, raf = 0, frame = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    const ripples = [];
    const N = () => Math.min(90, Math.max(30, Math.round((innerWidth * innerHeight) / 22000)));
    let dots = [];

    function seed() {
      const n = N();
      dots = [];
      for (let i = 0; i < n; i++) {
        dots.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
          s: Math.random() < 0.14 ? 3 : 2,                 // 稀疏大点（朱红标记）
          mark: Math.random() < 0.12,                      // ≈1/8 朱红测绘标记
        });
      }
      FX.particles = dots.length;
    }
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    function drawOnce() {
      ctx.clearRect(0, 0, W, H);
      const P2 = readPalette();
      ctx.lineWidth = 1;
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16900) {                              // 130px 阈值内连线
            const o = (1 - Math.sqrt(d2) / 130) * 0.1;
            ctx.strokeStyle = "rgba(" + P2.line + "," + o.toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const a of dots) {
        ctx.fillStyle = a.mark ? P2.mark : P2.dot;
        ctx.globalAlpha = a.mark ? 0.5 : 0.14;
        ctx.fillRect(a.x - a.s / 2, a.y - a.s / 2, a.s, a.s);   // 方点（直角语言）
      }
      ctx.globalAlpha = 1;
    }
    function step() {
      frame++;
      if (frame % 45 === 0) readPalette();                // 周期校准主题色
      const P2 = readPalette();
      for (const a of dots) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        if (mouse.active) {                               // 光标斥力（图纸上「吹散」）
          const dx = a.x - mouse.x, dy = a.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 12100 && d2 > 1) {
            const d = Math.sqrt(d2), f = (1 - d / 110) * 0.6;
            a.x += (dx / d) * f; a.y += (dy / d) * f;
          }
        }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16900) {
            const o = (1 - Math.sqrt(d2) / 130) * 0.1;
            ctx.strokeStyle = "rgba(" + P2.line + "," + o.toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const a of dots) {
        ctx.fillStyle = a.mark ? P2.mark : P2.dot;
        ctx.globalAlpha = a.mark ? 0.5 : 0.14;
        ctx.fillRect(a.x - a.s / 2, a.y - a.s / 2, a.s, a.s);
      }
      ctx.globalAlpha = 1;
      for (let i = ripples.length - 1; i >= 0; i--) {     // 方形涟漪
        const r = ripples[i];
        r.t += 16;
        const k = r.t / 620;
        if (k >= 1) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = P2.mark;
        ctx.globalAlpha = (1 - k) * 0.55;
        ctx.lineWidth = 2;
        const sz = 14 + k * 54;
        ctx.strokeRect(r.x - sz / 2, r.y - sz / 2, sz, sz);
        ctx.globalAlpha = 1;
      }
      if (FX.running) raf = requestAnimationFrame(step);
    }

    resize();
    addEventListener("resize", resize, { passive: true });
    addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
    addEventListener("mouseout", () => { mouse.active = false; }, { passive: true });
    addEventListener("click", e => {                     // 仅落地页视图激活涟漪
      try {
        if (!document.querySelector("#view-landing.active")) return;
        if (e.target.closest && e.target.closest("button, a, input, textarea, select")) return;
      } catch (err) { /* closest 不可用时放行 */ }
      ripples.push({ x: e.clientX, y: e.clientY, t: 0 });
      if (ripples.length > 6) ripples.shift();
    }, { passive: true });

    if (reduced()) { FX.staticOnly = true; drawOnce(); return; }   // 动效宪法：静态一帧
    FX.running = true;
    raf = requestAnimationFrame(step);

    document.addEventListener("visibilitychange", () => {
      if (FX.staticOnly) return;
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf); raf = 0; FX.running = false;
      } else if (!FX.running) {
        FX.running = true; raf = requestAnimationFrame(step);
      }
    });
  }

  /* ---------- Hero 视差（规格面板 / 预览窗反向微移） ---------- */
  function startParallax() {
    const spec = document.querySelector(".hero-spec");
    const mock = document.querySelector(".hero-mock");
    if (!spec && !mock) return;
    let ticking = false;
    const apply = e => {
      ticking = false;
      if (reduced()) return;
      const cx = innerWidth / 2, cy = innerHeight / 2;
      const dx = (e.clientX - cx) / cx, dy = (e.clientY - cy) / cy;
      if (spec) spec.style.transform = "translate3d(" + (dx * 7).toFixed(2) + "px," + (dy * 5).toFixed(2) + "px,0)";
      if (mock) mock.style.transform = "translate3d(" + (-dx * 5).toFixed(2) + "px," + (-dy * 4).toFixed(2) + "px,0)";
    };
    addEventListener("mousemove", e => {
      if (!ticking) { ticking = true; requestAnimationFrame(() => apply(e)); }
    }, { passive: true });
    addEventListener("mouseout", () => {
      if (spec) spec.style.transform = "";
      if (mock) mock.style.transform = "";
    }, { passive: true });
  }

  /* ---------- 入口（bootstrap 之后由 init 链调用；此处自执行兜底） ---------- */
  function boot() {
    try {
      startParticles();
      startParallax();
    } catch (e) { /* 粒子层为纯增强，任何异常不影响主流程 */ }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
