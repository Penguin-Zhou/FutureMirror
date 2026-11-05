/* 评分规则的浏览器端实现 —— 与 backend/app/scoring.py 逐条对应。
   本文件的每条公式旁标注了 Python 源码行号，改动任何一侧都必须同步对拍：
   node scripts/check-scoring-method.js（用同一批样本跑 Python 与 JS，逐项比较） */

export const SKILL_DICT = [
  "React",
  "Vue",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "C++",
  "SQL",
  "MySQL",
  "Redis",
  "Docker",
  "Kubernetes",
  "Git",
  "Linux",
  "机器学习",
  "深度学习",
  "PyTorch",
  "TensorFlow",
  "LLM",
  "RAG",
  "Prompt",
  "Agent",
  "Next.js",
  "Tailwind",
  "Figma",
  "产品设计",
  "项目管理",
  "数据分析",
  "消息队列",
  "Kafka",
];

export const DIM_DEFS = [
  { key: "depth", name: "内容深度", py: "171–174" },
  { key: "logic", name: "结构逻辑", py: "175" },
  { key: "expression", name: "语言表达", py: "176" },
  { key: "fit", name: "岗位匹配", py: "177–180" },
  { key: "stress", name: "抗压表现", py: "181–182" },
];

// scoring.py:27 `_clamp` —— 半价向上（floor(v+0.5)），区间 [30, 96]。
// Python 内置 round() 是银行家舍入，JS Math.round 是半价向上，双引擎曾在 .5 边界差 1 分，
// 因此两侧都显式用「加 0.5 再取整」，而不是各自语言的 round。
export function clamp(v) {
  return Math.max(30, Math.min(96, Math.floor(v + 0.5)));
}

export const METRIC_RE = /[\d.]+\s*(?:%|qps|QPS|ms|毫秒|万|亿|倍|人日|人|天|小时|分钟|秒|GB|MB|TB|核|台)/g;
export const ACTION_RE = /(?:负责|实现|搭建|优化|设计|主导|重构|上线|接入|迁移|排查|压测)[^，。；、,.;!?！？\s]{0,8}/g;
export const COLLAB_RE = /(?:协作|沟通|推动|协调|带队|配合|汇报|对齐)[^，。；、,.;!?！？\s]{0,6}/g;

