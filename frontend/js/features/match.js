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

/* 简历文件上传：.txt 读取，其余展示形态（后续规划解析 PDF/DOCX） */
$("resume-upload").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  const box = $("resume-file");
  const size = (f.size / 1024).toFixed(1);
  if (/\.txt$/i.test(f.name)) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result).slice(0, 4000);
      $("resume").value = text;
      store.set("fm_resume", text);   // ⭐ 编程式赋值不触发 input 事件，需手动持久化，否则刷新丢失
    };
    reader.readAsText(f);
    box.classList.add("has-file");
    box.textContent = `✅ 已读取 ${f.name}（${size} KB）——文本已填入左侧简历框`;
  } else {
    box.classList.add("has-file");
    box.textContent = `✅ 已选择 ${f.name}（${size} KB）——后续规划解析 PDF/DOCX 并提取技能与项目经历，本演示版仅展示文件形态`;
  }
});

