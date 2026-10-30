"use strict";
/* ============================================================
 * v43 · 人格参数化层（MBTI → 可检查的提问策略参数）
 * ------------------------------------------------------------
 * 为什么不是「贴标签」：
 *   MBTI 结果如果只作为形容词写进提示词（「用户是 INTJ」），它对面试
 *   行为的真实影响是不可观测的，也无法对外解释。这一层把它折算成
 *   **五个带方向与强度的数值参数**，每个参数都能回溯到具体维度与
 *   百分比；面试官怎么变、为什么变，都写在 personaTrace() 里。
 *
 *   ① PERSONA_PARAM_DEFS  参数定义（来源维度 / 两极语义 / 对提问的影响）
 *   ② personaParams()     测评结果 → 参数（value ∈ [-1,1]，含来源）
 *   ③ personaStrategy()   参数 → 三角色提问策略（HR / 技术 / 压力）
 *   ④ personaPromptSuffix() 参数 → 系统提示词后缀（真实 LLM 通道生效）
 *   ⑤ personaTrace()      审计表：维度 → 参数 → 影响（可对外展示）
 *   ⑥ personaBridgeHtml() 结果页：把四个字母翻译成面试官会怎么变
 *   ⑦ personaQuestionBias() Mock 通道的确定性偏置（同一回答不同追问）
 *   ⑧ personaPressureNoteHtml() 压力强度适配的显性标注
 *   ⑨ personaCapsuleText() 面试页头部的参数胶囊
 *   ⑩ capturePersona()/activePersona() 开面时快照，报告端同口径读取
 *
 * 诚实边界：无测评结果、或清晰度太低时一律降级为通用策略，
 * 不凭空推测人格；参数只影响**追问方式**，绝不进入评分。
 * ============================================================ */

/** 显著阈值：维度典型度 ≥ 20（约 60:40）才参与策略，避免噪声被当成倾向 */
const PERSONA_MIN_STRENGTH = 20;

/* ---------- ① 参数定义 ----------
 * dim：来源维度；pos/neg：两极字母；posText/negText：该极对提问的影响。 */
const PERSONA_PARAM_DEFS = [
  {
    key: "structure",
    label: "结构化追问",
    dim: "JP",
    pos: "J",
    neg: "P",
    posText: "追问决策依据与备选方案（先把判断标准说清楚）",
    negText: "追问条件突变时的应变（情境题权重上调）",
  },
  {
    key: "openness",
    label: "开放式施压",
    dim: "EI",
    pos: "E",
    neg: "I",
    posText: "保留开放式开场，允许展开叙述后再收敛",
    negText: "先给框架再提问，单轮只问一件事，减少长时间开放式施压",
  },
  {
    key: "empathy",
    label: "情绪适配",
    dim: "TF",
    pos: "F",
    neg: "T",
    posText: "施压前先承认处境，压力强度下调一档并显性标注",
    negText: "按标准强度施压，以证据与逻辑对撞为主",
  },
  {
    key: "evidence",
    label: "举证偏好",
    dim: "TF",
    pos: "T",
    neg: "F",
    posText: "追问数据、指标与取舍过程",
    negText: "追问协作影响、团队反馈与沟通成本",
  },
  {
    key: "concrete",
    label: "细节偏好",
    dim: "SN",
    pos: "S",
    neg: "N",
    posText: "追问具体参数、阈值与实操经验",
    negText: "追问模式迁移与未来可能性",
  },
];

/* ---------- ② 测评结果 → 参数 ---------- */
/**
 * 把 MBTI 结果折算为可审计的行为参数。
 * @param {object|null} r computeMbtiResult / currentMbti 的返回
 * @returns {{type:string,clarity:number,at:number,significant:boolean,
 *   params:Array<{key:string,label:string,value:number,strength:number,
 *   from:{dim:string,name:string,letter:string,pct:number,polar:string}|null}>}|null}
 */
function personaParams(r) {
  if (!r || !r.type || !Array.isArray(r.dims)) return null;
  const byKey = {};
  r.dims.forEach((d) => {
    if (d && d.key) byKey[d.key] = d;
  });
  const params = PERSONA_PARAM_DEFS.map((def) => {
    const d = byKey[def.dim];
    if (!d || typeof d.pctA !== "number") {
      return { key: def.key, label: def.label, value: 0, strength: 0, from: null };
    }
    /* 两个百分比含义不同，别混用：
     *   posPct    = 偏向「本参数正极」的百分比 → 只用来算 value 的方向与强度
     *   letterPct = 偏向「该维所选字母」的百分比 → 给用户看的那个数字
     * 混用会出现「偏 T（0%）」这种自相矛盾的展示。 */
    const posIsA = d.a === def.pos;
    const posPct = posIsA ? d.pctA : 100 - d.pctA;
    const letterPct = Math.max(d.pctA, 100 - d.pctA);
    const value = Math.round((posPct - 50) / 50 * 100) / 100;
    return {
      key: def.key,
      label: def.label,
      value,
      strength: typeof d.strength === "number" ? d.strength : Math.abs(letterPct - 50) * 2,
      from: { dim: def.dim, name: d.name, letter: d.letter, pct: letterPct, posPct, polar: d.letter },
    };
  });
  const significant = params.some((p) => p.strength >= PERSONA_MIN_STRENGTH);
  return { type: r.type, clarity: r.clarity || 0, at: r.at || 0, significant, params };
}

