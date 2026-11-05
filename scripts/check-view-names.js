/* 视图名静态守卫：showView() 只认顶层视图，误传应用内 tab 名会整页空白。
 *
 * v72 的病根就这一句：viz.js 写 showView('plan')——plan 是应用内 tab，
 * 不存在 #view-plan，四个 .view 全部失活，观感是「点了没反应、页面空白」。
 * router.js 现在会拒绝非法名，但那是运行时兜底，站在用户面前才报警。
 * 这里把调用点在提交前扫一遍，白名单直接读 router.js 的 VIEW_NAMES，不另写一份。
 *
 * 判定的三种实参：
 *   ① 字符串字面量      → 必须命中白名单
 *   ② 三元表达式        → 两个分支都得是合法字面量（reveal.js 的恢复视图就是这么写的）
 *   ③ 其他（变量/拼接） → 不猜，报出来让人看一眼
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUTER = path.join(ROOT, "frontend", "js", "core", "router.js");
const INDEX = path.join(ROOT, "frontend", "index.html");
const SCAN_DIR = path.join(ROOT, "frontend");
const SKIP_DIRS = new Set(["node_modules", ".git", "public"]);

let fail = 0;
const errors = [];

/* 白名单唯一来源：router.js 的 VIEW_NAMES */
function readWhitelist() {
  const src = fs.readFileSync(ROUTER, "utf8");
  const m = src.match(/const\s+VIEW_NAMES\s*=\s*\[([\s\S]*?)\]/);
  if (!m) throw new Error("router.js 里找不到 VIEW_NAMES 数组，守卫无法判定");
  return (m[1].match(/["'`]([^"'`]+)["'`]/g) || []).map((s) => s.slice(1, -1));
}

/* 注释抹成等长空白——保留字符偏移，行号才对得上。
 * HTML 里只在 <script> / <style> 内部认 JS 式注释：标记文本里出现 "/*" 太正常了
 * （技术架构那张卡写着 FastAPI /api/*），若按 JS 处理会吞掉半个文档，
 * 后面的调用点全部静默漏检——比报错更糟。 */
function stripComments(src, isHtml) {
  const out = src.split("");
  const n = src.length;
  let i = 0;
  let quote = null;
  let code = !isHtml;
  const blank = (from, to) => {
    for (let k = from; k < Math.min(n, to); k++) if (out[k] !== "\n") out[k] = " ";
  };
  while (i < n) {
    if (!quote && isHtml) {
      if (!code && src.startsWith("<!--", i)) {
        const end = src.indexOf("-->", i + 4);
        const stop = end === -1 ? n : end + 3;
        blank(i, stop);
        i = stop;
        continue;
      }
      if (src.startsWith("<script", i) || src.startsWith("<style", i)) {
        code = true;
        i += 7;
        continue;
      }
      if (code && (src.startsWith("</script", i) || src.startsWith("</style", i))) {
        code = false;
        i += 8;
        continue;
      }
    }
    const c = src[i];
    const d = src[i + 1];
    if (quote) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      i++;
      continue;
    }
    if (code && c === "/" && d === "*") {
      let j = i + 2;
      while (j < n && !(src[j] === "*" && src[j + 1] === "/")) j++;
      blank(i, j + 2);
      i = j + 2;
      continue;
    }
    if (code && c === "/" && d === "/") {
      let j = i;
      while (j < n && src[j] !== "\n") j++;
      blank(i, j);
      i = j;
      continue;
    }
    i++;
  }
  return out.join("");
}

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, acc);
    } else if (/\.(js|html)$/.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

/* 从 '(' 起找配对的 ')' —— 串里的括号不算 */
function argAt(src, openIdx) {
  let depth = 0;
  let quote = null;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return { text: src.slice(openIdx + 1, i), end: i };
    }
  }
  return null;
}

/* 顶层三元：按不进入括号的 '?' 与 ':' 切开 */
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let cut = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (depth === 0 && (c === "?" || c === ":")) {
      parts.push(text.slice(cut + 1, i));
      cut = i;
    }
  }
  parts.push(text.slice(cut + 1));
  return parts.map((s) => s.trim());
}

const LITERAL = /^(["'`])([^"'`]*)\1$/;

function checkArg(raw, file, line) {
  const text = raw.trim();
  if (!text) {
    errors.push(`${file}:${line}  showView() 没传实参`);
    return null;
  }
  const lit = text.match(LITERAL);
  if (lit) return { name: lit[2], file, line };

  if (text.includes("?")) {
    const parts = splitTopLevel(text);
    if (parts.length === 3) {
      const branches = parts.slice(1).map((p) => p.match(LITERAL));
      if (branches.every(Boolean)) {
        return branches.map((b) => ({ name: b[2], file, line }));
      }
    }
  }
  errors.push(
    `${file}:${line}  showView(${text}) 无法静态判定——动态视图名正是白屏的温床，` +
      `请写成字面量或三元字面量；确需动态，就在调用处先把名字收进白名单再传`
  );
  return null;
}

(function main() {
  const whitelist = readWhitelist();
  console.log("顶层视图白名单（router.js VIEW_NAMES）:", whitelist.join(" / "));

  /* 白名单与 index.html 的 #view-* 必须一一对应：两边任何一侧多写都是隐患 */
  const html = fs.readFileSync(INDEX, "utf8");
  const ids = [...html.matchAll(/id="view-([A-Za-z0-9_-]+)"/g)].map((m) => m[1]);
  console.log("实际存在的视图容器（index.html）:", ids.map((i) => "view-" + i).join(" / "));
  ids
    .filter((i) => !whitelist.includes(i))
    .forEach((i) => {
      errors.push(`index.html 存在 #view-${i}，但 router.js 白名单里没有它——showView('${i}') 会被拒绝`);
    });
  whitelist
    .filter((w) => !ids.includes(w))
    .forEach((w) => {
      errors.push(`router.js 白名单允许 "${w}"，但 index.html 没有 #view-${w}——切过去就是全页空白`);
    });

  const files = walk(SCAN_DIR, []);
  const calls = [];
  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const src = stripComments(raw, file.endsWith(".html"));
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const re = /\bshowView\s*\(/g;
    let m;
    while ((m = re.exec(src))) {
      const before = src.slice(Math.max(0, m.index - 30), m.index);
      /* 声明与包装器不是调用：function showView(name) / showView = function (name) */
      if (/function\s+$/.test(before)) continue;
      if (/showView\s*=\s*$/.test(before)) continue;
      const arg = argAt(src, m.index + m[0].length - 1);
      if (!arg) continue;
      const line = src.slice(0, m.index).split("\n").length;
      const r = checkArg(arg.text, rel, line);
      if (!r) continue;
      (Array.isArray(r) ? r : [r]).forEach((c) => calls.push(c));
    }
  }

  console.log("showView 调用点:", calls.length);
  const tally = {};
  for (const c of calls) {
    tally[c.name] = (tally[c.name] || 0) + 1;
    if (!whitelist.includes(c.name)) {
      errors.push(
        `${c.file}:${c.line}  showView("${c.name}") —— "${c.name}" 不是顶层视图名${c.name === "plan" || c.name === "report" || c.name === "dashboard" ? "（应用内 tab 请走 navTo / switchTab）" : ""}`
      );
    }
  }
  console.log(
    "按视图名:",
    Object.keys(tally)
      .sort()
      .map((k) => `${k} ${tally[k]}`)
      .join(" · ")
  );

  if (errors.length) {
    errors.forEach((e) => console.error("✗ " + e));
    console.error(`视图名守卫：${errors.length} 处问题`);
    fail = 1;
  } else {
    console.log("视图名守卫：全部调用点均为顶层视图名");
  }
  process.exit(fail);
})();
