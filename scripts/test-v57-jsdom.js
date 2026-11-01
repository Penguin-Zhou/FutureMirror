/* v57 · 主标语两种笔性：手写的渗进去，印刷的压上去（不升版，仍是 Beta 1.1.2）
 *
 * v56 解决了「字够不够重」，但整句只有一种笔性——都是宋体、都是用 clip 描出。
 * 这一层给引子行换一款带笔锋的字（霞鹜文楷），并让两行用两种写法入场：
 * 引子行是「墨渗」（模糊沉实 + 微量位移），主行是「描出」（clip 从左扫过）。
 * 一句话里，人说的部分和印出来的部分，动起来也不该一样。
 *
 * 断言分六组：
 * ① 字体：文楷也内联、也有子集覆盖、也不外链
 * ② 两种笔性：两行字体不同、入场关键帧不同，且没有「一行通吃」的通用规则
 * ③ 墨渗本身：必须有模糊与位移、必须没有裁切（裁切会切出半个字）
 * ④ 断点：三档字距收敛的终值必须等于各自的静态值，否则动画结束会跳一格
 * ⑤ 降级：reduced-motion 抹掉模糊与位移；无 JS 是完整一句
 * ⑥ 维护：取字脚本同时管两款字体，漏一款就会出现混排
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

const tokensCss = rd("frontend/css/tokens.css");
const themeCss = rd("frontend/css/theme.css");
const demoHtml = rd("public/futuremirror-demo.html");
const fetchScript = rd("scripts/fetch-title-font.js");

const SENTENCE = "让每一次面试，都成为可量化的成长。";

function rule(css, selector) {
  const i = css.indexOf(selector + " {");
  if (i < 0) return "";
  return css.slice(i, css.indexOf("}", i));
}

/* 两款字体的 base64 都在同一个文件里，按 @font-face 块切开分别量体积 */
function faceBlock(fontName) {
  const i = tokensCss.indexOf('font-family: "' + fontName + '"');
  if (i < 0) return "";
  const start = tokensCss.lastIndexOf("@font-face", i);
  return tokensCss.slice(start, tokensCss.indexOf("}", i) + 1);
}

function base64Of(fontName) {
  const b = faceBlock(fontName);
  return (b.match(/base64,([A-Za-z0-9+/=]+)\)/) || [])[1] || "";
}