/** 取单个参数（缺省返回中性值，调用侧不必判空） */
function personaParam(p, key) {
  if (!p || !Array.isArray(p.params)) return { key, label: key, value: 0, strength: 0, from: null };
  return p.params.filter((x) => x.key === key)[0] || { key, label: key, value: 0, strength: 0, from: null };
}

/* ---------- ③ 参数 → 三角色策略 ---------- */
/**
 * @param {object|null} p personaParams 的返回
 * @returns {{type:string,clarity:number,hr:object,tech:object,pressure:object,
 *   adapted:boolean,significant:boolean}|null}
 */
function personaStrategy(p) {
  if (!p) return null;
  const structure = personaParam(p, "structure");
  const openness = personaParam(p, "openness");
  const empathy = personaParam(p, "empathy");
  const evidence = personaParam(p, "evidence");
  const concrete = personaParam(p, "concrete");
  const sig = (x) => x.strength >= PERSONA_MIN_STRENGTH;

  /* 压力档位：偏 F（情绪适配高）→ 温和；偏 T → 高强度；其余标准 */
  let level = "标准";
  if (sig(empathy) && empathy.value >= 0.2) level = "温和";
  else if (sig(empathy) && empathy.value <= -0.2) level = "高强度";

  const hrLabel = sig(openness) && openness.value <= -0.2 ? "结构化递进" : "开放式引导";
  const techLabel =
    sig(concrete) && concrete.value >= 0.2
      ? "细节与经验"
      : sig(concrete) && concrete.value <= -0.2
        ? "模式与迁移"
        : "原理与取舍";

  return {
    type: p.type,
    clarity: p.clarity,
    significant: p.significant,
    adapted: level !== "标准",
    hr: {
      label: hrLabel,
      detail:
        hrLabel === "结构化递进"
          ? "偏内向：先给框架再提问，单轮只问一件事，减少连续开放式施压"
          : "偏外向：保留开放式开场，允许候选人展开叙述后再收敛",
    },
    tech: {
      label: techLabel,
      detail:
        techLabel === "细节与经验"
          ? "偏实感：优先追问具体参数、阈值与踩过的坑"
          : techLabel === "模式与迁移"
            ? "偏直觉：优先追问方案迁移、边界条件与未来可能性"
            : "按原理 / 量化 / 取舍三件套追问",
    },
    pressure: {
      level,
      detail:
        level === "温和"
          ? "情绪适配：施压前先承认处境，强度下调一档，并在追问下方显性标注"
          : level === "高强度"
            ? "偏好证据对撞：按高强度施压，追问不可替代性与举证责任"
            : "按标准强度施压",
      /* 供 UI 显性标注使用 */
      note:
        level === "温和"
          ? "本轮压力强度已按你的情绪偏好下调一档"
          : level === "高强度"
            ? "本轮按你偏好证据对撞的方式施压"
            : "",
    },
    evidence: sig(evidence) ? evidence : null,
    structure: sig(structure) ? structure : null,
  };
}

/* ---------- ④ 系统提示词后缀 ---------- */
/**
 * 真实 LLM 通道使用：把参数写成可执行指令，而不是形容词。
 * 无显著参数时返回空串（面试官按通用策略提问，不臆测人格）。
 * @param {object|null} p personaParams 的返回
 * @returns {string}
 */
function personaPromptSuffix(p) {
  if (!p || !p.significant) return "";
  const lines = [];
  p.params.forEach((x) => {
    if (!x.from || x.strength < PERSONA_MIN_STRENGTH) return;
    const def = PERSONA_PARAM_DEFS.filter((d) => d.key === x.key)[0];
    if (!def) return;
    const text = x.value >= 0 ? def.posText : def.negText;
    lines.push(`- 偏向 ${x.from.letter}（${x.from.pct}%，${x.from.name}）：${text}`);
  });
  if (!lines.length) return "";
  return (
    "\n\n【提问策略参数】以下参数来自候选人自评的端侧简易量表，只用于调整你的**追问方式**，" +
    "不得在提问中提及人格类型或测评结果，也不得据此评价候选人。" +
    (p.clarity < 40 ? "（测评清晰度偏低 " + p.clarity + "%，参数仅作弱参考）" : "") +
    "\n" + lines.join("\n")
  );
}

