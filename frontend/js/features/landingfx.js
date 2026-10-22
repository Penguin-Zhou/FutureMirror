"use strict";
/* ============================================================
 * v26 · 落地页动态层（Blueprint Landing Kit）
 * 设计要点（继续「图纸」语言，杜绝 AI 模板花活）：
 * 1) Hero 文案轮播：等宽字体打字机逐字敲出价值点，方块光标闪烁
 *    （steps 硬切，不用平滑渐变——终端气质）；
 * 2) 面试实录播台：Mock 对话气泡入视口依序「揭载」（clip-path 自上而下），
 *    末气泡跟一枚朱红流式光标——预告真实 SSE 的逐字体验；
 * 3) 蓝图十字准线：落地页视图内 1px 墨色十字线跟随光标（opacity .16），
 *    仅 (hover: hover) 设备 + 非 reduced-motion，出窗/切视图即隐；
 * 4) 坐标读数：特性卡 hover 显示等宽「BLK-序号 · X/Y」测绘chip，
 *    呼应取景器角标——图纸上量取位置的语言；
 * 5) 渐进增强：无 JS 时轮播为空、实录完整可见；reduced-motion 全部静态落位。
 * ============================================================ */
(function initLandingFx() {
  const reduced = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };
  const FX = (window.__bpLanding = { rotator: false, mock: false, cross: false, coord: false, phrases: 0, playMock: null, applyCross: null });

  /* ---------- ① Hero 文案轮播（等宽打字机） ---------- */
  const PHRASES = [
    "多 AGENT 圆桌协同追问",
    "五维可解释评分 · 证据引用原话",
    "RAG 混合检索 · 端侧 MINILM 向量",
    "三级降级兜底 · 流程不中断",
    "代码沙盒 · PII 脱敏",
  ];
  function initHeroRotator() {
    const out = document.getElementById("hr-text");
    if (!out) return;
    FX.rotator = true;
    FX.phrases = PHRASES.length;
    if (reduced()) { out.textContent = PHRASES[0]; return; }
    let pi = 0, ci = 0, del = false, timer = 0;
    const tick = () => {
      timer = 0;
      const cur = PHRASES[pi];
      if (!del) {
        ci++;
        out.textContent = cur.slice(0, ci);
        if (ci >= cur.length) { del = true; timer = setTimeout(tick, 1700); return; }
        timer = setTimeout(tick, 68);
      } else {
        ci--;
        out.textContent = cur.slice(0, Math.max(0, ci));
        if (ci <= 0) { del = false; pi = (pi + 1) % PHRASES.length; timer = setTimeout(tick, 460); return; }
        timer = setTimeout(tick, 34);
      }
    };
    timer = setTimeout(tick, 650);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { clearTimeout(timer); timer = 0; }
      else if (!timer) { timer = setTimeout(tick, 420); }
    });
  }

  /* ---------- ② 面试实录播台（气泡依序揭载 + 流式光标） ---------- */
  function playHeroMock() {
    const body = document.querySelector(".hero-mock-body");
    if (!body) return;
    const bubbles = [...body.querySelectorAll(".mock-bubble")];
    if (!bubbles.length) return;
    FX.mock = true;
    bubbles.forEach(b => { b.classList.remove("mock-in"); b.querySelectorAll(".mock-caret").forEach(c => c.remove()); });
    body.classList.add("mock-play");
    if (reduced()) { bubbles.forEach(b => b.classList.add("mock-in")); return; }
    bubbles.forEach((b, i) => setTimeout(() => b.classList.add("mock-in"), 340 + i * 560));
    const last = bubbles[bubbles.length - 1];
    setTimeout(() => {
      if (!last.querySelector(".mock-caret")) {
        const c = document.createElement("i");
        c.className = "mock-caret";
        c.setAttribute("aria-hidden", "true");
        last.appendChild(c);
      }
    }, 340 + (bubbles.length - 1) * 560 + 520);
  }
  FX.playMock = playHeroMock;

  /* ---------- ③ 蓝图十字准线（落地页 · 悬停设备） ---------- */
  function initCrosshair() {
    if (reduced()) return;
    try { if (window.matchMedia && window.matchMedia("(hover: none)").matches) return; } catch (e) {}
    if (document.querySelector(".bp-cross-x")) return;
    const cx = document.createElement("div");
    cx.className = "bp-cross bp-cross-x";
    cx.setAttribute("aria-hidden", "true");
    const cy = document.createElement("div");
    cy.className = "bp-cross bp-cross-y";
    cy.setAttribute("aria-hidden", "true");
    (document.body || document.documentElement).append(cx);
    (document.body || document.documentElement).append(cy);
    let mx = -9999, my = -9999, ticking = false, shown = false;
    const apply = () => {
      ticking = false;
      const onLanding = !!document.querySelector("#view-landing.active");
      const show = onLanding && mx > -900;
      if (show !== shown) {
        shown = show;
        cx.style.visibility = show ? "visible" : "hidden";
        cy.style.visibility = show ? "visible" : "hidden";
      }
      if (!show) return;
      cx.style.top = my + "px";
      cy.style.left = mx + "px";
    };
    window.addEventListener("mousemove", e => {
      mx = e.clientX; my = e.clientY;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    window.addEventListener("mouseout", () => {
      mx = -9999; my = -9999;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    apply();
    FX.cross = true;
    FX.applyCross = apply;                              // 暴露给视图切换：离开落地页即隐
  }

  /* ---------- ④ 特性卡坐标读数（BLK-序号 · X/Y） ---------- */
  function initCoordReadout() {
    if (document.querySelector(".fb-coord")) { FX.coord = true; return; }
    const blocks = [...document.querySelectorAll("#view-landing .feature-block")];
    if (!blocks.length) return;
    blocks.forEach((b, i) => {
      const tag = "BLK-" + String(i + 1).padStart(2, "0");
      const chip = document.createElement("span");
      chip.className = "fb-coord";
      chip.setAttribute("aria-hidden", "true");
      chip.textContent = tag + " · X--- Y---";
      b.appendChild(chip);
      let ticking = false, lx = 0, ly = 0;
      const apply = () => {
        ticking = false;
        chip.textContent = tag + " · X" + String(Math.round(Math.max(0, lx))).padStart(3, "0") +
          " Y" + String(Math.round(Math.max(0, ly))).padStart(3, "0");
      };
      b.addEventListener("mousemove", e => {
        const r = b.getBoundingClientRect();
        lx = e.clientX - r.left; ly = e.clientY - r.top;
        if (!ticking) { ticking = true; requestAnimationFrame(apply); }
      }, { passive: true });
    });
    FX.coord = true;
  }

  /* ---------- 入口 ---------- */
  function boot() {
    try { initHeroRotator(); } catch (e) {}
    try { playHeroMock(); } catch (e) {}
    try { initCrosshair(); } catch (e) {}
    try { initCoordReadout(); } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
