/* ============================================================
 * push-main-api.js —— 经 GitHub Data API 把本地 HEAD 推到 main
 *   场景：git 传输被代理 502 拦截时，用 api.github.com 推送源码提交
 *   前提：远端 main 头 = 本地 HEAD~1 的内容等价提交（同 tree）
 *   策略：对比 HEAD~1 → HEAD 的变化文件建 blob → 基于远端 tree 建新树
 *        → 以远端 main 为 parent 建提交（保留作者信息）→ 更新 ref
 *   用法：node scripts/push-main-api.js
 * ============================================================ */
"use strict";
const { execFileSync } = require("child_process");

const REPO = "Penguin-Zhou/FutureMirror";
const BRANCH = "main";
const CWD = require("path").join(__dirname, "..");

function git(args) {
  return execFileSync("git", ["-C", CWD, ...args], { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 }).trim();
}
function gh(args, input) {
  return execFileSync("gh", ["api", ...args, ...(input ? ["--input", "-"] : [])], {
    input: input || undefined, encoding: "utf8", maxBuffer: 1024 * 1024 * 512,
  }).trim();
}

/* 0) 本地提交信息 */
const headSha = git(["rev-parse", "HEAD"]);
const parentSha = git(["rev-parse", "HEAD~1"]);
const parentTree = git(["rev-parse", "HEAD~1^{tree}"]);
const headTree = git(["rev-parse", "HEAD^{tree}"]);
const message = git(["log", "-1", "--format=%B"]);
const authorName = git(["log", "-1", "--format=%an"]);
const authorEmail = git(["log", "-1", "--format=%ae"]);
const authorDate = git(["log", "-1", "--format=%aI"]);
console.log(`本地 HEAD: ${headSha.slice(0, 7)}（parent ${parentSha.slice(0, 7)}，tree ${headTree.slice(0, 7)}）`);

/* 1) 远端 main 头与树 */
const remoteSha = gh([`repos/${REPO}/commits/${BRANCH}`, "--jq", ".sha"]);
const remoteTree = gh([`repos/${REPO}/commits/${BRANCH}`, "--jq", ".commit.tree.sha"]);
console.log(`远端 ${BRANCH}: ${remoteSha.slice(0, 7)}（tree ${remoteTree.slice(0, 7)}）`);

/* 2) 校验：远端树应等于本地 parent 树（内容等价） */
if (remoteTree !== parentTree) {
  console.error(`❌ 远端 tree ${remoteTree.slice(0, 7)} ≠ 本地 parent tree ${parentTree.slice(0, 7)}，历史已分叉，需先合并或改用全量推送`);
  process.exit(1);
}

/* 3) 变化文件（HEAD~1 → HEAD） */
const changed = git(["diff", "--name-only", "HEAD~1", "HEAD"]).split("\n").filter(Boolean);
console.log(`变化文件 ${changed.length} 个：${changed.join(", ")}`);

/* 4) 建 blob */
const entries = [];
for (const rel of changed) {
  const b64 = require("fs").readFileSync(require("path").join(CWD, rel)).toString("base64");
  const body = JSON.stringify({ content: b64, encoding: "base64" });
  const sha = JSON.parse(gh([`repos/${REPO}/git/blobs`, "-X", "POST"], body)).sha;
  console.log(`  blob ${rel}: ${sha.slice(0, 7)}（${(b64.length / 1024 / 1024).toFixed(2)}MB base64）`);
  entries.push({ path: rel, mode: "100644", type: "blob", sha });
}

/* 5) 新树（基于远端树） */
const treeBody = JSON.stringify({ base_tree: remoteTree, tree: entries });
const treeSha = JSON.parse(gh([`repos/${REPO}/git/trees`, "-X", "POST"], treeBody)).sha;
console.log(`新树: ${treeSha.slice(0, 7)}`);

/* 6) 提交（parent = 远端 main，保留原作者与日期） */
const commitBody = JSON.stringify({
  message,
  tree: treeSha,
  parents: [remoteSha],
  author: { name: authorName, email: authorEmail, date: authorDate },
});
const commitSha = JSON.parse(gh([`repos/${REPO}/git/commits`, "-X", "POST"], commitBody)).sha;
console.log(`新提交: ${commitSha.slice(0, 7)}`);

/* 7) 快进更新 ref */
gh([`repos/${REPO}/git/refs/heads/${BRANCH}`, "-X", "PATCH", "-f", `sha=${commitSha}`, "-F", "force=false"]);
console.log(`✅ main 已更新 → ${commitSha.slice(0, 7)}（https://github.com/${REPO}/commit/${commitSha}）`);
