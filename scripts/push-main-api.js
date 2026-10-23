/* ============================================================
 * push-main-api.js —— 经 GitHub Data API 把本地提交推到 main
 *   场景：git 传输被代理 502 拦截时，用 api.github.com 推送源码提交
 *
 *   策略（v2：支持一次补推多个提交）：
 *     ① 远端 main 的 tree 在本地历史里回溯定位「已推送到的那个提交」base
 *     ② 若 base = HEAD~1 → 单提交快路径（原有行为）
 *     ③ 否则 → 把 base..HEAD 之间的每个本地提交按顺序逐个重建到远端，
 *        各自的提交信息 / 作者 / 日期都保留，远端历史与本地一一对应
 *
 *   安全：base 找不到（真分叉）时拒绝推送，不做强制覆盖。
 *   用法：node scripts/push-main-api.js
 * ============================================================ */
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO = "Penguin-Zhou/FutureMirror";
const BRANCH = "main";
const CWD = path.join(__dirname, "..");

function git(args) {
  return execFileSync("git", ["-C", CWD, ...args], { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 }).trim();
}
function gh(args, input) {
  return execFileSync("gh", ["api", ...args, ...(input ? ["--input", "-"] : [])], {
    input: input || undefined, encoding: "utf8", maxBuffer: 1024 * 1024 * 512,
  }).trim();
}
function ghJson(args, input) {
  return JSON.parse(gh(args, input));
}

/* 0) 远端 main 头与树 */
const remoteSha = ghJson([`repos/${REPO}/commits/${BRANCH}`, "--jq", "."]).sha;
let remoteTree = ghJson([`repos/${REPO}/commits/${BRANCH}`, "--jq", "."]).commit.tree.sha;
console.log(`远端 ${BRANCH}: ${remoteSha.slice(0, 7)}（tree ${remoteTree.slice(0, 7)}）`);

/* 1) 在本地历史里回溯：哪个提交的 tree 与远端一致 → 它就是「已推送到」的位置 */
const history = git(["log", "--format=%H %T"]).split("\n").map(l => {
  const [sha, tree] = l.split(" ");
  return { sha, tree };
});
const baseIdx = history.findIndex(c => c.tree === remoteTree);
if (baseIdx < 0) {
  console.error("❌ 远端 tree 在本地历史中找不到对应提交，疑似真分叉，已中止（不会强制覆盖）");
  process.exit(1);
}
const base = history[baseIdx];
if (baseIdx === 0) {
  console.log("✅ 远端已与本地 HEAD 一致，无需推送");
  process.exit(0);
}
/* history 是从新到旧；baseIdx 之前的都是待补推的，倒序后按时间从早到晚 */
const pending = history.slice(0, baseIdx).reverse();
console.log(`本地已推送到 ${base.sha.slice(0, 7)}；待补推 ${pending.length} 个提交`);

/* 2) 逐个重建提交 */
let parent = remoteSha;
let prevTree = remoteTree;
for (const c of pending) {
  const message = git(["log", "-1", "--format=%B", c.sha]);
  const authorName = git(["log", "-1", "--format=%an", c.sha]);
  const authorEmail = git(["log", "-1", "--format=%ae", c.sha]);
  const authorDate = git(["log", "-1", "--format=%aI", c.sha]);

  const changed = git(["diff", "--name-only", c.sha + "~1", c.sha]).split("\n").filter(Boolean);
  const entries = [];
  for (const rel of changed) {
    const p = path.join(CWD, rel);
    if (!fs.existsSync(p)) {          // 删除的文件：mode 置 0 表示移除
      entries.push({ path: rel, mode: "100644", type: "blob", sha: null });
      continue;
    }
    const b64 = fs.readFileSync(p).toString("base64");
    const sha = ghJson([`repos/${REPO}/git/blobs`, "-X", "POST"],
      JSON.stringify({ content: b64, encoding: "base64" })).sha;
    entries.push({ path: rel, mode: "100644", type: "blob", sha });
  }

  const treeSha = ghJson([`repos/${REPO}/git/trees`, "-X", "POST"],
    JSON.stringify({ base_tree: prevTree, tree: entries })).sha;
  const commitSha = ghJson([`repos/${REPO}/git/commits`, "-X", "POST"],
    JSON.stringify({
      message,
      tree: treeSha,
      parents: [parent],
      author: { name: authorName, email: authorEmail, date: authorDate },
    })).sha;

  console.log(`  ↳ ${commitSha.slice(0, 7)}  ${message.split("\n")[0].slice(0, 62)}（${changed.length} 文件）`);
  parent = commitSha;
  prevTree = treeSha;
}

/* 3) 快进更新 ref */
gh([`repos/${REPO}/git/refs/heads/${BRANCH}`, "-X", "PATCH", "-f", `sha=${parent}`, "-F", "force=false"]);
console.log(`✅ main 已更新 → ${parent.slice(0, 7)}（https://github.com/${REPO}/commit/${parent}）`);
