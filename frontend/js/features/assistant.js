"use strict";
/* ---------- ⑦ AI 小助手（retrieve + streamChat） ---------- */
let aiAssistantOpen = false;
const AI_PRESETS = [
  {
    chip: "🎤 怎么开始模拟面试？",
    q: "怎么开始模拟面试",
    keys: ["怎么开始面试", "如何开始面试", "怎么模拟面试", "开始面试", "模拟面试"],
    a: "三步开始模拟面试：\n1. 点左侧栏「🎤 模拟面试」或底部导航进入面试页；\n2. 选择模式（综合 / 技术 / 压力 / HR）并确认目标岗位；\n3. 直接发送第一条消息，AI 面试官团队会依次提问。\n建议先到「简历优化」准备一份简历，面试官会结合简历内容深挖项目。",
    actions: [{ label: "去模拟面试", page: "interview" }],
  },
  {
    chip: "👑 VIP 有什么用？",
    q: "VIP 有什么用",
    keys: ["vip", "会员", "权益", "开通"],
    a: "VIP 会员权益：\n· 解锁操作系统 / 算法 / STAR 三个专属题库分类；\n· 错题本（自动收录答错题目，支持反复练习）；\n· 不限次数限时小测（免费用户每日 1 次）；\n· 顶栏 VIP 徽章与报告封面专属标识。\n测试账号 demo@futuremirror.app 登录后自动获得 VIP；也可在「个人中心」用演示开关手动切换。",
    actions: [{ label: "查看 VIP 权益", page: "profile" }, { label: "去题库刷题", page: "quiz" }],
  },
  {
    chip: "📝 怎么刷题？",
    q: "怎么刷题",
    keys: ["怎么刷题", "如何刷题", "题库", "刷题", "练习"],
    a: "题库页提供多种练习方式：\n· ⏱ 限时模考：每轮 5 题、每题 60 秒，模拟真实时间压力；\n· 📒 顺序练习 / 📑 章节练习：不限时，按顺序系统过知识点；\n· 📅 每日一练：每天 3 题，完成即打卡，连签天数自动记录；\n· 📕 错题本：答错 / 超时的题自动收录，VIP 可反复练习。",
    actions: [{ label: "去题库", page: "quiz" }],
  },
];
function toggleAiAssistant(force) {
  aiAssistantOpen = (typeof force === "boolean") ? force : !aiAssistantOpen;
  const panel = $("ai-assistant-panel");
  if (panel) {
    panel.classList.toggle("open", aiAssistantOpen);
    panel.setAttribute("aria-hidden", aiAssistantOpen ? "false" : "true");
  }
  if (typeof document !== "undefined") document.body.classList.toggle("ai-open", aiAssistantOpen);
  const tag = $("ai-mode-tag");
  if (tag) tag.textContent = llm ? "LLM · " + String(llm.model || "").slice(0, 14) : "Mock 检索";
  if (aiAssistantOpen) {
    renderAiQuick();
    const box = $("ai-assistant-messages");
    if (box && !box.children.length) {
      appendAiMsg("ai", "你好，我是面镜 AI 小助手 👋\n可以帮你查知识点、解释错题、推荐练习，或者告诉你怎么使用这个平台。试试问我「SQL 索引为什么会失效？」", true);
    }
    const input = $("ai-assistant-input");
    if (input) setTimeout(() => { try { input.focus(); } catch (e) {} }, 260);
  }
}
function renderAiQuick() {
  const box = $("ai-panel-quick");
  if (!box) return;
  const base = AI_PRESETS.map((p, i) => `<button class="ai-quick-chip" onclick="askAiPreset(${i})">${p.chip}</button>`).join("");
  /* v36：已载入报告上下文时，追加报告追问快捷问题 */
  const extra = aiReportCtx
    ? REPORT_FOLLOWUP_QUESTIONS.map((q, i) => `<button class="ai-quick-chip" onclick="askReportFollowupPreset(${i})">📊 ${escHtml(q)}</button>`).join("")
    : "";
  box.innerHTML = base + extra;
}
function askAiPreset(i) {
  const p = AI_PRESETS[i];
  if (!p) return;
  const input = $("ai-assistant-input");
  if (input) input.value = p.q;
  sendAiAssistant();
}
function aiPresetReply(q) {
  const s = String(q || "").toLowerCase();
  for (const p of AI_PRESETS) {
    if (p.keys.some(k => s.includes(k))) return p;
  }
  return null;
}
async function sendAiAssistant() {
  const input = $("ai-assistant-input");
  const q = (input ? input.value : "").trim();
  if (!q) { toast("先输入问题再发送"); return; }
  input.value = "";
  appendAiMsg("user", q, false);

  /* 1) 预设引导（使用指引 / 权益说明 / 刷题方法） */
  const preset = aiPresetReply(q);
  if (preset) {
    const actions = (preset.actions || []).map(a =>
      `<button class="btn btn-primary btn-sm" onclick="navTo('${a.page}');toggleAiAssistant(false)">${a.label}</button>`).join("");
    appendAiMsg("ai", esc(preset.a).replace(/\n/g, "<br>") + (actions ? `<div class="ai-actions">${actions}</div>` : ""), true);
    return;
  }

  /* 1.5) v36 报告追问：已载入报告上下文时，基于真实报告数据作答（不编造分数） */
  if (aiReportCtx) {
    const bubble = appendAiMsg("ai", "思考中…", true);
    if (bubble) bubble.classList.add("typing");
    if (llm || fmApi.backendReady()) {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 60000);
      let full = "";
      try {
        await streamChat([
          { role: "system", content: "你是面镜 FutureMirror 的面试教练。用户正在追问自己的评估报告。必须严格基于【本次评估报告】中的真实数据作答，不得编造任何分数或证据；数据未覆盖的部分要诚实说明，并给出可执行的下一步。" },
          { role: "user", content: `问题：${q}\n\n${aiReportCtx}` },
        ], (piece) => {
          full += piece;
          if (bubble) { bubble.classList.remove("typing"); bubble.textContent = full; }
          const b2 = $("ai-assistant-messages");
          if (b2) b2.scrollTop = b2.scrollHeight;
        }, ctrl.signal);
        if (bubble) { bubble.classList.remove("typing"); bubble.textContent = full || "（模型未返回内容）"; }
      } catch (e) {
        if (bubble) {
          bubble.classList.remove("typing");
          bubble.textContent = "模型调用失败（" + (e && e.message ? e.message : "未知错误") + "）。以下基于你的真实报告数据作答：\n" + ruleReportAnswer(q);
        }
      }
    } else if (bubble) {
      bubble.classList.remove("typing");
      bubble.innerHTML = "（未接入模型 · 基于你的真实报告数据作答）<br>" + escHtml(ruleReportAnswer(q)).replace(/\n/g, "<br>");
    }
    const b3 = $("ai-assistant-messages");
    if (b3) b3.scrollTop = b3.scrollHeight;
    return;
  }

  /* 2) 检索知识库（复用 RAG 的 retrieve） */
  const hits = typeof retrieve === "function" ? retrieve(q, 3) : [];
  const ctx = hits.map((h, i) => `[${i + 1}] ${h.title}：${h.content}`).join("\n");

  /* 3) 有 LLM（或后端在线）则流式回答；否则返回检索摘要（Mock 兜底） */
  if (llm || fmApi.backendReady()) {
    const bubble = appendAiMsg("ai", "思考中…", true);
    if (bubble) bubble.classList.add("typing");
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 60000);
    let full = "";
    try {
      await streamChat([
        { role: "system", content: "你是面镜 FutureMirror 的 AI 小助手。用简洁中文回答，优先基于提供的参考资料；资料不足时诚实说明，并可建议用户使用平台对应功能。回答末尾标注引用编号。" },
        { role: "user", content: `问题：${q}\n\n参考资料：\n${ctx || "（无检索结果）"}` },
      ], piece => {
        full += piece;
        if (bubble) { bubble.classList.remove("typing"); bubble.textContent = full; }
        const box = $("ai-assistant-messages");
        if (box) box.scrollTop = box.scrollHeight;
      }, ctrl.signal);
      if (bubble) { bubble.classList.remove("typing"); bubble.textContent = full || "（模型未返回内容）"; }
      if (hits.length) {
        const cite = document.createElement("div");
        cite.className = "ai-actions";
        cite.innerHTML = `<span style="font-size:11.5px;color:var(--faint)">引用：${hits.map((h, i) => `[${i + 1}] ${esc(h.source || h.title)}`).join(" · ")}</span>`;
        const box = $("ai-assistant-messages");
        if (box) box.appendChild(cite);
      }
    } catch (e) {
      if (bubble) {
        bubble.classList.remove("typing");
        bubble.textContent = "模型调用失败（" + (e && e.message ? e.message : "未知错误") + "）。以下是知识库中相关的内容：\n" + (hits.length ? hits[0].content.slice(0, 200) : "暂无相关资料。");
      }
    }
  } else {
    const reply = hits.length
      ? `（Mock 模式）知识库中相关的内容：\n\n${hits[0].content.slice(0, 220)}…\n\n来源：${hits[0].source || hits[0].title}\n接入 API Key 后可获得完整的模型回答。`
      : "知识库中暂未找到直接相关的内容，换个关键词试试，或接入 API Key 让模型自由回答。";
    appendAiMsg("ai", reply, true);
  }
  const box = $("ai-assistant-messages");
  if (box) box.scrollTop = box.scrollHeight;
}
function appendAiMsg(role, text, isHtml) {
  const box = $("ai-assistant-messages");
  if (!box) return null;
  const div = document.createElement("div");
  div.className = "ai-msg " + role;
  if (isHtml) div.innerHTML = text; else div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

/* ============================================================
 * v21 · AI 悬浮球：拖拽移动 + 贴边冻结（位置记忆，刷新/换账号保留）
 * ============================================================ */
(function () {
  const FAB_KEY = "fm_ai_fab";
  const EDGE = 16;        // 贴边留白
  const TOP_MIN = 72;     // 顶栏（58px）+ 移动端导航（44px）之下
  const BOTTOM_MIN = 72;  // 距视图底边留白（给底部弹层/手势区让位）
  const MOVE_THRESHOLD = 6;

  let dragMoved = false;

  function fabEl() { return (typeof document !== "undefined" && document) ? $("ai-fab") : null; }
  function vw() { return (typeof window !== "undefined" && window && window.innerWidth) || 1024; }
  function vh() { return (typeof window !== "undefined" && window && window.innerHeight) || 768; }
  function safeBottom() {
    try {
      const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sai-bottom"));
      return isNaN(n) ? 0 : n;
    } catch (e) { return 0; }
  }
  function clampY(y) { return Math.max(TOP_MIN, Math.min(y, vh() - BOTTOM_MIN)); }
  function setBodyFlag(cls, on) {
    try { if (document && document.body) document.body.classList.toggle(cls, on); } catch (e) {}
  }

  /* 应用冻结位置：pos = { side: "left"|"right", y: <px> }；pos 为空时回默认右下角 */
  function applyAiFabPos(pos, animate) {
    const el = fabEl();
    if (!el) return;
    const size = el.offsetWidth || 52;
    const side = pos && pos.side === "left" ? "left" : "right";
    const inset = safeBottom();
    const y = clampY(pos && typeof pos.y === "number" ? pos.y : vh() - (20 + inset) - size);
    const x = side === "left" ? EDGE : vw() - EDGE - size;
    if (!animate) el.style.transition = "none";
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.style.left = Math.round(x) + "px";
    el.style.top = Math.round(y) + "px";
    setBodyFlag("ai-fab-left", side === "left");
    if (!animate) { void el.offsetWidth; el.style.transition = ""; }
  }
  function saveAiFabPos(pos) { try { store.set(FAB_KEY, pos, true); } catch (e) {} }
  window.FmAiFab = { key: FAB_KEY, apply: applyAiFabPos, save: saveAiFabPos };

  function initAiFabDrag() {
    const el = fabEl();
    if (!el || el.dataset.dragReady) return;
    el.dataset.dragReady = "1";
    let pid = null, sx = 0, sy = 0, ox = 0, oy = 0;

    el.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button > 0) return;
      if (aiAssistantOpen) toggleAiAssistant(false);   // 拖动前先收起抽屉
      pid = e.pointerId !== undefined ? e.pointerId : "ptr";
      /* 起始坐标优先取 style 实时值（无布局环境/初始化后均可用），回落 rect */
      const r = el.getBoundingClientRect();
      ox = parseFloat(el.style.left) || r.left || 0;
      oy = parseFloat(el.style.top) || r.top || 0;
      sx = e.clientX; sy = e.clientY;
      dragMoved = false;
      el.classList.add("dragging");
      try { if (el.setPointerCapture) el.setPointerCapture(pid); } catch (err) {}
    });

    el.addEventListener("pointermove", (e) => {
      if (pid === null) return;
      if (e.pointerId !== undefined && e.pointerId !== pid) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!dragMoved) {
        if (Math.sqrt(dx * dx + dy * dy) < MOVE_THRESHOLD) return;
        dragMoved = true;
      }
      if (e.cancelable) e.preventDefault();
      el.style.transition = "none";
      el.style.right = "auto";
      el.style.bottom = "auto";
      const w = el.offsetWidth || 52;
      el.style.left = Math.max(4, Math.min(ox + dx, vw() - w - 4)) + "px";
      el.style.top = clampY(oy + dy) + "px";
    });

    const end = (e) => {
      if (pid === null) return;
      if (e && e.pointerId !== undefined && e.pointerId !== pid) return;
      pid = null;
      el.classList.remove("dragging");
      if (!dragMoved) return;               // 未移动 → 交给 click 处理（开/合抽屉）
      /* 以 style 中的实时位置判定贴边（不依赖布局，触屏/无头环境一致） */
      const w = el.offsetWidth || 52;
      const curLeft = parseFloat(el.style.left) || 0;
      const curTop = parseFloat(el.style.top) || 0;
      const side = (curLeft + w / 2) < vw() / 2 ? "left" : "right";
      const pos = { side: side, y: Math.round(curTop) };
      applyAiFabPos(pos, true);
      saveAiFabPos(pos);
      toast(side === "left" ? "🧊 已冻结在左侧" : "🧊 已冻结在右侧");
      /* 兜底复位：异常终止（如 pointercancel 无 click）时避免吞掉下一次点击 */
      setTimeout(() => { dragMoved = false; }, 400);
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", () => {
      pid = null;
      el.classList.remove("dragging");
      setTimeout(() => { dragMoved = false; }, 400);
    });

    /* 点击开合抽屉；拖动结束伴随的 click 被吞掉，避免误触 */
    el.addEventListener("click", (e) => {
      if (dragMoved) { dragMoved = false; e.preventDefault(); e.stopPropagation(); return; }
      toggleAiAssistant();
    });
    el.addEventListener("contextmenu", (e) => { if (dragMoved) e.preventDefault(); });
  }

  function bootAiFab() {
    applyAiFabPos(store.get(FAB_KEY, null), false);
    const el = fabEl();
    if (el && !store.get(FAB_KEY, null)) {           // 首次进入：提示可拖动
      el.classList.add("hint");
      setTimeout(() => el.classList.remove("hint"), 3400);
    }
    initAiFabDrag();
    if (typeof window !== "undefined" && window && window.addEventListener) {
      let rt = null;
      window.addEventListener("resize", () => {     // 视口变化时重新钳制
        clearTimeout(rt);
        rt = setTimeout(() => applyAiFabPos(store.get(FAB_KEY, null), false), 120);
      });
    }
  }

  /* 无 body 的沙盒环境（无头逻辑测试桩）下延后到 DOMContentLoaded，避免启动即崩 */
  if (document && document.body) bootAiFab();
  else if (document && document.addEventListener) document.addEventListener("DOMContentLoaded", bootAiFab);
})();


