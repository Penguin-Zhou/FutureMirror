/* v55 · 主标语焦点层（不升版，仍是 Beta 1.1.2）
 *
 * 这一层把「首屏」的预算全压在一句话上：标题拆字逐字落笔、四角取景标记从角点
 * 画出、关键词逐字涂红、其余元素延后到字落完才出现。断言分五组：
 *
 * ① 拆字后文本必须一字不少、顺序不变（最容易出错的地方：标点被并走、
 *    首尾空白被当字、.grad 被清空却忘了把字放回去）；
 * ② 完成态必须独立于脚本：删掉 JS、或用户开了 reduced-motion，标题要
 *    完整可读，不能停在一半透明的字上；
 * ③ 动画契约：只走 clip-path，不给 1px 发丝线加模糊、不加负向位移；
 * ④ 节奏：所有 animation-delay 必须压得过 animation 简写（v54 那批被
 *    简写重置成 0s，看着有错帧其实同时出现——这条用选择器权重兜住）；
 * ⑤ 交互：hover 重扫有节流，定时重扫受视口与后台标签页约束。
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

const SENTENCE = "让每一次面试，都成为可量化的成长。";

function rule(css, selector) {
  const i = css.indexOf(selector + " {");
  if (i < 0) return "";
  return css.slice(i, css.indexOf("}", i));
}

function boot(extra) {
  const dom = new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: extra && extra.plain ? undefined : "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(win) {
      if (extra && extra.matchMedia) win.matchMedia = extra.matchMedia;
      win.scrollTo = function () {};
    },
  });
  return dom.window;
}

(async function run() {
  /* ---------- 未执行脚本：标题必须是完整一句 ---------- */
  const wPlain = boot({ plain: true });
  const plainTitle = wPlain.document.querySelector("#view-landing .hero-title");
  ok(!!plainTitle, "标题容器存在");
  ok(plainTitle.textContent.replace(/\s+/g, "") === SENTENCE, "未执行脚本时标题就是完整一句（无 JS 不残缺）");
  ok(plainTitle.querySelectorAll(".ch").length === 0, "无 JS 时不存在逐字切片（纯文本）");
  wPlain.close();

  /* ---------- 运行时 ---------- */
  const w = boot();
  await new Promise((r) => setTimeout(r, 120));
  const doc = w.document;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => [...doc.querySelectorAll(s)];
  const FX = w.__bpLanding;
  const title = $("#view-landing .hero-title");

  /* ① 拆字：一字不少、顺序不变 */
  ok(!!FX, "__bpLanding 已挂上（动态层启动）");
  ok(FX.split === true, "拆字成功（FX.split）");
  ok(FX.chars === 15, "字数 15（16 字含句号，句号并入末字：" + FX.chars + "）");
  ok($$(".hero-title .ch").length === 15, "DOM 里共 15 个 .ch");
  ok(
    $$(".hero-title .ch").every((c) => c.tagName === "SPAN"),
    "每个切片都是 span（inline-block 才能各自裁切）"
  );
  ok(title.textContent.replace(/\s+/g, "") === SENTENCE, "拆完仍是原句（顺序与标点都没丢）");
  const idx = $$(".hero-title .ch").map((c) => c.style.getPropertyValue("--i"));
  ok(idx.join(",") === "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14", "序号 0–14 连续无重复（延迟靠它递进）");
  ok($$(".hero-title .ht-line").length === 2, "两行结构保留（第二行高亮不被拆散）");
  ok(
    $$(".hero-title .ht-inner").every((i) => i.classList.contains("is-split")),
    "两层都标记 is-split（关掉旧的整行揭载）"
  );

  const grad = $(".hero-title .grad");
  ok(!!grad, "关键词容器仍在");
  ok(grad.classList.contains("is-chunked"), "关键词标记 is-chunked（整块背景交给每个字）");
  const gws = [...grad.querySelectorAll(".gw")];
  ok(gws.length === 6, "关键词拆成 6 个字块（可量化的成长）：" + gws.length);
  ok(gws[gws.length - 1].textContent === "长。", "句号并进末字「长。」（避免行首标点）");
  ok(gws[gws.length - 1].classList.contains("gw-end"), "末字带 gw-end（下划线只画到字尾）");
  ok(grad.style.getPropertyValue("--gw0") === "9", "关键词起点序号 --gw0 = 9（涂红逐字延迟的基准）");
  ok(
    $$(".hero-title .ht-inner").every((i) => [...i.childNodes].every((n) => n.nodeType === 1)),
    "行内只剩切片元素（构建器缩进留下的空白已清掉，否则 fit-content 会宽出 40px）"
  );

  /* ② 取景角标 */
  const frame = $(".hero-title .ht-frame");
  ok(!!frame, "取景角标已注入");
  ok(frame.getAttribute("aria-hidden") === "true", "角标纯装饰，对辅助技术隐藏");
  const corners = [...frame.querySelectorAll(".hf-c")];
  ok(corners.length === 4, "四角各一段");
  ok(
    corners.map((c) => c.className.replace("hf-c ", "")).join(",") === "hf-tl,hf-tr,hf-bl,hf-br",
    "四角命名对应四个方位"
  );
  ok(corners.map((c) => c.style.getPropertyValue("--d")).join(",") === "0,70,140,210", "四角落笔错帧 0/70/140/210ms");
  ok(frame.textContent.trim() === "", "角标里没有文字（不参与阅读）");
  ok(!$(".ht-cursor"), "标题下缘不再挂游标（与尺寸线绘图针重复，已收敛）");

  /* ③ CSS 契约：逐字落笔 */
  ok(/\.hero-title \.ch \{ display: inline-block/.test(themeCss), "切片为 inline-block（clip-path 才能各自生效）");
  ok(
    /@keyframes chBrush \{\s*0% \{ opacity: 0; clip-path: inset\(0 100% 0 0\); \}/.test(themeCss),
    "落笔初态自左缘裁出（横向描，不是自上而下砸下来）"
  );
  ok(
    /#view-landing\.landing-enter \.hero-title \.ht-l2 \.ch \{[^}]*animation: chBrush \.42s/.test(themeCss),
    "主行逐字动画 420ms（单字不再是闪一下，墨色先落位、笔锋再扫过）"
  );
  ok(
    /animation-delay: calc\(var\(--i, 0\) \* 22ms \+ 220ms\)/.test(themeCss),
    "步进 22ms、起点 220ms（先让图纸抬头亮起来）"
  );
  const chBase = rule(themeCss, ".hero-title .ch");
  ok(!/opacity:\s*0|clip-path/.test(chBase), "切片基础态不带隐藏（删掉 JS 也是完整可见的）");
  ok(
    /\.landing h1\.hero-title \{\s*position: relative; width: fit-content/.test(themeCss),
    "标题宽收到字宽（角标贴字，不贴 620px 的格子）"
  );
  ok(!/translateY\(-/.test(themeCss), "仍然没有负向位移（沿用全站禁上浮）");
  ok(
    !/\.ht-frame[^}]*box-shadow/.test(themeCss) && !/\.bp-sheet \.bs-needle[^}]*box-shadow/.test(themeCss),
    "角标与针都是 0 投影（蓝图风零投影）"
  );

  /* ④ CSS 契约：角标与呼吸 */
  ok(/\.ht-frame \{[^}]*position: absolute/.test(themeCss), "角标绝对定位，不占文本流");
  ok(
    /\.ht-frame \.hf-tl \{[^}]*border-left-width: 1px; border-top-width: 1px/.test(themeCss),
    "左上角是两条 1px 发丝线（L 形）"
  );
  ["hfDrawTL", "hfDrawTR", "hfDrawBL", "hfDrawBR"].forEach((k, i) => {
    ok(
      new RegExp("@keyframes " + k + " \\{[^}]*clip-path").test(themeCss),
      "角标用 clip-path 画（第 " + (i + 1) + " 向）"
    );
  });
  ok(
    /@keyframes hfFocus \{[^}]*opacity: \.34/.test(themeCss) && /hfFocus[^}]*8s/.test(themeCss.replace(/\n/g, " ")),
    "落定后每 8s 对焦呼吸一次（不是闪一下）"
  );
  ok(/animation-name: hfDrawTL, hfFocus/.test(themeCss), "画角与呼吸两条动画并行（串行会让角标闪一下）");

  /* ⑤ CSS 契约：关键词涂红 */
  const gwBase = rule(themeCss, ".hero-title .gw");
  ok(/background-size: 100% \.1em/.test(gwBase), "关键词基础态铺满（完成态）");
  ok(
    /\.hero-title \.gw\.gw-end \{ background-size: calc\(100% - 1em\) \.1em/.test(themeCss),
    "末字下划线扣掉句号那 1em（不拖出句尾）"
  );
  ok(
    /#view-landing\.landing-enter \.hero-title \.grad\.inked \.gw \{[^}]*transition-delay: calc\(\(var\(--i, 0\) - var\(--gw0, 0\)\) \* 56ms\)/.test(
      themeCss
    ),
    "涂红逐字递进 56ms（从左往右批注过去）"
  );

  /* ⑥ 节奏：delay 必须压得过 animation 简写 */
  ok(
    /#view-landing\.landing-enter \.hero-main > \*:not\(\.hero-title\):not\(\.bp-sheet\):nth-child\(6\) \{[^}]*animation-delay: 1\.48s/.test(
      themeCss
    ),
    "正文延后到 1.48s（字落完才解释）"
  );
  ok(
    /:nth-child\(9\) \{[^}]*animation-delay: 1\.7s/.test(themeCss) &&
      /hero-spec \{ animation-delay: 1\.82s/.test(themeCss),
    "数据行/规格卡最后落位"
  );
  ok(
    !/#view-landing\.landing-enter \.hero-main > :nth-child\(\d\) \{/.test(themeCss),
    "不再有裸 :nth-child 延迟规则（权重低于 animation 简写会被静默重置成 0s）"
  );

  /* ⑦ 运行时行为 */
  ok($("#view-landing").classList.contains("landing-enter"), "首屏处于开场态（landing-enter）");
  const before = $("#view-landing").className;
  FX.enter();
  ok($("#view-landing").className === before, "重复 enter() 幂等（路由切回不重播）");
  const charsBefore = $$(".hero-title .ch").length;
  const r2 = w.eval("(function(){ return 0; })()");
  ok(typeof r2 === "number", "页面脚本可求值（非严格模式隔离问题）");
  ok(charsBefore === 15, "再次进入不会重复拆字（.ch 仍为 15）");

  await new Promise((r) => setTimeout(r, 900));
  ok(grad.classList.contains("inked"), "820ms 后关键词开始涂红（inked）");
  ok(FX.replay() === true, "hover 重扫可触发（replay 返回 true）");
  ok(FX.replay() === false, "1.2s 内重复触发被节流（不会狂重播）");
  ok(FX.pulse === true, "定时重扫已开启（FX.pulse）");
  ok(/if \(document\.hidden \|\| !pulseOn\) return;/.test(landingSrc), "后台标签页或标题出视口时定时重扫空转");
  ok(/12000/.test(landingSrc), "定时重扫 12s 一轮（不抢阅读）");

  /* ⑧ reduced-motion：静态完成态 */
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
  await new Promise((r) => setTimeout(r, 120));
  const FX2 = w2.__bpLanding;
  const t2 = w2.document.querySelector("#view-landing .hero-title");
  ok(!w2.document.getElementById("view-landing").classList.contains("landing-enter"), "reduced-motion：不注入开场态");
  ok(FX2.overture === "static", "reduced-motion：overture = static");
  ok(FX2.pulse === false, "reduced-motion：不起定时重扫");
  ok(t2.textContent.replace(/\s+/g, "") === SENTENCE, "reduced-motion：标题仍是完整一句");
  ok(
    /\.ht-frame, \.bp-sheet \.bs-needle \{ display: none; \}/.test(themeCss),
    "reduced-motion：角标与针不出现（静态页不留半截装饰）"
  );
  ok(
    /#view-landing\.landing-enter \.hero-title \.ch \{ animation: none; clip-path: none; filter: none; transform: none; opacity: 1; \}/.test(
      themeCss
    ),
    "reduced-motion：切片兜底为全可见（连墨渗的模糊与位移也抹掉）"
  );
  w2.close();

  /* ⑨ 产出一致性 */
  ok(indexSrc.includes("bs-needle"), "源页面已加入尺寸线绘图针");
  ok(demoHtml.includes("bs-needle"), "演示包已同步绘图针");
  ok(/function splitTitle\(/.test(landingSrc), "拆字逻辑在落地页动态层里");
  ok(/is-split/.test(themeCss) && /:not\(\.is-split\)/.test(themeCss), "拆字失败仍退回整行揭载（htReveal 兜底还在）");
  ok(/\.ht-frame \{ top: -11px; right: -13px/.test(themeCss), "窄屏角标收到 13px（不撑出横向滚动）");
  ok(/SCALE_TICKS = 12/.test(landingSrc), "v54 的刻度常量未被动到");
  ok(/enterLanding/.test(landingSrc) && /dressTitle/.test(landingSrc), "开场链路：拆字 → 角标 → 进入");

  console.log("\n通过 " + pass + " / " + (pass + fail));
  if (fail) process.exitCode = 1;
  w.close();
})();
