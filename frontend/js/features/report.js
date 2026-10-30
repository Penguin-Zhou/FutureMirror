"use strict";
/* ============================================================
 * 7. 评估报告（由真实面试对话动态生成，可解释评分）
 * ============================================================ */
const DIM_DEFS = [
  { key: "depth", dimension: "内容深度", pool: ["为最强项目补充 3 个可深挖技术点与量化结果", "复盘一个失败案例，讲清根因与改进"] },
  { key: "logic", dimension: "结构逻辑", pool: ["用 STAR 重写两个核心项目的 300 字介绍", "每天口述 1 遍项目介绍并录音回听"] },
  { key: "expression", dimension: "语言表达", pool: ["录音练习，消除口头禅（然后/那个/就是）", "把长回答拆成「总-分-总」三段式"] },
  { key: "fit", dimension: "岗位匹配", pool: ["针对匹配报告中的缺口技能制定 30 天补强计划", "把缺口技能写成课程项目并更新简历"] },
  { key: "stress", dimension: "抗压表现", pool: ["完成 2 次压力面模拟，练习被打断后的恢复话术", "预演 5 个尖锐问题（方案缺陷/换人重做/deadline 提前）"] },
];
const BASE_PLAN = [
  "全流程综合模拟一次，对比历史报告看进步曲线",
  "把本次报告的证据清单过一遍，标记已改进项",
];
/* v22.1：已同步到后端的签名（模块级，不落 localStorage——
 * 刷新页面后重新同步一次是正确行为（重新取回服务端评分），
 * 而同页内反复切到报告页不应重复 POST。 */
let lastSyncSig = "";

function scoreSession() {
  const turns = session.turns;
  const all = turns.map(t => t.answer).join("\n");
  const digitCount = (all.match(/\d/g) || []).length;
  const techHits = SKILL_DICT.filter(s => all.includes(s)).length;
  const filler = (all.match(/然后|那个|就是/g) || []).length;
  const starHits = (all.match(/背景|目标|负责|通过|最终|结果|因此|于是/g) || []).length;
  const pressureTurns = turns.filter(t => t.mode === "pressure");
  const defensive = (all.match(/不是我的|跟我没关系|但是|我没有/g) || []).length;
  const shortAnswers = turns.filter(t => t.answer.length < 40).length;

  const clamp = v => Math.max(30, Math.min(96, Math.round(v)));
  let depth = clamp(48 + Math.min(22, digitCount * 2.2) + Math.min(18, techHits * 2.5) + (turns.length >= 4 ? 8 : 0));
  // v12：代码沙盒通过率并入「内容深度」维度（编码能力作为可量化证据）
  if (typeof session.codeScore === "number") depth = clamp(depth * 0.8 + session.codeScore * 100 * 0.2);
  const logic = clamp(46 + Math.min(30, starHits * 4) + (turns.length >= 3 ? 8 : 0));
  const expression = clamp(88 - Math.min(24, filler * 5) - (shortAnswers * 4));
  const fit = matchResult
    ? clamp(52 + matchResult.matchScore * 0.4 + Math.min(10, techHits))
    : clamp(55 + Math.min(20, techHits * 2));
  const stress = clamp(72 - Math.min(20, defensive * 6) - (pressureTurns.length ? Math.min(12, shortAnswers * 3) : 6));
  return [
    { ...DIM_DEFS[0], score: depth, comment: digitCount >= 4 ? "回答包含量化数据，细节可信度较好" : "缺少量化数据支撑，建议补充延迟/QPS/用户数" },
    { ...DIM_DEFS[1], score: logic, comment: starHits >= 3 ? "具备 STAR 结构意识，收尾可更明确" : "结构松散，建议用 STAR（背景-目标-行动-结果）组织" },
    { ...DIM_DEFS[2], score: expression, comment: filler > 2 ? "口头禅偏多，影响专业度" : "表达流畅度良好" },
    { ...DIM_DEFS[3], score: fit, comment: matchResult ? `基于匹配报告：匹配分 ${matchResult.matchScore}，缺口 ${matchResult.gaps.slice(0, 3).join("、") || "无"}` : "未生成匹配报告，按技能命中估算" },
    { ...DIM_DEFS[4], score: stress, comment: defensive > 1 ? "出现防御性表述，压力下需先承认再解释" : "面对追问保持冷静，偶有防御性表述" },
  ];
}

function buildEvidence(turns) {
  return turns.slice(-4).map(t => {
    const quote = t.answer.length > 60 ? t.answer.slice(0, 60) + "…" : t.answer;
    return { agent: t.agent, quote, note: t.notes };
  });
}

function buildPlan(dims) {
  const sorted = [...dims].sort((a, b) => a.score - b.score).slice(0, 3);
  const plan = [];
  let day = 1;
  const alloc = [3, 2, 1];
  sorted.forEach((d, i) => {
    const n = alloc[i];
    for (let j = 0; j < n && j < d.pool.length; j++) {
      plan.push({ day: `Day ${day++}`, task: d.pool[j], tag: d.dimension });
    }
  });
  BASE_PLAN.forEach(t => plan.push({ day: `Day ${day++}`, task: t }));
  return { plan, weakest: sorted[0] };
}

/* ============================================================
 * v44 · 报告首屏：把「一堆分数」压成一句诊断 + 一张轮廓
 * ------------------------------------------------------------
 * 报告页的停留通常只有十几秒，第一眼需要的不是 5 个数字，
 * 而是「我强在哪、该补哪」。这句诊断由确定性规则拼出（不调 LLM），
 * 因此每次刷新同一份报告得到同一句话，可被断言、可被复现。
 * ============================================================ */
/**
 * @param {Array<{dimension:string,score:number}>} dims 五维得分
 * @returns {{say:string,tone:string,gap:number,best:object|null,worst:object|null}}
 */
function reportDiagnosis(dims) {
  const list = (dims || []).slice().sort((a, b) => b.score - a.score);
  if (!list.length) return { say: "", tone: "flat", gap: 0, best: null, worst: null };
  const best = list[0];
  const worst = list[list.length - 1];
  const gap = best.score - worst.score;
  let say;
  if (gap < 8) {
    say = `五维分布集中（${worst.score}–${best.score}），没有明显短板——下一步是把「${best.dimension}」做成能复述三分钟的完整故事。`;
  } else if (worst.score < 60) {
    say = `「${best.dimension}」是本场最强项（${best.score}），「${worst.dimension}」是最需要投入的方向（${worst.score}）——相差 ${gap} 分，能力结构还不均衡。`;
  } else {
    say = `「${best.dimension}」是本场最强项（${best.score}），「${worst.dimension}」相对偏弱（${worst.score}）——差距 ${gap} 分，属于可接受的波动。`;
  }
  return { say, tone: gap >= 20 ? "wide" : gap >= 8 ? "mid" : "flat", gap, best, worst };
}

