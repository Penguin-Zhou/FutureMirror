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
    reportViz: false, formFx: false, annotate: false,
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
    const show = !typing && crossMX > -900;
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

  /* ---------- 入口 ---------- */
  function boot() {
    try { initAuthFx(); } catch (e) {}
    try { initInterviewFx(); } catch (e) {}
    try { initCrosshair(); } catch (e) {}
    try { initCoordReadout(); } catch (e) {}
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
