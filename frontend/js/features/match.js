"use strict";
/* ============================================================
 * 4. 简历匹配（启发式解析 + 文件上传展示）
 * ============================================================ */
const SKILL_DICT = ["React","Vue","TypeScript","JavaScript","Node.js","Python","Java","Go","C++","SQL","MySQL","Redis","Docker","Kubernetes","Git","Linux","机器学习","深度学习","PyTorch","TensorFlow","LLM","RAG","Prompt","Agent","Next.js","Tailwind","Figma","产品设计","项目管理","数据分析","消息队列","Kafka"];

const DEMO_RESUME = `张三，2027 届本科，软件工程专业。
技能：熟悉 React、TypeScript、Node.js、MySQL；了解 Redis 与 Docker；
课程项目：电商秒杀系统（Node.js + Redis + MySQL），负责后端接口与缓存设计，QPS 从 200 提升到 1200；
校园经历：技术社团部长，组织过 3 场编程 workshop。`;

const DEMO_JD = `后端开发工程师（校招）
职责：参与高并发后端服务的设计与开发。
要求：熟练掌握 Java/Go 至少一门语言；熟悉 MySQL 索引与事务、Redis 缓存设计；
了解分布式系统基本原理，有高并发场景经验；熟悉 Docker 与 Linux；
加分项：了解消息队列（Kafka/RocketMQ）。`;

let matchResult = null;   // 在 bootApp() 中按当前用户加载

function fillDemo() {
  $("resume").value = DEMO_RESUME;
  // v11：示例数据自动选中「后端开发工程师」（对应 DEMO_JD）
  const sel = $("jd-select");
  if (!sel) { toast("目标岗位选择器未加载"); return; }
  sel.value = "backend";
  onJdSelectChange(true);   // 不立即 analyze（用户需自己点按钮，避免"填示例→立刻出报告"过于突兀）
}

function heuristicParse(resumeText, jdText) {
  const resumeSkills = SKILL_DICT.filter(s => resumeText.includes(s));
  const jdSkills = SKILL_DICT.filter(s => jdText.includes(s));
  const gaps = jdSkills.filter(s => !resumeSkills.includes(s));
  const matchScore = jdSkills.length > 0
    ? Math.round(100 * (jdSkills.length - gaps.length) / jdSkills.length)
    : 60;
  return { matchScore, skills: resumeSkills, gaps, suggestions: [
    ...gaps.slice(0, 3).map(g => `补强「${g}」：建议通过课程 + 小项目实战，并在简历中补充可量化成果`),
    "用 STAR 结构重写项目经历，每条至少包含一个量化结果",
  ]};
}

function ringSVG(score) {
  const r = 42, c = 2 * Math.PI * r;
  return `<svg width="110" height="110" viewBox="0 0 110 110" role="img" aria-label="匹配分 ${score} 分">
    <circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--line)" stroke-width="9"/>
    <circle class="ring-anim" id="ring-fill" cx="55" cy="55" r="${r}" fill="none" stroke="var(--brand)" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}" transform="rotate(-90 55 55)"/>
    <text x="55" y="50" text-anchor="middle" dominant-baseline="central" font-size="24" font-weight="700" fill="var(--ink)">${score}</text>
    <text x="55" y="72" text-anchor="middle" font-size="10" fill="var(--faint)">匹配分 / 100</text>
  </svg>`;
}

