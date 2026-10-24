"use strict";
/* ============================================================
 * v31 · 学习计划（7 天路径 + 每日时间分配规划）
 * 入口：renderPlanPage()（applyRoute → page === "plan" 时调用）
 * 数据：fm_plan 按账号隔离存储；计划内容优先同步自最新评估报告
 *       （scoreSession + buildPlan 动态生成），无报告时回落通用基线计划；
 *       完成进度本地保存，可一键重置。
 * 纪律：蓝图编辑风——直角 / 发丝线 / 单一朱红 accent；零投影零渐变；
 *       动效仅 hover 描边变化，reduced-motion 全静态。
 * ============================================================ */
const LP_KEY = "fm_plan";
/* 每日时间预算：切换后按天 mix 权重重新切分分钟数 */
const LP_BUDGETS = [
  { id: "light", label: "紧凑 45′", min: 45, note: "适合仍有课业的在校周期" },
  { id: "std", label: "标准 60′", min: 60, note: "推荐：多数求职备战的可持续节奏" },
  { id: "deep", label: "强化 90′", min: 90, note: "面试前一周 / 周末冲刺" },
];
/* 7 天骨架：kind 仅用于阅读分组，mix 决定当日时间分配权重 */
const LP_SKELETON = [
  { kind: "focus", title: "最弱维度专项 ①", mix: { learn: .30, practice: .50, review: .20 } },
  { kind: "focus", title: "最弱维度专项 ②", mix: { learn: .25, practice: .50, review: .25 } },
  { kind: "focus", title: "次弱维度专项 ①", mix: { learn: .30, practice: .50, review: .20 } },
  { kind: "focus", title: "次弱维度专项 ②", mix: { learn: .25, practice: .50, review: .25 } },
  { kind: "focus", title: "第三短板补强", mix: { learn: .35, practice: .45, review: .20 } },
  { kind: "mock", title: "全流程综合模拟", mix: { learn: .15, practice: .60, review: .25 } },
  { kind: "review", title: "复盘输出与简历更新", mix: { learn: .10, practice: .30, review: .60 } },
];
/* 通用基线任务（无评估报告时使用，与报告五维一一对应，第 6/7 天为综合与复盘） */
const LP_BASELINE_TASKS = [
  ["量化表达三要素：数字 / 对比 / 结果", "为最强项目补充 3 个可深挖技术点与量化结果", "把项目关键数字写成可口述的卡片"],
  ["STAR 结构精讲：背景-目标-行动-结果", "用 STAR 重写两个核心项目的 300 字介绍", "每天口述 1 遍项目介绍并录音回听"],
  ["录音练习，消除口头禅（然后 / 那个 / 就是）", "把长回答拆成「总-分-总」三段式", "对照录音标注 3 处待改进表达"],
  ["针对匹配报告中的缺口技能制定补强计划", "把缺口技能写成一个小课程项目", "更新简历技能栏与项目描述"],
  ["预演 5 个尖锐问题（方案缺陷 / 换人重做 / deadline 提前）", "完成 2 次压力面模拟", "练习被打断后的恢复话术"],
  ["全流程综合模拟一次（可换模式）", "对比历史报告，记录进步曲线", "标记本次新出现的薄弱点"],
  ["把本次报告的证据清单过一遍，标记已改进项", "更新简历与作品集", "规划下一周重点维度"],
];
const LP_BASELINE_DIMS = ["内容深度", "结构逻辑", "语言表达", "岗位匹配", "抗压表现", "综合模拟", "复盘输出"];

/* ---------- 基础工具 ---------- */
function lpEsc(s) { return typeof esc === "function" ? esc(String(s)) : String(s); }
function lpBudget(id) { return LP_BUDGETS.find(b => b.id === id) || LP_BUDGETS[1]; }
/* 按权重切分当日分钟，余数并入最大段，保证合计恒等于预算 */
function lpAlloc(mix, minutes) {
  let learn = Math.round(minutes * mix.learn);
  let practice = Math.round(minutes * mix.practice);
  let review = minutes - learn - practice;
  if (review < 0) { practice += review; review = 0; }
  return { learn, practice, review };
}
function lpDayDate(i) {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return (d.getMonth() + 1) + "月" + d.getDate() + "日 · 周" + "日一二三四五六".charAt(d.getDay());
}
function lpHasTurns() {
  return typeof session !== "undefined" && session && Array.isArray(session.turns) && session.turns.length > 0;
}

