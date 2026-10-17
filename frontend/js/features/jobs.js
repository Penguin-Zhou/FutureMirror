"use strict";
/* ============================================================
 * v18 · 产品闭环深化：投递看板 + 面试复盘 + 答题计时 + 连环追问
 *        + 语音输入实时反馈 + 句子级改写证据 + Mock 派发对照断言
 * ============================================================ */

/* ---------- 1) 答题计时器（每题 90 秒；超时记入「抗压表现」维度证据） ---------- */
const ANSWER_LIMIT = 90;
let answerTimer = null, answerLeft = ANSWER_LIMIT;

function paintAnswerTimer() {
  const el = $("answer-timer");
  if (!el) return;
  el.textContent = "⏱ " + Math.max(0, answerLeft) + "s";
  el.classList.toggle("warn", answerLeft > 0 && answerLeft <= 15);
}
function startAnswerTimer() {
  stopAnswerTimer();
  answerLeft = ANSWER_LIMIT;
  paintAnswerTimer();
  answerTimer = setInterval(() => {
    answerLeft--;
    paintAnswerTimer();
    if (answerLeft <= 0) {
      stopAnswerTimer();
      onAnswerTimeout();
    }
  }, 1000);
}
function stopAnswerTimer() {
  if (answerTimer) { clearInterval(answerTimer); answerTimer = null; }
}
function resetAnswerTimer() {
  stopAnswerTimer();
  answerLeft = ANSWER_LIMIT;
  paintAnswerTimer();
}
function onAnswerTimeout() {
  const body = $("chat-body");
  if (!body) return;
  const div = document.createElement("div");
  div.className = "msg msg-system";
  div.textContent = "⏰ 时间到了——请用一句话总结你的核心观点。";
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  addTimeline("观察员 Agent", "⏰ 本题超时未答 → 已记入「抗压表现」维度证据", "note");
  try { logDev("warn", "答题计时器超时（抗压维度证据）"); } catch (e) {}
}

/* ---------- 2) 连环追问（深度追问概率）：技术关键词 → 有机会连续 2 轮深挖同一点 ---------- */
const DEEP_DIVE_CHANCE = 0.35;
let deepDive = { topic: null, left: 0 };

/* techy：命中技能词典或常见技术场景词即视为技术关键词 */
function isTechKeyword(keyword) {
  const k = String(keyword || "");
  if (!k) return false;
  if (typeof SKILL_DICT !== "undefined" && SKILL_DICT.some(s => k.includes(s))) return true;
  return /缓存|并发|索引|队列|锁|微服务|分布式|数据库|Redis|MySQL|Kafka|Docker|QPS|延迟|扩容|一致性/i.test(k);
}

/* chance 可注入（自检面板用 1 强制触发，保证断言确定性） */
function maybeStartDeepDive(keyword, mode, chance) {
  if (deepDive.left > 0) return { started: false, left: deepDive.left };
  const p = typeof chance === "number" ? chance : DEEP_DIVE_CHANCE;
  if (isTechKeyword(keyword) && mode !== "pressure" && Math.random() < p) {
    deepDive = { topic: keyword, left: 2 };
    return { started: true, left: 2 };
  }
  return { started: false, left: 0 };
}

