"use strict";
/* ============================================================
 * 5. 模拟面试（多 Agent + 规划/工具调用/证据时间线 + 语音 + 真实 LLM）
 * ============================================================ */
const SPEAKERS = [
  { id: "hr", name: "HR 面试官" },
  { id: "tech", name: "技术面试官" },
  { id: "pressure", name: "压力面试官" },
];
/* 面试官人设元数据（图标 + 温度：低=更严格） */
const SPEAKER_META = {
  "HR 面试官": { icon: "💼", warmth: "高", temp: 0.5 },
  "技术面试官": { icon: "⚙️", warmth: "中", temp: 0.3 },
  "压力面试官": { icon: "🔥", warmth: "低", temp: 0.8 },
};
function setCurrentSpeaker(name) {
  const meta = SPEAKER_META[name] || { icon: "🤖", warmth: "中", temp: 0.5 };
  const el = $("chat-agent");
  el.textContent = `${meta.icon} ${name} · 温度 ${meta.temp}`;
  el.title = `人设温度：${meta.warmth}（低 = 更严格）`;
}
const MODE_LABEL = { general: "综合面 · 动态追问模式", tech: "技术面 · 项目深挖模式", pressure: "压力面 · 抗压追问模式" };

/* ============ v32 · 面试轮次上限 ============ */
/** 一场模拟面试固定 5 轮问答（与进度条 / 侧栏徽章的 x/5 口径保持一致） */
const MAX_TURNS = 5;
/** 是否已进入「面试官收尾」流程：防止 Mock / 真实 LLM 双通道重复触发自动结束 */
let interviewClosed = false;

/**
 * 冻结 / 解冻回答输入框与发送按钮。
 * 第 5 轮答完后冻结，避免用户在已收尾的会话里继续追加问答。
 * @param {boolean} locked true 冻结 / false 解冻
 * @returns {void}
 */
function lockInput(locked) {
  const input = $("chat-input");
  if (!input) return;
  input.disabled = locked;
  input.value = "";
  input.placeholder = locked
    ? `本轮面试已结束（${MAX_TURNS}/${MAX_TURNS}），点「重新面试」开始新一轮`
    : "输入你的回答，Enter 发送";
  const send = $("chat-send");
  if (send) send.disabled = locked;
}

/**
 * 第 5 题答完后的收尾入口：未达轮次上限则什么都不做。
 * @returns {boolean} 是否已触发收尾
 */
function maybeFinishAtTurnLimit() {
  if (interviewClosed || session.turns.length < MAX_TURNS) return false;
  finishByInterviewer();
  return true;
}

/**
 * 面试官主动收尾：第 5 题答完后由面试官发出结束通知，自动结束本场面试。
 * 只在 sendMsg 链路触发（刷新恢复会话、撤销重置均不触发），
 * 因此是「答完第 5 题」这一动作的直接结果，而非历史回放的副作用。
 * @returns {void}
 */
function finishByInterviewer() {
  if (interviewClosed) return;
  if (session.turns.length < MAX_TURNS) return;   // 未到轮次上限，不收尾
  interviewClosed = true;
  const body = $("chat-body");
  const notice = document.createElement("div");
  notice.className = "msg msg-system";
  notice.textContent =
    `面试官：本场（${MODE_SHORT[session.mode] || "模拟面试"}）${MAX_TURNS} 轮问答已完成，` +
    `面试到此结束。观察员已汇总全部证据，正在生成你的可解释评估报告…`;
  body.appendChild(notice);
  body.scrollTop = body.scrollHeight;
  addTimeline("规划 Agent", `🏁 已收集 ${MAX_TURNS} 轮证据 → 面试官发送结束通知，自动收尾并生成报告`, false);
  stopAnswerTimer();
  lockInput(true);
  const hint = $("live-hint");
  if (hint) {
    hint.className = "live-hint ok";
    hint.textContent = `🏁 本轮面试已结束（${MAX_TURNS}/${MAX_TURNS}），报告已生成`;
  }
  const pb = $("progress-bar");
  if (pb) pb.style.width = "100%";
  setTimeout(finishInterview, 1600);   // 留出读完通知的时间，再跳转报告页
}

/* ============ v10 · 面试题库（结构化，动态抽题：律师没问过的优先） ============ */
const QUESTION_BANK = {
  general: [
    "请用 3 分钟介绍一下你自己，重点讲一个最有代表性的项目。",
    "你为什么选择我们公司/这个岗位？未来的职业规划是什么？",
    "讲一个你与团队产生分歧的经历，最后是如何解决的？",
    "你最有成就感的一件事是什么？为什么？",
    "你遇到过的最大挫折是什么？从中学到了什么？",
    "如果同时拿到几个 offer，你会如何选择？",
  ],
  tech: [
    "请挑一个你最熟悉的项目，讲清它的业务背景、你的角色、技术难点与最终结果。",
    "你项目中遇到的最难的一个技术问题是什么？如何定位与解决的？",
    "如果这个项目的流量再涨 10 倍，你的架构会从哪里先崩溃？如何应对？",
    "你如何保证代码的可维护性和可测试性？",
    "请讲讲你对技术选型的思考，为什么选 A 而不是 B？",
    "项目中用过哪些设计模式？举个例子说明为什么用它。",
  ],
  pressure: [
    "你刚才讲的这个方案，我让一个实习生来做一周也能做出来——你的不可替代性在哪？",
    "坦白说，这个项目里你的贡献听起来很模糊，你能具体说说你个人做了哪部分吗？",
    "如果 deadline 提前一半，你会砍掉哪个功能？砍错了导致线上事故你负责吗？",
    "你简历上写的 QPS 数据，是真实测出来的还是估计的？怎么验证的？",
    "如果你和 leader 意见完全相反，你会怎么做？",
    "你觉得自己最大的缺点是什么？不要说「我太追求完美」这种话。",
  ],
};
const MODE_SHORT = { general: "综合面", tech: "技术面", pressure: "压力面" };
/* 带题库数量的模式标签 */
function modeLabelWithCount(m) {
  const n = (QUESTION_BANK[m] || []).length;
  const base = MODE_LABEL[m] || MODE_SHORT[m] || m;
  return `${base} · 题库 ${n} 题`;
}