/** 五维轮廓缩略：5 条短轨，比完整雷达更快被扫读 */
function profileStripHtml(dims) {
  const list = dims || [];
  const aria = "五维得分轮廓：" + list.map((d) => d.dimension + " " + d.score + " 分").join("，");
  return `<div class="rh-strip" role="img" aria-label="${escHtml(aria)}">${list
    .map(
      (d) =>
        `<div class="rp-row"><span class="rp-name">${escHtml(d.dimension)}</span><span class="rp-track"><i style="width:${Math.max(
          2,
          Math.min(100, d.score)
        )}%"></i></span><span class="rp-num">${d.score}</span></div>`
    )
    .join("")}</div>`;
}

/* 点阵评分：5 格对应 5 档，比纯数字更容易一眼比较。
 * 数字仍然保留（可读性 + 读屏 + 打印），点阵只做视觉冗余。 */
function dimDots(score) {
  const n = Math.max(0, Math.min(5, Math.round((Number(score) || 0) / 20)));
  let out = "";
  for (let i = 0; i < 5; i++) out += `<i class="${i < n ? "on" : ""}"></i>`;
  return `<span class="dim-dots" aria-hidden="true">${out}</span>`;
}

/** 该轮回答的两个镜头分歧（无数据返回 null，不伪造一致） */
function lensGapFor(views, turn) {
  const items = (views && views.items) || [];
  const hit = items[turn - 1];
  return hit && typeof hit.gap === "number" ? hit.gap : null;
}

/** 分歧标记：只在值得注意时出现（≥10 分）。
 *  两位面试官在 0–9 分内摆动属于同一判断区间，标在卡上只会稀释信号；
 *  完整的分歧视图（含 8 分起的每一轮）仍在报告下方的「Agent 分歧视图」里。 */
function dimGapTag(gap) {
  if (gap == null || gap < 10) return "";
  const lv = gapLevel(gap);
  return `<span class="dim-gap ${lv.cls}" title="同一段原话：技术面与 HR 面评分相差 ${gap} 分">⚖ ${gap}</span>`;
}

function radarSVG(data, opts) {
  const ref = opts && typeof opts.ref === "number" ? opts.ref : 0;
  const cx = 165, cy = 160, R = 108, n = data.length;
  const angle = i => (Math.PI * 2 * i / n) - Math.PI / 2;
  const pt = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  let rings = "", axes = "";
  [0.25, 0.5, 0.75, 1].forEach(f => {
    rings += `<polygon points="${data.map((_, i) => pt(i, R * f).join(",")).join(" ")}" fill="none" stroke="var(--line)"/>`;
  });
  data.forEach((_, i) => { const [x, y] = pt(i, R); axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`; });
  const vpts = data.map((d, i) => pt(i, R * d.score / 100).join(",")).join(" ");
  const dots = data.map((d, i) => { const [x, y] = pt(i, R * d.score / 100); return `<circle id="radar-dot-${i}" class="radar-dot" cx="${x}" cy="${y}" r="3.5" fill="var(--brand)"/>`; }).join("");
  const labels = data.map((d, i) => {
    const [x, y] = pt(i, R + 24);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="12.5" fill="var(--muted)">${d.dimension}</text>
            <text x="${x}" y="${y + 15}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="var(--faint)">${d.score}</text>`;
  }).join("");
  /* v44：目标线——明确是「本产品设定的达标参考」，不是人群统计基线，
   * 所以文案里不出现「同岗位平均」这类无法提供来源的说法。 */
  const refPoly = ref
    ? `<polygon class="radar-ref" points="${data.map((_, i) => pt(i, R * ref / 100).join(",")).join(" ")}" fill="none" stroke="var(--faint)" stroke-width="1" stroke-dasharray="3 4"/>`
    : "";
  return `<svg viewBox="0 0 330 330" style="width:100%;max-width:340px" role="img" aria-label="能力雷达图">
    ${rings}${axes}${refPoly}
    <polygon class="radar-pop" points="${vpts}" fill="var(--brand-bg)" stroke="var(--brand)" stroke-width="2"/>
    ${dots}${labels}
  </svg>`;
}

