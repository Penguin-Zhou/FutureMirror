"use strict";
/* ============================================================
 * v36 · MBTI 职业性格测评
 *   ① MBTI_DIMS / MBTI_SCALE / MBTI_QUESTIONS（4 维度 × 5 题 = 20 题）
 *   ② MBTI_TYPES：16 型人格（昵称 / 特质 / 适配方向 / 面试提醒）
 *   ③ 测评引擎：startMbti / answerMbti / computeMbtiResult / finishMbti
 *   ④ 结果同步：syncMbtiToProfile（写入 fm_profile.mbti，个人中心可见）
 *   ⑤ 页面渲染：renderMbtiPage / renderMbtiQuestion / renderMbtiResult
 * ============================================================ */

/* ---------- ① 量表定义 ---------- */
const MBTI_DIMS = [
  { key: "EI", a: "E", b: "I", name: "精力来源", aName: "外向 E", bName: "内向 I", q: "你从哪里获得能量？" },
  { key: "SN", a: "S", b: "N", name: "信息获取", aName: "实感 S", bName: "直觉 N", q: "你如何获取与处理信息？" },
  { key: "TF", a: "T", b: "F", name: "决策方式", aName: "思考 T", bName: "情感 F", q: "你如何做决定？" },
  { key: "JP", a: "J", b: "P", name: "生活态度", aName: "判断 J", bName: "知觉 P", q: "你如何安排工作与生活？" },
];

/* dir = +1：越同意越偏向维度首选字母（a）；dir = -1：越同意越偏向次选字母（b） */
const MBTI_SCALE = [
  { label: "完全不同意", v: -2 },
  { label: "不太同意", v: -1 },
  { label: "中立 / 不确定", v: 0 },
  { label: "比较同意", v: 1 },
  { label: "完全同意", v: 2 },
];

const MBTI_QUESTIONS = [
  { dim: "EI", dir: 1, q: "在团队讨论中，我通常是先开口、边说边理清思路的人。" },
  { dim: "EI", dir: -1, q: "长时间独自编码或写作后，我会感到精力充沛而不是疲惫。" },
  { dim: "EI", dir: 1, q: "推进事情时，我更愿意当面沟通，而不是发文档或邮件。" },
  { dim: "EI", dir: 1, q: "假期我更倾向于参加多人聚会，而不是独自待在家里。" },
  { dim: "EI", dir: -1, q: "到了陌生环境，我倾向于先观察一圈再参与进去。" },

  { dim: "SN", dir: 1, q: "我更关注方案的实际细节与可落地性，而不是整体可能性。" },
  { dim: "SN", dir: -1, q: "我常常先看到一件事的整体模式与未来可能性。" },
  { dim: "SN", dir: 1, q: "解决问题时，我更依赖过往经验与具体数据。" },
  { dim: "SN", dir: -1, q: "我喜欢尝试全新的方法，哪怕它还没有被验证过。" },
  { dim: "SN", dir: 1, q: "写文档时我更看重准确的数据与步骤，而不是宏观愿景。" },

  { dim: "TF", dir: 1, q: "做决定时，我优先看逻辑与客观标准，而不是他人感受。" },
  { dim: "TF", dir: -1, q: "我会为了避免伤害别人感受，而调整自己的表达方式。" },
  { dim: "TF", dir: -1, q: "评价方案时，我更在意它是否公平、对团队氛围有什么影响。" },
  { dim: "TF", dir: 1, q: "我认为批评应当直接、对事不对人，哪怕会让人不舒服。" },
  { dim: "TF", dir: 1, q: "我更容易被数据说服，而不是被故事打动。" },

  { dim: "JP", dir: 1, q: "我喜欢提前制定计划，然后按计划一步步推进。" },
  { dim: "JP", dir: -1, q: "我更倾向于保留灵活空间，临场随机应变。" },
  { dim: "JP", dir: 1, q: "任务我会尽早完成，不喜欢拖到截止日期前。" },
  { dim: "JP", dir: -1, q: "面对需求变化，我能快速切换优先级，不会因此焦虑。" },
  { dim: "JP", dir: 1, q: "我的工作台与文件通常分类清晰、井井有条。" },
];

