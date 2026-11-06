/* v54 · 落地页动态层（不升版，仍是 1.0.0）
 *
 * 这一层只做「加类」，初态与终态都在 CSS 里：删掉脚本、或用户开了
 * prefers-reduced-motion，页面必须是完整可读的完成态，而不是停在
 * 半透明、半条线、没高亮的状态。断言分四组：
 *
 * ① 图纸开场：尺寸线 / 标题两行 / 关键词高亮，结构与完成态都在；
 * ② 跨行不裁字：.ht-inner 必须是块级——行内元素跨行时 clip-path 只按
 *    首段行盒计算，390px 实测把折到第三行的「长。」整段裁掉了；
 * ③ 区块标尺：4 格、可点击、填充与点亮与导航侦测同源（一次滚动一次算）；
 * ④ 数据刻度 + 窄屏报头：刻度逐格立起；390px 报头不再把按钮压成竖排字。
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

const indexSrc = rd("frontend/index.html");
const demoHtml = rd("public/futuremirror-demo.html");
const themeCss = rd("frontend/css/theme.css");
const landingSrc = rd("frontend/js/features/landingfx.js");
const scrollSrc = rd("frontend/js/core/scrollfx.js");
const routerSrc = rd("frontend/js/core/router.js");

/* 取某条规则的全部声明（允许换行与压缩两种写法） */
function rule(css, selector) {
  const i = css.indexOf(selector + " {");
  if (i < 0) return "";
  return css.slice(i, css.indexOf("}", i));
}

function boot(extra) {
  const vc = new VirtualConsole();
  const dom = new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(win) {
      if (extra && extra.matchMedia) win.matchMedia = extra.matchMedia;
      win.scrollTo = function () {};
    },
  });
  return dom.window;
}

