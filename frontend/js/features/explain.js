"use strict";
/* ============================================================
 * v40 · 可解释性交互层（锚点 / 双镜头评分 / 表达节奏）
 *   - 锚点：从回答原文定位「触发追问的片段」，面试进行中就高亮
 *   - 双镜头：同一份回答由技术面与 HR 面用不同权重独立打分
 *   - 节奏：基于语音转写时间戳的语速 / 停顿 / 口头禅密度
 *   三条约束：① 纯确定性规则，无模型也能跑；② 不含 HTML 注入
 *   （所有文本过 escHtml）；③ 不新增全局 id，只用 class。
 * ============================================================ */

/* ---------------- 1. 锚点提取 ---------------- */

/** 量化指标：数字 + 单位（QPS / ms / % / 倍 / 万…） */
const ANCHOR_METRIC_RE = /[\d.]+\s*(?:%|qps|QPS|ms|毫秒|万|亿|倍|人日|人|天|小时|分钟|秒|GB|MB|TB|核|台)/g;
/** 动作短语：动词 + 宾语（负责/实现/优化…最多 8 字） */
const ANCHOR_ACTION_RE = /(?:负责|实现|搭建|优化|设计|主导|重构|上线|接入|迁移|排查|压测)[^，。；、,.;!?！？\s]{0,8}/g;
/** 协作线索（HR 镜头关注的证据） */
const ANCHOR_COLLAB_RE = /(?:协作|沟通|推动|协调|带队|配合|汇报|对齐)[^，。；、,.;!?！？\s]{0,6}/g;

/** 收集所有候选区间（可能重叠，后续统一裁剪） */
function anchorCandidates(text) {
  const src = String(text || "");
  const out = [];
  const skills = (typeof SKILL_DICT !== "undefined" ? SKILL_DICT : [])
    .slice()
    .sort((a, b) => b.length - a.length);
  // 技术名词：长词优先，避免 "Java" 命中 "JavaScript" 的内部
  for (const s of skills) {
    let i = src.indexOf(s);
    while (i >= 0) {
      out.push({ start: i, end: i + s.length, kind: "skill", weight: 3 });
      i = src.indexOf(s, i + 1);
    }
  }
  for (const m of src.matchAll(ANCHOR_METRIC_RE)) {
    if (m[0].trim().length >= 2) out.push({ start: m.index, end: m.index + m[0].length, kind: "metric", weight: 2 });
  }
  for (const re of [ANCHOR_ACTION_RE, ANCHOR_COLLAB_RE]) {
    for (const m of src.matchAll(re)) {
      if (m[0].length >= 3) out.push({ start: m.index, end: m.index + m[0].length, kind: "action", weight: 1 });
    }
  }
  return out;
}

/**
 * 提取一段回答里的「可锚定片段」。
 * 规则：技术名词 > 量化指标 > 动作短语；重叠时保留权重更高 / 更长者；最多 3 个。
 * @param {string} text 用户回答原文
 * @returns {Array<{start:number,end:number,text:string,kind:string,weight:number,label:string}>}
 */
function anchorPhrases(text) {
  const src = String(text || "");
  if (!src.trim()) return [];
  const cands = anchorCandidates(src).sort((a, b) => b.weight - a.weight || b.end - b.start - (a.end - a.start));
  const kept = [];
  for (const c of cands) {
    if (kept.some((k) => c.start < k.end && k.start < c.end)) continue;   // 有重叠则丢弃
    kept.push(c);
    if (kept.length >= 6) break;
  }
  return kept
    .slice(0, 3)
    .sort((a, b) => a.start - b.start)
    .map((c) => ({
      start: c.start,
      end: c.end,
      text: src.slice(c.start, c.end),
      kind: c.kind,
      weight: c.weight,
      label: c.kind === "skill" ? "技术点" : c.kind === "metric" ? "量化" : "动作",
    }));
}