/* ---------- ② 16 型人格 ---------- */
const MBTI_TYPES = {
  INTJ: { nick: "建筑师", trait: "独立、战略、追求系统性与长期最优解。", fit: "系统架构 / 算法研究 / 技术规划", tip: "面试中多讲「为什么这样设计」，补一个权衡取舍的例子。" },
  INTP: { nick: "逻辑学家", trait: "好奇、抽象、爱追究原理与边界条件。", fit: "算法研究 / 数据科学 / 后端架构", tip: "警惕过度展开原理，先给结论再补细节。" },
  ENTJ: { nick: "指挥官", trait: "目标导向、果断、善于组织资源推进。", fit: "技术管理 / 项目负责人 / 产品负责人", tip: "展示你如何带团队拿到结果，而不只是自己做了什么。" },
  ENTP: { nick: "辩论家", trait: "敏捷、爱挑战、擅长发现新可能。", fit: "创新孵化 / 解决方案 / 创业", tip: "把「想法多」收敛成「落地了哪一个」，用数据收尾。" },
  INFJ: { nick: "提倡者", trait: "洞察力强、重视意义与长期价值。", fit: "用户研究 / 教育 / 内容策略", tip: "用具体案例证明你的洞察，而不是只谈理念。" },
  INFP: { nick: "调停者", trait: "理想主义、共情强、重视价值一致。", fit: "内容创作 / UX 设计 / 品牌", tip: "准备「你如何把价值观落到具体产出」的例子。" },
  ENFJ: { nick: "主人公", trait: "善表达、能凝聚他人、关注成长。", fit: "团队管理 / 培训 / 客户成功", tip: "讲清楚你如何帮助他人成长并带来业务结果。" },
  ENFP: { nick: "竞选者", trait: "热情、创意多、连接力强。", fit: "市场增长 / 运营 / 社区", tip: "挑选一个做深的项目讲透，避免经历显得发散。" },
  ISTJ: { nick: "物流师", trait: "严谨、可靠、重视流程与事实。", fit: "后端开发 / 测试 / 运维 / 财务", tip: "强调稳定性与质量结果，补一个主动改进的例子。" },
  ISFJ: { nick: "守卫者", trait: "细致、尽责、关注他人实际需求。", fit: "技术支持 / 质量保障 / 行政", tip: "把「默默承担」讲成「可量化的交付」。" },
  ESTJ: { nick: "总经理", trait: "务实、高效、擅长组织与执行。", fit: "项目管理 / 运营 / 交付", tip: "用里程碑与结果数据证明你的推进力。" },
  ESFJ: { nick: "执政官", trait: "热心、协作、重视团队和谐。", fit: "客户成功 / 人力资源 / 运营", tip: "展示你如何协调多方并达成共识。" },
  ISTP: { nick: "鉴赏家", trait: "冷静、动手能力强、擅长排查与优化。", fit: "嵌入式 / 硬件 / 性能优化", tip: "准备一个「定位根因 → 修复 → 指标变化」的完整故事。" },
  ISFP: { nick: "探险家", trait: "审美敏感、务实、重视体验细节。", fit: "视觉设计 / 前端 / 交互", tip: "用作品集说话，并说明设计决策背后的取舍。" },
  ESTP: { nick: "企业家", trait: "行动快、适应强、擅长现场应变。", fit: "销售 / 商务拓展 / 应急响应", tip: "讲一个高压下快速拿结果的真实案例。" },
  ESFP: { nick: "表演者", trait: "外向、感染力强、享受当下。", fit: "活动策划 / 直播运营 / 用户体验", tip: "把热情转化为可复用的方法论与数据。" },
};

