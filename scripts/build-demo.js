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
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FE = path.join(ROOT, "frontend");
const DEMO = path.join(ROOT, "public", "futuremirror-demo.html");

const manifest = JSON.parse(fs.readFileSync(path.join(FE, "build-manifest.json"), "utf8"));
let html = fs.readFileSync(path.join(FE, "index.html"), "utf8");

/* ---------- 1) CSS：link 序列 → <style> ---------- */
const linkRe = new RegExp(
  manifest.css.map(c => `  <link rel="stylesheet" href="${c.file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`).join("\n")
);
if (!linkRe.test(html)) { console.error("❌ 未找到 CSS link 序列"); process.exit(1); }
const cssBody = manifest.css.map(c =>
  fs.readFileSync(path.join(FE, c.file), "utf8")).join("");
html = html.replace(linkRe, () => `<style>\n${cssBody}</style>`);

/* ---------- 2) JS：script src 序列 → <script> ---------- */
const srcRe = new RegExp(
  manifest.jsLoadOrder.map(f => `  <script src="${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"></script>`).join("\n")
);
if (!srcRe.test(html)) { console.error("❌ 未找到 JS script 序列"); process.exit(1); }
let firstUseStrict = true;
const jsBody = manifest.jsOriginalOrder.map(f => {
  let txt = fs.readFileSync(path.join(FE, f.file), "utf8");
  if (txt.startsWith('"use strict";\n')) {
    if (firstUseStrict) { firstUseStrict = false; }
    else { txt = txt.slice('"use strict";\n'.length); }
  }
  return txt;
}).join("");
html = html.replace(srcRe, () => `<script>\n${jsBody}</script>`);

fs.writeFileSync(DEMO, html);
const kb = (html.length / 1024).toFixed(1) + "KB";
console.log(`✅ 已反合并 → public/futuremirror-demo.html（${kb}，${manifest.jsOriginalOrder.length} 模块 + ${manifest.css.length} CSS 层）`);
