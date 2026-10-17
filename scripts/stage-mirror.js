/* ============================================================
 * stage-mirror.js —— 生成「国内镜像」发布目录
 *   public/futuremirror-demo.html  →  .mirror-site/index.html (+ 404.html)
 *   docs/technical-doc.html        →  .mirror-site/docs/technical-doc.html
 *
 *   用途：github.io 在部分国内网络下访问不稳，需要一份可直连的备用地址。
 *   该目录是纯产物（.gitignore 已忽略），由 WorkBuddy 站点托管发布，
 *   每次内容更新后重新执行本脚本并重新发布即可。
 *
 *   用法：node scripts/stage-mirror.js
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "public", "futuremirror-demo.html");
const DOC = path.join(ROOT, "docs", "technical-doc.html");
const OUT_DIR = path.join(ROOT, ".mirror-site");

if (!fs.existsSync(SRC)) {
  console.error(`❌ 未找到 ${SRC}，请先执行 node scripts/build-demo.js`);
  process.exit(1);
}

const html = fs.readFileSync(SRC, "utf8");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "index.html"), html);
fs.writeFileSync(path.join(OUT_DIR, "404.html"), html);

/* 技术文档同步发布到镜像站，保证国内网络下也能直接打开在线文档 */
let docKB = 0;
if (fs.existsSync(DOC)) {
  const doc = fs.readFileSync(DOC, "utf8");
  docKB = Buffer.byteLength(doc, "utf8") / 1024;
  fs.mkdirSync(path.join(OUT_DIR, "docs"), { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "docs", "technical-doc.html"), doc);
}

const sizeKB = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
const version = (html.match(/beta\s*1\.0/i) || ["Beta 1.0"])[0];
console.log(`✅ 镜像目录已就绪 → .mirror-site/（index.html + 404.html，${sizeKB}KB，${version}）`);
if (docKB) console.log(`   技术文档 → .mirror-site/docs/technical-doc.html（${docKB.toFixed(1)}KB）`);
console.log("   发布：在 WorkBuddy 中对该目录执行「发布为应用」（静态站点）");
