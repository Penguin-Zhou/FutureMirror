/* v83 · 功能卡的翻转窗口：悬停翻面 + 放大 + 拟真小窗口（不升版，仍是 1.0.0）
 *
 * 九宫格原来只有「标题 + 一段说明」。加 3D 演示的成本太高（模型、渲染器、
 * 首屏预算全要重算），但「让用户看见产品长什么样」这件事可以用一张
 * 拟真窗口截图的门槛做到：正面读价值，翻过来看界面。
 *
 * 为什么是翻转而不是 hover 浮层：九宫格没有多余空间，浮层一动就盖住邻居，
 * 阅读节奏被打断；翻转把第二层信息放在同一块面积上。
 *
 * 断言分五组：
 * ① 结构：九张卡都成双面，背面是「标题栏 + 内容 + 状态栏」三段式窗口
 * ② 翻转：透视在卡片上、内层 preserve-3d、两面 backface 隐藏、背面预转 180°
 * ③ 放大：hover 时 rotateY 与 scale 同时在，焦点卡抬 z-index、邻居后退
 * ④ 拟真：交通灯只有锚色三档、窗口有边与投影、状态栏有分隔线
 * ⑤ 边界：零 !important、触屏不提示翻转、reduced-motion 退成淡入
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
const indexHtml = rd("frontend/index.html");
const css = techCss.replace(/\/\*[\s\S]*?\*\//g, "");

function rule(cssText, selector) {
  const i = cssText.indexOf(selector + " {");
  if (i < 0) return "";
  const j = cssText.indexOf("}", i);
  return cssText.slice(i, j + 1);
}

/* 取某个选择器起的规则体（选择器可能是多个逗号分隔的） */
function ruleAt(cssText, selector) {
  const i = cssText.indexOf(selector);
  if (i < 0) return "";
  const j = cssText.indexOf("}", i);
  return cssText.slice(i, j + 1);
}

/* 取某个 @media 块的整段（块不嵌套，按括号配平）。同一个查询可能出现多次，
 * 取最后一次——本层的降级块都在文件末尾。 */
function media(cssText, query) {
  const i = cssText.lastIndexOf(query);
  if (i < 0) return "";
  const start = cssText.indexOf("{", i);
  let depth = 0;
  for (let k = start; k < cssText.length; k++) {
    if (cssText[k] === "{") depth++;
    else if (cssText[k] === "}") {
      depth--;
      if (depth === 0) return cssText.slice(start, k + 1);
    }
  }
  return "";
}

const vc = new VirtualConsole();
const dom = new JSDOM(indexHtml, { url: "http://localhost/", virtualConsole: vc });
const doc = dom.window.document;

/* ============ ① 结构：九张卡都成双面 ============ */
console.log("\n-- ① 结构：正面读价值，背面看界面 --");
const cards = [...doc.querySelectorAll("#view-landing .feature-grid .feature-block.fb3d")];
ok(cards.length === 9, "九张功能卡都带翻转壳（实测 " + cards.length + "）");
ok(
  cards.every((c) => c.querySelectorAll(":scope > .fb3d-inner > .fb3d-face").length === 2),
  "每张卡都有正反两个面"
);
ok(
  cards.every(
    (c) =>
      c.querySelector(".fb3d-front .fb-icon") && c.querySelector(".fb3d-front h3") && c.querySelector(".fb3d-front p")
  ),
  "正面保留序号 / 标题 / 说明，翻转不是替换内容"
);
ok(
  cards.every((c) => c.querySelector(".fb3d-back .fbw .fbw-bar") && c.querySelector(".fb3d-back .fbw-body")),
  "背面是「标题栏 + 内容区」的窗口结构"
);
ok(
  cards.every((c) => c.querySelector(".fb3d-back .fbw-status")),
  "每个窗口都有底部状态栏（三段式才像真窗口）"
);
ok(
  cards.every((c) => c.querySelectorAll(".fbw-dots i").length === 3),
  "标题栏左侧三个交通灯"
);
ok(
  [...doc.querySelectorAll("#view-landing .fb3d-back")].every((b) => b.getAttribute("aria-hidden") === "true"),
  "背面整体标 aria-hidden（读屏只读正面文案）"
);
ok(
  [...doc.querySelectorAll("#view-landing .fb3d .fb-coord")].every((c) => c.closest(".fb3d-front")),
  "坐标读数留在正面（翻转后不带进窗口）"
);

/* ============ ② 翻转：3D 只在卡片自己身上 ============ */
console.log("\n-- ② 翻转：透视在卡上，两面各自隐藏背面 --");
const shell = ruleAt(css, "#view-landing .feature-block.fb3d,");
ok(/perspective:\s*1100px/.test(shell), "透视装在卡片上（不是整格共用一个灭点）");
ok(/padding:\s*0/.test(shell) && /border:\s*0/.test(shell), "卡片外壳退成纯容器，视觉交给两个面");
ok(/transform-style:\s*preserve-3d/.test(rule(css, "#view-landing .fb3d-inner")), "内层 preserve-3d 撑住两个面");
ok(
  /backface-visibility:\s*hidden/.test(ruleAt(css, "#view-landing .fb3d-face,")),
  "两面都隐藏背面（翻过去不会看到镜像的正面）"
);
ok(/transform:\s*rotateY\(180deg\)/.test(rule(css, "#view-landing .fb3d-back")), "背面预转 180°，翻过来正好正读");
ok(
  /position:\s*absolute/.test(rule(css, "#view-landing .fb3d-back")) &&
    /inset:\s*0/.test(rule(css, "#view-landing .fb3d-back")),
  "背面绝对定位铺满，翻转时高度不跳"
);
ok(
  /rotateY\(180deg\)\s*translateZ/.test(rule(css, "#view-landing .fb3d-back")),
  "两面在深度上分开 0.6px（防圆角漏边）"
);