function allMatches(text, re) {
  const out = [];
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m;
  while ((m = r.exec(text)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    if (m[0].length === 0) r.lastIndex++;
  }
  return out;
}

// scoring.py:44 `_anchor_candidates`
function anchorCandidates(text) {
  const out = [];
  for (const s of [...SKILL_DICT].sort((a, b) => b.length - a.length)) {
    let i = text.indexOf(s);
    while (i >= 0) {
      out.push({ start: i, end: i + s.length, kind: "skill", weight: 3 });
      i = text.indexOf(s, i + 1);
    }
  }
  for (const m of allMatches(text, METRIC_RE)) {
    if (m.text.trim().length >= 2) out.push({ start: m.start, end: m.end, kind: "metric", weight: 2 });
  }
  for (const re of [ACTION_RE, COLLAB_RE]) {
    for (const m of allMatches(text, re)) {
      if (m.text.length >= 3) out.push({ start: m.start, end: m.end, kind: "action", weight: 1 });
    }
  }
  return out;
}

// scoring.py:61 `anchor_phrases` —— 技术名词 > 量化 > 动作，去重叠，最多 3 个，按出现位置排序
export function anchorPhrases(text) {
  const src = text || "";
  if (!src.trim()) return [];
  const cands = anchorCandidates(src).sort((a, b) => b.weight - a.weight || b.end - b.start - (a.end - a.start));
  let kept = [];
  for (const c of cands) {
    if (kept.some((k) => c.start < k.end && k.start < c.end)) continue;
    kept.push(c);
    if (kept.length >= 6) break;
  }
  kept = kept.slice(0, 3).sort((a, b) => a.start - b.start);
  return kept.map((c) => ({
    start: c.start,
    end: c.end,
    text: src.slice(c.start, c.end),
    kind: c.kind,
    weight: c.weight,
  }));
}

const countRe = (t, re) => (t.match(new RegExp(re.source, "g")) || []).length;

// scoring.py:79 `_lens_features`
export function lensFeatures(text) {
  const t = text || "";
  return {
    len: t.length,
    digits: countRe(t, /\d/),
    skills: SKILL_DICT.filter((s) => t.includes(s)).length,
    principle: countRe(t, /原理|机制|一致性|索引|并发|缓存|锁|架构|协议|复杂度|算法|事务|幂等|超时|重试|链路/),
    tradeoff: countRe(t, /权衡|取舍|对比|相比|替代|因为|代价|成本|降级|兜底/),
    star: countRe(t, /背景|目标|负责|通过|最终|结果|因此|于是/),
    collab: countRe(t, /团队|协作|沟通|推动|协调|配合|对接|复盘/),
    motive: countRe(t, /为什么|成长|学习|规划|价值|兴趣|选择/),
    filler: countRe(t, /然后|那个|就是/),
  };
}

// scoring.py:94 `lens_score` —— 同一份回答，技术面与 HR 面用不同权重独立打分
export function lensScore(answer, lens) {
  const f = lensFeatures(answer);
  const lenBonus = Math.min(6, Math.floor(f.len / 80));
  let score;
  if (lens === "tech") {
    score = clamp(
      40 +
        Math.min(18, f.skills * 6) +
        Math.min(14, f.digits * 2) +
        Math.min(12, f.principle * 4) +
        Math.min(8, f.tradeoff * 3) +
        lenBonus -
        Math.min(8, f.filler * 2)
    );
  } else {
    score = clamp(
      42 +
        Math.min(14, f.star * 4) +
        Math.min(14, f.collab * 6) +
        Math.min(10, f.motive * 4) +
        Math.min(6, f.digits) +
        lenBonus -
        Math.min(10, f.filler * 3)
    );
  }
  return { score, features: f };
}

// scoring.py:158 `score_session` 的特征统计部分
export function featurize(turns) {
  const allText = turns.map((t) => t.answer || "").join("\n");
  return {
    digits: countRe(allText, /\d/),
    techHits: SKILL_DICT.filter((s) => allText.includes(s)).length,
    filler: countRe(allText, /然后|那个|就是/),
    starHits: countRe(allText, /背景|目标|负责|通过|最终|结果|因此|于是/),
    defensive: countRe(allText, /不是我的|跟我没关系|但是|我没有/),
    shortAnswers: turns.filter((t) => (t.answer || "").length < 40).length,
    pressureTurns: turns.filter((t) => t.mode === "pressure").length,
    turns: turns.length,
  };
}

// 逐维度公式：返回分数与每个分项的实际贡献，供页面展开「这一分是怎么来的」
export function dimBreakdown(f, opts = {}) {
  const { matchScore = null, codeScore = null } = opts;
  const depthBase = 48 + Math.min(22, f.digits * 2.2) + Math.min(18, f.techHits * 2.5) + (f.turns >= 4 ? 8 : 0);
  const depth = codeScore === null ? clamp(depthBase) : clamp(depthBase * 0.8 + codeScore * 100 * 0.2);
  const logic = clamp(46 + Math.min(30, f.starHits * 4) + (f.turns >= 3 ? 8 : 0));
  const expression = clamp(88 - Math.min(24, f.filler * 5) - f.shortAnswers * 4);
  const fit =
    matchScore === null
      ? clamp(55 + Math.min(20, f.techHits * 2))
      : clamp(52 + matchScore * 0.4 + Math.min(10, f.techHits));
  const stress = 72 - Math.min(20, f.defensive * 6) - (f.pressureTurns > 0 ? Math.min(12, f.shortAnswers * 3) : 6);
  return [
    {
      key: "depth",
      name: "内容深度",
      score: depth,
      py: "171–174",
      formula: "48 + min(22, 数字×2.2) + min(18, 技术名词×2.5) + (轮次≥4 ? 8 : 0)",
      parts: [
        { label: "基数", value: 48, raw: 48 },
        { label: `量化数字 ${f.digits} 个 × 2.2（上限 22）`, value: Math.min(22, f.digits * 2.2), raw: f.digits * 2.2 },
        {
          label: `技术名词 ${f.techHits} 个 × 2.5（上限 18）`,
          value: Math.min(18, f.techHits * 2.5),
          raw: f.techHits * 2.5,
        },
        { label: f.turns >= 4 ? "轮次 ≥ 4 加分" : "轮次不足 4，无加分", value: f.turns >= 4 ? 8 : 0, raw: 0 },
      ],
    },
    {
      key: "logic",
      name: "结构逻辑",
      score: logic,
      py: "175",
      formula: "46 + min(30, STAR 线索×4) + (轮次≥3 ? 8 : 0)",
      parts: [
        { label: "基数", value: 46, raw: 46 },
        {
          label: `STAR 线索 ${f.starHits} 处 × 4（上限 30）`,
          value: Math.min(30, f.starHits * 4),
          raw: f.starHits * 4,
        },
        { label: f.turns >= 3 ? "轮次 ≥ 3 加分" : "轮次不足 3，无加分", value: f.turns >= 3 ? 8 : 0, raw: 0 },
      ],
    },
    {
      key: "expression",
      name: "语言表达",
      score: expression,
      py: "176",
      formula: "88 − min(24, 口头禅×5) − 短答轮数×4",
      parts: [
        { label: "基数", value: 88, raw: 88 },
        { label: `口头禅 ${f.filler} 处 × 5（上限 24）`, value: -Math.min(24, f.filler * 5), raw: 0 },
        { label: `短答（<40 字）${f.shortAnswers} 轮 × 4`, value: -f.shortAnswers * 4, raw: 0 },
      ],
    },
    {
      key: "fit",
      name: "岗位匹配",
      score: fit,
      py: "177–180",
      formula:
        matchScore === null ? "55 + min(20, 技术名词×2)　（无匹配报告时）" : "52 + 匹配分×0.4 + min(10, 技术名词)",
      parts:
        matchScore === null
          ? [
              { label: "基数", value: 55, raw: 55 },
              {
                label: `技术名词 ${f.techHits} 个 × 2（上限 20）`,
                value: Math.min(20, f.techHits * 2),
                raw: f.techHits * 2,
              },
            ]
          : [
              { label: "基数", value: 52, raw: 52 },
              { label: `匹配分 ${matchScore} × 0.4`, value: matchScore * 0.4, raw: 0 },
              { label: `技术名词 ${f.techHits} 个（上限 10）`, value: Math.min(10, f.techHits), raw: 0 },
            ],
    },
    {
      key: "stress",
      name: "抗压表现",
      score: clamp(stress),
      py: "181–182",
      formula: "72 − min(20, 防御性表述×6) − (有压力面 ? min(12, 短答×3) : 6)",
      parts: [
        { label: "基数", value: 72, raw: 72 },
        { label: `防御性表述 ${f.defensive} 处 × 6（上限 20）`, value: -Math.min(20, f.defensive * 6), raw: 0 },
        {
          label: f.pressureTurns > 0 ? `压力面短答 ${f.shortAnswers} 轮 × 3（上限 12）` : "无压力面轮次，固定扣 6",
          value: -(f.pressureTurns > 0 ? Math.min(12, f.shortAnswers * 3) : 6),
          raw: 0,
        },
      ],
    },
  ];
}

// scoring.py:158 `score_session` 的汇总部分
export function scoreSession(turns, opts = {}) {
  const f = featurize(turns);
  const dims = dimBreakdown(f, opts);
  const total = Math.floor(dims.reduce((a, d) => a + d.score, 0) / dims.length + 0.5);
  const weakest = dims.reduce((a, d) => (d.score < a.score ? d : a), dims[0]);
  return { features: f, dims, total, weakest };
}

export const SAMPLE_ANSWERS = [
  {
    id: "weak",
    tag: "只有结论",
    text: "我优化了系统性能，效果还不错，团队配合也挺好。然后那个就是整体上来说比较顺利，后面还会继续改进。",
  },
  {
    id: "mid",
    tag: "有事实无量化",
    text: "我负责了协同白板这个项目，主要实现实时同步模块，用 Redis 做广播，解决了多人编辑的冲突问题。团队一共 4 个人，我推动了对齐节奏。",
  },
  {
    id: "strong",
    tag: "量化 + 机制 + 取舍",
    text: "我负责协同白板的实时同步，用 Redis 的 pub/sub 做广播，本地再做一次操作合并，解决了多人同时编辑的冲突。首屏从 3.2s 降到 1.1s，P95 延迟 120ms，支撑 50 人同时在线。之所以没选 WebSocket 全量广播，是因为代价是带宽随人数平方增长，我们对比后选了增量下发。",
  },
];
