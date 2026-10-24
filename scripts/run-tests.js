#!/usr/bin/env node
"use strict";
/* ============================================================
 * 全量测试入口：一次跑完所有 jsdom / 逻辑 / 模块套件并汇总。
 *
 * 此前 18 套测试只能逐个手敲，CI 与人工核验都容易漏跑；
 * 这里统一收口为 `npm run test:all`，任何一套失败即整体失败。
 *
 * 用法：
 *   node scripts/run-tests.js            全量
 *   node scripts/run-tests.js v29 v30    只跑名字含 v29 / v30 的套件
 * ============================================================ */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DIR = __dirname;
const SUITES = fs
  .readdirSync(DIR)
  .filter((f) => /^test-.*\.js$/.test(f))
  .sort();

const filters = process.argv.slice(2);
const picked = filters.length ? SUITES.filter((f) => filters.some((k) => f.includes(k))) : SUITES;

if (!picked.length) {
  console.error("没有匹配的测试套件：" + filters.join(", "));
  process.exit(1);
}

let totalPass = 0,
  totalFail = 0,
  failedSuites = [];
const rows = [];

for (const file of picked) {
  const r = spawnSync(process.execPath, [path.join(DIR, file)], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const out = (r.stdout || "") + (r.stderr || "");
  /* 各套件收尾行有两种写法：「结果：217 通过，0 失败」与「结果：73 通过 / 0 失败」，
   * 都在这里匹配；个别套件没有收尾行时退化为数 ✅ 的行数。 */
  const m = out.match(/(\d+)\s*通过\s*[，,/\uFF5C|]?\s*(\d+)\s*失败/);
  const ticks = (out.match(/✅/g) || []).length;
  const pass = m ? Number(m[1]) : ticks;
  const fail = m ? Number(m[2]) : r.status === 0 ? 0 : 1;
  totalPass += pass;
  totalFail += fail;
  rows.push({ file, pass, fail, ok: r.status === 0 && fail === 0 });
  if (!(r.status === 0 && fail === 0)) {
    failedSuites.push(file);
    console.error("\n----- " + file + " 失败输出 -----");
    console.error(
      out
        .split("\n")
        .filter((l) => /❌|Error|错误|assert/i.test(l))
        .slice(0, 12)
        .join("\n")
    );
  }
}

const W = 40;
console.log("\n" + "=".repeat(58));
console.log("套件".padEnd(W, " ") + "通过    失败");
console.log("-".repeat(58));
for (const r of rows) {
  console.log(
    (r.ok ? "  " : "× ") + r.file.padEnd(W - 2, " ") + String(r.pass).padStart(5) + String(r.fail).padStart(8)
  );
}
console.log("-".repeat(58));
console.log(
  ("合计 " + rows.length + " 套").padEnd(W, " ") + String(totalPass).padStart(5) + String(totalFail).padStart(8)
);
console.log("=".repeat(58));

if (failedSuites.length) {
  console.error("\n❌ 失败套件：" + failedSuites.join(", "));
  process.exit(1);
}
console.log("\n✅ 全部通过：" + totalPass + " 项断言 / " + rows.length + " 套");
