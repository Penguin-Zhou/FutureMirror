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
    reportViz: false, formFx: false, annotate: false, hero3d: false,
    setCrosshair: null,
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
        try { initFormFx(); } catch (e) {}
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
    try { wireReportViz(); } catch (e) { /* 纯增强 */ }
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

  /* ---------- ⑤ 十字准线（全站 · 输入聚焦隐身 · 偏好可关） ---------- */
  let crossX = null, crossY = null, crossMX = -9999, crossMY = -9999,
      crossTick = false, crossShown = false, crossBound = false;
  /* 偏好读取：profile.js 晚于本模块加载，只能运行时取（boot/DOMContentLoaded 时已就绪） */
  function crosshairWanted() {
    try {
      if (typeof getProfile === "function") {
        const p = getProfile();
        if (p && p.prefs && p.prefs.crosshair === false) return false;
      }
    } catch (e) {}
    return true;
  }
  function crossApply() {
    crossTick = false;
    if (!crossX || !crossY) return;
    const a = document.activeElement;
    const typing = !!(a && typeof a.matches === "function" &&
      a.matches("input, textarea, select, [contenteditable='true']"));
    /* 落地页是 mimo 式干净留白，两条墨线横贯整屏只会破坏画面——
     * 落地页收起来，进内页（图纸风）再显示。 */
    const lp = document.getElementById("view-landing");
    const onLanding = !!(lp && lp.classList.contains("active"));
    const show = !typing && crossMX > -900 && !onLanding;
    if (show !== crossShown) {
      crossShown = show;
      crossX.style.visibility = show ? "visible" : "hidden";
      crossY.style.visibility = show ? "visible" : "hidden";
    }
    if (!show) return;
    crossX.style.top = crossMY + "px";
    crossY.style.left = crossMX + "px";
  }
  function crossKick() { if (!crossTick) { crossTick = true; requestAnimationFrame(crossApply); } }
  function crossBind() {
    if (crossBound) return;
    crossBound = true;
    window.addEventListener("mousemove", e => {
      crossMX = e.clientX; crossMY = e.clientY;
      crossKick();
    }, { passive: true });
    window.addEventListener("mouseout", () => {
      crossMX = -9999; crossMY = -9999;
      crossKick();
    }, { passive: true });
    document.addEventListener("focusin", crossKick, { passive: true });
    document.addEventListener("focusout", crossKick, { passive: true });
  }
  function initCrosshair() {
    if (reduced()) return;
    try { if (window.matchMedia && window.matchMedia("(hover: none)").matches) return; } catch (e) {}
    if (!crosshairWanted()) { FX.cross = false; return; }
    crossBind();
    if (crossX) { FX.cross = true; return; }
    crossX = document.createElement("div");
    crossX.className = "bp-cross bp-cross-x";
    crossX.setAttribute("aria-hidden", "true");
    crossY = document.createElement("div");
    crossY.className = "bp-cross bp-cross-y";
    crossY.setAttribute("aria-hidden", "true");
    (document.body || document.documentElement).append(crossX);
    (document.body || document.documentElement).append(crossY);
    crossShown = false;
    FX.cross = true;
  }
  /* v31：偏好开关——关闭撤除准线元素（监听器保留，零泄漏），开启重新挂上 */
  function setCrosshair(on) {
    if (on) { initCrosshair(); return true; }
    if (crossX) { crossX.remove(); crossX = null; }
    if (crossY) { crossY.remove(); crossY = null; }
    crossShown = false;
    FX.cross = false;
    return false;
  }
  FX.setCrosshair = setCrosshair;

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
        /* v83：翻转卡的坐标标注要贴在正面上，跟着卡一起转走；
         * 挂在 block 上会浮在翻转后的窗口上面。 */
        (b.querySelector(".fb3d-front") || b).appendChild(chip);
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

  /* ---------- ⑧ 封面 3D：鼠标经过首屏时整块轻微转动 ----------
   * 只写两个 CSS 变量，其余交给 CSS；触屏与 reduced-motion 不绑，
   * 静态角度由样式兜底，所以「没有 JS」也立得住。
   * 移动时把过渡关掉，离开时恢复——不然每次都从上一个角度追过来。 */
  function initHero3D() {
    const first = document.querySelector("#view-landing .lp-first");
    const stage = first && first.querySelector(".fm3d-stage");
    if (!first || !stage) return;
    if (reduced()) return;
    try { if (matchMedia("(hover: none)").matches) return; } catch (e) {}
    first.addEventListener("pointermove", e => {
      if (e.pointerType === "touch") return;
      const r = first.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5;
      stage.style.transition = "none";
      stage.style.setProperty("--ry", (-13 + nx * 16).toFixed(1) + "deg");
      stage.style.setProperty("--rx", (8 - ny * 12).toFixed(1) + "deg");
    }, { passive: true });
    first.addEventListener("pointerleave", () => {
      stage.style.transition = "";
      stage.style.removeProperty("--ry");
      stage.style.removeProperty("--rx");
    }, { passive: true });
    FX.hero3d = true;
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

  /* ---------- ⑨ v28 深度交互层：报告可视化联动 / 表单焦点 / 面试批注 ---------- */
  /* 报告可视化：维度行 ↔ 雷达顶点联动高亮（hover 维度行点亮对应雷达顶点） */
  function wireReportViz() {
    const radar = $("radar");
    if (!radar) return;
    [...document.querySelectorAll("#dims .dim-row[data-dim]")].forEach(row => {
      const i = row.getAttribute("data-dim");
      const dot = radar.querySelector("#radar-dot-" + i);
      if (!dot) return;
      row.addEventListener("mouseenter", () => { row.classList.add("lit"); dot.classList.add("lit"); });
      row.addEventListener("mouseleave", () => { row.classList.remove("lit"); dot.classList.remove("lit"); });
    });
    FX.reportViz = true;
  }

  /* 表单焦点微交互：登录框输入聚焦时发丝线自左画出（蓝图规尺感应） */
  function initFormFx() {
    try {
      document.querySelectorAll(".auth-field").forEach(f => {
        const inp = f.querySelector("input, textarea");
        if (!inp || f.querySelector(".bp-field-line")) return;
        const line = document.createElement("i");
        line.className = "bp-field-line";
        line.setAttribute("aria-hidden", "true");
        inp.insertAdjacentElement("afterend", line);
      });
      FX.formFx = true;
    } catch (e) { /* 纯增强 */ }
  }

  /* 面试实时批注：每条面试官提问可附批注，落到 session.turns[i].notes，
   * 自动进入报告「评分证据」与学习路径证据链（零新增存储结构）。
   * 零侵入：MutationObserver 装饰新增 .msg-ai，data-turn 由 interview.js 写入。 */
  function initAnnotation() {
    const body = $("chat-body");
    if (!body) return;
    const idxOf = bubble => {
      const t = bubble.dataset.turn;
      if (t != null && t !== "") return parseInt(t, 10);
      return [...body.querySelectorAll(".msg-ai")].indexOf(bubble);
    };
    const buildBox = (bubble, idx) => {
      const box = document.createElement("textarea");
      box.className = "msg-annot";
      box.placeholder = "为这条提问写批注（自动进入报告证据链）…";
      box.value = (typeof session !== "undefined" && session.turns[idx] && session.turns[idx].notes) || "";
      bubble.appendChild(box);
      box.addEventListener("input", () => {
        if (typeof session === "undefined" || !session.turns[idx]) return;
        session.turns[idx].notes = box.value;
        try { if (typeof persistSession === "function") persistSession(); } catch (e) {}
        const btn = bubble.querySelector(".msg-annot-btn");
        if (btn) btn.classList.toggle("has-note", !!box.value);
      });
      return box;
    };
    const decorate = bubble => {
      if (!bubble || !bubble.classList || !bubble.classList.contains("msg-ai")) return;
      if (bubble.querySelector(".msg-annot-btn")) return;
      const idx = idxOf(bubble);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "msg-annot-btn";
      btn.textContent = "批注";
      btn.setAttribute("aria-label", "为这条提问添加批注");
      bubble.appendChild(btn);
      const note = (typeof session !== "undefined" && session.turns[idx] && session.turns[idx].notes) || "";
      btn.classList.toggle("has-note", !!note);
      if (note) buildBox(bubble, idx);
      btn.addEventListener("click", () => {
        const box = bubble.querySelector(".msg-annot");
        if (box) { box.remove(); return; }
        buildBox(bubble, idxOf(bubble));
      });
    };
    [...body.querySelectorAll(".msg-ai")].forEach(decorate);
    if (typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(muts => {
        muts.forEach(m => m.addedNodes.forEach(n => {
          if (!n || n.nodeType !== 1) return;
          if (n.classList && n.classList.contains("msg-ai")) decorate(n);
          else if (n.querySelectorAll) [...n.querySelectorAll(".msg-ai")].forEach(decorate);
        }));
      });
      mo.observe(body, { childList: true, subtree: false });
    }
    FX.annotate = true;
  }

  /* ---------- ⑨ v49 · 工作台指挥台（准备度仪表 / 规格指标 / 下一步） ----------
   * 全部取自本地已有状态（本轮答题数、历史报告、学习任务、简历、人格），
   * 不新增存储键、不发任何请求；缺数据一律显示「—」或「未测」，不编造分值。 */
  function cmdGaugeSVG(n, total) {
    const T = Math.max(1, total || 5);
    const c = 50, r = 38, sw = 8;
    const C = 2 * Math.PI * r;
    const seg = C / T;
    const gap = 6;
    let arcs = "";
    for (let i = 0; i < T; i++) {
      const on = i < n;
      /* v50：空弧不再用 --line。暗色主题下 --line(#322D23) 落在 --card(#1D1A15) 上
       * 几乎不可见，整只仪表看起来「没画出来」。改用 --line-2（亮 #B9B29A / 暗 #4B4433），
       * 两种主题下都能看出「一共几段、点亮了几段」。 */
      arcs += `<circle cx="${c}" cy="${c}" r="${r}" fill="none"
        stroke="${on ? "var(--brand)" : "var(--line-2)"}" stroke-width="${sw}"
        stroke-dasharray="${(seg - gap).toFixed(2)} ${(C - seg + gap).toFixed(2)}"
        transform="rotate(${(i * (360 / T) - 90).toFixed(2)} ${c} ${c})"/>`;
    }
    return `<svg viewBox="0 0 100 100" role="img" aria-label="已完成 ${n} / ${T} 轮">
      ${arcs}
      <text x="${c}" y="${c + 4}" text-anchor="middle" font-size="26" font-weight="700"
        fill="var(--ink)" style="font-family:var(--serif);letter-spacing:-.02em">${n}</text>
      <text x="${c}" y="${c + 17}" text-anchor="middle" font-size="9"
        fill="var(--faint)" style="font-family:var(--mono);letter-spacing:.1em">/ ${T}</text>
    </svg>`;
  }
  /* 历史总分趋势：只在有 ≥2 次记录时画，条高按区间归一；
   * 单次记录不画——一个点不是趋势，画出来就是假信息。 */
  function cmdSpark(totals) {
    if (!totals || totals.length < 2) return "";
    const lo = Math.min.apply(null, totals);
    const hi = Math.max.apply(null, totals);
    const span = hi - lo || 1;
    const bars = totals.map((v, i) => {
      const h = Math.round(4 + (v - lo) / span * 12);
      const last = i === totals.length - 1;
      return `<i style="height:${h}px;background:${last ? "var(--brand)" : "var(--line-2)"}"></i>`;
    }).join("");
    return `<span class="cmd-spark" aria-label="历史总分趋势">${bars}</span>`;
  }
  function cmdState() {
    const g = (k, d) => { try { const v = store.get(k, d); return v == null ? d : v; } catch (e) { return d; } };
    const turns = (typeof session !== "undefined" && session && session.turns) ? session.turns.length : 0;
    const hist = g("fm_history", []) || [];
    const last = hist.length ? Number(hist[hist.length - 1].total) : null;
    let planDone = 0, planTotal = 0;
    /* v50 修复：计划只有一份真相。计划页会为首次访问者生成基线计划，
     * 但历史版本里基线不落盘，指挥台读 fm_plan 拿到空值 → 显示「--」，
     * 与计划页的「0/21 项任务」互相打架。这里统一走 lpGet()（内部会落盘），
     * 并对畸形数据做防御：任何一天不是对象、tasks 不是数组都跳过，不让整块仪表消失。 */
    let plan;
    try {
      plan = typeof lpGet === "function" ? lpGet() : g("fm_plan", null);
    } catch (e) {
      plan = g("fm_plan", null);
    }
    if (plan && Array.isArray(plan.days)) {
      plan.days.forEach(d => {
        if (!d || typeof d !== "object" || !Array.isArray(d.tasks)) return;
        d.tasks.forEach(t => {
          planTotal++;
          if (t && t.done) planDone++;
        });
      });
    }
    const mbti = g("fm_mbti", null);
    const mbtiType = mbti && (mbti.type || mbti.result) ? String(mbti.type || mbti.result) : "";
    const totals = hist.map(h => Number(h.total)).filter(v => isFinite(v)).slice(-8);
    return {
      turns, total: 5, rounds: hist.length, totals,
      lastTotal: isFinite(last) ? last : null,
      planDone, planTotal,
      hasResume: !!String(g("fm_resume", "") || "").trim(),
      mbtiType,
    };
  }
  function cmdNext(s) {
    if (!s.hasResume) return { t: "先上传简历与目标岗位 JD，拿到可解释的匹配结论。", b: "去简历匹配", go: "match" };
    if (s.turns === 0 && s.rounds === 0) return { t: "简历已就绪。开始第一场模拟面试，5 位面试官会依次追问。", b: "开始模拟面试", go: "interview" };
    if (s.turns > 0 && s.turns < 5) return { t: "本轮已答 " + s.turns + " 题，还差 " + (5 - s.turns) + " 题即可生成报告。", b: "继续本轮面试", go: "interview" };
    if (s.rounds > 0) return { t: "已有报告。按最弱维度打开 7 天计划，把弱项练成可复述的答案。", b: "打开学习计划", go: "plan" };
    return { t: "继续完成一轮面试，报告与能力画像才会更准。", b: "进入模拟面试", go: "interview" };
  }
  function renderCmdBand() {
    const box = document.querySelector(".cmd-band");
    if (!box) return;
    const s = cmdState();
    const nx = cmdNext(s);
    const esc = v => (typeof escHtml === "function" ? escHtml(v) : String(v));
    const num = v => (v == null || !isFinite(v)
      ? '<span class="cmd-v-empty">--</span>'
      : String(v));
    /* 仪表读什么：正在面试时读本轮答题数，否则读已完成轮次——
     * 两种状态都能对上号，不会出现「有 3 次报告却显示 0」的错位。 */
    const live = s.turns > 0;
    const gN = live ? s.turns : Math.min(s.rounds, s.total);
    const gLabel = live ? "本轮答题进度" : "已完成模拟轮次";
    const gHint = live
      ? "答完 " + (s.total - s.turns) + " 题生成本轮报告"
      : "完成 " + s.total + " 轮解锁完整能力画像";
    box.innerHTML =
      '<div class="cmd-gauge">' + cmdGaugeSVG(gN, s.total) +
        '<div class="cmd-gauge-txt">' +
          '<span class="cmd-k">' + gLabel + '</span>' +
          '<span class="cmd-hint">' + gHint + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="cmd-metrics">' +
        '<div class="cmd-metric"><span class="cmd-k">最近总分</span>' +
          '<span class="cmd-v">' + num(s.lastTotal) + (s.lastTotal == null ? "" : "<i>/100</i>") + '</span>' +
          cmdSpark(s.totals) + '</div>' +
        '<div class="cmd-metric"><span class="cmd-k">学习任务</span>' +
          '<span class="cmd-v">' + (s.planTotal ? s.planDone + "<i>/" + s.planTotal + "</i>" : '<span class="cmd-v-empty">--</span>') + '</span>' +
          (s.planTotal ? '<span class="cmd-bar"><i style="width:' + Math.round(s.planDone / s.planTotal * 100) + '%"></i></span>' : '') + '</div>' +
        '<div class="cmd-metric"><span class="cmd-k">简历状态</span>' +
          '<span class="cmd-v cmd-v-txt">' + (s.hasResume ? "已就绪" : "待上传") + '</span></div>' +
        '<div class="cmd-metric"><span class="cmd-k">人格类型</span>' +
          '<span class="cmd-v cmd-v-txt">' + (s.mbtiType ? esc(s.mbtiType) : "未测") + '</span></div>' +
      '</div>' +
      '<div class="cmd-next">' +
        '<span class="cmd-k">建议下一步</span>' +
        '<p class="cmd-next-t">' + esc(nx.t) + '</p>' +
        '<button class="btn btn-primary btn-sm" type="button" data-go="' + nx.go + '">' + nx.b + ' →</button>' +
      '</div>';
    Array.prototype.forEach.call(box.querySelectorAll("[data-go]"), b => {
      b.addEventListener("click", () => { try { switchTab(b.dataset.go); } catch (e) {} });
    });
  }

  FX.renderCmdBand = renderCmdBand;

  /* ============================================================
   * ⑧ 封面银河：♾ 的粒子轨道（WebGL 2）
   * ============================================================
   * 路线 B：不用顶点缓冲。粒子位置全部在顶点着色器里由 gl_VertexID 推导——
   * 每个 id 哈希出稳定种子，沿 Gerono 双纽线（x = cos t, y = 0.62 sin 2t）
   * 行进，CPU 每帧只写时间、鼠标、脉冲几个 uniform。
   *
   * 为什么是粒子而不是一张星空图：
   *   贴图只能「看起来像」，粒子能对光标起反应、能随主题换色、
   *   能在 reduced-motion 下停在成形的那一帧。
   *   叙事上它替首屏先说话：可能性是流动的，也是可以被触碰的。
   *
   * 形状选择：Gerono 比 Bernoulli 更接近「∞」的书写习惯——两瓣宽度一致，
   * 交叉点干净；用 sin 2t 的倍角关系，u 走一圈正好回到原点，粒子首尾相接。
   *
   * 性能：32k 点一个 draw call，无属性缓冲；离开视口 / 切后台即停帧。
   * 降级：无 WebGL2 → 同一曲线的 2D 点阵静帧；连 2D 都没有 → 不画。
   * ============================================================ */
  const galaxy = (window.__bpGalaxy = {
    ok: false,
    webgl: false,
    mode: "idle",
    count: 0,
    reduced: false,
    scale: 0,
  });
  let galaxyBooted = false;

  /* HSL → [0..1] RGB，着色器只收线性三元组，颜色在这里算完 */
  function galaxyHsl(h, s, l) {
    const S = s / 100;
    const L = l / 100;
    const k = (n) => (n + h / 30) % 12;
    const a = S * Math.min(L, 1 - L);
    const f = (n) =>
      L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)];
  }

  /* 读主题色：银河跟着强调色走，不另起一套配色。
   * 亮色底下粒子要比纸深（墨青点阵），暗色底下要比底亮（发光点）。 */
  function galaxyInk() {
    const landing = document.getElementById("view-landing") || document.documentElement;
    let hue = 187;
    try {
      hue = parseFloat(getComputedStyle(landing).getPropertyValue("--fm-hue")) || 187;
    } catch (e) { /* 取不到就用默认青 */ }
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    return dark
      ? { core: galaxyHsl(hue, 96, 72), edge: galaxyHsl(hue, 100, 44), alpha: 0.72, dust: 0.28, mag: 1, spread: 1, share: 1, add: true }
      : { core: galaxyHsl(hue, 84, 24), edge: galaxyHsl(hue, 58, 38), alpha: 0.88, dust: 0, mag: 0.5, spread: 0.16, share: 1, add: false };
  }

  function initGalaxy() {
    if (galaxyBooted) return;
    galaxyBooted = true;
    const cv = document.querySelector("#view-landing .lp-galaxy");
    if (!cv) return;

    /* 手机上一屏被标题、按钮、面板占满，银河挤进去只剩一圈噪点：
     * 不放。省下的 GPU 留给面板，也省得标题周围发脏。 */
    if (window.innerWidth < 720) {
      cv.style.display = "none";
      galaxy.mode = "off";
      return;
    }

    let reduced = false;
    try { reduced = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    galaxy.reduced = reduced;

    const gl = cv.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });

    /* ---------- 无 WebGL：同一曲线的 2D 点阵静帧 ---------- */
    function paintStill() {
      let c2 = null;
      try { c2 = cv.getContext("2d"); } catch (e) {}
      if (!c2) {
        cv.style.display = "none";
        galaxy.mode = "off";
        return;
      }
      /* 尺寸自己算：降级分支在 resize() 之前就返回了，
       * 不补这一步画布会停在默认 300×150，被 CSS 拉伸成一团糊 */
      const box = cv.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(box.width * dpr));
      cv.height = Math.max(1, Math.round(box.height * dpr));
      const w = cv.width;
      const h = cv.height;
      // 与着色器共用 place()：位置、大小、遮挡关系都跟正常版本一致
      const pos = place(box);
      let halfH = pos.halfH * dpr;
      let halfW = halfH / 0.62;
      if (halfW > 0.43 * w) halfW = 0.43 * w;
      const scale = halfW;
      const ink = galaxyInk();
      const cU = ink.core.map((v) => Math.round(v * 255));
      const cE = ink.edge.map((v) => Math.round(v * 255));
      const cx = w / 2;
      const cy = pos.cy * dpr;
      const ct = Math.cos(-0.38);
      const rgb = (a) => "rgba(" + a[0] + "," + a[1] + "," + a[2] + ",";
      // 稳定随机：同一画布尺寸每次重绘的点位一致，不闪
      let seed = 20261128;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };
      c2.clearRect(0, 0, w, h);
      for (let i = 0; i < 3200; i++) {
        const u = rnd();
        const t = u * Math.PI * 2;
        const jitter = Math.pow(rnd(), 2.2) * 0.055;
        const ang = rnd() * Math.PI * 2;
        const x = Math.cos(t) + Math.cos(ang) * jitter;
        const y = (0.62 * Math.sin(2 * t) + Math.sin(ang) * jitter) * ct;
        const px = cx + x * scale;
        const py = cy - y * scale;
        const mag = 0.35 + 0.65 * rnd();
        c2.fillStyle = rgb(mag > 0.62 ? cU : cE) + (0.25 + 0.5 * mag) * ink.alpha + ")";
        c2.beginPath();
        c2.arc(px, py, (0.5 + 1.7 * mag) * dpr, 0, 6.2832);
        c2.fill();
      }
      galaxy.mode = "still";
      galaxy.ok = true;
      cv.setAttribute("data-galaxy", "canvas2d");
    }

    if (!gl) {
      galaxy.webgl = false;
      paintStill();
      // 尺寸变了、主题换了都要重画：静帧不会自己更新
      let rz = 0;
      window.addEventListener(
        "resize",
        () => {
          clearTimeout(rz);
          rz = setTimeout(paintStill, 120);
        },
        { passive: true }
      );
      if ("MutationObserver" in window) {
        new MutationObserver(paintStill).observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme", "data-accent"],
        });
      }
      return;
    }
    galaxy.webgl = true;

    /* ---------- 着色器 ---------- */
    const VERT = [
      "#version 300 es",
      "precision highp float;",
      "uniform mat4 uProj;",
      "uniform mat3 uRot;",
      "uniform vec3 uCore;",
      "uniform vec3 uEdge;",
      "uniform vec2 uShift;",
      "uniform vec2 uMouse;",
      "uniform float uTime;",
      "uniform float uForm;",
      "uniform float uScale;",
      "uniform float uAmp;",
      "uniform float uPulse;",
      "uniform float uPixel;",
      "uniform float uAlpha;",
      "uniform float uDust;",
      "uniform float uMag;",
      "uniform float uSpread;",
      "uniform vec4 uQuiet;",
      "out vec4 vColor;",
      "",
      "float hash11(float p) {",
      "  p = fract(p * 0.1031);",
      "  p *= p + 33.33;",
      "  p *= p + p;",
      "  return fract(p);",
      "}",
      "vec3 hash31(float p) {",
      "  vec3 q = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));",
      "  q += dot(q, q.yzx + 33.33);",
      "  return fract((q.xxy + q.yzz) * q.zyx);",
      "}",
      "",
      "void main() {",
      "  float id = float(gl_VertexID);",
      "  vec3 r = hash31(id * 1.13 + 0.37);",
      "  float r2 = hash11(id * 7.77 + 1.90);",
      "",
      "  /* 沿双纽线走：整体同速，个体 ±26% 抖动 —— 星系旋转曲线的极简版 */",
      "  float sp = 0.74 + 0.52 * r.x;",
      "  float u = fract(r.y + uTime * 0.0125 * sp);",
      "  float t = u * 6.28318530718;",
      "  vec2 core = vec2(cos(t), 0.62 * sin(2.0 * t));",
      "  vec2 tang = normalize(vec2(-sin(t), 1.24 * cos(2.0 * t)));",
      "  vec2 nrm = vec2(-tang.y, tang.x);",
      "",
      "  /* 管状厚度：法向为主、切向拉长一点，看起来是流动的带而不是描边 */",
      "  float w = pow(r.z, 1.7) * 0.095 * uSpread;",
      "  float a = r2 * 6.28318530718;",
      "  vec2 off = nrm * (cos(a) * w) + tang * (sin(a) * w * 1.8);",
      "",
      "  /* 一成粒子做成外围星尘：贴着轨道但散得远、压得暗，给轮廓外面留一层雾 */",
      "  float dust = step(0.90, r.x);",
      "  off *= mix(1.0, 1.9, dust) * uSpread;",
      "",
      "  /* 呼吸：整体 2.2% 缩放，两瓣相位错开，像在缓慢起伏 */",
      "  float breath = 1.0 + 0.022 * sin(uTime * 0.55 - u * 4.0);",
      "  vec3 pos = vec3((core + off) * breath, (r2 - 0.5) * (0.085 + dust * 0.5));",
      "",
      "  /* 成形：从球壳散落聚到轨道上 */",
      "  vec3 sc = normalize(r * 2.0 - 1.0 + vec3(0.0001)) * (1.05 + 1.45 * r2);",
      "  pos = mix(sc, pos, uForm);",
      "",
      "  pos = uRot * (pos * uScale);",
      "  vec4 clip = uProj * vec4(pos, 1.0);",
      "  clip.xy += uShift * clip.w;",
      "  vec2 ndc = clip.xy / clip.w;",
      "",
      "  /* 鼠标斥力：屏幕空间推开，半径 0.30、边缘衰减到 0 —— 散开又聚拢 */",
      "  vec2 md = ndc - uMouse;",
      "  float mdist = length(md);",
      "  float mf = (1.0 - smoothstep(0.0, 0.30, mdist)) * uAmp;",
      "  clip.xy += (md / max(mdist, 0.0001)) * mf * 0.065 * clip.w;",
      "",
      "  /* 点击脉冲：一束光沿曲线跑一圈，跑完自己淡掉 */",
      "  float pw = 0.0;",
      "  if (uPulse >= 0.0) {",
      "    float head = fract(uPulse * 0.36);",
      "    float du = abs(u - head);",
      "    du = min(du, 1.0 - du);",
      "    pw = smoothstep(0.045, 0.0, du) * clamp(1.0 - uPulse * 0.42, 0.0, 1.0);",
      "  }",
      "  gl_Position = clip;",
      "",
      "  float tw = 0.76 + 0.24 * sin(uTime * (0.6 + r.y * 1.7) + r.z * 6.283);",
      "  float mag = pow(0.30 + 1.15 * r.x, 1.35);",
      "  float depth = clamp(1.25 - (pos.z + 0.7) * 0.5, 0.55, 1.25);",
      "  float star = step(0.985, hash11(id * 11.3));",
      "  float size = (0.8 + 3.0 * mag) * (0.55 + 0.45 * uForm) * (0.6 + 0.4 * depth);",
      "  size *= mix(1.0, 1.5, dust) * (1.0 + star * 1.6);",
      "  /* 双纽线在交叉臂上速度最快、点最稀 —— 按局部速度补点径，",
      "     通篇才是一条粗细连贯的带子，而不是细线接一团雾 */",
      "  float spd = length(vec2(sin(t), 1.24 * cos(2.0 * t))) / 1.15;",
      "  size *= clamp(pow(spd, 0.5), 0.82, 1.42);",
      "  gl_PointSize = clamp(size * uMag * uPixel, 0.8 * uPixel, 7.5 * uPixel);",
      "",
      "  float alpha = (0.10 + 0.66 * mag) * (0.3 + 0.7 * uForm) * tw;",
      "  alpha *= mix(0.6, 1.0, clamp(depth - 0.55, 0.0, 1.0));",
      "  alpha *= mix(1.0, uDust, dust);",
      "  alpha += star * 0.35 * step(0.001, uDust);",
      "  alpha += mf * 0.3 + pw * 0.7;",
      "",
      "  /* 文字区是一片静水：椭圆内粒子让开，字不必跟亮点抢对比；",
      "     边界走斜线渐变，避免留下一个硬边的洞 */",
      "  vec2 qd = (ndc - uQuiet.xy) / max(uQuiet.zw, vec2(0.0001));",
      "  alpha *= mix(0.08, 1.0, smoothstep(0.70, 1.16, length(qd)));",
      "  vec3 col = mix(uEdge, uCore, clamp(mag * 0.9 + pw, 0.0, 1.0));",
      "  vColor = vec4(col, clamp(alpha, 0.0, 1.0) * uAlpha);",
      "}",
    ].join("\n");

    const FRAG = [
      "#version 300 es",
      "precision mediump float;",
      "in vec4 vColor;",
      "out vec4 oColor;",
      "void main() {",
      "  vec2 p = gl_PointCoord - 0.5;",
      "  float r = dot(p, p);",
      "  if (r > 0.25) discard;",
      "  float d = sqrt(r) * 2.0;",
      "  float a = 1.0 - d;",
      "  a = a * a * (3.0 - 2.0 * a);",
      "  float core = 1.0 - smoothstep(0.0, 0.55, d);",
      "  vec3 c = vColor.rgb + core * 0.3;",
      "  float alpha = vColor.a * a;",
      "  oColor = vec4(c * alpha, alpha);",
      "}",
    ].join("\n");

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        if (window.console) console.warn("[galaxy]", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      paintStill();
      return;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (window.console) console.warn("[galaxy]", gl.getProgramInfoLog(prog));
      paintStill();
      return;
    }
    gl.useProgram(prog);
    gl.bindVertexArray(gl.createVertexArray());
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    const U = {};
    ["uProj", "uRot", "uCore", "uEdge", "uShift", "uMouse", "uTime", "uForm", "uScale", "uAmp", "uPulse", "uPixel", "uAlpha", "uDust", "uMag", "uSpread", "uQuiet"].forEach((n) => {
      U[n] = gl.getUniformLocation(prog, n);
    });

    /* ---------- 矩阵：只需要透视与两次旋转，手写比引库便宜 ---------- */
    const DIST = 3.2;
    const FOV = (42 * Math.PI) / 180;
    const F = 1 / Math.tan(FOV / 2);

    function perspective(aspect) {
      const near = 0.1;
      const far = 20;
      const nf = 1 / (near - far);
      const A = (far + near) * nf;
      const B = 2 * far * near * nf;
      // 列主序；同时把相机推到 z = DIST —— 把视图平移折进投影的 [14]，
      // 省掉一次 4×4 乘法（clip.z 需要跟着平移，所以是 B - A·DIST 不是 B - DIST）
      return new Float32Array([
        F / aspect, 0, 0, 0,
        0, F, 0, 0,
        0, 0, A, -1,
        0, 0, B - A * DIST, DIST,
      ]);
    }

    function rotMat(yaw, pitch) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      // R = Ry * Rx，列主序
      const ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
      const rx = [1, 0, 0, 0, cp, sp, 0, -sp, cp];
      const out = new Float32Array(9);
      for (let c = 0; c < 3; c++) {
        for (let r = 0; r < 3; r++) {
          out[c * 3 + r] = ry[r] * rx[c * 3] + ry[3 + r] * rx[c * 3 + 1] + ry[6 + r] * rx[c * 3 + 2];
        }
      }
      return out;
    }

    /* ---------- 画布尺寸与点数量 ---------- */
    let proj = perspective(1.9);
    /* 银河在画布里的纵向位置（NDC）：跟着 CTA 与面板之间的空档走 */
    let shiftY = 0.24;
    /* 静水区：标题与副标题文字的外接椭圆（NDC） */
    const quiet = { cx: 0, cy: 0, rx: 0, ry: 0 };
    let scale = 1;
    let dpr = 1;
    let time0 = 0;
    let formAt = 0;

    function countFor(w) {
      let n = 32000;
      if (w < 1280) n = 20000;
      if (w < 960) n = 12000;
      if (w < 640) n = 7000;
      // 低配设备再砍一半：粒子是纯视觉层，少一半也读得出形状
      const cores = navigator.hardwareConcurrency || 8;
      if (cores <= 4) n = Math.round(n * 0.55);
      return n;
    }

    /* 银河摆在哪、多大：桌面落在「CTA 与面板之间」的空档里 —— 中心取空档
     * 中点，高度是空档的 1.5 倍（下瓣压到面板后面，交叉点仍看得见）。
     * 手机没有这条空档，退回「高度六成、略偏上」的老构图。
     * WebGL 与 2D 静帧共用这一处，降级时位置不会跳。 */
    function place(r) {
      const out = { halfH: r.height * 0.3, cy: r.height * 0.42 };
      if (r.width < 901) return out;
      const cta = document.querySelector("#view-landing .hero-cta");
      const voice = document.querySelector("#view-landing .fm-voice");
      if (!cta || !voice) return out;
      const cb = cta.getBoundingClientRect();
      const vb = voice.getBoundingClientRect();
      const gap = Math.max(160, vb.top - cb.bottom);
      out.halfH = Math.min(gap * 1.5, r.height * 0.55) / 2;
      /* 中心再往下偏 5%，把上瓣从按钮上让开 */
      out.cy = (cb.bottom + vb.top) / 2 + gap * 0.05 - r.top;
      return out;
    }

    function resize() {
      const host = cv.parentElement;
      const r = host.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      proj = perspective(w / h);
      /* 半高 → 世界坐标缩放；宽度超限（超宽屏）再收，符号不会被裁成两截 */
      const pos = place(r);
      let s = (2 * pos.halfH * DIST) / (h * F * 0.62);
      const halfW = (F * s) / (DIST * (w / h));
      if (halfW > 0.84) s *= 0.84 / halfW;
      shiftY = 1 - (pos.cy / h) * 2;
      scale = s;
      galaxy.scale = s;
      galaxy.count = countFor(w);
      galaxy.narrow = w < 720;

      /* 文字「静水区」：取标题与副标题每一行文字的实际外框（Range 的逐行 rect
       * 贴着字，不是整块宽度），并起来换算到画布 NDC。每次 resize 重算。 */
      const cr2 = cv.getBoundingClientRect();
      const lines = [];
      ["#view-landing .hero-title", "#view-landing .hero-sub"].forEach((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const rg = document.createRange();
        rg.selectNodeContents(el);
        for (const r of rg.getClientRects()) {
          if (r.width > 2 && r.height > 2) lines.push(r);
        }
      });
      if (lines.length && cr2.height > 0 && cr2.width > 0) {
        const left = Math.min(...lines.map((r) => r.left));
        const right = Math.max(...lines.map((r) => r.right));
        const top = Math.min(...lines.map((r) => r.top));
        const bot = Math.max(...lines.map((r) => r.bottom));
        quiet.cx = ((left + right) / 2 - cr2.left) / cr2.width * 2 - 1;
        quiet.cy = 1 - ((top + bot) / 2 - cr2.top) / cr2.height * 2;
        quiet.rx = ((right - left) / 2 / cr2.width) * 2 * 1.1;
        quiet.ry = ((bot - top) / 2 / cr2.height) * 2 * 1.18;
      }
      gl.viewport(0, 0, cv.width, cv.height);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* ---------- 状态 ---------- */
    const ink = galaxyInk();
    let mouse = { x: 0, y: 0, tx: 0, ty: 0, amp: 0, target: 0 };
    let pulseAt = -1;
    let raf = 0;
    let visible = true;
    let dead = false;

    function applyBlend() {
      if (ink.add) gl.blendFunc(gl.ONE, gl.ONE);
      else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    applyBlend();

    function render(t) {
      const time = reduced ? 1.4 : Math.max(0, (t - time0) / 1000);
      const form = reduced ? 1 : Math.min(1, Math.max(0, (t - formAt) / 1500));
      const ease = 1 - Math.pow(1 - form, 3);
      const pu = pulseAt < 0 ? -1 : Math.min(3.4, (t - pulseAt) / 1000);

      galaxy.form = ease;
      galaxy.amp = mouse.amp;
      /* 倾角小一点：∞ 形的带子侧对镜头时会被压成一条细线，
         近正对才是一条粗细一致的臂；3D 感交给面板和浮标 */
      const rot = rotMat(0.16 + mouse.x * 0.09, -0.16 - mouse.y * 0.05);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniformMatrix4fv(U.uProj, false, proj);
      gl.uniformMatrix3fv(U.uRot, false, rot);
      gl.uniform3fv(U.uCore, ink.core);
      gl.uniform3fv(U.uEdge, ink.edge);
      gl.uniform2f(U.uShift, 0, galaxy.narrow ? 0.5 : shiftY);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uForm, ease);
      gl.uniform1f(U.uScale, scale);
      gl.uniform1f(U.uAmp, reduced ? 0 : mouse.amp);
      gl.uniform1f(U.uPulse, pu);
      gl.uniform1f(U.uPixel, dpr);
      // 手机上整屏都是字，银河只能当底纹：压掉一半不透明度
      gl.uniform1f(U.uAlpha, ink.alpha * (galaxy.narrow ? 0.42 : 1));
      gl.uniform1f(U.uDust, ink.dust);
      gl.uniform1f(U.uMag, ink.mag);
      gl.uniform1f(U.uSpread, ink.spread);
      gl.uniform4f(U.uQuiet, quiet.cx, quiet.cy, quiet.rx, quiet.ry);
      gl.drawArrays(gl.POINTS, 0, Math.round(galaxy.count * ink.share));
    }

    function frame(t) {
      raf = 0;
      galaxy.frames = (galaxy.frames || 0) + 1;
      if (dead || document.hidden || !visible) return;
      if (!time0) {
        time0 = t;
        formAt = t + 120;
      }
      // 鼠标与斥力做插值：直接跟 raw 值会很「硬」
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      mouse.amp += (mouse.target - mouse.amp) * 0.1;
      render(t);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (raf || dead || reduced) return;
      raf = requestAnimationFrame(frame);
    }

    galaxy.ok = true;
    galaxy.mode = reduced ? "still" : "live";
    cv.setAttribute("data-galaxy", reduced ? "still" : "webgl");

    /* 主题 / 强调色变化：重算颜色，暗色切叠加混合。
     * 静帧也必须挂 —— 主题往往是启动之后才写进 data-theme 的，
     * 不重画就会停在亮色那一套墨青上，暗底看着像褪了色。 */
    if ("MutationObserver" in window) {
      const mo = new MutationObserver(() => {
        const next = galaxyInk();
        ink.core = next.core;
        ink.edge = next.edge;
        ink.alpha = next.alpha;
        ink.dust = next.dust;
        ink.mag = next.mag;
        ink.spread = next.spread;
        ink.share = next.share;
        ink.add = next.add;
        applyBlend();
        if (reduced) render(performance.now() + 2000);
      });
      const opts = { attributes: true, attributeFilter: ["data-theme", "data-accent"] };
      mo.observe(document.documentElement, opts);
    }

    window.addEventListener(
      "resize",
      () => {
        if (reduced) render(performance.now() + 2000);
      },
      { passive: true }
    );

    if (reduced) {
      time0 = 0;
      render(performance.now() + 2000);
      return;
    }

    /* ---------- 交互：斥力 + 脉冲 ---------- */
    const host = cv.parentElement;
    host.addEventListener(
      "pointermove",
      (e) => {
        const r = cv.getBoundingClientRect();
        if (!r.width || !r.height) return;
        mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouse.ty = 1 - ((e.clientY - r.top) / r.height) * 2;
        mouse.target = 1;
      },
      { passive: true }
    );
    host.addEventListener("pointerleave", () => { mouse.target = 0; }, { passive: true });
    host.addEventListener("click", (e) => {
      // 按钮、链接、卡片上的点击是导航，不是放烟花
      if (e.target.closest && e.target.closest("button, a, input, textarea, select, kbd, .fm3d-tag")) return;
      pulseAt = performance.now();
      kick();
    });

    /* ---------- 何时跑：进视口才跑，切后台就停 ---------- */
    function onVis() {
      if (document.hidden) return;
      kick();
    }
    document.addEventListener("visibilitychange", onVis);

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (es) => {
          visible = !!(es[0] && es[0].isIntersecting);
          if (visible) kick();
        },
        { threshold: 0.01 }
      );
      io.observe(cv);
    }

    kick();
  }

  /* ---------- 入口 ---------- */
  function boot() {
    try { initAuthFx(); } catch (e) {}
    try { initInterviewFx(); } catch (e) {}
    try { initCrosshair(); } catch (e) {}
    try { initCoordReadout(); } catch (e) {}
    try { initHero3D(); } catch (e) {}
    try { initGalaxy(); } catch (e) {}
    try { initEvalDraw(); } catch (e) {}
    try { initFormFx(); } catch (e) {}
    try { initAnnotation(); } catch (e) {}
    try { renderCmdBand(); } catch (e) {}
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
