/* ============================================================
 * calibrate-scoring.js —— 评分引擎校准脚本（前端引擎，对拍用）
 *   用 backend/scripts/calibration-cases.json 的同一批标准样本，
 *   在 jsdom 中加载演示页，调用前端 scoreSession()，
 *   输出与 calibrate_scoring.py 相同结构的校准表。
 *   两个引擎公式逐项一致（含 clamp/系数/词典），对拍通过即证明
 *   「前端本地引擎」与「服务端引擎」评分一致。
 *
 *   用法：
 *     node scripts/calibrate-scoring.js                      # 打印前端校准表
 *     node scripts/calibrate-scoring.js --diff <py.json>     # 与后端 JSON 对拍
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.resolve(__dirname, "..");
const cases = JSON.parse(
  fs.readFileSync(path.join(ROOT, "backend", "scripts", "calibration-cases.json"), "utf8")
).cases;

const vc = new VirtualConsole();
const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "public", "futuremirror-demo.html"), "utf8"), {
  url: "https://example.com/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const w = dom.window;
w.eval(`window.matchMedia = q => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });`);

const results = [];
for (const c of cases) {
  const m = c.match || null;
  w.eval(`
    session.turns = ${JSON.stringify(c.turns)};
    session.codeScore = ${m && typeof m.code_score === "number" ? m.code_score : "null"};
    matchResult = ${m ? JSON.stringify({ matchScore: m.match_score, gaps: m.match_gaps }) : "null"};
  `);
  const dims = w.eval(`JSON.stringify(scoreSession())`);
  const parsed = JSON.parse(dims);
  const total = Math.round(parsed.reduce((s, d) => s + d.score, 0) / parsed.length);
  results.push({ id: c.id, name: c.name, total, dims: parsed });
  if (!process.argv.includes("--diff")) {
    const line = parsed.map(d => `${d.dimension} ${d.score}`).join(" | ");
    console.log(`${c.id} ${c.name}`);
    console.log(`   总分 ${total} ｜ ${line}`);
  }
}

const diffIdx = process.argv.indexOf("--diff");
if (diffIdx > -1 && process.argv[diffIdx + 1]) {
  const py = JSON.parse(fs.readFileSync(process.argv[diffIdx + 1], "utf8"));
  let bad = 0;
  for (let i = 0; i < results.length; i++) {
    const a = results[i], b = py[i];
    const aTotal = a.total, bTotal = b.total;
    const aDims = a.dims.map(d => d.score).join(",");
    const bDims = b.dims.map(d => d.score).join(",");
    if (aTotal !== bTotal || aDims !== bDims) {
      bad++;
      console.log(`❌ ${a.id} 不一致：前端 total=${aTotal} dims=[${aDims}] ｜ 后端 total=${bTotal} dims=[${bDims}]`);
    } else {
      console.log(`✅ ${a.id} 双引擎一致：total=${aTotal} dims=[${aDims}]`);
    }
  }
  console.log(bad === 0 ? "\n对拍结果：5/5 完全一致（前端引擎 ≡ 服务端引擎）" : `\n对拍结果：${bad} 个样本不一致`);
  process.exit(bad === 0 ? 0 : 1);
}
