/* v84 · 功能卡翻过来读功能；3D 只做在封面页（不升版，仍是 1.0.0）
 *
 * v83 的背面是九屏拟真界面——翻过来还是在「看图」。这一版把背面换成
 * 说明书：一句定位 + 三条能力（名称 / 一句解释）+ 一行输入输出。
 * 翻转同时退回「翻页」：不放大、不抬 Z、不压邻居。
 *
 * 立体感整块挪到封面页：一块斜置的面试面板 + 三张不同 Z 的浮标，
 * 鼠标经过首屏时跟着转。纯 CSS 3D，不引渲染库。
 *
 * 断言分五组：
 * ① 结构：九张卡双面，背面是「标题栏 + 说明 + 状态栏」
 * ② 内容：每张三条能力、一条定位、输入输出各一段，且九张各不相同
 * ③ 翻转：透视在卡上、两面隐藏背面、hover 只有 rotateY（不再放大）
 * ④ 封面：透视舞台、四层 Z、鼠标跟随、无 Three.js
 * ⑤ 边界：零 !important、触屏不提示、reduced-motion 静态
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
const appfx = rd("frontend/js/features/appfx.js");
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

/* 取某个 @media 查询的所有块并拼起来（同一查询在文件里出现多次时，
 * 只看最后一块会漏掉前半段的降级规则）。块不嵌套，按括号配平。 */
function media(cssText, query) {
  let out = "";
  let i = cssText.indexOf(query);
  while (i >= 0) {
    const start = cssText.indexOf("{", i);
    let depth = 0;
    for (let k = start; k < cssText.length; k++) {
      if (cssText[k] === "{") depth++;
      else if (cssText[k] === "}") {
        depth--;
        if (depth === 0) {
          out += cssText.slice(start, k + 1) + "\n";
          i = cssText.indexOf(query, k);
          break;
        }
      }
    }
    if (start < 0) break;
  }
  return out;
}

const vc = new VirtualConsole();
const dom = new JSDOM(indexHtml, { url: "http://localhost/", virtualConsole: vc });
const doc = dom.window.document;

/* ============ ① 结构：正面读价值，背面读功能 ============ */
console.log("\n-- ① 结构：正面读价值，背面读功能 --");
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
  "背面是「标题栏 + 内容区」的说明卡结构"
);
ok(
  cards.every((c) => c.querySelector(".fb3d-back .fbw-lead")),
  "背面第一行是一句定位（不是截图）"
);
ok(
  cards.every((c) => c.querySelectorAll(".fb3d-back .fbw-list li").length === 3),
  "每张背面三条能力，不多不少"
);
ok(
  cards.every((c) => c.querySelector(".fb3d-back .fbw-status")),
  "每个背面都有底部状态栏"
);
ok(
  cards.every((c) => c.querySelectorAll(".fbw-status span").length === 2),
  "状态栏左右各一段（输入 / 输出，或规格 / 耗时）"
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
  "坐标读数留在正面（翻转后不带进说明卡）"
);

/* ============ ② 内容：读到的是功能，不是界面假数据 ============ */
console.log("\n-- ② 内容：三条能力写的是功能 --");
const backs = cards.map((c) => c.querySelector(".fb3d-back"));
ok(
  backs.every((b) => [...b.querySelectorAll(".fbw-list b")].every((x) => x.textContent.trim().length >= 2)),
  "每条能力都有名称"
);
ok(
  backs.every((b) => [...b.querySelectorAll(".fbw-list span")].every((x) => x.textContent.trim().length >= 8)),
  "每条能力都有一句解释（不是只有标签）"
);
ok(
  backs.every((b) => b.textContent.indexOf("示意") < 0 && b.textContent.indexOf("已解析") < 0),
  "背面不再出现「示意 / 已解析」这类仿真文案"
);
const leads = backs.map((b) => b.querySelector(".fbw-lead").textContent.trim());
ok(new Set(leads).size === 9, "九句定位各不相同（不是复制的模板）");
const itemNames = backs.flatMap((b) => [...b.querySelectorAll(".fbw-list b")].map((x) => x.textContent.trim()));
ok(new Set(itemNames).size === 27, "27 条能力名没有重复（九张卡各写各的）");
ok(
  backs.every((b) => {
    const t = b.querySelector(".fbw-status").textContent;
    const spans = [...b.querySelectorAll(".fbw-status span")];
    return spans.length === 2 && spans.every((s) => s.textContent.trim().length >= 3) && !/\d+%/.test(t);
  }),
  "状态栏两段都是具体口径（不是百分比假进度）"
);

/* ============ ③ 翻转：只是翻页，不再放大 ============ */
console.log("\n-- ③ 翻转：把卡翻过来，不放大 --");
const shell = ruleAt(css, "#view-landing .feature-block.fb3d,");
ok(/perspective:\s*1400px/.test(shell), "透视装在卡片上（不是整格共用一个灭点）");
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

