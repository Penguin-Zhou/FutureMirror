/* ============================================================
 * build-demo.js —— 把 frontend/ 模块结构反合并为单文件演示版
 *   frontend/index.html + css 层 + js 各模块
 *     → public/futuremirror-demo.html
 *   合并规则：
 *     1) 三张 <link> 还原为 <style>（按 tokens → theme → pages 顺序）
 *     2) <script src> 序列还原为一个 <script>（按 build-manifest 的
 *        jsOriginalOrder，即原单文件的区划顺序）
 *     3) 各文件顶部的 "use strict"; 仅保留第一个（单文件只需一条指令前言）
 *   验证：node scripts/build-demo.js && node scripts/validate-demo.js
 *   可选参数：
 *     --out <路径>   输出文件（默认 public/futuremirror-demo.html）
 *                   相对路径基于仓库根目录解析
 *   环境变量：
 *     FM_API_BASE=<url>       构建时把 config.js 的 apiBase 占位符替换为该地址
 *     FM_API_BASE=same-origin 替换为 same-origin（与 API 同源部署时使用，
 *                             config.js 会转为当前站点 origin）
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FE = path.join(ROOT, "frontend");

/* ---------- 输出路径：--out 覆盖默认 public/futuremirror-demo.html ---------- */
const outArgIndex = process.argv.indexOf("--out");
const OUT_ARG = outArgIndex > -1 ? process.argv[outArgIndex + 1] : "";
const DEMO = OUT_ARG
  ? path.isAbsolute(OUT_ARG)
    ? OUT_ARG
    : path.join(ROOT, OUT_ARG)
  : path.join(ROOT, "public", "futuremirror-demo.html");

const manifest = JSON.parse(fs.readFileSync(path.join(FE, "build-manifest.json"), "utf8"));
let html = fs.readFileSync(path.join(FE, "index.html"), "utf8");

/* ---------- 0) 可选：构建时注入后端地址 ----------
 * 设置环境变量 FM_API_BASE=https://your-backend.example.com 后，
 * config.js 中的 apiBase 占位符会被替换为该地址，
 * 演示页默认连接真实后端（JWT 登录 / 会话持久化 / 服务端评分）。
 * FM_API_BASE=same-origin 时注入 same-origin（与 API 同源部署，
 * config.js 会转换为当前站点 origin，彻底免除跨域）。
 * 不设置时保持 apiBase: ""（纯前端 Mock 模式），既有测试不受影响。 */
const INJECT_API_BASE = String(process.env.FM_API_BASE || "")
  .trim()
  .replace(/\/+$/, "");

/* ---------- 1) CSS：link 序列 → <style> ---------- */
const linkRe = new RegExp(
  manifest.css
    .map((c) => `  <link rel="stylesheet" href="${c.file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`)
    .join("\n")
);
if (!linkRe.test(html)) {
  console.error("❌ 未找到 CSS link 序列");
  process.exit(1);
}
const cssBody = manifest.css.map((c) => fs.readFileSync(path.join(FE, c.file), "utf8")).join("");
html = html.replace(linkRe, () => `<style>\n${cssBody}</style>`);

/* ---------- 2) JS：script src 序列 → <script> ---------- */
const srcRe = new RegExp(
  manifest.jsLoadOrder.map((f) => `  <script src="${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"></script>`).join("\n")
);
if (!srcRe.test(html)) {
  console.error("❌ 未找到 JS script 序列");
  process.exit(1);
}
let firstUseStrict = true;
const jsBody = manifest.jsOriginalOrder
  .map((f) => {
    let txt = fs.readFileSync(path.join(FE, f.file), "utf8");
    if (INJECT_API_BASE && /apiBase:\s*""/.test(txt)) {
      txt = txt.replace(/apiBase:\s*""/, `apiBase: ${JSON.stringify(INJECT_API_BASE)}`);
      console.log(`🔌 已注入后端地址 → ${f.file}: apiBase = ${INJECT_API_BASE}`);
    }
    if (txt.startsWith('"use strict";\n')) {
      if (firstUseStrict) {
        firstUseStrict = false;
      } else {
        txt = txt.slice('"use strict";\n'.length);
      }
    }
    return txt;
  })
  .join("");
html = html.replace(srcRe, () => `<script>\n${jsBody}</script>`);

fs.mkdirSync(path.dirname(DEMO), { recursive: true });
fs.writeFileSync(DEMO, html);
const relOut = path.relative(ROOT, DEMO).replace(/\\/g, "/");
const kb = (html.length / 1024).toFixed(1) + "KB";
console.log(
  `✅ 已反合并 → ${relOut}（${kb}，${manifest.jsOriginalOrder.length} 模块 + ${manifest.css.length} CSS 层）`
);
