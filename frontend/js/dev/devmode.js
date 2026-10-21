"use strict";
/* ============================================================
 * v13 · 开发者模式（加密 + 一键进入）
 * ============================================================ */

/* 开发者密码 & 解锁状态 key */
const EVAL_PASSWORD = "FM2026";
const EVAL_UNLOCK_KEY = "g_eval_unlocked";
const EVAL_LAST_TARGET_KEY = "g_eval_target";

function isEvaluatorUnlocked() {
  try { return sessionStorage.getItem(EVAL_UNLOCK_KEY) === "1"; } catch (e) { return false; }
}
function setEvaluatorUnlocked() {
  try { sessionStorage.setItem(EVAL_UNLOCK_KEY, "1"); } catch (e) {}
}
function clearEvaluatorUnlocked() {
  try { sessionStorage.removeItem(EVAL_UNLOCK_KEY); } catch (e) {}
}

/* 打开密码 modal（target 可用于跳转特定板块，如 'mcp' / 'selfcheck'） */
function openEvaluatorGate(target) {
  if (isEvaluatorUnlocked()) { enterEvaluator(target); return; }
  try { if (target) sessionStorage.setItem(EVAL_LAST_TARGET_KEY, target); } catch (e) {}
  const modal = $("eval-gate-modal");
  const input = $("eval-password");
  const err = $("eval-error");
  if (!modal) return;
  if (err) { err.textContent = ""; err.classList.remove("show"); }
  if (input) input.value = "";
  modal.hidden = false;
  setTimeout(() => input && input.focus(), 100);
}

function closeEvalGate() {
  const modal = $("eval-gate-modal");
  if (modal) modal.hidden = true;
}

function submitEvalPassword() {
  const input = $("eval-password");
  const err = $("eval-error");
  const val = (input && input.value || "").trim();
  if (!val) {
    if (err) { err.textContent = "请输入开发者密码"; err.classList.add("show"); }
    return;
  }
  if (val.toUpperCase() === EVAL_PASSWORD.toUpperCase()) {
    setEvaluatorUnlocked();
    closeEvalGate();
    const target = (() => { try { return sessionStorage.getItem(EVAL_LAST_TARGET_KEY) || ""; } catch (e) { return ""; } })();
    enterEvaluator(target);
    toast("已解锁开发者模式");
  } else {
    if (err) { err.textContent = "密码不正确，请向组委会索取或查看 README"; err.classList.add("show"); }
  }
}

