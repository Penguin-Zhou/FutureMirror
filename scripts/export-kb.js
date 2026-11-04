#!/usr/bin/env node
"use strict";
/* ============================================================
 * v67 · 知识库导出：frontend/js/data/kb.js → backend/app/kb_data.json
 *
 * 为什么要有这一步：
 *   小助手改走后端检索后，服务端也得有一份知识条目。两份手抄迟早
 *   对不上——改了一条忘了另一条，用户就会在后端得到「查不到」的回答。
 *   所以前端那份仍然是唯一数据源，这里是它的构建产物：
 *     node scripts/export-kb.js           写入 JSON
 *     node scripts/export-kb.js --check   只比对，不一致退出 1（进 verify）
 *
 * 为什么不直接 require：kb.js 是浏览器脚本（顶层 const + 依赖 document），
 * 在 Node 里 require 会直接抛错。用 vm 沙箱只执行 KB 数组那一段字面量。
 * ============================================================ */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "frontend", "js", "data", "kb.js");
const OUT = path.join(ROOT, "backend", "app", "kb_data.json");

/* KB 在源码里是分两段拼起来的：先 `const KB = [ 8 条 ];`，
 * 后面再用 `KB.push( 34 条 )` 补到 42（v10 扩充那一段）。
 * 只取第一段会静默导出 8 条——后端于是对绝大多数问题都「查不到」，
 * 而且 check 模式也会通过（两边都是 8 条），所以这里必须把 push 一并执行。
 * 条目都写成单行、数组以行首 `];` 收尾、push 以行首 `);` 收尾，用这些特征切。 */
function extractEntries(source) {
  const start = source.indexOf("const KB = [");
  if (start < 0) throw new Error("kb.js 里找不到 `const KB = [`，导出中止");
  const end = source.indexOf("\n];", start);
  if (end < 0) throw new Error("kb.js 里找不到 KB 数组的结束标记 `];`，导出中止");

  let literal = "globalThis.__KB = " + source.slice(start + "const KB = ".length, end + 3);

  let idx = 0;
  let pushes = 0;
  while ((idx = source.indexOf("\nKB.push(", idx)) >= 0) {
    const close = source.indexOf("\n);", idx);
    if (close < 0) throw new Error("KB.push 缺少结束标记 `);`，导出中止");
    /* slice 起点在 `KB.push` 的 `(` 之后、终点含收尾的 `)` */
    literal += "\n__KB.push(" + source.slice(idx + "\nKB.push(".length, close + 2) + ";";
    idx = close + 3;
    pushes++;
  }
  if (!pushes) throw new Error("没有找到 KB.push 段，知识库可能只导出了初始 8 条，导出中止");

  const sandbox = {};
  vm.runInNewContext(literal, sandbox, { timeout: 3000 });
  const entries = sandbox.__KB;
  if (!Array.isArray(entries) || !entries.length) throw new Error("KB 解析结果为空，导出中止");
  return entries;
}

/* 字段顺序固定，便于 diff；缺字段直接报错而不是静默写 null——
 * 后端拼 prompt 时依赖这四个字段，缺一个就会在线上答非所问。 */
function normalize(entries) {
  return entries.map((e, i) => {
    for (const k of ["title", "source", "content"]) {
      if (typeof e[k] !== "string" || !e[k].trim()) {
        throw new Error(`第 ${i + 1} 条缺少 ${k}，导出中止`);
      }
    }
    const tags = Array.isArray(e.tags) ? e.tags.filter((t) => typeof t === "string" && t.trim()) : [];
    return { title: e.title.trim(), source: e.source.trim(), tags, content: e.content.trim() };
  });
}

function build() {
  const entries = normalize(extractEntries(fs.readFileSync(SRC, "utf8")));
  return {
    version: 1,
    generated_from: "frontend/js/data/kb.js",
    count: entries.length,
    entries,
  };
}

function main() {
  const check = process.argv.includes("--check");
  const data = build();
  const text = JSON.stringify(data, null, 1) + "\n";

  if (check) {
    let current = "";
    try {
      current = fs.readFileSync(OUT, "utf8");
    } catch (e) {
      console.error("✗ backend/app/kb_data.json 不存在，请先运行 node scripts/export-kb.js");
      process.exit(1);
    }
    if (current !== text) {
      /* 只报条数与首个差异，不整份打印——几百行 diff 在 CI 日志里没人看 */
      const a = (() => {
        try {
          return JSON.parse(current);
        } catch (e) {
          return null;
        }
      })();
      const head = !a ? "当前文件不是合法 JSON" : `当前 ${a.count} 条 → 期望 ${data.count} 条`;
      console.error("✗ 后端知识库与前端 kb.js 不一致：" + head);
      console.error("  运行 node scripts/export-kb.js 重新导出后再提交");
      process.exit(1);
    }
    console.log(`✓ 后端知识库与 kb.js 一致（${data.count} 条）`);
    return;
  }

  fs.writeFileSync(OUT, text);
  console.log(`✓ 已导出 ${data.count} 条知识库 → ${path.relative(ROOT, OUT)}（${Buffer.byteLength(text)} B）`);
}

main();