/* ---------- ③ 测评引擎 ---------- */
let mbtiState = null;   // { i: 当前题序, answers: [{dim,dir,v}] }

/* v43：断点续答——答到一半切走/刷新不该让 20 题从头再来 */
function getMbtiDraft() {
  try {
    const d = store.get("fm_mbti_draft", null);
    if (d && typeof d.i === "number" && Array.isArray(d.answers)) return d;
    return null;
  } catch (e) { return null; }
}

function saveMbtiDraft() {
  if (!mbtiState) return;
  try { store.set("fm_mbti_draft", { i: mbtiState.i, answers: mbtiState.answers, at: Date.now() }, true); } catch (e) {}
}

function clearMbtiDraft() {
  try { store.set("fm_mbti_draft", null, true); } catch (e) {}
}

/* v43：按维度分组的进度——「维度 2/4 · 第 3/5 题」比「第 8/20 题」更能减少焦虑 */
function mbtiDimProgress(idx) {
  const item = MBTI_QUESTIONS[idx];
  const gTotal = MBTI_DIMS.length;
  if (!item) return { g: 0, gTotal, gName: "", inGroup: 1, inTotal: 5, done: idx };
  const g = MBTI_DIMS.map((d) => d.key).indexOf(item.dim);
  const inDim = MBTI_QUESTIONS.map((q, i) => (q.dim === item.dim ? i : -1)).filter((i) => i >= 0);
  const dimMeta = MBTI_DIMS[g] || {};
  return {
    g: g < 0 ? 0 : g,
    gTotal,
    gName: dimMeta.name || "",
    inGroup: inDim.indexOf(idx) + 1,
    inTotal: inDim.length,
    done: idx,
  };
}

/* v44：四段进度条——比「第 8/20 题」更能说明「四个维度各走一遍」，
 * 也让中段（最容易被放弃的位置）有一个可预期的终点。 */
function mbtiStageBar(pg) {
  const total = (pg && pg.gTotal) || 4;
  const cur = (pg && pg.g) || 0;
  let out = "";
  for (let i = 0; i < total; i++) {
    const cls = i < cur ? "done" : i === cur ? "now" : "";
    out += `<i class="${cls}"></i>`;
  }
  return `<div class="mbti-stage" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${cur + 1}" aria-label="维度进度 ${cur + 1}/${total}">${out}</div>`;
}

function getMbti() {
  try { return store.get("fm_mbti", null); } catch (e) { return null; }
}

function saveMbti(result) {
  try { store.set("fm_mbti", result, true); } catch (e) {}
  return result;
}

/* 计算：每维 5 题，v∈[-2,2] → 原始分 ∈[-10,10] → 偏向 a 的百分比
 * v43：同时产出 trace（逐题溯源）——「是哪几道题把你判成了 I」必须可查，
 * 否则这套量表对外就是个黑盒，和「可解释」的整体叙事自相矛盾。 */
function computeMbtiResult(answers) {
  const acc = {};
  MBTI_DIMS.forEach((d) => { acc[d.key] = 0; });
  (answers || []).forEach((a) => {
    if (!a || acc[a.dim] === undefined) return;
    acc[a.dim] += a.v * a.dir;
  });
  const dims = MBTI_DIMS.map((d) => {
    const raw = Math.max(-10, Math.min(10, acc[d.key] || 0));
    const pctA = Math.round((raw + 10) / 20 * 100);   // 偏向 a 的百分比
    const letter = pctA >= 50 ? d.a : d.b;
    const strength = Math.abs(pctA - 50) * 2;         // 0-100，越大越典型
    return {
      key: d.key, name: d.name, a: d.a, b: d.b, aName: d.aName, bName: d.bName,
      pctA, pctB: 100 - pctA, letter, strength, raw,
    };
  });
  const type = dims.map((d) => d.letter).join("");
  const clarity = Math.round(dims.reduce((s, d) => s + d.strength, 0) / dims.length);
  return { type, dims, clarity, at: Date.now(), trace: mbtiTrace(answers) };
}