/* 进入开发者模式视图 */
function enterEvaluator(target) {
  showView("evaluator");
  // 更新材料清单状态（引用 CONFIG）
  try { updateEvalMaterials(); } catch (e) {}
  // 初始化 MCP 控制台（如果尚未初始化）
  try { if (typeof initMcpConsole === "function") initMcpConsole(); } catch (e) {}
  // 滚动到目标板块
  if (target) {
    setTimeout(() => {
      const el = $("eval-" + target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }
  try { sessionStorage.removeItem(EVAL_LAST_TARGET_KEY); } catch (e) {}
}

/* 退出开发者模式 */
function exitEvaluator() {
  clearEvaluatorUnlocked();
  showView("landing");
  // 清掉 hash
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  toast("已退出开发者模式");
}

/* 材料清单状态（根据 CONFIG 是否填写自动更新） */
function updateEvalMaterials() {
  const map = {
    repo: CONFIG.repoUrl,
    video: CONFIG.videoUrl,
    docs: CONFIG.docsUrl,
    live: CONFIG.liveUrl,
  };
  Object.entries(map).forEach(([key, url]) => {
    const el = $("eval-status-" + key);
    if (!el) return;
    if (url) {
      el.textContent = "已填写";
      el.className = "material-status";
      el.style.cursor = "pointer";
      el.onclick = () => window.open(url, "_blank", "noopener");
    } else {
      el.textContent = "待填写";
      el.className = "material-status pending";
      el.style.cursor = "default";
      el.onclick = null;
    }
  });
}

/* 工程自检面板（渲染为可视化列表） */
function runSelfCheckPanel() {
  const list = $("self-check-list");
  const summary = $("self-check-summary");
  if (!list) return;

  const cases = [
    {
      name: "简历匹配引擎",
      desc: "heuristicParse(DEMO_RESUME, DEMO_JD) 返回合法匹配分（0-100）",
      fn: () => { const p = heuristicParse(DEMO_RESUME, DEMO_JD); return p.matchScore >= 0 && p.matchScore <= 100; },
    },
    {
      name: "RAG 检索层",
      desc: "retrieve('Redis 缓存', 3) 返回非空结果，命中标签包含 Redis",
      fn: () => { const r = retrieve("Redis 缓存", 3); return r.length > 0 && r[0].tags.includes("Redis"); },
    },
    {
      name: "评分引擎",
      desc: "scoreSession() 返回 5 个维度，每维含 score 与 comment 字段",
      fn: () => { const s = scoreSession(); return Array.isArray(s) && s.length === 5 && s.every(d => typeof d.score === "number" && d.comment); },
    },
    {
      name: "MCP 工具注册",
      desc: "MCP_TOOLS 至少注册 3 个工具，且每个含 handler",
      fn: () => typeof MCP_TOOLS !== "undefined" && MCP_TOOLS.length >= 3 && MCP_TOOLS.every(t => typeof t.handler === "function"),
    },
    {
      name: "岗位数据库完整性",
      desc: "CAREER_DB 至少 24 个岗位，每个含 id / name / coreSkills / path",
      fn: () => CAREER_DB.length >= 24 && CAREER_DB.every(c => c.id && c.name && Array.isArray(c.coreSkills) && Array.isArray(c.path)),
    },
    {
      name: "Mock 派发一致性（v18）",
      desc: "技术关键词 + 缺少量化 → 派发技术面试官（与完整工程 Agent 编排层决策同构）",
      fn: () => planReason(SPEAKERS[1], "Redis 缓存一致性", "缺少量化数据支撑", "general").includes("技术面试官"),
    },
    {
      name: "连环追问触发（v18）",
      desc: "deepDive 激活后连续 2 轮返回同主题深挖题（非固定轮转，体现 Agent 决策）",
      fn: () => {
        deepDive = { topic: "Redis 缓存一致性", left: 2 };
        const q1 = pickQuestion("general", 1, "Redis 缓存一致性");
        const q2 = pickQuestion("general", 2, "Redis 缓存一致性");
        return q1.includes("Redis 缓存一致性") && q2.includes("Redis 缓存一致性") && deepDive.left === 0;
      },
    },
  ];

  list.innerHTML = "";
  let passed = 0;
  cases.forEach((c, i) => {
    let ok = false, errMsg = "";
    try { ok = !!c.fn(); } catch (e) { ok = false; errMsg = e.message; }
    if (ok) passed++;
    const item = document.createElement("div");
    item.className = "check-item " + (ok ? "pass" : "fail");
    item.innerHTML = `
      <div class="ck-icon">${ok ? "✓" : "✗"}</div>
      <div>
        <div class="ck-name">${c.name}</div>
        <div class="ck-desc">${c.desc}${errMsg ? " · 错误：" + errMsg : ""}</div>
      </div>
      <div class="ck-status">${ok ? "PASS" : "FAIL"}</div>`;
    list.appendChild(item);
  });

  if (summary) {
    summary.style.display = "inline-flex";
    summary.textContent = `通过 ${passed}/${cases.length}`;
    summary.className = "badge " + (passed === cases.length ? "badge-green" : passed >= cases.length - 1 ? "badge-amber" : "badge-red");
  }
  toast(`工程自检完成：${passed}/${cases.length} 通过`);
}

/* showView 扩展：支持 evaluator */
const _originalShowView = typeof showView === "function" ? showView : null;
showView = function (name) {
  if (name === "evaluator") {
    // 检查解锁状态
    if (!isEvaluatorUnlocked()) {
      // 尝试从 URL 参数（hash 或 search）解锁
      const fromHash = (() => { const m = (location.hash || "").split("?"); return m[1] ? new URLSearchParams(m[1]).get("key") : null; })();
      const fromSearch = new URLSearchParams(location.search).get("key");
      const key = fromHash || fromSearch;
      if (key && key.toUpperCase() === EVAL_PASSWORD.toUpperCase()) {
        setEvaluatorUnlocked();
      } else {
        openEvaluatorGate();
        return;
      }
    }
    document.querySelectorAll(".view").forEach(v => {
      v.classList.toggle("active", v.id === "view-evaluator");
    });
    window.scrollTo(0, 0);
    try { updateEvalMaterials(); } catch (e) {}
    try { if (typeof initMcpConsole === "function") initMcpConsole(); } catch (e) {}
    document.title = "面镜 FutureMirror · 开发者模式";
    return;
  }
  if (_originalShowView) _originalShowView(name);
};

/* hash 路由支持 #/evaluator（作为唯一 hashchange 处理器，避免重复触发 applyRoute） */
function handleHashChange() {
  const raw = location.hash || "";
  const hash = raw.replace(/^#\/?/, "").split("?")[0];
  if (hash === "evaluator") {
    // 解析 ?key=
    const qs = raw.split("?")[1] || "";
    const key = new URLSearchParams(qs).get("key");
    if (key && key.toUpperCase() === EVAL_PASSWORD.toUpperCase()) {
      setEvaluatorUnlocked();
      enterEvaluator();
    } else if (isEvaluatorUnlocked()) {
      enterEvaluator();
    } else {
      openEvaluatorGate();
    }
    return;
  }
  // 非开发者模式路由交回原 applyRoute 处理（应用内子页切换）
  applyRoute();
}
window.addEventListener("hashchange", handleHashChange);

/* 快捷键 Ctrl+Shift+J（Judge） */
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j")) {
    e.preventDefault();
    openEvaluatorGate();
  }
  if (e.key === "Escape") {
    closeEvalGate();
  }
});

/* 初始化时同步开发者模式相关状态 */
(function initEvaluator() {
  // 更新材料清单
  try { updateEvalMaterials(); } catch (e) {}
  // 若当前 hash 指向 evaluator，按解锁状态进入或弹门
  try {
    const raw = location.hash || "";
    const hash = raw.replace(/^#\/?/, "").split("?")[0];
    if (hash === "evaluator") {
      if (isEvaluatorUnlocked()) {
        enterEvaluator();
      } else {
        const key = new URLSearchParams(raw.split("?")[1] || "").get("key");
        if (key && key.toUpperCase() === EVAL_PASSWORD.toUpperCase()) {
          setEvaluatorUnlocked();
          enterEvaluator();
        } else {
          openEvaluatorGate();
        }
      }
    }
  } catch (e) {}
})();

/* ============================================================
 * v14 · 开发者模式：环境检测 / 性能指标 / 诊断日志 / 开发者工具
 * ============================================================ */

/* ---------- 诊断日志（内存） ---------- */
const devLog = [];
function logDev(type, msg) {
  try {
    devLog.push({ time: new Date().toLocaleTimeString("zh-CN"), type, msg });
    if (devLog.length > 100) devLog.shift();
    renderDevLog();
  } catch (e) {}
}
function renderDevLog() {
  const box = $("dev-log");
  if (!box) return;
  if (!devLog.length) {
    box.innerHTML = '<div class="log-line"><span class="log-time">--:--:--</span><span class="log-msg">暂无日志（操作后自动记录）</span></div>';
    return;
  }
  box.innerHTML = devLog.map(l => `
    <div class="log-line">
      <span class="log-time">${l.time}</span>
      <span class="log-type ${l.type}">[${l.type.toUpperCase()}]</span>
      <span class="log-msg">${l.msg}</span>
    </div>`).join("");
  box.scrollTop = box.scrollHeight;
}

/* ---------- 环境检测 ---------- */
function collectEnvInfo() {
  const ua = navigator.userAgent;
  let browser = "未知", browserVer = "";
  if (ua.includes("Edg/")) { browser = "Edge"; browserVer = ua.match(/Edg\/([\d.]+)/)?.[1] || ""; }
  else if (ua.includes("Chrome/")) { browser = "Chrome"; browserVer = ua.match(/Chrome\/([\d.]+)/)?.[1] || ""; }
  else if (ua.includes("Firefox/")) { browser = "Firefox"; browserVer = ua.match(/Firefox\/([\d.]+)/)?.[1] || ""; }
  else if (ua.includes("Safari/")) { browser = "Safari"; browserVer = ua.match(/Version\/([\d.]+)/)?.[1] || ""; }

  let os = "未知";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  const caps = {
    "WebGL": (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch (e) { return false; } })(),
    "WebGPU": !!(navigator.gpu),
    "Web Speech ASR": !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    "Web Speech TTS": !!window.speechSynthesis,
    "Web Worker": !!window.Worker,
    "IndexedDB": !!window.indexedDB,
    "Clipboard API": !!(navigator.clipboard && navigator.clipboard.writeText),
    "Web Share": !!navigator.share,
    "File API": !!window.FileReader,
  };

  const perf = (() => {
    try {
      const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      const loadMs = nav ? Math.round(nav.duration) : (() => {
        const t = performance.timing || {};
        return t.loadEventEnd && t.navigationStart ? t.loadEventEnd - t.navigationStart : 0;
      })();
      return {
        loadMs,
        domCount: document.querySelectorAll("*").length,
        memory: performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
      };
    } catch (e) { return { loadMs: 0, domCount: 0, memory: null }; }
  })();

  return {
    browser: browser + (browserVer ? " " + browserVer : ""),
    os,
    lang: navigator.language || "未知",
    online: navigator.onLine,
    screen: `${window.screen.width}×${window.screen.height}`,
    dpr: window.devicePixelRatio || 1,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    cores: navigator.hardwareConcurrency || "未知",
    deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "未知",
    caps,
    perf,
  };
}

function renderEnvPanel() {
  const box = $("dev-env-content");
  if (!box) return;
  const env = collectEnvInfo();
  const capsHtml = Object.entries(env.caps).map(([k, v]) =>
    `<span class="cap-badge ${v ? "yes" : "no"}">${v ? "✓" : "✗"} ${k}</span>`
  ).join("");
  box.innerHTML = `
    <div class="env-grid">
      <div class="env-item"><div class="env-label">浏览器</div><div class="env-value">${env.browser}</div></div>
      <div class="env-item"><div class="env-label">操作系统</div><div class="env-value">${env.os}</div></div>
      <div class="env-item"><div class="env-label">语言</div><div class="env-value">${env.lang}</div></div>
      <div class="env-item"><div class="env-label">网络状态</div><div class="env-value">${env.online ? "✓ 在线" : "✗ 离线"}</div></div>
      <div class="env-item"><div class="env-label">屏幕尺寸</div><div class="env-value mono">${env.screen}</div></div>
      <div class="env-item"><div class="env-label">当前视口</div><div class="env-value mono">${env.viewport}</div></div>
      <div class="env-item"><div class="env-label">像素比 DPR</div><div class="env-value mono">${env.dpr}</div></div>
      <div class="env-item"><div class="env-label">CPU 核心</div><div class="env-value">${env.cores}</div></div>
      <div class="env-item"><div class="env-label">设备内存</div><div class="env-value">${env.deviceMemory}</div></div>
    </div>
    <div style="margin-top:16px">
      <div style="font-size:11.5px;color:var(--faint);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">技术能力检测</div>
      <div class="cap-badges">${capsHtml}</div>
    </div>
  `;
}

function renderPerfPanel() {
  const box = $("dev-perf-content");
  if (!box) return;
  const env = collectEnvInfo();
  box.innerHTML = `
    <div class="perf-grid">
      <div class="perf-item"><div class="perf-label">页面加载耗时</div><div class="perf-value">${env.perf.loadMs}<span class="perf-unit">ms</span></div></div>
      <div class="perf-item"><div class="perf-label">DOM 节点数</div><div class="perf-value">${env.perf.domCount}<span class="perf-unit">个</span></div></div>
      <div class="perf-item"><div class="perf-label">JS 堆大小</div><div class="perf-value">${env.perf.memory || "—"}<span class="perf-unit">${env.perf.memory ? "MB" : ""}</span></div></div>
      <div class="perf-item"><div class="perf-label">知识库条目</div><div class="perf-value">${typeof KB !== "undefined" ? KB.length : 0}<span class="perf-unit">条</span></div></div>
      <div class="perf-item"><div class="perf-label">向量索引</div><div class="perf-value">${(typeof vecIndex !== "undefined" && vecIndex.ready) ? vecIndex.dim : 0}<span class="perf-unit">${(typeof vecIndex !== "undefined" && vecIndex.ready) ? "维 · " + vecIndex.vectors.length + " 条" : "未初始化"}</span></div></div>
      <div class="perf-item"><div class="perf-label">岗位数据库</div><div class="perf-value">${typeof CAREER_DB !== "undefined" ? CAREER_DB.length : 0}<span class="perf-unit">个</span></div></div>
      <div class="perf-item"><div class="perf-label">MCP 工具</div><div class="perf-value">${typeof MCP_TOOLS !== "undefined" ? MCP_TOOLS.length : 0}<span class="perf-unit">个</span></div></div>
    </div>
  `;
}

/* ---------- 开发者工具 ---------- */
function exportDiagnostic() {
  try {
    const env = collectEnvInfo();
    const report = {
      exportedAt: new Date().toISOString(),
      project: "面镜 FutureMirror",
      version: "beta1.0.2",
      env,
      state: {
        currentUser: (typeof currentUser !== "undefined" && currentUser) ? { id: currentUser.id, email: currentUser.email, name: currentUser.name } : null,
        // v22.1：运行形态区分后端真实 / 后端 Mock / 直连 Key / 本地 Mock 四态
        llmMode: fmApi.backendReady() ? (fmApi.health.llm_ready ? "backend-real" : "backend-mock")
                 : (typeof llm !== "undefined" && llm) ? "direct-key" : "mock",
        llmModel: fmApi.backendReady() ? fmApi.backendModel() : (typeof llm !== "undefined" && llm ? llm.model : null),
        backend: { base: fmApi.base, ready: fmApi.backendReady(),
                   llmReady: !!(fmApi.health && fmApi.health.llm_ready) },
        sessionTurns: (typeof session !== "undefined" && session.turns) ? session.turns.length : 0,
        interviewId: (typeof session !== "undefined" && session.interviewId) || null,
        matchScore: (typeof matchResult !== "undefined" && matchResult) ? matchResult.matchScore : null,
        codeScore: (typeof session !== "undefined" && typeof session.codeScore === "number") ? session.codeScore : null,
        kbCount: typeof KB !== "undefined" ? KB.length : 0,
        // beta1.0：端侧向量索引运行态（provider / 维度 / 条数 / 来源）
        vectorIndex: (typeof vecIndex !== "undefined" && vecIndex.ready) ? {
          provider: vecIndex.provider,
          dim: vecIndex.dim,
          model: vecIndex.model,
          count: vecIndex.vectors ? vecIndex.vectors.length : 0,
          source: vecIndex.source,
          builtAt: vecIndex.builtAt ? new Date(vecIndex.builtAt).toISOString() : null,
          fusion: { cos: VEC_CFG.wVec, bm25: VEC_CFG.wBm25 },
        } : { provider: "none" },
        careerCount: typeof CAREER_DB !== "undefined" ? CAREER_DB.length : 0,
        mcpToolCount: typeof MCP_TOOLS !== "undefined" ? MCP_TOOLS.length : 0,
      },
      devLog: devLog.slice(-50),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `futuremirror-diagnostic-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logDev("ok", "诊断报告已导出");
    toast("诊断报告已下载");
  } catch (e) {
    logDev("error", "导出失败：" + e.message);
    toast("导出失败：" + e.message);
  }
}

function clearAllData() {
  if (typeof confirm === "function" && !confirm("确定要清空所有本地数据吗？\n\n这会删除账号、面试记录、简历草稿、历史曲线等所有数据，且不可恢复。\n\n页面将重新加载。")) return;
  try {
    localStorage.clear();
    sessionStorage.clear();
    logDev("warn", "所有本地数据已清空，页面即将重新加载");
    toast("已清空本地数据，即将刷新…");
    setTimeout(() => location.reload(), 800);
  } catch (e) {
    logDev("error", "清空失败：" + e.message);
    toast("清空失败：" + e.message);
  }
}

function resetOnboarding() {
  try {
    localStorage.removeItem("g_onboarding_done");
    logDev("ok", "Onboarding 引导已重置，下次进入工作台将重新显示");
    toast("引导已重置");
  } catch (e) {
    logDev("error", "重置失败：" + e.message);
  }
}

function copyTestAccount() {
  const text = (typeof CONFIG !== "undefined" && CONFIG.testAccount) ? CONFIG.testAccount : "演示账号：demo@futuremirror.app / Demo123456";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => { logDev("ok", "测试账号已复制到剪贴板"); toast("已复制测试账号"); },
      () => { logDev("error", "复制失败"); toast("复制失败，请手动选择"); }
    );
  } else {
    logDev("warn", "当前浏览器不支持 Clipboard API");
    toast("当前浏览器不支持剪贴板，请手动复制");
  }
}

function toggleLlmMode() {
  if (llm) {
    clearLlm();
    updateDevLlmMode();
    // v22.1：后端在线时清了直连 Key 仍走后端，日志文案要如实
    logDev("warn", fmApi.backendReady() ? "已清除直连 Key，仍走后端模型" : "已从真实模式切换到 Mock 模式");
  } else if (fmApi.backendReady()) {
    // v22.1：后端在线时没有可切的「直连 Key」，提示当前运行形态即可
    logDev("info", "后端在线：" + (fmApi.health.llm_ready ? "真实模式（Key 在服务端）" : "未配置 Key，聊天走 Mock"));
    toast(fmApi.health.llm_ready ? "当前为后端真实模式，无需接入 Key" : "后端在线但未配置 Key，聊天走 Mock");
  } else {
    // 跳转到 LLM 接入面板
    showView("app");
    navTo("interview");
    setTimeout(() => {
      try { openApiKeyPanel(); } catch (e) {}
      logDev("info", "已跳转到 LLM 接入面板，请填写 API Key 后启用真实模型");
      toast("已跳转到 API Key 面板");
    }, 300);
  }
}

function updateDevLlmMode() {
  const el = $("dev-llm-mode");
  if (!el) return;
  // v22.1：四态展示（后端真实 / 后端 Mock / 直连真实 / 本地 Mock）
  if (fmApi.backendReady()) {
    el.textContent = fmApi.health.llm_ready ? `后端真实模式 · ${fmApi.backendModel()}` : "后端 Mock 模式";
    el.style.color = fmApi.health.llm_ready ? "var(--green)" : "var(--amber)";
  } else if (llm) {
    el.textContent = `直连真实模式 · ${llm.model}`;
    el.style.color = "var(--green)";
  } else {
    el.textContent = "Mock 模式";
    el.style.color = "var(--amber)";
  }
}

function refreshAll() {
  renderEnvPanel();
  renderPerfPanel();
  renderDevLog();
  updateDevLlmMode();
  logDev("ok", "环境、性能指标与 LLM 状态已刷新");
  toast("指标已刷新");
}

/* ---------- 进入开发者模式时初始化新增面板 ---------- */
const _originalEnterEvaluator = typeof enterEvaluator === "function" ? enterEvaluator : null;
enterEvaluator = function (target) {
  if (_originalEnterEvaluator) _originalEnterEvaluator(target);
  try { renderEnvPanel(); } catch (e) {}
  try { renderPerfPanel(); } catch (e) {}
  try { renderDevLog(); } catch (e) {}
  try { updateDevLlmMode(); } catch (e) {}
  try { logDev("info", "进入开发者模式 · target=" + (target || "-")); } catch (e) {}
};

/* ---------- 关键操作自动记日志（钩子包装） ---------- */
// 登录成功
const _origEnterApp = typeof enterApp === "function" ? enterApp : null;
enterApp = function (user) {
  const __r = _origEnterApp ? _origEnterApp(user) : undefined;
  try { if (user) logDev("ok", "登录成功：" + user.email); } catch (e) {}
  return __r;
};
// 退出登录
const _origLogout = typeof logout === "function" ? logout : null;
logout = function () {
  try { logDev("warn", "用户登出"); } catch (e) {}
  return _origLogout ? _origLogout() : undefined;
};
// 匹配分析
const _origAnalyze = typeof analyze === "function" ? analyze : null;
analyze = function () {
  const __r = _origAnalyze ? _origAnalyze() : undefined;
  try { if (matchResult) logDev("info", "匹配分析完成 · 得分 " + matchResult.matchScore + " · 缺口 " + matchResult.gaps.length); } catch (e) {}
  return __r;
};
// 代码沙盒
const _origRunCode = typeof runCodeSandbox === "function" ? runCodeSandbox : null;
runCodeSandbox = function () {
  try { logDev("info", "运行代码沙盒 · 3 个用例"); } catch (e) {}
  return _origRunCode ? _origRunCode() : undefined;
};
// MCP 调用
const _origSimMcp = typeof simulateMcpCall === "function" ? simulateMcpCall : null;
simulateMcpCall = function (name) {
  try { logDev("info", "MCP tool_call：" + name); } catch (e) {}
  return _origSimMcp ? _origSimMcp(name) : undefined;
};
// 工程自检
const _origSelfCheck = typeof runSelfCheckPanel === "function" ? runSelfCheckPanel : null;
runSelfCheckPanel = function () {
  const __r = _origSelfCheck ? _origSelfCheck() : undefined;
  try {
    const sum = $("self-check-summary");
    if (sum) logDev("ok", "工程自检：" + sum.textContent);
  } catch (e) {}
  return __r;
};

/* ---------- 初始化：进入开发者模式时渲染 ---------- */
(function initDevPanels() {
  // 如果当前已经在开发者模式（刷新保持），立即渲染
  try {
    if (document.getElementById("view-evaluator").classList.contains("active")) {
      renderEnvPanel();
      renderPerfPanel();
      renderDevLog();
      updateDevLlmMode();
    }
  } catch (e) {}
  // 记录一次启动日志
  try { logDev("ok", "页面初始化完成 · 版本 beta1.0.2 · Arkira 风格主题已就绪"); } catch (e) {}
})();