/** 把原文渲染为「带锚点高亮」的 HTML（逐段 escHtml，不拼接未转义文本） */
function anchorHtml(text, anchors) {
  const src = String(text || "");
  const list = (anchors || []).slice().sort((a, b) => a.start - b.start);
  if (!list.length) return escHtml(src);
  let html = "", cur = 0;
  for (const a of list) {
    if (a.start < cur || a.end > src.length) continue;
    html += escHtml(src.slice(cur, a.start));
    html += `<mark class="anchor-hl k-${a.kind}" data-anchor="${escHtml(a.text)}">${escHtml(a.text)}</mark>`;
    cur = a.end;
  }
  return html + escHtml(src.slice(cur));
}

/** 锚点条：面试进行中就告诉用户「AI 盯上了哪句话」 */
function anchorStripHtml(anchors, turnIdx) {
  if (!anchors || !anchors.length) return "";
  const chips = anchors
    .map(
      (a, i) =>
        `<button type="button" class="anchor-chip k-${a.kind}" data-turn="${turnIdx}" data-idx="${i}" ` +
        `data-anchor="${escHtml(a.text)}" ` +
        `onclick="focusAnchor(this)" title="${escHtml(a.label)}：追问将基于这句原话">` +
        `<span class="anchor-kind">${escHtml(a.label)}</span>${escHtml(a.text)}</button>`
    )
    .join("");
  return `<div class="anchor-strip" data-turn="${turnIdx}"><span class="anchor-lead">⚓ 可追问锚点</span>${chips}</div>`;
}

/** 点击锚点 chip → 同一气泡内对应标记脉冲一次（视觉上「指回去」） */
function focusAnchor(btn) {
  if (!btn) return;
  const bubble = btn.closest(".msg");
  if (!bubble) return;
  const raw = btn.dataset.anchor || "";
  // jsdom / 旧浏览器可能没有 CSS.escape：退化为「去引号 + 直接拼接」，锚点文本不含引号时等价
  let sel;
  try {
    sel = window.CSS && window.CSS.escape
      ? `.anchor-hl[data-anchor="${window.CSS.escape(raw)}"]`
      : `.anchor-hl[data-anchor="${raw.replace(/["\\]/g, "")}"]`;
  } catch (e) {
    return;
  }
  const mark = bubble.querySelector(sel);
  if (!mark) return;
  mark.classList.remove("pulse");
  void mark.offsetWidth;   // 强制重排以重启动画
  mark.classList.add("pulse");
}

/**
 * v42：追问气泡「上方」的锚定标签。
 * 桌面端与移动端都能看到——它不是装饰，而是把「AI 此刻依据哪句原话在追问」摊开给用户看。
 * 未落题前不假装知道模型会问什么，只说明观察员已定位了几个锚点。
 * @param {string[]} hits 已命中的原话片段（空数组表示尚未落题/未命中）
 * @param {number} count 本轮定位到的锚点总数
 */
function anchorRefTagHtml(hits, count) {
  const list = (hits || []).filter(Boolean);
  if (!list.length) {
    const n = Number(count) || 0;
    const lead = n
      ? `观察员已定位 ${n} 个可追问锚点 · 等待面试官落题`
      : "本轮未定位到可追问锚点 · 观察员继续收集证据";
    return `<div class="anchor-ref-tag pending"><span class="art-lead">⚓</span><span class="art-text">${escHtml(lead)}</span></div>`;
  }
  const quoted = list.slice(0, 2).map((h) => `「${escHtml(h)}」`).join("");
  return `<div class="anchor-ref-tag"><span class="art-lead">⚓</span>` +
    `<span class="art-text">基于你提到的${quoted}发起追问</span></div>`;
}

/**
 * 在指定气泡之前插入锚定标签容器（返回容器，便于后续更新状态）。
 * @param {HTMLElement|null} bubble 参考气泡（null 时追加到容器末尾）
 * @param {HTMLElement} host 聊天容器
 */
function openAnchorRefTag(host, bubble, count) {
  if (!host || typeof host.insertBefore !== "function") return null;
  const wrap = document.createElement("div");
  wrap.className = "anchor-ref-host";
  wrap.innerHTML = anchorRefTagHtml([], count);
  try {
    if (bubble) host.insertBefore(wrap, bubble);
    else host.appendChild(wrap);
  } catch (e) { return null; }
  return wrap;
}

