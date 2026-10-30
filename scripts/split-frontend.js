/* ============================================================
 * split-frontend.js —— 把单文件演示版拆分为 frontend/ 模块结构
 *   输入：public/futuremirror-demo.html（单文件版）
 *   输出：frontend/index.html + css/{tokens,theme,pages}.css
 *                          + js/{core,data,features,dev}/... + INDEX.js
 *   原则：内容逐行原样搬运（含注释与空行），逻辑零改动；
 *        区划边界由「版本横幅标题」自动探测（不写死行号）。
 *   加载顺序与原区划顺序唯一差异：主题色变体（§10）提到滚动渐入
 *   （v17）之前——init() 在加载期调用 syncAccentBtn，跨文件无函数提升。
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEMO = path.join(ROOT, "public", "futuremirror-demo.html");
const OUT = path.join(ROOT, "frontend");

const text = fs.readFileSync(DEMO, "utf8");
const lines = text.split("\n");
const at = (n) => lines[n - 1];

/* ---------- 1. 骨架锚点 ---------- */
function findLine(needle, from) {
  for (let i = from || 1; i <= lines.length; i++) if (at(i).includes(needle)) return i;
  return -1;
}
const assertAt = (n, needle, what) => {
  if (!at(n) || !at(n).includes(needle)) {
    console.error(
      `❌ 锚点漂移 ${what}: 第 ${n} 行应含 "${needle}"，实际 ${JSON.stringify((at(n) || "").slice(0, 80))}`
    );
    process.exit(1);
  }
};

const STYLE_OPEN = findLine("<style>");
const STYLE_CLOSE = findLine("</style>");
const SCRIPT_OPEN = findLine("<script>", STYLE_CLOSE); // 主脚本（head 之后）
const SCRIPT_CLOSE = lines.findIndex((l, i) => i + 1 > SCRIPT_OPEN && l.trim() === "</script>") + 1;
assertAt(STYLE_OPEN, "<style>", "样式块");
assertAt(STYLE_CLOSE, "</style>", "样式块结束");
assertAt(SCRIPT_OPEN, "<script>", "主脚本");
assertAt(SCRIPT_CLOSE, "</script>", "主脚本结束");
assertAt(SCRIPT_OPEN + 1, '"use strict";', "严格模式指令");

/* ---------- 2. 横幅边界探测 ---------- */
const isSep = (l) => /^\s*\/\* ={10,}\s*$/.test(l);
/* 标题行 → 区划起点（含上方分隔线；单行横幅取自身） */
function bannerStart(titleNeedle, from, to) {
  const t = findLine(titleNeedle, from);
  if (t < 0 || t > to) {
    console.error(`❌ 未找到横幅: ${titleNeedle}`);
    process.exit(1);
  }
  return isSep(at(t - 1)) ? t - 1 : t;
}

/* ---------- 3. CSS 三层 ---------- */
const cssRules = [
  ["css/tokens.css", "基础令牌层（v1–v16：主题变量 / 暗色 / 组件增量）", ["v13 · 开发者模式（加密视图）"]],
  ["css/theme.css", "v21 蓝图编辑风视觉重构层", ["v21 · 蓝图编辑风"]],
  [
    "css/pages.css",
    "功能页面层（v18–v22：求职 / 题库 / 小助手 / 移动端 / API）",
    ["v18 · 求职管理", "v19 · 题库与小测模块", "v20 · 题库增强", "v21 · AI 悬浮球", "v22 · 后端适配层"],
  ],
];
const cssStarts = cssRules.map((r) => Math.min(...r[2].map((t) => bannerStart(t, STYLE_OPEN + 1, STYLE_CLOSE))));
const CSS_LAYERS = [];
{
  let cursor = STYLE_OPEN + 1;
  for (let g = 0; g < cssRules.length; g++) {
    const start = Math.min(cursor, cssStarts[g]);
    const next = g + 1 < cssRules.length ? cssStarts[g + 1] : STYLE_CLOSE;
    CSS_LAYERS.push({ file: cssRules[g][0], start, end: next - 1, note: cssRules[g][1] });
    cursor = next;
  }
}

