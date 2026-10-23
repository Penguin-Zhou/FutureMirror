"use strict";
/* ============================================================
 * 12. 简历优化工作台（6 维度规则分析）
 * ============================================================ */
const RESUME_DEMO = `本人性格开朗，善于沟通，有较强的学习能力和团队合作精神。
在校期间参与了电商秒杀系统的开发，负责后端接口，优化了系统性能。
熟悉 React、Node.js、MySQL 等技术栈。
获得过校级奖学金，担任过社团部长。`;

const RESUME_DIMENSIONS = [
  { key: "quantify", name: "量化成果", weight: 25, icon: "📊", tip: "每段经历至少包含 1 个可量化数据（QPS、百分比、人数、金额）" },
  { key: "star", name: "STAR 结构", weight: 20, icon: "🏗️", tip: "按 Situation→Task→Action→Result 组织每段经历" },
  { key: "action", name: "动词开头", weight: 15, icon: "⚡", tip: "每条经历用强动词开头（主导/搭建/优化/推动），避免「参与了」「负责了」" },
  { key: "match", name: "岗位匹配", weight: 20, icon: "🎯", tip: "技能与经历应聚焦目标岗位 JD 关键词，做到一岗一简历" },
  { key: "concise", name: "精炼度", weight: 10, icon: "✂️", tip: "避免空泛的自我评价，总篇幅控制在 1 页 A4 以内" },
  { key: "skill", name: "技能可信度", weight: 10, icon: "🔧", tip: "「熟悉」需有项目佐证，避免堆砌与岗位无关的技能" },
];

function analyzeResumeText(text) {
  const len = text.replace(/\s/g, "").length;
  const digits = (text.match(/\d+(\.\d+)?%?/g) || []).length;
  const strongVerbs = (text.match(/主导|搭建|优化|推动|设计|实现|重构|提升|降低|牵头|带领|产出|落地/g) || []).length;
  const weakVerbs = (text.match(/参与了|负责了|协助了|帮忙|做了一些/g) || []).length;
  const starWords = (text.match(/背景|目标|通过|最终|结果|因此|为了|方案|决策/g) || []).length;
  const vague = (text.match(/性格开朗|善于沟通|学习能力强|团队合作|认真负责|积极主动/g) || []).length;
  const skills = SKILL_DICT.filter(s => text.includes(s));
  const lines = text.split("\n").filter(l => l.trim());

  const clamp = v => Math.max(20, Math.min(98, Math.round(v)));
  const dims = [
    { ...RESUME_DIMENSIONS[0], score: clamp(30 + digits * 14) },
    { ...RESUME_DIMENSIONS[1], score: clamp(35 + starWords * 10) },
    { ...RESUME_DIMENSIONS[2], score: clamp(55 + strongVerbs * 12 - weakVerbs * 10) },
    { ...RESUME_DIMENSIONS[3], score: matchResult
        ? clamp(40 + skills.length * 8 + (matchResult.gaps.length === 0 ? 20 : 0))
        : clamp(45 + skills.length * 8) },
    { ...RESUME_DIMENSIONS[4], score: clamp(90 - vague * 12 - Math.max(0, (len - 500) / 20)) },
    { ...RESUME_DIMENSIONS[5], score: clamp(50 + skills.length * 6) },
  ];

  // 逐条改写建议：检测无量化行与弱动词行
  const rewrites = [];
  lines.forEach(line => {
    if (line.length < 10) return;
    if (!/\d/.test(line)) {
      rewrites.push({
        original: line.slice(0, 60),
        issue: "缺少量化数据",
        suggestion: line.replace(/[，。]$/, "") + "，[补充具体数据：如 QPS 从 X 提升到 Y、覆盖 N 名用户、效率提升 Z%]",
      });
    }
    if (/参与了|负责了|协助了/.test(line)) {
      rewrites.push({
        original: line.slice(0, 60),
        issue: "动词力度弱，未突出个人贡献",
        suggestion: line
          .replace(/参与了/, "主导")
          .replace(/负责了/, "独立完成")
          .replace(/协助了/, "协同推动")
          + "，[说明你的具体职责与关键决策]",
      });
    }
  });

  const total = Math.round(dims.reduce((s, d) => s + d.score * d.weight / 100, 0));
  return { dims, total, rewrites, skills, gaps: (matchResult && matchResult.gaps) || [] };
}

function fillResumeDemo() { $("resume-raw").value = RESUME_DEMO; }