/* ============================================================
 * v36 · 报告追问：把评估报告注入 AI 小助手上下文
 *   ① buildReportContext：维度得分 / 评分证据 / 学习路径 → 结构化文本
 *   ② askReportFollowup / askReportFollowupPreset：打开小助手并携带上下文
 *   ③ reportFollowupCard：报告页预设追问卡
 *   原则：回答必须基于用户真实报告数据，无数据时明确提示先完成面试
 * ============================================================ */

const REPORT_FOLLOWUP_QUESTIONS = [
  "我这次最弱的是哪个维度？该怎么补？",
  "把最弱维度的评分证据逐条解释一下",
  "给我一份针对本次表现的 7 天改进计划",
  "我的回答里哪些话拖了分？怎么改写？",
];

/* 报告上下文（最近一次报告的结构化快照） */
let aiReportCtx = null;

function buildReportContext() {
  if (typeof lastReportData === "undefined" || !lastReportData) return "";
  const r = lastReportData;
  const dims = (r.dims || []).map((d) => `${d.dimension} ${d.score} 分：${d.comment || ""}`).join("\n");
  const ev = (r.evidence || []).slice(0, 8)
    .map((e) => `[${e.agent || "观察员"}] 原话“${e.quote || ""}” → ${e.note || ""}`).join("\n");
  const plan = (r.plan || []).slice(0, 7)
    .map((p) => (p && p.day ? `${p.day}：${p.task || ""}` : "")).filter(Boolean).join("\n");
  const weakest = r.weakest && r.weakest.dimension ? `最弱维度：${r.weakest.dimension}（${r.weakest.score} 分）` : "";
  return [
    `【本次评估报告】总分 ${r.total}/100　${weakest}`,
    `维度得分：\n${dims}`,
    `评分证据（引用真实回答）：\n${ev || "（无）"}`,
    `7 天学习路径：\n${plan || "（无）"}`,
  ].join("\n\n");
}

