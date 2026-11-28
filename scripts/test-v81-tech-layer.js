/* v81 · 科技视觉强化层：给落地页一个霓虹锚点（不升版，仍是 1.0.0）
 *
 * v58–v62 的落地页是一张暖纸：浅底、发丝线、朱红点缀。用户要「科技风」，
 * 但推翻重做的代价是 3016 条断言与 28 页 PDF 截图。这一版走的是「加一层」：
 * frontend/css/tech-layer.css 排在 landing.css 之后，只覆盖视觉信号，
 * 不动版式——容器宽、栅格列数、clamp 字号仍由 v58 层决定。
 *
 * 断言分八组：
 * ① 分层：第 5 个 CSS 层、进构建清单、排在 landing.css 之后
 * ② 锚色：全层只有一个高饱和色（青 #00E5FF），没有第二个霓虹、没有紫
 * ③ 令牌：深浅两套主题都落进同一个深空（暗色不会又翻回暖纸）
 * ④ 地平线：透视网格挂在首屏容器上，用 mask 渐隐、不铺到图幅后面
 * ⑤ 声波锚点：24 根径向条 + 两道扩散环 + 中心麦克风，纯 CSS
 * ⑥ 终端壳：实录加壳、只有「当前轮次」那一条亮
 * ⑦ 到达感：滚动入场多一档 blur → 0
 * ⑧ 边界：零 !important、无 backdrop-filter、reduced-motion 全静态
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) {
    pass++;
    console.log("  ✅ " + name);
  } else {
    fail++;
    console.log("  ❌ " + name);
  }
}

const techCss = rd("frontend/css/tech-layer.css");
const landingCss = rd("frontend/css/landing.css");
const indexHtml = rd("frontend/index.html");
const manifest = JSON.parse(rd("frontend/build-manifest.json"));
const demoHtml = rd("public/futuremirror-demo.html");
const techNoComment = techCss.replace(/\/\*[\s\S]*?\*\//g, "");

/* 取某个选择器的规则体（第一个匹配） */
function rule(css, selector) {
  const i = css.indexOf(selector + " {");
  if (i < 0) return "";
  let depth = 0;
  const start = css.indexOf("{", i);
  for (let p = start; p < css.length; p++) {
    if (css[p] === "{") depth++;
    else if (css[p] === "}") {
      depth--;
      if (depth === 0) return css.slice(start, p + 1);
    }
  }
  return "";
}

/* 取某个断点块内的文本 */
function media(css, query) {
  const i = css.indexOf(query);
  if (i < 0) return "";
  let depth = 0;
  const start = css.indexOf("{", i);
  for (let p = start; p < css.length; p++) {
    if (css[p] === "{") depth++;
    else if (css[p] === "}") {
      depth--;
      if (depth === 0) return css.slice(start, p + 1);
    }
  }
  return "";
}

console.log("\n=== v81 科技视觉强化层 ===");

/* ============ ① 分层 ============ */
console.log("\n-- ① 分层：第 5 层，排在 landing.css 之后 --");
const cssList = (manifest.css || []).map((c) => (typeof c === "string" ? c : c.file));
ok(cssList.includes("css/tech-layer.css"), "tech-layer.css 已登记进 build-manifest");
ok(cssList[cssList.length - 1] === "css/tech-layer.css", "它是最后一层（同权重下最后生效）");
ok(/css\/landing\.css[\s\S]{0,200}?css\/tech-layer\.css/.test(indexHtml), "index.html 里排在 landing.css 之后");
ok(/--fm-neon/.test(demoHtml) && /fm-voice-bars/.test(demoHtml), "单文件产物里带着新层与声波锚点");

