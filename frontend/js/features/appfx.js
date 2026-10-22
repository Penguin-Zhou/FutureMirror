"use strict";
/* ============================================================
 * v27 · 全站交互层（Blueprint App Kit）
 * 设计要点（动态全部长在蓝图语言上，可感知但不抢戏）：
 * 1) 页面切换编舞：进入应用子页时标题区自上而下「揭载」（clip-path）、
 *    面包屑跟一枚等宽方块光标（图纸重定位）、侧栏/底 Tab 激活条扫光；
 * 2) 登录页动态：注册密码强度计（4 段发丝线，墨→朱红）、CapsLock 提示、
 *    左右分栏 stagger 入场；
 * 3) 面试 LIVE：面试官徽章随轮转发言脉冲（MutationObserver 零侵入）；
 * 4) 数字滚动：评估报告总分 / 题库小测得分 count-up，维度条自 0 生长；
 * 5) 十字准线（自 landingfx 迁入并全站化）：任一视图跟随光标，
 *    聚焦输入类元素即隐身——不干扰任何录入；
 * 6) 坐标读数扩展：特性卡 BLK / 功能页卡 PG / 开发者节 SEC 三等编号；
 * 7) 开发者模式绘制线：eval-section 顶部 2px 墨线入视口自左画出；
 * 8) 渐进增强：无 JS 内容完整可见；reduced-motion 全部静态落位。
 * ============================================================ */
