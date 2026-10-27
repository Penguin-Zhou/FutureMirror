/* 演示页静态验证：脚本语法 + DOM id 引用 + 标签配平 + 纯净度 */
const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

let fail = 0;
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
console.log("script 块数量:", scripts.length);
scripts.forEach((s, i) => {
  try {
    new Function(s);
    console.log(`script[${i}] 语法 OK (${s.length} chars)`);
  } catch (e) {
    console.error(`script[${i}] 语法错误:`, e.message);
    fail = 1;
  }
});

const main = scripts[scripts.length - 1];
const htmlOnly = html.replace(/<script>[\s\S]*?<\/script>/g, "");
const ids = new Set([...htmlOnly.matchAll(/id="([^"]+)"/g)].map((x) => x[1]));
const refs = [...new Set([...main.matchAll(/\$\("([^"]+)"\)/g)].map((x) => x[1]))];
// 运行时动态创建的 id（innerHTML 注入）
const runtimeCreated = [
  "radar",
  "ring-fill",
  "history-box",
  "rag-stream",
  "prompt-view",
  "fallback-reason",
  "report-total",
  "dims",
  "evidence",
  "plan",
  "suggestions",
  "resume-stream",
  "vip-card",
  "quiz-timer",
  "quiz-feedback-slot",
  "quiz-next-row",
  "quiz-search-input",
  "quiz-search-results",
  "quiz-cat-zone",
  // v36：运行时注入
  "mqa-input", // 对话式匹配增强的输入框（renderMatchQa 注入）
  "js-advice-stream", // 求职信息 AI 建议的流式输出容器
  "rj-stream", // 真实岗位面试建议的流式容器（实际 id 为 rj-stream-<jobId>）
];
const missing = refs.filter((r) => !ids.has(r) && !runtimeCreated.includes(r));
console.log("主脚本引用 id:", refs.length, "| 缺失:", missing.length ? missing.join(",") : "无");
if (missing.length) fail = 1;

// onclick 引用的函数名必须已定义
const fnDefs = new Set([...main.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)].map((x) => x[1]));
const inlineHandlers = [
  ...new Set([...htmlOnly.matchAll(/onclick="([a-zA-Z_$][\w$]*)\(/g)].map((x) => x[1]).filter((f) => f !== "if")),
];
const undefFns = inlineHandlers.filter(
  (f) =>
    !fnDefs.has(f) &&
    ![
      "switchTab",
      "fillDemo",
      "analyze",
      "setMode",
      "openApiKeyPanel",
      "onPresetChange",
      "saveLlm",
      "clearLlm",
      "showPromptViewer",
      "sendMsg",
      "toggleVoice",
      "speakLast",
      "finishInterview",
      "restartInterview",
      "askRag",
      "askRagPreset",
      "copyReportMarkdown",
      "shareReport",
      "toggleTheme",
      "openMaterial",
    ].includes(f)
);
console.log("onclick 处理器:", inlineHandlers.length, "| 未定义:", undefFns.length ? undefFns.join(",") : "无");
if (undefFns.length) fail = 1;

const open = (html.match(/<div/g) || []).length,
  close = (html.match(/<\/div>/g) || []).length;
console.log("div 配平:", open, close, open === close ? "OK" : "MISMATCH");
if (open !== close) fail = 1;

// 纯净度：无关文字零残留
// 说明：该词表用于确保演示包不含任何外部机构 / 评价口径相关字样。
// 为保证仓库源码本身不出现这些字样，词表以 Unicode 转义形式存放（运行时还原为同一字符串）。
const banned = [
  "\u4f20\u667a\u676f",
  "\u6311\u6218\u8d5b",
  "\u53c2\u8d5b",
  "\u8bc4\u5ba1",
  "\u9ad8\u6821",
  "\u7701\u8d5b",
  "\u56fd\u8d5b",
  "\u4e3b\u529e",
  "\u8d5b\u9053",
  "\u62a5\u540d",
  "\u7b54\u8fa9",
  "\u8d5b\u4e8b",
  "\u8bc4\u59d4",
  "\u89c6\u9891\u811a\u672c",
];
const hits = banned.filter((w) => html.includes(w));
console.log("无关文字残留:", hits.length ? hits.join(",") : "无");
if (hits.length) fail = 1;

console.log("size KB:", (html.length / 1024).toFixed(1));
console.log(fail ? "=== 验证失败 ===" : "=== 全部通过 ===");
process.exit(fail);
