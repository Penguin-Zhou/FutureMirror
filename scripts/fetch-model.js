/**
 * fetch-model.js —— 把 all-MiniLM-L6-v2 端侧模型权重拉到本地，供两个静态站点自托管
 *
 * 背景：transformers.js 默认从 huggingface.co 取权重，国内不可达；hf-mirror.com 在国内可访问，
 * 但它对浏览器 fetch 的响应缺少 Access-Control-Allow-Origin（Chromium 报
 * corsError: MissingAllowOriginHeader），导致前端依然「Failed to fetch」。
 * 因此改为：把权重文件随站点一起发布，页面同源读取，彻底绕开跨域与墙的问题。
 *
 * 用法：
 *   node scripts/fetch-model.js           # 缺失则下载，已存在则跳过
 *   node scripts/fetch-model.js --force   # 强制重新下载
 *
 * 产物：public/models/Xenova/all-MiniLM-L6-v2/resolve/main/...
 *       （该目录已被 .gitignore 忽略，不进入主仓库历史；发布脚本会自动调用本脚本）
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MODEL = "Xenova/all-MiniLM-L6-v2";
const OUT_DIR = path.join(ROOT, "public", "models", MODEL, "resolve", "main");
const HOSTS = ["https://hf-mirror.com", "https://huggingface.co"];
const FILES = [
  "config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "special_tokens_map.json",
  "onnx/model_quantized.onnx",
];
const FORCE = process.argv.includes("--force");

function human(n) {
  return n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + "MB" : (n / 1024).toFixed(1) + "KB";
}

async function download(host, rel) {
  const url = `${host}/${MODEL}/resolve/main/${rel}`;
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("空响应");
  const dest = path.join(OUT_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;
  let skipped = 0;
  for (const rel of FILES) {
    const dest = path.join(OUT_DIR, rel);
    if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`[skip] ${rel.padEnd(28)} ${human(fs.statSync(dest).size)}`);
      skipped++;
      ok++;
      continue;
    }
    let lastErr = "";
    let done = false;
    for (const host of HOSTS) {
      try {
        const size = await download(host, rel);
        console.log(`[ok]   ${rel.padEnd(28)} ${human(size)}  ← ${host.replace(/^https?:\/\//, "")}`);
        ok++;
        done = true;
        break;
      } catch (e) {
        lastErr = `${host.replace(/^https?:\/\//, "")}: ${e.message}`;
      }
    }
    if (!done) console.error(`[fail] ${rel.padEnd(28)} ${lastErr}`);
  }
  const total = fs.readdirSync(OUT_DIR, { recursive: true })
    .map(f => path.join(OUT_DIR, String(f)))
    .filter(f => fs.statSync(f).isFile())
    .reduce((s, f) => s + fs.statSync(f).size, 0);
  console.log(`\n模型目录：public/models/（${ok}/${FILES.length} 个文件，合计 ${human(total)}，跳过 ${skipped} 个已存在）`);
  if (ok !== FILES.length) process.exit(1);
})();
