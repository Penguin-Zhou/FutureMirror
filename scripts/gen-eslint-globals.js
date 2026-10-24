#!/usr/bin/env node
/**
 * gen-eslint-globals.js —— 生成 frontend/js 的共享全局符号表
 *
 * 背景：`frontend/js/**` 的模块由 scripts/split-frontend.js 反合并进单文件演示版，
 * **所有模块共享同一个全局作用域**，跨文件直接引用顶层函数/常量。ESLint 按模块
 * 边界判定 `no-undef`，会把这些合法引用误报为未定义。
 *
 * 做法：扫描每个模块的顶层声明（function / const / let / var / class），
 * 汇总成 `frontend/eslint-globals.json`，由 eslint.config.js 作为 globals 注入。
 * 这样 `no-undef` 依然有效——真正的拼写错误不会出现在任何声明里，仍会被报出。
 *
 * 用法：node scripts/gen-eslint-globals.js         生成
 *      node scripts/gen-eslint-globals.js --check 只校验是否过期（CI 用）
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "frontend", "js");
const OUT = path.join(ROOT, "frontend", "eslint-globals.json");

/* 顶层声明：行首（可含缩进 0）的 function/const/let/var/class。
 * 优先匹配「声明符 + 初始化器」，避免因箭头函数里含逗号而漏掉 `$`、`llm` 这类短名。 */
const RE_FUNC = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm;
const RE_DECL_INIT = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm;
const RE_DECL_BARE = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*;/gm;
const RE_CLASS = /^class\s+([A-Za-z_$][\w$]*)/gm;

/* 以 window.xxx = ... 形式挂载、但被其他模块直接裸引用的符号 */
const EXTRA_READONLY = [
  "CONFIG",
  "APP_PAGES",
  "ROUTES",
  "KB",
  "QUESTIONS",
  "AGENTS",
  "SKILL_DICT",
  "bpSkeleton",
  "__bpSkeleton",
  "__bpFx",
  "__bpMotion",
  "__bpViz",
  "__bpCmd",
  "__bpScroll",
  "__bpLanding",
  "__bpApp",
  "bpMedia",
];

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out.sort();
}

function collect() {
  const names = new Set();
  for (const file of listFiles(SRC_DIR)) {
    const code = fs.readFileSync(file, "utf8");
    for (const re of [RE_FUNC, RE_CLASS, RE_DECL_INIT, RE_DECL_BARE]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(code))) names.add(m[1]);
    }
  }
  for (const n of EXTRA_READONLY) names.add(n);

  const obj = {};
  for (const n of [...names].sort()) obj[n] = "writable";
  return obj;
}

const table = collect();
const text = JSON.stringify(table, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (prev !== text) {
    console.error("❌ frontend/eslint-globals.json 已过期，请运行：node scripts/gen-eslint-globals.js");
    process.exit(1);
  }
  console.log(`✅ 全局符号表已是最新（${Object.keys(table).length} 个符号）`);
  process.exit(0);
}

fs.writeFileSync(OUT, text, "utf8");
console.log(`✅ 已生成 frontend/eslint-globals.json（${Object.keys(table).length} 个共享符号）`);
