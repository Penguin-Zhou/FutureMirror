"use strict";
/* ============================================================
 * v26 · 落地页动态层（Blueprint Landing Kit）
 * 设计要点（继续「图纸」语言，杜绝 AI 模板花活）：
 * 1) Hero 文案轮播：等宽字体打字机逐字敲出价值点，方块光标闪烁
 *    （steps 硬切，不用平滑渐变——终端气质）；
 * 2) 面试实录播台：Mock 对话气泡入视口依序「揭载」（clip-path 自上而下），
 *    末气泡跟一枚朱红流式光标——预告真实 SSE 的逐字体验；
 * 3) 渐进增强：无 JS 时轮播为空、实录完整可见；reduced-motion 全部静态落位。
 * 注：十字准线与坐标读数已于 v27 迁入 appfx.js 并扩展为全站能力
 * （app 功能页卡 PG 编号 / 开发者节 SEC 编号 / 输入聚焦准线隐身）。
 * ============================================================ */
(function initLandingFx() {
  const reduced = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };
  const FX = (window.__bpLanding = { rotator: false, mock: false, phrases: 0, playMock: null });

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

  /* ---------- 入口 ---------- */
  function boot() {
    try { initHeroRotator(); } catch (e) {}
    try { playHeroMock(); } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