(async function run() {
  const w = boot();
  /* 演示包里的模块挂在 DOMContentLoaded 上：等一拍再断言，否则测的是「还没启动」 */
  await new Promise((r) => setTimeout(r, 80));
  const doc = w.document;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => [...doc.querySelectorAll(s)];

  /* ---------- ① 图纸开场：结构 ---------- */
  const sheet = $("#view-landing .bp-sheet");
  ok(!!sheet, "图幅标注（.bp-sheet）已落位");
  ok(!!sheet.querySelector(".bs-rule"), "尺寸线本体存在");
  ok(!!sheet.querySelector(".bs-tick") && !!sheet.querySelector(".bs-tick-e"), "两端刻度存在");
  ok(/SHEET 01/.test(sheet.querySelector(".bs-label").textContent), "标注读作 SHEET 01（图纸编号）");
  ok(sheet.getAttribute("aria-hidden") === "true", "纯装饰，对辅助技术隐藏");

  const lines = $$("#view-landing .hero-title .ht-line");
  ok(lines.length === 2, "标题拆成两行容器（" + lines.length + "）");
  ok(
    lines.every((l) => !!l.querySelector(".ht-inner")),
    "每行都有内层（揭载作用在这一层）"
  );
  ok(!!lines[1].querySelector(".grad"), "关键词高亮仍落在第二行");

  /* ---------- ② 完成态 & 跨行 ---------- */
  ok(!/\.ht-line \{[^}]*overflow/.test(themeCss), "行容器不裁切（overflow 不设限）");
  ok(
    /\.hero-title \.ht-inner \{\s*display:\s*block/.test(themeCss),
    "内层为块级（行内跨行会被 clip-path 裁掉最后一行）"
  );
  ok(!/\.bs-rule \{[^}]*transform:\s*scaleX\(0\)/.test(themeCss), "尺寸线基础态即完成态（无 JS 也看得见）");
  ok(
    /#view-landing\.landing-enter \.bp-sheet \.bs-rule \{[^}]*animation:\s*bsDraw/.test(themeCss),
    "落笔动画只在 landing-enter 下启用"
  );
  ok(/@keyframes htReveal \{[^}]*clip-path:\s*inset/.test(themeCss), "标题揭载用 clip-path（与既有语言一致）");
  ok(!/translateY\(-/.test(themeCss), "本层无 translateY 负向位移（沿用全站禁上浮）");

  const gradBase = rule(themeCss, ".landing h1.hero-title .grad");
  ok(/background-size:\s*100%/.test(gradBase), "高亮基础态铺满（无 JS 时为完成态）");
  ok(/box-shadow:\s*none/.test(gradBase), "高亮改由底色承担，不再叠内阴影");
  ok(
    /#view-landing\.landing-enter \.hero-title \.grad\.inked \{[^}]*transition:\s*background-size/.test(themeCss),
    "扫过动画走 background-size 过渡"
  );

  /* ---------- ③ 运行时：类只加一次，幂等 ---------- */
  const view = doc.getElementById("view-landing");
  ok(!!view && view.classList.contains("landing-enter"), "首屏已进入图纸开场（landing-enter）");
  ok(w.__bpLanding && w.__bpLanding.overture === true, "__bpLanding.overture = true");
  const before = view.className;
  w.__bpLanding.enter();
  ok(view.className === before, "重复调用 enter() 幂等（路由切回不重播）");
  await new Promise((r) => setTimeout(r, 900));
  ok($(".hero-title .grad").classList.contains("inked"), "760ms 后高亮落定（inked）");

  /* ---------- ④ 区块标尺 ---------- */
  const rail = doc.getElementById("bp-rail");
  ok(!!rail, "右侧标尺已落位");
  ok(rail.getAttribute("aria-label") === "落地页区块导航", "标尺有可读的导航名");
  ok(rail.closest("#view-landing") === view, "标尺属于落地页视图（进应用自然消失）");
  const items = $$("#bp-rail .rail-item");
  ok(items.length === 4, "四格刻度（" + items.length + "）");
  ok(
    items.map((a) => a.getAttribute("href")).join(",") === "#features,#workflow,#stats,#landing-end",
    "刻度锚点与区块一一对应"
  );
  ok(
    items.every((a) => {
      const id = a.getAttribute("href").slice(1);
      return !!doc.getElementById(id);
    }),
    "每个锚点都指向真实存在的区块"
  );
  ok(/\.bp-rail \.rail-item\.is-on \.ri-txt \{[^}]*opacity:\s*1/.test(themeCss), "当前区块展开标签");
  ok(/@media \(max-width: 1199px\) \{ \.bp-rail \{ display: none; \} \}/.test(themeCss), "窄屏收起标尺");
  ok(w.__bpLanding.rail === true, "__bpLanding.rail = true");

  /* 填充与点亮：与导航侦测同一次计算 */
  const de = doc.documentElement;
  Object.defineProperty(de, "scrollHeight", { value: 4000, configurable: true });
  Object.defineProperty(de, "clientHeight", { value: 1000, configurable: true });
  Object.defineProperty(w, "scrollY", { value: 1500, configurable: true });
  const features = doc.getElementById("features");
  features.getBoundingClientRect = () => ({ top: 60, height: 600, bottom: 660, left: 0, right: 0, width: 1080 });
  w.__bpScroll.updateSpy();
  ok(
    rail.style.getPropertyValue("--rail-p") === "50.00%",
    "滚动进度映射到标尺（" + rail.style.getPropertyValue("--rail-p") + "）"
  );
  ok($("#bp-rail .rail-item.is-on").getAttribute("href") === "#features", "当前区块 01 点亮");
  const navActive = $(".landing-nav-links a.active");
  ok(navActive && navActive.getAttribute("href") === "#features", "导航与标尺同源（不会一个亮一个不亮）");

  const end = doc.getElementById("landing-end");
  ok(!!end, "底部 CTA 有锚点（标尺第 4 格可落）");
  features.getBoundingClientRect = () => ({ top: -900, height: 300, bottom: -600, left: 0, right: 0, width: 1080 });
  end.getBoundingClientRect = () => ({ top: 600, height: 300, bottom: 900, left: 0, right: 0, width: 1080 });
  Object.defineProperty(w, "innerHeight", { value: 900, configurable: true });
  w.__bpScroll.updateSpy();
  ok(
    $("#bp-rail .rail-item.is-on") && $("#bp-rail .rail-item.is-on").getAttribute("href") === "#landing-end",
    "滚到底点亮最后一格（CTA 高度进不了 96px 探针）"
  );
  ok(!$(".landing-nav-links a.active"), "导航不为 CTA 点亮（导航里没有这一项）");

  /* ---------- ⑤ 数据条刻度 ---------- */
  const stats = $$("#view-landing .landing-stat");
  ok(stats.length === 4, "四格数据条");
  ok(
    stats.every((s) => !!s.querySelector(".ls-scale")),
    "每格都有刻度尺"
  );
  ok(
    stats.every((s) => s.querySelectorAll(".ls-scale i").length === 12),
    "刻度 12 格"
  );
  ok(w.__bpLanding.ticks === 48, "__bpLanding.ticks = 48（4 × 12）");
  ok(
    stats.every((s) => s.classList.contains("ticks-on")),
    "无 IntersectionObserver 时直接立起（不靠动画才有内容）"
  );
  const ticks = [...stats[0].querySelectorAll(".ls-scale i")];
  ok(
    ticks[0].style.getPropertyValue("--i") === "0" && ticks[11].style.getPropertyValue("--i") === "11",
    "逐格延迟索引 0–11"
  );
  ok(/@keyframes lsTick \{[^}]*scaleY/.test(themeCss), "刻度用 scaleY 立起（不是位移）");

  /* ---------- ⑥ 窄屏报头 ---------- */
  const navMobile = themeCss.slice(themeCss.indexOf("@media (max-width: 640px) {\n  .landing-nav .wrap"));
  ok(/\.landing-nav-meta \.bp-ver,[\s\S]{0,80}display:\s*none/.test(navMobile), "窄屏收起版本章");
  ok(/\.landing-nav-meta \.btn \{[^}]*white-space:\s*nowrap/.test(navMobile), "窄屏按钮不被压成竖排字");
  ok(/\.landing-nav \.logo \{[^}]*white-space:\s*nowrap/.test(navMobile), "窄屏报头不换行");

  /* ---------- ⑦ reduced-motion：只降级、不缺失 ---------- */
  const w2 = boot({
    matchMedia: (q) => ({
      matches: /reduced-motion/.test(q),
      media: q,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  await new Promise((r) => setTimeout(r, 80));
  const v2 = w2.document.getElementById("view-landing");
  ok(!v2.classList.contains("landing-enter"), "reduced-motion：不注入动画初态");
  ok(w2.__bpLanding.overture === "static", "reduced-motion：overture 标记为 static");
  ok(
    $$("#view-landing .landing-stat").every((s) => s.querySelector(".ls-scale")),
    "reduced-motion：刻度仍然存在（静态）"
  );
  w2.close();

  /* ---------- ⑧ 产出一致性 ---------- */
  ok(demoHtml.includes("bp-sheet") && demoHtml.includes("bp-rail"), "演示包已包含新结构");
  ok(/renderMatchResult|bp-rail/.test(indexSrc), "源页面同步（未被构建覆盖）");
  ok(/paintRail/.test(scrollSrc) && /updateScrollSpy/.test(scrollSrc), "标尺绘制在滚动层里，只有一处滚动监听");
  ok(/__bpLanding\.enter/.test(routerSrc), "路由切回落地页时补一次开场（直接落在应用里的用户也能看到）");
  ok(
    /requestAnimationFrame\(step\)/.test(routerSrc) && !/setInterval\(/.test(routerSrc),
    "数字滚动改为 rAF（旧 setInterval 已移除）"
  );
  ok(/SCALE_TICKS = 12/.test(landingSrc), "刻度数量为常量，便于统一");

  console.log("\n通过 " + pass + " / " + (pass + fail));
  if (fail) process.exitCode = 1;
  w.close();
})();
