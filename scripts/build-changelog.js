#!/usr/bin/env node
/**
 * build-changelog.js —— 由 app/changelog/{content.ts, changelog.css} 组装
 * 静态更新日志页 public/changelog.html（与 Next.js 页同源同样式）。
 *
 * 用法：node scripts/build-changelog.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC_TS = path.join(ROOT, "app", "changelog", "content.ts");
const SRC_CSS = path.join(ROOT, "app", "changelog", "changelog.css");
const OUT = path.join(ROOT, "public", "changelog.html");

const ts = fs.readFileSync(SRC_TS, "utf8");
const css = fs.readFileSync(SRC_CSS, "utf8");

// 提取模板字符串内容（第一个反引号对之间）
const m = ts.match(/export const changelogHtml = `([\s\S]*?)`;/);
if (!m) { console.error("❌ 未找到 changelogHtml 模板字符串"); process.exit(1); }
const body = m[1];

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>版本更新日志 · 面镜 FutureMirror</title>
<style>
${css.trimEnd()}
</style>
</head>
<body>
<div class="changelog-page">
  <div class="cl-inner"><a class="cl-back" href="index.html">← 返回在线演示</a></div>
${body}</div>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`✅ 已生成 → public/changelog.html（${(fs.statSync(OUT).size / 1024).toFixed(1)}KB）`);
