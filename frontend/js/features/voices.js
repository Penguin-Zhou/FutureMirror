"use strict";
/* ============================================================
 * v63 · 能力网（Capability Mesh）
 * 落地页底部「这张网由什么支撑」的关系图：中心 → 五个主题 → 二十个实现点。
 *
 * 设计取舍（为什么不用 canvas）：
 * 1) 参考站用 canvas 逐帧重绘。这里改用「DOM 节点 + SVG 连线」：
 *    文字可选中、可读屏、可打印（PDF 导出走的是同一条渲染路径），
 *    jsdom 里能数节点、能断言文案，canvas 则只能截图比对；
 * 2) 连线用 viewBox="0 0 100 100" + preserveAspectRatio="none"，
 *    坐标即百分比，与节点的 left/top 百分比同源，容器怎么缩放都对齐；
 *    线宽靠 vector-effect 固定 1px，不被非等比缩放拉花。
 *
 * 浮动为什么改成逐帧（v64）：线是两点之间的直线，两端的点是两个独立
 * 动体。交给 CSS 各自 keyframes，端点必然脱开——位移越大越明显，
 * 而位移一小又看不出「在动」。所以改由这里统一算位移场：先算出每个
 * 节点的 (dx, dy)，再把同一组数写进线端，两者从同一份数据出发，
 * 不存在对不齐的可能。代价是一帧 51 个元素的写入——
 * 由 IntersectionObserver 门控（离开视口即停）、页面隐藏即停、
 * reduced-motion 直接不启动，后台不会空转。
 *
 * 交互：悬停 / 聚焦 → 弹出说明卡（1 节点 1 句，讲清它在代码里对应什么）；
 * 同时其余四组变淡、本组安静下来。触屏点一下切换。
 * 窄屏（<900）整块降级为分组列表，不做「点不动的图」。
 * ============================================================ */
