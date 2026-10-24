/* ============================================================
 * build-backend-static.js —— 组装「后端同源托管」的静态目录
 *   backend/static/
 *     ├── futuremirror-demo.html   单文件演示页（apiBase=same-origin）
 *     ├── docs/technical-doc.html  技术文档
 *     ├── changelog.html           更新日志
 *     └── models/                  端侧模型权重（Xenova + onnxruntime）
 *
 *   用途：FastAPI 后端（backend/app/main.py）在 static/ 存在时将其挂载到
 *   站点根路径，使演示页与 API 同源——彻底免除 CORS，镜像站链接保持不变。
 *   该目录为构建产物（.gitignore 已忽略），随源码上传至发布沙箱。
 *
 *   用法：node scripts/build-backend-static.js
 *   依赖：先有 public/changelog.html 与 public/models/（首次克隆需
 *         node scripts/fetch-model.js 拉取模型；文档与日志为仓库文件）。
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "backend", "static");

/* ---------- 0) 清空旧产物，保证幂等 ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "docs"), { recursive: true });

/* ---------- 1) 构建同源版演示页（apiBase=same-origin） ---------- */
const build = execFileSync(
  process.execPath,
  [path.join(ROOT, "scripts", "build-demo.js"), "--out", "backend/static/futuremirror-demo.html"],
  { cwd: ROOT, encoding: "utf8", env: { ...process.env, FM_API_BASE: "same-origin" } }
);
process.stdout.write(build);
/* StaticFiles(html=True) 只认 index.html：复制一份作为站点根入口 */
fs.copyFileSync(path.join(OUT, "futuremirror-demo.html"), path.join(OUT, "index.html"));

/* ---------- 2) 技术文档 ---------- */
const DOC = path.join(ROOT, "docs", "technical-doc.html");
if (fs.existsSync(DOC)) {
  fs.copyFileSync(DOC, path.join(OUT, "docs", "technical-doc.html"));
}

/* ---------- 3) 更新日志 ---------- */
const CHANGELOG = path.join(ROOT, "public", "changelog.html");
if (fs.existsSync(CHANGELOG)) {
  fs.copyFileSync(CHANGELOG, path.join(OUT, "changelog.html"));
} else {
  console.warn("⚠️ 未找到 public/changelog.html，跳过更新日志页");
}

/* ---------- 4) 端侧模型权重 ---------- */
const MODELS = path.join(ROOT, "public", "models");
if (fs.existsSync(MODELS)) {
  fs.cpSync(MODELS, path.join(OUT, "models"), { recursive: true });
} else {
  console.warn("⚠️ 未找到 public/models，端侧模型将退回外网镜像源；先执行 node scripts/fetch-model.js");
}

/* ---------- 5) 汇总 ---------- */
const dirSize = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .reduce(
      (s, e) => s + (e.isDirectory() ? dirSize(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size),
      0
    );
console.log(`✅ 后端静态目录已就绪 → backend/static/（${(dirSize(OUT) / 1024 / 1024).toFixed(1)}MB）`);
console.log("   演示页 / · 文档 /docs/technical-doc.html · 日志 /changelog.html · 模型 /models/");