/* ---------- ⑤ 审计表 ---------- */
/**
 * 维度 → 参数 → 影响的逐行说明，供面试页与报告页对外展示。
 * @param {object|null} p personaParams 的返回
 * @returns {Array<{dim:string,dimName:string,letter:string,pct:number,param:string,paramLabel:string,effect:string,strong:boolean}>}
 */
function personaTrace(p) {
  if (!p || !Array.isArray(p.params)) return [];
  const rows = [];
  const seen = {};
  p.params.forEach((x) => {
    if (!x.from) return;
    const def = PERSONA_PARAM_DEFS.filter((d) => d.key === x.key)[0];
    if (!def) return;
    const strong = x.strength >= PERSONA_MIN_STRENGTH;
    /* 同一维度可能派生两个参数（TF → empathy/evidence），合并成一行更好读 */
    const rowKey = x.from.dim;
    const effect = x.value >= 0 ? def.posText : def.negText;
    if (seen[rowKey]) {
      seen[rowKey].effect += "；" + effect;
      seen[rowKey].paramLabel += " / " + x.label;
      seen[rowKey].strong = seen[rowKey].strong || strong;
      return;
    }
    const row = {
      dim: x.from.dim,
      dimName: x.from.name,
      letter: x.from.letter,
      pct: x.from.pct,
      param: x.key,
      paramLabel: x.label,
      effect,
      strong,
    };
    seen[rowKey] = row;
    rows.push(row);
  });
  return rows;
}

/* ---------- ⑥ MBTI 结果页：参数如何进入面试 ---------- */
/**
 * 把「四个字母」翻译成「三位面试官会怎么变」，并给出可当场验证的入口。
 * 这是 MBTI 从孤立测评变成面试输入的桥梁——没有它，参数只是我们内部的事。
 * @param {object|null} p personaParams 的返回
 * @returns {string} HTML 片段（无参数时返回空串）
 */
function personaBridgeHtml(p) {
  const strat = personaStrategy(p);
  if (!strat) return "";
  const rows = [
    ["💼 HR 面", strat.hr.label, strat.hr.detail],
    ["⚙️ 技术面", strat.tech.label, strat.tech.detail],
    ["🔥 压力面", strat.pressure.level, strat.pressure.detail],
  ]
    .map(
      (r) =>
        `<div class="pl-row"><span class="pl-who">${escHtml(r[0])}</span><span class="pl-tag">${escHtml(r[1])}</span><span class="pl-why">${escHtml(r[2])}</span></div>`
    )
    .join("");
  const trace = personaTrace(p)
    .filter((t) => t.strong)
    .map(
      (t) =>
        `<div class="pl-trace"><span>${escHtml(t.dimName)}</span><b>偏 ${escHtml(t.letter)} ${t.pct}%</b><span>${escHtml(t.effect)}</span></div>`
    )
    .join("");
  const weak = !p.significant
    ? `<div class="pl-hint">你的四个维度都接近中线（典型度均低于 ${PERSONA_MIN_STRENGTH}），因此<b>不启用个性化策略</b>——面试官按通用策略提问，避免用噪声给你贴标签。</div>`
    : "";
  return `
    <div class="persona-link" style="margin-top:16px">
      <div class="pane-title" style="font-size:14px">🧬 这份结果怎么进入面试（只调提问方式，不参与评分）</div>
      ${weak}
      <div class="pl-grid">${rows}</div>
      ${trace ? `<details class="pl-details"><summary>参数溯源：哪一维导致了什么</summary>${trace}</details>` : ""}
      <div style="margin-top:10px">
        <button class="btn btn-primary btn-sm" onclick="switchTab('interview')">去面试，验证它会怎么问 →</button>
      </div>
    </div>`;
}

/* ---------- ⑦ Mock 通道的确定性偏置 ---------- */
/* 与「贴标签」的区别：这里不生成人格话术，只改**问什么**。
 * 同一句回答，参数不同 → 追问不同；规则确定，可被测试复现。 */
