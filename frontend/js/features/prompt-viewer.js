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
  /* v34：面试状态随报告一起导出（在场率 / 专注率 / 采样次数） */
  const st = typeof lastReportStatus === "object" && lastReportStatus ? lastReportStatus : null;
  lines.push("", "## 面试状态（摄像头在场检测）");
  if (st && st.count) {
    lines.push(`- 在场率：${st.presence_rate == null ? "—" : st.presence_rate + "%"}`);
    lines.push(`- 专注率：${st.attentive_rate == null ? "—" : st.attentive_rate + "%"}`);
    lines.push(`- 采样次数：${st.count} 次${st.latest ? `（最近状态：${st.latest}）` : ""}`);
    lines.push("- 视频帧始终留在浏览器内，服务端仅接收结构化状态");
  } else {
    lines.push("- 本次面试未开启摄像头，无在场数据");
  }
  /* v40：Agent 分歧视图随报告导出（同一回答、两套镜头的独立判断） */
  const views = agentLensViews(session.turns);
  lines.push("", "## Agent 分歧视图（同一回答 · 两套评价镜头）");
  lines.push(`- 平均分歧 ${views.avgGap} 分，最大 ${views.maxGap} 分，显著分歧 ${views.diverged}/${views.items.length} 轮`);
  views.items.slice().sort((a, b) => b.gap - a.gap).slice(0, 2).forEach((x) => {
    lines.push(`- 第 ${x.turn} 轮（分歧 ${x.gap} 分 · 原话「${x.quote.text}」）`);
    lines.push(`  - 技术面试官 ${x.tech.score} 分：${x.tech.reason}`);
    lines.push(`  - HR 面试官 ${x.hr.score} 分：${x.hr.reason}`);
  });
  /* v40：表达节奏（仅当本场用过语音输入） */
  const rh = rhythmSummary((session && session.voiceSegments) || []);
  if (rh.hasData) {
    lines.push("", "## 表达节奏（语音转写时间戳）");
    lines.push(`- 语速：${rh.cpm} 字/分（${rh.cpmLevel}）`);
    lines.push(`- 平均停顿：${rh.pauseAvg} 秒；2 秒以上停顿 ${rh.longPauses} 次`);
    lines.push(`- 口头禅密度：${rh.fillerRate}‰（${rh.filler} 次）`);
  }
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
/* v39：导出报告为 CSV（Excel 友好，含 UTF-8 BOM，维度得分 + 面试状态） */
function exportReportCsv() {
  if (!session.turns.length) { toast("请先完成一次模拟面试再导出 CSV"); return; }
  try {
    const dims = scoreSession();
    const total = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
    const st = (typeof lastReportStatus === "object" && lastReportStatus) ? lastReportStatus : null;
    const rows = [];
    rows.push(["指标", "值"]);
    rows.push(["综合得分", total]);
    dims.forEach(d => rows.push([d.dimension, d.score, d.comment || ""]));
    const views = agentLensViews(session.turns);
    rows.push(["Agent 分歧度", views.avgGap + " 分（最大 " + views.maxGap + "，显著分歧 " + views.diverged + "/" + views.items.length + " 轮）"]);
    const rh = rhythmSummary((session && session.voiceSegments) || []);
    if (rh.hasData) {
      rows.push(["语速", rh.cpm + " 字/分（" + rh.cpmLevel + "）"]);
      rows.push(["平均停顿", rh.pauseAvg + " 秒 / 长停顿 " + rh.longPauses + " 次"]);
    }
    rows.push([]);
    rows.push(["面试状态（摄像头在场检测）", ""]);
    if (st && st.count) {
      rows.push(["在场率", st.presence_rate == null ? "—" : st.presence_rate + "%"]);
      rows.push(["专注率", st.attentive_rate == null ? "—" : st.attentive_rate + "%"]);
      rows.push(["采样次数", st.count + " 次" + (st.latest ? "（最近：" + st.latest + "）" : "")]);
    } else {
      rows.push(["在场数据", "本次面试未开启摄像头，无在场数据"]);
    }
    const csv = "﻿" + rows.map(r => r.map(c => {
      const s = String(c == null ? "" : c).replace(/"/g, '""');
      return /[",\n]/.test(s) ? '"' + s + '"' : s;
    }).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `futuremirror-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("报告已导出为 CSV");
  } catch (e) { toast("导出失败：" + e.message); }
}

