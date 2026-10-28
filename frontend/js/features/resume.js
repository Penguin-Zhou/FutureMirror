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

/* ============================================================
 * v36 · 简历板块升级
 *   ① 求职信息档案：JOBSEEK_DEFAULTS / getJobseek / saveJobseek
 *      / readJobseekForm / fillJobseekDemo / jobseekToText
 *   ② AI 优化建议：aiResumeAdvice（LLM 为主，规则引擎兜底）
 *   ③ 一键导出 PDF：buildResumeHtml / exportResumePdf（打印即 PDF，零依赖）
 * ============================================================ */

/* ---------- ① 求职信息档案（localStorage：fm_jobseek，按账号隔离） ---------- */
const JOBSEEK_DEFAULTS = {
  name: "", targetRole: "", city: "", degree: "", years: "",
  email: "", phone: "", skills: "", education: "", projects: "", summary: "",
};

function getJobseek() {
  let p;
  try { p = store.get("fm_jobseek", null); } catch (e) { p = null; }
  return Object.assign({}, JOBSEEK_DEFAULTS, p || {});
}

function saveJobseek(patch) {
  const next = Object.assign({}, getJobseek(), patch || {});
  try { store.set("fm_jobseek", next, true); } catch (e) {}
  try { if (typeof logDev === "function") logDev("info", "求职信息已保存"); } catch (e) {}
  return next;
}

function readJobseekForm() {
  const v = (id) => { const el = $(id); return el ? String(el.value || "").trim() : ""; };
  return saveJobseek({
    name: v("js-name"), targetRole: v("js-role"), city: v("js-city"),
    degree: v("js-degree"), years: v("js-years"), email: v("js-email"),
    phone: v("js-phone"), skills: v("js-skills"), education: v("js-edu"),
    projects: v("js-projects"), summary: v("js-summary"),
  });
}

const JOBSEEK_DEMO = {
  name: "张三", targetRole: "后端开发工程师", city: "上海", degree: "本科", years: "应届毕业生",
  email: "zhangsan@example.com", phone: "138-0000-0000",
  skills: "Java, MySQL, Redis, Docker, Linux, Kafka",
  education: "2023—2027　某某大学　软件工程　本科",
  projects: "电商秒杀系统（Java + Redis + MySQL）：主导缓存与库存扣减设计，QPS 从 200 提升到 1200；技术社团部长，组织 3 场编程 workshop。",
  summary: "具备高并发后端项目经验，熟悉缓存与数据库优化，希望在上海从事后端开发工作。",
};

function fillJobseekDemo() {
  Object.keys(JOBSEEK_DEMO).forEach((k) => {
    const map = {
      name: "js-name", targetRole: "js-role", city: "js-city", degree: "js-degree",
      years: "js-years", email: "js-email", phone: "js-phone", skills: "js-skills",
      education: "js-edu", projects: "js-projects", summary: "js-summary",
    };
    const el = $(map[k]);
    if (el) el.value = JOBSEEK_DEMO[k];
  });
  saveJobseek(JOBSEEK_DEMO);
  toast("已填入示例求职信息");
}

/* 求职信息 → 结构化纯文本（供 LLM 上下文与规则引擎复用） */
function jobseekToText(p, raw) {
  const p2 = p || getJobseek();
  const raw2 = raw || (($("resume-raw") && $("resume-raw").value.trim()) || "");
  const lines = [
    `【求职意向】目标岗位：${p2.targetRole || "未填写"}；期望城市：${p2.city || "未填写"}`,
    `【基本信息】姓名：${p2.name || "未填写"}；学历：${p2.degree || "未填写"}；经验：${p2.years || "未填写"}`,
    `【联系方式】邮箱：${p2.email || "未填写"}；电话：${p2.phone || "未填写"}`,
    `【技能标签】${p2.skills || "未填写"}`,
    `【教育背景】${p2.education || "未填写"}`,
    `【项目与经历】${p2.projects || "未填写"}`,
    `【自我评价】${p2.summary || "未填写"}`,
  ];
  if (raw2) lines.push(`【简历原文】\n${raw2}`);
  if (typeof matchResult !== "undefined" && matchResult && matchResult.gaps && matchResult.gaps.length) {
    lines.push(`【已知能力缺口】${matchResult.gaps.join("、")}`);
  }
  return lines.join("\n");
}

/* ---------- ② AI 优化建议 ---------- */
const RESUME_ADVICE_SYSTEM = `你是资深招聘顾问与简历优化专家。请基于用户的求职信息与简历内容，用 Markdown 输出以下五部分：
## 一、岗位匹配诊断（目标岗位 vs 现有经历，给出匹配度判断与理由）
## 二、简历结构优化（3-5 条，指出该增删哪些板块）
## 三、逐条改写建议（每条给出「原文 → 问题 → 改写后」，改写后必须带量化占位符）
## 四、面试风险预警（3 条，指出面试官最可能追问的薄弱点）
## 五、7 天提升清单（按天给出可执行的补强动作）
要求：结合中国校招/社招语境，语言具体、可落地，避免空泛套话。`;