/** 更新锚定标签：落题后按「是否真的复述了原话」给出正向锚定或诚实降级 */
function updateAnchorRefTag(wrap, hits, count) {
  if (!wrap) return;
  wrap.innerHTML = anchorRefTagHtml(hits, count);
}

/**
 * 追问气泡落定后，标出「这次追问锚定的是你哪句话」。
 * 只在模型确实复述了原话时给正向锚定；否则诚实说明「未直接复述」。
 * @returns {string[]} 命中的锚点文本
 */
function annotateAnchorRef(bubble, question, anchors, turnIdx) {
  const q = String(question || "");
  const hits = (anchors || []).filter((a) => a.text && q.includes(a.text)).map((a) => a.text);
  if (!bubble) return hits;
  const ref = document.createElement("div");
  /* v42：同步更新气泡上方的锚定标签（存在时才更新，兼容历史会话与测试桩） */
  const tagHost = bubble && bubble.previousElementSibling &&
    bubble.previousElementSibling.classList &&
    bubble.previousElementSibling.classList.contains("anchor-ref-host")
    ? bubble.previousElementSibling : null;
  if (tagHost) updateAnchorRefTag(tagHost, hits, (anchors || []).length);
  if (hits.length) {
    ref.className = "msg-anchor-ref";
    ref.innerHTML = `<span class="ref-lead">⚓ 追问锚点</span>${hits
      .map((h) => `<b>「${escHtml(h)}」</b>`)
      .join("")}<span class="ref-note">← 上一轮回答中的这一片段触发了本次追问</span>`;
    // 同步点亮用户气泡里对应的锚点 chip
    document.querySelectorAll(`.anchor-chip[data-turn="${turnIdx}"]`).forEach((chip) => {
      if (hits.includes(chip.dataset.anchor)) chip.classList.add("used");
    });
  } else if (q.trim()) {
    ref.className = "msg-anchor-ref muted";
    ref.innerHTML = `<span class="ref-lead">⚓ 追问锚点</span><span class="ref-note">本轮由面试官自由生成，未直接复述原话片段</span>`;
  } else {
    return hits;
  }
  bubble.appendChild(ref);
  return hits;
}

/* ---------------- 2. 双镜头评分（技术面 / HR 面） ---------------- */

const LENS_META = {
  tech: { key: "tech", name: "技术面试官", icon: "⚙️", focus: "原理 · 量化 · 取舍" },
  hr: { key: "hr", name: "HR 面试官", icon: "💼", focus: "结构 · 协作 · 动机" },
};

function lensClamp(v) {
  return Math.max(30, Math.min(96, Math.round(v)));
}

/** 从回答里抽取两套镜头共用的可数证据（确定性，无随机） */
function lensFeatures(text) {
  const t = String(text || "");
  return {
    len: t.length,
    digits: (t.match(/\d/g) || []).length,
    skills: (typeof SKILL_DICT !== "undefined" ? SKILL_DICT : []).filter((s) => t.includes(s)).length,
    principle: (t.match(/原理|机制|一致性|索引|并发|缓存|锁|架构|协议|复杂度|算法|事务|幂等|超时|重试|链路/g) || []).length,
    tradeoff: (t.match(/权衡|取舍|对比|相比|替代|因为|代价|成本|降级|兜底/g) || []).length,
    star: (t.match(/背景|目标|负责|通过|最终|结果|因此|于是/g) || []).length,
    collab: (t.match(/团队|协作|沟通|推动|协调|配合|对接|复盘/g) || []).length,
    motive: (t.match(/为什么|成长|学习|规划|价值|兴趣|选择/g) || []).length,
    filler: (t.match(/然后|那个|就是/g) || []).length,
  };
}