/* ---------- 3) 句子级改写证据（规则引擎：无量化动词句 → 按维度给出改写模板） ---------- */
const REWRITE_TRIGGER = /(负责|主导|参与|优化|提升|完成|设计|实现|搭建|维护|重构|推进|落地)/;
function rewriteAdvice(s) {
  if (/负责|主导|参与/.test(s)) return { dimension: "内容深度", advice: "把「负责」升级为「主导」并补上范围与结果：「主导 XX 模块（覆盖 N 个场景），通过【具体手段】，将【核心指标】从 A 提升到 B（+N%）」。" };
  if (/优化|提升/.test(s)) return { dimension: "内容深度", advice: "补上优化前后对比：「针对 XX 瓶颈，引入【方案】，使【指标】从 A 降至 B（-N%），影响【用户量 / QPS】」。" };
  if (/设计|实现|搭建|重构/.test(s)) return { dimension: "结构逻辑", advice: "用 STAR 收尾：「在【背景】下，为达成【目标】，我设计并实现 XX，最终【可量化结果】」。" };
  return { dimension: "结构逻辑", advice: "按 STAR 重组：「背景 → 目标 → 我的行动 → 可量化结果」，每步一句话。" };
}
function buildSentenceRewrites(turns, max = 3) {
  const out = [], seen = new Set();
  for (const t of (turns || [])) {
    const sentences = String(t.answer || "").split(/[。！？；]/).map(s => s.trim()).filter(s => s.length >= 6 && s.length <= 60);
    for (const s of sentences) {
      if (out.length >= max) return out;
      if (seen.has(s) || /\d/.test(s) || !REWRITE_TRIGGER.test(s)) continue;
      seen.add(s);
      const r = rewriteAdvice(s);
      out.push({ original: s, dimension: r.dimension, advice: r.advice });
    }
  }
  return out;
}

/* ---------- 4) 语音输入实时反馈（纯本地规则：语速 + 填充词密度，零网络请求） ---------- */
function analyzeVoiceInput(text, ms) {
  const t = String(text || "");
  const chars = t.replace(/\s/g, "").length;
  if (!chars) return;
  const secs = Math.max(1, ms / 1000);
  const rate = Math.round(chars / secs * 10) / 10;
  const fillers = (t.match(/然后|那个|就是|嗯|啊|呃|哦/g) || []).length;
  let note = `🎤 语音输入分析：语速 ${rate} 字/秒 · 填充词 ${fillers} 次`;
  const tips = [];
  if (rate > 6) tips.push("语速偏快，面试场景建议放慢");
  if (fillers > 3) tips.push("填充词偏多，可用停顿替代");
  if (tips.length) note += `（${tips.join("；")}）`;
  addTimeline("观察员 Agent", note, "note");
  if (tips.length) toast(note);
}

/* ---------- 5) 投递看板（localStorage，按账号隔离） ---------- */
const BOARD_STATUSES = [
  { id: "applied",   label: "已投递",     icon: "📮" },
  { id: "written",   label: "笔试中",     icon: "✏️" },
  { id: "interview", label: "面试中",     icon: "🎙️" },
  { id: "offer",     label: "已拿 Offer", icon: "🎉" },
  { id: "rejected",  label: "已拒绝",     icon: "🙁" },
];
function getApplications() { try { return store.get("fm_apps", []) || []; } catch (e) { return []; } }
function saveApplications(list) { try { store.set("fm_apps", list, true); } catch (e) {} }

function renderBoard() {
  const apps = getApplications();
  const statsBox = $("board-stats");
  if (statsBox) {
    const active = apps.filter(a => a.status !== "offer" && a.status !== "rejected").length;
    const offers = apps.filter(a => a.status === "offer").length;
    statsBox.innerHTML = `
      <div class="board-stat"><div class="bs-num">${apps.length}</div><div class="bs-label">总投递</div></div>
      <div class="board-stat"><div class="bs-num">${active}</div><div class="bs-label">进行中</div></div>
      <div class="board-stat"><div class="bs-num">${offers}</div><div class="bs-label">已拿 Offer</div></div>
      <div class="board-stat"><div class="bs-num">${apps.length ? Math.round(offers / apps.length * 100) : 0}%</div><div class="bs-label">Offer 转化率</div></div>`;
  }
  const cols = $("board-columns");
  if (!cols) return;
  cols.innerHTML = BOARD_STATUSES.map((s, si) => {
    const items = apps.filter(a => a.status === s.id);
    return `<div class="board-col">
      <div class="board-col-head"><span>${s.icon} ${s.label}</span><span class="board-col-count">${items.length}</span></div>
      ${items.length ? items.map(a => `
        <div class="board-card">
          <div class="board-card-title">${esc(a.company)}</div>
          <div class="board-card-role">${esc(a.role)}</div>
          <div class="board-card-meta">${esc(a.date || "")}${a.note ? " · " + esc(a.note) : ""}</div>
          <div class="board-card-actions">
            <button onclick="moveApplication('${a.id}', -1)" title="上一阶段" ${si === 0 ? "disabled" : ""}>←</button>
            <button onclick="moveApplication('${a.id}', 1)" title="下一阶段" ${si === BOARD_STATUSES.length - 1 ? "disabled" : ""}>→</button>
            <button onclick="removeApplication('${a.id}')" title="删除记录">🗑</button>
          </div>
        </div>`).join("") : `<div class="board-empty">暂无记录</div>`}
    </div>`;
  }).join("");
}