/* 规则引擎兜底建议（未接入模型或调用失败时使用，保证功能不空转） */
function ruleResumeAdvice(p, raw) {
  const p2 = p || getJobseek();
  const text = raw || (($("resume-raw") && $("resume-raw").value.trim()) || "");
  const body = text || p2.projects || "";
  const r = body ? analyzeResumeText(body) : null;
  const jdSkills = (p2.skills || "").split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
  const hit = jdSkills.filter((s) => SKILL_DICT.includes(s));
  const miss = jdSkills.filter((s) => !SKILL_DICT.includes(s));
  const items = [];
  items.push(`<div class="evidence"><span class="badge badge-green">岗位匹配</span><p>目标岗位「${escHtml(p2.targetRole || "未填写")}」：已识别技能 ${hit.length} 项${hit.length ? "（" + escHtml(hit.join("、")) + "）" : ""}${miss.length ? "；未被技能词典收录 " + miss.length + " 项，建议改写为行业通用写法" : ""}。</p></div>`);
  if (r) {
    const weak = r.dims.filter((d) => d.score < 60);
    items.push(`<div class="evidence"><span class="badge ${weak.length ? "badge-red" : "badge-green"}">六维诊断</span><p>健康度 ${r.total}/100${weak.length ? "，薄弱维度：" + escHtml(weak.map((d) => d.name).join("、")) : "，各维度均达标"}。</p></div>`);
    if (r.rewrites.length) {
      items.push(`<div class="evidence"><span class="badge badge-red">改写建议</span>${r.rewrites.slice(0, 3).map((w) => `<p style="margin-top:6px"><b>原文：</b><q>${escHtml(w.original)}</q><br><b>改写：</b>${escHtml(w.suggestion)}</p>`).join("")}</div>`);
    }
  } else {
    items.push(`<div class="evidence"><span class="badge badge-red">内容缺失</span><p>尚未填写简历原文或项目经历，建议先粘贴简历或填写「项目与经历」。</p></div>`);
  }
  items.push(`<div class="evidence"><span class="badge">面试风险</span><p>面试官通常围绕「量化数据真实性」「技术选型理由」「难点与权衡」三点追问，请为每段经历准备这三类应答。</p></div>`);
  return `<div class="report-grid"><div>${items.join("")}</div><div><div class="pane-title">说明</div><p class="hint">当前为规则引擎建议（未接入模型或调用失败时的兜底）。接入 API Key 或连接后端后将由真实模型生成个性化建议。</p></div></div>`;
}

async function aiResumeAdvice() {
  if (!requireLogin()) return;
  const p = readJobseekForm();
  const raw = ($("resume-raw") && $("resume-raw").value.trim()) || "";
  if (!p.targetRole && !p.projects && !raw) {
    toast("请先填写求职信息（至少目标岗位或项目经历）");
    return;
  }
  const btn = $("js-advice-btn");
  const box = $("js-advice-result");
  if (!box) return;
  const hasLLM = (typeof llm !== "undefined" && llm) ||
    (typeof fmApi !== "undefined" && fmApi && fmApi.backendReady());
  if (btn) { btn.disabled = true; btn.textContent = "⏳ AI 分析中…"; }

  if (!hasLLM) {
    box.innerHTML = ruleResumeAdvice(p, raw);
    if (btn) { btn.disabled = false; btn.textContent = "🤖 AI 优化建议"; }
    toast("未接入模型，已给出规则引擎建议");
    return;
  }

  const modelLabel = (typeof fmApi !== "undefined" && fmApi && fmApi.backendReady())
    ? `后端 ${fmApi.backendModel()}`
    : (typeof llm !== "undefined" && llm ? llm.model : "模型");
  box.innerHTML = `<div class="evidence fade-up"><b>（真实模型 · ${escHtml(modelLabel)}）</b>正在生成优化建议…<div id="js-advice-stream" style="white-space:pre-wrap;margin-top:8px;font-size:13px;line-height:1.7"></div></div>`;
  const stream = $("js-advice-stream");
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 60000);
  let full = "";
  try {
    await streamChat([
      { role: "system", content: RESUME_ADVICE_SYSTEM },
      { role: "user", content: jobseekToText(p, raw) },
    ], (piece) => { full += piece; if (stream) stream.textContent = full; }, ctrl.signal);
    if (stream) stream.textContent = full;
    toast("AI 优化建议已生成");
  } catch (e) {
    const msg = (e && e.message) ? e.message : String(e);
    box.innerHTML = ruleResumeAdvice(p, raw) +
      `<div class="notice notice-info" style="margin-top:10px">模型调用失败（${escHtml(msg)}），已展示规则引擎建议。</div>`;
    toast("模型调用失败，已回退规则引擎");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "🤖 AI 优化建议"; }
  }
}

