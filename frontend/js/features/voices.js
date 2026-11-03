"use strict";
/* ============================================================
 * v63 · 能力网（Capability Mesh）
 * 落地页底部「这张网由什么支撑」的关系图：中心 → 五个主题 → 二十个实现点。
 *
 * 设计取舍（为什么不用 canvas）：
 * 1) 参考站用 canvas 逐帧重绘。这里改用「DOM 节点 + SVG 连线」：
 *    文字可选中、可读屏、可打印（PDF 导出走的是同一条渲染路径），
 *    jsdom 里能数节点、能断言文案，canvas 则只能截图比对；
 * 2) 浮动交给 CSS @keyframes（translate），不占 rAF：
 *    标签页切后台自动暂停，reduced-motion 一行 media query 关干净；
 * 3) 连线用 viewBox="0 0 100 100" + preserveAspectRatio="none"，
 *    坐标即百分比，与节点的 left/top 百分比同源，容器怎么缩放都对齐；
 *    线宽靠 vector-effect 固定 1px，不被非等比缩放拉花。
 *
 * 交互：悬停 / 聚焦 → 弹出说明卡（1 节点 1 句，讲清它在代码里对应什么）；
 * 触屏点一下切换。窄屏（<900）整块降级为分组列表，不做「点不动的图」。
 * ============================================================ */
(function initVoices() {
  const FX = (window.__bpVoices = {
    ready: false,
    nodes: 0,
    groups: 0,
    links: 0,
    mode: "",
    tipOpen: "",
    activeNode: null,
    show: null,
    hide: null,
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
   * 又不至于让所有节点同相位地一起晃。 */
  function drift(i, isCenter) {
    if (isCenter) return { ax: 2, ay: -2, dur: 13, del: -1 };
    const ax = 3 + (i % 4);
    const ay = [5, -4, 6, -3][i % 4];
    const dur = (8.5 + (i % 5) * 1.3).toFixed(1);
    const del = (-((i * 1.37) % 9) - 0.3).toFixed(2);
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
  function build(stage) {
    const paths = [];
    const pins = [];
    let seq = 0;

    /* 中心 → 主节点 */
    GROUPS.forEach((g, gi) => {
      const gp = at(g.deg, G_RX, G_RY);
      paths.push(
        '<line class="fv-link fv-link-hub" x1="' + CX + '" y1="' + CY + '" x2="' + gp.x + '" y2="' + gp.y + '"></line>'
      );
      /* 主节点 → 细标签 */
      g.leaves.forEach((lf) => {
        const lp = leafAt(gp.x, gp.y, g.deg + lf.da);
        paths.push(
          '<line class="fv-link" x1="' + gp.x + '" y1="' + gp.y + '" x2="' + lp.x + '" y2="' + lp.y + '"></line>'
        );
      });
      pins.push({ kind: "group", gi, g, x: gp.x, y: gp.y, seq: seq++ });
      g.leaves.forEach((lf, li) => {
        const lp = leafAt(gp.x, gp.y, g.deg + lf.da);
        pins.push({ kind: "leaf", gi, li, g, lf, x: lp.x, y: lp.y, seq: seq++ });
      });
    });

    const d0 = drift(0, true);
    const centerHtml =
      '<button type="button" class="fv-node fv-center" data-k="center" style="--x:50;--y:50;--ax:' +
      d0.ax + ';--ay:' + d0.ay + ';--dur:' + d0.dur + 's;--del:' + d0.del +
      's;--din:0ms"><span class="fv-t">' + esc(CENTER.t) + "</span></button>";

    const nodeHtml = pins
      .map((p, i) => {
        const d = drift(i + 1, false);
        const isG = p.kind === "group";
        const label = isG ? p.g.name : p.lf.t;
        return (
          '<button type="button" class="fv-node ' + (isG ? "fv-group" : "fv-leaf") +
          '" data-k="' + (isG ? "g" : "l") + '" data-g="' + p.gi + '" data-i="' + (p.li === undefined ? "" : p.li) +
          '" style="--x:' + p.x + ";--y:" + p.y + ";--ax:" + d.ax + ";--ay:" + d.ay +
          ";--dur:" + d.dur + "s;--del:" + d.del + 's;--din:' + (i * 34 + 60) +
          'ms"><span class="fv-t">' + esc(label) + "</span></button>"
        );
      })
      .join("");

    /* 说明卡是预置在舞台里的，innerHTML 会把它一起冲掉 —— 先摘下来，写完再挂回去 */
    const tip = stage.querySelector(".fv-tip");

    stage.innerHTML =
      '<svg class="fv-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      paths.join("") +
      "</svg>" +
      centerHtml +
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

    FX.nodes = pins.length + 1;
    FX.groups = GROUPS.length;
    FX.links = paths.length;
    FX.ready = true;
    stage.classList.add("fv-ready");
    return stage;
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
  }

  function hide() {
    const tip = document.getElementById("fv-tip");
    if (!tip) return;
    tip.classList.remove("is-on");
    tip.setAttribute("aria-hidden", "true");
    FX.tipOpen = "";
    FX.activeNode = null;
    document.querySelectorAll("#fv-stage .fv-node.is-hot").forEach((n) => n.classList.remove("is-hot"));
  }
  FX.show = show;
  FX.hide = hide;

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