/**
 * 单镜头打分。两个镜头看同一份回答，但权重不同——
 * 这正是「多 Agent 各自判断」的可解释来源，而不是换个名字轮流提问。
 * @param {string} answer 回答原文
 * @param {"tech"|"hr"} lens 镜头
 * @returns {{score:number, signals:string[], reason:string}}
 */
function lensScore(answer, lens) {
  const f = lensFeatures(answer);
  const lenBonus = Math.min(6, Math.floor(f.len / 80));
  let score, signals = [], reason;
  if (lens === "tech") {
    score = lensClamp(
      40 +
        Math.min(18, f.skills * 6) +
        Math.min(14, f.digits * 2) +
        Math.min(12, f.principle * 4) +
        Math.min(8, f.tradeoff * 3) +
        lenBonus -
        Math.min(8, f.filler * 2)
    );
    if (f.skills) signals.push(`技术名词 ${f.skills} 个`);
    if (f.digits) signals.push(`量化数字 ${f.digits} 个`);
    if (f.principle) signals.push(`原理性表述 ${f.principle} 处`);
    if (f.tradeoff) signals.push(`取舍/对比 ${f.tradeoff} 处`);
    if (f.filler) signals.push(`口头禅 ${f.filler} 处`);
    reason = score >= 75
      ? "回答给出了可验证的实现细节，技术面判为「经得起深挖」"
      : score >= 60
        ? "有实现轮廓，但原理与量化证据不足，技术面保留判断"
        : "只有结论没有机制与数据，技术面判为「需立即追问」";
  } else {
    score = lensClamp(
      42 +
        Math.min(14, f.star * 4) +
        Math.min(14, f.collab * 6) +
        Math.min(10, f.motive * 4) +
        Math.min(6, f.digits) +
        lenBonus -
        Math.min(10, f.filler * 3)
    );
    if (f.star) signals.push(`STAR 结构线索 ${f.star} 处`);
    if (f.collab) signals.push(`协作表述 ${f.collab} 处`);
    if (f.motive) signals.push(`动机/成长表述 ${f.motive} 处`);
    if (f.filler) signals.push(`口头禅 ${f.filler} 处`);
    reason = score >= 75
      ? "叙事完整、协作与动机线索清晰，HR 面判为「可继续推进」"
      : score >= 60
        ? "有事实但缺协作角色与结果，HR 面认为「画像还不够立体」"
        : "缺少团队角色与动机交代，HR 面判为「稳定性存疑」";
  }
  return { score, signals, reason };
}

/** 引用片段：优先用锚点，否则截取回答开头（诚实标注为「开头片段」） */
function lensQuote(answer, anchors) {
  const a = (anchors || [])[0];
  if (a && a.text) return { text: a.text, fromAnchor: true };
  const t = String(answer || "").replace(/\s+/g, " ").trim();
  return { text: t.length > 28 ? t.slice(0, 28) + "…" : t, fromAnchor: false };
}

/**
 * 逐轮生成「双镜头评价」。同一份回答、两个 Agent、两套权重。
 * @param {Array<object>} turns session.turns
 * @returns {{items:Array<object>, maxGap:number, avgGap:number, diverged:number}}
 */
function agentLensViews(turns) {
  const items = (turns || []).map((t, i) => {
    const answer = t.answer || "";
    const anchors = t.anchors && t.anchors.length ? t.anchors : anchorPhrases(answer);
    const tech = lensScore(answer, "tech");
    const hr = lensScore(answer, "hr");
    const gap = Math.abs(tech.score - hr.score);
    return {
      turn: i + 1,
      asker: t.agent || "",
      question: t.question || "",
      quote: lensQuote(answer, anchors),
      tech,
      hr,
      gap,
      diverged: gap >= 8,
    };
  });
  const gaps = items.map((x) => x.gap);
  return {
    items,
    maxGap: gaps.length ? Math.max(...gaps) : 0,
    avgGap: gaps.length ? Math.round((gaps.reduce((s, g) => s + g, 0) / gaps.length) * 10) / 10 : 0,
    diverged: items.filter((x) => x.diverged).length,
  };
}