function analyze() {
  if (!requireLogin()) return;
  const resume = $("resume").value, jd = $("jd").value;
  const err = $("match-error");
  if (!resume.trim() || !jd.trim()) {
    err.textContent = "请先填写简历与 JD（或点击「填入示例数据」）再生成匹配报告。";
    err.classList.add("show");
    return;
  }
  err.classList.remove("show");
  const p = heuristicParse(resume, jd);
  matchResult = p;
  store.set("fm_match", p);
  $("match-result").innerHTML = `
    <div class="match-result card fade-up" style="padding:16px;margin-top:16px">
      ${ringSVG(p.matchScore)}
      <div class="match-body">
        <div style="margin-bottom:10px"><b style="font-size:13.5px">✅ 已具备技能</b><br>
          ${p.skills.length ? p.skills.map(s => `<span class="chip chip-green">${escHtml(s)}</span>`).join("") : '<span style="color:var(--faint);font-size:13px">未识别到</span>'}</div>
        <div style="margin-bottom:10px"><b style="font-size:13.5px">⚠️ 能力缺口</b><br>
          ${p.gaps.length ? p.gaps.map(g => `<span class="chip chip-red">${escHtml(g)}</span>`).join("") : '<span style="color:var(--faint);font-size:13px">无明显缺口</span>'}</div>
        <div><b style="font-size:13.5px">💡 补强建议</b>
          <ul style="padding-left:18px;font-size:13px;color:var(--muted);line-height:1.9">${p.suggestions.map(s => `<li>${escHtml(s)}</li>`).join("")}</ul></div>
        <div style="margin-top:10px"><button class="btn btn-primary btn-sm" onclick="switchTab('interview')">开始多 Agent 模拟面试 →</button></div>
      </div>
    </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const ring = $("ring-fill");
    if (ring) ring.style.strokeDashoffset = (2 * Math.PI * 42 * (1 - p.matchScore / 100)).toFixed(1);
  }));
}

/* 简历文件上传：.txt 直接读取；.pdf 端侧解析文本并填入；其余格式展示形态 */
$("resume-upload").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const box = $("resume-file");
  const size = (f.size / 1024).toFixed(1);
  box.classList.add("has-file");
  if (/\.txt$/i.test(f.name)) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result).slice(0, 6000);
      $("resume").value = text;
      store.set("fm_resume", text);   // ⭐ 编程式赋值不触发 input 事件，需手动持久化，否则刷新丢失
      box.textContent = `✅ 已读取 ${f.name}（${size} KB）——文本已填入左侧简历框`;
    };
    reader.onerror = () => { box.textContent = `⚠️ ${f.name} 读取失败，请重试或手动粘贴文本`; };
    reader.readAsText(f);
    return;
  }
  if (/\.pdf$/i.test(f.name)) {
    box.textContent = `⏳ 正在端侧解析 ${f.name}（${size} KB）的 PDF 文本……`;
    try {
      const { text, pages } = await parsePdfText(f);
      if (!text.trim()) {
        box.textContent = `⚠️ ${f.name} 未提取到文本（可能是扫描件 / 图片型 PDF）。可转存为 .txt 后上传，或手动粘贴文本到左侧简历框。`;
        return;
      }
      const trimmed = text.slice(0, 6000);
      $("resume").value = trimmed;
      store.set("fm_resume", trimmed);
      box.textContent = `✅ 已解析 ${f.name}（${size} KB，${pages} 页）——文本已填入左侧简历框，可点击「生成匹配报告」`;
    } catch (err) {
      box.textContent = `⚠️ PDF 解析失败：${err && err.message ? err.message : err}。可改用 .txt 上传，或手动粘贴文本。`;
    }
    return;
  }
  /* 其他格式（含 .docx）：演示版读取 .txt、解析 .pdf，其余仅展示文件形态 */
  box.textContent = `✅ 已选择 ${f.name}（${size} KB）——演示版已支持 PDF 文本端侧解析；其余格式可转存为 .pdf 或 .txt 后再上传`;
});

/* ---------- PDF 端侧解析（同源自托管优先 + CDN 兜底，沿用面试模块 face-api 模式） ---------- */
const PDFJS_VERSION = "3.11.174";
const PDFJS_LIB_LOCAL = "models/pdfjs/pdf.min.js";
const PDFJS_LIB_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`;
const PDFJS_WORKER_LOCAL = "models/pdfjs/pdf.worker.min.js";
const PDFJS_WORKER_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
let _pdfjsLibSource = null;   // "local" | "cdn"，用于决定同源 worker 路径

function loadScriptOncePdf(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-fm-src="${src}"]`);
    if (existing) {
      const tick = () => (window.pdfjsLib ? resolve(window.pdfjsLib) : setTimeout(tick, 30));
      tick();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.dataset.fmSrc = src;
    s.onload = () => (window.pdfjsLib ? resolve(window.pdfjsLib) : reject(new Error("pdfjs 未挂载：" + src)));
    s.onerror = () => reject(new Error("pdfjs 加载失败：" + src));
    document.head.appendChild(s);
  });
}

async function ensurePdfJs() {
  if (window.pdfjsLib && _pdfjsLibSource) return window.pdfjsLib;
  if (window.pdfjsLib && !_pdfjsLibSource) _pdfjsLibSource = "local"; // 已在别处注入
  if (_pdfjsLibSource) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      _pdfjsLibSource === "local" ? PDFJS_WORKER_LOCAL : PDFJS_WORKER_CDN;
    return window.pdfjsLib;
  }
  try {
    await loadScriptOncePdf(PDFJS_LIB_LOCAL);
    _pdfjsLibSource = "local";
  } catch (e) {
    await loadScriptOncePdf(PDFJS_LIB_CDN);
    _pdfjsLibSource = "cdn";
  }
  if (!window.pdfjsLib) throw new Error("PDF 解析库加载失败（同源与 CDN 均不可用）");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    _pdfjsLibSource === "local" ? PDFJS_WORKER_LOCAL : PDFJS_WORKER_CDN;
  return window.pdfjsLib;
}

async function parsePdfText(file) {
  const pdfjsLib = await ensurePdfJs();
  const data = await (file.arrayBuffer
    ? file.arrayBuffer()
    : new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(new Uint8Array(r.result));
        r.onerror = rej;
        r.readAsArrayBuffer(file);
      }));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str || "").join(" ") + "\n";
  }
  return {
    text: text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
    pages: doc.numPages,
  };
}


/* ============================================================
 * v36 · 对话式匹配增强（4 轮追问 → 补充证据 → 修正匹配度）
 *   ① MATCH_QA_STEPS：围绕量化结果 / 技能熟练度 / 缺口补强 / 隐藏经历
 *   ② startMatchQa / submitMatchQaAnswer / finishMatchQa / renderMatchQa
 *   ③ applyQaEvidence：从回答中提取技能证据与量化证据，重算覆盖式匹配分
 *   匹配分口径与 heuristicParse 一致：JD 技能覆盖率（确定性可解释）
 * ============================================================ */

const MATCH_QA_STEPS = [
  { key: "highlight", q: "第 1 问：你最拿得出手的一段经历是什么？请尽量带上量化结果（如 QPS、用户量、提升百分比）。" },
  { key: "skills", q: "第 2 问：针对目标岗位的要求，你实际用过哪些技术？分别用了多久、熟练度如何？" },
  { key: "gap", q: "第 3 问：岗位要求中你目前不具备的技能，有没有相关的学习或项目经验可以补上？" },
  { key: "extra", q: "第 4 问：还有哪些简历里没写、但与岗位相关的经历（竞赛 / 开源 / 实习 / 课程设计）？" },
];

let matchQaState = null;

/* JD 技能集合：优先取当前 JD 文本，回退为「已具备 + 缺口」并集 */
function currentJdSkills() {
  const jdText = ($("jd") && $("jd").value ? $("jd").value : "");
  const fromJd = SKILL_DICT.filter((s) => jdText.indexOf(s) >= 0);
  if (fromJd.length) return fromJd;
  if (matchResult) return (matchResult.skills || []).concat(matchResult.gaps || []);
  return [];
}

/* 覆盖率口径重算（与 heuristicParse 完全一致） */
function recomputeMatchScore(jdSkills) {
  if (!jdSkills || !jdSkills.length) return matchResult ? matchResult.matchScore : 0;
  const covered = jdSkills.filter((s) => (matchResult.skills || []).indexOf(s) >= 0).length;
  return Math.round((covered / jdSkills.length) * 100);
}

/* 从一轮回答中提取证据：技能命中 → 补 skills / 消 gaps；数字 → 量化证据 */
function applyQaEvidence(text) {
  const t = String(text || "");
  const added = [];
  SKILL_DICT.forEach((s) => {
    if (t.indexOf(s) >= 0 && matchResult.skills.indexOf(s) < 0) {
      matchResult.skills.push(s);
      added.push(s);
    }
  });
  const closed = [];
  matchResult.gaps = (matchResult.gaps || []).filter((g) => {
    if (added.indexOf(g) >= 0 || t.indexOf(g) >= 0) { closed.push(g); return false; }
    return true;
  });
  const quantified = (t.match(/\d+(\.\d+)?\s*(%|％|倍|QPS|qps|人|万|条|次|ms|秒|天)/g) || []).length;
  const jdSkills = currentJdSkills();
  const next = recomputeMatchScore(jdSkills);
  const delta = next - matchResult.matchScore;
  matchResult.matchScore = next;
  matchResult.qaEvidence = (matchResult.qaEvidence || 0) + (added.length + quantified);
  try { store.set("fm_match", matchResult); } catch (e) {}
  return { added, closed, quantified, delta, score: next };
}

function startMatchQa() {
  if (!requireLogin()) return;
  if (!matchResult) { toast("请先点击「⚡ 生成匹配报告」"); return; }
  matchQaState = {
    i: 0,
    log: [],
    baseScore: matchResult.matchScore,
    baseGaps: (matchResult.gaps || []).length,
    added: [],
    closed: [],
    quantified: 0,
    scoreTrail: [{ label: "初始", v: matchResult.matchScore }],
  };
  const box = $("match-qa");
  if (box) box.hidden = false;
  appendMatchQaMsg("ai", "🪞 匹配增强助手：简历往往写不下全部信息。我用 4 个问题帮你把「没写出来的证据」补齐，每答一题就会实时修正匹配度。");
  appendMatchQaMsg("ai", MATCH_QA_STEPS[0].q);
  renderMatchQa();
}

function appendMatchQaMsg(role, text) {
  if (!matchQaState) return;
  matchQaState.log.push({ role, text });
}

function renderMatchQa() {
  const box = $("match-qa-body");
  if (!box || !matchQaState) return;
  const done = matchQaState.i >= MATCH_QA_STEPS.length;
  const trail = Array.isArray(matchQaState.scoreTrail) ? matchQaState.scoreTrail : [];
  const chart = trail.length >= 2
    ? `<div class="mqa-chart">
         <div class="pane-title" style="font-size:12.5px">📈 匹配度演进（虚线为初始基线）</div>
         ${trendSVG(trail, { aria: "对话式匹配度演进", height: 140 })}
       </div>`
    : "";
  box.innerHTML = `
    <div class="mqa-log">
      ${matchQaState.log.map((m) => `<div class="mqa-msg ${m.role}">${escHtml(m.text)}</div>`).join("")}
    </div>
    ${chart}
    ${done ? "" : `
    <div class="mqa-input-row">
      <textarea id="mqa-input" rows="2" placeholder="输入你的回答…（可随时点「结束并应用」）" aria-label="匹配增强回答"></textarea>
      <button class="btn btn-primary btn-sm" onclick="submitMatchQaAnswer()">提交</button>
    </div>
    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
      <span class="hint" style="margin-top:0">第 ${matchQaState.i + 1} / ${MATCH_QA_STEPS.length} 问</span>
      <button class="btn btn-outline btn-sm" onclick="finishMatchQa()">结束并应用 →</button>
    </div>`}`;
}

function submitMatchQaAnswer() {
  if (!matchQaState) { toast("请先点击「💬 对话式增强匹配」"); return; }
  const input = $("mqa-input");
  const text = input ? String(input.value || "").trim() : "";
  if (!text) { toast("请先输入内容"); return; }
  if (input) input.value = "";
  appendMatchQaMsg("user", text);
  const r = applyQaEvidence(text);
  if (matchQaState && Array.isArray(matchQaState.scoreTrail)) {
    matchQaState.scoreTrail.push({ label: "第 " + (matchQaState.i + 1) + " 轮", v: r.score });
  }
  matchQaState.added = matchQaState.added.concat(r.added);
  matchQaState.closed = matchQaState.closed.concat(r.closed);
  matchQaState.quantified += r.quantified;
  const deltaTxt = r.delta > 0 ? `（匹配度 +${r.delta} → ${r.score}%）` : r.delta < 0 ? `（匹配度 ${r.delta} → ${r.score}%）` : `（匹配度维持 ${r.score}%）`;
  const parts = [];
  if (r.added.length) parts.push(`新增技能证据：${r.added.join("、")}`);
  if (r.closed.length) parts.push(`已补齐缺口：${r.closed.join("、")}`);
  if (r.quantified) parts.push(`量化证据 ${r.quantified} 条`);
  appendMatchQaMsg("ai", `已记录 ${deltaTxt}。${parts.length ? parts.join("；") + "。" : "本轮未识别到新的技能证据，可补充具体技术名词与数字。"}`);
  matchQaState.i++;
  if (matchQaState.i < MATCH_QA_STEPS.length) appendMatchQaMsg("ai", MATCH_QA_STEPS[matchQaState.i].q);
  paintMatchRing(r.score);
  renderMatchQa();
}

/* 同步刷新匹配环（若报告仍在页面上） */
function paintMatchRing(score) {
  const ring = $("ring-fill");
  if (ring) {
    const c = 2 * Math.PI * 42;
    ring.style.strokeDashoffset = (c * (1 - score / 100)).toFixed(1);
  }
  const txt = document.querySelector("#match-result svg text");
  if (txt) txt.textContent = String(score);
}

function finishMatchQa() {
  if (!matchQaState) return;
  const s = matchQaState;
  const delta = matchResult.matchScore - s.baseScore;
  const box = $("match-qa-summary");
  if (box) {
    box.innerHTML = `
      <div class="card fade-up" style="padding:14px;margin-top:10px">
        <div class="pane-title" style="font-size:14px">📈 对话增强结果</div>
        <div class="live-metrics" style="margin-top:10px">
          <div class="metric"><span>最新匹配分</span><b>${matchResult.matchScore}</b></div>
          <div class="metric"><span>较初始</span><b style="color:${delta > 0 ? "var(--green)" : "var(--muted)"}">${delta > 0 ? "+" + delta : delta}</b></div>
          <div class="metric"><span>新增技能证据</span><b>${s.added.length}</b></div>
          <div class="metric"><span>补齐缺口</span><b>${s.closed.length}</b></div>
          <div class="metric"><span>量化证据</span><b>${s.quantified}</b></div>
        </div>
        ${(s.scoreTrail && s.scoreTrail.length >= 2)
          ? `<div class="mqa-chart" style="margin-top:10px">
               <div class="pane-title" style="font-size:12.5px">📈 本轮对话带来的匹配度变化</div>
               ${trendSVG(s.scoreTrail, { aria: "匹配度演进", height: 130 })}
             </div>`
          : ""}
        <p class="hint" style="margin-top:10px">
          ${s.added.length || s.closed.length
            ? `通过对话补充的证据已并入匹配结果：${[...new Set(s.added.concat(s.closed))].join("、")}。`
            : "本轮未补充到新的技能证据。建议在回答中写出具体技术名词与量化数据。"}
        </p>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" onclick="startMatchQa()">再来一轮</button>
          <button class="btn btn-primary btn-sm" onclick="analyze()">用新证据重算报告 →</button>
          <button class="btn btn-outline btn-sm" onclick="switchTab('career')">看看真实岗位 →</button>
        </div>
      </div>`;
  }
  appendMatchQaMsg("ai", `✅ 已应用。匹配度 ${s.baseScore}% → ${matchResult.matchScore}%（${delta > 0 ? "+" + delta : delta}）。`);
  s.i = MATCH_QA_STEPS.length;
  renderMatchQa();
  toast(`匹配度已更新：${matchResult.matchScore}%`);
  try { logDev("info", `对话式匹配增强完成：${s.baseScore}% → ${matchResult.matchScore}%`); } catch (e) {}
}
