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

function getMbti() {
  try { return store.get("fm_mbti", null); } catch (e) { return null; }
}

function saveMbti(result) {
  try { store.set("fm_mbti", result, true); } catch (e) {}
  return result;
}

/* 计算：每维 5 题，v∈[-2,2] → 原始分 ∈[-10,10] → 偏向 a 的百分比 */
function computeMbtiResult(answers) {
  const acc = {};
  MBTI_DIMS.forEach((d) => { acc[d.key] = 0; });
  (answers || []).forEach((a) => {
    if (acc[a.dim] === undefined) return;
    acc[a.dim] += a.v * a.dir;
  });
  const dims = MBTI_DIMS.map((d) => {
    const raw = Math.max(-10, Math.min(10, acc[d.key] || 0));
    const pctA = Math.round((raw + 10) / 20 * 100);   // 偏向 a 的百分比
    const letter = pctA >= 50 ? d.a : d.b;
    const strength = Math.abs(pctA - 50) * 2;         // 0-100，越大越典型
    return {
      key: d.key, name: d.name, a: d.a, b: d.b, aName: d.aName, bName: d.bName,
      pctA, pctB: 100 - pctA, letter, strength,
    };
  });
  const type = dims.map((d) => d.letter).join("");
  const clarity = Math.round(dims.reduce((s, d) => s + d.strength, 0) / dims.length);
  return { type, dims, clarity, at: Date.now() };
}

function startMbti() {
  mbtiState = { i: 0, answers: [] };
  const intro = $("mbti-intro");
  const quiz = $("mbti-quiz");
  const result = $("mbti-result");
  if (intro) intro.hidden = true;
  if (result) result.innerHTML = "";
  if (quiz) quiz.hidden = false;
  renderMbtiQuestion();
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
  quiz.innerHTML = `
    <div class="mbti-progress-wrap">
      <div class="hint" style="margin-top:0">第 ${idx + 1} / ${total} 题${dimMeta ? "　·　" + escHtml(dimMeta.name) : ""}　（${pct}%）</div>
      ${progressDotsSVG(total, idx, { cell: 13, gap: 4 })}
    </div>
    <div class="mbti-q-card">
      <div class="mbti-q-text">${escHtml(item.q)}</div>
      <div class="mbti-opts">
        ${MBTI_SCALE.map((s) => `<button class="mbti-opt" onclick="answerMbti(${s.v})">${escHtml(s.label)}</button>`).join("")}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-outline btn-sm" onclick="${idx > 0 ? "prevMbti()" : "cancelMbti()"}">${idx > 0 ? "← 上一题" : "取消测评"}</button>
    </div>`;
}

function answerMbti(v) {
  if (!mbtiState) return;
  const item = MBTI_QUESTIONS[mbtiState.i];
  mbtiState.answers[mbtiState.i] = { dim: item.dim, dir: item.dir, v };
  mbtiState.i++;
  renderMbtiQuestion();
}

function prevMbti() {
  if (!mbtiState || mbtiState.i <= 0) return;
  mbtiState.i--;
  renderMbtiQuestion();
}

function cancelMbti() {
  mbtiState = null;
  const intro = $("mbti-intro");
  if (intro) intro.hidden = false;
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
  const quiz = $("mbti-quiz");
  if (quiz) { quiz.hidden = true; quiz.innerHTML = ""; }
  renderMbtiResult(r);
  toast(`测评完成：${r.type}（已同步到个人中心）`);
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
  box.innerHTML = `
    <div class="card fade-up" style="padding:16px;margin-top:8px">
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap">
        <div>
          <div class="mbti-type-big">${escHtml(r.type)}</div>
          <div class="hint" style="margin-top:0">${escHtml(t.nick)}　·　清晰度 ${r.clarity}%</div>
        </div>
        <div style="flex:1;min-width:220px">
          <p style="font-size:13px;color:var(--muted);line-height:1.8;margin:0">${escHtml(t.trait)}</p>
        </div>
      </div>

      <div class="pane-title" style="font-size:14px;margin-top:14px">📊 四维倾向（条形过半即偏向左侧字母）</div>
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
          <div class="pane-title" style="font-size:14px">🎯 适配方向</div>
          <p style="font-size:13px;color:var(--muted);line-height:1.8">${escHtml(t.fit)}</p>
        </div>
        <div>
          <div class="pane-title" style="font-size:14px">💬 面试提醒</div>
          <p style="font-size:13px;color:var(--muted);line-height:1.8">${escHtml(t.tip)}</p>
        </div>
      </div>

      <div class="notice notice-info" style="margin-top:14px">
        结果已同步到「个人中心」（fm_profile.mbti）。岗位推荐与面试建议会参考该结果。
      </div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="startMbti()">重新测评</button>
        <button class="btn btn-primary btn-sm" onclick="switchTab('profile')">查看个人中心 →</button>
        <button class="btn btn-outline btn-sm" onclick="switchTab('career')">看看适配岗位 →</button>
      </div>
    </div>`;
}

function renderMbtiPage() {
  const intro = $("mbti-intro");
  const quiz = $("mbti-quiz");
  const result = $("mbti-result");
  if (!intro) return;
  const saved = getMbti();
  if (saved && saved.type) {
    intro.hidden = true;
    if (quiz) quiz.hidden = true;
    renderMbtiResult(saved);
    return;
  }
  intro.hidden = false;
  if (quiz) quiz.hidden = true;
  if (result) {
    result.innerHTML = `<div class="notice notice-info">还没有测评记录。点击上方「开始测评」，20 道题约需 2 分钟。</div>`;
  }
}

/* 供其他模块读取当前 MBTI（岗位推荐 / 面试建议引用） */
function currentMbti() {
  const s = getMbti();
  return s && s.type ? s : null;
}
