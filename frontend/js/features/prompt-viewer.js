"use strict";
/* ============================================================
 * 7.5 Prompt 查看器 · 实时能力追踪 · 报告导出
 * ============================================================ */
function showPromptViewer() {
  $("prompt-view").textContent = SYS_PROMPTS[session.mode] || SYS_PROMPTS.general;
  $("prompt-modal").hidden = false;
}

/* ---- 实时能力追踪器（面试过程中动态更新，复用报告引擎） ---- */
function liveRadarSVG(dims) {
  const cx = 70, cy = 70, R = 50, n = dims.length;
  const ang = i => (Math.PI * 2 * i / n) - Math.PI / 2;
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  const ring = [0.5, 1].map(f =>
    `<polygon points="${dims.map((_, i) => pt(i, R * f).join(",")).join(" ")}" fill="none" stroke="var(--line)"/>`
  ).join("");
  const axes = dims.map((_, i) => {
    const [x, y] = pt(i, R);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`;
  }).join("");
  const vpts = dims.map((d, i) => pt(i, R * d.score / 100).join(",")).join(" ");
  return `<svg viewBox="0 0 140 140" style="width:100%;max-width:150px" role="img" aria-label="实时能力雷达">
    ${ring}${axes}
    <polygon points="${vpts}" fill="var(--brand)" fill-opacity=".28" stroke="var(--brand)" stroke-width="1.8" style="transition:all .4s"/>
  </svg>`;
}

function updateLiveTracker() {
  const turns = session.turns;
  if (!turns.length) return;
  const all = turns.map(t => t.answer).join("\n");
  const words = all.replace(/\s/g, "").length;
  const digits = (all.match(/\d+/g) || []).length;
  const dims = scoreSession(); // 复用报告评分引擎
  $("live-radar").innerHTML = liveRadarSVG(dims);
  $("live-turn").textContent = `${turns.length}/${MAX_TURNS}`;
  $("live-words").textContent = words;
  $("live-digits").textContent = digits;
  // 模拟「AI 置信度」：回答越长、量化越多，置信度越高
  const conf = Math.min(95, Math.round(40 + Math.min(30, words / 8) + digits * 4));
  $("live-conf").textContent = conf + "%";
  const hint = $("live-hint");
  const lowest = [...dims].sort((a, b) => a.score - b.score)[0];
  if (turns.length >= MAX_TURNS) {
    hint.className = "live-hint ok";
    hint.textContent = `🏁 本轮面试已结束（${MAX_TURNS}/${MAX_TURNS}），报告已生成`;
  } else if (turns.length < 3) {
    hint.className = "live-hint";
    hint.textContent = `再回答 ${3 - turns.length} 轮可生成初步报告`;
  } else if (lowest.score < 60) {
    hint.className = "live-hint warn";
    hint.textContent = `⚠️ 当前最弱维度：${lowest.dimension}（${lowest.score} 分）`;
  } else {
    hint.className = "live-hint ok";
    hint.textContent = `✅ 已收集 ${turns.length} 轮证据，可结束面试生成报告`;
  }
  $("progress-bar").style.width = Math.min(100, turns.length / MAX_TURNS * 100) + "%";

  // v10：左侧栏「模拟面试」项同步进度徽章（≥5 轮转绿）
  const sbBadge = $("sb-interview-badge");
  if (sbBadge) {
    sbBadge.textContent = `${turns.length}/${MAX_TURNS}`;
    if (turns.length >= MAX_TURNS) {
      sbBadge.style.background = "color-mix(in srgb, var(--green) 16%, transparent)";
      sbBadge.style.color = "var(--green)";
    } else {
      sbBadge.style.background = "var(--brand-bg)";
      sbBadge.style.color = "var(--brand)";
    }
  }
}

/* ---- 报告导出：Markdown 复制 / 系统分享 / 打印 PDF ---- */
function reportToMarkdown() {
  const dims = scoreSession();
  const total = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
  const ev = buildEvidence(session.turns);
  const lines = [`# 面镜 FutureMirror 模拟面试报告`, ``, `**综合得分：${total}/100**`, ``, `## 维度得分`];
  dims.forEach(d => lines.push(`- **${d.dimension}**：${d.score} 分 — ${d.comment}`));
  lines.push("", "## 评分证据");
  ev.forEach((e, i) => lines.push(`${i + 1}. **[${e.agent}]** “${e.quote}”  `, `   标注：${e.note}`));
  lines.push("", "## 改进建议");
  [...dims].sort((a, b) => a.score - b.score).slice(0, 3).forEach(d =>
    lines.push(`- 「${d.dimension}」${d.score} 分：${d.comment}`));
  return lines.join("\n");
}
function copyReportMarkdown() {
  if (!session.turns.length) { toast("请先完成一次模拟面试再导出报告"); return; }
  const md = reportToMarkdown();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(md).then(
      () => toast("报告 Markdown 已复制到剪贴板"),
      () => toast("复制失败，请手动选择")
    );
  } else {
    toast("当前浏览器不支持剪贴板 API");
  }
}
function shareReport() {
  if (!session.turns.length) { toast("请先完成一次模拟面试再分享报告"); return; }
  const md = reportToMarkdown();
  if (navigator.share) {
    navigator.share({ title: "面镜 FutureMirror 模拟面试报告", text: md }).catch(() => {});
  } else {
    copyReportMarkdown();
  }
}