const FOLLOW_UPS = [
  k => `你提到「${k}」——这部分你具体负责哪块？遇到的最大难点是什么，怎么解决的？`,
  k => `关于「${k}」，能量化一下结果吗？比如延迟降低多少、影响了多少用户？`,
  k => `如果重做一次「${k}」，你会在技术选型或协作方式上做什么不同的决策？`,
  k => `「${k}」这个方案，当时对比过哪些备选方案？为什么最终选了它？`,
];
const TECH_QUESTIONS = [
  k => `「${k}」的缓存一致性你怎么保证？如果缓存与 DB 不一致，用户侧会看到什么现象？`,
  k => `「${k}」如果流量再涨 10 倍，你的架构哪一环会先成为瓶颈？怎么扩容？`,
  k => `讲讲「${k}」底层的数据结构或协议细节，比如你说用了哈希，那冲突是怎么解决的？`,
];
/* v18：压力面试官三段式话术（打断-否定-要求举证）前置，保留原有质疑式追问 */
const PRESSURE_QUESTIONS = [
  k => `等等，你说的是「${k}」——但我理解的是另一回事。你能澄清一下你实际做的是什么吗？`,
  k => `我必须直说：「${k}」这部分听起来更像团队成果。请举证说明你个人的具体贡献。`,
  k => `如果现在让你现场讲清「${k}」的关键实现，5 分钟够吗？不够的话，凭什么认为它经得起深挖？`,
  k => `「${k}」这个方案，我让一个实习生来写一周也能做出来——你的不可替代性在哪？`,
  k => `坦白说，「${k}」这部分讲得太笼统。你确定这段是你本人做的，而不是跟风写的？`,
  k => `如果 deadline 提前一半，「${k}」你会砍掉什么？砍错了导致线上事故你负责吗？`,
];
/* v18：HR 面试官专属题库（动机 / 稳定性 / 协作）——不再复用通用追问句式，人设差异可感知 */
const HR_QUESTIONS = [
  k => `你提到「${k}」——如果下一家公司只能给你一半的资源或并发量，这段经历还能支撑你的价值主张吗？`,
  k => `在「${k}」里你最大的成长是什么？如果用一个词概括，会是哪个词，为什么？`,
  k => `当时为什么选择做「${k}」？如果重来一次，你会选一个不同的方向吗？`,
  k => `推动「${k}」的过程中，团队里有人不认可这个方向，你是怎么处理的？`,
];
/* v18：连环追问（深度追问）题库——同一技术点连续深挖，呈现「Agent 决策」而非固定轮转 */
const DEEP_DIVE_QUESTIONS = [
  k => `我们继续深挖「${k}」：你说用了这个方案，它在你项目里的具体参数/阈值是怎么定的？依据是什么？`,
  k => `「${k}」这个方案最常见的坑是什么？你在落地时踩过吗，怎么发现的？`,
  k => `如果去掉「${k}」里的某一个组件，会发生什么？请给出你的推理过程。`,
];
const KB_QUERY_TOOL = ["缓存一致性", "高并发 扩容", "索引 慢查询", "分布式锁"];
const SYS_PROMPTS = {
  general: "你是「面镜 FutureMirror」模拟面试中的面试官，风格专业友好。基于候选人刚才的回答，提出下一个最有价值的追问。只输出一个问题，中文，两句话以内，不要解释。",
  tech: "你是资深技术面试官，正在深挖候选人的项目。基于候选人刚才的回答，指出一个技术薄弱点并追问细节（原理/量化/取舍）。只输出一个问题，中文，两句话以内。",
  pressure: "你是压力面试官，风格尖锐但保持职业。基于候选人刚才的回答，提出一个质疑式追问。只输出一个问题，中文，两句话以内，不要人身攻击。",
};

/* v10：题库 + 动态追问模板混合出题——优先发未被问过的题库原题，其余基于回答关键词动态生成
 * v18：① 连环追问优先（同一技术点连续 2 轮深挖）② 按面试官人设选池（HR / 压力面有专属题库） */
function pickQuestion(mode, n, keyword, speaker) {
  if (deepDive.left > 0) {
    const k = deepDive.topic || keyword;
    deepDive.left--;
    if (deepDive.left <= 0) deepDive = { topic: null, left: 0 };
    return DEEP_DIVE_QUESTIONS[(n || 0) % DEEP_DIVE_QUESTIONS.length](k);
  }
  let pool;
  if (mode === "tech") pool = TECH_QUESTIONS;
  else if (mode === "pressure") pool = PRESSURE_QUESTIONS;
  else if (speaker && speaker.id === "hr") pool = HR_QUESTIONS;
  else if (speaker && speaker.id === "pressure") pool = PRESSURE_QUESTIONS;
  else pool = FOLLOW_UPS;
  const bank = QUESTION_BANK[mode] || [];
  const used = new Set(session.turns.map(t => t.question));
  const fresh = bank.filter(q => !used.has(q));
  if (fresh.length && (n <= 1 || n % 2 === 0)) return fresh[0];
  return pool[n % pool.length](keyword);
}