/* 无模型时的确定性兜底回答（基于真实报告数据，不编造） */
function ruleReportAnswer(q) {
  const r = (typeof lastReportData !== "undefined" && lastReportData) ? lastReportData : null;
  if (!r) return "还没有可用的评估报告，请先完成一次模拟面试再来追问。";
  const s = String(q || "");
  const weak = [...(r.dims || [])].sort((a, b) => a.score - b.score)[0];
  if (/最弱|哪个维度|短板/.test(s) && weak) {
    return `本次最弱维度是「${weak.dimension}」${weak.score} 分。${weak.comment || ""}\n建议优先补齐该维度，再回头复盘得分较高的维度。`;
  }
  if (/证据|为什么|依据/.test(s)) {
    const list = (r.evidence || []).slice(0, 3);
    if (!list.length) return "本次报告暂无可引用的评分证据。";
    return `以下是引用你真实回答的评分证据：\n${list.map((e, i) => `${i + 1}. [${e.agent || "观察员"}] “${e.quote || ""}” → ${e.note || ""}`).join("\n")}`;
  }
  if (/计划|7\s*天|提升|改进/.test(s)) {
    const plan = (r.plan || []).slice(0, 7);
    if (!plan.length) return "本次报告暂未生成学习路径。";
    return `已为你生成的学习路径：\n${plan.map((p) => `${p.day}：${p.task || ""}`).join("\n")}`;
  }
  if (/改写|拖了分|怎么改/.test(s)) {
    return `优先改写最弱维度「${weak ? weak.dimension : "—"}」相关的回答：把「负责 / 参与」升级为「主导」，并补上量化结果（如 QPS、人数、百分比）。报告中「句子级改写建议」区块已给出逐句模板。`;
  }
  return `本次报告总分 ${r.total}/100，最弱维度「${weak ? weak.dimension : "—"}」。你可以问我：最弱维度怎么补、评分证据逐条解释、7 天改进计划、哪些话拖了分。`;
}

