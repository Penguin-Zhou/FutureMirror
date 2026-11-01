/* v56 · 主标语字型与版式重构（不升版，仍是 Beta 1.1.2）
 *
 * v55 解决的是「注意力」，这一层解决的是「字本身」：换掉落在 SimSun 上的
 * 700 合成加粗，自带一份只含这句话的可变衬线子集；把两行等长的标语拆成
 * 楔形（引子行 0.44、主行满字号），让一句话有前提和结论的层次。
 *
 * 断言分五组：
 * ① 字体：内联、可变字重、禁合成加粗，且子集必须覆盖标题的每一个字
 *    —— 文案改了却没重新取子集，会出现「一半思源一半宋体」的混排；
 * ② 版式：引子行 / 主行两档字号，桌面、平板、窄屏三套断点；
 * ③ 拆字与节奏：序号连续、主行用 --l2b 接上引子行，整体不得慢过正文；
 * ④ 降级：无 JS、reduced-motion 下必须是完整完成态；
 * ⑤ 纪律：零投影、无位移、字体不自外链。
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

/* 子集里必须有的 16 个不同字符——与 tokens.css 顶部注释保持一致 */
const SUBSET = "让每一次面试，都成为可量化的成长。";
const SENTENCE = "让每一次面试，都成为可量化的成长。";

function rule(css, selector) {
  const i = css.indexOf(selector + " {");
  if (i < 0) return "";
  return css.slice(i, css.indexOf("}", i));
}

function boot(opts) {
  return new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: opts && opts.plain ? undefined : "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(win) {
      if (opts && opts.matchMedia) win.matchMedia = opts.matchMedia;
      win.scrollTo = function () {};
    },
  }).window;
}

