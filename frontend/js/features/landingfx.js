"use strict";
/* ============================================================
 * v26 · 落地页动态层（Blueprint Landing Kit）
 * 设计要点（继续「图纸」语言，杜绝 AI 模板花活）：
 * 1) Hero 文案轮播：等宽字体打字机逐字敲出价值点，方块光标闪烁
 *    （steps 硬切，不用平滑渐变——终端气质）；
 * 2) 面试实录播台：Mock 对话气泡入视口依序「揭载」（clip-path 自上而下），
 *    末气泡跟一枚朱红流式光标——预告真实 SSE 的逐字体验；
 * 3) 渐进增强：无 JS 时轮播为空、实录完整可见；reduced-motion 全部静态落位。
 * 4) v54 图纸开场：图幅尺寸线自左落笔 → 标题逐行揭载 → 关键词高亮扫过；
 *    右侧区块标尺走针（填充与点亮在 scrollfx 里与导航侦测同源）；
 *    数据条入视口落下刻度尺。全部只加类、不改内容，CSS 里备好初态与终态。
 * 注：十字准线与坐标读数已于 v27 迁入 appfx.js 并扩展为全站能力
 * （app 功能页卡 PG 编号 / 开发者节 SEC 编号 / 输入聚焦准线隐身）。
 * ============================================================ */
(function initLandingFx() {
  const reduced = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };
  const FX = (window.__bpLanding = {
    rotator: false, mock: false, phrases: 0, playMock: null,
    overture: false, rail: false, ticks: 0, enter: null,
  });

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

  /* ---------- ③ v54 图纸开场：尺寸线落笔 + 标题揭载 + 高亮扫过 ----------
   * 只做「加类」：初态与终态都在 CSS 里，删掉这段脚本页面仍是完成态。
   * 类落在 #view-landing 上，重复调用幂等（路由切回落地页时不会重播）。 */
  function enterLanding() {
    const view = document.getElementById("view-landing");
    if (!view || !view.classList) return;
    if (view.classList.contains("landing-enter")) return;
    if (reduced()) { FX.overture = "static"; return; }        // 静态落位，不注入任何动画初态
    view.classList.add("landing-enter");
    FX.overture = true;
    const grad = view.querySelector(".hero-title .grad");
    if (grad && grad.classList) {
      setTimeout(() => { grad.classList.add("inked"); }, 760);  // 等标题第二行落定再扫高亮
    }
  }
  FX.enter = enterLanding;

  /* ---------- ④ v54 区块标尺：点击走位（填充与点亮由 scrollfx 统一驱动） ---------- */
  function initRail() {
    const rail = document.getElementById("bp-rail");
    if (!rail) return;
    const items = [...rail.querySelectorAll(".rail-item")];
    if (!items.length) return;
    FX.rail = true;
    items.forEach(a => {
      a.addEventListener("click", e => {
        const id = (a.getAttribute("href") || "").replace(/^#/, "");
        const el = id ? document.getElementById(id) : null;
        if (!el) return;                                       // 无此区块：交回浏览器默认行为
        e.preventDefault();
        const nav = document.querySelector(".landing-nav");
        const off = (nav && nav.offsetHeight ? nav.offsetHeight : 0) + 12;
        const top = el.getBoundingClientRect().top + (window.scrollY || 0) - off;
        try {
          window.scrollTo({ top, behavior: reduced() ? "auto" : "smooth" });
        } catch (err) {
          window.scrollTo(0, top);
        }
      });
    });
  }

  /* ---------- ⑤ v54 数据条刻度尺：入视口逐格立起 ---------- */
  const SCALE_TICKS = 12;
  function initStatScale() {
    const stats = [...document.querySelectorAll("#view-landing .landing-stat")];
    if (!stats.length) return;
    let count = 0;
    stats.forEach(stat => {
      if (stat.querySelector(".ls-scale")) return;
      const val = stat.querySelector(".val");
      if (!val || typeof val.insertAdjacentElement !== "function") return;
      const scale = document.createElement("i");
      scale.className = "ls-scale";
      scale.setAttribute("aria-hidden", "true");
      for (let i = 0; i < SCALE_TICKS; i++) {
        const tick = document.createElement("i");
        tick.style.setProperty("--i", String(i));
        scale.appendChild(tick);
        count++;
      }
      val.insertAdjacentElement("afterend", scale);
    });
    FX.ticks = count;
    if (!("IntersectionObserver" in window)) {
      stats.forEach(s => s.classList.add("ticks-on"));         // 无 IO：直接立起
      return;
    }
    try {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          en.target.classList.add("ticks-on");
          io.unobserve(en.target);
        });
      }, { threshold: 0.4 });
      stats.forEach(s => io.observe(s));
    } catch (e) {
      stats.forEach(s => s.classList.add("ticks-on"));
    }
  }

  /* ---------- 入口 ---------- */
  function boot() {
    try { initHeroRotator(); } catch (e) {}
    try { playHeroMock(); } catch (e) {}
    try { enterLanding(); } catch (e) {}
    try { initRail(); } catch (e) {}
    try { initStatScale(); } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