(function initVoices() {
  const FX = (window.__bpVoices = {
    ready: false,
    nodes: 0,
    groups: 0,
    links: 0,
    mode: "",
    motion: "",
    frames: 0,
    tipOpen: "",
    activeNode: null,
    show: null,
    hide: null,
    tick: null,
    stop: null,
  });

  /* ---------- 数据：每个点都对得上仓库里的实现 ---------- */
  /* gx / gy 是主节点在舞台里的百分比坐标；leaf 的 dx / dy 是相对主节点的偏移，
   * 改主节点位置时整组一起走，不用逐个重算。 */
  const GROUPS = [
    {
      key: "score",
      name: "可解释评分",
      deg: -144,
      brief: "分数由确定性公式算出，模型只负责把理由说顺，不负责给分。",
      leaves: [
        { t: "五维定权", da: -34, d: "五个维度的权重写死在评分模块里，同一份回答永远得到同一个分数。" },
        { t: "证据引原话", da: -12, d: "每个失分项都挂着对应回答的原文片段，能回看到底是哪句话被扣了分。" },
        { t: "分歧视图", da: 12, d: "同一段回答，三位面试官各自的判断并排摆出来，不一致的地方不藏。" },
        { t: "评分不走模型", da: 34, d: "大模型只做措辞增强；关掉模型，报告里的分数与结论依然成立。" },
      ],
    },
    {
      key: "agents",
      name: "多 Agent 圆桌",
      deg: -72,
      brief: "四位角色共用一个对话上下文，按轮次轮转提问，不是四个模型各说各话。",
      leaves: [
        { t: "HR 面试官", da: -34, d: "看动机、稳定性与岗位匹配，问的是行为面，不问技术细节。" },
        { t: "技术面", da: -12, d: "追问实现细节与取舍，用来验证简历里的项目是不是真做过。" },
        { t: "压力面", da: 12, d: "在追问里逐步加压，观察临场表达会不会垮掉。" },
        { t: "观察员", da: 34, d: "不提问，只在旁边记录表达节奏、停顿与情绪线索。" },
      ],
    },
    {
      key: "rag",
      name: "混合检索",
      deg: 0,
      brief: "向量召回与关键词召回各跑一路，合并后再交给面试官引用。",
      leaves: [
        { t: "向量召回", da: -34, d: "问题与题库片段都在端侧编码成向量，按语义相似度找依据。" },
        { t: "关键词召回", da: -12, d: "字面匹配兜底，专有名词与技术栈名不会被向量稀释掉。" },
        { t: "题库引用", da: 12, d: "回答里引用的知识点标明出处，不做无出处的生成。" },
        { t: "端侧编码", da: 34, d: "向量在浏览器里算，原始简历文本不为了检索而上传。" },
      ],
    },
    {
      key: "fallback",
      name: "三级降级",
      deg: 72,
      brief: "模型超时、断网、未配置时各有对应退路，面试流程本身不中断。",
      leaves: [
        { t: "超时降级", da: -34, d: "等待超过阈值就切本地模板继续问，不让用户对着空屏等到超时。" },
        { t: "主动演练", da: -12, d: "开发者模式里可以主动触发一次故障，亲眼看降级横幅长什么样。" },
        { t: "流程不中断", da: 12, d: "降级只换措辞来源，评分口径与追问链路保持不变。" },
        { t: "诚实归因", da: 34, d: "报告里写明哪些结论来自模型、哪些来自本地规则，不混为一谈。" },
      ],
    },
    {
      key: "privacy",
      name: "端侧隐私",
      deg: 144,
      brief: "能留在浏览器里的数据就别送出去，送出去的先脱敏。",
      leaves: [
        { t: "帧不出端", da: -34, d: "摄像头画面只在浏览器内存里分析，不上行、不落盘、不留快照。" },
        { t: "PII 脱敏", da: -12, d: "手机号、邮箱、证件号在送模型前先替换成占位符。" },
        { t: "结构化上行", da: 12, d: "只为在场与专注状态上传布尔字段，不上传任何画面或音频。" },
        { t: "本地存储", da: 34, d: "账号与档案存在当前浏览器，换设备不会自动同步——这点在页面上写清楚。" },
      ],
    },
  ];

  const CENTER = { t: "面镜 FutureMirror", d: "一张图讲清这套系统靠什么立起来。悬停任意一个点，看它在代码里对应什么。" };

  /* ---------- 工具 ---------- */
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* 浮动参数按序号推导：同一个公式保证每次刷新一致（截图比对不会漂），
   * 又不至于让所有节点同相位地一起晃。
   * v64 起幅度分三层：中心最稳（像被钉住），主题次之，细标签最活——
   * 越外围越放松，整张网才有「浮着」的层次，而不是整体刚性平移。 */
  function jit(i, k) {
    const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  function drift(i, kind) {
    if (kind === "center") return { ax: 3.6, ay: 3.2, dur: 21, del: -1 };
    const isGroup = kind === "group";
    const base = isGroup ? 8.2 : 11;
    const span = isGroup ? 3.0 : 4.0;
    const ax = +(base + span * jit(i, 1)).toFixed(1);
    const ay = +(base * 0.86 + span * jit(i, 2)).toFixed(1);
    const dur = (isGroup ? 9.6 + jit(i, 3) * 3.4 : 7.1 + jit(i, 4) * 3.0).toFixed(1);
    const del = (-(jit(i, 5) * 9 + 0.3)).toFixed(2);
    return { ax, ay, dur, del };
  }

  /* ---------- 布局：五个花瓣 ---------- */
  /* 主节点五等分环绕，细标签从「自己的主节点」沿方位角向外伸出固定距离。
   * 早期版本让细标签直接站在一个同心大环上，结果角度一偏就漂到邻组旁边
   * （「观察员」飘到了混合检索那一侧），线的归属读不出来。
   * 改成以主节点为圆心伸展：每个标签离自己的组恒定 21% / 16%，怎么转都不会串门。 */
  const CX = 50;
  const CY = 47;
  const G_RX = 22;
  const G_RY = 22;
  const L_DX = 22;
  const L_DY = 18;
  const rad = (d) => (d * Math.PI) / 180;
  const at = (deg, rx, ry) => ({
    x: +(CX + rx * Math.cos(rad(deg))).toFixed(2),
    y: +(CY + ry * Math.sin(rad(deg))).toFixed(2),
  });
  /* 细标签 = 主节点 + (L_DX, L_DY) × 方向 */
  const leafAt = (gx, gy, deg) => ({
    x: +(gx + L_DX * Math.cos(rad(deg))).toFixed(2),
    y: +(gy + L_DY * Math.sin(rad(deg))).toFixed(2),
  });

  /* ---------- 渲染 ---------- */
  /* pins 的次序就是 DOM 次序：0 号是中心，其后按组依次排开。
   * lines 存的是端点下标而不是坐标——浮动要逐帧改端点，存下标才能
   * 保证线和点永远从同一份数据出发。 */
  function build(stage) {
    const pins = [{ kind: "center", gi: -1, x: CX, y: CY }];
    const lines = [];

    GROUPS.forEach((g, gi) => {
      const gp = at(g.deg, G_RX, G_RY);
      const hub = pins.push({ kind: "group", gi, g, x: gp.x, y: gp.y }) - 1;
      lines.push({ a: 0, b: hub, gi, hub: true });
      g.leaves.forEach((lf, li) => {
        const lp = leafAt(gp.x, gp.y, g.deg + lf.da);
        const idx = pins.push({ kind: "leaf", gi, li, g, lf, x: lp.x, y: lp.y }) - 1;
        lines.push({ a: hub, b: idx, gi, hub: false });
      });
    });

    const linkHtml = lines
      .map((ln, i) => {
        const a = pins[ln.a];
        const b = pins[ln.b];
        return (
          '<line class="fv-link' + (ln.hub ? " fv-link-hub" : "") +
          '" data-i="' + i + '" data-g="' + ln.gi +
          '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"></line>'
        );
      })
      .join("");

    const nodeHtml = pins
      .map((p, i) => {
        const d = drift(i, p.kind);
        const label = p.kind === "center" ? CENTER.t : p.kind === "group" ? p.g.name : p.lf.t;
        const kind = p.kind === "center" ? "fv-center" : p.kind === "group" ? "fv-group" : "fv-leaf";
        return (
          '<button type="button" class="fv-node ' + kind + '" data-k="' +
          (p.kind === "center" ? "center" : p.kind === "group" ? "g" : "l") +
          '"' + (p.gi >= 0 ? ' data-g="' + p.gi + '"' : "") +
          (p.li === undefined ? "" : ' data-i="' + p.li + '"') +
          ' style="--x:' + p.x + ";--y:" + p.y + ";--ax:" + d.ax + ";--ay:" + d.ay +
          ";--dur:" + d.dur + "s;--del:" + d.del + 's;--din:' + (i ? i * 34 + 60 : 0) +
          'ms"><span class="fv-t">' + esc(label) + "</span></button>"
        );
      })
      .join("");

    /* 说明卡是预置在舞台里的，innerHTML 会把它一起冲掉 —— 先摘下来，写完再挂回去 */
    const tip = stage.querySelector(".fv-tip");

    stage.innerHTML =
      '<svg class="fv-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      linkHtml +
      "</svg>" +
      nodeHtml;

    if (tip) stage.appendChild(tip);

    /* 窄屏降级用的分组列表：同一份数据渲染两遍，不做「点了没反应」的图 */
    const list = document.getElementById("fv-list");
    if (list) {
      list.innerHTML = GROUPS.map(
        (g) =>
          '<div class="fv-list-group"><h4>' +
          esc(g.name) +
          "</h4><dl>" +
          g.leaves.map((lf) => "<dt>" + esc(lf.t) + "</dt><dd>" + esc(lf.d) + "</dd>").join("") +
          "</dl></div>"
      ).join("");
    }

    bindMotion(stage, pins, lines);

    FX.nodes = pins.length;
    FX.groups = GROUPS.length;
    FX.links = lines.length;
    FX.ready = true;
    stage.classList.add("fv-ready");
    return stage;
  }

  /* ---------- 浮动引擎 ---------- */
  /* 位移场 = 两个不同频率的正弦叠加，相位取节点在舞台上的位置
   * （ph = x·0.06 + y·0.05）——于是相邻的点几乎同相、远处的点差半个周期，
   * 看起来是一阵缓慢的波从左上扫到右下，而不是二十六个点各自乱抖。
   * 每层的幅度与周期由 drift() 给出：中心慢而稳，细标签快而活。 */
  const MOTION = {
    stage: null,
    items: [],
    links: [],
    running: false,
    visible: false,
    raf: 0,
    clock: 0,
    last: 0,
    W: 0,
    H: 0,
    focus: -1,
  };

  function bindMotion(stage, pins, lines) {
    const els = stage.querySelectorAll(".fv-node");
    const lineEls = stage.querySelectorAll(".fv-link");

    MOTION.stage = stage;
    MOTION.items = pins.map((p, i) => ({
      el: els[i],
      gi: p.gi,
      x: p.x,
      y: p.y,
      ax: parseFloat(els[i].style.getPropertyValue("--ax")) || 4,
      ay: parseFloat(els[i].style.getPropertyValue("--ay")) || 4,
      w: (Math.PI * 2) / (parseFloat(els[i].style.getPropertyValue("--dur")) || 10),
      dx: 0,
      dy: 0,
      damp: 1,
    }));
    MOTION.links = lines.map((ln, i) => ({
      el: lineEls[i],
      a: MOTION.items[ln.a],
      b: MOTION.items[ln.b],
      gi: ln.gi,
      /* 线的深浅由 stroke 的 rgba 定（干道 .24 / 分支 .15），
       * 这里只叠一层 0.72–0.92 的呼吸，别再把整体压暗一次——
       * 两层透明度相乘会把线压到几乎看不见。 */
      base: 0.82,
      cur: 0.82,
    }));

    /* 供现场核对与截图冻结：__bpVoices.tick(12.5) 直接把画面推到第 12.5 秒 */
    FX.tick = function (sec) {
      measure();
      paint(+sec || 0);
      FX.frames++;
      return {
        nodes: MOTION.items.length,
        links: MOTION.links.length,
        w: MOTION.W,
        h: MOTION.H,
        dx: MOTION.items.map((it) => +it.dx.toFixed(2)),
        dy: MOTION.items.map((it) => +it.dy.toFixed(2)),
      };
    };
  }

  function measure() {
    const st = MOTION.stage;
    MOTION.W = st ? st.clientWidth : 0;
    MOTION.H = st ? st.clientHeight : 0;
  }

  function paint(t) {
    const items = MOTION.items;
    const links = MOTION.links;
    if (!items.length) return;

    /* viewBox 是 0..100 且不保持比例：x 方向 1 单位 = W/100 px，y 方向 = H/100 px */
    const kx = MOTION.W ? 100 / MOTION.W : 0;
    const ky = MOTION.H ? 100 / MOTION.H : 0;
    /* 进场 1.6s 内位移从 0 长到全幅，避免首帧从几十像素外跳回来 */
    const ramp = Math.min(1, t / 1.6);
    /* 整片还有一层 37 秒的超慢调制：一阵舒展一阵收拢。
     * 所有点用同一个因子，所以网会「一起深呼吸」，而不是各自为政。 */
    const mood = 0.74 + 0.26 * Math.sin(t * 0.17 + 0.6);
    const focus = MOTION.focus;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const ph = it.x * 0.06 + it.y * 0.05;
      const w = it.w;
      /* 悬停时本组安静下来（0.4 倍幅），其余照常漂——焦点处稳，四周才活 */
      const want = focus >= 0 && it.gi === focus ? 0.4 : 1;
      it.damp += (want - it.damp) * 0.08;
      const A = ramp * it.damp * mood;
      it.dx = it.ax * A * (0.62 * Math.sin(t * w + ph) + 0.38 * Math.sin(t * w * 0.61 + ph * 1.7 + 1.3));
      it.dy = it.ay * A * (0.58 * Math.cos(t * w * 0.87 + ph * 1.2 + 0.6) + 0.42 * Math.sin(t * w * 0.49 + ph * 0.8 + 2.1));
      it.el.style.translate = it.dx.toFixed(2) + "px " + it.dy.toFixed(2) + "px";
    }

    for (let i = 0; i < links.length; i++) {
      const ln = links[i];
      const a = ln.a;
      const b = ln.b;
      ln.el.setAttribute("x1", (a.x + a.dx * kx).toFixed(2));
      ln.el.setAttribute("y1", (a.y + a.dy * ky).toFixed(2));
      ln.el.setAttribute("x2", (b.x + b.dx * kx).toFixed(2));
      ln.el.setAttribute("y2", (b.y + b.dy * ky).toFixed(2));
      /* 线的透明度做低频呼吸（±16%），各组的相位错开：
       * 单看一条几乎察觉不到，整片看过去网是「活着」的 */
      const breathe = 0.82 + 0.1 * Math.sin(t * 0.5 + ln.gi * 1.25);
      let target = ln.base * breathe;
      if (focus >= 0) target = ln.gi === focus ? 1 : 0.3;
      ln.cur += (target - ln.cur) * 0.1;
      ln.el.style.opacity = ln.cur.toFixed(3);
    }

    FX.frames++;
  }

  function reduced() {
    const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    return !!(mq && mq.matches);
  }

  function loop(ts) {
    if (!MOTION.running) return;
    if (MOTION.last) MOTION.clock += Math.min(0.2, (ts - MOTION.last) / 1000);
    MOTION.last = ts;
    paint(MOTION.clock);
    MOTION.raf = window.requestAnimationFrame(loop);
  }

  function start() {
    if (MOTION.running || reduced()) return;
    measure();
    /* 首次进入视口才挂 is-live：入场的「织网」与淡入由此开始，
     * 而不是在页面加载时就播完 */
    MOTION.stage.classList.add("is-live");
    MOTION.running = true;
    MOTION.last = 0;
    FX.motion = "raf";
    MOTION.raf = window.requestAnimationFrame(loop);
  }

  function stop() {
    MOTION.running = false;
    MOTION.last = 0;
    if (MOTION.raf) window.cancelAnimationFrame(MOTION.raf);
    MOTION.raf = 0;
    if (FX.motion === "raf") FX.motion = "idle";
  }

  /* 门控：进视口才跑、离开即停、切到后台即停。
   * 不做 rAF 常驻——落地页很长，用户在别的区块读字时这里不该耗电。 */
  function arm(stage) {
    if (reduced()) {
      FX.motion = "reduced";
      stage.classList.add("is-live");
      return;
    }
    if (typeof window.IntersectionObserver !== "function") {
      /* 老浏览器没有 IO：保持静态，宁可不动也不要空转；
       * 但必须自己挂上 is-live，否则这块会一直停在全透明的入场首帧 */
      FX.motion = "static";
      stage.classList.add("is-live");
      return;
    }
    const io = new window.IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          MOTION.visible = e.isIntersecting;
          if (e.isIntersecting && !document.hidden) start();
          else stop();
        });
      },
      { rootMargin: "160px 0px" }
    );
    io.observe(stage);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (MOTION.visible) start();
    });

    let rt = 0;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(measure, 150);
    });

    const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq && mq.addEventListener) {
      mq.addEventListener("change", function () {
        if (mq.matches) stop();
        else if (MOTION.visible) start();
      });
    }
  }

  /* ---------- 说明卡 ---------- */
  /* 位置以节点的布局坐标为准（不含浮动位移）：节点在飘 4px，卡片跟着飘会晕。 */
  function place(tip, node) {
    const stage = node.offsetParent || node.parentElement;
    if (!stage) return;
    const w = tip.offsetWidth || 280;
    const h = tip.offsetHeight || 120;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const nx = node.offsetLeft;
    const ny = node.offsetTop;

    let left = nx + 14;
    if (left + w > W - 8) left = nx - w - 14; // 右侧放不下就翻到左侧
    left = Math.max(8, Math.min(left, W - w - 8));

    let top = ny - h - 12;
    let below = false;
    if (top < 8) {
      top = ny + 16;
      below = true;
    }
    top = Math.max(8, Math.min(top, H - h - 8));

    tip.style.left = left + "px";
    tip.style.top = top + "px";
    tip.classList.toggle("is-below", below);
  }

  function show(node) {
    const tip = document.getElementById("fv-tip");
    if (!tip || !node) return;
    const k = node.dataset.k;
    /* 三个分支都会把四个字段写满，这里不预先赋空串——预置了也立刻被覆盖，
     * 反而让 lint 认为「赋了没用」（no-useless-assignment）。 */
    let idx;
    let name;
    let group;
    let body;

    if (k === "center") {
      idx = "00";
      name = CENTER.t;
      group = "总览";
      body = CENTER.d;
    } else if (k === "g") {
      const g = GROUPS[+node.dataset.g];
      if (!g) return;
      idx = "0" + (+node.dataset.g + 1);
      name = g.name;
      group = g.leaves.length + " 个实现点";
      body = g.brief;
    } else {
      const g = GROUPS[+node.dataset.g];
      const lf = g && g.leaves[+node.dataset.i];
      if (!lf) return;
      idx = "0" + (+node.dataset.g + 1);
      name = lf.t;
      group = g.name;
      body = lf.d;
    }

    tip.querySelector(".fv-tip-idx").textContent = idx;
    tip.querySelector(".fv-tip-name").textContent = name;
    tip.querySelector(".fv-tip-group").textContent = group;
    tip.querySelector(".fv-tip-body").textContent = body;
    tip.classList.add("is-on");
    tip.setAttribute("aria-hidden", "false");
    place(tip, node);
    FX.tipOpen = name;
    FX.activeNode = node;
    node.classList.add("is-hot");
    /* 焦点分组：本组保持墨色、其余四组转浅，同时本组的漂移收着走。
     * 卡片停在一个安静的位置上才好读，四周的网继续流。 */
    MOTION.focus = k === "center" ? -1 : +node.dataset.g;
    const stage = node.parentElement;
    if (stage) {
      if (MOTION.focus < 0) delete stage.dataset.focus;
      else stage.dataset.focus = String(MOTION.focus);
    }
  }

  function hide() {
    const tip = document.getElementById("fv-tip");
    if (!tip) return;
    tip.classList.remove("is-on");
    tip.setAttribute("aria-hidden", "true");
    FX.tipOpen = "";
    FX.activeNode = null;
    MOTION.focus = -1;
    if (MOTION.stage) delete MOTION.stage.dataset.focus;
    document.querySelectorAll("#fv-stage .fv-node.is-hot").forEach((n) => n.classList.remove("is-hot"));
  }
  FX.show = show;
  FX.hide = hide;
  /* 现场核对用：先 stop 再 tick，可以把画面停在任意时刻，方便前后对比 */
  FX.stop = function () {
    stop();
    FX.motion = "hold";
  };

  function bind(stage) {
    stage.addEventListener("mouseover", (e) => {
      const n = e.target.closest && e.target.closest(".fv-node");
      if (!n || !stage.contains(n)) return;
      if (e.relatedTarget && n.contains(e.relatedTarget)) return;
      show(n);
    });
    stage.addEventListener("mouseout", (e) => {
      const n = e.target.closest && e.target.closest(".fv-node");
      if (!n) return;
      if (e.relatedTarget && n.contains(e.relatedTarget)) return;
      hide();
    });
    /* 键盘可达：Tab 走到哪个点就开哪张卡 */
    stage.addEventListener("focusin", (e) => {
      const n = e.target.closest && e.target.closest(".fv-node");
      if (n) show(n);
    });
    stage.addEventListener("focusout", hide);
    /* 触屏没有 hover：点节点开卡，点空白关闭（Esc 也行）。
     * 桌面上这里只做「幂等打开」，不会因为点了一下就把刚 hover 出来的卡片关掉。 */
    stage.addEventListener("click", (e) => {
      const n = e.target.closest && e.target.closest(".fv-node");
      if (!n) {
        hide();
        return;
      }
      show(n);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hide();
    });
  }

  function boot() {
    const stage = document.getElementById("fv-stage");
    if (!stage) return;
    try {
      build(stage);
      bind(stage);
      arm(stage);
      FX.mode = "mesh";
    } catch (e) {
      /* 出问题就整块收起来：宁可没有这块，也不要留一堆错位的点和线 */
      stage.classList.remove("fv-ready");
      FX.ready = false;
      FX.mode = "error";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