function historySVG(history) {
  const W = 320, H = 120, pad = 26;
  const totals = history.map(h => h.total);
  const min = Math.min(...totals) - 4, max = Math.max(...totals) + 4;
  const x = i => pad + (W - pad * 2) * (history.length === 1 ? 0.5 : i / (history.length - 1));
  const y = v => H - 18 - (H - 36) * (v - min) / Math.max(1, max - min);
  const pts = history.map((h, i) => `${x(i)},${y(h.total)}`).join(" ");
  const dots = history.map((h, i) => `<circle class="bp-chart-dot" cx="${x(i)}" cy="${y(h.total)}" r="4" fill="var(--brand)" data-tip="第 ${i + 1} 次 · 总分 ${h.total}" tabindex="0"/><text x="${x(i)}" y="${y(h.total) - 8}" text-anchor="middle" font-size="9.5" fill="var(--faint)">${h.total}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:340px" role="img" aria-label="历史进步曲线">
    <line x1="${pad}" y1="${H - 18}" x2="${W - pad}" y2="${H - 18}" stroke="var(--line)"/>
    <polyline points="${pts}" fill="none" stroke="var(--brand)" stroke-width="2"/>
    ${dots}
  </svg>`;
}

/* v34：面试状态（摄像头在场检测）——
 * 把后端对 InterviewStatusEvent 的聚合结果（在场率 / 专注率 / 采样次数）写进评估报告，
 * 让「过程信号」与「评分证据」同处一份报告。数据来源优先级：
 * 服务端 /api/interviews/{id}/report 返回的 status → 本地 camLastSummary（后端不可用时兜底）。 */
let lastReportStatus = null;

/* v36：最近一次报告的原始数据，供 AI 小助手「追问细节」时引用。
 * 只存维度得分 / 证据 / 学习路径等结构化结果，回答一律基于真实数据，不编造分数。 */
let lastReportData = null;

/* ============================================================
 * v43 · 人格 - 表现关联（可解释，且明确承认「无关」）
 * ------------------------------------------------------------
 * MBTI 在此不是标签，而是**一条可验证的假设**：
 *   若你自评偏 J（结构化），但「结构逻辑」得分偏低，
 *   那么这个落差更可能来自临场组织，而不是规划能力——这比
 *   「你是 INTJ，适合做架构」有用得多。
 * 三种判定都必须说得出依据，也必须允许说「没有显著关联」：
 *   aligned 一致 / tension 值得注意 / none 无显著关联
 * 相关不等于因果；一场面试、一份 20 题自评，样本极小。
 * ============================================================ */
const PERSONA_DIM_LINKS = [
  { key: "depth", params: ["evidence", "concrete"] },
  { key: "logic", params: ["structure"] },
  { key: "expression", params: ["openness"] },
  { key: "fit", params: [] },
  { key: "stress", params: ["empathy"] },
];

/**
 * 单维关联判定。
 * @param {string} dimKey 维度 key
 * @param {number} score 该维得分
 * @param {object|null} p personaParams 的返回
 * @returns {{kind:string,text:string,param:string,pct:number,letter:string}|null}
 */
function personaFitFor(dimKey, score, p) {
  if (!p || !p.significant) return null;
  const link = PERSONA_DIM_LINKS.filter((l) => l.key === dimKey)[0];
  if (!link || !link.params.length) return null;
  const cands = link.params
    .map((k) => personaParam(p, k))
    .filter((x) => x.from && x.strength >= PERSONA_MIN_STRENGTH);
  if (!cands.length) return null;
  /* 取强度最高的那个参数作为主要解释项，避免一段话里堆四个变量 */
  const lead = cands.slice().sort((a, b) => b.strength - a.strength)[0];
  const pct = lead.from.pct;
  const letter = lead.from.letter;
  const high = score >= 70;
  const low = score < 65;

  if (dimKey === "depth") {
    if (high && lead.value > 0)
      return { kind: "aligned", param: lead.label, pct, letter, text: `得分较高，与你偏 ${letter}（${pct}%）的举证偏好方向一致：你习惯用具体依据支撑结论。` };
    if (low && lead.value > 0)
      return { kind: "tension", param: lead.label, pct, letter, text: `你在测评里偏向 ${letter}（${pct}%），习惯用数据与细节说话，但本轮这一维得分偏低——更可能是这次回答没展开，而不是能力不足。` };
    if (low && lead.value < 0)
      return { kind: "note", param: lead.label, pct, letter, text: `你偏 ${letter}（${pct}%），更习惯讲影响与可能性；这一维考察的是量化与细节，属于可针对性补的部分。` };
    return { kind: "note", param: lead.label, pct, letter, text: `得分处于中段，与你偏 ${letter}（${pct}%）的方向并不矛盾；要往上走还需要更前置的结论与更明确的量化。` };
  }
  if (dimKey === "logic") {
    if (high && lead.value > 0)
      return { kind: "aligned", param: lead.label, pct, letter, text: `得分较高，与你偏 ${letter}（${pct}%）的计划性倾向一致：先立框架再展开。` };
    if (low && lead.value > 0)
      return { kind: "tension", param: lead.label, pct, letter, text: `你自评偏 ${letter}（${pct}%），通常是有计划的人，但本轮结构得分偏低——更像临场组织没跟上，而不是规划能力问题。` };
    if (low && lead.value < 0)
      return { kind: "tension", param: lead.label, pct, letter, text: `你偏 ${letter}（${pct}%），习惯边想边说；这在面试里容易结构松散，建议开场先给结论。` };
    return { kind: "note", param: lead.label, pct, letter, text: `得分处于中段，与你偏 ${letter}（${pct}%）的计划性倾向基本吻合；下一步是把「背景-目标-行动-结果」压成三段。` };
  }
  if (dimKey === "expression") {
    if (high && lead.value > 0)
      return { kind: "aligned", param: lead.label, pct, letter, text: `表达流畅，与你偏 ${letter}（${pct}%）的外向倾向一致。` };
    if (low && lead.value < 0)
      return { kind: "tension", param: lead.label, pct, letter, text: `你偏 ${letter}（${pct}%），在一对一高压表达中更容易出现停顿与自我修正——这是节奏问题，不是内容问题。` };
    return { kind: "note", param: lead.label, pct, letter, text: `得分处于中段，与你偏 ${letter}（${pct}%）的表达节奏相符；减少口头禅比提升语速更有效。` };
  }
  if (dimKey === "stress") {
    if (low && lead.value > 0)
      return { kind: "tension", param: lead.label, pct, letter, text: `你偏 ${letter}（${pct}%），对质疑的情绪反应通常更明显；本轮抗压得分偏低可能与此有关——这不是缺陷，是可以练的领域。` };
    if (high && lead.value < 0)
      return { kind: "aligned", param: lead.label, pct, letter, text: `抗压表现稳定，与你偏 ${letter}（${pct}%）的「先处理问题、再处理情绪」方式一致。` };
    return { kind: "none", param: lead.label, pct, letter, text: "这一维与人格参数无显著关联。" };
  }
  return null;
}

/**
 * 生成「人格 - 表现关联」卡片。
 * @param {Array<{key:string,dimension:string,score:number}>} dims 五维得分
 * @param {object|null} p personaParams 的返回（可为 null → 引导先做测评）
 * @returns {string} HTML
 */
function personaFitCard(dims, p) {
  if (!p || !p.type) {
    return `<div class="card persona-fit" id="report-persona" style="padding:14px 16px;margin-top:14px">
      <div class="pane-title" style="margin-bottom:2px">🧬 人格 - 表现关联<span class="tag-demo">未启用</span></div>
      <p class="hint" style="margin-bottom:0">还没有 MBTI 测评结果，因此无法做人格与表现的关联判断。<b>这里不会凭空推测你的人格</b>——去「MBTI 测评」花 2 分钟测一次，报告会多出这一块，面试官也会据此调整追问方式。</p>
      <div style="margin-top:10px"><button class="btn btn-outline btn-sm" onclick="switchTab('mbti')">去做测评 →</button></div>
    </div>`;
  }
  const strat = typeof personaStrategy === "function" ? personaStrategy(p) : null;
  const rows = (dims || [])
    .map((d) => {
      const fit = personaFitFor(d.key, d.score, p);
      const kindLabel = fit
        ? { aligned: "一致", tension: "值得注意", note: "待补强", none: "无显著关联" }[fit.kind] || ""
        : "无显著关联";
      const kindCls = fit ? "pf-" + fit.kind : "pf-none";
      const text = fit ? fit.text : "这一维与人格参数没有显著关联，主要取决于回答内容本身。";
      return `<div class="pf-row ${kindCls}">
        <div class="pf-head"><b>${escHtml(d.dimension)}</b><span class="pf-score">${d.score}</span><span class="pf-kind">${escHtml(kindLabel)}</span></div>
        <div class="pf-text">${escHtml(text)}</div>
      </div>`;
    })
    .join("");
  const stratLine = strat
    ? `本场提问策略：HR「${escHtml(strat.hr.label)}」· 技术「${escHtml(strat.tech.label)}」· 压力「${escHtml(strat.pressure.level)}」`
    : "";
  const weakNote = !p.significant
    ? `<div class="notice notice-info" style="margin:10px 0 0;font-size:12.5px">你的四个维度都接近中线（典型度均低于 ${PERSONA_MIN_STRENGTH}），因此<b>不做关联推断</b>——用噪声贴标签比不贴更糟。</div>`
    : "";
  return `<div class="card persona-fit" id="report-persona" style="padding:14px 16px;margin-top:14px">
      <div class="pane-title" style="margin-bottom:2px">🧬 人格 - 表现关联<span class="tag-demo">${escHtml(p.type)} · 自评量表</span></div>
      <p class="hint" style="margin:2px 0 10px">${stratLine}　·　说明：人格参数<b>只改变提问方式</b>，从不参与打分。</p>
      ${rows}
      ${weakNote}
      <p class="hint" style="margin:10px 0 0">相关性不等于因果：这里的判断基于「一场面试的 5 轮问答」与「一次 20 题自评」，样本极小。<b>它提供的是假设，不是结论</b>，也不构成能力或心理评价。</p>
    </div>`;
}

/* ============================================================
 * v44 · 降级账本：本场有没有走过兜底路径，报告里写明
 * ------------------------------------------------------------
 * 降级演练如果只活在演示那一刻，它仍然是一次「表演」。写进报告后，
 * 它就变成一条可追溯记录：第几轮、由什么触发、结果是否标注。
 * 没有触发时整块不渲染——不虚构一次「成功兜底」。
 * ============================================================ */
function degradeLogCard(log) {
  const list = Array.isArray(log) ? log : [];
  if (!list.length) return "";
  const rows = list
    .map(
      (x) =>
        `<div class="dl-row"><span class="dl-turn">第 ${x.turn} 轮</span><span class="dl-why">${
          x.drill ? "演练触发（主动失效）" : "网关无响应"
        }</span><span class="dl-how">本地引擎接管 · 未伪造结果</span></div>`
    )
    .join("");
  return `<div class="card degrade-log" id="report-degrade" style="padding:14px 16px;margin-top:14px">
      <div class="pane-title" style="margin-bottom:2px">⚡ 降级记录<span class="tag-demo">共 ${list.length} 次 · 对话未中断</span></div>
      <p class="hint" style="margin:2px 0 8px">在线通道不可用时，该轮追问由本地确定性引擎接管并<b>在气泡上标注</b>；其余轮次仍走真实模型，报告评分不因降级而改判。</p>
      ${rows}
    </div>`;
}

function reportStatusCard(st) {
  const count = st && st.count ? st.count : 0;
  const pr = st && st.presence_rate != null ? st.presence_rate : null;
  const ar = st && st.attentive_rate != null ? st.attentive_rate : null;
  const cell = (num, cap) =>
    `<div class="status-cell"><div class="status-num">${num}</div><div class="status-cap">${cap}</div></div>`;
  return `<div class="card" id="report-status" style="padding:14px 16px;margin-top:14px">
      <div class="pane-title" style="margin-bottom:2px">🎥 面试状态（摄像头在场检测）<span class="tag-demo">端侧识别 · 仅上报结构化结果</span></div>
      <div class="status-grid">
        ${cell(pr == null ? "—" : pr + "%", "在场率")}
        ${cell(ar == null ? "—" : ar + "%", "专注率")}
        ${cell(count ? count + " 次" : "0 次", "采样次数")}
      </div>
      <p class="hint" style="margin-bottom:0">${count
        ? `共 ${count} 次后台采样${st.latest ? `，最近状态「${esc(st.latest)}」` : ""}。视频帧始终留在浏览器内，服务端只收到结构化状态（是否在场 / 是否专注）。`
        : (typeof camWasActiveThisSession !== "undefined" && camWasActiveThisSession
          ? "本次面试已开启摄像头（端侧检测），但后台与本地都未收到在场采样——可能是后端瞬时不可达或部署环境未连接后端。请确认后端已连接后重试，或检查浏览器是否允许摄像头权限。"
          : "本次面试未开启摄像头，因此没有在场数据。开启摄像头后再完成一次面试，报告会附带在场率与专注率。")}</p>
    </div>`;
}

async function renderReport(force) {
  const box = $("report-content");
  if (!currentUser) {
    box.innerHTML = `<div class="empty-state fade-up">
      <div class="ic">🔒</div>
      <p>请先登录并完成一次模拟面试，才能生成评估报告。</p>
      <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="showView('auth')">登录 / 注册</button>
        <button class="btn btn-outline btn-sm" onclick="switchTab('interview')">去模拟面试</button>
      </div>
    </div>`;
    /* v31：空态撤下能力分布看板，避免残留基线数据 */
    try { if (window.__bpViz && window.__bpViz.removeReportPanel) window.__bpViz.removeReportPanel(); } catch (e) {}
    return;
  }
  if (!session.turns.length) {
    box.innerHTML = `<div class="empty-state fade-up">
      <div class="ic">🎯</div>
      <p>尚未完成模拟面试——报告需要基于你的<b>真实回答</b>生成（每条评分证据都会引用你的原话）。</p>
      <div style="margin-top:14px"><button class="btn btn-primary btn-sm" onclick="switchTab('interview')">去完成一次模拟面试 →</button></div>
    </div>`;
    /* v31：空态撤下能力分布看板，避免残留基线数据 */
    try { if (window.__bpViz && window.__bpViz.removeReportPanel) window.__bpViz.removeReportPanel(); } catch (e) {}
    return;
  }
  // v22：后端在线时由服务端评分引擎生成（规则与前端一致，问答记录落库）；失败回退本地引擎
  let backendPayload = null;
  if (fmApi.backendReady() && session.turns.length) {
    // v22.1 修复：同一会话（interviewId + 轮数 + 匹配分 + 代码分）只同步一次，
    // 反复切到报告页不再重复 POST /sync（访客看 Network 面板不会有重复请求）
    const syncSig = () => [session.interviewId || "", session.turns.length,
                           matchResult ? matchResult.matchScore : "-",
                           typeof session.codeScore === "number" ? session.codeScore : "-"].join(":");
    if (force || syncSig() !== lastSyncSig) {
      /* v30：等待服务端评分期间先铺骨架屏，避免报告区高度抖动 */
      let skel = null;
      if (typeof bpSkeleton === "function") {
        box.innerHTML = "";
        skel = bpSkeleton(box, { rows: 4, cols: 2, height: 14 });
      }
      try {
        backendPayload = await fmApi.syncAndReport(session, matchResult);
        lastSyncSig = syncSig();   // 同步后 interviewId 已生成，签名此刻才稳定
        try { persistSession(); } catch (e) {}   // interviewId 落本地，刷新后仍归属同一会话
      } catch (e) {}
      if (skel) skel.clear();
    }
  }
  let dims, total, evidence, plan, weakest, serverScored = false;
  let narrative = "", scoring = { engine: "deterministic", llm_enriched: false };
  if (backendPayload && backendPayload.dims) {
    dims = backendPayload.dims;
    total = backendPayload.total;
    evidence = backendPayload.evidence || buildEvidence(session.turns);
    plan = backendPayload.plan || [];
    weakest = [...dims].sort((a, b) => a.score - b.score)[0];
    serverScored = true;
    narrative = backendPayload.narrative || "";
    scoring = backendPayload.scoring || scoring;
  } else {
    dims = scoreSession();
    total = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
    evidence = buildEvidence(session.turns);
    const built = buildPlan(dims);
    plan = built.plan;
    weakest = built.weakest;
    scoring = { engine: "heuristic", llm_enriched: false };
  }
  const rewrites = buildSentenceRewrites(session.turns);
  /* v40：Agent 分歧视图——同一份回答由技术面 / HR 面用不同权重独立打分。
   * 服务端已给则用服务端（与 dims 同源），否则本地规则引擎即时计算（规则逐条对齐 scoring.py）。 */
  const lensViews = (backendPayload && backendPayload.agent_views)
    ? backendPayload.agent_views
    : agentLensViews(session.turns);
  /* v40：表达节奏——只读本机语音时间戳，未用语音时给中性说明，不伪造指标 */
  const rhythm = rhythmSummary((session && session.voiceSegments) || []);
  /* v34：面试状态数据（无摄像头时为 null → 区块显示中性提示）。
   * 优先级：服务端 status（有采样）→ 本地 camLastSummary（后台为零但端侧确有数据时兜底，
   * 防止 interview_id 错配或后端瞬时不可达导致数据丢失）→ null。 */
  const camStatus = (backendPayload && backendPayload.status && backendPayload.status.count)
    ? backendPayload.status
    : (typeof camLastSummary === "object" && camLastSummary ? camLastSummary : null);
  lastReportStatus = camStatus;
  /* v36：沉淀报告上下文（供 AI 小助手追问） */
  lastReportData = {
    total, dims, evidence, plan, weakest,
    lensViews, rhythm,
    turns: (session.turns || []).slice(0, 12).map((t) => ({ q: t.question || "", a: t.answer || "" })),
  };
  const suggestions = [...dims].sort((a, b) => a.score - b.score).slice(0, 3)
    .map(d => `「${d.dimension}」${d.score} 分：${d.comment}`);


  const engineBadge = serverScored
    ? (scoring.llm_enriched
        ? ` <span class="tag-engine">确定性引擎 ＋ LLM 增强</span>`
        : ` <span class="tag-engine">确定性引擎（未配置 LLM）</span>`)
    : "";   // v44：标题已标「启发式引擎演示」，不再重复一遍
  const diagnosis = reportDiagnosis(dims);
  box.innerHTML = `
    <div class="report-top">
      <div class="rt-lead">
        <div class="pane-title">📊 评估报告（可解释评分） <span class="tag-demo">${serverScored ? "服务端评分引擎 · 已落库" : "启发式引擎演示"}</span>${engineBadge}</div>
        <p class="hint" style="margin:0">基于本次 ${session.turns.length} 轮真实对话动态生成——每条证据均引用你的回答原话</p>
      </div>
      <div class="report-actions">
        <button class="btn btn-outline btn-sm" onclick="copyReportMarkdown()" title="复制为 Markdown 文本，便于贴进笔记或文档">📋 复制文本</button>
        <button class="btn btn-outline btn-sm" onclick="exportReportCsv()">📊 导出 CSV</button>
        <button class="btn btn-outline btn-sm" onclick="window.print()">🖨 导出 PDF</button>
        <button class="btn btn-outline btn-sm" onclick="shareReport()">🔗 分享报告</button>
        <button class="btn btn-outline btn-sm" onclick="restartInterview()">🔄 再来一次</button>
        <button class="btn btn-outline btn-sm" onclick="askReportFollowup()" title="把本次报告注入 AI 小助手，针对维度与证据追问细节">🤖 追问细节</button>
      </div>
    </div>
    <div class="report-headline tone-${diagnosis.tone}" id="report-headline">
      <div class="rh-total">
        <div class="rh-num" id="report-total" data-count="${total}">${total}</div>
        <div class="rh-cap">综合得分 / 100</div>
      </div>
      <div class="rh-mid">
        <p class="rh-say">${escHtml(diagnosis.say)}</p>
        ${profileStripHtml(dims)}
      </div>
    </div>
    ${renderReportCover()}
    <div class="notice-info">ⓘ ${serverScored
      ? `本报告由<b>服务端确定性评分引擎</b>生成（每条证据引用真实回答，问答记录已写入 SQLite 可跨设备恢复）。${scoring.llm_enriched ? "<b>已接入 LLM</b>：在确定性分数之外额外生成逐维质性点评（分数始终由确定性引擎给出，可解释、不幻觉）。" : "当前服务端未配置 LLM，点评由规则引擎生成；配置后可在确定性分数之外叠加 LLM 质性点评。"}`
      : "本报告由<b>无 API Key 时的兜底规则引擎</b>生成，用于演示「可解释评分」的结构与证据链（每条证据引用真实回答、学习路径按最弱维度动态生成）。"}</div>
    <div class="report-grid" style="margin-top:16px">
      <div><div class="pane-title">能力雷达</div><div id="radar" style="display:grid;place-items:center">${radarSVG(dims, { ref: 70 })}</div>
        <p class="hint radar-legend">实线为本次得分，虚线为目标线 70 分（本产品的达标参考值，非人群统计）</p>
        <table class="sr-only"><caption>各维度得分（满分 100）</caption><thead><tr><th>维度</th><th>得分</th></tr></thead><tbody>${dims.map((d) => `<tr><td>${d.dimension}</td><td>${d.score}</td></tr>`).join("")}</tbody></table>
      </div>
      <div><div class="pane-title">维度得分 <span class="tag-demo">点开看原话</span></div><div id="dims">${(() => {
        /* 分歧是「针对某一段原话」的，不是「针对某个维度」的。
         * 多个维度可能引用同一轮（同一段话同时是深度与结构的证据），
         * 若每张卡都挂一次标记，同一个事实会被说四遍——只在该轮首次出现处标。 */
        const gapMarked = {};
        /* 同一句原话只当一次证据：维度卡按顺序领取，已用过的片段让给后面的维度 */
        const usedEv = new Set();
        return dims
          .map((d, i) => {
            const ev = dimEvidenceFor(d, session.turns, i, usedEv);
            const gap = lensGapFor(lensViews, ev.turn);
            const showGap = gap != null && gap >= 10 && !gapMarked[ev.turn];
            if (showGap) gapMarked[ev.turn] = true;
            return `
        <div class="dim-row${d === weakest ? " lowest" : ""}" data-dim="${i}"
             role="button" tabindex="0" aria-expanded="false"
             onclick="openDimSheet(${i}, this)"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDimSheet(${i}, this);}">
          <div class="dim-head">
            <b>${d.dimension}${d === weakest ? " ⬅ 最弱" : ""}</b>
            ${dimDots(d.score)}
            <span class="dim-score">${d.score}</span>
            ${showGap ? dimGapTag(gap) : ""}
          </div>
          <div class="dim-bar"><div style="width:${d.score}%"></div></div>
          <div class="dim-summary">📎 证据摘要：<q>“${escHtml(ev.digest)}”</q></div>
          <div class="dim-full">
            <div class="dim-comment">${d.comment}</div>
            <div class="dim-tip" role="tooltip">${d.dimension} · ${d.score}<br>${d.comment}</div>
          </div>
          <div class="dim-more">查看完整引用 →</div>
        </div>`;
          })
          .join("");
      })()}</div></div>
    </div>
    ${reportStatusCard(camStatus)}
    ${degradeLogCard(session.degradeLog)}
    ${typeof personaFitCard === "function" ? personaFitCard(dims, typeof activePersona === "function" ? activePersona() : null) : ""}
    ${rhythmCard(rhythm)}
    ${narrative ? `<div class="notice-llm">🧭 教练总评：${esc(narrative)}</div>` : ""}
    <div class="pane-title" style="margin-top:18px">评分证据（引用你的真实回答）</div>
    <div id="evidence">${evidence.map(e => `
      <div class="evidence"><span class="badge badge-brand">${esc(e.agent)}</span><br>
        <q>“${esc(e.quote)}”</q><p>📝 ${esc(e.note)}</p></div>`).join("")}</div>
    ${agentSplitHtml(lensViews)}
    ${rewrites.length ? `<div class="pane-title" style="margin-top:18px">✍️ 句子级改写建议 <span class="tag-demo">规则引擎 · 无需 LLM</span></div>
    <div id="rewrites">${rewrites.map(r => `
      <div class="evidence"><span class="badge badge-amber rw-dim">${r.dimension}</span><q>“${esc(r.original)}”</q><p>✍️ ${esc(r.advice)}</p></div>`).join("")}</div>` : ""}
    <div class="report-grid" style="margin-top:14px">
      <div>
        <div class="pane-title">改进建议</div>
        <ul id="suggestions" style="padding-left:18px;font-size:13.5px;color:var(--muted);line-height:2">${suggestions.map(s => `<li>${s}</li>`).join("")}</ul>
      </div>
      <div>
        <div class="pane-title">7 天学习路径（按最弱维度动态生成）</div>
        <div class="plan-banner">因你在【${weakest.dimension}】得分最低（${weakest.score} 分），Day 1-3 已为你安排专项训练</div>
        <div id="plan" class="plan-list">${plan.map((p, i) => `
          <div class="plan-day" data-day="${i}"><b>${p.day}</b><span>${p.task}</span></div>`).join("")}</div>
        <button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="switchTab('plan')" title="把本路径导入学习计划板块：每日任务 + 时间分配 + 完成打卡">进入学习计划板块（每日任务 + 时间分配 + 打卡）→</button>
      </div>
    </div>
    <div class="history card" style="padding:14px 16px">
      <div class="pane-title" style="margin-bottom:4px">📈 历史进步曲线 <span class="tag-demo">localStorage 本地存储</span></div>
      <div id="history-box"></div>
    </div>
    ${reportFollowupCard()}
    ${reviewEntryCard()}`;

  // v27：全站交互层——总分滚动 + 维度条生长（reduced-motion 下静态落位）
  try { if (window.__bpApp && window.__bpApp.reportIn) window.__bpApp.reportIn(); } catch (e) {}
  // v40：报告逐块流式入场（DOM 一次成型，仅控制呈现节奏，不影响复制/打印/读取）
  try { streamReportBlocks(box); } catch (e) {}

  // 历史记录（同一会话不重复写入）
  const sig = total + ":" + session.turns.length;
  if (sig !== lastReportSig || force) {
    lastReportSig = sig;
    const history = store.get("fm_history", []);
    const last = history[history.length - 1];
    if (!last || last.total !== total || last.turns !== session.turns.length) {
      history.push({ date: new Date().toLocaleDateString("zh-CN"), total, turns: session.turns.length });
      store.set("fm_history", history.slice(-8), true);
    }
  }
  const history = store.get("fm_history", []);
  $("history-box").innerHTML = history.length >= 2
    ? `<div style="display:grid;place-items:center">${historySVG(history)}</div>
       <p class="hint" style="text-align:center">共 ${history.length} 次模拟记录：${history.map(h => h.total).join(" → ")}</p>`
    : `<p class="hint">已完成 1 次模拟。再完成一次面试（可换模式），即可查看进步曲线对比。</p>`;

  // v10：总分旁显示「较上次」变化（历史最后一条为本次，倒数第二条为上次）
  if (history.length >= 2) {
    const prev = history[history.length - 2].total;
    const diff = total - prev;
    const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "—";
    const color = diff > 0 ? "var(--green)" : diff < 0 ? "var(--red)" : "var(--faint)";
    const anchor = box.querySelector("#report-total");
    if (anchor) {
      anchor.insertAdjacentHTML("afterend",
        `<div style="font-size:13px;color:${color};margin-top:2px" id="report-diff">${arrow} 较上次 ${diff > 0 ? "+" : ""}${diff} 分</div>`);
    }
  }

  /* v31：能力分布看板随本次报告数据刷新（此前只在开机装配一次，
   * 面试后仍显示「基线数据 · 完成面试后转为真实分布」，用户看不到自己的分布）。
   * v31.3：注入真实 dims，使看板雷达/热力/散点与主雷达同源（修复「看板数据与上面不一致」） */
  try { if (window.__bpViz && window.__bpViz.refreshReportPanel) window.__bpViz.refreshReportPanel({ dims: dims, turns: session.turns.length }); } catch (e) {}

  /* v42：给每张维度卡挂上证据上下文（供底部面板读取，不新增全局 id） */
  try {
    /* 与维度卡同一套去重顺序：面板里看到的引用必须和卡上那句一致 */
    const usedEv = new Set();
    lastDimEvidence = dims.map((d, i) => dimEvidenceFor(d, session.turns, i, usedEv));
  } catch (e) { lastDimEvidence = []; }
}

