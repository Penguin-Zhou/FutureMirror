"use strict";
/* ============================================================
 * 7. 评估报告（由真实面试对话动态生成，可解释评分）
 * ============================================================ */
const DIM_DEFS = [
  { key: "depth", dimension: "内容深度", pool: ["为最强项目补充 3 个可深挖技术点与量化结果", "复盘一个失败案例，讲清根因与改进"] },
  { key: "logic", dimension: "结构逻辑", pool: ["用 STAR 重写两个核心项目的 300 字介绍", "每天口述 1 遍项目介绍并录音回听"] },
  { key: "expression", dimension: "语言表达", pool: ["录音练习，消除口头禅（然后/那个/就是）", "把长回答拆成「总-分-总」三段式"] },
  { key: "fit", dimension: "岗位匹配", pool: ["针对匹配报告中的缺口技能制定 30 天补强计划", "把缺口技能写成课程项目并更新简历"] },
  { key: "stress", dimension: "抗压表现", pool: ["完成 2 次压力面模拟，练习被打断后的恢复话术", "预演 5 个尖锐问题（方案缺陷/换人重做/deadline 提前）"] },
];
const BASE_PLAN = [
  "全流程综合模拟一次，对比历史报告看进步曲线",
  "把本次报告的证据清单过一遍，标记已改进项",
];
/* v22.1：已同步到后端的签名（模块级，不落 localStorage——
 * 刷新页面后重新同步一次是正确行为（重新取回服务端评分），
 * 而同页内反复切到报告页不应重复 POST。 */
let lastSyncSig = "";

function scoreSession() {
  const turns = session.turns;
  const all = turns.map(t => t.answer).join("\n");
  const digitCount = (all.match(/\d/g) || []).length;
  const techHits = SKILL_DICT.filter(s => all.includes(s)).length;
  const filler = (all.match(/然后|那个|就是/g) || []).length;
  const starHits = (all.match(/背景|目标|负责|通过|最终|结果|因此|于是/g) || []).length;
  const pressureTurns = turns.filter(t => t.mode === "pressure");
  const defensive = (all.match(/不是我的|跟我没关系|但是|我没有/g) || []).length;
  const shortAnswers = turns.filter(t => t.answer.length < 40).length;

  const clamp = v => Math.max(30, Math.min(96, Math.round(v)));
  let depth = clamp(48 + Math.min(22, digitCount * 2.2) + Math.min(18, techHits * 2.5) + (turns.length >= 4 ? 8 : 0));
  // v12：代码沙盒通过率并入「内容深度」维度（编码能力作为可量化证据）
  if (typeof session.codeScore === "number") depth = clamp(depth * 0.8 + session.codeScore * 100 * 0.2);
  const logic = clamp(46 + Math.min(30, starHits * 4) + (turns.length >= 3 ? 8 : 0));
  const expression = clamp(88 - Math.min(24, filler * 5) - (shortAnswers * 4));
  const fit = matchResult
    ? clamp(52 + matchResult.matchScore * 0.4 + Math.min(10, techHits))
    : clamp(55 + Math.min(20, techHits * 2));
  const stress = clamp(72 - Math.min(20, defensive * 6) - (pressureTurns.length ? Math.min(12, shortAnswers * 3) : 6));
  return [
    { ...DIM_DEFS[0], score: depth, comment: digitCount >= 4 ? "回答包含量化数据，细节可信度较好" : "缺少量化数据支撑，建议补充延迟/QPS/用户数" },
    { ...DIM_DEFS[1], score: logic, comment: starHits >= 3 ? "具备 STAR 结构意识，收尾可更明确" : "结构松散，建议用 STAR（背景-目标-行动-结果）组织" },
    { ...DIM_DEFS[2], score: expression, comment: filler > 2 ? "口头禅偏多，影响专业度" : "表达流畅度良好" },
    { ...DIM_DEFS[3], score: fit, comment: matchResult ? `基于匹配报告：匹配分 ${matchResult.matchScore}，缺口 ${matchResult.gaps.slice(0, 3).join("、") || "无"}` : "未生成匹配报告，按技能命中估算" },
    { ...DIM_DEFS[4], score: stress, comment: defensive > 1 ? "出现防御性表述，压力下需先承认再解释" : "面对追问保持冷静，偶有防御性表述" },
  ];
}