/* ============ ③ 放大：翻的同时抬起来 ============ */
console.log("\n-- ③ 放大：翻过去的同时抬起来 --");
const hoverMedia = media(css, "@media (hover: hover) and (pointer: fine)");
ok(hoverMedia.length > 0, "翻转只在有真指针的设备上开");
ok(
  /\.fb3d:hover \.fb3d-inner\s*\{[^}]*rotateY\(180deg\)/.test(hoverMedia) &&
    /\.fb3d:hover \.fb3d-inner\s*\{[^}]*scale\(1\.1\)/.test(hoverMedia),
  "hover 时同时旋转 180° 与放大 1.1"
);
ok(
  /\.fb3d:hover \.fb3d-inner\s*\{[^}]*translateZ\(40px\)/.test(hoverMedia),
  "translateZ 让它在透视里真的靠近观察者（不是纯缩放）"
);
ok(/\.feature-block\.fb3d:hover\s*\{[^}]*z-index:\s*9/.test(hoverMedia), "悬停卡抬到邻居之上，放大后不被裁");
ok(/:has\(\.fb3d:hover\)[^{]*\{[^}]*opacity:\s*0\.72/.test(hoverMedia), "同格邻居后退到 0.72，焦点让给翻转卡");
ok(/\[data-theme="dark"\][\s\S]{0,200}opacity:\s*0\.6/.test(hoverMedia), "深色下再压一档（深卡淡出 0.72 看不出来）");
ok(
  /--fm-lift:/.test(rule(css, "#view-landing")) && /box-shadow:\s*var\(--fm-lift\)/.test(hoverMedia),
  "投影走令牌，亮暗各一套"
);

/* ============ ④ 拟真：一眼认得出是窗口 ============ */
console.log("\n-- ④ 拟真：一眼认得出是窗口 --");
ok(/border-radius:\s*7px/.test(rule(css, "#view-landing .fbw")), "窗口圆角比卡片小一档（7px vs 12px）");
ok(/box-shadow:\s*var\(--fm-win-shadow\)/.test(rule(css, "#view-landing .fbw")), "窗口浮在面板上有自己的投影");
ok(/height:\s*21px/.test(rule(css, "#view-landing .fbw-bar")), "标题栏 21px：窄，但够放下三个点");
ok(/repeating-linear-gradient/.test(rule(css, "#view-landing .fbw-grip")), "右上角三道斜纹抓手（窗口的拟真小暗号）");
ok(
  /border-top:\s*1px solid var\(--fm-line\)/.test(rule(css, "#view-landing .fbw-status")),
  "状态栏与内容区之间有一条分隔线"
);
ok(!/#ff5f57|#febc2e|#28c840|#febc2f/i.test(css), "交通灯没有用红黄绿（会破掉单锚色）");
ok(
  /hsl\(var\(--fm-hue\) var\(--fm-sat\) var\(--fm-lit\) \/ 0\.55\)/.test(rule(css, "#view-landing .fbw-dots i")),
  "三个点用锚色三档透明度，仍是同一个色相"
);
ok(
  /radial-gradient/.test(rule(css, "#view-landing .fbw-stage")) &&
    !/background:\s*#0{3,6}/.test(rule(css, "#view-landing .fbw-stage")),
  "面试画面是固定深色的「视频」，不随主题变白"
);
ok(
  /linear-gradient\(transparent, rgba\(4, 10, 14, 0\.72\)\)/.test(rule(css, "#view-landing .fbw-stage::after")),
  "画面底部压暗，字幕才立得住"
);

/* ============ ⑤ 边界：不放宽全局规矩 ============ */
console.log("\n-- ⑤ 边界：不放宽全局规矩 --");
ok(!/!important/.test(techCss), "整层零 !important");
ok(!/backdrop-filter/.test(techCss), "整层零 backdrop-filter");
const reduce = media(css, "@media (prefers-reduced-motion: reduce)");
ok(/transform-style:\s*flat/.test(reduce), "reduced-motion 下关掉 3D 上下文");
ok(
  /\.fb3d-back\s*\{[^}]*opacity:\s*0/.test(reduce) && /\.fb3d:hover \.fb3d-back\s*\{[^}]*opacity:\s*1/.test(reduce),
  "降级成直接淡入背面，不做翻转"
);
const noHover = media(css, "@media (hover: none)");
ok(/\.fb3d-hint\s*\{[^}]*display:\s*none/.test(noHover), "触屏上不写「悬停查看」——翻不过来就别承诺");
ok(/\.fb3d\s+\.fb-coord\s*\{[^}]*display:\s*none/.test(css), "翻转卡不显示坐标读数（那是图纸正面的标注）");

console.log("\n" + (fail === 0 ? "✅ 全部通过" : "❌ 有失败项") + "：" + pass + " 项通过，" + fail + " 项失败");
process.exit(fail === 0 ? 0 : 1);
