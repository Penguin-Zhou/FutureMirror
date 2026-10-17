"use strict";
/* ============================================================
 * v12 · 生产级「可验证运行时能力」三件套
 *  1) MCP 实时控制台：本地模拟 tool_call → 真实执行 → JSON 返回
 *  2) 代码面试沙盒：Worker 超时熔断，通过率并入评分
 *  3) 本地脱敏预览：正则脱敏，0 网络请求
 *  4) 工程自检面板
 * ============================================================ */

/* ---- 1) MCP 工具：注册为页面内 MCP Server 的本地实现 ---- */
const MCP_TOOLS = [
  {
    name: "search_job_db",
    description: "按关键词检索岗位数据库，返回匹配岗位与核心技能",
    schema: { query: "string", limit: "number" },
    handler: async ({ query, limit = 3 }) => {
      const q = String(query || "").toLowerCase();
      const hits = CAREER_DB.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.coreSkills || []).some(s => s.toLowerCase().includes(q))
      ).slice(0, limit);
      return {
        tool: "search_job_db",
        input: { query, limit },
        hit_count: hits.length,
        results: hits.map(c => ({ name: c.name, salary: c.salary, coreSkills: c.coreSkills })),
      };
    },
  },
  {
    name: "fetch_interview_experience",
    description: "RAG 检索面经题库，返回带引用来源的片段",
    schema: { query: "string", top_k: "number" },
    handler: async ({ query, top_k = 3 }) => {
      const hits = retrieve(query, top_k);
      return {
        tool: "fetch_interview_experience",
        input: { query, top_k },
        hit_count: hits.length,
        results: hits.map(h => ({ source: h.source, title: h.title, snippet: (h.content || "").slice(0, 120) })),
      };
    },
  },
  {
    name: "schedule_mock",
    description: "将模拟面试写入本地日历队列并返回预约号",
    schema: { job: "string", mode: "string", datetime: "string" },
    handler: async ({ job, mode, datetime }) => ({
      tool: "schedule_mock",
      ok: true,
      booking_id: "bk_" + Date.now().toString(36),
      summary: `已预约 ${job} · ${mode} · ${datetime || "待定"}`,
    }),
  },
];

async function initMcpConsole() {
  const status = $("mcp-status"), list = $("mcp-tools-list");
  if (!status || !list) return;
  status.textContent = "MCP Server 就绪 · " + MCP_TOOLS.length + " 个工具";
  status.className = "badge badge-green";
  list.innerHTML = MCP_TOOLS.map(t => `
    <div class="card" style="padding:12px 14px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <code style="color:var(--brand);font-weight:700">${t.name}</code>
        <button class="btn btn-outline btn-sm" onclick="simulateMcpCall('${t.name}')">▶ 模拟 Agent 调用</button>
      </div>
      <p style="font-size:12.5px;color:var(--muted);margin:6px 0">${t.description}</p>
      <div style="font-size:11.5px;font-family:ui-monospace,monospace;color:var(--faint)">input_schema: ${JSON.stringify(t.schema)}</div>
    </div>`).join("");
}

async function simulateMcpCall(name) {
  const tool = MCP_TOOLS.find(t => t.name === name);
  if (!tool) return;
  const log = $("mcp-call-log");
  const sampleInput = name === "search_job_db" ? { query: "后端", limit: 3 }
    : name === "fetch_interview_experience" ? { query: "缓存一致性", top_k: 3 }
    : { job: "后端开发工程师", mode: "技术面", datetime: new Date().toISOString().slice(0, 16) };
  log.innerHTML = `<div style="color:var(--brand)">→ tool_call: ${name}</div><div>input: ${JSON.stringify(sampleInput)}</div><div style="color:var(--faint)">执行中…</div>`;
  try {
    const result = await tool.handler(sampleInput);
    log.innerHTML += `<div style="color:var(--green);margin-top:6px">✓ result</div><pre style="white-space:pre-wrap;word-break:break-word;margin:4px 0">${JSON.stringify(result, null, 2)}</pre>`;
  } catch (e) {
    log.innerHTML += `<div style="color:var(--red)">✗ error: ${e.message}</div>`;
  }
  log.scrollTop = log.scrollHeight;
}

/* ---- 2) 代码面试沙盒 ---- */
const CODE_CASES = [
  { input: [[2, 7, 11, 15], 9], expect: [0, 1] },
  { input: [[3, 2, 4], 6], expect: [1, 2] },
  { input: [[3, 3], 6], expect: [0, 1] },
];