let session = { mode: "general", turns: [] };   // 在 bootApp() 中按当前用户加载
let turn = 0;
let recognition = null, listening = false, voiceStartAt = 0;
let speaking = false;
let lastReportSig = "";

/* ---- 真实 LLM 接入（OpenAI 兼容流式） ---- */
const LLM_PRESETS = [
  { label: "智谱 GLM（有免费额度）", baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" },
  { label: "DeepSeek", baseUrl: "https://api.deepseek.com", model: "deepseek-chat" },
  { label: "OpenRouter（有免费模型）", baseUrl: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.1-8b-instruct:free" },
  { label: "SiliconFlow 硅基流动", baseUrl: "https://api.siliconflow.cn/v1", model: "Qwen/Qwen2.5-7B-Instruct" },
  { label: "自定义 OpenAI 兼容服务", baseUrl: "", model: "" },
];
let llm = (() => { try { return JSON.parse(sessionStorage.getItem("fm_llm")); } catch { return null; } })();

function initLlmPanel() {
  $("llm-preset").innerHTML = LLM_PRESETS.map((p, i) => `<option value="${i}">${p.label}</option>`).join("");
  onPresetChange();
  if (llm) { $("llm-key").value = llm.apiKey; }
  // v22：后端适配层初始化（异步探测，不阻塞面板渲染；不可达时静默回退本地 Key / Mock）
  try {
    fmApi.init();
    const baseInput = $("llm-api-base");
    if (baseInput) baseInput.value = fmApi.base;
    fmApi.checkHealth().then(refreshBackendUi).catch(() => {});
  } catch (e) {}
  updateLlmStatus();
}
function onPresetChange() {
  const p = LLM_PRESETS[$("llm-preset").value];
  if (!p) return;
  if (p.baseUrl) $("llm-base").value = p.baseUrl;
  if (p.model) $("llm-model").value = p.model;
}
function openApiKeyPanel() { $("llm-panel").hidden = !$("llm-panel").hidden; }
function hostOf(url) { try { return new URL(url).host; } catch { return url.replace(/^https?:\/\//, "").split("/")[0]; } }
function saveLlm() {
  const baseUrl = $("llm-base").value.trim().replace(/\/+$/, "");
  const apiKey = $("llm-key").value.trim();
  const model = $("llm-model").value.trim();
  if (!baseUrl || !apiKey || !model) { toast("请填写完整的 Base URL、API Key 与模型名"); return; }
  llm = { baseUrl, apiKey, model };
  sessionStorage.setItem("fm_llm", JSON.stringify(llm));
  updateLlmStatus();
  toast("已启用真实模型：" + model);
}
function clearLlm() {
  llm = null;
  sessionStorage.removeItem("fm_llm");
  $("llm-key").value = "";
  updateLlmStatus();
  // v22.1：后端在线时清了直连 Key 也不会回到 Mock（还是走后端），文案要说清
  toast(fmApi.backendReady() ? "已清除直连 Key，仍走后端模型" : "已清除 Key，回到 Mock 模式");
}
function updateLlmStatus() {
  const el = $("llm-status");
  if (el) {
    if (fmApi.backendReady()) {
      // v22：后端模式（Key 只存服务端）
      el.textContent = fmApi.health.llm_ready ? "后端真实模式 · " + fmApi.backendModel() : "后端 Mock 模式";
      el.className = "badge " + (fmApi.health.llm_ready ? "badge-green" : "badge-amber");
    } else if (llm) {
      el.textContent = "直连真实模式 · " + llm.model;
      el.className = "badge badge-green";
    } else {
      el.textContent = "Mock 模式";
      el.className = "badge badge-amber";
    }
  }
  try { syncStatusPill(); } catch (e) {}   // v10：顶栏状态胶囊同步
}

async function streamChat(messages, onDelta, signal) {
  // v22：优先走自建后端（Key 只存服务端环境变量，前端零接触）
  if (fmApi.backendReady()) return fmApi.chat(messages, onDelta, signal);
  if (!llm) throw new Error("未配置模型：请连接后端或在「真实 LLM 接入」面板填写 API Key");
  const url = llm.baseUrl.replace(/\/+$/, "") + "/chat/completions";

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + llm.apiKey.trim(),
      },
      body: JSON.stringify({ model: llm.model.trim(), stream: true, messages }),
    });
  } catch (e) {
    if (e.name === "AbortError") throw new Error("请求超时（60s），免费模型响应可能较慢，请重试", { cause: e });
    throw new Error(e.message === "Failed to fetch"
      ? "网络请求失败（浏览器直连被拦截或网络不通）：请确认 Base URL 的服务商支持 CORS 跨域直连（推荐智谱 GLM / OpenRouter）"
      : e.message, { cause: e });
  }
  if (!res.ok) {
    let detail = "";
    try { const j = await res.json(); detail = (j.error && j.error.message) || j.message || ""; } catch { /* 非 JSON 响应 */ }
    const hints = {
      400: "请求参数错误，请检查模型名是否正确（智谱免费模型为 glm-4-flash）",
      401: "API Key 无效，请检查是否复制完整、有多余空格",
      403: "无权限，请确认 Key 已开通该模型",
      404: `路径 ${url} 不存在，请检查 Base URL（智谱应为 https://open.bigmodel.cn/api/paas/v4）`,
      429: "请求过于频繁或免费额度已用完",
    };
    throw new Error(`HTTP ${res.status}${hints[res.status] ? "（" + hints[res.status] + "）" : ""}${detail ? "：" + detail : ""}`);
  }
  if (!res.body) throw new Error("响应无 body，请确认服务商支持流式输出（stream=true）");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices && json.choices[0] && json.choices[0].delta;
        // 兼容 content / reasoning_content / text 三种字段（部分服务商用 reasoning_content）
        const piece = delta && (delta.content || delta.reasoning_content || delta.text || "");
        if (piece) onDelta(piece);
      } catch { /* 忽略不完整 JSON 行 */ }
    }
  }
}