function resumeRingSVG(score) {
  const r = 46, c = 2 * Math.PI * r;
  const color = score >= 80 ? "var(--green)" : score >= 60 ? "var(--brand)" : "var(--red)";
  return `<svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="简历健康度 ${score} 分">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="10"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}"
      stroke-dashoffset="${(c * (1 - score / 100)).toFixed(1)}" transform="rotate(-90 60 60)"
      style="transition:stroke-dashoffset 1s ease"/>
    <text x="60" y="56" text-anchor="middle" dominant-baseline="central"
      font-size="26" font-weight="700" fill="var(--ink)">${score}</text>
    <text x="60" y="76" text-anchor="middle" font-size="10" fill="var(--faint)">健康度</text>
  </svg>`;
}

function analyzeResume() {
  if (!requireLogin()) return;
  const text = $("resume-raw").value.trim();
  if (!text) { toast("请先粘贴简历内容，或点「填入示例」体验"); return; }
  const r = analyzeResumeText(text);

  $("resume-score-panel").innerHTML = `
    <div style="display:grid;place-items:center;padding:10px 0">
      ${resumeRingSVG(r.total)}
      <p class="hint" style="margin-top:8px">简历健康度 / 100</p>
    </div>
    <div class="live-metrics" style="margin-top:12px">
      <div class="metric"><span>识别技能</span><b>${r.skills.length}</b></div>
      <div class="metric"><span>改写建议</span><b>${r.rewrites.length}</b></div>
      <div class="metric"><span>能力缺口</span><b>${r.gaps.length}</b></div>
    </div>`;

  $("resume-result").innerHTML = `
    <div class="report-grid">
      <div>
        <div class="pane-title">六维诊断</div>
        ${r.dims.map(d => `
          <div class="dim-row">
            <div class="dim-head">
              <b>${d.icon} ${d.name} <span style="font-weight:400;color:var(--faint);font-size:11px">权重 ${d.weight}%</span></b>
              <span style="color:var(--muted)">${d.score}</span>
            </div>
            <div class="dim-bar"><div style="width:${d.score}%"></div></div>
            <div class="dim-comment">${d.score < 60 ? "⚠️ " : "✅ "}${d.tip}</div>
          </div>`).join("")}
      </div>
      <div>
        <div class="pane-title">逐条改写建议</div>
        ${r.rewrites.length
          ? r.rewrites.slice(0, 5).map(w => `
              <div class="evidence">
                <span class="badge badge-red">${escHtml(w.issue)}</span>
                <p style="margin-top:6px"><b>原文：</b><q>${escHtml(w.original)}</q></p>
                <p><b>改写：</b>${escHtml(w.suggestion)}</p>
              </div>`).join("")
          : '<div class="evidence"><span class="badge badge-green">结构较好</span><p>未检测到明显的量化缺失或动词问题，建议进一步用 LLM 深度打磨。</p></div>'}
      </div>
    </div>`;

  $("resume-result").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* 用真实 LLM 深度改写（需已接入 Key） */
async function optimizeWithLLM() {
  if (!requireLogin()) return;
  // v22.1：后端在线时同样可以深度改写（Key 在服务端）
  if (!llm && !fmApi.backendReady()) { toast("请先连接后端或接入 API Key"); return; }
  const text = $("resume-raw").value.trim();
  if (!text) { toast("请先粘贴简历内容"); return; }
  const modelLabel = fmApi.backendReady() ? `后端 ${fmApi.backendModel()}` : (llm ? llm.model : "模型");
  const btn = $("llm-optimize-btn");
  btn.disabled = true; btn.textContent = "⏳ 改写中…";
  const target = $("resume-result");
  target.innerHTML = `<div class="evidence fade-up"><b>（真实模型 · ${modelLabel}）</b>正在分析并改写…<div id="resume-stream" style="white-space:pre-wrap;margin-top:8px;font-size:13px;line-height:1.7"></div></div>`;
  const stream = $("resume-stream");
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 60000);
  let full = "";
  try {
    await streamChat([
      { role: "system", content: `你是资深简历顾问。请对用户简历做以下分析并用 Markdown 输出：
## 总体评价（2 句话）
## 逐条改写（每条给出原文→问题→改写后，改写后必须包含量化数据占位符）
## 缺失的关键要素
## 针对目标岗位的建议（如果有 JD 则结合）` },
      { role: "user", content: `简历原文：\n${text}\n\n${matchResult ? "目标岗位缺口：" + matchResult.gaps.join("、") : ""}` },
    ], piece => { full += piece; stream.textContent = full; }, ctrl.signal);
    stream.textContent = full;
    toast("深度改写完成");
  } catch (e) {
    toast("模型调用失败：" + e.message);
    target.innerHTML = `<div class="notice notice-info">模型调用失败（${e.message}），已展示规则引擎分析结果。</div>`;
    analyzeResume();
  } finally {
    btn.disabled = false; btn.textContent = "🤖 用真实模型深度改写";
  }
}

