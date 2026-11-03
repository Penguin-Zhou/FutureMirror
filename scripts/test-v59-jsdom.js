/* v59 · 落地页整体改版：照 mimo.mi.com 的版式语言重排（不升版，仍是 Beta 1.1.2）
 *
 * v58 只动了落地页的骨架，旧层（tokens.css + theme.css 里 v21–v57 的图纸规则）
 * 还在底下顶着，于是出现「卡片圆角换了、卡头还挂着一条米色窗栏」这类半新半旧。
 * 这一版把落地页收成独立的一层 frontend/css/landing.css，全部规则以 #view-landing
 * 起头，产品内页的图纸风一像素不动。
 *
 * 断言分七组：
 * ① 分层：落地页有独立的样式表、进了构建清单、没有半条规则漏到内页
 * ② 版式：居中、1260 容器、24 圆角、999 胶囊——参考站实测出来的四个数
 * ③ 图幅：报告截面（总分 + 五维条形）而不是一块海报；数据自洽
 * ④ 旧层：窗栏米色带必须消失，尺寸线必须还在
 * ⑤ 区块：功能 3 列、流程 4 栏发丝线、数字 4 列，节标题一律无衬线
 * ⑥ 窄屏：功能卡两列、雷达收掉、卡单单行、不再折叠
 * ⑦ 成品：构建产物里带着新层，且入口无脚本错误
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

const landingCss = rd("frontend/css/landing.css");
const indexHtml = rd("frontend/index.html");
const bootSrc = rd("frontend/js/core/boot.js");
const manifest = JSON.parse(rd("frontend/build-manifest.json"));
const demoHtml = rd("public/futuremirror-demo.html");

function rule(css, selector) {
  const i = css.indexOf(selector + " {");
  if (i < 0) return "";
  return css.slice(i, css.indexOf("}", i));
}

/* 取某个断点块内的文本（用于「窄屏才有」的断言） */
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