/* ============================================================
 * v42 · 报告渐进披露：卡片 → 底部半屏面板
 *   手机上把桌面端的完整报告直接塞进来 = 一屏看不完的表格。
 *   卡片只给「维度 + 分数 + 一句证据摘要」，点开才是原话引用、
 *   评分理由与「定位到对话」——三秒内形成记忆锚点，也不跳走。
 * ============================================================ */
let lastDimEvidence = [];
let dimSheetEl = null;
let dimSheetIdx = -1; // v45：当前挂着的维度，连点同一张卡不重复装配

/* v45：按压确认——先把手上的「已按下」画出来，再谈装配。
 * 这一笔必须在事件处理函数的第一行发生：低端机上 DOM 重建要几十毫秒，
 * 若等重建完才变色，访客会以为没点中而再点一次。 */
function markTap(el) {
  try {
    if (!el || !el.classList) return;
    el.classList.add("tapped");
    setTimeout(function () {
      try { el.classList.remove("tapped"); } catch (e) {}
    }, 180);
  } catch (e) {}
}

/**
 * 每个维度「最该引用哪一轮回答」。
 * 不这么做的话，五个维度都会挑中最长的那一轮——报告看起来像只有一段话，
 * 五条证据全指向同一处，反而削弱了「每条评分都有出处」的说服力。
 * @param {object} t 轮次对象
 * @param {string} key 维度 key
 * @returns {number} 相关度（越大越该被引用）
 */