/* ---------- 计划生成：来源为评估报告（buildPlan）或通用基线 ---------- */
function lpTasksFromReport() {
  if (!lpHasTurns()) return null;
  if (typeof scoreSession !== "function" || typeof buildPlan !== "function") return null;
  let built;
  try { built = buildPlan(scoreSession()); } catch (e) { return null; }
  if (!built || !Array.isArray(built.plan) || !built.plan.length) return null;
  /* 按维度聚合任务（buildPlan 已按最弱优先排序：3 + 2 + 1） */
  const byDim = {};
  built.plan.forEach(p => { (byDim[p.tag] = byDim[p.tag] || []).push(p.task); });
  const order = [];
  built.plan.forEach(p => { if (order.indexOf(p.tag) < 0) order.push(p.tag); });
  const d0 = byDim[order[0]] || [], d1 = byDim[order[1]] || [], d2 = byDim[order[2]] || [];
  /* 第三短板只有 1 条任务时，从该维度题库补一条未用过的 */
  const d2extra = (() => {
    if (d2.length !== 1 || typeof DIM_DEFS === "undefined") return null;
    const def = DIM_DEFS.find(x => x.dimension === order[2]);
    if (!def || !Array.isArray(def.pool)) return null;
    return def.pool.find(t => d2.indexOf(t) < 0) || null;
  })();
  const base = typeof BASE_PLAN !== "undefined" ? BASE_PLAN : LP_BASELINE_TASKS[6];
  const groups = [
    d0.slice(0, 2),
    d0.slice(2),
    d1.slice(0, 1),
    d1.slice(1),
    d2extra ? d2.concat([d2extra]) : d2,
    [base[0] || LP_BASELINE_TASKS[5][0], "换一种面试模式再模拟一次，横向对比稳定性"],
    [base[1] || LP_BASELINE_TASKS[6][0], "更新简历与作品集", "规划下一周重点维度"],
  ];
  const dims = [order[0], order[0], order[1], order[1], order[2], "综合模拟", "复盘输出"];
  return { groups, dims, weakest: built.weakest, total: built.total || null };
}
function lpCreate(source) {
  const fromReport = source === "report" ? lpTasksFromReport() : null;
  const groups = fromReport ? fromReport.groups : LP_BASELINE_TASKS;
  const dims = fromReport ? fromReport.dims : LP_BASELINE_DIMS;
  const budget = lpBudget("std");
  const days = LP_SKELETON.map((sk, i) => {
    const raw = (groups[i] && groups[i].length) ? groups[i] : LP_BASELINE_TASKS[i];
    const tasks = raw.slice(0, 3).map(t => ({ t, done: false }));
    return { kind: sk.kind, title: sk.title, dim: dims[i] || "综合", mix: sk.mix, tasks, alloc: lpAlloc(sk.mix, budget.min) };
  });
  return { v: 1, source: fromReport ? "report" : "baseline", createdAt: new Date().toISOString(), budget: "std", days };
}

/* ---------- 读写 ---------- */
function lpGet() {
  let p = null;
  try { p = store.get(LP_KEY, null); } catch (e) { p = null; }
  if (!p || !Array.isArray(p.days) || p.days.length !== 7) return lpCreate("baseline");
  p.days.forEach(d => {
    if (!d.mix) d.mix = LP_SKELETON[0].mix;
    if (!d.alloc) d.alloc = lpAlloc(d.mix, lpBudget(p.budget).min);
    if (!Array.isArray(d.tasks)) d.tasks = [];
    d.tasks.forEach(t => { if (typeof t.done !== "boolean") t.done = false; });
  });
  return p;
}
function lpSave(p) { try { store.set(LP_KEY, p, true); } catch (e) {} }
function lpProgress(p) {
  let done = 0, total = 0;
  p.days.forEach(d => d.tasks.forEach(t => { total++; if (t.done) done++; }));
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}
function lpWeekMinutes(p) {
  return p.days.reduce((s, d) => s + (d.alloc.learn + d.alloc.practice + d.alloc.review), 0);
}
function lpDayDone(d) { return d.tasks.length > 0 && d.tasks.every(t => t.done); }

