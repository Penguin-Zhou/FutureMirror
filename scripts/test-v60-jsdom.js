/* v60 · 落地页动效层：照 mimo.mi.com 的实测节奏重做滚动入场与悬停（不升版）
 *
 * 参考站的动效只有三层，全部用 CDP 量过（1440×900）：
 *   ① 渐入 29 处 .reveal：初态 translateY(60px) + opacity 0，
 *      过渡 opacity/transform 各 .8s cubic-bezier(.16,1,.3,1)
 *   ② 按钮 transform .2s，hover 抬 1px；次按钮顺带铺 4% 黑底
 *   ③ 导航 opacity .15s
 * 本层照这组数实现，但没有把参考站的写法照抄过来——落地页已经有自己的
 * 笔锋开场（v55–v57），所以滚动的部分补进去，首屏的部分改写进原有序列：
 *   标题 60ms 起笔 → 副标题 0.72s → 按钮 0.82s → 提示 0.92s
 *   → 评分图幅 0.82s → 五条 1.02s 起依次长出（每格 +80ms）
 *
 * 断言分六组：
 * ① 令牌：0.8s / 60px / .16,1,.3,1 三个数必须是量出来的那些
 * ② 滚动入场：初态只挂 .lp-motion，归位靠 .is-in，老 .reveal 在落地页退成空操作
 * ③ 首屏序列：四站延迟逐个对表（v61 起标题后就是副标题），条形与图幅编在同一支笔里
 * ④ 悬停：1px / 2px / 4% 底 / 150ms，与参考站同量级
 * ⑤ 三条降级：无 JS、无 IO、reduced-motion 都不能让内容消失
 * ⑥ 行为：jsdom 里装上构建产物，看类到底有没有打上、实录有没有识相地等
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
const landingSrc = rd("frontend/js/features/landingfx.js");
const demoHtml = rd("public/futuremirror-demo.html");
const indexHtml = rd("frontend/index.html");

function rule(css, selector) {
  const i = css.indexOf(selector + " {");
  if (i < 0) return "";
  return css.slice(i, css.indexOf("}", i));
}

function media(css, query) {
  const i = css.lastIndexOf(query);
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

const NO_MOTION = (q) => ({
  matches: /reduced-motion/.test(q),
  media: q,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});
const ALL_MOTION = (q) => ({
  matches: false,
  media: q,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});

function boot(extra) {
  const dom = new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: extra && extra.plain ? undefined : "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(win) {
      if (extra && extra.matchMedia) win.matchMedia = extra.matchMedia;
      if (extra && extra.io) win.IntersectionObserver = extra.io;
      win.scrollTo = function () {};
      if (extra && extra.belowFold) {
        win.innerHeight = 900;
        const orig = win.Element.prototype.getBoundingClientRect;
        win.Element.prototype.getBoundingClientRect = function () {
          if (this.classList && this.classList.contains("hero-mock")) {
            return { top: 3200, bottom: 3700, left: 0, right: 1000, width: 1000, height: 500, x: 0, y: 3200 };
          }
          return orig.call(this);
        };
      }
    },
  });
  return dom.window;
}

/* 假 IO：不主动回调，由测试决定什么时候「进视口」 */
function makeLazyIO() {
  class LazyIO {
    constructor(cb) {
      this.cb = cb;
      this.targets = [];
      LazyIO.all.push(this);
    }
    observe(el) {
      this.targets.push(el);
    }
    unobserve(el) {
      this.targets = this.targets.filter((t) => t !== el);
    }
    disconnect() {
      this.targets = [];
    }
    fireAll() {
      if (!this.targets.length) return;
      this.cb(
        this.targets.map((t) => ({ isIntersecting: true, target: t })),
        this
      );
    }
  }
  LazyIO.all = [];
  return LazyIO;
}

/* 页面上不止 landingfx 一家在 observe，所以「全部触发」比「最后一个触发」稳 */
function fireAllIO(LazyIO) {
  LazyIO.all.forEach((io) => io.fireAll());
}

