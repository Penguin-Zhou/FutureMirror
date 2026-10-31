/* v51 · 窄屏「顶部 76px 空白」的根因修复（不升版，仍是 Beta 1.1.2）
 *
 * 症状：375px 下导航条下沿在 100px，而正文从 176px 才开始，中间 76px 是纯空白。
 *
 * 根因只有一句：.app-main 的 padding-top 写了 calc(var(--hdr-h) + 50px)，
 * 它假设「顶栏和导航条都浮在内容之上」。可顶栏是 position: sticky，
 * 本来就在文档流里占掉自己的高度——顶栏被算了两次，多出来的正好是 76px。
 * 同一份错误假设还漏掉了另一半：641–900px 才出现的演示横幅，
 * 流内起点就在导航条底下，被压住 29px（顶栏算多了，横幅却没人管）。
 *
 * 改法：顶部让位交给 header 之后的第一个流内块（#view-app > .wrap）一次付清，
 * 它需要的唯一未知量是导航条的真实高度 → 新增 --navstrip-h，由 syncNavStrip() 实测写入；
 * .app-main 只保留常规内边距。顺带把同样「按单层顶栏算」的四个贴顶定位一起改成两级。
 *
 * 另外发现：--hdr-h 会过期。320px 下从计划页切到面试页，顶栏从 81px 缩到 55px，
 * 变量还停在 81px，导航条就浮在顶栏下方 26px 的空中、主内容反被压住。
 * 高度会随页面换行变化，只在启动/切页时量一次不够 → ResizeObserver 盯着这两个元素。
 */
const fs = require("fs");
const path = require("path");

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

/* 断言必须看「代码」而不是「注释」：本轮把这些旧写法当成反面教材写进了注释，
 * 不剥掉注释的话，说明文字会把自己的断言判成失败。所以下面四个变量都是剥过注释的。 */
const stripCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const stripHtml = (s) => s.replace(/<!--[\s\S]*?-->/g, "");

const pagesCss = stripCss(rd("frontend/css/pages.css"));
const tokensCss = stripCss(rd("frontend/css/tokens.css"));
const bootSrc = rd("frontend/js/core/boot.js");
const routerSrc = rd("frontend/js/core/router.js");
const indexHtml = stripHtml(rd("frontend/index.html"));
const demoHtml = stripHtml(rd("public/futuremirror-demo.html"));

/* 取出所有 `.app-main { ... }` 规则体，逐条看顶部内边距是不是又在硬补顶栏 */
function appMainRules(css) {
  const out = [];
  const re = /\.app-main\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) out.push(m[1]);
  return out;
}

