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
 * 5) v55 主标语焦点层：标题拆字逐字落笔（--i 递进）、四角取景标记从角点画出、
 *    关键词改成逐字涂红、标题下缘留一条游标反复走——首屏只讲一句话，
 *    其余元素延后到字落完才出现；鼠标划过标题可重扫一次高亮。
 * 注：十字准线与坐标读数已于 v27 迁入 appfx.js 并扩展为全站能力
 * （app 功能页卡 PG 编号 / 开发者节 SEC 编号 / 输入聚焦准线隐身）。
 * ============================================================ */
(function initLandingFx() {
  const reduced = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };
  const FX = (window.__bpLanding = {
    mock: false,
    overture: false, rail: false, ticks: 0, enter: null,
    chars: 0, split: false, frame: false, replay: null, pulse: false,
    reveal: 0, revealMode: "", mockDefer: false,
  });

  /* ---------- ① Hero 文案轮播 —— v61 已下线 ---------- */
  /* 首屏三个小标签（Beta 胶囊 / >_ 轮播 / AI Native 抬头）一并收掉，
   * 标题成了首屏唯一的文字。打字机的定时器随之删除：
   * 节点没了还留着定时器，只是让它在后台空转。 */

  /* ---------- ② 面试实录播台（气泡依序揭载 + 流式光标） ---------- */
  /* v60：首播挪到「真的看得见」的时候。气泡只播一遍，播在首屏下面等于没播。 */
  function heroMockInView() {
    const card = document.querySelector("#view-landing .hero-mock");
    if (!card || typeof card.getBoundingClientRect !== "function") return true;
    const r = card.getBoundingClientRect();
    const vh = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0;
    /* 量不到尺寸（jsdom / 隐藏视图 / 未布局）时不要拦着播放 */
    if (!vh || (!r.width && !r.height)) return true;
    return r.top < vh * 0.82 && r.bottom > 0;
  }
  function deferMockUntilVisible() {
    const card = document.querySelector("#view-landing .hero-mock");
    if (!card || FX.mockDefer) return false;
    if (!("IntersectionObserver" in window)) return false;
    FX.mockDefer = true;
    try {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          FX.mockDefer = false;
          playHeroMock(true);
        });
      }, { threshold: 0.35 });
      io.observe(card);
      return true;
    } catch (e) {
      FX.mockDefer = false;
      return false;
    }
  }

  function playHeroMock(force) {
    const body = document.querySelector(".hero-mock-body");
    if (!body) return;
    const bubbles = [...body.querySelectorAll(".mock-bubble")];
    if (!bubbles.length) return;
    if (!force && !reduced() && heroMockInView() === false && deferMockUntilVisible()) return;
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
      setTimeout(() => { grad.classList.add("inked"); }, 1050);  // 等最后一个字立定再涂红
    }
  }
  FX.enter = enterLanding;

  /* ---------- ⑦ v55 主标语焦点层：逐字落笔 + 取景角标 + 关键词逐字涂红 ----------
   * 首屏要讲清楚的就一句话，所以把「入场」全部让给它：
   *   ① 拆字：每个字一个 inline-block（带 --i 序号），标点并入前一字
   *      —— inline-block 不参与行首禁则，独立成块的「。」会掉到行首；
   *   ② 取景角标：四段 L 形线从各自角点用 clip-path 画出来（不改线宽）；
   *   ③ 关键词：整块背景扫过换成逐字涂红，跨行也天然正确。
   * 任何一步失败都不影响可读性：拆字没跑就退回 v54 的整行揭载，
   * 角标只是装饰（aria-hidden），CSS 里所有初态都挂在 .landing-enter 下。 */
  const PUNCT = "，。、；：！？…—）」』》】";
  function brushText(text, n) {
    const out = document.createDocumentFragment();
    let last = null;
    [...text].forEach((ch) => {
      if (/\s/.test(ch)) {
        out.appendChild(document.createTextNode(ch));
        last = null;
        return;
      }
      if (last && PUNCT.indexOf(ch) >= 0) {
        last.textContent += ch;                                // 标点粘住前一字，避免行首标点
        return;
      }
      const s = document.createElement("span");
      s.className = "ch";
      s.style.setProperty("--i", String(n.i++));
      s.textContent = ch;
      out.appendChild(s);
      last = s;
    });
    return out;
  }

  function splitTitle() {
    const title = document.querySelector("#view-landing .hero-title");
    if (!title || title.dataset.brushed === "1") return FX.chars;
    const inners = [...title.querySelectorAll(".ht-inner")];
    if (!inners.length) return 0;
    const n = { i: 0 };
    try {
      inners.forEach((inner) => {
        const frag = document.createDocumentFragment();
        const kids = [];
        [...inner.childNodes].forEach((node) => {
          if (node.nodeType === 3) {
            kids.push(brushText(node.textContent, n));
            return;
          }
          if (node.nodeType === 1 && node.classList.contains("grad")) {
            /* 关键词：内部同样逐字，但保留 .grad 作父——无 JS 时整块高亮还挂在它身上，
             * 拆开后加 .is-chunked 把整块背景交还给每个字（.gw）。 */
            const g = document.createDocumentFragment();
            [...node.textContent].forEach((ch) => {
              if (!ch.trim()) return;
              const s = document.createElement("span");
              s.className = "ch gw";
              s.style.setProperty("--i", String(n.i++));
              s.textContent = ch;
              g.appendChild(s);
            });
            node.textContent = "";
            node.appendChild(g);
            node.classList.add("is-chunked");
            const first = node.querySelector(".gw");
            if (first) node.style.setProperty("--gw0", first.style.getPropertyValue("--i") || "0");
            kids.push(node);
            return;
          }
          kids.push(node.cloneNode(true));
        });
        /* 构建器把 HTML 缩进留在了 .ht-inner 里：首尾那串空白会被 fit-content 算进宽度，
         * 角标就会比字宽出四五十像素。真正画在纸上的只有字，把空白去掉。 */
        kids.forEach((k) => frag.appendChild(k));
        inner.textContent = "";
        inner.appendChild(frag);
        const trimEdge = () => {
          let guard = 0;
          while (inner.firstChild && inner.firstChild.nodeType === 3 && !inner.firstChild.textContent.trim() && guard++ < 8) {
            inner.removeChild(inner.firstChild);
          }
          while (inner.lastChild && inner.lastChild.nodeType === 3 && !inner.lastChild.textContent.trim() && guard++ < 16) {
            inner.removeChild(inner.lastChild);
          }
        };
        trimEdge();
        inner.classList.add("is-split");
        /* .grad 之后那个句号会被拆成独立的 .ch（inline-block 不参与行首禁则，
         * 折行时「。」会掉到行首）：并回前一个字的块里，让它跟字一起换行。 */
        [...inner.childNodes].forEach((c) => {
          if (c.nodeType !== 1 || !c.classList || !c.classList.contains("ch")) return;
          const t = c.textContent.trim();
          if (!t || !/^[，。、；：！？…—]+$/.test(t)) return;
          const prev = c.previousSibling;
          const host =
            prev && prev.nodeType === 1
              ? prev.classList.contains("grad")
                ? prev.lastElementChild
                : prev
              : null;
          if (!host || !host.classList || !host.classList.contains("ch")) return;
          host.textContent += t;
          host.classList.add("gw-end");                        // 下划线只画到字尾，不盖住句号
          if (c.parentNode) c.parentNode.removeChild(c);
          inner.classList.add("has-stuck-punct");
        });
      });
    } catch (e) {
      FX.split = false;
      return 0;
    }
    /* 主行的逐字节奏从引子行结束处接上：--l2b 记引子行的实际切片数，
     * 文案改了也不用回来改 CSS 里的常数 */
    const l1n = title.querySelectorAll(".ht-l1 .ch").length;
    const l2 = title.querySelector(".ht-l2");
    if (l2 && l1n) l2.style.setProperty("--l2b", String(l1n));
    /* 以 DOM 实际切片数为准：句号那个 .ch 建完就被并进末字，计数器会比实际多 1 */
    FX.chars = title.querySelectorAll(".ch").length;
    FX.split = true;
    title.dataset.brushed = "1";
    return FX.chars;
  }

  /* 取景角标 + 标题下缘游标：纯装饰，无 JS 时不出现（不承担任何信息） */
  function dressTitle() {
    const title = document.querySelector("#view-landing .hero-title");
    if (!title || title.querySelector(".ht-frame")) return false;
    const frame = document.createElement("span");
    frame.className = "ht-frame";
    frame.setAttribute("aria-hidden", "true");
    [
      ["hf-tl", 0],
      ["hf-tr", 70],
      ["hf-bl", 140],
      ["hf-br", 210],
    ].forEach(([cls, d]) => {
      const c = document.createElement("i");
      c.className = "hf-c " + cls;
      c.style.setProperty("--d", String(d));
      frame.appendChild(c);
    });
    title.appendChild(frame);
    FX.frame = true;
    return true;
  }

  /* hover 重扫 + 每 12s 自动重扫一次：让「批注」这个动作可以被反复看见，
   * 而不是开场放完就死掉。标题滚出视口或标签页在后台时不空转。 */
  let replayAt = 0;
  let pulseTimer = 0;
  let pulseOn = false;
  function replayTitle() {
    const view = document.getElementById("view-landing");
    if (!view || !view.classList.contains("landing-enter")) return false;
    const grad = view.querySelector(".hero-title .grad");
    if (!grad) return false;
    const now = Date.now();
    if (now - replayAt < 1200) return false;                    // 节流：别让鼠标划过就狂重播
    replayAt = now;
    grad.classList.remove("inked");
    void grad.offsetWidth;                                      // 强制回流，重置背景尺寸
    grad.classList.add("inked");
    return true;
  }
  FX.replay = replayTitle;

  function startPulse() {
    const view = document.getElementById("view-landing");
    const grad = view && view.querySelector(".hero-title .grad");
    if (!grad || reduced()) return false;
    if (pulseTimer) return true;
    pulseOn = true;
    pulseTimer = setInterval(() => {
      if (document.hidden || !pulseOn) return;
      replayTitle();
    }, 12000);
    if ("IntersectionObserver" in window) {
      try {
        const io = new IntersectionObserver((es) => {
          es.forEach((en) => { pulseOn = en.isIntersecting; });
        }, { threshold: 0.25 });
        io.observe(grad);
      } catch (e) { /* 没有 IO 就一直跑，成本只是一次背景过渡 */ }
    }
    FX.pulse = true;
    return true;
  }


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

  /* ---------- ⑧ v60 滚动入场：照参考站的 60px / 0.8s 缓出 ----------
   * 参考站有 29 处 .reveal：初态 translateY(60px) + opacity 0，进视口加 .visible，
   * 过渡 opacity/transform 各 0.8s cubic-bezier(.16, 1, .3, 1)。这里用同一组数，
   * 类名换成 .lp-rv / .is-in，同排错峰靠 --rd（60ms 一级，最多错三级）。
   * 初态挂在 .lp-motion 上：没有 JS、没有 IO、reduced-motion 三种情况都是完成态。
   * 首屏里那几件（标题 / 副标题 / 按钮 / 评分图幅）不走这一路：它们在解析期就
   * 已经算「在视口内」，交给 IO 会跳过过渡，改由 CSS 的 landing-enter 序列管。 */
  const RV_SETS = [
    { sel: ".lp-h2", step: 0, cap: 0 },                       // 实录区标题
    { sel: ".hero-mock", step: 0, cap: 0 },                   // 实录卡
    { sel: ".hero-spec .spec-chip", step: 55, cap: 4 },       // 规格胶囊，一列跟着一列
    { sel: ".landing-section-head", step: 0, cap: 0 },        // 区块标题两行一起
    { sel: ".feature-block", step: 60, cycle: 3 },            // 功能卡：按列错峰，每排都 0/60/120
    { sel: ".workflow-step", step: 70, cap: 3 },
    { sel: ".landing-stat", step: 70, cap: 3 },
    { sel: ".landing-cta", step: 0, cap: 0 },
    { sel: ".site-foot", step: 0, cap: 0 },
  ];

  function initScrollReveal() {
    const view = document.getElementById("view-landing");
    if (!view || !view.querySelectorAll) return 0;
    if (reduced()) { FX.revealMode = "static"; return 0; }    // 不打类：页面直接是完成态
    const items = [];
    RV_SETS.forEach(({ sel, step, cap, cycle, base }) => {
      [...view.querySelectorAll(sel)].forEach((el, i) => {
        if (!el.classList || el.classList.contains("lp-rv")) return;
        el.classList.add("lp-rv");
        const k = cycle ? i % cycle : Math.min(i, cap || 0);
        const ms = (base || 0) + k * (step || 0);
        /* 0ms 也写出来：错峰表要能被读、被断言，不要靠「没写就是 0」 */
        if (step || cycle || base) el.style.setProperty("--rd", ms + "ms");
        items.push(el);
      });
    });
    if (!items.length) return 0;
    view.classList.add("lp-motion");
    FX.reveal = items.length;
    /* 强制一次样式计算：读一下 offsetWidth，初态就被固定下来。
     * 少了这一步，首屏里已经露出的元素（评分图幅正好在 900 高的下缘）
     * 会在同一帧里从「初态」直接跳到「终态」，过渡被合并掉——图幅是蹦出来的，
     * 不是浮上来的。 */
    void view.offsetWidth;
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));       // 无 IO：直接落位
      FX.revealMode = "fallback";
      return items.length;
    }
    try {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
      items.forEach((el) => io.observe(el));
      FX.revealMode = "io";
    } catch (e) {
      items.forEach((el) => el.classList.add("is-in"));
      FX.revealMode = "fallback";
    }
    return items.length;
  }

  /* ---------- 入口 ---------- */
  function boot() {
    /* 拆字与角标必须在 enterLanding() 之前就位：加类的同一帧里初态已在 CSS 里等着，
     * 晚一帧就会看到「先整行出现、再消失重写」的闪跳。 */
    try { splitTitle(); } catch (e) {}
    try { dressTitle(); } catch (e) {}
    try { initScrollReveal(); } catch (e) {}
    try { enterLanding(); } catch (e) {}
    try { playHeroMock(); } catch (e) {}
    try { initRail(); } catch (e) {}
    try { initStatScale(); } catch (e) {}
    try { startPulse(); } catch (e) {}
    const title = document.querySelector("#view-landing .hero-title");
    if (title && title.addEventListener) title.addEventListener("mouseenter", replayTitle);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
