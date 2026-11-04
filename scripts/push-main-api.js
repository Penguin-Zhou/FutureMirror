/* ============================================================
 * push-main-api.js —— 经 GitHub Data API 把本地提交推到 main
 *   场景：git 传输被代理 502 拦截时，用 api.github.com 推送源码提交
 *
 *   策略（v3：内容保真 + 删除守卫）：
 *     ① 远端 main 的 tree 在本地历史里回溯定位「已推送到的那个提交」base
 *     ② 若 base = HEAD → 无需推送
 *     ③ 否则 → 把 base..HEAD 之间的每个本地提交按顺序逐个重建到远端，
 *        提交信息 / 作者 / 日期保留，远端历史与本地一一对应
 *     ④ 每个提交的变更文件内容取自**该提交本身**（git show <sha>:<path>），
 *        不再是工作树当前内容——否则中间提交会掺入未来版本的文件
 *     ⑤ 删除条目仅在该路径确实存在于父 tree 时下发（sha: null）——
 *        否则 GitHub 对「删一个不存在的路径」返回 422 BadObjectState
 *        （曾踩中：误提交的临时诊断脚本在后续提交里被删，回放即 422）
 *     ⑥ 文件 mode 按 ls-tree 原样保留（100644 / 100755 / 120000）
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

function git(args, opts) {
  return execFileSync(
    "git",
    ["-C", CWD, "-c", "core.quotepath=false", ...args],
    Object.assign({ encoding: "utf8", maxBuffer: 1024 * 1024 * 64 }, opts)
  ).trim();
}
function gitBuf(args) {
  return execFileSync("git", ["-C", CWD, "-c", "core.quotepath=false", ...args], {
    maxBuffer: 1024 * 1024 * 512,
    encoding: "buffer",
  });
}
/* 出口网关对 api.github.com 的 GET 偶发 502（实测三次里两次失败，
   同一条命令重试就好），所以读操作带退避重试；写操作（POST/PATCH）不做，
   免得把「已成功但响应丢失」的请求重放成两次提交。 */
function gh(args, input) {
  /* blobs / trees / commits 都是「同样的输入产出同样的东西」（内容寻址），
     失败重放不会写出多余记录，所以这三条 POST 也允许重试；
     真正有副作用的是末尾的 ref PATCH，它单独处理。 */
  const pure = args.some((a) => /\/git\/(blobs|trees|commits)$/.test(a));
  const write = args.some((a) => a === "-X" || a.startsWith("-X"));
  let lastErr;
  for (let i = 0; i < 6; i++) {
    try {
      return execFileSync("gh", ["api", ...args, ...(input ? ["--input", "-"] : [])], {
        input: input || undefined,
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 512,
      }).trim();
    } catch (e) {
      lastErr = e;
      const msg = String((e && (e.stderr || e.message)) || "");
      const flaky = /Bad Gateway|502|timed? ?out|ETIMEDOUT|ECONNRESET|socket hang up/i.test(msg);
      if (!flaky || (write && !pure)) throw e;
      execFileSync("node", ["-e", `setTimeout(()=>{},${400 * (i + 1)})`]);
    }
  }
  throw lastErr;
}
function ghJson(args, input) {
  return JSON.parse(gh(args, input));
}

/* 0) 远端 main 头与树
   不用 /commits/{branch}：该端点在某些网络环境下会稳定返回 502（网关，
   不是 GitHub 本身），而 git/ref + git/commits 两条端点一直可用。 */
const ref = ghJson([`repos/${REPO}/git/ref/heads/${BRANCH}`, "--jq", "."]);
const head = ghJson([`repos/${REPO}/git/commits/${ref.object.sha}`, "--jq", "."]);
const remoteSha = head.sha;
const remoteTree = head.tree.sha;
console.log(`远端 ${BRANCH}: ${remoteSha.slice(0, 7)}（tree ${remoteTree.slice(0, 7)}）`);

/* 1) 在本地历史里回溯：哪个提交的 tree 与远端一致 → 它就是「已推送到」的位置 */
const history = git(["log", "--format=%H %T"])
  .split("\n")
  .map((l) => {
    const [sha, tree] = l.split(" ");
    return { sha, tree };
  });