/* ---------- 4. JS 模块（标题 → 文件；相邻同文件区划自动合并） ---------- */
const jsRules = [
  ["js/data/config.js", "§0 项目材料配置", ["0. 项目材料配置"]],
  ["js/core/router.js", "§0.5 视图路由 + §0.6 应用内子路由", ["0.5 视图路由系统", "0.6 应用内子路由"]],
  ["js/INDEX.js", "模块索引（注释）", ["模块索引（单文件工程"]],
  ["js/core/store.js", "§1 全局状态 & 工具", ["1. 全局状态"]],
  ["js/core/auth.js", "§2 用户系统", ["2. 用户系统"]],
  ["js/core/theme.js", "§3 主题", ["3. 主题（"]],
  ["js/core/router-pages.js", "§4 应用内页面路由", ["4. 应用内页面路由"]],
  ["js/features/match.js", "§4 简历匹配", ["4. 简历匹配"]],
  ["js/features/explain.js", "v40 可解释性交互层", ["v40 · 可解释性交互层"]],
  ["js/features/interview.js", "§5 模拟面试（含 QUESTION_BANK）", ["5. 模拟面试"]],
  ["js/data/kb.js", "§6 RAG 面经问答 + v10 知识库", ["6. RAG 面经问答", "v10 · 面经知识库扩充"]],
  ["js/features/report.js", "§7 评估报告", ["7. 评估报告"]],
  ["js/features/prompt-viewer.js", "§7.5 Prompt 查看器 / 导出", ["7.5 Prompt 查看器"]],
  ["js/core/boot.js", "§9 启动流程（bootApp 等声明）", ["9. 启动流程"]],
  ["js/core/reveal.js", "v17 滚动渐入 + init()", ["v17 · 滚动渐入"]],
  ["js/core/particles.js", "v25 蓝图粒子层 + Hero 视差", ["v25 · 蓝图粒子层"]],
  ["js/core/scrollfx.js", "v26 滚动驱动层", ["v26 · 滚动驱动层"]],
  ["js/features/landingfx.js", "v26 落地页动态层", ["v26 · 落地页动态层"]],
  ["js/core/command.js", "v26 命令面板", ["v26 · 命令面板"]],
  ["js/features/appfx.js", "v27 全站交互层", ["v27 · 全站交互层"]],
  ["js/core/theme-variants.js", "§10 主题色变体", ["10. 主题色变体"]],
  ["js/core/roll.js", "§11 数字滚动", ["11. 数据看板数字滚动"]],
  ["js/features/resume.js", "§12 简历优化工作台", ["12. 简历优化工作台"]],
  [
    "js/features/career.js",
    "§13 职业探索 + v10 扩充 + v11 选择器",
    ["13. 职业探索", "v10 · 岗位数据库扩充", "v11 · 目标岗位下拉选择器"],
  ],
  ["js/dev/runtime.js", "v12 可验证运行时三件套", ["v12 · 生产级"]],
  ["js/bootstrap.js", "v10 尾部引导 bootstrapV10", ["v10 · 尾部引导"]],
  ["js/dev/devmode.js", "v13 + v14 开发者模式", ["v13 · 开发者模式", "v14 · 开发者模式"]],
  ["js/features/today.js", "v15 今日推荐", ["v15 · 今日推荐岗位"]],
  ["js/features/profile.js", "v16 个人中心", ["v16 · 个人中心"]],
  ["js/features/jobs.js", "v18 求职闭环", ["v18 · 产品闭环深化"]],
  ["js/features/quiz.js", "v19 题库 + v20 题库增强", ["v19 · 题库与小测模块", "v20 · 题库增强"]],
  ["js/features/plan.js", "v31 学习计划", ["v31 · 学习计划"]],
  ["js/features/icons.js", "v31 全站图标系统", ["v31 · 全站图标系统"]],
  [
    "js/features/assistant.js",
    "v20 AI 小助手 + v21 悬浮球",
    ["⑦ AI 小助手（retrieve + streamChat）", "v21 · AI 悬浮球"],
  ],
  ["js/core/api.js", "v22 后端适配层", ["v22 · 后端适配层"]],
  ["js/core/motion.js", "v29 动效与交互层", ["X. 动效与交互层 v29"]],
  ["js/features/viz.js", "v30 数据可视化与看板组件", ["Y. 数据可视化与看板组件 v30"]],
  ["js/core/skeleton.js", "v30 骨架屏", ["Z1. 骨架屏 v30"]],
  ["js/core/media.js", "v30 媒体懒加载与预览", ["Z2. 媒体加载 v30"]],
  ["js/features/mbti.js", "v36 MBTI 职业性格测评", ["v36 · MBTI 职业性格测评"]],
  ["js/features/persona.js", "v43 人格参数化层", ["v43 · 人格参数化层"]],
  ["js/features/charts.js", "v37 通用图表组件", ["v37 · 通用图表组件"]],
];