/** 分歧度色阶：越高越说明两个 Agent 判断不同（不是错误，而是视角差异） */
function gapLevel(gap) {
  if (gap >= 20) return { label: "显著分歧", cls: "g-high" };
  if (gap >= 8) return { label: "存在分歧", cls: "g-mid" };
  return { label: "基本一致", cls: "g-low" };
}

function lensColHtml(meta, res) {
  const lv = res.score >= 75 ? "认可" : res.score >= 60 ? "保留" : "存疑";
  return `<div class="split-col ${meta.key}">
      <div class="split-who">${meta.icon} ${escHtml(meta.name)}<span class="split-focus">${escHtml(meta.focus)}</span></div>
      <div class="split-score">${res.score}<span>/100</span><em class="split-lv lv-${lv}">${lv}</em></div>
      <p class="split-reason">${escHtml(res.reason)}</p>
      <div class="split-signals">${res.signals.length ? res.signals.map((s) => `<span>${escHtml(s)}</span>`).join("") : "<span>未检出可用证据</span>"}</div>
    </div>`;
}

/** 报告「Agent 分歧视图」区块：只展示分歧最大的两轮，避免信息过载 */
function agentSplitHtml(views) {
  const v = views || { items: [], maxGap: 0, avgGap: 0, diverged: 0 };
  if (!v.items.length) return "";
  const top = v.items.slice().sort((a, b) => b.gap - a.gap).slice(0, 2).filter((x) => x.gap >= 8);
  const head = `<div class="pane-title" style="margin-top:18px">⚖️ Agent 分歧视图 <span class="tag-demo">同一回答 · 两套评价镜头</span></div>
    <p class="hint" style="margin-top:0">同一份回答，技术面试官与 HR 面试官用不同权重独立打分：分歧 ≥8 分即视为显著。
      本场平均分歧 <b>${v.avgGap}</b> 分，最大 <b>${v.maxGap}</b> 分，显著分歧 ${v.diverged}/${v.items.length} 轮。</p>`;
  if (!top.length) {
    return head + `<div class="split-none">本场两位面试官判断基本一致（每轮分歧均 &lt; 8 分）——没有分歧本身也是结论：你的回答在「技术深度」与「协作画像」上给出了同等强度的证据。</div>`;
  }
  return head + top.map((x) => {
    const lv = gapLevel(x.gap);
    return `<div class="agent-split">
      <div class="split-head">
        <div class="split-q"><b>第 ${x.turn} 轮</b><span>${escHtml(x.asker)}提问</span></div>
        <div class="split-gap ${lv.cls}">分歧 ${x.gap} 分 · ${lv.label}</div>
      </div>
      <div class="split-quote-line">被评价的原话：<q>“${escHtml(x.quote.text)}”</q>${x.quote.fromAnchor ? "" : `<span class="q-note">（开头片段）</span>`}</div>
      <div class="gap-bar"><i class="${lv.cls}" style="width:${Math.min(100, x.gap * 3)}%"></i></div>
      <div class="split-cols">${lensColHtml(LENS_META.tech, x.tech)}${lensColHtml(LENS_META.hr, x.hr)}</div>
    </div>`;
  }).join("");
}

/* ---------------- 3. 表达节奏（语音转写时间戳） ---------------- */

/**
 * 从语音片段算语速 / 停顿 / 口头禅密度。
 * @param {Array<{chars:number, ms:number, at:number, text?:string}>} segments
 */