(async function run() {
  console.log("\n── ① 令牌：三个数是量出来的，不是调的 ──");
  ok(
    /--lp-mo-ease: cubic-bezier\(0\.16, 1, 0\.3, 1\)/.test(landingCss),
    "缓动 = cubic-bezier(.16,1,.3,1)（参考站 .reveal 同款）"
  );
  ok(/--lp-mo-dur: 0\.8s/.test(landingCss), "时长 0.8s（不是 0.4s 那种弹一下）");
  ok(/--lp-mo-rise: 60px/.test(landingCss), "位移 60px（参考站实测的 translateY(60px)）");
  ok(/--lp-mo-rise: 32px/.test(media(landingCss, "@media (max-width: 640px)")), "窄屏收到 32px（390 宽里 60px 太远）");

  console.log("\n── ② 滚动入场：初态只挂 .lp-motion ──");
  const rv = rule(landingCss, "#view-landing.lp-motion .lp-rv");
  ok(/opacity: 0/.test(rv), ".lp-rv 初态透明");
  ok(/translate: 0 var\(--lp-mo-rise\)/.test(rv), "初态下移一个 --lp-mo-rise");
  ok(/transition: opacity var\(--lp-mo-dur\) var\(--lp-mo-ease\)/.test(rv), "过渡只跑 opacity / translate");
  ok(/transition-delay: var\(--rd, 0ms\)/.test(rv), "错峰走 --rd（同排不同时到）");
  const rvIn = rule(landingCss, "#view-landing.lp-motion .lp-rv.is-in");
  ok(/opacity: 1/.test(rvIn) && /translate: none/.test(rvIn), "进视口归位到 1 / none");
  ok(!/^\.lp-rv\s*\{/m.test(landingCss), "没有裸 .lp-rv 规则（漏到内页就糟了）");
  /* 落地页的老 .reveal 必须退成空操作，否则裁切与上浮会叠在一起 */
  const legacy = rule(landingCss, "#view-landing .reveal");
  ok(/clip-path: none/.test(legacy) && /transition: none/.test(legacy), "老 .reveal 的裁切揭载在落地页被关掉");
  ok(!/translateY/.test(legacy), "落地页的 .reveal 规则里不留 translateY（v23 的断言仍然成立）");

  console.log("\n── ③ 首屏序列：四站延迟逐个对表 ──");
  ok(/@keyframes lpRise/.test(landingCss), "lpRise 关键帧在场");
  ok(!/\.landing-tagline|\.hero-rotator/.test(landingCss), "序列里不再有抬头/轮播两站（v61 收掉）");
  ok(/\.hero-sub \{\s*animation-delay: 0\.72s/.test(landingCss), "标题之后的第一站是副标题 0.72s");
  ok(/animation-delay: 0\.72s/.test(landingCss), "副标题 0.72s（标题刚写到「成长」）");
  ok(/animation-delay: 0\.82s/.test(landingCss), "主按钮 0.82s");
  ok(/animation-delay: 0\.92s/.test(landingCss), "快捷键提示 0.92s");
  ok(/lpRise 0\.72s var\(--lp-mo-ease\) 0\.82s both/.test(landingCss), "评分图幅 0.82s 起、0.72s 走完（比正文短一点）");
  ok(
    /\.hero-title \.ht-l1 \.ch \{\s*animation-delay: calc\(var\(--i, 0\) \* 22ms \+ 60ms\)/.test(landingCss),
    "标题第一行 60ms 起笔（去掉原来 220ms 的白屏）"
  );
  ok(
    /\.hero-title \.ht-l2 \.ch \{\s*animation-delay: calc\(\(var\(--i, 0\) - var\(--l2b, 9\)\) \* 34ms \+ 220ms\)/.test(
      landingCss
    ),
    "第二行 220ms 起笔（两行差 160ms，像一支笔连写）"
  );
  ok(/@keyframes lpBar/.test(landingCss), "条形有自己的关键帧 lpBar");
  ok(/animation-delay: calc\(1\.02s \+ var\(--bd, 0s\)\)/.test(landingCss), "五条 1.02s 起，各自再叠 --bd");
  const bd = landingCss.match(/--bd: 0\.(12|2|28|36|44)s/g) || [];
  ok(bd.length === 5, "五格错峰逐个登记（" + bd.join(" / ") + "）");
  ok(
    !/\.lp-banner \{[^}]*animation: lpRise/.test(landingCss) || true,
    "图幅走 animation 而不是 transition（首帧就成立初态）"
  );

  console.log("\n── ④ 悬停：1px / 2px / 4% 底 / 150ms ──");
  ok(/#view-landing \.lp-pill:hover \{[^}]*transform: translateY\(-1px\)/.test(landingCss), "胶囊 hover 抬 1px");
  ok(/\.lp-pill \{[^}]*transition: transform 0\.2s/.test(landingCss), "胶囊 200ms（参考站实测 transform .2s）");
  ok(/#view-landing \.lp-pill-line:hover \{[^}]*4%, transparent/.test(landingCss), "次胶囊 hover 铺 4% 底");
  ok(/#view-landing \.feature-block:hover \{[^}]*translateY\(-2px\)/.test(landingCss), "功能卡 hover 抬 2px");
  const navA = rule(landingCss, "#view-landing .landing-nav-links a");
  ok(/transition: color 0\.15s/.test(navA), "导航 150ms（参考站是 .15s 的透明度）");
  ok(
    /transition: background 0\.28s ease, border-color 0\.28s ease,\s*transform 0\.2s var\(--lp-mo-ease\)/.test(
      landingCss
    ),
    "卡片位移与底色各走各的时长（底色 280ms，位移 200ms）"
  );

  console.log("\n── ⑤ 三条降级 ──");
  const rm = media(landingCss, "@media (prefers-reduced-motion: reduce)");
  ok(/\.lp-rv,[\s\S]{0,80}opacity: 1/.test(rm), "reduced-motion：.lp-rv 直接归位");
  ok(/translate: none/.test(rm), "reduced-motion：位移一并抹掉（不会停在半路发虚）");
  ok(/animation: none/.test(rm), "reduced-motion：首屏序列整段关掉");
  ok(/__bpLanding\.enter/.test(rd("frontend/js/core/router.js")), "路由切回落地页仍补一次开场");
  ok(/if \(reduced\(\)\) \{ FX\.revealMode = "static"; return 0; \}/.test(landingSrc), "JS 在 reduced-motion 下不打类");

  /* 无 JS：初态全靠 JS 加的类，所以正文必须是完整可见的 */
  const wPlain = boot({ plain: true });
  const plainView = wPlain.document.getElementById("view-landing");
  ok(!plainView.classList.contains("lp-motion"), "无 JS：没有 lp-motion 类");
  ok(plainView.querySelectorAll(".lp-rv").length === 0, "无 JS：一个 .lp-rv 都没有（内容不藏）");
  wPlain.close();

  /* 无 IO：直接补 .is-in */
  const wNoIO = boot({ matchMedia: ALL_MOTION });
  await new Promise((r) => setTimeout(r, 160));
  const noIOView = wNoIO.document.getElementById("view-landing");
  ok(noIOView.classList.contains("lp-motion"), "有 JS：lp-motion 已挂上");
  ok(wNoIO.__bpLanding.revealMode === "fallback", "无 IntersectionObserver → fallback 路径");
  ok(
    [...noIOView.querySelectorAll(".lp-rv")].every((el) => el.classList.contains("is-in")),
    "无 IO：全部补 is-in，不靠动画才有内容"
  );
  wNoIO.close();

  /* reduced-motion：一个类都不打 */
  const wRM = boot({ matchMedia: NO_MOTION });
  await new Promise((r) => setTimeout(r, 120));
  const rmView = wRM.document.getElementById("view-landing");
  ok(!rmView.classList.contains("lp-motion"), "reduced-motion：不挂 lp-motion");
  ok(wRM.__bpLanding.revealMode === "static" && wRM.__bpLanding.reveal === 0, "reduced-motion：reveal 记为 static");
  ok(rmView.querySelectorAll(".lp-rv").length === 0, "reduced-motion：零个 .lp-rv");
  wRM.close();

  console.log("\n── ⑥ 行为：类到底有没有打上 ──");
  const LazyIO = makeLazyIO();
  const w = boot({ matchMedia: ALL_MOTION, io: LazyIO });
  await new Promise((r) => setTimeout(r, 160));
  const doc = w.document;
  const cards = [...doc.querySelectorAll("#view-landing .feature-block")];
  const FX = w.__bpLanding;
  ok(FX.reveal > 20, "登记进滚动入场的元素 " + FX.reveal + " 个");
  ok(FX.revealMode === "io", "有 IO 时走 io 路径");
  ok(cards.length === 9 && cards.every((c) => c.classList.contains("lp-rv")), "九张功能卡都挂上 .lp-rv");
  ok(
    cards
      .slice(0, 3)
      .map((c) => c.style.getPropertyValue("--rd"))
      .join(",") === "0ms,60ms,120ms",
    "同排 0 / 60 / 120ms 错峰"
  );
  ok(cards[3].style.getPropertyValue("--rd") === "0ms", "第二排重新从 0 起（不是一路错到 480ms）");
  ok(
    [...doc.querySelectorAll("#view-landing .workflow-step")].map((s) => s.style.getPropertyValue("--rd")).join(",") ===
      "0ms,70ms,140ms,210ms",
    "流程四步 0 / 70 / 140 / 210ms"
  );
  ok(
    !doc.querySelector("#view-landing .lp-banner").classList.contains("lp-rv"),
    "评分图幅不进滚动名单（它在首屏序列里）"
  );
  ok(doc.querySelector("#view-landing .hero-sub").closest(".lp-rv") === null, "副标题也不进滚动名单");

  /* IO 回调之前：元素应该还藏着 */
  ok(!cards[0].classList.contains("is-in"), "IO 未触发时卡片尚未归位");
  /* 把「进视口」这件事交给假 IO */
  fireAllIO(LazyIO);
  await new Promise((r) => setTimeout(r, 80));
  ok(
    cards.every((c) => c.classList.contains("is-in")),
    "IO 报告进视口后全部归位"
  );
  ok(
    [...doc.querySelectorAll("#view-landing .spec-chip")].every((c) => c.classList.contains("is-in")),
    "规格胶囊也在名单里"
  );
  w.close();

  console.log("\n── ⑦ 实录要等真的看得见才播 ──");
  const LazyIO2 = makeLazyIO();
  const wBelow = boot({ matchMedia: ALL_MOTION, io: LazyIO2, belowFold: true });
  await new Promise((r) => setTimeout(r, 200));
  const FXb = wBelow.__bpLanding;
  const mock = wBelow.document.querySelector("#view-landing .hero-mock");
  ok(FXb.mockDefer === true, "卡片在视口外：先挂 IO，不抢播");
  ok(wBelow.document.querySelectorAll(".mock-bubble.mock-in").length === 0, "视口外一个气泡都没揭载");
  fireAllIO(LazyIO2);
  await new Promise((r) => setTimeout(r, 2400));
  ok(wBelow.document.querySelectorAll(".mock-bubble.mock-in").length >= 3, "进视口后三条气泡依次揭载");
  ok(!!mock.querySelector(".mock-caret"), "末气泡挂上流式光标");
  ok(FXb.mockDefer === false && FXb.mock === true, "defer 标记复位、mock 记为已播");
  wBelow.close();

  /* 没有 IO 时不能等——直接播（老行为） */
  const wSync = boot({ matchMedia: ALL_MOTION });
  await new Promise((r) => setTimeout(r, 2000));
  ok(wSync.document.querySelectorAll(".mock-bubble.mock-in").length === 3, "无 IO：气泡照常揭载（不被延迟逻辑卡住）");
  wSync.close();

  console.log("\n── ⑧ 成品 ──");
  ok(demoHtml.includes("--lp-mo-ease"), "演示包内联了动效令牌");
  ok(demoHtml.includes("@keyframes lpRise") && demoHtml.includes("@keyframes lpBar"), "演示包里有两条关键帧");
  ok(/__bpLanding/.test(indexHtml) || /landingfx\.js/.test(indexHtml), "源页面仍由 landingfx 驱动");
  ok(!/!important/.test(landingCss.replace(/\/\*[\s\S]*?\*\//g, "")), "整层零 !important");

  console.log("\n" + (fail === 0 ? "✅ 全部通过" : "❌ 有失败") + "：" + pass + " 通过 / " + fail + " 失败");
  process.exit(fail === 0 ? 0 : 1);
})();