/* 收集全部 JS 边界（标题行 → 起点），按出现位置排序 */
const jsBounds = [];
for (const [file, , titles] of jsRules) {
  for (const t of titles) {
    const s = bannerStart(t, SCRIPT_OPEN + 1, SCRIPT_CLOSE);
    jsBounds.push({ start: s, file, title: t });
  }
}
jsBounds.sort((a, b) => a.start - b.start);

/* 生成连续区划并合并同文件 */
const JS_SECTIONS = [];
for (let i = 0; i < jsBounds.length; i++) {
  const b = jsBounds[i];
  const end = i + 1 < jsBounds.length ? jsBounds[i + 1].start - 1 : SCRIPT_CLOSE - 1;
  const prev = JS_SECTIONS[JS_SECTIONS.length - 1];
  if (prev && prev.file === b.file) {
    prev.end = end;
    prev.note += " + " + b.title;
  } else JS_SECTIONS.push({ file: b.file, start: b.start, end, note: jsRules.find((r) => r[0] === b.file)[1] });
}
/* 首个区划向前吸收 "use strict"; 指令行 */
JS_SECTIONS[0].start = SCRIPT_OPEN + 1;

/* 连续性与覆盖率断言 */
{
  let expect = SCRIPT_OPEN + 1;
  for (const s of JS_SECTIONS) {
    if (s.start !== expect) {
      console.error(`❌ JS 区划不连续: ${s.file} 起始 ${s.start}，期望 ${expect}`);
      process.exit(1);
    }
    expect = s.end + 1;
  }
  if (expect !== SCRIPT_CLOSE) {
    console.error(`❌ JS 区划未覆盖到脚本末尾（期望 ${SCRIPT_CLOSE}，实际 ${expect}）`);
    process.exit(1);
  }
}
const EXPECTED_FILES = jsRules.map((r) => r[0]);
if (JS_SECTIONS.length !== EXPECTED_FILES.length || !JS_SECTIONS.every((s, i) => s.file === EXPECTED_FILES[i])) {
  console.error("❌ 模块清单与预期不符：\n  实际: " + JS_SECTIONS.map((s) => s.file).join("\n        "));
  process.exit(1);
}