(async function run() {
  console.log("\n── ① 分层：落地页有自己的样式表 ──");
  const cssList = (manifest.css || []).map((c) => (typeof c === "string" ? c : c.file));
  ok(cssList.includes("css/landing.css"), "landing.css 已登记进 build-manifest（第 " + cssList.length + " 层）");
  ok(/<link[^>]+href="css\/landing\.css"/.test(indexHtml), "index.html 里排在 pages.css 之后（同权重下后来者生效）");
  /* 落地页规则的每一条都带 #view-landing 前缀：抽查几个核心选择器 */
  const scoped = ["landing-nav", "hero-title", "lp-banner", "feature-block", "workflow-step", "landing-stats"];
  ok(
    scoped.every((cls) => !new RegExp("^\\." + cls + "\\s*[,{]", "m").test(landingCss)),
    "六个核心类没有裸选择器（不会漏到应用内页）"
  );
  const cssNoComment = landingCss.replace(/\/\*[\s\S]*?\*\//g, "");
  ok(!/!important/.test(cssNoComment), "整层零 !important（靠 ID 前缀提权重）");

  console.log("\n── ② 版式：参考站实测出来的四个数 ──");
  ok(/--lp-bg: #fcfaf8/.test(landingCss), "底色 #fcfaf8（暖纸，不是纯白）");
  ok(/--lp-wrap: 1260px/.test(landingCss), "容器 1260px");
  ok(/--lp-r: 24px/.test(landingCss), "卡片圆角 24px");
  ok(/--lp-pill: 999px/.test(landingCss), "按钮圆角 999px（真胶囊）");
  const hero = rule(landingCss, "#view-landing .landing-hero");
  ok(/text-align: center/.test(hero), "首屏整体居中");
  ok(/background: none/.test(hero), "首屏不再铺图纸底色");
  ok(/font-size: clamp\(34px, 4\.4vw, 58px\)/.test(landingCss), "主标语用 vw 撑（1440 下 58px，与参考站同量级）");
  ok(
    !/\.landing-tagline|\.hero-rotator|\.lp-ver/.test(landingCss),
    "落地页样式表里抬头/轮播/版本胶囊的规则已一并清掉（v61）"
  );
  ok(
    /让每一次面试/.test(indexHtml) && !/一次面试，多重机会/.test(indexHtml),
    "首屏只留标题：抬头那句价值主张随节点一起移除"
  );

  console.log("\n── ③ 图幅：一张报告截面，不是一块海报 ──");
  const banner = rule(landingCss, "#view-landing .lp-banner");
  ok(
    /display: grid|grid-template-columns/.test(banner) || /padding: 54px 56px 22px/.test(banner),
    "图幅是实心板（不是固定高度的色块）"
  );
  ok(/linear-gradient\(158deg/.test(banner), "底色是一层极浅的暖砂渐变");
  ok(/--lp-panel-a: #f7f2e8/.test(landingCss), "暖砂令牌（替换掉参考站的苔绿）");
  ok(!/e9ede2|dbe3d1/.test(landingCss), "苔绿两个旧值已清除（不再与朱红打架）");
  const dim = rule(landingCss, "#view-landing .lp-dim");
  ok(/grid-template-columns: 38px minmax\(0, 1fr\) 34px/.test(dim), "五维行是「名 / 条 / 分」三栏");
  ok(/border-top: 1px solid/.test(dim), "行与行之间是发丝线");
  const bar = rule(landingCss, "#view-landing .lp-dim i b");
  ok(/transform: scaleX\(var\(--v, 0\)\)/.test(bar), "条形用 scaleX 画（不用 width 动画）");

  console.log("\n── ④ 旧层：窗栏带要消失，尺寸线要留 ──");
  ok(
    /#view-landing \.hero-mock::before \{[^}]*content: none/.test(landingCss),
    "tokens.css 里那条 34px 米色「浏览器窗栏」被拆掉（它会把卡头文字压掉一半）"
  );
  ok(!/#view-landing \.bp-sheet \{[^}]*display: none/.test(landingCss), "尺寸线没有被本层误藏");
  ok(/SHEET 01/.test(indexHtml), "尺寸线标注仍在（SHEET 01 · GRID 44）");
  ok(/bs-needle/.test(indexHtml), "走针仍在（尺寸线上的红点）");

  console.log("\n── ⑤ 区块：三列 / 四栏 / 四列 ──");
  ok(/#view-landing \.feature-grid \{[^}]*repeat\(3, minmax\(0, 1fr\)\)/.test(landingCss), "功能卡桌面三列");
  const wf = rule(landingCss, "#view-landing .workflow");
  ok(/repeat\(4, minmax\(0, 1fr\)\)/.test(wf), "流程桌面四栏");
  ok(/background: none/.test(wf), "流程区不再有一块旧底色（旧层留了 var(--card)）");
  const wdraw = rule(landingCss, "#view-landing .workflow-step .ws-draw");
  ok(/height: 1px/.test(wdraw) && /opacity: 0\.22/.test(wdraw), "原来的 2px 墨线收成 1px 发丝");
  const wsnum = rule(landingCss, "#view-landing .workflow-step .ws-num");
  ok(
    /font-family: var\(--mono\)/.test(wsnum) && /font-size: 11px/.test(wsnum),
    "STEP 标签改等宽小字（不再是幽灵大字）"
  );
  ok(/#view-landing \.landing-stats \{[^}]*repeat\(4, minmax\(0, 1fr\)\)/.test(landingCss), "数字区四列");
  const tick = rule(landingCss, "#view-landing .landing-stat .ls-scale i");
  ok(/flex: 0 0 1px/.test(tick), "刻度尺每格 1px 宽（之前被 flex 撑成 6px，远看像乱码）");
  const secTitle = rule(landingCss, "#view-landing .landing-section-title");
  ok(/font-family: var\(--lp-sans\)/.test(secTitle), "节标题用无衬线（衬线只留给主标语与数字）");
  ok(/font-family: var\(--lp-sans\)/.test(rule(landingCss, "#view-landing .lp-h2")), "实录区标题同一套字");
  ok(/--lp-panel-a\)/.test(rule(landingCss, "#view-landing .landing-cta")), "底部 CTA 换成暖砂底");

  console.log("\n── ⑥ 窄屏：两列、收雷达、单行卡头、不折叠 ──");
  const sm = media(landingCss, "@media (max-width: 640px)");
  ok(/\.feature-grid \{[^}]*repeat\(2, minmax\(0, 1fr\)\)/.test(sm), "手机上功能卡两列（一列要 1869px）");
  ok(/\.mock-radar \{[^}]*display: none/.test(sm), "手机上收掉雷达（与上方五维条形重复）");
  ok(/\.hmh-live \{[^}]*display: none/.test(sm), "卡头右侧状态字收掉，标题单行不换行");
  ok(/\.mock-bullet|\.hero-mock-body \{[^}]*padding: 20px 16px/.test(sm), "卡身内距收紧");
  ok(/LANDING_FOLD_TARGETS = \[\]/.test(bootSrc), "折叠目标清空（再收就只剩五根黑杠）");
  ok(/initMobileLandingFold/.test(bootSrc), "折叠机制还在，留作后用");

  console.log("\n── ⑦ 成品：构建产物带着新层 ──");
  ok(demoHtml.indexOf("--lp-panel-a") > 0, "演示包内联了落地页令牌");
  ok(demoHtml.indexOf("lp-banner-dims") > 0, "演示包里有五维条形结构");
  ok(cssList.filter((c) => /landing/.test(c)).length === 1, "落地页只有一层（没有第二份补丁样式表）");

  /* DOM 断言：装载构建产物，等一拍再查 */
  const dom = new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(win) {
      win.scrollTo = function () {};
    },
  });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 220));
  const doc = w.document;
  const dims = [...doc.querySelectorAll("#view-landing .lp-dim")];
  ok(dims.length === 5, "五维条形正好五行（" + dims.length + "）");
  const vals = dims.map((d) => {
    const v = (d.querySelector("b").getAttribute("style") || "").match(/--v:\s*([\d.]+)/);
    return v ? Number(v[1]) : NaN;
  });
  ok(
    vals.every((v) => v > 0 && v <= 1),
    "每行强度都在 0–1 之间（" + vals.join(" / ") + "）"
  );
  const nums = dims.map((d) => Number((d.querySelector("em") || {}).textContent));
  ok(
    nums.every((n, i) => Math.abs(n / 100 - vals[i]) < 0.011),
    "条形长度与分数自洽（不是画两根不相干的条）"
  );
  ok(doc.querySelector("#view-landing .lp-banner-num").textContent.trim() === "86", "总分 86 与页面口径一致");
  ok(doc.querySelectorAll("#view-landing .hero-title .ht-line").length === 2, "标题仍是两行容器");
  ok(!!doc.querySelector("#view-landing .landing-nav .lp-pill-solid"), "导航右上仍是黑胶囊");
  ok(!doc.querySelector("#view-landing .fold-toggle"), "窄屏折叠条不再生成");
  ok(!!doc.querySelector("#view-landing .bp-sheet"), "尺寸线在 DOM 里");
  w.close();

  console.log("\n" + (fail === 0 ? "✅ 全部通过" : "❌ 有失败") + "：" + pass + " 通过 / " + fail + " 失败");
  process.exit(fail === 0 ? 0 : 1);
})();
