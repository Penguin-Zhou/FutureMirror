/* 构建「评分方法」展示页：Vue 3 + Vite → 单文件 HTML → docs/scoring-method.html
   用法：node scripts/build-scoring-method.js
   - 依赖缺失时先装（约 36 个包，只在首次构建时发生）
   - 产物是单个自包含 HTML，与项目其它交付物一致：双击可开，不依赖服务器 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "vue-scoring-method");
const OUT = path.join(ROOT, "docs", "scoring-method.html");

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`\n❌ ${cmd} ${args.join(" ")} 失败（exit ${r.status}）`);
    process.exit(r.status || 1);
  }
}

if (!fs.existsSync(path.join(DIR, "node_modules"))) {
  console.log("📦 首次构建，安装展示层依赖…");
  run("npm", ["install", "--no-audit", "--no-fund"], DIR);
}

run("npm", ["run", "build"], DIR);

const built = path.join(DIR, "dist", "index.html");
if (!fs.existsSync(built)) {
  console.error("❌ 构建产物缺失：vue-scoring-method/dist/index.html");
  process.exit(1);
}

const html = fs.readFileSync(built, "utf8");
if (!/<div id="app">/.test(html) && !/<div id=app>/.test(html)) {
  console.error("❌ 产物缺少挂载点，Vue 未正常打包");
  process.exit(1);
}
if (/src="\/src\/main\.js"/.test(html)) {
  console.error("❌ 产物仍引用源码入口，单文件内联未生效");
  process.exit(1);
}

fs.writeFileSync(OUT, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`✅ 已生成 → docs/scoring-method.html（${kb}KB · 单文件 · 无外部请求）`);
