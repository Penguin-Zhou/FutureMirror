/* ============================================================
 * deploy-pages.js —— 把单文件演示版与技术文档发布到 GitHub Pages
 *   public/futuremirror-demo.html  →  分支 gh-pages（index.html / 404.html）
 *   docs/technical-doc.html        →  分支 gh-pages（docs/technical-doc.html）
 *   发布后地址：
 *     https://<user>.github.io/<repo>/                      演示
 *     https://<user>.github.io/<repo>/docs/technical-doc.html 技术文档
 *
 *   用法：
 *     node scripts/deploy-pages.js             # 发布当前 public/ 下的产物
 *     node scripts/deploy-pages.js --build     # 先从 frontend/ 重建单文件版再发布
 *     node scripts/deploy-pages.js --dry-run   # 只在临时目录装配，不推送
 *
 *   说明：gh-pages 分支为「纯产物分支」，每次发布重建单个提交并强推，
 *        因此该分支不保留历史；项目主历史始终在 main。
 * ============================================================ */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "public", "futuremirror-demo.html");
const DOC = path.join(ROOT, "docs", "technical-doc.html");
const BRANCH = "gh-pages";

const argv = process.argv.slice(2);
const BUILD = argv.includes("--build");
const DRY = argv.includes("--dry-run");

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", ...opts }).trim();
}
function log(step, msg) { console.log(`[${step}] ${msg}`); }

/* ---------- 0) 可选：重建单文件版 ---------- */
if (BUILD) {
  log("build", "从 frontend/ 重建 public/futuremirror-demo.html");
  console.log(sh(process.execPath, [path.join(ROOT, "scripts", "build-demo.js")], { cwd: ROOT }));
}
if (!fs.existsSync(SRC)) {
  console.error(`❌ 未找到 ${SRC}，请先执行 node scripts/build-demo.js`);
  process.exit(1);
}
const HAS_DOC = fs.existsSync(DOC);

/* ---------- 1) 读取远程地址 ---------- */
const remoteUrl = sh("git", ["-C", ROOT, "remote", "get-url", "origin"]);
log("remote", remoteUrl);

/* ---------- 2) 在临时目录装配站点 ---------- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fm-pages-"));
const html = fs.readFileSync(SRC, "utf8");
const sizeKB = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);

fs.writeFileSync(path.join(tmp, "index.html"), html);
/* 404 也指向演示页：Pages 上任何拼错的路径都仍能看到演示，而不是 GitHub 的 404 */
fs.writeFileSync(path.join(tmp, "404.html"), html);
/* .nojekyll：跳过 Jekyll 处理，保证产物按原样发布 */
fs.writeFileSync(path.join(tmp, ".nojekyll"), "");

/* 技术文档随演示一同发布：排版好的 HTML 版可直接在线阅读（PDF 版另行以附件提交） */
let docKB = 0;
if (HAS_DOC) {
  const doc = fs.readFileSync(DOC, "utf8");
  docKB = Buffer.byteLength(doc, "utf8") / 1024;
  fs.mkdirSync(path.join(tmp, "docs"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "docs", "technical-doc.html"), doc);
}

const version = (html.match(/beta\s*1\.0/i) || ["Beta 1.0"])[0];
const stamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
fs.writeFileSync(
  path.join(tmp, "README.md"),
  `# FutureMirror 在线演示（发布产物分支）\n\n` +
  `- 内容：\`public/futuremirror-demo.html\`（单文件演示版，${sizeKB}KB，CSS/JS 全内联）\n` +
  (HAS_DOC ? `- 文档：\`docs/technical-doc.html\`（技术文档 HTML 在线版，${docKB.toFixed(1)}KB）\n` : "") +
  `- 版本：${version}\n` +
  `- 生成时间：${stamp}\n` +
  `- 生成方式：\`node scripts/deploy-pages.js --build\`\n\n` +
  `本分支只存放构建产物，源码与提交历史见主分支 \`main\`。\n`
);
log("stage", `${tmp}（${sizeKB}KB${HAS_DOC ? ` + 文档 ${docKB.toFixed(1)}KB` : ""}）`);

if (DRY) {
  log("dry-run", "已装配，未推送；目录保留以便检查");
  process.exit(0);
}

/* ---------- 3) 组装独立仓库并推送 ---------- */
const git = (...a) => sh("git", ["-C", tmp, ...a], { env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
git("init", "-q");
git("checkout", "-q", "-b", BRANCH);
git("add", "-A");
git("-c", "user.name=Penguin-Zhou", "-c", "user.email=25435@users.noreply.github.com",
    "commit", "-q", "-m", `deploy: 在线演示 ${version}（${stamp}）`);
git("remote", "add", "origin", remoteUrl);

let pushed = false;
for (let i = 1; i <= 3 && !pushed; i++) {
  try {
    log("push", `第 ${i} 次尝试强制推送 ${BRANCH}`);
    git("push", "-f", "origin", `HEAD:${BRANCH}`);
    pushed = true;
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || "").toString().split("\n").slice(-3).join(" | ");
    log("push", `失败：${msg}`);
  }
}
if (!pushed) {
  console.error(`❌ 推送失败，产物仍保留在 ${tmp}`);
  process.exit(1);
}

/* ---------- 4) 收尾 ---------- */
fs.rmSync(tmp, { recursive: true, force: true });
const repo = remoteUrl.replace(/^.*github\.com[:/]/, "").replace(/\.git$/, "");
const [owner, name] = repo.split("/");
log("done", `已发布 → https://${owner.toLowerCase()}.github.io/${name}/`);
if (HAS_DOC) log("done", `技术文档 → https://${owner.toLowerCase()}.github.io/${name}/docs/technical-doc.html`);