/* v43：逐题溯源——题目 / 你的选择 / 贡献分（正=推向首选字母，负=推向次选字母） */
function mbtiTrace(answers) {
  const out = [];
  (answers || []).forEach((a, i) => {
    const q = MBTI_QUESTIONS[i];
    if (!q || !a || typeof a.v !== "number") return;
    const scale = MBTI_SCALE.filter((s) => s.v === a.v)[0];
    const contrib = a.v * q.dir;
    const dimMeta = MBTI_DIMS.filter((d) => d.key === q.dim)[0] || {};
    out.push({
      i, dim: q.dim, dimName: dimMeta.name || q.dim, q: q.q,
      v: a.v, label: scale ? scale.label : String(a.v),
      contrib, toward: contrib > 0 ? dimMeta.a : contrib < 0 ? dimMeta.b : "",
    });
  });
  return out;
}

function startMbti() {
  mbtiState = { i: 0, answers: [] };
  clearMbtiDraft();
  openMbtiQuiz();
}

/* v43：继续上次进度（20 题在手机上被打断的概率很高） */
function resumeMbti() {
  const d = getMbtiDraft();
  if (!d) { startMbti(); return; }
  mbtiState = { i: Math.min(d.i, MBTI_QUESTIONS.length - 1), answers: d.answers || [] };
  openMbtiQuiz();
}

function openMbtiQuiz() {
  const intro = $("mbti-intro");
  const quiz = $("mbti-quiz");
  const result = $("mbti-result");
  if (intro) intro.hidden = true;
  if (result) result.innerHTML = "";
  if (quiz) quiz.hidden = false;
  /* v44：答题时收起页面级的说明与免责声明——手机上那两段会占掉 130px，
   * 题干被推出视口，每题都要先滚一下才能作答。边界说明在结果页底部仍完整保留。 */
  try { document.body.classList.add("mbti-quizzing"); } catch (e) {}
  renderMbtiQuestion();
}

/** 退出答题态（暂停 / 放弃 / 完成都要调用，否则说明区会一直藏着） */
function leaveMbtiQuiz() {
  try { document.body.classList.remove("mbti-quizzing"); } catch (e) {}
}

function renderMbtiQuestion() {
  const quiz = $("mbti-quiz");
  if (!quiz || !mbtiState) return;
  const idx = mbtiState.i;
  if (idx >= MBTI_QUESTIONS.length) { finishMbti(); return; }
  const item = MBTI_QUESTIONS[idx];
  const total = MBTI_QUESTIONS.length;
  const pct = Math.round(idx / total * 100);
  const dimMeta = MBTI_DIMS.filter((d) => d.key === item.dim)[0];
  /* v43：分段进度——先让用户知道「这一维还剩几题」，再谈总进度 */
  const pg = mbtiDimProgress(idx);
  quiz.innerHTML = `
    <div class="mbti-progress-wrap">
      ${mbtiStageBar(pg)}
      <div class="mbti-step">
        <span class="mbti-step-dim">维度 ${pg.g + 1}/${pg.gTotal}${pg.gName ? " · " + escHtml(pg.gName) : ""}</span>
        <span class="mbti-step-q">第 ${pg.inGroup}/${pg.inTotal} 题</span>
        <span class="mbti-step-all">已完成 ${idx}/${total}（${pct}%）</span>
      </div>
      ${progressDotsSVG(total, idx, { cell: 13, gap: 4 })}
    </div>
    <div class="mbti-q-card">
      <div class="mbti-q-text">${escHtml(item.q)}</div>
      <div class="mbti-opts">
        ${MBTI_SCALE.map((s) => `<button class="mbti-opt" aria-pressed="false" onclick="answerMbti(${s.v}, this)">${escHtml(s.label)}</button>`).join("")}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${idx > 0 ? `<button class="btn btn-outline btn-sm" onclick="prevMbti()">← 上一题</button>` : ""}
      <button class="btn btn-ghost btn-sm" onclick="pauseMbti()">稍后继续</button>
    </div>`;
}