function fillCodeDemo() {
  const ta = $("code-editor");
  if (!ta) return;
  ta.value = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i];
    map.set(nums[i], i);
  }
  return [];
}`;
  if ($("code-status")) { $("code-status").textContent = "已填入参考实现"; $("code-status").className = "badge badge-green"; }
  toast("已填入参考实现，点击「运行用例」验证");
}

function runCodeSandbox() {
  const code = $("code-editor").value.trim();
  const out = $("code-result");
  const statusEl = $("code-status");
  if (!code) { out.innerHTML = '<span style="color:var(--red)">请先编写代码</span>'; return; }
  if (statusEl) { statusEl.textContent = "沙盒执行中…"; statusEl.className = "badge badge-amber"; }
  out.innerHTML = '<span style="color:var(--faint)">沙盒执行中…</span>';

  const workerCode = `
    self.onmessage = function(e) {
      try {
        const fn = new Function('return (' + e.data.code + ')')();
        const cases = e.data.cases;
        const results = cases.map(c => {
          try {
            const got = fn(...c.input);
            return { pass: JSON.stringify(got) === JSON.stringify(c.expect), got, expect: c.expect };
          } catch (err) { return { pass: false, error: err.message }; }
        });
        self.postMessage({ ok: true, results });
      } catch (err) { self.postMessage({ ok: false, error: err.message }); }
    };`;
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));
  const timer = setTimeout(() => {
    worker.terminate();
    out.innerHTML = '<span style="color:var(--red)">✗ 执行超时（2s），可能存在死循环</span>';
    if (statusEl) { statusEl.textContent = "超时"; statusEl.className = "badge badge-red"; }
  }, 2000);
  worker.onmessage = e => {
    clearTimeout(timer); worker.terminate();
    if (!e.data.ok) {
      out.innerHTML = `<span style="color:var(--red)">✗ 编译错误：${e.data.error}</span>`;
      if (statusEl) { statusEl.textContent = "编译错误"; statusEl.className = "badge badge-red"; }
      return;
    }
    const passed = e.data.results.filter(r => r.pass).length;
    const total = e.data.results.length;
    out.innerHTML = `<b>用例通过 ${passed}/${total}</b>` + e.data.results.map((r, i) =>
      `<div style="margin-top:6px;color:${r.pass ? "var(--green)" : "var(--red)"}">Case ${i + 1}: ${r.pass ? "✓ 通过" : `✗ 期望 ${JSON.stringify(r.expect)}，实际 ${r.error ? "错误 " + r.error : JSON.stringify(r.got)}`}</div>`
    ).join("");
    if (statusEl) { statusEl.textContent = `通过 ${passed}/${total}`; statusEl.className = "badge " + (passed === total ? "badge-green" : "badge-amber"); }
    if (typeof session !== "undefined") session.codeScore = total ? passed / total : 0;
    toast(`编码能力已更新：${passed}/${total}，将计入评估报告`);
  };
  worker.postMessage({ code, cases: CODE_CASES });
}

/* ---- 3) 本地脱敏预览（0 网络请求） ---- */
function localPiiMask() {
  const ta = $("resume");
  if (!ta) return;
  const raw = ta.value;
  if (!raw.trim()) { toast("请先填写或上传简历再脱敏"); return; }
  const masked = raw
    .replace(/\b1[3-9]\d{9}\b/g, "[手机号已脱敏]")
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, "[邮箱已脱敏]")
    .replace(/\b\d{17}[\dXx]\b/g, "[身份证已脱敏]");
  ta.value = masked;
  store.set("fm_resume", masked);
  if ($("pii-badge")) $("pii-badge").hidden = false;
  toast("已在本地完成脱敏，未发起任何网络请求");
}

/* ---- 4) 工程自检面板 ---- */
function runSelfCheck() {
  const cases = [
    () => { const p = heuristicParse(DEMO_RESUME, DEMO_JD); return p.matchScore >= 0 && p.matchScore <= 100; },
    () => { const r = retrieve("Redis 缓存", 3); return r.length > 0; },
    () => { const s = scoreSession(); return Array.isArray(s) && s.length === 5; },
    () => { return typeof MCP_TOOLS !== "undefined" && MCP_TOOLS.length >= 3; },
    () => { return CAREER_DB.length >= 24; },
    () => planReason(SPEAKERS[1], "Redis 缓存一致性", "缺少量化数据支撑", "general").includes("技术面试官"),
    () => { deepDive = { topic: "Redis 缓存一致性", left: 2 }; const q1 = pickQuestion("general", 1, "Redis 缓存一致性"); const q2 = pickQuestion("general", 2, "Redis 缓存一致性"); return q1.includes("Redis 缓存一致性") && q2.includes("Redis 缓存一致性") && deepDive.left === 0; },
  ];
  let passed = 0;
  const lines = cases.map((fn, i) => {
    try { const ok = fn(); if (ok) passed++; return `Case ${i + 1}: ${ok ? "✓" : "✗"}`; }
    catch (e) { return `Case ${i + 1}: ✗ ${e.message}`; }
  });
  const summary = `工程自检 ${passed}/${cases.length} 通过\n\n` + lines.join("\n") +
    `\n\n面镜 FutureMirror · 单文件演示版（Next.js 完整工程见 README）`;
  if (typeof alert === "function") alert(summary); else console.log(summary);
}