function turnRelevance(t, key) {
  const a = String((t && t.answer) || "");
  const digits = (a.match(/\d/g) || []).length;
  const skills = (typeof SKILL_DICT !== "undefined" ? SKILL_DICT : []).filter((s) => a.includes(s)).length;
  const star = (a.match(/背景|目标|负责|通过|最终|结果|因此|于是/g) || []).length;
  const filler = (a.match(/然后|那个|就是/g) || []).length;
  const len = a.length;
  if (key === "depth") return digits * 2 + skills * 2 + Math.min(6, len / 60);
  if (key === "logic") return star * 3 + Math.min(4, len / 120);
  if (key === "expression") return Math.min(6, len / 50) - filler * 2;
  if (key === "fit") return skills * 2 + digits;
  /* 抗压维度优先引用压力轮；没有压力轮时，短回答更能暴露临场状态 */
  if (key === "stress") return (t && t.mode === "pressure" ? 8 : 0) + (len < 70 ? 1.5 : 0);
  return 0;
}

/**
 * 为某个维度挑一句「代表证据」：优先该维度关心的锚点类型，
 * 找不到就诚实退回「回答开头片段」，不凭空编造引用。
 * @param {object} d 维度对象
 * @param {Array<object>} turns 面试轮次
 * @param {number} dimIdx 维度序号
 * @returns {{quote:string, turn:number, from:string, note:string}}
 */