/* v45：换题分两步走——按下先确认，重渲染让出一帧并合并。
 * 之前是「点完立刻 innerHTML 重建整个答题区」：低端机上重建的十几毫秒里，
 * 按钮的按下态根本来不及落屏，访客会以为没点中而再点一次。 */
let mbtiRenderPending = false;

function scheduleMbtiQuestion() {
  if (mbtiRenderPending) return;
  mbtiRenderPending = true;
  const run = function () {
    mbtiRenderPending = false;
    renderMbtiQuestion();
  };
  try {
    yieldToMain().then(run);
  } catch (e) {
    run();
  }
}

function answerMbti(v, btn) {
  if (!mbtiState) return;
  /* ① 按下态立刻落屏（CSS 上无过渡，不受动效偏好影响） */
  try {
    if (btn && btn.classList) {
      btn.classList.add("picked");
      btn.setAttribute("aria-pressed", "true");
    }
  } catch (e) {}
  /* ② 状态更新是同步的，保证「每答一题即落盘」不受渲染节奏影响 */
  const item = MBTI_QUESTIONS[mbtiState.i];
  mbtiState.answers[mbtiState.i] = { dim: item.dim, dir: item.dir, v };
  mbtiState.i++;
  saveMbtiDraft();   // v43：每答一题落一次盘，被打断也能接上
  /* ③ 换题让帧：同一帧内连点只重建一次 DOM */
  scheduleMbtiQuestion();
}

function prevMbti() {
  if (!mbtiState || mbtiState.i <= 0) return;
  mbtiState.i--;
  saveMbtiDraft();
  renderMbtiQuestion();
}

/* v43：稍后继续——保留草稿，回到 intro 态（不丢已答的题） */
function pauseMbti() {
  saveMbtiDraft();
  mbtiState = null;
  leaveMbtiQuiz();
  const quiz = $("mbti-quiz");
  if (quiz) { quiz.hidden = true; quiz.innerHTML = ""; }
  renderMbtiPage();
  toast("进度已保存，下次可从断点继续");
}

/* v43：放弃本次测评（清空草稿） */
function cancelMbti() {
  mbtiState = null;
  clearMbtiDraft();
  leaveMbtiQuiz();
  const quiz = $("mbti-quiz");
  if (quiz) { quiz.hidden = true; quiz.innerHTML = ""; }
  renderMbtiPage();
}

function finishMbti() {
  const answers = mbtiState ? mbtiState.answers : [];
  const r = computeMbtiResult(answers);
  r.count = MBTI_QUESTIONS.length;
  saveMbti(r);
  syncMbtiToProfile(r);
  mbtiState = null;
  leaveMbtiQuiz();
  clearMbtiDraft();   // v43：完成后清掉草稿，避免「继续上次」指向已结束的测评
  const quiz = $("mbti-quiz");
  if (quiz) { quiz.hidden = true; quiz.innerHTML = ""; }
  renderMbtiResult(r);
  /* v43：测评完成即刷新面试页的人格胶囊——结果要立刻能在面试里被看见 */
  if (typeof renderPersonaCapsule === "function") { try { renderPersonaCapsule(); } catch (e) {} }
  toast(`测评完成：${r.type}（已同步到个人中心与面试提问策略）`);
  try { logDev("info", `MBTI 测评完成：${r.type}`); } catch (e) {}
}

/* ---------- ④ 自动同步到个人信息 ---------- */
function syncMbtiToProfile(result) {
  if (!result || !result.type) return null;
  if (typeof saveProfile !== "function") return null;
  const p = saveProfile({ mbti: result.type, mbtiAt: result.at, mbtiClarity: result.clarity });
  // 个人中心若已渲染则即时刷新，让 MBTI 标签立刻可见
  try { if (typeof renderProfile === "function" && $("profile-tags")) renderProfile(); } catch (e) {}
  return p;
}