/* ---------- 5. 加载顺序（index.html script 顺序） ---------- */
/* 与原顺序唯一差异：theme-variants 提前到 reveal 之前（init() 加载期调用 syncAccentBtn） */
const LOAD_ORDER = [
  "js/data/config.js",
  "js/core/router.js",
  "js/INDEX.js",
  "js/core/store.js",
  "js/core/auth.js",
  "js/core/theme.js",
  "js/core/router-pages.js",
  "js/features/match.js",
  "js/features/explain.js",
  "js/features/interview.js",
  "js/data/kb.js",
  "js/features/report.js",
  "js/features/prompt-viewer.js",
  "js/core/boot.js",
  "js/core/theme-variants.js",
  "js/core/reveal.js",
  "js/core/particles.js",
  "js/core/scrollfx.js",
  "js/features/landingfx.js",
  "js/core/command.js",
  "js/features/appfx.js",
  "js/core/roll.js",
  "js/features/resume.js",
  "js/features/career.js",
  "js/dev/runtime.js",
  "js/bootstrap.js",
  "js/dev/devmode.js",
  "js/features/today.js",
  "js/features/profile.js",
  "js/features/jobs.js",
  "js/features/quiz.js",
  "js/features/plan.js",
  "js/features/icons.js",
  "js/features/assistant.js",
  "js/core/api.js",
  "js/core/motion.js",
  "js/features/viz.js",
  "js/core/skeleton.js",
  "js/core/media.js",
  "js/features/mbti.js",
  "js/features/persona.js",
  "js/features/charts.js",
];
if (
  LOAD_ORDER.length !== JS_SECTIONS.length ||
  new Set(LOAD_ORDER).size !== LOAD_ORDER.length ||
  !LOAD_ORDER.every((f) => JS_SECTIONS.some((s) => s.file === f))
) {
  console.error("❌ 加载顺序与模块清单不匹配");
  process.exit(1);
}

/* ---------- 6. 写文件 ---------- */
const writeOut = (rel, start, end) => {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, lines.slice(start - 1, end).join("\n") + "\n");
};
let cssBytes = 0,
  jsBytes = 0;
for (const c of CSS_LAYERS) {
  writeOut(c.file, c.start, c.end);
  cssBytes += c.end - c.start + 1;
}
for (const s of JS_SECTIONS) {
  writeOut(s.file, s.start, s.end);
  jsBytes += s.end - s.start + 1;
  /* 除首个文件外，每个 JS 文件顶部补 "use strict";（classic script 严格模式不跨文件继承） */
  if (s.file !== JS_SECTIONS[0].file) {
    const p = path.join(OUT, s.file);
    const cur = fs.readFileSync(p, "utf8");
    if (!cur.startsWith('"use strict";')) fs.writeFileSync(p, '"use strict";\n' + cur);
  }
}

/* ---------- 7. index.html ---------- */
const head = lines.slice(0, STYLE_OPEN - 1).join("\n"); // 至 <style> 前一行
const bodyHtml = lines.slice(STYLE_CLOSE, SCRIPT_OPEN - 1).join("\n"); // </style> … body 末尾
const tail = lines
  .slice(SCRIPT_CLOSE)
  .filter((l, i, a) => !(i === a.length - 1 && l === ""))
  .join("\n");
const linkTags = CSS_LAYERS.map((c) => `  <link rel="stylesheet" href="${c.file}">`).join("\n");
const scriptTags = LOAD_ORDER.map((f) => `  <script src="${f}"></script>`).join("\n");
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, "index.html"),
  `${head}
${linkTags}
${bodyHtml}
${scriptTags}
${tail}
`
);

/* ---------- 8. 构建清单 ---------- */
fs.writeFileSync(
  path.join(OUT, "build-manifest.json"),
  JSON.stringify(
    {
      source: "public/futuremirror-demo.html",
      generatedBy: "scripts/split-frontend.js",
      css: CSS_LAYERS.map((c) => ({ file: c.file, lines: [c.start, c.end], note: c.note })),
      jsOriginalOrder: JS_SECTIONS.map((s) => ({ file: s.file, lines: [s.start, s.end], note: s.note })),
      jsLoadOrder: LOAD_ORDER,
      loadOrderNote:
        "与原区划顺序唯一差异：theme-variants 提前于 reveal（init() 加载期调用 syncAccentBtn，跨文件无函数提升）",
    },
    null,
    2
  ) + "\n"
);

console.log(`✅ 拆分完成：CSS ${CSS_LAYERS.length} 层 / JS ${JS_SECTIONS.length} 模块（边界由横幅标题自动探测）`);
console.log(`   frontend/index.html（${LOAD_ORDER.length} 个 script 标签）`);