function dimEvidenceFor(d, turns, dimIdx, used) {
  const list = Array.isArray(turns) ? turns : [];
  const kindByDim = { depth: "metric", logic: "action", expression: "skill", fit: "skill", stress: "action" };
  const want = kindByDim[d && d.key] || "skill";
  const key = (d && d.key) || "";
  const taken = used && typeof used.has === "function" ? used : null;
  const pool = [];
  list.forEach((t, ti) => {
    const answer = String(t.answer || "");
    const anchors = (t.anchors && t.anchors.length) ? t.anchors : anchorPhrases(answer);
    const rel = turnRelevance(t, key);
    const push = (text, kind) =>
      pool.push({ text, kind, turn: ti + 1, answer, note: t.notes || "", match: kind === want ? 1 : 0, rel });
    anchors.forEach(a => push(a.text, a.kind));
    /* 这一轮没有任何可锚定片段（比如压力轮全是短句与判断）时，
     * 仍保留一个「开头片段」备选——否则最该被证据化的那一轮反而引用不到。 */
    if (!anchors.length && answer) push(answer.slice(0, 24), "opening");
  });
  if (pool.length) {
    /* 先取与本维度最相关的那一轮，再看锚点类型是否对口，最后取信息量更足的片段。
     * 已经在上一个维度用过的片段排到最后——五个维度都引用同一句会让「每条评分都有出处」
     * 变成「五条评分都出自同一句」，反而削弱证据感；实在没有第二句时才复用。 */
    const fresh = (x) => (taken && taken.has(x.text) ? 1 : 0);
    const best = pool
      .slice()
      .sort((a, b) => fresh(a) - fresh(b) || b.rel - a.rel || b.match - a.match || b.text.length - a.text.length)[0];
    if (taken) taken.add(best.text);
    return {
      quote: clipWindow(best.answer, best.text, 28),
      digest: clipWindow(best.answer, best.text, 10),
      turn: best.turn,
      from: best.kind === "opening" ? "开头片段" : best.kind === want ? "锚点" : "同轮片段",
      note: best.note,
    };
  }
  const first = list[0];
  const raw = String((first && first.answer) || "").replace(/\s+/g, " ").trim();
  return {
    quote: raw.length > 48 ? raw.slice(0, 48) + "…" : raw,
    digest: raw.length > 26 ? raw.slice(0, 26) + "…" : raw,
    turn: 1,
    from: "开头片段",
    note: (first && first.notes) || "",
  };
}