/* ---------- ⑤ 页面渲染 ---------- */
function renderMbtiResult(r) {
  const box = $("mbti-result");
  if (!box) return;
  const t = MBTI_TYPES[r.type] || { nick: "", trait: "", fit: "", tip: "" };
  const dimCards = r.dims.map((d) => {
    /* v43：逐题溯源——每个维度都能展开看「哪几道题把你判成了这一极」 */
    const rows = (r.trace || []).filter((t) => t.dim === d.key);
    const rawTxt = typeof d.raw === "number" ? (d.raw > 0 ? "+" : "") + d.raw : "—";
    const traceHtml = rows.length
      ? `<details class="mbti-trace">
        <summary>🔍 查看是哪 ${rows.length} 题导致的（原始分 ${rawTxt} / ±10）</summary>
        ${rows.map((t) => `<div class="mt-row">
          <span class="mt-q">${escHtml(t.q)}</span>
          <span class="mt-a">${escHtml(t.label)}</span>
          <span class="mt-c${t.contrib === 0 ? " mt-zero" : ""}">${t.contrib === 0 ? "中性" : (t.contrib > 0 ? "+" : "") + t.contrib + " → " + escHtml(t.toward)}</span>
        </div>`).join("")}
      </details>`
      : `<div class="mbti-trace-none">本次结果由旧版本生成，重新测评可查看逐题溯源。</div>`;
    return `
    <div class="mbti-dim-card">
      <div class="mbti-dim-name">${escHtml(d.name)}</div>
      <div class="mbti-dim-axis">
        <span class="${d.letter === d.a ? "on" : ""}">${escHtml(d.aName)}</span>
        <span class="mbti-dim-bar"><i style="width:${d.pctA}%"></i></span>
        <span class="${d.letter === d.b ? "on" : ""}">${escHtml(d.bName)}</span>
      </div>
      <div class="mbti-dim-pct">偏 ${escHtml(d.letter)}　·　典型度 ${d.strength}%</div>
      ${traceHtml}
    </div>`;
  }).join("");
  box.innerHTML = `
    <div class="mbti-hero fade-up">
      <div class="mbti-hero-left">
        <div class="mbti-type-big">${escHtml(r.type)}</div>
        <div class="mbti-hero-nick">${escHtml(t.nick)}</div>
        <div class="hint" style="margin-top:4px">清晰度 ${r.clarity}%</div>
      </div>
      <div class="mbti-hero-right">
        <p class="mbti-hero-trait">${escHtml(t.trait)}</p>
        <div class="mbti-hero-tags"><span class="tag-demo">🎯 ${escHtml(t.fit)}</span></div>
      </div>
    </div>

    ${typeof personaBridgeHtml === "function" ? personaBridgeHtml(personaParams(r)) : ""}

    <div class="pane-title" style="font-size:14px;margin-top:18px">🧾 逐维依据 <span class="tag-demo">点开看是哪几题导致的</span></div>
    <div class="mbti-dim-grid">${dimCards}</div>

    <div class="pane-title" style="font-size:14px;margin-top:16px">📊 四维刻度（条形过半即偏向左侧字母）</div>
    ${bipolarBarsSVG(r.dims, { aria: r.type + " 四维倾向" })}

    <div class="mbti-radar-wrap">
      <div>
        <div class="pane-title" style="font-size:13px">🧭 人格轮廓</div>
        ${radar4SVG(r.dims.map((d) => ({ name: d.aName + " / " + d.bName, value: d.pctA })), { aria: r.type + " 人格轮廓雷达" })}
      </div>
      <div>
        <div class="pane-title" style="font-size:13px">📶 典型度（越靠外越典型）</div>
        ${hbarSVG(r.dims.map((d) => ({
          label: d.name, value: d.strength, text: d.strength + "%",
          tip: d.name + "：偏向 " + d.letter + "，典型度 " + d.strength + "%",
        })), { aria: "各维度典型度", max: 100 })}
      </div>
    </div>

    <div class="report-grid" style="margin-top:14px">
      <div>
        <div class="pane-title" style="font-size:14px">💬 面试提醒</div>
        <p style="font-size:13px;color:var(--muted);line-height:1.8">${escHtml(t.tip)}</p>
      </div>
      <div>
        <div class="pane-title" style="font-size:14px">🚀 下一步</div>
        <p style="font-size:13px;color:var(--muted);line-height:1.8">去「职业探索」查看与 ${escHtml(r.type)} 契合的真实岗位，或直接开始一场针对性模拟面试。</p>
      </div>
    </div>

    <p class="mbti-boundary">ⓘ 端侧简易量表，<b>非专业心理测评</b>：结果仅作求职参考，不作心理诊断或职业决策依据。结果已同步到个人中心，并作为面试提问策略参数生效——只改变面试官「怎么问」，<b>不参与评分</b>。</p>
    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-outline btn-sm" onclick="startMbti()">重新测评</button>
      <button class="btn btn-primary btn-sm" onclick="switchTab('profile')">查看个人中心 →</button>
      <button class="btn btn-outline btn-sm" onclick="switchTab('career')">看看适配岗位 →</button>
    </div>`;
}