function buildMessages(text) {
  const msgs = [{ role: "system", content: SYS_PROMPTS[session.mode] || SYS_PROMPTS.general }];
  for (const t of session.turns) {
    msgs.push({ role: "assistant", content: t.question });
    msgs.push({ role: "user", content: t.answer });
  }
  msgs.push({ role: "user", content: text });
  return msgs;
}

/* ---- 模式切换 ---- */
function setMode(m) {
  session.mode = m;
  document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === m));
  $("chat-mode-label").textContent = modeLabelWithCount(m);
  addTimeline("规划 Agent", `模式切换为「${MODE_SHORT[m] || m}」→ 加载题库 ${(QUESTION_BANK[m] || []).length} 题，已更新提问策略`, false);
  persistSession();
}

function extractKeyword(text) {
  const cleaned = text.replace(/[，。！？、；\s,.!?;]+/g, " ").trim();
  const words = cleaned.split(" ").filter(w => w.length >= 2);
  return words.slice(0, 3).join("") || "这个项目";
}

/* 规划 Agent 的决策理由（可解释的派发逻辑） */
function planReason(speaker, keyword, notes, mode) {
  const k = keyword.slice(0, 12) || "该回答";
  const reasons = {
    hr: `回答侧重动机与协作，「${k}」偏团队与沟通面 → 派 HR 面试官考察稳定性`,
    tech: `检测到技术关键词「${k}」${notes.includes("量化") ? "且缺少量化数据" : ""} → 派技术面试官深挖原理与取舍`,
    pressure: `回答结构完整但${notes.includes("偏长") ? "篇幅偏长" : "细节待验证"}，压力测试性价比高 → 派压力面试官做边界追问`,
  };
  return reasons[speaker.id] || `由 ${speaker.name} 按当前模式（${mode}）追问深度`;
}

function observerNote(answer) {
  const notes = [];
  if (answer.length < 30) notes.push("回答过短，信息量不足");
  if (!/\d/.test(answer)) notes.push("缺少量化数据支撑");
  if (answer.length > 400) notes.push("篇幅偏长，注意结构化表达");
  if (/然后|那个|就是/.test(answer)) notes.push("口头禅偏多，影响表达专业度");
  return notes.length ? notes.join("；") : "结构完整，建议追问细节以验证深度";
}

function addTimeline(agent, text, kind) {
  const tl = $("timeline");
  if (tl.children.length === 1 && tl.children[0].style.color) tl.innerHTML = "";
  const div = document.createElement("div");
  div.className = "tl-item" + (kind ? " " + kind : "");
  const icon = kind === "note" ? "📝 " : kind === "tool" ? "🔧 " : "";
  div.innerHTML = `<span class="tl-agent">${escHtml(agent)}</span><br>${icon}${escHtml(text)}`;
  tl.appendChild(div);
  tl.scrollTop = tl.scrollHeight;
}

function persistSession() { store.set("fm_session", session); }

function sendMsg() {
  if (!requireLogin()) return;
  // v32：已达 5 轮上限，本场已由面试官收尾——不再接受新一轮问答
  if (interviewClosed || session.turns.length >= MAX_TURNS) {
    interviewClosed = true;
    lockInput(true);
    toast(`本轮面试已完成 ${MAX_TURNS} 轮问答，报告已生成；如需再来一轮请点「重新面试」`);
    finishInterview();
    return;
  }
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  stopAnswerTimer();
  const body = $("chat-body");
  const userDiv = document.createElement("div");
  userDiv.className = "msg msg-user";
  userDiv.textContent = text;
  body.appendChild(userDiv);
  body.scrollTop = body.scrollHeight;

  const speaker = SPEAKERS[turn % SPEAKERS.length];
  turn++;
  setCurrentSpeaker(speaker.name);
  const keyword = extractKeyword(text);
  const notes = observerNote(text);
  if (llm || fmApi.backendReady()) { sendMsgReal(text, speaker, keyword, notes); return; }
  sendMsgMock(text, speaker, keyword, notes);
}

