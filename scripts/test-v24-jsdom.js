/* v24 jsdom 测试：动态层（Blueprint Motion Kit）——粒子场 / 涟漪 / 视差 / 微交互 / 降级链
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v24-jsdom.js
 * 说明：粒子模块的降级链（无 context / reduced-motion / 正常路径）用 beforeParse
 *       分别 mock getContext / matchMedia / rAF 后各建一个 JSDOM 实例验证。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label); }
}

/* ---------- 假 2d 上下文：记录调用 ---------- */
function makeFakeCtx() {
  const calls = { fillRect: 0, strokeRect: 0, stroke: 0, clearRect: 0 };
  const ctx = {
    calls,
    fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
    setTransform() {}, clearRect() { calls.clearRect++; },
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() { calls.stroke++; },
    fillRect() { calls.fillRect++; }, strokeRect() { calls.strokeRect++; },
  };
  return ctx;
}

/* ---------- 实例工厂 ---------- */
function makeDom(opts) {
  const o = opts || {};
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => {
    const msg = (e && e.message) || String(e);
    if (!/^Not implemented:/.test(msg)) errors.push(msg);
  });
  vc.on("error", (...a) => errors.push(a.join(" ")));
  const fake = o.fakeCtx || null;
  let rafCount = 0;
  const dom = new JSDOM(html, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      if (o.reduced) {
        window.matchMedia = q => ({ matches: /reduce/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      }
      if (fake) {
        window.HTMLCanvasElement.prototype.getContext = function () { return fake; };
      }
      const nativeRaf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => { rafCount++; return nativeRaf(cb); };
    },
  });
  /* jsdom 构造返回时 readyState 仍为 loading——粒子层 boot 等 DOMContentLoaded，先 settle */
  const settle = () => new Promise(res => {
    if (dom.window.document.readyState === "complete") return res();
    dom.window.document.addEventListener("DOMContentLoaded", res, { once: true });
    setTimeout(res, 800);
  });
  return { dom, errors, rafCount: () => rafCount, settle };
}

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v24 jsdom 测试（动态层 Blueprint Motion Kit）===");

  /* ================================================================
   * 路径 A：正常路径（mock canvas 2d）—— 粒子运行 + 涟漪 + 视差
   * ================================================================ */
  const fakeA = makeFakeCtx();
  const A = makeDom({ fakeCtx: fakeA });
  await A.settle();
  await new Promise(r => setTimeout(r, 60));   // 等首帧 rAF 驱动绘制
  const wA = A.dom.window, dA = wA.document;

  /* ---------- A1. 粒子场注入与运行 ---------- */
  ok(!!dA.querySelector("canvas.bp-particles"), "粒子画布已注入 body（.bp-particles）");
  ok(dA.querySelector("canvas.bp-particles").getAttribute("aria-hidden") === "true", "粒子画布对辅助技术隐藏");
  ok(wA.__bpFx && wA.__bpFx.running === true, "__bpFx.running = true（rAF 循环已启动）");
  ok(wA.__bpFx && wA.__bpFx.particles >= 30 && wA.__bpFx.particles <= 90, "粒子数在 30–90 封顶区间（当前 " + (wA.__bpFx && wA.__bpFx.particles) + "）");
  ok(fakeA.calls.fillRect > 0, "粒子以方点绘制（fillRect 调用 " + fakeA.calls.fillRect + " 次）");
  ok(fakeA.calls.stroke > 0, "近距离连线已绘制（stroke 调用 " + fakeA.calls.stroke + " 次）");
  ok(fakeA.calls.clearRect > 0, "每帧清屏（clearRect 调用）");

  /* ---------- A2. 鼠标斥力不报错 ---------- */
  let mouseErr = "";
  try {
    wA.dispatchEvent(new wA.MouseEvent("mousemove", { clientX: 100, clientY: 100 }));
    wA.dispatchEvent(new wA.MouseEvent("mousemove", { clientX: 640, clientY: 400 }));
  } catch (e) { mouseErr = String(e); }
  ok(!mouseErr, "mousemove 斥力交互无异常" + (mouseErr ? " → " + mouseErr : ""));

  /* ---------- A3. 点击涟漪（仅落地页视图） ---------- */
  const strokeBefore = fakeA.calls.strokeRect;
  ok(!!dA.querySelector("#view-landing.active"), "初始视图为落地页（涟漪激活条件）");
  try {
    wA.dispatchEvent(new wA.MouseEvent("click", { clientX: 300, clientY: 300, bubbles: true }));
  } catch (e) { /* window 级 click 无 target.closest，代码内 try 放行 */ }
  return new Promise(r => setTimeout(r, 60))            // 等下一帧绘制涟漪
    .then(() => {
      ok(fakeA.calls.strokeRect > strokeBefore, "点击产生方形涟漪（strokeRect 增量 " + (fakeA.calls.strokeRect - strokeBefore) + "）");
      return runParallaxAndRest();
    });

  /* ---------- A4. Hero 视差 ---------- */
  async function runParallaxAndRest() {
    const spec = dA.querySelector(".hero-spec");
    const mock = dA.querySelector(".hero-mock");
    ok(!!spec && !!mock, "Hero 双栏元素存在（视差目标）");
    wA.dispatchEvent(new wA.MouseEvent("mousemove", { clientX: 40, clientY: 40 }));
    await new Promise(resolve => wA.requestAnimationFrame(() => wA.requestAnimationFrame(resolve)));
    const st = spec.style.transform || "";
    const mt = mock.style.transform || "";
    ok(/translate3d\(-?\d+(\.\d+)?px/.test(st), "规格面板视差位移（" + st + "）");
    ok(/translate3d\(-?\d+(\.\d+)?px/.test(mt), "预览窗反向视差位移（" + mt + "）");
    const num = s => { const m = (s || "").match(/\(\s*(-?\d+(?:\.\d+)?)px/); return m ? parseFloat(m[1]) : NaN; };
    ok(num(st) * num(mt) < 0, "双栏视差方向相反（空间深度，spec " + num(st) + "px vs mock " + num(mt) + "px）");
    wA.dispatchEvent(new wA.MouseEvent("mouseout"));
    await new Promise(r => setTimeout(r, 500));
    ok(spec.style.transform === "" && mock.style.transform === "", "mouseout 后视差回弹（transition 兜底）");
    await runReduced();
  }

  /* ================================================================ */
  async function runReduced() {
    console.log("\n--- 降级链：reduced-motion 静态帧 ---");
    const fakeR = makeFakeCtx();
    const R = makeDom({ fakeCtx: fakeR, reduced: true });
    await R.settle();
    const wR = R.dom.window, dR = wR.document;
    ok(!!dR.querySelector("canvas.bp-particles"), "reduced-motion 下画布仍注入（静态帧可见）");
    ok(wR.__bpFx && wR.__bpFx.staticOnly === true, "__bpFx.staticOnly = true");
    ok(wR.__bpFx && wR.__bpFx.running === false, "reduced-motion 下不启动 rAF 循环");
    ok(R.rafCount() === 0, "reduced-motion 下零 rAF 调度（当前 " + R.rafCount() + "）");
    ok(fakeR.calls.fillRect > 0, "静态帧仍绘制一帧粒子（fillRect " + fakeR.calls.fillRect + " 次）");

    /* ---------- CSS 层：动效宪法与微交互 ---------- */
    const css = dA.querySelector("style").textContent;
    const has = s => css.includes(s);

    /* B1. 粒子层 */
    ok(/\.bp-particles\s*\{[^}]*position:\s*fixed/.test(css), ".bp-particles fixed 全站背景层");
    ok(/\.bp-particles\s*\{[^}]*pointer-events:\s*none/.test(css), "粒子层零指针拦截");
    ok(/\.bp-particles\s*\{[^}]*z-index:\s*0/.test(css), "粒子层 z-index 0（内容之下）");
    ok(/\.landing, \.app-shell\s*\{[^}]*z-index:\s*1/.test(css), "内容容器抬升 z-index 1（永不被粒子遮挡）");

    /* B2. 按钮涟漪 */
    ok(/@keyframes btnRipple/.test(css), "btnRipple 关键帧已定义");
    ok(/\.btn:active::after\s*\{[^}]*animation:\s*btnRipple/.test(css), "按钮按压触发方形涟漪");
    ok(/\.btn\s*\{[^}]*overflow:\s*hidden/.test(css), "按钮 overflow hidden（涟漪不溢出直角边界）");

    /* B3. 消息气泡进入 */
    ok(/@keyframes msgIn\s*\{[^}]*translateX\(-10px\)/.test(css), "msgIn 从左淡入（X 轴语言）");
    ok(/\.msg\s*\{[^}]*animation:\s*msgIn/.test(css), ".msg 进入动画");
    ok(!/\.msg\s*\{[^}]*translateY/.test(css), ".msg 无 translateY 上浮");

    /* B4. 雷达扫描 */
    ok(/\.radar-sweep\s*\{[^}]*animation:\s*radarSpin/.test(css), "雷达扫描线旋转动画");
    ok(/@keyframes radarSpin/.test(css), "radarSpin 关键帧");
    ok(html.includes('class="radar-sweep"'), "雷达 svg 含扫描线元素");

    /* B5. 导航下划线扫入 */
    ok(/\.landing-nav-links a::after\s*\{[^}]*transform:\s*scaleX\(0\)/.test(css), "导航下划线初始 scaleX(0)");
    ok(/\.landing-nav-links a:hover::after[^}]*scaleX\(1\)/.test(css), "导航 hover 下划线展开");
    ok(/\.landing-nav-links a:focus-visible::after[^}]*scaleX\(1\)/.test(css), "导航键盘焦点下划线展开");

    /* B6. 取景角标延展 + 顶规点亮 + 视差过渡 */
    ok(/\.bp-crop:hover::before, \.bp-crop:hover::after\s*\{[^}]*width:\s*20px/.test(css), "取景角标 hover 延展 13→20px");
    ok(/\.page-card:hover\s*\{[^}]*border-top-color:\s*var\(--brand\)/.test(css), "page-card hover 顶规点亮朱红");
    ok(/\.hero-spec, \.hero-mock\s*\{[^}]*transition:\s*transform/.test(css), "视差元素 transition 兜底（mouseout 回弹）");

    /* B7. 动效宪法覆盖动态层 */
    const rmBlock = (css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/g) || []).join("\n");
    ok(/\.radar-sweep\s*\{\s*animation:\s*none/.test(rmBlock), "reduced-motion 下扫描线停转");
    ok(/\.hero-spec, \.hero-mock\s*\{\s*transition:\s*none/.test(rmBlock), "reduced-motion 下视差过渡关闭");

    /* ---------- C. 无 context 降级（jsdom 原生 getContext 返回 null） ---------- */
    console.log("\n--- 降级链：无 2d context ---");
    const N = makeDom({});
    await N.settle();
    await new Promise(r => setTimeout(r, 30));
    const dN = N.dom.window.document;
    ok(!dN.querySelector("canvas.bp-particles"), "无 2d context 时画布被移除（整体降级）");
    ok(N.errors.length === 0, "降级过程无脚本错误" + (N.errors.length ? " → " + N.errors[0] : ""));

    console.log(`\n===== v24 结果：${pass} 通过，${fail} 失败 =====`);
    process.exit(fail ? 1 : 0);
  }
}