function addApplication() {
  const company = $("app-company").value.trim();
  const role = $("app-role").value.trim();
  if (!company || !role) { toast("请填写公司与岗位名称"); return; }
  const apps = getApplications();
  apps.unshift({
    id: "a" + Date.now(),
    company, role,
    status: $("app-status").value || "applied",
    date: $("app-date").value.trim() || new Date().toLocaleDateString("zh-CN"),
    note: $("app-note").value.trim(),
    createdAt: Date.now(),
  });
  saveApplications(apps);
  $("app-company").value = ""; $("app-role").value = ""; $("app-note").value = "";
  renderBoard();
  toast(`已添加投递记录：${company} · ${role}`);
  try { logDev("info", `投递看板新增：${company} · ${role}`); } catch (e) {}
}

function moveApplication(id, dir) {
  const apps = getApplications();
  const app = apps.find(a => a.id === id);
  if (!app) return;
  const si = BOARD_STATUSES.findIndex(s => s.id === app.status);
  const ni = Math.max(0, Math.min(BOARD_STATUSES.length - 1, si + dir));
  if (ni === si) return;
  app.status = BOARD_STATUSES[ni].id;
  saveApplications(apps);
  renderBoard();
  toast(`${app.company} → ${BOARD_STATUSES[ni].label}`);
}

function removeApplication(id) {
  saveApplications(getApplications().filter(a => a.id !== id));
  renderBoard();
  toast("已删除投递记录");
}

/* ---------- 6) 面试复盘（6 轮对话补全 → 结构化结论，localStorage 持久化） ---------- */
const REVIEW_STEPS = [
  { key: "company", q: "第 1 步：这次面试的是哪家公司、什么岗位？" },
  { key: "round",   q: "第 2 步：这是第几轮、什么形式？（如：HR 初面 / 技术二面 / 终面）" },
  { key: "hardest", q: "第 3 步：被问到的印象最深的问题是什么？" },
  { key: "answer",  q: "第 4 步：你当时是怎么答的？现在回头看，自评打几分（1-10）？" },
  { key: "result",  q: "第 5 步：结果如何？（通过 / 待定 / 拒绝）" },
  { key: "improve", q: "第 6 步：如果重来一次，你最想改进的一点是什么？" },
];
let reviewState = null;