/* ---- Mock 通道：规划 → 工具三态调用 → 打字机流式 → 观察员记录 ---- */
function sendMsgMock(text, speaker, keyword, notes) {
  const body = $("chat-body");
  $("chat-send").disabled = true;
  const mode = session.mode;

  // v18：连环追问概率——检测到技术关键词时，有机会连续 2 轮深挖同一点（而非固定轮转）
  const dive = maybeStartDeepDive(keyword, mode);
  if (dive.started) {
    addTimeline("规划 Agent", `🔍 检测到技术关键词「${keyword.slice(0, 12)}」→ 触发连环追问（连续 ${dive.left} 轮深挖同一点）`, false);
  }

  addTimeline("规划 Agent", `🧠 分析回答要点「${keyword.slice(0, 14)}」…`, false);
  setTimeout(() => {
    addTimeline("规划 Agent", `📋 决策：${planReason(speaker, keyword, notes, mode)}（置信度 ${Math.min(95, 60 + turn * 6)}%）`, false);
  }, 320);

  setTimeout(() => {
    if (mode === "tech" || (mode === "general" && turn % 2 === 0)) {
      const tool = KB_QUERY_TOOL[turn % KB_QUERY_TOOL.length];
      addTimeline(speaker.name, "准备调用工具…", false);
      setTimeout(() => {
        addTimeline(speaker.name, `⏳ search_kb("${keyword} ${tool}") 调用中…`, "tool");
        setTimeout(() => {
          addTimeline(speaker.name, `✅ 命中 2 条（合成面经 / 合成题库）· 耗时 12ms · 开始生成追问…`, "tool");
        }, 420);
      }, 280);
    }
  }, 420);

  setTimeout(() => {
    addTimeline(speaker.name, "💭 正在基于检索结果生成追问…", false);
    showTyping("生成追问中");   // v24：等待期墨点反馈
  }, 900);

  setTimeout(() => {
    hideTyping();               // v24：流式气泡接管
    const question = pickQuestion(mode, turn, keyword, speaker);
    const bubble = document.createElement("div");
    bubble.className = "msg msg-ai";
    bubble.dataset.turn = String(turn - 1);   // v28：与 session.turns 下标对齐，供实时批注定位
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
    let i = 0;
    const timer = setInterval(() => {
      /* 用 textContent 逐字推进再挂光标，避免把问题文本当 HTML 解析
       * （innerHTML 拼接会让文本里的标签改变 DOM 结构） */
      bubble.textContent = question.slice(0, ++i);
      const caret = document.createElement("span");
      caret.className = "caret";
      bubble.appendChild(caret);
      body.scrollTop = body.scrollHeight;
      if (i >= question.length) {
        clearInterval(timer);
        bubble.textContent = question;
        v16MaybeAutoSpeak();
        addTimeline(speaker.name, "📮 已发送提问（流式输出完成）", false);
        startAnswerTimer();
        addTimeline("观察员 Agent", `记录证据 #${turn}（置信度 ${Math.min(95, 55 + Math.round(text.length / 12))}%）→ 写入评估上下文：${notes}`, "note");
        session.turns.push({ agent: speaker.name, question, answer: text, notes, mode });
        persistSession();
        updateLiveTracker();
        if (turn === MAX_TURNS) addTimeline("规划 Agent", `已收集 ${MAX_TURNS} 轮证据 → 评估上下文就绪，面试到此结束`, false);
        $("chat-send").disabled = false;
        body.scrollTop = body.scrollHeight;
        // v32：第 5 题答完 → 面试官发送结束通知并自动收尾
        maybeFinishAtTurnLimit();
      }
    }, 28);
  }, 1250);
}

/* ---- 真实 LLM 通道：浏览器直连 OpenAI 兼容流式接口 ---- */
async function sendMsgReal(text, speaker, keyword, notes) {
  const body = $("chat-body");
  $("chat-send").disabled = true;

  addTimeline("规划 Agent", `🧠 分析回答要点「${keyword.slice(0, 14)}」…`, false);
  setTimeout(() => addTimeline("规划 Agent", `📋 决策：${planReason(speaker, keyword, notes, session.mode)}（置信度 ${Math.min(95, 60 + turn * 6)}%）`, false), 320);
  addTimeline("模型调用", `🌐 ${llmLabel()} · stream=true`, "tool");

  showTyping("模型生成中");     // v24：首字到达前的等待反馈
  const bubble = document.createElement("div");
  bubble.className = "msg msg-ai";
  bubble.dataset.turn = String(turn - 1);   // v28：与 session.turns 下标对齐，供实时批注定位
  bubble.innerHTML = '<span class="caret"></span>';
  body.appendChild(bubble);
  body.scrollTop = body.scrollHeight;

  const ctrl = new AbortController();
  const killTimer = setTimeout(() => ctrl.abort(), 60000);
  let full = "";
  let streamStarted = false;
  try {
    await streamChat(buildMessages(text), piece => {
      if (!streamStarted) { streamStarted = true; hideTyping(); }
      full += piece;
      bubble.textContent = full;
      body.scrollTop = body.scrollHeight;
    }, ctrl.signal);
    addTimeline("模型调用", `✅ 流式输出完成（${full.length} 字）`, "tool");
    v16MaybeAutoSpeak();
    $("fallback-banner").hidden = true;
  } catch (e) {
    clearTimeout(killTimer);
    hideTyping();
    bubble.remove();
    const reason = e.name === "AbortError" ? "超时 60s" : e.message;
    $("fallback-reason").textContent = reason;
    $("fallback-banner").hidden = false;
    toast("真实模型调用失败（" + reason + "），已自动降级为 Mock 输出");
    addTimeline("系统", "⚠️ 真实模型调用失败 → 自动降级 Mock 兜底", false);
    $("chat-send").disabled = false;
    sendMsgMock(text, speaker, keyword, notes);
    return;
  }
  clearTimeout(killTimer);
  addTimeline("观察员 Agent", `记录证据 #${turn}（置信度 ${Math.min(95, 55 + Math.round(text.length / 12))}%）→ 写入评估上下文：${notes}`, "note");
  startAnswerTimer();
  session.turns.push({ agent: speaker.name, question: full, answer: text, notes, mode: session.mode });
  persistSession();
  updateLiveTracker();
  if (turn === MAX_TURNS) addTimeline("规划 Agent", `已收集 ${MAX_TURNS} 轮证据 → 评估上下文就绪，面试到此结束`, false);
  $("chat-send").disabled = false;
  // v32：第 5 题答完 → 面试官发送结束通知并自动收尾
  maybeFinishAtTurnLimit();
}