/* ============ ② 锚色：只有一个霓虹 ============ */
console.log("\n-- ② 锚色：一个霓虹，不撒彩虹 --");
ok(/--fm-neon:\s*#00e5ff/.test(techCss), "主霓虹是青 #00e5ff（与「面镜 / 反射」的气质匹配）");
const hexColors = (techNoComment.match(/#[0-9a-fA-F]{3,8}\b/g) || []).map((s) => s.toLowerCase());
const saturated = [...new Set(hexColors)].filter((h) => {
  const v = h.slice(1);
  if (v.length !== 6) return false;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max > 200 && max - min > 90; // 高饱和
});
ok(
  saturated.every((h) => h === "#00e5ff" || h === "#5cf2ff" || h === "#04121a"),
  "高饱和色只有青系一支（实测 " + (saturated.join(" ") || "无") + "）"
);
ok(
  !/#8b5cf6|#a855f7|#7c3aed|\bpurple\b|\bviolet\b|lavender/i.test(techNoComment),
  "层里没有紫色（科技感廉价化的第一来源）"
);
ok(!/linear-gradient\([^)]*(#ff|rgb\(255,\s*0)/i.test(techNoComment), "没有暖色渐变（沿用暖纸的配色逻辑）");
ok(
  (techNoComment.match(/rgba\(0,\s*229,\s*255/g) || []).length >= 8 &&
    (techNoComment.match(/var\(--fm-neon\)/g) || []).length >= 10,
  "锚色被真正复用（rgba 与 var 两种写法各十处以上）"
);

/* ============ ③ 令牌：两套主题同一个深空 ============ */
console.log("\n-- ③ 令牌：深浅都落进深空 --");
const root = rule(techCss, "#view-landing");
ok(/--lp-bg:\s*var\(--fm-void\)/.test(root), "底色令牌指向深空（不再指向暖纸）");
ok(/--lp-r:\s*12px/.test(root), "圆角收到 12px（24px 太软）");
ok(/--fm-void:\s*#06080f/.test(root), "深空底 #06080f（比纯黑多一层蓝）");
ok(/--brand:\s*var\(--fm-neon\)/.test(root), "蓝图品牌色在落地页内转青（雷达 / 下划线跟着变）");
const dark = rule(techCss, '[data-theme="dark"] #view-landing');
ok(/--lp-bg:\s*var\(--fm-void\)/.test(dark), "暗色主题也重设 --lp-bg（否则会翻回暖纸 #131311）");
ok(/--lp-ink:\s*#e8f6fb/.test(dark), "暗色主题的字色与浅色一致");
ok(!/--lp-r:\s*24px/.test(techCss), "全层没有任何地方把圆角改回 24px");

/* ============ ④ 地平线 ============ */
console.log("\n-- ④ 地平线：挂在首屏，不铺到图幅后面 --");
const floor = rule(techCss, "#view-landing .lp-first::after");
ok(/perspective\(\d+px\) rotateX\(\d+deg\)/.test(floor), "用 perspective + rotateX 做透视地面（纯 CSS）");
ok(/mask-image:[^;]*linear-gradient/.test(floor), "用 mask 让网格从视线下方浮现又消隐");
ok(/@keyframes fmFloorDrift/.test(techCss), "网格有缓慢漂移");
ok(!/#view-landing \.landing-hero::after/.test(techCss), "不再挂在 .landing-hero 上（那会把网格铺到评分图幅后面）");
ok(/z-index:\s*-1/.test(floor), "地平线压在内容之后，不挡标题");

/* ============ ⑤ 声波锚点 ============ */
console.log("\n-- ⑤ 声波锚点：第一眼说清「语音 AI 面试」 --");
const dom = new JSDOM(indexHtml, { runScripts: "outside-only" });
const voice = dom.window.document.querySelector("#view-landing .fm-voice");
ok(!!voice, "首屏有 .fm-voice 容器");
const bars = voice ? voice.querySelectorAll(".fm-voice-bars i") : [];
ok(bars.length === 24, "24 根径向条（360° / 15°，实测 " + bars.length + " 根）");
ok(
  bars.length > 0 && [...bars].every((b) => /^\d+$/.test(b.style.getPropertyValue("--i"))),
  "每根都带 --i 序号（相位由 CSS 算，不用内联角度）"
);
ok(!!voice && !!voice.querySelector(".fm-voice-mic svg"), "中心有麦克风图标");
ok(!!voice && voice.querySelectorAll(".fm-voice-ring").length === 2, "外圈两道扩散环");
ok(/@keyframes fmVoiceWave/.test(techCss) && /@keyframes fmVoiceRing/.test(techCss), "声波与扩散环都是 CSS 动画");
ok(
  /aria-hidden="true"/.test(indexHtml.split('class="fm-voice"')[0].slice(-200)) ||
    /<div class="fm-voice" aria-hidden="true">/.test(indexHtml),
  "整块对读屏隐藏（装饰性元素）"
);
ok(
  /letter-spacing:\s*0\.06em/.test(rule(techCss, "#view-landing .fm-voice-cap")),
  "标签不吃 0.2em 字距（中文会被拆成孤字）"
);

/* ============ ⑥ 终端壳 ============ */
console.log("\n-- ⑥ 终端壳：只亮当前轮次 --");
const mock = rule(techCss, "#view-landing .hero-mock");
ok(/border:\s*1px solid var\(--fm-line\)/.test(mock), "实录套壳：1px 霓虹描边");
ok(/box-shadow:[^;]*--fm-glow/.test(mock), "外壳带霓虹光晕");
ok(/\.mock-bubble\.ai:last-child::before/.test(techCss), "当前轮次左侧一根 2px 霓虹竖线");
ok(/@keyframes fmBreathe/.test(techCss), "竖线做呼吸（不是每行都动）");
ok(
  /\.mock-bubble\.user\s*\{[^}]*rgba\(255, 255, 255, 0\.1\)/.test(techCss),
  "我方气泡改成半透明亮面（深色页里白底会刺眼）"
);

/* ============ ⑦ 到达感 ============ */
console.log("\n-- ⑦ 到达感：模糊收敛 --");
const rv = rule(techCss, "#view-landing.lp-motion .lp-rv");
ok(/filter:\s*blur\(\d+px\)/.test(rv), "入场多一档 blur（位移淡入太常见）");
ok(/\.lp-rv\.is-in\s*\{[^}]*filter:\s*none/.test(techCss), "到站后 filter 归零");
ok(/transition:[^;]*filter/.test(rv), "filter 进了过渡列表（否则是一瞬间跳变）");

/* ============ ⑧ 边界 ============ */
console.log("\n-- ⑧ 边界：零 !important / 无 backdrop / 可降级 --");
ok(!/!important/.test(techNoComment), "整层零 !important（靠 ID 前缀提权重）");
ok(!/backdrop-filter/.test(techNoComment), "不用 backdrop-filter（与内页蓝图层的纪律一致）");
const reduced = media(techCss, "prefers-reduced-motion: reduce");
ok(!!reduced, "有 reduced-motion 降级段");
ok(
  /lp-first::after/.test(reduced) && /fm-voice-bars i/.test(reduced) && /fm-voice-ring/.test(reduced),
  "网格 / 声波 / 扩散环全部停掉"
);
ok(/\.lp-rv\s*\{[^}]*filter:\s*none/.test(reduced), "滚动入场降级为静态落位");
const narrow = media(techCss, "max-width: 900px");
ok(/fm-voice\s*\{[^}]*width:\s*88px/.test(narrow), "窄屏声波缩一号（88px）");
ok(!!media(techCss, "max-width: 640px"), "640 以下再降一档");

/* ============ 收尾：真加载一次，确认无脚本错误 ============ */
console.log("\n-- 成品：单文件演示包可加载 --");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push(e.message));
try {
  const d = new JSDOM(demoHtml, {
    url: "http://localhost/",
    runScripts: "dangerously",
    virtualConsole: vc,
    pretendToBeVisual: true,
  });
  const doc = d.window.document;
  ok(!!doc.querySelector("#view-landing .fm-voice"), "产物里声波锚点在位");
  ok(!!doc.querySelector("#view-landing .lp-banner"), "产物里评分图幅仍在（版式没被这一层改掉）");
  d.window.close();
} catch (e) {
  ok(false, "演示包加载抛错：" + e.message);
}
ok(errors.filter((m) => !/Not implemented/i.test(m)).length === 0, "全流程无脚本错误");

console.log("\n结果：" + pass + " 通过，" + fail + " 失败");
process.exit(fail === 0 ? 0 : 1);
