/* ============================================================
 * push-ghpages-api.js —— 经 GitHub Data API 更新 gh-pages 分支
 *   场景：git 传输被代理 502 拦截时，用 api.github.com 推送产物
 *   策略：base_tree 继承当前 gh-pages 树，只提交变化的文件，
 *        未变内容（如 41MB models/）不重传；gh-pages 保持单提交形态
 *   用法：node scripts/push-ghpages-api.js <staged-dir>
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const STAGED = process.argv[2];
if (!STAGED || !fs.existsSync(STAGED)) {
  console.error("用法: node scripts/push-ghpages-api.js <staged-dir>");
  process.exit(1);
}
const REPO = "Penguin-Zhou/FutureMirror";
const BRANCH = "gh-pages";

/* 相对 staged 目录、需要更新的文件（未列出的继承 base_tree） */
const CHANGED = [
  "index.html",
  "404.html",
  "README.md",
  "changelog.html",
  "docs/technical-doc.html",
  // 端侧人脸检测资源（自托管，Pages 同源可读）；缺失则跳过，前端自动回退 CDN
  "models/faceapi/face-api.min.js",
  "models/faceapi/weights/tiny_face_detector_model-weights_manifest.json",
  "models/faceapi/weights/tiny_face_detector_model-shard1",
  // 端侧 PDF 解析（同源自托管 + CDN 兜底）；缺失则跳过，前端自动回退 CDN
  "models/pdfjs/pdf.min.js",
  "models/pdfjs/pdf.worker.min.js",
];

function gh(args, input) {
  return execFileSync("gh", ["api", ...args, ...(input ? ["--input", "-"] : [])], {
    input: input || undefined,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 512,
  }).trim();
}

/* 1) 当前 gh-pages 头与树 */
const headSha = gh([`repos/${REPO}/commits/${BRANCH}`, "--jq", ".sha"]);
const baseTree = gh([`repos/${REPO}/commits/${BRANCH}`, "--jq", ".commit.tree.sha"]);
console.log(`gh-pages 头: ${headSha.slice(0, 7)}，base_tree: ${baseTree.slice(0, 7)}`);

/* 2) 为每个变化文件建 blob（base64，支持二进制） */
const entries = [];
for (const rel of CHANGED) {
  const abs = path.join(STAGED, rel);
  if (!fs.existsSync(abs)) {
    if (rel.indexOf("models/") === 0) {
      console.warn(`⚠️ 跳过缺失的可选资源 ${rel}（前端将回退 CDN）`);
      continue;
    }
    console.error(`❌ 缺少 ${rel}`);
    process.exit(1);
  }
  const b64 = fs.readFileSync(abs).toString("base64");
  const body = JSON.stringify({ content: b64, encoding: "base64" });
  const sha = JSON.parse(gh([`repos/${REPO}/git/blobs`, "-X", "POST"], body)).sha;
  console.log(`blob ${rel}: ${sha.slice(0, 7)}（${(b64.length / 1024 / 1024).toFixed(2)}MB base64）`);
  entries.push({ path: rel, mode: "100644", type: "blob", sha });
}

/* 3) 基于 base_tree 建新树（嵌套路径由 API 自动展开） */
const treeBody = JSON.stringify({ base_tree: baseTree, tree: entries });
const treeSha = JSON.parse(gh([`repos/${REPO}/git/trees`, "-X", "POST"], treeBody)).sha;
console.log(`新树: ${treeSha.slice(0, 7)}`);

/* 4) 单提交（无父，保持产物分支单提交形态） */
const stamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
const commitBody = JSON.stringify({
  message: `deploy: 在线演示 Beta 1.0（${stamp}）`,
  tree: treeSha,
});
const commitSha = JSON.parse(gh([`repos/${REPO}/git/commits`, "-X", "POST"], commitBody)).sha;
console.log(`新提交: ${commitSha.slice(0, 7)}`);

/* 5) 强推分支 */
gh([`repos/${REPO}/git/refs/heads/${BRANCH}`, "-X", "PATCH", "-f", `sha=${commitSha}`, "-F", "force=true"]);
console.log(`✅ gh-pages 已更新 → ${commitSha.slice(0, 7)}（${stamp}）`);