function finishInterview() {
  if (!requireLogin()) return;
  if (!session.turns.length) { toast("请先完成至少一轮问答，再结束面试生成报告"); return; }
  stopAnswerTimer();
  try { stopCamera(); } catch (e) {}   // 面试结束即收掉摄像头，状态检测随之停止
  addTimeline("教练 Agent", `汇总 ${session.turns.length} 轮对话 → 正在生成可解释评分报告与学习路径…`, false);
  switchTab("report");
}

function restartInterview() {
  if (!requireLogin()) return;
  try { stopCamera(); } catch (e) {}   // 重置前收掉摄像头，避免悬挂设备占用
  // v29 撤销支持：重置前留存会话快照（turns 内含 v28 批注 notes）
  const bpSnap = { turns: session.turns.slice(), mode: session.mode, interviewId: session.interviewId || null };
  session.turns = [];
  camWasActiveThisSession = false;   // 新一轮面试，重置摄像头开启标记（上一轮的摄像头状态不带入）
  // v22.1：一轮面试对应后端一条独立会话记录——清掉 interviewId，
  // 下次生成报告时新建（否则幂等 /sync 会把新一轮问答判重为「已入库」，
  // 报告页读到的是上一轮的旧数据）
  session.interviewId = null;
  persistSession();
  turn = 0;
  // v32：新一轮可继续答题（上一轮由第 5 题触发的自动结束状态一并清除）
  interviewClosed = false;
  lockInput(false);
  resetAnswerTimer();
  deepDive = { topic: null, left: 0 };
  $("chat-body").innerHTML = '<div class="msg msg-system">面试开始：选择模式并发送第一条消息，AI 面试官团队将依次提问</div>';
  $("timeline").innerHTML = '<div class="tl-item" style="color:var(--faint)">面试开始后，这里实时展示 Agent 规划、工具调用与证据记录。</div>';
  setCurrentSpeaker("规划 Agent");
  // 重置实时能力追踪器与进度条
  $("live-radar").innerHTML = "";
  $("live-turn").textContent = `0/${MAX_TURNS}`;
  $("live-words").textContent = "0";
  $("live-digits").textContent = "0";
  $("live-conf").textContent = "—";
  $("live-hint").className = "live-hint";
  $("live-hint").textContent = "发送第一条回答后开始追踪";
  $("progress-bar").style.width = "0%";
  $("fallback-banner").hidden = true;
  const sbBadge0 = $("sb-interview-badge");
  if (sbBadge0) { sbBadge0.textContent = `0/${MAX_TURNS}`; sbBadge0.style.background = "var(--brand-bg)"; sbBadge0.style.color = "var(--brand)"; }
  lastReportSig = "";
  renderReport();
  toast("已重置本轮面试（历史进步曲线已保留）", function () {
    session.turns = bpSnap.turns;
    session.mode = bpSnap.mode;
    session.interviewId = bpSnap.interviewId;
    turn = session.turns.length;
    persistSession();
    restoreSession();
    toast("已撤销重置，恢复到 " + turn + " 轮对话");
  });
}

/* ---- 语音输入（Web Speech API，零成本） ---- */
function toggleVoice() {
  try { if (!getProfile().prefs.voice) { toast("语音输入已在「个人中心 · 偏好设置」中关闭"); return; } } catch (e) {}
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast("当前浏览器不支持语音识别，推荐使用 Chrome / Edge"); return; }
  if (listening) { recognition.stop(); return; }
  recognition = new SR();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  voiceStartAt = Date.now();
  listening = true;
  $("mic-btn").textContent = "🔴";
  $("mic-btn").classList.add("btn-primary");
  addTimeline("系统", "🎤 语音识别已开启（浏览器本地 ASR），请开始说话…", false);
  recognition.onresult = e => {
    const transcript = e.results[0][0].transcript;
    $("chat-input").value = transcript;
    toast("语音转文字完成，已填入输入框");
    analyzeVoiceInput(transcript, Date.now() - voiceStartAt);
  };
  recognition.onerror = e => {
    toast("语音识别出错：" + (e.error === "not-allowed" ? "麦克风权限被拒绝" : e.error));
  };
  recognition.onend = () => {
    listening = false;
    $("mic-btn").textContent = "🎤";
    $("mic-btn").classList.remove("btn-primary");
  };
  recognition.start();
}

/* ---- TTS 朗读 / 停止（speechSynthesis，零成本） ---- */
function speakLast() {
  if (!("speechSynthesis" in window)) { toast("当前浏览器不支持语音合成"); return; }
  const btn = $("tts-btn");
  if (speaking) { speechSynthesis.cancel(); return; }
  const bubbles = document.querySelectorAll("#chat-body .msg-ai");
  if (!bubbles.length) { toast("暂无面试官问题可朗读"); return; }
  const u = new SpeechSynthesisUtterance(bubbles[bubbles.length - 1].textContent);
  u.lang = "zh-CN";
  u.rate = 1;
  u.onend = u.onerror = () => { speaking = false; btn.textContent = "🔊 朗读"; };
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  speaking = true;
  btn.textContent = "⏹ 停止";
}