const PERSONA_QUESTION_BANK = {
  structure: [
    (k) => `关于「${k}」，你当时的决策依据是什么？有哪些备选方案被排除了？`,
    (k) => `如果重来一次，「${k}」你会改动哪一步？判断标准是什么？`,
  ],
  explore: [
    (k) => `如果「${k}」的前提突然变了（预算砍半、周期缩短），你会怎么调整？`,
    (k) => `「${k}」这个方向如果被整体否掉，你拿什么替代？`,
  ],
  empathy: [
    (k) => `先说说「${k}」当时最让你为难的地方——不急着给结论。`,
    (k) => `推动「${k}」时，团队里有没有人因此承压？你怎么处理的？`,
  ],
  evidence: [
    (k) => `「${k}」有没有可量化的结果？比如延迟、QPS、错误率的变化。`,
    (k) => `「${k}」在成本和效果之间，你当时怎么权衡的？`,
  ],
  premium: [
    (k) => `「${k}」的关键参数（阈值、超时、并发数）具体是多少？依据是什么？`,
    (k) => `「${k}」落地时踩过哪些具体的坑？是怎么发现的？`,
  ],
};

/* 参数（按符号）→ 追问族。极性为正时走向正极语义，为负时走向负极语义。 */
const PERSONA_BIAS_MAP = {
  structure: (v) => (v > 0 ? "structure" : "explore"),
  openness: (v) => (v > 0 ? "explore" : "structure"),
  empathy: (v) => (v > 0 ? "empathy" : "evidence"),
  evidence: (v) => (v > 0 ? "evidence" : "empathy"),
  concrete: (v) => (v > 0 ? "premium" : "explore"),
};

/**
 * 按轮次轮转显著参数，给出本轮的人格偏置追问（无偏置返回 null）。
 * 只在奇数轮介入，把偶数轮留给题库原题与常规追问——避免「每句都被
 * 人格参数接管」的机械感。
 * @param {object|null} p personaParams 的返回
 * @param {number} n 当前轮次
 * @param {string} keyword 从回答中提取的关键词
 * @returns {{question:string,param:string,paramLabel:string,effect:string}|null}
 */
function personaQuestionBias(p, n, keyword) {
  if (!p || !p.significant) return null;
  if (n % 2 === 0) return null; // 偶数轮交给常规出题
  const strong = p.params.filter((x) => x.from && x.strength >= PERSONA_MIN_STRENGTH);
  if (!strong.length) return null;
  const pick = strong[n % strong.length];
  const picker = PERSONA_BIAS_MAP[pick.key];
  if (!picker) return null;
  const family = picker(pick.value);
  const bank = PERSONA_QUESTION_BANK[family];
  if (!bank || !bank.length) return null;
  const def = PERSONA_PARAM_DEFS.filter((d) => d.key === pick.key)[0];
  const effect = pick.value >= 0 ? def.posText : def.negText;
  return {
    question: bank[n % bank.length](keyword),
    param: pick.key,
    paramLabel: pick.label,
    effect,
    polar: pick.from.letter,
    pct: pick.from.pct,
  };
}

/* ---------- ⑧ 压力强度显性标注 ---------- */
/**
 * 压力面试官「因人施面」的可见凭据：只在强度被适配时出现。
 * 不适配 / 无测评时返回空串——不为了好看而伪造适配。
 * @param {object|null} p personaParams 的返回
 * @returns {string} 可直接插入 DOM 的 HTML 片段
 */
function personaPressureNoteHtml(p) {
  const strat = personaStrategy(p);
  if (!strat || !strat.adapted || !strat.pressure.note) return "";
  const emp = personaParam(p, "empathy");
  const pct = emp.from ? `（偏 ${emp.from.letter} ${emp.from.pct}%）` : "";
  return `<span class="persona-fit-note">🫱 ${escHtml(strat.pressure.note)}${escHtml(pct)}</span>`;
}

/* ---------- ⑨ 面试页头部胶囊 ---------- */
/**
 * @param {object|null} p personaParams 的返回
 * @returns {string} 胶囊文案（无测评时为空串）
 */
function personaCapsuleText(p) {
  if (!p || !p.type) return "";
  const strat = personaStrategy(p);
  if (!p.significant) return "🧬 " + p.type + " · 参数不显著";
  const bits = [];
  if (strat) bits.push("压力" + strat.pressure.level);
  const concrete = personaParam(p, "concrete");
  if (concrete.from && concrete.strength >= PERSONA_MIN_STRENGTH) {
    bits.push(concrete.value > 0 ? "细节向" : "模式向");
  }
  return "🧬 " + p.type + " · " + bits.join(" · ");
}

/* ---------- ⑩ 快照 ---------- */
let personaSnapshot = null;

/** 开面时快照，保证一场面试内参数稳定（中途重测不会改变本场策略） */
function capturePersona() {
  personaSnapshot = personaParams(currentMbti());
  return personaSnapshot;
}

/** 本场生效的人格参数：优先快照，回落当前测评 */
function activePersona() {
  return personaSnapshot || personaParams(currentMbti());
}