function rhythmSummary(segments) {
  const segs = (segments || []).filter((s) => s && s.chars > 0 && s.ms > 0);
  if (!segs.length) return { hasData: false };
  const chars = segs.reduce((s, x) => s + x.chars, 0);
  const ms = segs.reduce((s, x) => s + x.ms, 0);
  const cpm = Math.round((chars / ms) * 60000);
  const gaps = [];
  for (let i = 1; i < segs.length; i++) {
    const g = (segs[i].at - (segs[i - 1].at + segs[i - 1].ms)) / 1000;
    if (g > 0) gaps.push(g);
  }
  const pauseAvg = gaps.length ? Math.round((gaps.reduce((s, g) => s + g, 0) / gaps.length) * 10) / 10 : 0;
  const longPauses = gaps.filter((g) => g >= 2).length;
  const text = segs.map((s) => s.text || "").join("");
  const filler = (text.match(/然后|那个|就是/g) || []).length;
  const fillerRate = text.length ? Math.round((filler / text.length) * 1000) / 10 : 0;
  const notes = [];
  if (cpm > 320) notes.push("语速偏快，面试官容易跟丢论据，建议在关键结论前停顿一拍");
  else if (cpm < 140) notes.push("语速偏慢，叙述显得犹豫，可先给结论再展开");
  else notes.push("语速处于舒适区（140–320 字/分），节奏自然");
  if (longPauses >= 2) notes.push(`出现 ${longPauses} 次 2 秒以上停顿，多为边想边说；建议用「结论先行」减少临时组织语言`);
  if (fillerRate > 8) notes.push(`口头禅密度 ${fillerRate}‰ 偏高，可用「停顿」替代「然后/那个」`);
  return {
    hasData: true,
    chars, seconds: Math.round(ms / 100) / 10, segments: segs.length,
    cpm, pauseAvg, longPauses, filler, fillerRate, notes,
    cpmLevel: cpm > 320 ? "快" : cpm < 140 ? "慢" : "适中",
  };
}

/** 报告「表达节奏」卡片（无语音数据时给出中性说明，不伪造指标） */
function rhythmCard(sum) {
  if (!sum || !sum.hasData) {
    return `<div class="card rhythm-card" style="padding:14px 16px;margin-top:14px">
      <div class="pane-title" style="margin-bottom:2px">🗣 表达节奏（语音转写时间戳）<span class="tag-demo">端侧统计 · 仅本机</span></div>
      <p class="hint" style="margin-bottom:0">本场未使用语音输入，因此没有语速与停顿数据。用 🎤 说一遍回答，报告会附带「语速 / 停顿 / 口头禅密度」三项表达层分析——内容评估之外再多一层表达评估。</p>
    </div>`;
  }
  const cell = (num, cap) =>
    `<div class="status-cell"><div class="status-num">${num}</div><div class="status-cap">${cap}</div></div>`;
  return `<div class="card rhythm-card" style="padding:14px 16px;margin-top:14px">
      <div class="pane-title" style="margin-bottom:2px">🗣 表达节奏（语音转写时间戳）<span class="tag-demo">端侧统计 · 仅本机</span></div>
      <div class="status-grid">
        ${cell(sum.cpm + " 字/分", "语速 · " + sum.cpmLevel)}
        ${cell(sum.pauseAvg + " s", "平均停顿")}
        ${cell(sum.longPauses + " 次", "2 秒以上停顿")}
        ${cell(sum.fillerRate + "‰", "口头禅密度")}
      </div>
      <ul class="rhythm-notes">${sum.notes.map((n) => `<li>${escHtml(n)}</li>`).join("")}</ul>
      <p class="hint" style="margin-bottom:0">共 ${sum.segments} 段语音、${sum.chars} 字、约 ${sum.seconds} 秒说话时长；时间戳由浏览器语音识别在本地产生，音频不上传。</p>
    </div>`;
}

/* ---------------- 4. 报告渐进呈现（逐块入场，DOM 一次成型） ---------------- */

/**
 * 报告各区块按顺序「流式」入场：DOM 已完整（可被测试/复制/打印读取），
 * 只通过 class 控制入场节奏——既不破坏可访问性，也保留逐块呈现的实时感。
 */
function streamReportBlocks(host) {
  if (!host) return;
  const reduce = (() => {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  })();
  if (reduce) return;
  const blocks = host.querySelectorAll(
    ".pane-title, .dim-row, .dim-comment, .evidence, .notice-info, .notice-llm, .agent-split, .split-reason, .status-grid, .rhythm-notes, .history"
  );
  blocks.forEach((el, i) => {
    el.classList.add("rv-block");
    el.style.animationDelay = Math.min(900, i * 45) + "ms";
  });
}