/** 截取「锚点前后一段」作为引用，前后用省略号标注截断位置 */
function clipWindow(answer, needle, pad) {
  const src = String(answer || "");
  const i = src.indexOf(needle);
  if (i < 0 || !needle) return needle;
  const s = Math.max(0, i - pad);
  const e = Math.min(src.length, i + needle.length + pad * 2);
  return (s > 0 ? "…" : "") + src.slice(s, e) + (e < src.length ? "…" : "");
}

/** 底部半屏面板：顶部是引用原话，下方是评分理由 + 定位到对话 */
function dimSheetHtml(idx) {
  const d = (lastReportData && lastReportData.dims || [])[idx];
  if (!d) return "";
  const ev = (lastDimEvidence && lastDimEvidence[idx]) || { quote: "", turn: 1, from: "", note: "" };
  const views = (lastReportData && lastReportData.lensViews) || { items: [] };
  const lv = (views.items && views.items[ev.turn - 1]) || null;
  const signals = lv ? lv.tech.signals.concat(lv.hr.signals) : [];
  const uniq = [];
  signals.forEach(s => { if (uniq.indexOf(s) < 0) uniq.push(s); });
  const lvTag = lv
    ? `<span class="sh-lv ${gapLevel(lv.gap).cls}">跨角色分歧 ${lv.gap} 分 · ${gapLevel(lv.gap).label}</span>`
    : "";
  return `<div class="sheet-mask" onclick="closeDimSheet()"></div>
    <div class="sheet-panel" role="dialog" aria-modal="true" aria-label="${escHtml(d.dimension)}评分详情">
      <div class="sheet-head">
        <div>
          <div class="sheet-dim">${escHtml(d.dimension)}</div>
          <div class="sheet-sub">第 ${ev.turn} 轮回答 · ${escHtml(ev.from)}${lvTag ? " · " + lvTag : ""}</div>
        </div>
        <button class="sheet-close" onclick="closeDimSheet()" aria-label="关闭">×</button>
      </div>
      <div class="sheet-scroll">
      <div class="ev-unit">
        <div class="sheet-quote">
          <div class="sq-lead">📌 引用你的原话</div>
          <q>“${escHtml(ev.quote)}”</q>
        </div>
        <div class="sh-label ev-label">评分理由 · 由上句得出</div>
        <p class="sh-reason">${escHtml(d.comment)}</p>
      </div>
      <div class="sheet-body">
        ${lv ? `<div class="sh-label">两位面试官的判断</div>
        <div class="sh-lens">
          <div class="sh-lens-row"><span class="sl-who">⚙️ 技术面</span><b>${lv.tech.score}</b><span class="sl-why">${escHtml(lv.tech.reason)}</span></div>
          <div class="sh-lens-row"><span class="sl-who">💼 HR 面</span><b>${lv.hr.score}</b><span class="sl-why">${escHtml(lv.hr.reason)}</span></div>
        </div>` : ""}
        ${uniq.length ? `<div class="sh-label">命中信号</div><div class="sh-signals">${uniq.map(s => `<span>${escHtml(s)}</span>`).join("")}</div>` : ""}
      </div>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-primary btn-sm" onclick="gotoTurn(${ev.turn - 1})">📍 定位到对话</button>
        <button class="btn btn-outline btn-sm" onclick="closeDimSheet()">关闭</button>
      </div>
    </div>`;
}