console.log("\n① 主内容区不再把顶栏高度算两次");
{
  const rules = appMainRules(pagesCss).concat(appMainRules(tokensCss));
  ok(rules.length >= 6, `扫到 ${rules.length} 条 .app-main 规则（确认扫描口径没失效）`);

  const badTop = rules.filter((b) => {
    const m = b.match(/padding(?:-top)?\s*:\s*([^;]+);/);
    if (!m) return false;
    const v = m[1];
    // 任何「把顶栏高度再加一截」的写法都算复发：calc(var(--hdr-h)...) 或 100px 以上的写死值
    if (/calc\(\s*var\(--hdr-h/.test(v)) return true;
    const px = v.match(/(\d{2,3})px/);
    return !!px && Number(px[1]) >= 100;
  });
  ok(
    badTop.length === 0,
    `没有一条 .app-main 还在补顶栏高度${badTop.length ? "（残留：" + badTop.join(" | ") + "）" : ""}`
  );
  ok(
    !/\.app-main\s*\{[^}]*padding-top:\s*calc\(var\(--hdr-h/.test(pagesCss),
    "≤900px 的 padding-top 不再是 calc(--hdr-h + 50px)"
  );
  ok(!/\.app-main\s*\{[^}]*padding:\s*104px/.test(pagesCss), "旧常数 104px 已清除");
  ok(!/\.app-main\s*\{[^}]*padding:\s*108px/.test(pagesCss), "旧常数 108px 已清除");
  ok(/html\.kb-chat \.app-main \{\s*padding-top:\s*6px/.test(pagesCss), "键盘态也用常规内边距，不再补一整条顶栏");
}

console.log("\n② 顶部让位由 header 之后的第一个流内块一次付清");
{
  ok(/#view-app > \.wrap \{\s*padding-top:\s*16px/.test(pagesCss), "基础留白 16px（桌面端口径不变）");
  ok(
    /#view-app > \.wrap \{\s*padding-top:\s*calc\(16px \+ var\(--navstrip-h,\s*45px\)\)/.test(pagesCss),
    "窄屏在 16px 之上再加导航条占用高度"
  );
  ok(/:root \{\s*--navstrip-h:\s*0px/.test(pagesCss), "桌面端 --navstrip-h 兜底 0（导航条不显示）");
  ok(
    /@media \(max-width: 900px\) \{\s*:root \{\s*--navstrip-h:\s*45px/.test(pagesCss),
    "窄屏 --navstrip-h 兜底 45px（JS 未跑时也不漏让位）"
  );
  ok(
    !/class="wrap" style="padding-top:16px"/.test(indexHtml),
    "游客提示条容器已去掉内联 padding-top（样式表才能接管）"
  );

  /* 演示横幅确实在 header 之后、main 之前，让位块才轮得到它 */
  const iHdr = indexHtml.indexOf("</header>");
  const iWrap = indexHtml.indexOf('<div class="wrap">', iHdr);
  const iMain = indexHtml.indexOf("<main>", iHdr);
  ok(iWrap > iHdr && iWrap < iMain, "让位块位于 header 之后、main 之前（顺序不能反）");
}

console.log("\n③ syncNavStrip：把导航条实测高度写进 --navstrip-h");
{
  const fnSrc = bootSrc.slice(bootSrc.indexOf("function syncNavStrip"), bootSrc.indexOf("/* v41：窄屏把「辅助工具」"));
  ok(fnSrc.length > 200, "从 boot.js 切到真函数体");

  function makeCtx(opt) {
    const o = opt || {};
    const writes = [];
    const style = {
      props: {},
      getPropertyValue(k) {
        return this.props[k] || "";
      },
      setProperty(k, v) {
        this.props[k] = v;
        writes.push(k + "=" + v);
      },
    };
    const navEl = { offsetHeight: o.h === undefined ? 45 : o.h };
    const doc = {
      querySelector(sel) {
        if (sel === ".app-tabbar") return o.missing ? null : navEl;
        return null;
      },
      documentElement: { style, dataset: {} },
    };
    const gcs = () => ({ display: o.display || "flex" });
    return { doc, gcs, writes, style };
  }

  function run(ctx, extraNames, extraVals) {
    const names = ["document", "getComputedStyle"].concat(extraNames || []);
    const vals = [ctx.doc, ctx.gcs].concat(extraVals || []);
    const fn = new Function(...names, fnSrc + "\n;return syncNavStrip;");
    const f = fn(...vals);
    f();
  }

  const a = makeCtx({ h: 45 });
  run(a);
  ok(a.style.props["--navstrip-h"] === "45px", "导航条可见且高 45 → 写入 45px");

  const b = makeCtx({ h: 0, display: "none" });
  run(b);
  ok(b.style.props["--navstrip-h"] === "0px", "桌面端导航条 display:none → 写 0px（让位退化）");

  const c = makeCtx({ h: 62 });
  run(c);
  ok(c.style.props["--navstrip-h"] === "62px", "高度变了就跟着变（换行/字体放大都能自适应）");

  const d = makeCtx({ missing: true });
  run(d);
  ok(d.writes.length === 0, "找不到导航条时静默不动（不写 0 把让位清零）");

  // 幂等：值没变不重复写，避免 ResizeObserver 回写再触发观察
  const e = makeCtx({ h: 45 });
  run(e);
  const first = e.writes.length;
  run(e);
  ok(e.writes.length === first, "值没变时不重复写自定义属性（避免观察器自激）");

  ok(/syncNavStrip\(\);/.test(bootSrc), "启动流程里调用了一次");
  ok(/addEventListener\("resize", syncNavStrip\)/.test(bootSrc), "窗口尺寸变化时重量");
  ok(
    /typeof syncNavStrip === "function"\) syncNavStrip\(\)/.test(routerSrc),
    "切页后重量（落地页/登录页里导航条是隐藏的）"
  );
}

console.log("\n④ --hdr-h 不能过期：ResizeObserver 盯住顶栏与导航条");
{
  const hasFn = /function watchChromeMetrics\(\)/.test(bootSrc);
  ok(hasFn, "新增 watchChromeMetrics()");
  ok(/new ResizeObserver\(/.test(bootSrc), "用 ResizeObserver 而非一次性测量");
  ok(/ro\.observe\(h\)/.test(bootSrc) && /ro\.observe\(n\)/.test(bootSrc), "顶栏与导航条都被观察");
  ok(/root\.dataset\.chromeRo/.test(bootSrc), "只挂一次（bootApp 重复调用不会叠加观察器）");
  ok(
    /syncHeaderHeight\(\);/.test(bootSrc.slice(bootSrc.indexOf("function watchChromeMetrics"))),
    "回调里同时重量顶栏高度"
  );
  ok(/watchChromeMetrics\(\);/.test(bootSrc), "启动流程里挂上");

  /* 顶栏高度写值也要幂等，否则观察器回调会反复触发自身 */
  const hdrFn = bootSrc.slice(bootSrc.indexOf("function syncHeaderHeight"), bootSrc.indexOf("function syncNavStrip"));
  ok(/getPropertyValue\("--hdr-h"\)\s*!==\s*v \+ "px"/.test(hdrFn), "syncHeaderHeight 写值前先比对，值一样就不写");
}

console.log("\n⑤ 贴顶元素一律跳过「顶栏 + 导航条」两级");
{
  ok(
    /\.fallback-banner \{[^}]*top:\s*calc\(var\(--hdr-h,\s*58px\) \+ var\(--navstrip-h/.test(pagesCss),
    "降级横幅贴顶位置加上导航条（否则停在导航条背后）"
  );
  ok(
    /\.chat-main\.kb-pinned \{[^}]*top:\s*calc\(var\(--hdr-h,\s*58px\) \+ var\(--navstrip-h/.test(pagesCss),
    "键盘态固定对话卡片不再盖住导航条"
  );
  ok(
    /\.offline-banner, \.net-banner \{[^}]*top:\s*calc\(var\(--hdr-h/.test(pagesCss),
    "断网/慢网横幅不再贴 0（贴 0 会被 sticky 顶栏整条盖住）"
  );
  ok(!/\.offline-banner, \.net-banner \{\s*position:\s*sticky;\s*top:\s*0;/.test(pagesCss), "旧写法 top:0 已清除");
}

console.log("\n⑥ 交付一致性：构建产物里确实带着修复");
{
  ok(/--navstrip-h/.test(demoHtml), "演示包内联了 --navstrip-h");
  ok(/function syncNavStrip/.test(demoHtml), "演示包带着实测函数");
  ok(/watchChromeMetrics/.test(demoHtml), "演示包带着尺寸观察");
  ok(!/calc\(var\(--hdr-h, 58px\) \+ 50px\)/.test(demoHtml), "演示包里已无「顶栏 + 50px」的旧留位");
  ok(
    /#view-app > \.wrap\{padding-top:calc\(16px \+ var\(--navstrip-h/.test(demoHtml.replace(/\s+/g, " ")) ||
      /#view-app > \.wrap/.test(demoHtml),
    "演示包带着让位规则"
  );
  ok(!/style="padding-top:16px"/.test(demoHtml), "演示包里内联 padding-top 已被样式表取代");
}

console.log("\n" + "-".repeat(58));
console.log(`合计 ${pass + fail} 项：通过 ${pass}，失败 ${fail}`);
process.exit(fail ? 1 : 0);