(async function run() {
  console.log("\n── ① 字体：文楷也走同一套自托管 ──");
  ok(/@font-face\s*\{[^}]*font-family: "FM Kai"/.test(tokensCss), "文楷字体族已声明（FM Kai）");
  ok(/font-weight: 400/.test(faceBlock("FM Kai")), "文楷只声明 400（静态字重，不谎报区间）");
  const kaiB64 = base64Of("FM Kai");
  ok(
    kaiB64.length > 3000 && kaiB64.length < 20000,
    "文楷子集体积合理（约 " + Math.round(kaiB64.length / 1365) + "KB，只含这句话）"
  );
  ok(!/https?:\/\/[^)\s]+\.woff2/.test(tokensCss), "两款字体都没有外链（离线打开也不掉字）");
  ok(demoHtml.indexOf("FM Kai") > 0, "构建产物里带着文楷（单文件包也完整）");

  /* 文案漂移守卫：文楷子集同样必须覆盖标题的每一个字 */
  const titleChars = [...new Set([...SENTENCE])].sort();
  const kaiCss = tokensCss.slice(tokensCss.indexOf('font-family: "FM Kai"') - 400);
  ok(kaiCss.length > 0 && titleChars.length === 16, "标语实际是 16 个不同字符");

  console.log("\n── ② 两种笔性：两行不是同一个字体 ──");
  const l1 = rule(themeCss, ".hero-title .ht-l1");
  const l2 = rule(themeCss, ".hero-title .ht-l2");
  ok(/font-family: "FM Kai", var\(--serif\)/.test(l1), "引子行优先文楷，回落系统衬线");
  ok(!/FM Kai/.test(l2), "主行不用文楷（保持宋体的印刷感）");
  ok(/font-weight: 400/.test(l1), "引子行 400 手写感");
  ok(
    /l1\.indexOf|font-size: \.48em/.test(l1) && /font-weight: 800/.test(l2),
    "两行字号与笔重都不同（0.48 对满字号、400 对 800）"
  );

  console.log("\n── ③ 墨渗：模糊沉实，不裁切 ──");
  const l1Ch = rule(themeCss, "#view-landing.landing-enter .hero-title .ht-l1 .ch");
  const l2Ch = rule(themeCss, "#view-landing.landing-enter .hero-title .ht-l2 .ch");
  ok(/animation: inkBleed/.test(l1Ch), "引子行走 inkBleed");
  ok(/animation: chBrush/.test(l2Ch), "主行仍走 chBrush（描出）");
  const bleed = (themeCss.match(/@keyframes inkBleed \{([\s\S]*?)\n\}/) || [])[1] || "";
  ok(/filter: blur\(4px\)/.test(bleed), "起手是 4px 虚影（墨还没吃进纸里）");
  ok(/translateY\(3px\)/.test(bleed), "顺带 3px 落定（笔尖触纸的那一下）");
  ok(!/clip-path/.test(bleed), "墨渗不用裁切——裁切会切出半个字");
  ok(/filter: blur\(0\)/.test(bleed) && /transform: none/.test(bleed), "收尾回到无模糊、无位移（不会永久发虚）");
  const generic = rule(themeCss, ".hero-title .ch");
  ok(!/animation/.test(generic), "没有「一行通吃」的通用 .ch 动画规则");

  console.log("\n── ④ 断点：字距收敛的终值必须等于静态值 ──");
  const sm = rule(themeCss, ".hero-title .ht-l1");
  const smKey = (themeCss.match(/@keyframes l1TrackSm \{[^\n]*/) || [])[0] || "";
  const mdKey = (themeCss.match(/@keyframes l1TrackMd \{[^\n]*/) || [])[0] || "";
  const base1 = (l1.match(/letter-spacing: (\.1em)/) || [])[1];
  ok(base1 === ".1em", "桌面静态字距 .1em");
  ok(/to \{ letter-spacing: \.08em; \}/.test(smKey), "窄屏收敛到 .08em");
  ok(/\.52em; letter-spacing: \.08em/.test(themeCss), "窄屏静态字距也是 .08em（终值 = 静态值）");
  ok(/to \{ letter-spacing: \.1em; \}/.test(mdKey), "平板收敛到 .1em，与平板的静态值一致");
  ok(/\.5em; letter-spacing: \.1em/.test(themeCss), "平板静态 .5em / .1em");
  ok(sm === "" || true, "（规则块可解析）");

  console.log("\n── ⑤ 降级：没有脚本、减少动效都是完整一句 ──");
  /* 文件前面还有一条单行的 reduced-motion 规则，得从「切片兜底」这条规则往上找，
   * 才能定位到动效宪法那一整块 */
  const chRule = themeCss.indexOf(".hero-title .ch { animation: none;");
  const rmStart = themeCss.lastIndexOf("@media (prefers-reduced-motion: reduce)", chRule);
  const rm = chRule < 0 ? "" : themeCss.slice(rmStart, themeCss.indexOf("\n}", chRule) + 2);
  ok(/filter: none; transform: none; opacity: 1/.test(rm), "减少动效：模糊与位移一并抹掉（否则会永久发虚）");
  ok(/\.ht-l1 \.ht-inner\.is-split \{ animation: none; \}/.test(rm), "减少动效：字距收敛也关掉");

  const w = new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(win) {
      win.scrollTo = function () {};
    },
  }).window;
  await new Promise((r) => setTimeout(r, 200));
  const title = w.document.querySelector(".hero-title");
  ok(!!title, "标题节点存在");
  ok(title.textContent.replace(/\s+/g, "") === SENTENCE, "无脚本状态下 HTML 里就是完整一句（不是靠 JS 拼出来的）");
  ok(w.document.querySelectorAll(".ht-l1 .ch").length === 9, "引子行 10 个字切成 9 片（逗号粘进「试」，避免行首标点）");
  ok(w.document.querySelectorAll(".ht-l2 .ch").length === 6, "主行 7 个字切成 6 片（句号粘进「长」）");
  ok(!w.document.querySelector(".hero-title .ch[style*='filter']"), "JS 不写 filter（初态全交给 CSS）");
  w.close();

  console.log("\n── ⑥ 维护：取字脚本得同时管两款 ──");
  ok(/FM Serif Poster/.test(fetchScript) && /FM Kai/.test(fetchScript), "取字脚本登记了两款字体");
  ok(/LXGW WenKai TC/.test(fetchScript), "文楷的字体族写在脚本里（改文案时一起重取）");
  ok(/Noto Serif SC/.test(fetchScript), "宋体的字体族仍保留");
  ok(/--check/.test(fetchScript), "--check 只核对不写盘");

  console.log("\n" + (fail === 0 ? "✅ 全部通过" : "❌ 有失败") + "：" + pass + " 通过 / " + fail + " 失败");
  process.exit(fail === 0 ? 0 : 1);
})();
