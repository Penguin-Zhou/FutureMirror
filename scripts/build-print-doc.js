/* ============================================================
 * build-print-doc.js —— 生成技术文档的「A4 精简打印版」
 *   docs/technical-doc.html（完整在线版，10 章）
 *     → 临时打印版：删除第 9 章附录、原第 10 章版本日志上移重编号为 09
 *       并压成摘要表
 *     → Edge 无头打印为 docs/FutureMirror.Beta.pdf（含封面，约 29-30 页）
 *
 *   背景：在线版面向屏幕阅读（信息完整）；PDF 附件随赛事材料提交，
 *   需要控制页数——附录（环境配置/账号/代码索引/交付清单）在仓库
 *   README 中有同等内容，版本日志的逐版本明细在更新日志页可查，
 *   因此打印版仅保留摘要，避免重复与超页。
 *
 *   用法：node scripts/build-print-doc.js
 *   依赖：本机 Edge（Chromium）无头打印；打印样式由文档自带
 *        （@page A4 + @media print 隐藏 .print-tip）。
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "docs", "technical-doc.html");
const PDF = path.join(ROOT, "docs", "FutureMirror.Beta.pdf");
const TMP = path.join(ROOT, "docs", ".print-version.html");

let html = fs.readFileSync(SRC, "utf8");
const before = html.length;

/* ---------- 1) 删除第 9 章（附录） ---------- */
const ch9Start = html.indexOf("<!-- =============== 第 9 章 =============== -->");
const ch10Start = html.indexOf("<!-- =============== 第 10 章 =============== -->");
if (ch9Start < 0 || ch10Start < 0 || ch9Start >= ch10Start) {
  console.error("❌ 未找到第 9/10 章边界注释");
  process.exit(1);
}
html = html.slice(0, ch9Start) + html.slice(ch10Start);

/* ---------- 1b) 章节号连续化 ---------- */
/* 附录整章被删后，原第 10 章正文页眉仍是 CHAPTER 10，而目录已把它排在 09 位，
   会出现「目录 09 / 正文 CHAPTER 10」的编号错位——打印版统一改为 CHAPTER 09 */
html = html.replace('<div class="chapter-num">CHAPTER 10</div>', '<div class="chapter-num">CHAPTER 09</div>');

/* ---------- 2) TOC：删附录条目，ch10 标注「摘要」 ---------- */
html = html.replace(/\s*<li><a href="#ch9">.*?<\/a><\/li>/s, "");
html = html.replace(
  /(<li><a href="#ch10"><span class="toc-t">版本更新日志<\/span><span class="toc-d">)([^<]*)(<\/span><\/a><\/li>)/,
  "$1$2（打印版为摘要表，逐版本明细见更新日志页）$3"
);

/* ---------- 3) ch10：版本日志压成摘要表 ---------- */
/* 3a. 从正文提取所有 <h3> 版本标题（v23 规划在最前，倒序） */
const ch10Body = html.slice(html.indexOf('<section class="chapter" id="ch10">'));
const h3Re = /<h3>([\s\S]*?)<\/h3>/g;
const versions = [];
let m;
while ((m = h3Re.exec(ch10Body)) !== null) versions.push(m[1]);
if (versions.length < 20) {
  console.error(`❌ 只提取到 ${versions.length} 个版本标题，中止（防止摘要表残缺）`);
  process.exit(1);
}

/* 3b. 组装摘要行：版本 | 日期 | 主题 | 一句话关键内容 */
const strip = (s) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
const rows = versions.map((raw) => {
  const text = strip(raw);
  const dm = text.match(/（([\d.]+)(?:\s+当前版本)?(?:\s+待排期)?）\s*$/);
  const date = dm ? dm[1] : "";
  const isPlan = /规划中/.test(text);
  const head = text.replace(/（[\d.]+(?:\s+当前版本)?(?:\s+待排期)?）\s*$/, "").trim();
  const parts = head
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  const ver = parts.shift() || head;
  const title = parts.join(" · ");
  /* 关键内容：取该版本第一个 <h4> 分类下的第一条 <li> 摘要（截断） */
  return { ver, title, date, isPlan };
});

/* 3c. 每个版本取一条代表性条目（从原 HTML 的 h3 后第一组 <ul> 首条 <li>） */
const detail = [];
const blockRe = /<h3>[\s\S]*?<\/h3>([\s\S]*?)(?=<h3>|<\/section>)/g;
let b;
while ((b = blockRe.exec(ch10Body)) !== null) {
  const li = b[1].match(/<li>[\s\S]*?<\/li>/);
  detail.push(li ? strip(li[0]).slice(0, 68) : "—");
}

const summaryRows = rows
  .map(
    (r, i) => `
      <tr>
        <td>${r.ver}${r.isPlan ? "（规划中）" : ""}</td>
        <td>${r.date || "待排期"}</td>
        <td>${r.title}</td>
        <td>${detail[i] || "—"}</td>
      </tr>`
  )
  .join("");