/* ---- 恢复上次会话 ---- */
function restoreSession() {
  document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === session.mode));
  $("chat-mode-label").textContent = modeLabelWithCount(session.mode);
  session.turns.forEach((t, i) => {
    addMsg("msg-user", t.answer);
    const div = document.createElement("div");
    div.className = "msg msg-ai";
    div.textContent = t.question;
    $("chat-body").appendChild(div);
    addTimeline(t.agent, `（恢复）提问：${t.question.slice(0, 30)}…`, false);
    addTimeline("观察员 Agent", `（恢复）证据 #${i + 1}：${t.notes}`, "note");
  });
  turn = session.turns.length;
  if (turn > 0) {
    setCurrentSpeaker(session.turns[turn - 1].agent);
    updateLiveTracker();
  }
  // v32：恢复（或撤销重置）到已满 5 轮的会话时，输入框保持收尾态
  if (turn >= MAX_TURNS) { interviewClosed = true; lockInput(true); }
  else { interviewClosed = false; lockInput(false); }
}
function addMsg(cls, text) {
  const body = $("chat-body");
  const div = document.createElement("div");
  div.className = "msg " + cls;
  div.textContent = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

/* ---- v24 · 打字指示器：LLM 流式前的等待反馈（三点墨点 + 等宽标签） ---- */
function showTyping(label) {
  hideTyping();
  const body = $("chat-body");
  const div = document.createElement("div");
  div.className = "msg msg-ai msg-typing";
  div.id = "typing-row";
  const dots = document.createElement("span");
  dots.className = "typing-dots";
  dots.innerHTML = "<i></i><i></i><i></i>";
  const tag = document.createElement("span");
  tag.className = "typing-label";
  tag.textContent = label || "思考中";
  div.appendChild(dots);
  div.appendChild(tag);
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}
function hideTyping() {
  const t = document.getElementById("typing-row");
  if (t) t.remove();
}

/* ---- v24 · 空状态建议入口：点击chip填入输入框并聚焦（游客由 focus 保护引导登录） ---- */
function fillChatSuggestion(text) {
  const input = $("chat-input");
  if (!input) return;
  input.value = text;
  input.focus();
}

/* ============ v33 · 摄像头面试状态监测（前端检测 + 后端聚合） ============ */
/* 设计：前端用 face-api.js（按需从 CDN 加载，默认零运行时依赖）在本地识别
 * 「人脸是否在场 / 是否专注」，仅把结构化结果发给后端；后端 InterviewStatusEvent
 * 持久化并聚合在场率 / 专注率，作为「后台检测面试状态」的权威状态方。原始视频帧不出浏览器。 */
let camStream = null, camVideo = null, camOn = false;
let faceApiLoading = false, faceApiReady = false, faceApiFailed = false;
let camDetectTimer = null, camSendTimer = null;
let camInterviewId = null;
let camLastDetect = null;
let camLastLabel = "";
let camLastSentAt = 0;
/* v34：最近一次后台聚合结果（在场率/专注率/采样次数），供评估报告直接复用——
 * 后端不可用时报告仍能展示本地已知的检测汇总。 */
let camLastSummary = null;
/* 本次面试会话是否真的开过摄像头（finishInterview 收掉摄像头后仍能追溯，
 * 用于报告在「两端都无采样」时给出诚实提示，而非误导为「未开启摄像头」）。 */
let camWasActiveThisSession = false;

/* 同源自托管优先：public/models/faceapi/ 随镜像(backend/static)与 Pages 一并分发，
 * 国内网络不受 jsDelivr 影响；加载失败再回退 CDN。
 * 注意：npm 包 face-api.js **不含 weights/ 目录**（该路径 404），权重回退必须走 GitHub raw，
 * 这是此前「在场监测不可用」的根因。 */
const FACEAPI_LIB_LOCAL = "models/faceapi/face-api.min.js";
const FACEAPI_WEIGHTS_LOCAL = "models/faceapi/weights";
const FACEAPI_JS = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const FACEAPI_WEIGHTS = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

function setCamState(label, cls) {
  const el = $("cam-state");
  if (!el) return;
  el.textContent = label;
  el.className = "cam-state" + (cls ? " s-" + cls : "");
}

async function ensureInterviewId() {
  if (session.interviewId) return session.interviewId;
  try {
    const res = await fetch(fmApi.base + "/api/interviews", {
      method: "POST",
      headers: fmApi.authHeaders(),
      body: JSON.stringify({ mode: session.mode || "general", job: "" }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    session.interviewId = (await res.json()).id;
    persistSession();
    return session.interviewId;
  } catch (e) {
    return null;   // 后端不可用则仅做本地检测，不上报
  }
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => (window.faceapi ? resolve() : reject(new Error("faceapi 未挂载：" + src)));
    s.onerror = () => reject(new Error("脚本加载失败：" + src));
    document.head.appendChild(s);
  });
}

async function loadFaceApi() {
  if (faceApiReady || faceApiFailed) return faceApiReady;
  if (faceApiLoading) return false;
  faceApiLoading = true;
  try {
    if (!window.faceapi) {
      try {
        await loadScriptOnce(FACEAPI_LIB_LOCAL);   // 同源自托管优先
      } catch (e) {
        await loadScriptOnce(FACEAPI_JS);          // CDN 兜底
      }
    }
    if (!window.faceapi || !window.faceapi.nets || !window.faceapi.nets.tinyFaceDetector) {
      throw new Error("face-api 未就绪");
    }
    try {
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(FACEAPI_WEIGHTS_LOCAL); // 同源权重优先
    } catch (e) {
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(FACEAPI_WEIGHTS);       // CDN 权重兜底
    }
    faceApiReady = true;
  } catch (e) {
    faceApiFailed = true;
    faceApiReady = false;
  } finally {
    faceApiLoading = false;
  }
  return faceApiReady;
}

async function toggleCamera() {
  if (!requireLogin()) return;
  if (camOn) { stopCamera(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast("当前环境不支持摄像头（需 HTTPS 或 localhost）");
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
  } catch (e) {
    const name = e && e.name;
    const msg = name === "NotAllowedError" ? "摄像头权限被拒绝" :
                name === "NotFoundError" ? "未找到摄像头设备" : "无法打开摄像头";
    toast(msg);
    return;
  }
  camStream = stream;
  camVideo = $("cam-preview");
  camVideo.srcObject = camStream;
  try { await camVideo.play(); } catch (e) {}
  camOn = true;
  camWasActiveThisSession = true;   // 标记本次面试确实开过摄像头，供报告诚实归因
  const btn = $("cam-btn");
  if (btn) { btn.classList.add("btn-primary"); btn.textContent = "📷"; }
  $("cam-bar").hidden = false;
  setCamState("检测中…", "off");
  camInterviewId = await ensureInterviewId();
  camDetectTimer = setInterval(camDetectLoop, 1500);
  camSendTimer = setInterval(camSendLoop, 2500);
  // 立即发一次「摄像头已开启」心跳，让后端立刻开始记录
  camSend({ face_present: null, attentive: null, label: "摄像头已开启 · 初始化", turn: session.turns.length, detector: "heartbeat" });
  loadFaceApi().then((ok) => { if (!ok) setCamState("在场监测不可用（模型加载失败）", "warn"); });
  addTimeline("系统", "📷 摄像头已开启，后台开始监测面试状态（在场 / 专注）", false);
  toast("摄像头已开启，后台开始监测面试状态");
}

async function camDetectLoop() {
  if (!camOn || !camVideo || !camVideo.videoWidth) return;
  let face_present = null, attentive = null, label = "检测中…";
  if (faceApiReady && window.faceapi) {
    try {
      const det = await window.faceapi.detectSingleFace(
        camVideo, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      );
      if (det) {
        face_present = true;
        const vw = camVideo.videoWidth, vh = camVideo.videoHeight;
        const cx = det.box.x + det.box.width / 2;
        const cy = det.box.y + det.box.height / 2;
        const offX = Math.abs(cx - vw / 2) / (vw / 2);
        const offY = Math.abs(cy - vh / 2) / (vh / 2);
        attentive = offX < 0.45 && offY < 0.55;   // 大致居中 = 面向镜头
        label = attentive ? "专注面试中" : "在场但注意力分散";
      } else {
        face_present = false;
        label = "暂离（未检测到人脸）";
      }
    } catch (e) {
      faceApiFailed = true;   // 检测出错则回退到「不可用」提示，不阻塞面试
    }
  } else if (faceApiFailed) {
    label = "在场监测不可用（模型加载失败）";
  }
  if (label && label !== "检测中…") {
    const cls = face_present === false ? "bad" : (attentive === false && face_present === true ? "warn" : (face_present ? "ok" : "off"));
    setCamState(label, cls);
    camLastDetect = { face_present, attentive, label, turn: session.turns.length, detector: faceApiReady ? "faceapi" : (faceApiFailed ? "unavailable" : "init") };
  }
}

function camSendLoop() {
  if (!camOn) return;
  const now = Date.now();
  if (now - camLastSentAt < 2200) return;
  const st = camLastDetect || { face_present: null, attentive: null, label: "摄像头已开启", turn: session.turns.length, detector: "heartbeat" };
  camSend(st);
  camLastSentAt = now;
}

async function camSend(status) {
  if (!status || (status.label === camLastLabel && status.detector !== "heartbeat")) return;
  camLastLabel = status.label;
  if (!camInterviewId) camInterviewId = await ensureInterviewId();
  if (!camInterviewId) return;   // 无后端则仅本地显示
  try {
    const res = await fetch(fmApi.base + "/api/interviews/" + camInterviewId + "/status", {
      method: "POST",
      headers: fmApi.authHeaders(),
      body: JSON.stringify({
        face_present: status.face_present, attentive: status.attentive,
        label: status.label, turn: status.turn || 0, detector: status.detector || "faceapi",
      }),
    });
    if (res.ok) {
      const j = await res.json();
      camLastSummary = j;   // v34：报告页复用在场率/专注率
      if (j && j.presence_rate != null) {
        const ar = j.attentive_rate != null ? j.attentive_rate + "%" : "—";
        $("cam-sub").textContent = `在场率 ${j.presence_rate}% · 专注率 ${ar}（后台聚合 ${j.count} 次采样）`;
      }
    }
  } catch (e) { /* 静默，下一节拍重试 */ }
}

function stopCamera() {
  if (!camOn && !camStream) return;
  camOn = false;
  if (camDetectTimer) { clearInterval(camDetectTimer); camDetectTimer = null; }
  if (camSendTimer) { clearInterval(camSendTimer); camSendTimer = null; }
  if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
  if (camVideo) { try { camVideo.srcObject = null; } catch (e) {} camVideo = null; }
  const btn = $("cam-btn");
  if (btn) { btn.classList.remove("btn-primary"); btn.textContent = "📷"; }
  const bar = $("cam-bar");
  if (bar) bar.hidden = true;
  if (camInterviewId) {
    camSend({ face_present: false, attentive: null, label: "摄像头已关闭", turn: session.turns.length, detector: "heartbeat" }).catch(() => {});
  }
  camLastDetect = null;
  camLastLabel = "";
}

/* 面试结束 / 重置 / 离开页面时收掉摄像头，避免悬挂设备占用 */
window.addEventListener("beforeunload", function () { try { stopCamera(); } catch (e) {} });