function switchJobsTab(tab) {
  document.querySelectorAll(".jobs-tab").forEach(b => {
    const on = b.dataset.jobs === tab;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".jobs-pane").forEach(p => { p.hidden = p.dataset.jobsPane !== tab; });
  if (tab === "review") renderReviewList();
}

function renderJobsPage() {
  renderBoard();
  renderReviewList();
}

function appendReviewMsg(role, text) {
  const box = $("review-chat");
  if (!box) return;
  const div = document.createElement("div");
  div.className = "review-msg " + role;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function startReview() {
  reviewState = { step: 0, answers: {} };
  $("review-chat").innerHTML = "";
  $("review-input-row").hidden = false;
  $("review-start-btn").disabled = true;
  $("review-cancel-btn").hidden = false;
  appendReviewMsg("ai", "🪞 复盘助手：面试结束后越早复盘越有效。我用 6 个问题帮你补全经过，最后生成结论。");
  setTimeout(askReviewQuestion, 300);
}
function askReviewQuestion() {
  if (!reviewState) return;
  appendReviewMsg("ai", REVIEW_STEPS[reviewState.step].q);
}
function submitReviewAnswer() {
  if (!reviewState) { toast("请先点击「开始新复盘」"); return; }
  const input = $("review-input");
  const text = input.value.trim();
  if (!text) { toast("请先输入内容"); return; }
  input.value = "";
  const step = REVIEW_STEPS[reviewState.step];
  appendReviewMsg("user", text);
  reviewState.answers[step.key] = text;
  reviewState.step++;
  if (reviewState.step < REVIEW_STEPS.length) {
    setTimeout(askReviewQuestion, 300);
  } else {
    finishReview();
  }
}
function buildReviewConclusion(a) {
  const scoreMatch = (a.answer || "").match(/\b([1-9]|10)\b/);
  const selfScore = scoreMatch ? scoreMatch[1] : "未自评";
  return `${a.company} · ${a.round}：最难问题「${a.hardest}」。自评 ${selfScore}/10，结果：${a.result}。改进点：${a.improve}。建议把该问题加入模拟面试题库重点演练，并用一次「压力面」复现当时的追问场景。`;
}
function getReviews() { try { return store.get("fm_reviews", []) || []; } catch (e) { return []; } }
function saveReviews(list) { try { store.set("fm_reviews", list, true); } catch (e) {} }
function finishReview() {
  const a = reviewState ? reviewState.answers : {};
  const reviews = getReviews();
  reviews.unshift({
    id: "r" + Date.now(),
    date: new Date().toLocaleString("zh-CN"),
    company: a.company || "", round: a.round || "", hardest: a.hardest || "",
    answer: a.answer || "", result: a.result || "", improve: a.improve || "",
    conclusion: buildReviewConclusion(a),
  });
  saveReviews(reviews.slice(0, 20));
  appendReviewMsg("ai", "✅ 复盘完成，结论已生成并存入「复盘记录」（仅存本地）。");
  $("review-input-row").hidden = true;
  $("review-start-btn").disabled = false;
  $("review-cancel-btn").hidden = true;
  reviewState = null;
  renderReviewList();
  try { logDev("info", `面试复盘完成：${a.company || ""}`); } catch (e) {}
}
function cancelReview() {
  reviewState = null;
  $("review-input-row").hidden = true;
  $("review-start-btn").disabled = false;
  $("review-cancel-btn").hidden = true;
  appendReviewMsg("ai", "已取消本次复盘（未保存任何记录）。");
}
function renderReviewList() {
  const box = $("review-list");
  if (!box) return;
  const reviews = getReviews();
  if (!reviews.length) {
    box.innerHTML = `<div class="empty-state"><div class="ic">🪞</div><p>还没有复盘记录。点击上方「开始新复盘」，用 6 轮对话生成你的第一份复盘结论。</p></div>`;
    return;
  }
  box.innerHTML = reviews.map(r => `
    <div class="review-item">
      <div class="review-item-head">
        <span class="review-item-title">${esc(r.company)}${r.round ? " · " + esc(r.round) : ""}</span>
        <span class="hint" style="margin-top:0">${esc(r.date)}</span>
      </div>
      <div class="review-item-body">
        <div><b>印象最深的问题：</b>${esc(r.hardest)}</div>
        <div><b>当时的回答：</b>${esc(r.answer)}</div>
        <div><b>结果：</b>${esc(r.result)}　<b>改进点：</b>${esc(r.improve)}</div>
      </div>
      <div class="review-conclusion">📌 ${esc(r.conclusion)}</div>
    </div>`).join("");
}

/* ---------- 7) 报告页：真实面试复盘入口卡 ---------- */
function reviewEntryCard() {
  return `<div class="page-card" style="margin-top:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
    <div style="flex:1;min-width:220px">
      <div class="card-section-title">🪞 真实面试复盘</div>
      <p class="card-section-sub" style="margin-bottom:0">刚面完真实面试？用 6 轮对话补全经过，生成可回查的复盘结论——与模拟面试的表现数据形成对流，闭合「练习 → 实战 → 再训练」闭环。</p>
    </div>
    <button class="btn btn-outline btn-sm" onclick="switchTab('jobs');switchJobsTab('review')">开始复盘 →</button>
  </div>`;
}