const summaryTable = `
  <h3>版本摘要（${rows.length} 个版本：${rows.length - 1} 个已发布 + 1 个规划中）</h3>
  <p>完整逐版本明细（新增功能 / 优化改进 / 数据指标）见在线更新日志页 <code>changelog.html</code> 与仓库 <code>changelog/content.js</code>；本表仅为打印版摘要。</p>
  <table>
    <thead><tr><th style="width:12%">版本</th><th style="width:11%">日期</th><th style="width:30%">主题</th><th>代表性内容</th></tr></thead>
    <tbody>${summaryRows}
    </tbody>
  </table>
  <div class="callout">Beta 1.0.1 为 Beta 1.0 的部署补丁：FastAPI 后端正式上线（国内镜像域名同源托管演示页 + API，GitHub Pages 构建时注入后端地址跨域接通），功能集与版本号展示不变；未配置模型 Key 时聊天自动回退 Mock，演示不中断。</div>
`;

/* 3d. 用摘要表替换 ch10 中「v23 标题」到章节结束之间的全部内容 */
const ch10Open = html.indexOf('<section class="chapter" id="ch10">');
const firstH3 = html.indexOf("<h3>", ch10Open);
const ch10Close = html.indexOf("</section>", firstH3);
html = html.slice(0, firstH3) + summaryTable + "\n" + html.slice(ch10Close);

/* ---------- 3.5) 注入紧凑打印排版（仅打印版，不污染在线文档） ----------
 * 目标：含封面 ≤30 页。Edge 默认页边距约 19mm、正文字号约 11pt，
 * 这里收紧页边距并整体降一档字号，内容一字不减。 */
const PRINT_TUNE = `<style id="bp-print-tune">
@page { size: A4; margin: 9mm 8mm; }
@media print {
  html, body { font-size: 8.2pt !important; line-height: 1.3 !important; }
  .page { max-width: none !important; padding: 0 !important; }
  h1 { font-size: 17pt !important; }
  h2 { font-size: 14pt !important; }
  h3 { font-size: 11.5pt !important; }
  h4 { font-size: 9.6pt !important; }
  table { font-size: 7.8pt !important; }
  .callout { padding: 6px 9px !important; margin: 8px 0 !important; }
  li { margin-bottom: 1px !important; }
  p { margin-bottom: 4px !important; }
}
</style>`;
if (html.indexOf("</head>") > 0) html = html.replace("</head>", PRINT_TUNE + "\n</head>");
else html = html.replace("<head>", "<head>\n" + PRINT_TUNE);

/* ---------- 4) 写出打印版并用 Edge 无头打印 ---------- */
fs.writeFileSync(TMP, html);
console.log(
  `📄 打印版已生成（${(html.length / 1024).toFixed(1)}KB，原 ${(before / 1024).toFixed(1)}KB），${rows.length} 行摘要表`
);

const EDGE_CANDIDATES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const edge = EDGE_CANDIDATES.find((p) => fs.existsSync(p));
if (!edge) {
  console.error("❌ 未找到 Edge 可执行文件，无法无头打印");
  process.exit(1);
}
const fileUrl = "file:///" + TMP.replace(/\\/g, "/").replace(/^\/?([A-Za-z]):/, "$1:");
execFileSync(
  edge,
  ["--headless=new", "--no-pdf-header-footer", "--print-to-pdf-no-header", `--print-to-pdf=${PDF}`, fileUrl],
  { stdio: "pipe" }
);
const kb = (fs.statSync(PDF).size / 1024).toFixed(0) + "KB";
console.log(`✅ PDF 已生成 → docs/FutureMirror.Beta.pdf（${kb}）`);

/* ---------- 5) 页数门禁：赛事要求「不超过 30 页（含封面）」 ----------
 * Chromium 输出的 PDF 里页面对象是明文 /Type /Page，可直接计数；
 * 若将来对象流化导致数不到，退化为仅提示，不阻断构建。 */
const MAX_PAGES = 30;
const buf = fs.readFileSync(PDF).toString("latin1");
const pages = (buf.match(/\/Type\s*\/Page[^s]/g) || []).length;
if (pages === 0) {
  console.warn("⚠️ 未从 PDF 中解析到页数（可能被对象流压缩），跳过页数门禁");
} else if (pages > MAX_PAGES) {
  console.error(`❌ 页数超限：${pages} 页 > ${MAX_PAGES} 页（含封面）。请收紧 @page 边距或压减打印版内容。`);
  fs.rmSync(TMP, { force: true });
  process.exit(1);
} else {
  console.log(`📐 页数 ${pages} / ${MAX_PAGES}（含封面），符合赛事上限`);
}
fs.rmSync(TMP, { force: true });