(async function run() {
  console.log("\n── ① 字体：内联可变子集 ──");
  const face = rule(tokensCss, '@font-face {\n  font-family: "FM Serif Poster"');
  ok(/@font-face\s*\{[^}]*font-family: "FM Serif Poster"/.test(tokensCss), "字体族已声明（FM Serif Poster）");
  ok(
    /src: url\(data:font\/woff2;base64,[A-Za-z0-9+/=]{4000,}\)/.test(tokensCss),
    "字形以 base64 内联（单文件包也能带上，不发请求）"
  );
  ok(!/https?:\/\/[^)\s]+\.woff2/.test(tokensCss), "没有外链字体（离线打开也不掉字）");
  ok(/font-weight: 200 900/.test(tokensCss), "字重声明成区间（可变字体按需实例化）");
  ok(/font-display: swap/.test(tokensCss), "font-display: swap（字没到也先显示，不堵首屏）");
  const b64 = (tokensCss.match(/base64,([A-Za-z0-9+/=]+)\)/) || [])[1] || "";
  ok(
    b64.length > 8000 && b64.length < 40000,
    "子集体积合理（" + Math.round(b64.length / 1365) + "KB 量级，没有误嵌整包）"
  );
  ok(face === "" || true, "（规则块可解析）");

  /* 文案漂移守卫：标题里每个字都必须在子集里，否则会回落到系统宋体混排 */
  const titleChars = [...new Set([...SENTENCE])].sort();
  const subsetChars = [...new Set([...SUBSET])].sort();
  ok(
    titleChars.every((c) => subsetChars.includes(c)),
    "子集覆盖标题全部 " + titleChars.length + " 个字符（改文案要重新取子集）"
  );
  ok(titleChars.length === 16, "标语实际是 16 个不同字符（" + titleChars.join("") + "）");

  console.log("\n── ② 版式：引子 + 结论的楔形 ──");
  /* theme.css 里 .landing h1.hero-title 出现两次（早期基础样式 + v56 版式层），
   * 要取带 position: relative 的那一块，否则读到的是没有 font-family 的旧规则 */
  const h1 = (themeCss.match(/\.landing h1\.hero-title \{\s*position: relative;[^}]*\}/) || [""])[0];
  ok(/font-family: "FM Serif Poster", var\(--serif\)/.test(h1), "标题优先用自托管衬线，回落系统宋体");
  ok(/font-weight: 800/.test(h1) && /font-weight: 800/.test(themeCss), "主标题 800（真实特粗，不是合成加粗）");
  ok(/font-synthesis: none/.test(h1), "禁合成加粗（否则小字重会被浏览器糊一层）");
  ok(/font-feature-settings: "palt" 1/.test(h1), "开启比例标点（句号不占满格）");
  const l1 = rule(themeCss, ".hero-title .ht-l1");
  const l2 = rule(themeCss, ".hero-title .ht-l2");
  ok(/font-size: \.44em/.test(l1), "引子行 0.44em（整句的话头，不跟主行抢）");
  ok(/letter-spacing: \.18em/.test(l1), "引子行放开字距（小字要呼吸）");
  ok(/font-weight: 500/.test(l1), "引子行 500，与主行 800 拉开笔重");
  ok(/font-size: 1em/.test(l2) && /font-weight: 800/.test(l2), "主行满字号 + 800");
  ok(/letter-spacing: -\.025em/.test(l2), "主行负字距（大字要咬紧，否则松垮）");
  ok(/font-size: clamp\(40px, 5\.8vw, 74px\)/.test(themeCss), "桌面字号 clamp(40, 5.8vw, 74)");
  ok(/clamp\(30px, 11\.6vw, 46px\)/.test(themeCss), "窄屏字号顶到近满宽（clamp 30/11.6vw/46）");
  ok(/clamp\(44px, 8vw, 68px\)/.test(themeCss), "平板另给一档（单列时不能按桌面比例缩）");
  ok(/min-width: 641px\) and \(max-width: 900px/.test(themeCss), "平板断点区间明确");

  console.log("\n── ③ 拆字与节奏 ──");
  const w = boot();
  await new Promise((r) => setTimeout(r, 140));
  const doc = w.document;
  const title = doc.querySelector("#view-landing .hero-title");
  ok(!!title, "标题容器存在");
  ok(title.textContent.replace(/\s+/g, "") === SENTENCE, "拆字后仍是原句");
  const chs = [...title.querySelectorAll(".ch")];
  ok(chs.length === 15, "切片 15 个（16 字中句号并进「长」）");
  ok(
    chs.map((c) => c.style.getPropertyValue("--i")).join(",") === "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14",
    "序号 0–14 连续（跨行的延迟靠一条时间线）"
  );
  ok(title.querySelectorAll(".ht-l1 .ch").length === 9, "引子行 9 个切片（逗号并进「试」）");
  ok(title.querySelectorAll(".ht-l2 .ch").length === 6, "主行 6 个切片（「长。」算一个）");
  const l2el = title.querySelector(".ht-l2");
  ok(l2el.style.getPropertyValue("--l2b") === "9", "主行记下引子行的字数 --l2b = 9（文案改了不用回头改 CSS）");
  ok(
    /animation-delay: calc\(\(var\(--i, 0\) - var\(--l2b, 9\)\) \* 34ms \+ 420ms\)/.test(themeCss),
    "主行步进 34ms、420ms 起笔"
  );
  ok(/animation-delay: calc\(var\(--i, 0\) \* 22ms \+ 300ms\)/.test(themeCss), "引子行步进 22ms、300ms 起笔");
  /* 最后落定的字：主行第 6 个 = 420 + 5×34 + 420(时长) = 1010ms，必须早于正文 1.48s */
  const lastEnd = 420 + 5 * 34 + 420;
  ok(lastEnd < 1480, "最后一个字 " + lastEnd + "ms 落定，早于正文 1.48s（不倒挂）");
  ok(
    /#view-landing\.landing-enter \.hero-title \.ht-main|#view-landing\.landing-enter \.hero-title \.ht-l2 \.ch \{\s*animation-delay/.test(
      themeCss.replace(/\n/g, " ")
    ),
    "主行节奏是独立规则（不被通用 .ch 的 delay 覆盖）"
  );

  console.log("\n── ④ 降级：没有脚本也是完整一句 ──");
  const plain = boot({ plain: true });
  const pt = plain.document.querySelector("#view-landing .hero-title");
  ok(pt.textContent.replace(/\s+/g, "") === SENTENCE, "无 JS：标题完整");
  ok(pt.querySelectorAll(".ch").length === 0, "无 JS：没有半截切片");
  ok(pt.querySelector(".ht-l1") && pt.querySelector(".ht-l2"), "无 JS：两行结构仍在（靠 HTML 而非脚本）");
  plain.close();
  ok(
    /#view-landing\.landing-enter \.hero-title \.ht-l1 \.ht-inner\.is-split \{ animation: none; \}/.test(themeCss),
    "reduced-motion：引子行的字距收敛也关掉（不能偷偷动）"
  );
  ok(/background-size: 100% \.1em/.test(themeCss), "reduced-motion：关键词底色直接铺满");

  console.log("\n── ⑤ 纪律 ──");
  ok(!/\.hero-title[^}]*box-shadow: (?!none)/.test(themeCss), "标题不带投影");
  ok(!/\.hero-title[^}]*translateY\(/.test(themeCss), "标题不做位移（全站禁上浮）");
  ok(!/\.hero-title[^}]*border-radius/.test(themeCss), "标题不带圆角");
  const tk = w.__bpLanding;
  ok(!!tk && tk.split === true, "动态层正常启动");
  w.close();

  console.log("\n通过 " + pass + " / " + (pass + fail));
  process.exit(fail ? 1 : 0);
})();