/* ---------- 渲染 ---------- */
function lpRenderToolbar(p) {
  const src = p.source === "report"
    ? "已同步自最新评估报告 · 按最弱维度动态生成"
    : "通用基线计划 · 完成一次模拟面试后可同步为个人版";
  return `
    <div class="lp-seg" role="group" aria-label="每日时间预算">
      ${LP_BUDGETS.map(b => `<button type="button" class="lp-seg-btn${b.id === p.budget ? " active" : ""}"
        aria-pressed="${b.id === p.budget}" title="${lpEsc(b.note)}"
        onclick="setPlanBudget('${b.id}')">${lpEsc(b.label)}</button>`).join("")}
    </div>
    <span class="lp-src" id="lp-src">${lpEsc(src)}</span>
    <span class="lp-actions">
      <button class="btn btn-outline btn-sm" onclick="syncPlanFromReport()" title="用最新评估报告重新生成 7 天计划（保留已完成进度）">同步评估报告</button>
      <button class="btn btn-outline btn-sm" onclick="copyPlanMarkdown()">复制 Markdown</button>
      <button class="btn btn-outline btn-sm" onclick="printPlanPage()">打印</button>
      <button class="btn btn-ghost btn-sm" onclick="resetPlanProgress()">重置进度</button>
    </span>`;
}
function lpRenderOverview(p) {
  const pr = lpProgress(p);
  const b = lpBudget(p.budget);
  const created = (p.createdAt || "").slice(0, 10);
  return `
    <div class="lp-ov card bp-z1 bp-crop">
      <div class="lp-ov-head">
        <div class="eyebrow"><span class="eyebrow-no">PLAN</span> 7 天学习路径 · 每日时间分配规划</div>
        ${pr.pct === 100 ? '<span class="bp-stamp">已完成</span>' : ""}
      </div>
      <div class="lp-ov-bar"><div class="lp-ov-fill" style="width:${pr.pct}%"></div></div>
      <div class="lp-ov-meta">
        <span class="lp-ov-num">${pr.done}/${pr.total} 项任务 · ${pr.pct}%</span>
        <span>预算 ${lpEsc(b.label)}/天 · 周合计 ${lpWeekMinutes(p)} 分钟</span>
        <span>创建于 ${lpEsc(created || "今天")}</span>
      </div>
      <p class="lp-ov-note">时间分配权重：专项日「学习 3 : 练习 5 : 复盘 2」、模拟日「练习 6」、复盘日「复盘 6」；切换预算后各日分钟数自动重算，任务内容不变。</p>
    </div>`;
}
function lpRenderDay(d, i, p) {
  const total = d.alloc.learn + d.alloc.practice + d.alloc.review;
  const done = lpDayDone(d);
  return `
    <div class="lp-day card bp-z1${done ? " done" : ""}">
      <div class="lp-day-head">
        <span class="lp-day-no">DAY ${i + 1}</span>
        <span class="lp-day-date">${lpDayDate(i)}</span>
        <span class="lp-day-dim">${lpEsc(d.dim || "综合")}</span>
        ${done ? '<span class="lp-day-ok">已完成</span>' : ""}
      </div>
      <div class="lp-day-title">${lpEsc(d.title)}</div>
      <ul class="lp-tasks">
        ${d.tasks.map((t, j) => `
          <li class="lp-task${t.done ? " done" : ""}">
            <button type="button" class="lp-check" role="checkbox" aria-checked="${t.done ? "true" : "false"}"
              aria-label="${lpEsc(t.t)}" onclick="togglePlanTask(${i},${j})"></button>
            <span class="lp-task-t">${lpEsc(t.t)}</span>
          </li>`).join("")}
      </ul>
      <div class="lp-day-alloc">
        <span>学习 ${d.alloc.learn}′</span><span>练习 ${d.alloc.practice}′</span><span>复盘 ${d.alloc.review}′</span>
        <b class="lp-day-total">合计 ${total}′</b>
      </div>
    </div>`;
}
function lpRenderAlloc(p) {
  const rows = p.days.map((d, i) => {
    const total = d.alloc.learn + d.alloc.practice + d.alloc.review;
    return `<tr${lpDayDone(d) ? ' class="done"' : ""}>
      <td class="lp-td-date">${lpDayDate(i)}</td>
      <td class="lp-td-title">${lpEsc(d.title)}<span class="lp-td-dim">${lpEsc(d.dim || "")}</span></td>
      <td>${d.alloc.learn}′</td><td>${d.alloc.practice}′</td><td>${d.alloc.review}′</td>
      <td><b>${total}′</b></td>
    </tr>`;
  }).join("");
  const sum = p.days.reduce((a, d) => ({
    learn: a.learn + d.alloc.learn, practice: a.practice + d.alloc.practice, review: a.review + d.alloc.review,
  }), { learn: 0, practice: 0, review: 0 });
  return `
    <div class="card bp-z1 lp-alloc-card">
      <div class="card-section-title">本周时间分配总表</div>
      <p class="card-section-sub">学习 = 输入（知识点 / 面经 / 范例）；练习 = 刻意输出（口述 / 改写 / 模拟）；复盘 = 录音回听 / 对照证据清单。</p>
      <div class="lp-table-wrap">
        <table class="lp-table">
          <thead><tr><th>日期</th><th>当日主题</th><th>学习</th><th>练习</th><th>复盘</th><th>合计</th></tr></thead>
          <tbody>${rows}
            <tr class="lp-tr-total"><td>合计</td><td>7 天全周期</td>
              <td>${sum.learn}′</td><td>${sum.practice}′</td><td>${sum.review}′</td>
              <td><b>${sum.learn + sum.practice + sum.review}′</b></td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}
function renderPlanPage() {
  const tb = $("lp-toolbar"), ov = $("lp-overview"), grid = $("lp-grid"), al = $("lp-alloc");
  if (!tb || !ov || !grid) return;
  const p = lpGet();
  tb.innerHTML = lpRenderToolbar(p);
  ov.innerHTML = lpRenderOverview(p);
  grid.innerHTML = p.days.map((d, i) => lpRenderDay(d, i, p)).join("");
  if (al) al.innerHTML = lpRenderAlloc(p);
  try { if (window.__bpApp && window.__bpApp.choreograph) window.__bpApp.choreograph("app", "plan"); } catch (e) {}
}

/* ---------- 交互 ---------- */
function setPlanBudget(id) {
  const p = lpGet();
  p.budget = lpBudget(id).id;
  p.days.forEach(d => { d.alloc = lpAlloc(d.mix, lpBudget(p.budget).min); });
  lpSave(p);
  renderPlanPage();
  toast(`时间预算已切换为「${lpBudget(p.budget).label}」/天`);
}
function togglePlanTask(di, ti) {
  const p = lpGet();
  const d = p.days[di];
  if (!d || !d.tasks[ti]) return;
  d.tasks[ti].done = !d.tasks[ti].done;
  lpSave(p);
  renderPlanPage();
  const pr = lpProgress(p);
  if (pr.pct === 100) toast("7 天计划全部完成——去评估报告看看进步曲线");
}
function syncPlanFromReport() {
  const prev = lpGet();
  const next = lpCreate("report");
  if (next.source !== "report") { toast("尚未完成模拟面试——计划保持通用基线版，完成一次面试后可同步为个人版"); return; }
  next.budget = prev.budget;   // 保留用户选择的预算
  next.days.forEach((d, i) => {
    d.alloc = lpAlloc(d.mix, lpBudget(next.budget).min);
    const old = prev.days[i];
    if (old) d.tasks.forEach((t, j) => { if (old.tasks[j]) t.done = old.tasks[j].done; });
  });
  lpSave(next);
  renderPlanPage();
  toast("已按最新评估报告重新生成 7 天计划（已完成进度按日保留）");
}
function resetPlanProgress() {
  if (typeof confirm !== "function") return;
  if (!confirm("确定重置全部完成进度？计划内容与时间预算保持不变。")) return;
  const p = lpGet();
  p.days.forEach(d => d.tasks.forEach(t => { t.done = false; }));
  lpSave(p);
  renderPlanPage();
  toast("完成进度已重置");
}
function lpMarkdown(p) {
  const b = lpBudget(p.budget);
  const lines = [
    "# 7 天学习计划（面镜 FutureMirror）",
    "",
    `- 计划来源：${p.source === "report" ? "最新评估报告（按最弱维度动态生成）" : "通用基线计划"}`,
    `- 时间预算：${b.label}/天 · 周合计 ${lpWeekMinutes(p)} 分钟`,
    "",
  ];
  p.days.forEach((d, i) => {
    const total = d.alloc.learn + d.alloc.practice + d.alloc.review;
    lines.push(`## Day ${i + 1} · ${d.title}（${d.dim || "综合"}）`);
    lines.push(`时间分配：学习 ${d.alloc.learn}′ · 练习 ${d.alloc.practice}′ · 复盘 ${d.alloc.review}′（合计 ${total}′）`);
    d.tasks.forEach(t => lines.push(`- [${t.done ? "x" : " "}] ${t.t}`));
    lines.push("");
  });
  return lines.join("\n");
}
function copyPlanMarkdown() {
  const md = lpMarkdown(lpGet());
  const done = () => toast("计划已复制为 Markdown，可粘贴到备忘录 / issue");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).then(done).catch(() => lpDownload(md));
  } else lpDownload(md);
}
function lpDownload(text) {
  try {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "futuremirror-7天学习计划.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("剪贴板不可用，已改为下载 Markdown 文件");
  } catch (e) { toast("导出失败：" + e.message); }
}
function printPlanPage() { try { window.print(); } catch (e) {} }