function buildEvidence(turns) {
  return turns.slice(-4).map(t => {
    const quote = t.answer.length > 60 ? t.answer.slice(0, 60) + "…" : t.answer;
    return { agent: t.agent, quote, note: t.notes };
  });
}

function buildPlan(dims) {
  const sorted = [...dims].sort((a, b) => a.score - b.score).slice(0, 3);
  const plan = [];
  let day = 1;
  const alloc = [3, 2, 1];
  sorted.forEach((d, i) => {
    const n = alloc[i];
    for (let j = 0; j < n && j < d.pool.length; j++) {
      plan.push({ day: `Day ${day++}`, task: d.pool[j], tag: d.dimension });
    }
  });
  BASE_PLAN.forEach(t => plan.push({ day: `Day ${day++}`, task: t }));
  return { plan, weakest: sorted[0] };
}

function radarSVG(data) {
  const cx = 165, cy = 160, R = 108, n = data.length;
  const angle = i => (Math.PI * 2 * i / n) - Math.PI / 2;
  const pt = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  let rings = "", axes = "";
  [0.25, 0.5, 0.75, 1].forEach(f => {
    rings += `<polygon points="${data.map((_, i) => pt(i, R * f).join(",")).join(" ")}" fill="none" stroke="var(--line)"/>`;
  });
  data.forEach((_, i) => { const [x, y] = pt(i, R); axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`; });
  const vpts = data.map((d, i) => pt(i, R * d.score / 100).join(",")).join(" ");
  const dots = data.map((d, i) => { const [x, y] = pt(i, R * d.score / 100); return `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--brand)"/>`; }).join("");
  const labels = data.map((d, i) => {
    const [x, y] = pt(i, R + 24);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="12.5" fill="var(--muted)">${d.dimension}</text>
            <text x="${x}" y="${y + 15}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="var(--faint)">${d.score}</text>`;
  }).join("");
  return `<svg viewBox="0 0 330 330" style="width:100%;max-width:340px" role="img" aria-label="能力雷达图">
    ${rings}${axes}
    <polygon class="radar-pop" points="${vpts}" fill="rgba(99,102,241,.3)" stroke="var(--brand)" stroke-width="2"/>
    ${dots}${labels}
  </svg>`;
}

function historySVG(history) {
  const W = 320, H = 120, pad = 26;
  const totals = history.map(h => h.total);
  const min = Math.min(...totals) - 4, max = Math.max(...totals) + 4;
  const x = i => pad + (W - pad * 2) * (history.length === 1 ? 0.5 : i / (history.length - 1));
  const y = v => H - 18 - (H - 36) * (v - min) / Math.max(1, max - min);
  const pts = history.map((h, i) => `${x(i)},${y(h.total)}`).join(" ");
  const dots = history.map((h, i) => `<circle cx="${x(i)}" cy="${y(h.total)}" r="3" fill="var(--brand)"/><text x="${x(i)}" y="${y(h.total) - 8}" text-anchor="middle" font-size="9.5" fill="var(--faint)">${h.total}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:340px" role="img" aria-label="历史进步曲线">
    <line x1="${pad}" y1="${H - 18}" x2="${W - pad}" y2="${H - 18}" stroke="var(--line)"/>
    <polyline points="${pts}" fill="none" stroke="var(--brand)" stroke-width="2"/>
    ${dots}
  </svg>`;
}

async function renderReport(force) {
  const box = $("report-content");
  if (!currentUser) {
    box.innerHTML = `<div class="empty-state fade-up">
      <div class="ic">🔒</div>
      <p>请先登录并完成一次模拟面试，才能生成评估报告。</p>
      <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="showView('auth')">登录 / 注册</button>
        <button class="btn btn-outline btn-sm" onclick="switchTab('interview')">去模拟面试</button>
      </div>
    </div>`;
    return;
  }
  if (!session.turns.length) {
    box.innerHTML = `<div class="empty-state fade-up">
      <div class="ic">🎯</div>
      <p>尚未完成模拟面试——报告需要基于你的<b>真实回答</b>生成（每条评分证据都会引用你的原话）。</p>
      <div style="margin-top:14px"><button class="btn btn-primary btn-sm" onclick="switchTab('interview')">去完成一次模拟面试 →</button></div>
    </div>`;
    return;
  }
  // v22：后端在线时由服务端评分引擎生成（规则与前端一致，问答记录落库）；失败回退本地引擎
  let backendPayload = null;
  if (fmApi.backendReady() && session.turns.length) {
    // v22.1 修复：同一会话（interviewId + 轮数 + 匹配分 + 代码分）只同步一次，
    // 反复切到报告页不再重复 POST /sync（评委看 Network 面板不会有重复请求）
    const syncSig = () => [session.interviewId || "", session.turns.length,
                           matchResult ? matchResult.matchScore : "-",
                           typeof session.codeScore === "number" ? session.codeScore : "-"].join(":");
    if (force || syncSig() !== lastSyncSig) {
      try {
        backendPayload = await fmApi.syncAndReport(session, matchResult);
        lastSyncSig = syncSig();   // 同步后 interviewId 已生成，签名此刻才稳定
        try { persistSession(); } catch (e) {}   // interviewId 落本地，刷新后仍归属同一会话
      } catch (e) {}
    }
  }
  let dims, total, evidence, plan, weakest, serverScored = false;
  if (backendPayload && backendPayload.dims) {
    dims = backendPayload.dims;
    total = backendPayload.total;
    evidence = backendPayload.evidence || buildEvidence(session.turns);
    plan = backendPayload.plan || [];
    weakest = [...dims].sort((a, b) => a.score - b.score)[0];
    serverScored = true;
  } else {
    dims = scoreSession();
    total = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
    evidence = buildEvidence(session.turns);
    const built = buildPlan(dims);
    plan = built.plan;
    weakest = built.weakest;
  }
  const rewrites = buildSentenceRewrites(session.turns);
  const suggestions = [...dims].sort((a, b) => a.score - b.score).slice(0, 3)
    .map(d => `「${d.dimension}」${d.score} 分：${d.comment}`);


  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px">
      <div>
        <div class="pane-title">📊 评估报告（可解释评分） <span class="tag-demo">${serverScored ? "服务端评分引擎 · 已落库" : "启发式引擎演示"}</span></div>
        <p class="hint" style="margin-top:0">基于本次 ${session.turns.length} 轮真实对话动态生成——每条证据均引用你的回答原话</p>
      </div>
      <div style="text-align:right;display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;justify-content:flex-end">
        <div class="report-actions" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
          <button class="btn btn-outline btn-sm" onclick="copyReportMarkdown()">📋 复制 Markdown</button>
          <button class="btn btn-outline btn-sm" onclick="window.print()">🖨 导出 PDF</button>
          <button class="btn btn-outline btn-sm" onclick="shareReport()">🔗 分享报告</button>
          <button class="btn btn-outline btn-sm" onclick="restartInterview()">🔄 再来一次</button>
        </div>
        <div>
          <div style="font-size:36px;font-weight:800;color:var(--brand);line-height:1" id="report-total">${total}</div>
          <div class="hint" style="margin-top:0">综合得分 / 100</div>
        </div>
      </div>
    </div>
    ${renderReportCover()}
    <div class="notice-info">ⓘ ${serverScored ? "本报告由<b>服务端评分引擎</b>生成（评分规则与前端演示版一致，问答记录已写入 SQLite，可跨设备恢复）" : "本报告由<b>无 API Key 时的兜底规则引擎</b>生成，用于演示「可解释评分」的结构与证据链（每条证据引用真实回答、学习路径按最弱维度动态生成）"}。完整版使用 LLM 评分（Zod 约束输出）+ 校准样本集量化一致性，详见技术文档。</div>
    <div class="report-grid" style="margin-top:16px">
      <div><div class="pane-title">能力雷达</div><div id="radar" style="display:grid;place-items:center">${radarSVG(dims)}</div></div>
      <div><div class="pane-title">维度得分</div><div id="dims">${dims.map(d => `
        <div class="dim-row${d === weakest ? " lowest" : ""}">
          <div class="dim-head"><b>${d.dimension}${d === weakest ? " ⬅ 最弱" : ""}</b><span style="color:var(--muted)">${d.score}</span></div>
          <div class="dim-bar"><div style="width:${d.score}%"></div></div>
          <div class="dim-comment">${d.comment}</div>
        </div>`).join("")}</div></div>
    </div>
    <div class="pane-title" style="margin-top:18px">评分证据（引用你的真实回答）</div>
    <div id="evidence">${evidence.map(e => `
      <div class="evidence"><span class="badge badge-brand">${e.agent}</span><br>
        <q>“${e.quote}”</q><p>📝 ${e.note}</p></div>`).join("")}</div>
    ${rewrites.length ? `<div class="pane-title" style="margin-top:18px">✍️ 句子级改写建议 <span class="tag-demo">规则引擎 · 无需 LLM</span></div>
    <div id="rewrites">${rewrites.map(r => `
      <div class="evidence"><span class="badge badge-amber rw-dim">${r.dimension}</span><q>“${esc(r.original)}”</q><p>✍️ ${esc(r.advice)}</p></div>`).join("")}</div>` : ""}
    <div class="report-grid" style="margin-top:14px">
      <div>
        <div class="pane-title">改进建议</div>
        <ul id="suggestions" style="padding-left:18px;font-size:13.5px;color:var(--muted);line-height:2">${suggestions.map(s => `<li>${s}</li>`).join("")}</ul>
      </div>
      <div>
        <div class="pane-title">7 天学习路径（按最弱维度动态生成）</div>
        <div class="plan-banner">因你在【${weakest.dimension}】得分最低（${weakest.score} 分），Day 1-3 已为你安排专项训练</div>
        <div id="plan">${plan.map(p => `
          <div class="plan-day"><b>${p.day}</b><span>${p.task}</span></div>`).join("")}</div>
      </div>
    </div>
    <div class="history card" style="padding:14px 16px">
      <div class="pane-title" style="margin-bottom:4px">📈 历史进步曲线 <span class="tag-demo">localStorage 本地存储</span></div>
      <div id="history-box"></div>
    </div>
    ${reviewEntryCard()}`;

  // 历史记录（同一会话不重复写入）
  const sig = total + ":" + session.turns.length;
  if (sig !== lastReportSig || force) {
    lastReportSig = sig;
    const history = store.get("fm_history", []);
    const last = history[history.length - 1];
    if (!last || last.total !== total || last.turns !== session.turns.length) {
      history.push({ date: new Date().toLocaleDateString("zh-CN"), total, turns: session.turns.length });
      store.set("fm_history", history.slice(-8), true);
    }
  }
  const history = store.get("fm_history", []);
  $("history-box").innerHTML = history.length >= 2
    ? `<div style="display:grid;place-items:center">${historySVG(history)}</div>
       <p class="hint" style="text-align:center">共 ${history.length} 次模拟记录：${history.map(h => h.total).join(" → ")}</p>`
    : `<p class="hint">已完成 1 次模拟。再完成一次面试（可换模式），即可查看进步曲线对比。</p>`;

  // v10：总分旁显示「较上次」变化（历史最后一条为本次，倒数第二条为上次）
  if (history.length >= 2) {
    const prev = history[history.length - 2].total;
    const diff = total - prev;
    const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "—";
    const color = diff > 0 ? "var(--green)" : diff < 0 ? "var(--red)" : "var(--faint)";
    const anchor = box.querySelector("#report-total");
    if (anchor) {
      anchor.insertAdjacentHTML("afterend",
        `<div style="font-size:13px;color:${color};margin-top:2px" id="report-diff">${arrow} 较上次 ${diff > 0 ? "+" : ""}${diff} 分</div>`);
    }
  }
}