/* ---------- ③ 一键导出 PDF（构建打印视图 + window.print，零依赖） ---------- */
function buildResumeHtml(p) {
  const p2 = p || getJobseek();
  const raw = ($("resume-raw") && $("resume-raw").value.trim()) || "";
  const skills = (p2.skills || "").split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
  const esc2 = (s) => escHtml(String(s == null ? "" : s));
  const block = (title, content) => (content
    ? `<section class="sec"><h2>${esc2(title)}</h2><div class="body">${esc2(content).replace(/\n/g, "<br>")}</div></section>`
    : "");
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>${esc2(p2.name || "简历")} · ${esc2(p2.targetRole || "求职简历")}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Songti SC", "SimSun", serif; color: #1C1913; background: #F4F1E8; margin: 0; padding: 24px; }
  .sheet { max-width: 780px; margin: 0 auto; background: #fff; padding: 28px 32px; border: 1px solid #D8D2BF; }
  header { border-bottom: 2px solid #1C1913; padding-bottom: 12px; margin-bottom: 18px; }
  h1 { font-size: 24px; margin: 0 0 6px; letter-spacing: 1px; }
  .meta { font-size: 12px; color: #6B6555; line-height: 1.8; }
  .meta b { color: #BE3A1E; font-weight: 400; }
  .sec { margin-bottom: 16px; }
  .sec h2 { font-size: 13px; letter-spacing: 2px; color: #1C1913; border-left: 3px solid #BE3A1E; padding-left: 8px; margin: 0 0 8px; }
  .body { font-size: 12.5px; line-height: 1.85; color: #33302A; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag { font-size: 11.5px; border: 1px solid #B9B29A; padding: 2px 8px; background: #F4F1E8; }
  footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #D8D2BF; font-size: 10.5px; color: #8A8474; text-align: center; }
  @media print { body { background: #fff; padding: 0; } .sheet { border: 0; } }
</style></head>
<body><div class="sheet">
  <header>
    <h1>${esc2(p2.name || "（未填写姓名）")}</h1>
    <div class="meta">
      <b>求职意向</b> ${esc2(p2.targetRole || "未填写")}　|　<b>城市</b> ${esc2(p2.city || "未填写")}<br>
      <b>学历</b> ${esc2(p2.degree || "未填写")}　|　<b>经验</b> ${esc2(p2.years || "未填写")}<br>
      <b>邮箱</b> ${esc2(p2.email || "未填写")}　|　<b>电话</b> ${esc2(p2.phone || "未填写")}
    </div>
  </header>
  ${skills.length ? `<section class="sec"><h2>技能标签</h2><div class="tags">${skills.map((s) => `<span class="tag">${esc2(s)}</span>`).join("")}</div></section>` : ""}
  ${block("教育背景", p2.education)}
  ${block("项目与经历", p2.projects)}
  ${block("自我评价", p2.summary)}
  ${raw ? block("简历原文", raw) : ""}
  <footer>由 面镜 FutureMirror 生成 · 内容由本人填写，导出前请核对真实性</footer>
</div></body></html>`;
}

function exportResumePdf() {
  if (!requireLogin()) return;
  const p = readJobseekForm();
  if (!p.name && !p.targetRole && !p.projects) {
    toast("请先填写求职信息，再导出 PDF");
    return;
  }
  const html = buildResumeHtml(p);
  let w = null;
  try { w = window.open("", "_blank"); } catch (e) { w = null; }
  if (!w) {
    // 弹出被拦截时降级：用隐藏 iframe 打印，保证导出路径不中断
    try {
      const old = document.getElementById("fm-print-frame");
      if (old) old.remove();
      const fr = document.createElement("iframe");
      fr.id = "fm-print-frame";
      fr.style.position = "fixed";
      fr.style.right = "0";
      fr.style.bottom = "0";
      fr.style.width = "0";
      fr.style.height = "0";
      fr.style.border = "0";
      document.body.appendChild(fr);
      const d = fr.contentDocument || fr.contentWindow.document;
      d.open(); d.write(html); d.close();
      setTimeout(() => {
        try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e2) { toast("导出失败，请允许弹出窗口后重试"); }
      }, 400);
      toast("已生成简历，正在唤起打印（可另存为 PDF）");
      return;
    } catch (e3) {
      toast("导出失败：" + ((e3 && e3.message) || e3));
      return;
    }
  }
  try {
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try { w.focus(); w.print(); } catch (e4) { toast("唤起打印失败，请手动 Ctrl+P"); }
    }, 400);
    toast("已生成简历，正在唤起打印（可另存为 PDF）");
    try { logDev("info", "简历 PDF 导出：" + (p.name || "未署名")); } catch (e5) {}
  } catch (e6) {
    toast("导出失败：" + ((e6 && e6.message) || e6));
  }
}


/* ---------- ①b 求职档案可视化 v37：完整度环形 + 字段清单 ----------
 * 目的：让用户一眼看出「还差什么」，而不是面对 11 个空输入框无从下手。
 * 环形显示加权完整度，下方 chip 清单逐项标注已填 / 待填（核心项权重更高）。 */
const JOBSEEK_FIELDS = [
  { key: "name", label: "姓名", w: 1, core: true },
  { key: "targetRole", label: "目标岗位", w: 2, core: true },
  { key: "city", label: "期望城市", w: 1, core: false },
  { key: "degree", label: "学历", w: 1, core: true },
  { key: "years", label: "工作经验", w: 1, core: true },
  { key: "email", label: "邮箱", w: 1, core: true },
  { key: "phone", label: "电话", w: 1, core: false },
  { key: "skills", label: "技能标签", w: 3, core: true },
  { key: "education", label: "教育背景", w: 2, core: true },
  { key: "projects", label: "项目经历", w: 3, core: true },
  { key: "summary", label: "自我评价", w: 2, core: false },
];

/* 加权完整度：核心字段权重更高，避免「填了姓名就显示 30%」的误导 */
function jobseekCompleteness(p) {
  const d = p || getJobseek();
  let got = 0, all = 0, coreGot = 0, coreAll = 0;
  const missing = [];
  JOBSEEK_FIELDS.forEach((f) => {
    const has = !!(d[f.key] && String(d[f.key]).trim());
    all += f.w;
    if (has) got += f.w;
    if (f.core) { coreAll += f.w; if (has) coreGot += f.w; }
    if (!has) missing.push(f.label);
  });
  return {
    pct: all ? Math.round((got / all) * 100) : 0,
    corePct: coreAll ? Math.round((coreGot / coreAll) * 100) : 0,
    missing: missing,
    filled: JOBSEEK_FIELDS.length - missing.length,
    total: JOBSEEK_FIELDS.length,
  };
}

function renderJobseekGauge() {
  const box = $("js-gauge");
  if (!box) return null;
  const p = getJobseek();
  const c = jobseekCompleteness(p);
  const chips = JOBSEEK_FIELDS.map((f) => {
    const has = !!(p[f.key] && String(p[f.key]).trim());
    return `<span class="js-chip ${has ? "ok" : "miss"}" title="${escHtml(f.label)}">${has ? "✓" : "○"} ${escHtml(f.label)}</span>`;
  }).join("");
  const verdict = c.pct >= 85 ? "信息齐全，可直接导出高质量简历"
    : c.pct >= 55 ? "基本可用，补齐核心项后建议更准"
    : "请先补齐核心信息，AI 建议会更贴合";
  box.innerHTML = `
    <div class="js-gauge">
      <div class="js-gauge-ring">${donutSVG(c.pct, { label: "档案完整度", aria: "求职档案完整度 " + c.pct + "%" })}</div>
      <div class="js-gauge-side">
        <div class="js-gauge-meta">
          <span>已填 <b>${c.filled}</b> / ${c.total} 项</span>
          <span>核心项 <b>${c.corePct}%</b></span>
          <span class="js-gauge-verdict">${escHtml(verdict)}</span>
        </div>
        <div class="js-chips">${chips}</div>
        <p class="hint" style="margin-top:8px">${c.missing.length
          ? "待补：" + escHtml(c.missing.join("、"))
          : "全部字段已填写完成。"}</p>
      </div>
    </div>`;
  return c;
}

/* 表单 → 本地存档 → 仪表实时刷新（input 事件冒泡到容器，无需逐项绑定） */
function syncJobseekForm() {
  readJobseekForm();
  renderJobseekGauge();
}

/* 页面进入时回填已存档案，避免「切走再回来表单空了」 */
function renderJobseekForm() {
  const map = {
    name: "js-name", targetRole: "js-role", city: "js-city", degree: "js-degree",
    years: "js-years", email: "js-email", phone: "js-phone", skills: "js-skills",
    education: "js-edu", projects: "js-projects", summary: "js-summary",
  };
  const p = getJobseek();
  Object.keys(map).forEach((k) => {
    const el = $(map[k]);
    if (el && p[k]) el.value = String(p[k]);
  });
  renderJobseekGauge();
}