/* v45：先挂一个「轻壳」（遮罩 + 面板 + 维度名 + 占位行），同帧就能出现；
 * 原话与理由这些真正要算的内容，推到下一个任务里填。
 * 只做「整块推迟」的话，按下态是快了，但面板要晚一帧才出现——
 * 实测（10 倍降速）里点击总时长反而从 104ms 涨到 144ms。壳与内容分开才是两头都要。 */
function mountDimSheetShell(idx) {
  const host = document.body;
  if (!host) return;
  const d = (lastReportData && lastReportData.dims || [])[idx] || {};
  if (!dimSheetEl) {
    dimSheetEl = document.createElement("div");
    dimSheetEl.className = "sheet";
    host.appendChild(dimSheetEl);
  }
  dimSheetEl.innerHTML = `<div class="sheet-mask" onclick="closeDimSheet()"></div>
    <div class="sheet-panel" role="dialog" aria-modal="true" aria-label="${escHtml(d.dimension || "评分详情")}">
      <div class="sheet-head">
        <div>
          <div class="sheet-dim">${escHtml(d.dimension || "评分详情")}</div>
          <div class="sheet-sub">正在取这一段回答的原话…</div>
        </div>
        <button class="sheet-close" onclick="closeDimSheet()" aria-label="关闭">×</button>
      </div>
      <div class="sheet-body"><div class="sheet-ghost"><i></i><i></i><i></i></div></div>
    </div>`;
  dimSheetEl.hidden = false;
  document.documentElement.classList.add("sheet-open");
  const panel = dimSheetEl.querySelector(".sheet-panel");
  if (panel && typeof panel.focus === "function") {
    panel.setAttribute("tabindex", "-1");
    panel.focus({ preventScroll: true });
  }
}

/** 填充真实内容（引用 / 理由 / 双方判断），在壳出现后的下一个任务里执行 */
function fillDimSheet(idx) {
  if (!dimSheetEl || dimSheetEl.hidden || dimSheetIdx !== idx) return;
  dimSheetEl.innerHTML = dimSheetHtml(idx);
}

function openDimSheet(idx, trigger) {
  const host = document.body;
  if (!host) return;
  /* v45：第一件事是给出按压确认，而不是先去拼 DOM */
  markTap(trigger);
  /* 桌面端不需要浮层：行内本来就是完整的，点击只做展开/收起 */
  let narrow = false;
  try { narrow = !!(window.matchMedia && window.matchMedia("(max-width: 640px)").matches); } catch (e) {}
  if (!narrow) {
    const row = document.querySelector('.dim-row[data-dim="' + idx + '"]');
    if (row) {
      const on = row.classList.toggle("expanded");
      row.setAttribute("aria-expanded", on ? "true" : "false");
      const more = row.querySelector(".dim-more");
      if (more) more.textContent = on ? "收起完整证据 ⌃" : "查看完整引用 →";
    }
    return;
  }
  /* 同一张卡连点：面板已经在就不重装，免得重建造成闪一下 */
  if (dimSheetEl && !dimSheetEl.hidden && dimSheetIdx === idx) return;
  dimSheetIdx = idx;
  /* ① 壳：同步、极轻，这一帧就能看到面板出现（不是先黑一下再弹） */
  mountDimSheetShell(idx);
  /* ② 内容：让出一帧再填，输入帧里不夹带 innerHTML 重活 */
  try {
    yieldToMain().then(function () {
      fillDimSheet(idx);
    });
  } catch (e) {
    fillDimSheet(idx);
  }
}

function closeDimSheet() {
  if (dimSheetEl) { dimSheetEl.hidden = true; dimSheetEl.innerHTML = ""; }
  dimSheetIdx = -1;
  document.documentElement.classList.remove("sheet-open");
}

/** 从报告跳回面试对话，并高亮对应轮次（用 data-turn 对齐，不依赖渲染顺序） */
function gotoTurn(turnIdx) {
  closeDimSheet();
  try { if (typeof navTo === "function") navTo("interview"); else if (typeof switchTab === "function") switchTab("interview"); } catch (e) {}
  const jump = () => {
    try {
      const nodes = document.querySelectorAll('#chat-body .msg[data-turn="' + turnIdx + '"]');
      const target = nodes.length ? nodes[nodes.length - 1] : null;
      if (!target) return;
      if (typeof target.scrollIntoView === "function") target.scrollIntoView({ block: "center" });
      target.classList.remove("pulse");
      void target.offsetWidth;
      target.classList.add("pulse");
    } catch (e) { /* 无布局环境跳过 */ }
  };
  try { requestAnimationFrame(() => setTimeout(jump, 140)); } catch (e) { setTimeout(jump, 160); }
}

/** Esc 关闭底部面板（移动端主要是「返回手势」，桌面端才是 Esc） */
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && dimSheetEl && !dimSheetEl.hidden) closeDimSheet();
});