const hoverMedia = media(css, "@media (hover: hover) and (pointer: fine)");
ok(hoverMedia.length > 0, "翻转只在有真指针的设备上开");
ok(/\.fb3d:hover \.fb3d-inner\s*\{[^}]*rotateY\(180deg\)/.test(hoverMedia), "hover 时翻 180°");
ok(!/scale\(/.test(hoverMedia), "翻转不再放大（放大是封面页的事）");
ok(!/translateZ\(40px\)/.test(hoverMedia), "翻转不再往观察者方向抬 Z");
ok(!/:has\(\.fb3d:hover\)/.test(hoverMedia), "不再压暗邻居——翻页不该让整片发灰");
ok(/\.feature-block\.fb3d:hover\s*\{[^}]*z-index:\s*3/.test(hoverMedia), "悬停卡只要压过同格即可（3 足够）");

/* ============ ④ 封面：唯一一处立体 ============ */
console.log("\n-- ④ 封面：一块斜置的面试面板 --");
ok(!!doc.querySelector("#view-landing .lp-first .fm-voice .fm3d .fm3d-stage"), "首屏有 3D 舞台");
ok(!!doc.querySelector("#view-landing .fm3d-deck"), "舞台里有一块面板");
ok(doc.querySelectorAll("#view-landing .fm3d-tag").length === 3, "面板外三张浮标（不同 Z 才有层次）");
ok(
  !!doc.querySelector("#view-landing .fm3d-deck .fm3d-bar") &&
    !!doc.querySelector("#view-landing .fm3d-deck .fm3d-q") &&
    !!doc.querySelector("#view-landing .fm3d-deck .fm3d-foot"),
  "面板有标题栏 / 问题 / 底部波形三段"
);
ok(
  doc.querySelectorAll("#view-landing .fm3d-foot .fm-voice-bars i").length === 24,
  "波形仍是原来的 24 根（换位置不换零件）"
);
ok(
  !!doc.querySelector("#view-landing .fm3d-av") && doc.querySelectorAll("#view-landing .fm3d-av i").length === 2,
  "头像用几何剪影（一个圆两只眼，不做写实人脸）"
);
ok(/perspective:\s*1300px/.test(rule(css, "#view-landing .fm3d")), "舞台外层给 1300px 透视");
ok(
  /transform-style:\s*preserve-3d/.test(rule(css, "#view-landing .fm3d-stage")) &&
    /rotateX\(var\(--rx/.test(rule(css, "#view-landing .fm3d-stage")) &&
    /rotateY\(var\(--ry/.test(rule(css, "#view-landing .fm3d-stage")),
  "舞台自己 preserve-3d，角度由 --rx / --ry 驱动"
);
const zs = ["t1", "t2", "t3"].map((k) => {
  const m = new RegExp("\\.fm3d-" + k + "\\s*\\{[^}]*translateZ\\((\\d+)px\\)").exec(css);
  return m ? Number(m[1]) : -1;
});
ok(zs.every((z) => z > 0) && new Set(zs).size === 3, "三张浮标各在一个 Z 上（实测 " + zs.join(" / ") + "）");
ok(
  /function initHero3D/.test(appfx) && /pointermove/.test(appfx) && /--ry/.test(appfx),
  "鼠标经过首屏才驱动角度（JS 只写变量）"
);
ok(/function initHero3D[\s\S]{0,320}reduced\(\)/.test(appfx), "偏好减弱时不绑定跟随（静态角度由 CSS 兜底）");
ok(
  !/<script[^>]*three/i.test(indexHtml) && !/new THREE|THREE\.\w/.test(appfx),
  "没有引入 Three.js（面板是 DOM，文字是真文字）"
);
ok(/width:\s*100%/.test(rule(css, "#view-landing .fm3d")), "舞台显式 100% 宽（auto 在 flex item 里会算成 0）");

/* ============ ⑤ 边界：不放宽全局规矩 ============ */
console.log("\n-- ⑤ 边界：不放宽全局规矩 --");
ok(!/!important/.test(techCss), "整层零 !important");
ok(!/backdrop-filter/.test(techCss), "整层零 backdrop-filter");
const reduce = media(css, "@media (prefers-reduced-motion: reduce)");
ok(/transform-style:\s*flat/.test(reduce), "reduced-motion 下关掉卡片的 3D 上下文");
ok(
  /\.fb3d-back\s*\{[^}]*opacity:\s*0/.test(reduce) && /\.fb3d:hover \.fb3d-back\s*\{[^}]*opacity:\s*1/.test(reduce),
  "降级成直接淡入背面，不做翻转"
);
ok(/\.fm3d-stage\s*\{[^}]*transform:\s*rotateX\(4deg\) rotateY\(0deg\)/.test(reduce), "封面的角度在降级时固定");
const noHover = media(css, "@media (hover: none)");
ok(/\.fb3d-hint\s*\{[^}]*display:\s*none/.test(noHover), "触屏上不写「悬停查看」——翻不过来就别承诺");
ok(/\.fm3d-tag\s*\{[^}]*display:\s*none/.test(css), "窄屏收起浮标（375 宽会盖住正文）");
ok(!/#ff5f57|#febc2e|#28c840|#febc2f/i.test(css), "交通灯没有用红黄绿（会破掉单锚色）");
const mobile = media(css, "@media (max-width: 640px)");
ok(/\.fb3d-back\s*\{[^}]*display:\s*none/.test(mobile), "手机上不渲染背面（两列一张卡只剩 164 宽，说明书放不下）");
ok(
  /\.fb3d:hover \.fb3d-inner\s*\{[^}]*transform:\s*none/.test(mobile),
  "手机上一并关掉翻转（否则正面被 backface 藏掉，只剩空白）"
);
const mid = media(css, "@media (max-width: 1100px)");
ok(/min-height:\s*266px/.test(mid), "三列变窄时把卡加高，三条能力不被状态栏压住");
ok(/grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(mid), "窄列时能力名与解释改上下排，说明不再挤成三行");

console.log("\n" + (fail === 0 ? "✅ 全部通过" : "❌ 有失败项") + "：" + pass + " 项通过，" + fail + " 项失败");
process.exit(fail === 0 ? 0 : 1);