function renderMbtiPage() {
  /* 路由重渲染时（例如从别的页面切回来）统一退出答题态：
   * 有草稿会显示「继续测评」入口，不应停留在半隐藏的说明区。 */
  if (!mbtiState) leaveMbtiQuiz();
  const intro = $("mbti-intro");
  const quiz = $("mbti-quiz");
  const result = $("mbti-result");
  if (!intro) return;
  const saved = getMbti();
  const draft = getMbtiDraft();
  /* v43：有草稿就先把「继续」摆在最前面——20 题被打断过的人不该从第 1 题重来 */
  const resumeBox = $("mbti-resume");
  if (resumeBox) {
    if (draft && draft.i > 0 && (!saved || !saved.type)) {
      resumeBox.hidden = false;
      resumeBox.innerHTML = `
        <div class="notice notice-info mbti-resume-box">
          <span>上次答到第 <b>${draft.i}</b> / ${MBTI_QUESTIONS.length} 题（维度 ${mbtiDimProgress(Math.min(draft.i, MBTI_QUESTIONS.length - 1)).g + 1}/4）</span>
          <span style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="resumeMbti()">继续测评 →</button>
            <button class="btn btn-ghost btn-sm" onclick="cancelMbti()">重新开始</button>
          </span>
        </div>`;
    } else {
      resumeBox.hidden = true;
      resumeBox.innerHTML = "";
    }
  }
  if (saved && saved.type) {
    intro.hidden = true;
    if (quiz) quiz.hidden = true;
    /* 有结果时页头描述也收起：首屏要留给 ESTJ 与「面试策略已调整」，
     * 说明性文字在下方结果末尾仍完整保留。 */
    try { document.body.classList.add("mbti-resulting"); } catch (e) {}
    renderMbtiResult(saved);
    return;
  }
  try { document.body.classList.remove("mbti-resulting"); } catch (e) {}
  intro.hidden = false;
  if (quiz) quiz.hidden = true;
  if (result) {
    result.innerHTML = draft && draft.i > 0
      ? `<div class="notice notice-info">有一份未完成的测评（已答 ${draft.i} 题）。点上方「继续测评」接着答，或「重新开始」清空重来。</div>`
      : `<div class="notice notice-info">还没有测评记录。点击上方「开始测评」，20 道题约需 2 分钟。</div>`;
  }
}

/* 供其他模块读取当前 MBTI（岗位推荐 / 面试建议引用） */
function currentMbti() {
  const s = getMbti();
  return s && s.type ? s : null;
}