const baseIdx = history.findIndex((c) => c.tree === remoteTree);
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

/* 2) 逐个重建提交（内容取自各提交自身） */
let parent = remoteSha;
let prevTree = remoteTree;
for (const c of pending) {
  const message = git(["log", "-1", "--format=%B", c.sha]);
  const authorName = git(["log", "-1", "--format=%an", c.sha]);
  const authorEmail = git(["log", "-1", "--format=%ae", c.sha]);
  const authorDate = git(["log", "-1", "--format=%aI", c.sha]);

  /* name-status：A 新增 / M 修改 / D 删除 / R 改名 */
  const changed = git(["diff", "--name-status", c.sha + "~1", c.sha])
    .split("\n")
    .filter(Boolean);
  /* 父 tree 的文件清单（删除守卫用：只删确实存在的路径） */
  const parentFiles = new Set(
    git(["ls-tree", "-r", "--name-only", c.sha + "~1"])
      .split("\n")
      .filter(Boolean)
  );

  const entries = [];
  for (const line of changed) {
    const parts = line.split("\t");
    const st = parts[0];
    if (st.startsWith("D")) {
      const rel = parts[1];
      if (parentFiles.has(rel)) entries.push({ path: rel, mode: "100644", type: "blob", sha: null });
      continue;
    }
    if (st.startsWith("R")) {
      const oldRel = parts[1],
        newRel = parts[2];
      if (parentFiles.has(oldRel)) entries.push({ path: oldRel, mode: "100644", type: "blob", sha: null });
      const mode = git(["ls-tree", c.sha, "--", newRel]).split(/\s+/)[0] || "100644";
      const b64 = gitBuf(["show", `${c.sha}:${newRel}`]).toString("base64");
      const sha = ghJson(
        [`repos/${REPO}/git/blobs`, "-X", "POST"],
        JSON.stringify({ content: b64, encoding: "base64" })
      ).sha;
      entries.push({ path: newRel, mode, type: "blob", sha });
      continue;
    }
    const rel = parts[parts.length - 1];
    const mode = git(["ls-tree", c.sha, "--", rel]).split(/\s+/)[0] || "100644";
    const b64 = gitBuf(["show", `${c.sha}:${rel}`]).toString("base64");
    const sha = ghJson(
      [`repos/${REPO}/git/blobs`, "-X", "POST"],
      JSON.stringify({ content: b64, encoding: "base64" })
    ).sha;
    entries.push({ path: rel, mode, type: "blob", sha });
  }

  const treeSha = ghJson(
    [`repos/${REPO}/git/trees`, "-X", "POST"],
    JSON.stringify({ base_tree: prevTree, tree: entries })
  ).sha;
  const commitSha = ghJson(
    [`repos/${REPO}/git/commits`, "-X", "POST"],
    JSON.stringify({
      message,
      tree: treeSha,
      parents: [parent],
      author: { name: authorName, email: authorEmail, date: authorDate },
    })
  ).sha;

  console.log(`  ↳ ${commitSha.slice(0, 7)}  ${message.split("\n")[0].slice(0, 62)}（${entries.length} 条目）`);
  parent = commitSha;
  prevTree = treeSha;
}

/* 3) 快进更新 ref。这一条不重试：重放一次「移动分支」比失败更难收拾。
   若上次其实已经成功、只是响应丢在路上，这里按现状核对一遍再决定是否报错。 */
try {
  gh([`repos/${REPO}/git/refs/heads/${BRANCH}`, "-X", "PATCH", "-f", `sha=${parent}`, "-F", "force=false"]);
} catch (e) {
  const now = ghJson([`repos/${REPO}/git/ref/heads/${BRANCH}`, "--jq", "."]);
  if (now.object.sha !== parent) throw e;
  console.log("（ref 已在目标位置，按成功处理）");
}
console.log(`✅ main 已更新 → ${parent.slice(0, 7)}（https://github.com/${REPO}/commit/${parent}）`);