(function initAppFx() {
  const reduced = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };
  const FX = (window.__bpApp = {
    choreograph: null, countUpScan: null, reportIn: null,
    cross: false, coord: false, draw: false, speaking: false,
  });

  /* ---------- ① 视图/页面切换编舞 ---------- */
  function choreograph(view, page) {
    if (reduced()) return;
    try {
      if (view === "app") {
        const active = document.querySelector(".app-page.active");
        if (active) {
          const targets = [];
          const header = active.querySelector(".page-header");
          if (header) targets.push(header);
          const onb = active.querySelector(".onboarding-card:not([hidden])");
          if (onb) targets.push(onb);
          targets.forEach((el, i) => {
            el.classList.remove("bp-in");
            void el.offsetWidth;                                   // 强制 reflow 重启动画
            el.style.setProperty("--bp-i", String(i));
            el.classList.add("bp-in");
          });
        }
        // 面包屑：切页后跟一枚方块光标（1.2s 自消）
        const bc = $("bc-current");
        if (bc) {
          const old = bc.parentNode.querySelector(".bc-caret");
          if (old) old.remove();
          const caret = document.createElement("i");
          caret.className = "bc-caret";
          caret.setAttribute("aria-hidden", "true");
          bc.insertAdjacentElement("afterend", caret);
          setTimeout(() => caret.remove(), 1200);
        }
        // 侧栏 + 底部 Tab：激活条扫光（remove + reflow + add 重启 CSS 动画）
        document.querySelectorAll(".sb-item.active, .tabbar-item.active").forEach(el => {
          el.classList.remove("sb-flash");
          void el.offsetWidth;
          el.classList.add("sb-flash");
          setTimeout(() => el.classList.remove("sb-flash"), 800);
        });
      } else if (view === "auth") {
        [".auth-left", ".auth-right"].forEach((sel, i) => {
          const el = document.querySelector(sel);
          if (!el) return;
          el.classList.remove("bp-in");
          void el.offsetWidth;
          el.style.setProperty("--bp-i", String(i));
          el.classList.add("bp-in");
        });
      } else if (view === "evaluator") {
        const hero = document.querySelector(".evaluator-hero");
        if (hero) {
          hero.classList.remove("bp-in");
          void hero.offsetWidth;
          hero.style.setProperty("--bp-i", "0");
          hero.classList.add("bp-in");
        }
      }
    } catch (e) { /* 纯增强：异常静默 */ }
  }
  FX.choreograph = choreograph;

  /* ---------- ② 登录页：密码强度计 + CapsLock ---------- */
  function initAuthFx() {
    try {
      const reg = $("reg-pass");
      if (reg && !document.querySelector(".pw-meter")) {
        const field = reg.closest(".auth-field");
        const meter = document.createElement("div");
        meter.className = "pw-meter";
        meter.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 4; i++) {
          const seg = document.createElement("span");
          seg.className = "pw-seg";
          meter.appendChild(seg);
        }
        field.appendChild(meter);
        const score = v =>
          (v.length >= 6 ? 1 : 0) + (v.length >= 10 ? 1 : 0) +
          (/\d/.test(v) ? 1 : 0) +
          (((/[a-z]/.test(v) && /[A-Z]/.test(v)) || /[^a-zA-Z0-9]/.test(v)) ? 1 : 0);
        const sync = () => { meter.dataset.score = String(score(reg.value)); };
        reg.addEventListener("input", sync);
        sync();
      }
    } catch (e) { /* 纯增强 */ }
    try {
      ["login-pass", "reg-pass"].forEach(id => {
        const input = $(id);
        if (!input) return;
        const field = input.closest(".auth-field");
        if (!field || field.querySelector(".caps-hint")) return;
        const hint = document.createElement("div");
        hint.className = "caps-hint";
        hint.hidden = true;
        hint.textContent = "⇪ 大写锁定已开启";
        field.appendChild(hint);
        const sync = e => {
          let on = false;
          try {
            on = !!(e && typeof e.getModifierState === "function" && e.getModifierState("CapsLock"));
          } catch (err) { /* 老浏览器无此 API */ }
          hint.hidden = !on;
        };
        input.addEventListener("keyup", sync);
        input.addEventListener("focus", sync);
        input.addEventListener("blur", () => { hint.hidden = true; });
      });
    } catch (e) { /* 纯增强 */ }
  }

  /* ---------- ③ 面试 LIVE：面试官徽章发言脉冲 ---------- */
  function initInterviewFx() {
    const badge = $("chat-agent");
    if (!badge || reduced() || typeof MutationObserver === "undefined") return;
    let t = 0;
    const mo = new MutationObserver(() => {
      badge.classList.remove("speaking");
      void badge.offsetWidth;
      badge.classList.add("speaking");
      clearTimeout(t);
      t = setTimeout(() => badge.classList.remove("speaking"), 900);
    });
    mo.observe(badge, { childList: true, characterData: true, subtree: true });
    FX.speaking = true;
  }

  /* ---------- ④ 数字滚动（报告总分 / 小测得分） ---------- */
  function countUpScan(root) {
    const scope = root || document;
    const els = [...scope.querySelectorAll("[data-count]")].filter(el =>
      el.dataset.done !== "1" &&
      !el.closest(".landing-stat") &&
      !el.classList.contains("stat-num") &&
      !el.classList.contains("val")
    );
    const now = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
    els.forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      el.dataset.done = "1";
      if (isNaN(target)) return;
      if (reduced()) { el.textContent = String(target); return; }
      const from = parseInt(el.textContent, 10);
      const start = isNaN(from) ? 0 : Math.min(from, target);
      if (start === target) { el.textContent = String(target); return; }
      const t0 = now(), DUR = 620;
      const step = () => {
        const t = Math.min(1, (now() - t0) / DUR);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(start + (target - start) * eased));
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      };
      requestAnimationFrame(step);
    });
  }
  FX.countUpScan = countUpScan;

  /* 报告入场：总分滚动 + 维度条自 0 生长（CSS transition 兜底 .8s） */
  function reportIn() {
    try { countUpScan($("report-content")); } catch (e) { /* 纯增强 */ }
    if (reduced()) return;
    try {
      [...document.querySelectorAll("#dims .dim-bar > div")].forEach((bar, i) => {
        const w = bar.style.width;
        bar.dataset.w = w;
        bar.style.transition = "none";
        bar.style.width = "0%";
        setTimeout(() => {
          bar.style.transition = "";
          bar.style.width = bar.dataset.w || w;
        }, 60 + i * 70);
      });
    } catch (e) { /* 纯增强 */ }
  }
  FX.reportIn = reportIn;

  /* ---------- ⑤ 十字准线（全站 · 输入聚焦隐身） ---------- */
  function initCrosshair() {
    if (reduced()) return;
    try { if (window.matchMedia && window.matchMedia("(hover: none)").matches) return; } catch (e) {}
    if (document.querySelector(".bp-cross-x")) { FX.cross = true; return; }
    const cx = document.createElement("div");
    cx.className = "bp-cross bp-cross-x";
    cx.setAttribute("aria-hidden", "true");
    const cy = document.createElement("div");
    cy.className = "bp-cross bp-cross-y";
    cy.setAttribute("aria-hidden", "true");
    (document.body || document.documentElement).append(cx);
    (document.body || document.documentElement).append(cy);
    let mx = -9999, my = -9999, ticking = false, shown = false;
    const isTyping = () => {
      const a = document.activeElement;
      if (!a || typeof a.matches !== "function") return false;
      return a.matches("input, textarea, select, [contenteditable='true']");
    };
    const apply = () => {
      ticking = false;
      const show = !isTyping() && mx > -900;
      if (show !== shown) {
        shown = show;
        cx.style.visibility = show ? "visible" : "hidden";
        cy.style.visibility = show ? "visible" : "hidden";
      }
      if (!show) return;
      cx.style.top = my + "px";
      cy.style.left = mx + "px";
    };
    const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    window.addEventListener("mousemove", e => {
      mx = e.clientX; my = e.clientY;
      kick();
    }, { passive: true });
    window.addEventListener("mouseout", () => {
      mx = -9999; my = -9999;
      kick();
    }, { passive: true });
    document.addEventListener("focusin", kick, { passive: true });
    document.addEventListener("focusout", kick, { passive: true });
    apply();
    FX.cross = true;
  }

  /* ---------- ⑥ 坐标读数（BLK 特性卡 / PG 功能页卡 / SEC 开发者节） ---------- */
  function initCoordReadout() {
    const pad3 = n => String(Math.round(Math.max(0, n))).padStart(3, "0");
    const groups = [
      { sel: "#view-landing .feature-block", tag: "BLK" },
      { sel: "#view-app .page-card", tag: "PG" },
      { sel: "#view-evaluator .eval-section", tag: "SEC" },
    ];
    groups.forEach(g => {
      [...document.querySelectorAll(g.sel)].forEach((b, i) => {
        if (b.querySelector(".fb-coord")) return;
        const tag = g.tag + "-" + String(i + 1).padStart(2, "0");
        const chip = document.createElement("span");
        chip.className = "fb-coord";
        chip.setAttribute("aria-hidden", "true");
        chip.textContent = tag + " · X--- Y---";
        b.appendChild(chip);
        let ticking = false, lx = 0, ly = 0;
        const apply = () => {
          ticking = false;
          chip.textContent = tag + " · X" + pad3(lx) + " Y" + pad3(ly);
        };
        b.addEventListener("mousemove", e => {
          const r = b.getBoundingClientRect();
          lx = e.clientX - r.left; ly = e.clientY - r.top;
          if (!ticking) { ticking = true; requestAnimationFrame(apply); }
        }, { passive: true });
      });
    });
    FX.coord = true;
  }

  /* ---------- ⑦ 开发者模式绘制线（eval-section 顶部 2px 墨线） ---------- */
  function initEvalDraw() {
    const secs = [...document.querySelectorAll(".eval-section")];
    if (!secs.length) return;
    secs.forEach((s, i) => {
      if (!s.querySelector(".sec-draw")) {
        const line = document.createElement("i");
        line.className = "sec-draw";
        line.setAttribute("aria-hidden", "true");
        s.appendChild(line);
      }
      s.style.setProperty("--sec-i", String(i));
    });
    if (!("IntersectionObserver" in window)) {           // 无 IO：直接落笔
      secs.forEach(s => s.classList.add("bp-drawn"));
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
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });
      secs.forEach(s => io.observe(s));
      FX.draw = true;
    } catch (e) {
      secs.forEach(s => s.classList.add("bp-drawn"));     // IO 异常：静态落笔
      FX.draw = true;
    }
  }

  /* ---------- 入口 ---------- */
  function boot() {
    try { initAuthFx(); } catch (e) {}
    try { initInterviewFx(); } catch (e) {}
    try { initCrosshair(); } catch (e) {}
    try { initCoordReadout(); } catch (e) {}
    try { initEvalDraw(); } catch (e) {}
    // 初始视图编舞（登录用户刷新后直接落在 app / auth 也生效）
    try {
      const active = document.querySelector(".view.active");
      if (active) {
        const view = active.id.replace("view-", "");
        choreograph(view, typeof currentPage === "function" ? currentPage() : "");
      }
    } catch (e) { /* 纯增强 */ }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
