/* ============================================================
 * fetch-title-font.js —— 重新生成主标语的字体子集
 * ------------------------------------------------------------
 * 主标语用两款自托管字体，都只含这句话用到的字，base64 内联在 tokens.css 里：
 *
 *   FM Serif Poster  思源宋体（Noto Serif SC）可变子集  主行「可量化的成长。」
 *   FM Kai           霞鹜文楷（LXGW WenKai）子集        引子行「让每一次面试，都成为」
 *
 * 改过标语文案就必须重跑一次，否则新字会回落到系统字体，
 * 出现「一半自托管、一半系统」的混排（test-v56 有守卫会拦住）。
 *
 *   node scripts/fetch-title-font.js            # 按当前文案取子集并写回
 *   node scripts/fetch-title-font.js --check    # 只核对，不写文件
 *
 * 依赖 Google Fonts 的 text= 子集接口，需要能访问 fonts.googleapis.com。
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TOKENS = path.join(ROOT, "frontend", "css", "tokens.css");
const INDEX = path.join(ROOT, "frontend", "index.html");

/* UA 不带的话接口只给 ttf；带上才给 woff2 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const FACES = [
  {
    fontName: "FM Serif Poster",
    family: "Noto Serif SC",
    /* 声明成 200 900 区间：这是可变字体，一个文件覆盖全部字重 */
    cssWeight: "200 900",
    request: "wght@400;700",
    note: "思源宋体（可变）",
  },
  {
    fontName: "FM Kai",
    family: "LXGW WenKai TC",
    cssWeight: "400",
    request: "wght@400",
    note: "霞鹜文楷",
  },
];

/* 从 index.html 里读标语原文——不去抄一份常量，避免两处不一致 */
function readSlogan() {
  const html = fs.readFileSync(INDEX, "utf8");
  const m = html.match(/<h1 class="hero-title">([\s\S]*?)<\/h1>/);
  if (!m) throw new Error("index.html 里找不到 .hero-title");
  return m[1]
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/* 字体只需要「出现过的字」，去重后按码位排序，注释里写清楚是哪几个 */
function charsOf(slogan) {
  return [...new Set([...slogan])].sort();
}

async function fetchSubset(face, slogan) {
  const api =
    "https://fonts.googleapis.com/css2?family=" +
    encodeURIComponent(face.family) +
    ":" +
    face.request +
    "&display=swap&text=" +
    encodeURIComponent(slogan);

  const cssRes = await fetch(api, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(30000),
  });
  if (!cssRes.ok) throw new Error(face.family + " 取子集声明失败 HTTP " + cssRes.status);
  const css = await cssRes.text();

  /* 子集接口给的是 fonts.gstatic.com/l/font?kit=… 这种不带扩展名的地址，
   * 格式靠后面紧跟的 format('woff2') 标注，不能拿 .woff2 后缀去匹配 */
  const m = css.match(/url\((https:\/\/[^)\s]+)\)\s*format\(['"]woff2['"]\)/);
  if (!m) throw new Error(face.family + " 的子集声明里没有 woff2 地址：\n" + css.slice(0, 300));

  const fontRes = await fetch(m[1], { signal: AbortSignal.timeout(60000) });
  if (!fontRes.ok) throw new Error(face.family + " 下载字体失败 HTTP " + fontRes.status);
  const buf = Buffer.from(await fontRes.arrayBuffer());
  if (buf.slice(0, 4).toString("latin1") !== "wOF2") throw new Error(face.family + " 下载到的不是 woff2");
  return buf;
}

function inlinePattern(fontName) {
  return new RegExp(
    '(@font-face \\{\\s*font-family: "' + fontName + '";\\s*src: url\\(data:font\\/woff2;base64,)([A-Za-z0-9+/=]+)(\\))'
  );
}

async function main() {
  const check = process.argv.includes("--check");
  const slogan = readSlogan();
  const chars = charsOf(slogan);
  if (!chars.length) throw new Error("标语为空");

  console.log("标语：" + slogan + "（" + chars.length + " 个不同字符）");

  let tokens = fs.readFileSync(TOKENS, "utf8");
  let dirty = false;
  const stale = [];

  for (const face of FACES) {
    console.log("取子集：" + face.note + " · " + face.family);
    const buf = await fetchSubset(face, slogan);
    const b64 = buf.toString("base64");
    console.log(
      "  " +
        face.fontName +
        "：" +
        Math.round(buf.length / 1024) +
        " KB（base64 " +
        Math.round(b64.length / 1024) +
        " KB）"
    );

    const re = inlinePattern(face.fontName);
    const found = tokens.match(re);
    if (!found) throw new Error("tokens.css 里找不到 " + face.fontName + " 的内联块");

    if (found[2] === b64) continue;
    stale.push(face.fontName);
    tokens = tokens.replace(re, "$1" + b64 + "$3");
    dirty = true;
  }

  if (check) {
    if (stale.length) {
      console.log("⚠️ 子集与当前文案不一致：" + stale.join("、") + "，请重跑（去掉 --check）");
      process.exit(1);
    }
    console.log("✅ 两款子集都与当前文案一致，无需更新");
    return;
  }
  if (!dirty) {
    console.log("✅ 子集已是最新，文件未改动");
    return;
  }

  /* 注释里的字符清单也跟着文案走，免得读到过期的说明 */
  tokens = tokens.replace(
    /(^ \* 只含标语用到的 )\d+( 个不同字符（「)[^」]*(」）)/m,
    "$1" + chars.length + "$2" + slogan + "$3"
  );
  fs.writeFileSync(TOKENS, tokens);
  console.log("✅ 已写回 frontend/css/tokens.css（" + stale.join("、") + "，" + chars.length + " 个字符）");
  console.log("   接着跑：node scripts/build-demo.js && node scripts/test-v56-jsdom.js");
}

main().catch((e) => {
  console.error("❌ " + e.message);
  process.exit(1);
});
