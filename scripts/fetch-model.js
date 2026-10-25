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
const ORT_DIR = path.join(ROOT, "public", "models", "ort");
const HOSTS = ["https://hf-mirror.com", "https://huggingface.co"];
const FILES = [
  "config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "special_tokens_map.json",
  "onnx/model_quantized.onnx",
];
/* ONNX Runtime 的 wasm 运行时同样自托管：否则要从 CDN 再拉 10MB，遇到网络抖动会
   报「no available backend found. ERR: [wasm] TypeError: Failed to fetch」 */
const ORT_BASE = "https://fastly.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist";
const ORT_FILES = ["ort-wasm-simd.wasm", "ort-wasm.wasm"];
const FORCE = process.argv.includes("--force");

/* 人脸检测（v33 摄像头状态监测）：face-api.js 库 + tinyFaceDetector 权重，同源自托管。
 * 注意：npm 包 face-api.js 不含 weights/ 目录（该路径 404），权重必须取自 GitHub 仓库。 */
const FACEAPI_DIR = path.join(ROOT, "public", "models", "faceapi");
const FACEAPI_FILES = [
  {
    rel: "face-api.min.js",
    urls: [
      "https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js",
      "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js",
    ],
  },
  {
    rel: "weights/tiny_face_detector_model-weights_manifest.json",
    urls: [
      "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json",
    ],
  },
  {
    rel: "weights/tiny_face_detector_model-shard1",
    urls: [
      "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1",
    ],
  },
];

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

/* ONNX Runtime 运行时：直接取 CDN 上的静态文件，落到 public/models/ort/ */
async function downloadOrt(name) {
  const res = await fetch(`${ORT_BASE}/${name}`, { signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(ORT_DIR, name);
  fs.mkdirSync(ORT_DIR, { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

/* 通用：按给定 URL 依次尝试下载到 dest（人脸检测资源用） */
async function downloadUrl(url, dest) {
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("空响应");
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
  /* ONNX Runtime wasm 运行时（同源托管） */
  for (const name of ORT_FILES) {
    const dest = path.join(ORT_DIR, name);
    if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`[skip] ort/${name.padEnd(24)} ${human(fs.statSync(dest).size)}`);
      skipped++;
      ok++;
      continue;
    }
    try {
      const size = await downloadOrt(name);
      console.log(`[ok]   ort/${name.padEnd(24)} ${human(size)}  ← fastly.jsdelivr.net`);
      ok++;
    } catch (e) {
      console.error(`[fail] ort/${name.padEnd(24)} ${e.message}`);
    }
  }

  /* 人脸检测资源（face-api.js 库 + tinyFaceDetector 权重，同源托管） */
  for (const item of FACEAPI_FILES) {
    const dest = path.join(FACEAPI_DIR, item.rel);
    if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`[skip] faceapi/${item.rel.padEnd(48)} ${human(fs.statSync(dest).size)}`);
      skipped++;
      ok++;
      continue;
    }
    let lastErr = "";
    let done = false;
    for (const url of item.urls) {
      try {
        const size = await downloadUrl(url, dest);
        console.log(`[ok]   faceapi/${item.rel.padEnd(48)} ${human(size)}`);
        ok++;
        done = true;
        break;
      } catch (e) {
        lastErr = e.message;
      }
    }
    if (!done) console.error(`[fail] faceapi/${item.rel.padEnd(48)} ${lastErr}`);
  }

  const walk = (d) =>
    fs
      .readdirSync(d, { withFileTypes: true })
      .reduce((s, e) => s + (e.isDirectory() ? walk(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
  const total = walk(path.join(ROOT, "public", "models"));
  const totalN = FILES.length + ORT_FILES.length + FACEAPI_FILES.length;
  console.log(`\n模型目录：public/models/（${ok}/${totalN} 个文件，合计 ${human(total)}，跳过 ${skipped} 个已存在）`);
  if (ok !== totalN) process.exit(1);
})();