function askReportFollowup(q) {
  const ctx = buildReportContext();
  if (!ctx) { toast("还没有评估报告，请先完成一次模拟面试"); return; }
  aiReportCtx = ctx;
  toggleAiAssistant(true);
  renderAiQuick();
  if (q) {
    const input = $("ai-assistant-input");
    if (input) input.value = q;
    sendAiAssistant();
  } else {
    appendAiMsg("ai", "已载入你本次的评估报告 📊 可以直接问：最弱维度怎么补、评分证据逐条解释、哪些话拖了分。你也可以自由提问。", true);
  }
}

function askReportFollowupPreset(i) {
  const q = REPORT_FOLLOWUP_QUESTIONS[i];
  if (!q) return;
  askReportFollowup(q);
}

/* 报告页「追问细节」区块（v37：维度条形图，点击直接追问该维度） */
function reportFollowupCard() {
  const r = (typeof lastReportData !== "undefined" && lastReportData) ? lastReportData : null;
  const dims = (r && Array.isArray(r.dims)) ? r.dims : [];
  let weakIdx = -1;
  if (dims.length) {
    weakIdx = dims.reduce((m, d, i) => ((dims[i].score || 0) < (dims[m].score || 0) ? i : m), 0);
  }
  const chart = dims.length ? `
    <div class="rf-chart">
      <div class="pane-title" style="font-size:12.5px">📊 维度得分（朱红为最弱项 · 点击条形直接追问）</div>
      ${hbarSVG(dims.map((d, i) => {
        const name = String(d.dimension || ("维度 " + (i + 1))).replace(/['"\\]/g, "");
        return {
          label: name,
          value: d.score || 0,
          text: String(d.score == null ? "—" : d.score),
          hot: i === weakIdx,
          tip: `${name} ${d.score} 分`,
          onclick: `askReportFollowup('我的${name}维度得分偏低，怎么针对性提升？')`,
        };
      }), { aria: "报告维度得分", max: 100 })}
    </div>` : "";
  return `<div class="card" style="padding:14px 16px;margin-top:14px">
    <div class="pane-title" style="margin-bottom:2px">🤖 对报告追问细节
      <span class="tag-demo">v36 · 报告数据已注入 AI 小助手</span>
    </div>
    <p class="hint" style="margin-top:0">
      点击预设问题或打开小助手自由提问，AI 会携带本次报告的维度得分、评分证据与学习路径作答——基于你的真实数据，不编造分数。
    </p>
    <div class="career-chips" style="margin-top:8px">
      ${REPORT_FOLLOWUP_QUESTIONS.map((q, i) => `<button class="chip-btn" onclick="askReportFollowupPreset(${i})">${escHtml(q)}</button>`).join("")}
    </div>
    ${chart}
    <div style="margin-top:10px">
      <button class="btn btn-primary btn-sm" onclick="askReportFollowup()">🤖 打开 AI 小助手自由追问 →</button>
    </div>
  </div>`;
}
