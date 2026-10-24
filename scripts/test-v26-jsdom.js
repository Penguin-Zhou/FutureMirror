/* v26 jsdom 测试：全站交互层（Blueprint App Kit）——切页编舞 / 面包屑光标 /
 * 侧栏扫光 / 密码强度计 / CapsLock / LIVE 脉冲 / 数字滚动 / 维度条生长 /
 * 全站十字准线（输入隐身）/ 坐标读数扩展（PG·SEC）/ 开发者绘制线 / 降级链
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v26-jsdom.js
 * 说明：正常路径与 reduced-motion 路径各建一个 JSDOM 实例验证。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

let pass = 0,
  fail = 0;
function ok(cond, label) {
  if (cond) {
    pass++;
    console.log("  ✅ " + label);
  } else {
    fail++;
    console.log("  ❌ " + label);
  }
}

function makeDom(opts) {
  const o = opts || {};
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => {
    const msg = (e && e.message) || String(e);
    if (!/^Not implemented:/.test(msg)) errors.push(msg);
  });
  vc.on("error", (...a) => errors.push(a.join(" ")));
  const dom = new JSDOM(html, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      // CapsLock 探测打桩：jsdom 的 KeyboardEvent.getModifierState 恒 false
      window.__capsOn = false;
      window.KeyboardEvent.prototype.getModifierState = function (k) {
        return k === "CapsLock" && !!window.__capsOn;
      };
      if (o.reduced) {
        window.matchMedia = (q) => ({
          matches: /reduce/.test(q),
          media: q,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
        });
      }
    },
  });
  const settle = () =>
    new Promise((res) => {
      if (dom.window.document.readyState === "complete") return res();
      dom.window.document.addEventListener("DOMContentLoaded", res, { once: true });
      setTimeout(res, 800);
    });
  return { dom, errors, settle };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const raf2 = (w) => new Promise((res) => w.requestAnimationFrame(() => w.requestAnimationFrame(res)));

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v26 jsdom 测试（全站交互层 Blueprint App Kit）===");

  /* ================================================================
   * 路径 A：正常路径
   * ================================================================ */
  const A = makeDom({});
  await A.settle();
  await wait(90); // 等模块 boot + 首帧
  const wA = A.dom.window,
    dA = wA.document;

  /* ---------- A1. 页面切换编舞 ---------- */
  console.log("\n--- A1. 页面切换编舞 ---");
  ok(!!wA.__bpApp && typeof wA.__bpApp.choreograph === "function", "__bpApp 已启动且 choreograph 已暴露");
  wA.eval("showView('app')");
  wA.eval("navTo('match')");
  await wait(90);
  const matchHeader = dA.querySelector('.app-page[data-page="match"] .page-header');
  ok(matchHeader && matchHeader.classList.contains("bp-in"), "进入功能页 → 标题区揭载（.bp-in）");
  ok(matchHeader && matchHeader.style.getPropertyValue("--bp-i") === "0", "标题区 stagger 索引 0");
  ok(!!dA.querySelector("#bc-current + .bc-caret"), "面包屑后跟方块光标（切页重定位）");
  const sbMatch = dA.querySelector('.sb-item[data-nav="match"]');
  ok(sbMatch && sbMatch.classList.contains("sb-flash"), "侧栏激活项扫光（.sb-flash）");
  ok(!!dA.querySelector(".tabbar-item.active.sb-flash"), "底部 Tab 激活项同步扫光");
  wA.eval("navTo('report')");
  await wait(90);
  const repHeader = dA.querySelector('.app-page[data-page="report"] .page-header');
  ok(repHeader && repHeader.classList.contains("bp-in"), "再切页 → 标题区重新揭载（动画可重放）");
  const cssA = dA.querySelector("style").textContent;
  ok(
    /@keyframes pageIn\s*\{\s*from\s*\{\s*opacity:\s*0;\s*clip-path/.test(cssA) &&
      !/pageIn[\s\S]{0,160}translateY/.test(cssA),
    "CSS：揭载用 clip-path（零上浮）"
  );

  /* ---------- A2. 面包屑光标自消 ---------- */
  console.log("\n--- A2. 面包屑光标 ---");
  await wait(1400);
  ok(!dA.querySelector("#bc-current + .bc-caret"), "光标 1.2s 后自消（不常驻）");
  ok(/\.bc-caret\s*\{[^}]*animation:\s*caretBlink/.test(cssA), "CSS：光标硬切闪烁（caretBlink）");

  /* ---------- A3. 登录页动态 ---------- */
  console.log("\n--- A3. 登录页：强度计 / CapsLock / 分栏入场 ---");
  wA.eval("showView('auth')");
  await wait(60);
  const al = dA.querySelector(".auth-left"),
    ar = dA.querySelector(".auth-right");
  ok(
    al && al.classList.contains("bp-in") && al.style.getPropertyValue("--bp-i") === "0",
    "登录页左分栏入场（--bp-i 0）"
  );
  ok(
    ar && ar.classList.contains("bp-in") && ar.style.getPropertyValue("--bp-i") === "1",
    "右分栏 stagger 入场（--bp-i 1）"
  );
  const meter = dA.querySelector(".pw-meter");
  ok(!!meter && meter.getAttribute("aria-hidden") === "true", "密码强度计已注入（4 段发丝线，对辅助技术隐藏）");
  ok(meter && meter.querySelectorAll(".pw-seg").length === 4, "强度计 4 段");
  const regPass = dA.getElementById("reg-pass");
  const typePw = (v) => {
    regPass.value = v;
    regPass.dispatchEvent(new wA.Event("input", { bubbles: true }));
  };
  typePw("abc");
  ok(meter.dataset.score === "0", "「abc」→ 强度 0 段");
  typePw("abcdef");
  ok(meter.dataset.score === "1", "「abcdef」→ 强度 1 段（长度≥6）");
  typePw("Abcd1234");
  ok(meter.dataset.score === "3", "「Abcd1234」→ 强度 3 段（长度+数字+大小写）");
  typePw("Abcd12345!");
  ok(meter.dataset.score === "4", "「Abcd12345!」→ 强度 4 段（满格，朱红）");
  ok(
    /\.pw-meter\[data-score="4"\] \.pw-seg\s*\{\s*background:\s*var\(--brand\)/.test(cssA),
    "CSS：满格朱红（≤5% 纪律内的功能色）"
  );
  const loginPass = dA.getElementById("login-pass");
  const capsHint = () => loginPass.closest(".auth-field").querySelector(".caps-hint");
  ok(!!capsHint(), "CapsLock 提示元素已注入");
  wA.__capsOn = true;
  loginPass.dispatchEvent(new wA.KeyboardEvent("keyup", { key: "A", bubbles: true }));
  ok(capsHint().hidden === false, "大写锁定开启 → 提示可见");
  wA.__capsOn = false;
  loginPass.dispatchEvent(new wA.KeyboardEvent("keyup", { key: "a", bubbles: true }));
  ok(capsHint().hidden === true, "大写锁定关闭 → 提示隐藏");

  /* ---------- A4. 面试 LIVE 脉冲 ---------- */
  console.log("\n--- A4. 面试 LIVE ---");
  wA.eval("navTo('interview')");
  await wait(80);
  wA.eval("setCurrentSpeaker('技术面试官')");
  await wait(50);
  const badge = dA.getElementById("chat-agent");
  ok(badge.classList.contains("speaking"), "面试官轮转 → 徽章发言脉冲（.speaking）");
  ok(wA.__bpApp.speaking === true, "__bpApp.speaking = true（MO 观察中）");
  ok(
    /@keyframes agentPulse\s*\{\s*50%\s*\{\s*background:\s*var\(--brand-bg\)/.test(cssA),
    "CSS：脉冲用朱红 tint（非投影）"
  );

  /* ---------- A5. 数字滚动 + 维度条生长 ---------- */
  console.log("\n--- A5. 报告数字滚动 ---");
  const host = dA.createElement("div");
  host.innerHTML =
    '<span class="rep-num" data-count="87">87</span>' +
    '<div id="dims"><div class="dim-row"><div class="dim-bar"><div style="width:62%"></div></div></div></div>';
  dA.body.appendChild(host);
  wA.__bpApp.reportIn();
  await wait(90);
  const bar = host.querySelector(".dim-bar > div");
  ok(bar.dataset.w === "62%", "维度条记录目标宽度（62%）");
  ok(bar.style.width === "62%", "维度条回填并触发生长过渡");
  await wait(660);
  ok(
    host.querySelector(".rep-num").textContent === "87",
    "总分滚动到终值 87（" + host.querySelector(".rep-num").textContent + "）"
  );
  wA.__bpApp.countUpScan(host);
  ok(host.querySelector(".rep-num").dataset.done === "1", "已计数元素打标（重复扫描不重跑）");
  ok(/\.dim-bar > div\s*\{\s*transition:\s*width \.8s/.test(cssA), "CSS：维度条 width 过渡（.8s 兜底）");

  /* ---------- A6. 全站十字准线（输入聚焦隐身） ---------- */
  console.log("\n--- A6. 十字准线（全站） ---");
  wA.eval("currentUser = { id: 'u1', email: 'demo@futuremirror.app', name: 'Demo' }"); // 免游客保护 blur
  wA.eval("showView('app')");
  await wait(60);
  const cx = dA.querySelector(".bp-cross-x"),
    cy = dA.querySelector(".bp-cross-y");
  ok(!!cx && !!cy, "十字准线已注入（appfx 全站版）");
  wA.dispatchEvent(new wA.MouseEvent("mousemove", { clientX: 300, clientY: 200 }));
  await raf2(wA);
  ok(
    cx.style.top === "200px" && cy.style.left === "300px",
    "应用视图下准线跟随光标（" + cx.style.top + " / " + cy.style.left + "）"
  );
  dA.getElementById("chat-input").focus();
  await raf2(wA);
  ok(cx.style.visibility === "hidden" && cy.style.visibility === "hidden", "聚焦输入框 → 准线隐身");
  dA.getElementById("chat-input").blur();
  await raf2(wA);
  ok(cx.style.visibility !== "hidden", "失焦 → 准线恢复");
  wA.dispatchEvent(new wA.MouseEvent("mouseout", { bubbles: false }));
  await raf2(wA);
  ok(cx.style.visibility === "hidden", "光标出窗 → 准线隐藏");

  /* ---------- A7. 坐标读数扩展（PG / SEC） ---------- */
  console.log("\n--- A7. 坐标读数（全站） ---");
  const pgCards = [...dA.querySelectorAll("#view-app .page-card")];
  const pgChips = [...dA.querySelectorAll("#view-app .page-card .fb-coord")];
  ok(
    pgCards.length > 0 && pgChips.length === pgCards.length,
    "全部功能页卡挂坐标 chip（" + pgChips.length + "/" + pgCards.length + "）"
  );
  ok(pgChips[0].textContent.indexOf("PG-01") === 0, "功能页卡编号 PG-01 起（" + pgChips[0].textContent + "）");
  pgCards[0].dispatchEvent(new wA.MouseEvent("mousemove", { clientX: 40, clientY: 30, bubbles: true }));
  await raf2(wA);
  ok(/^PG-01 · X040 Y030$/.test(pgChips[0].textContent), "mousemove 更新坐标（" + pgChips[0].textContent + "）");
  const blkChips = [...dA.querySelectorAll("#view-landing .feature-block .fb-coord")];
  ok(
    blkChips.length === 9 && blkChips[0].textContent.indexOf("BLK-01") === 0,
    "落地页 9 张特性卡 BLK 编号仍在（迁移无回归）"
  );
  wA.eval("showView('evaluator')");
  await wait(60);
  const secs = [...dA.querySelectorAll(".eval-section")];
  const secChips = [...dA.querySelectorAll(".eval-section .fb-coord")];
  ok(
    secs.length > 0 && secChips.length === secs.length,
    "开发者节全部挂 SEC 编号（" + secChips.length + "/" + secs.length + "）"
  );
  ok(secChips[0].textContent.indexOf("SEC-01") === 0, "编号 SEC-01 起（" + secChips[0].textContent + "）");
  ok(
    /\.page-card:hover \.fb-coord,\s*\.eval-section:hover \.fb-coord\s*\{\s*opacity:\s*1/.test(cssA),
    "CSS：PG / SEC hover 显形"
  );

  /* ---------- A8. 开发者模式绘制线 ---------- */
  console.log("\n--- A8. 开发者绘制线 ---");
  const draws = [...dA.querySelectorAll(".eval-section .sec-draw")];
  ok(draws.length === secs.length, "每个 eval-section 注入绘制线（" + draws.length + "/" + secs.length + "）");
  const secIdxs = secs.map((s) => s.style.getPropertyValue("--sec-i"));
  ok(
    secIdxs.join(",") === secs.map((_, i) => String(i)).join(","),
    "绘制线 stagger 索引 0.." + (secs.length - 1) + "（" + secIdxs.slice(0, 4).join(",") + "…）"
  );
  ok(
    /\.eval-section\.bp-drawn \.sec-draw\s*\{\s*transform:\s*scaleX\(1\)/.test(cssA),
    "CSS：bp-drawn 后绘制线展开 scaleX(1)"
  );
  ok(/\.sec-draw\s*\{[^}]*transition-delay:\s*calc\(var\(--sec-i/.test(cssA), "CSS：绘制线 stagger 延迟（120ms×索引）");

  ok(A.errors.length === 0, "正常路径全流程无脚本错误" + (A.errors.length ? " → " + A.errors[0] : ""));

  /* ================================================================
   * 路径 R：reduced-motion（动效宪法）
   * ================================================================ */
  console.log("\n--- 降级链：reduced-motion ---");
  const R = makeDom({ reduced: true });
  await R.settle();
  await wait(80);
  const wR = R.dom.window,
    dR = wR.document;

  wR.eval("showView('auth')");
  await wait(50);
  ok(!dR.querySelector(".auth-left").classList.contains("bp-in"), "reduced-motion 下登录分栏不加入场动画");
  ok(!!dR.querySelector(".pw-meter"), "reduced-motion 下强度计仍注入（功能不缺失）");
  const regR = dR.getElementById("reg-pass");
  regR.value = "Abcd12345!";
  regR.dispatchEvent(new wR.Event("input", { bubbles: true }));
  ok(dR.querySelector(".pw-meter").dataset.score === "4", "reduced-motion 下强度计仍评分");
  const hostR = dR.createElement("div");
  hostR.innerHTML =
    '<span class="rep-num" data-count="87">87</span><div id="dims"><div class="dim-row"><div class="dim-bar"><div style="width:62%"></div></div></div></div>';
  dR.body.appendChild(hostR);
  wR.__bpApp.reportIn();
  ok(hostR.querySelector(".rep-num").textContent === "87", "reduced-motion 下数字立即落终值");
  ok(hostR.querySelector(".dim-bar > div").style.width === "62%", "reduced-motion 下维度条不重置（宽度保持）");
  ok(!dR.querySelector(".bp-cross-x"), "reduced-motion 下不注入十字准线");

  const cssR = dR.querySelector("style").textContent;
  const rmBlock = (cssR.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/g) || []).join("\n");
  ok(/\.bp-in\s*\{\s*animation:\s*none/.test(rmBlock), "reduced-motion 下揭载动画关闭");
  ok(/\.bc-caret\s*\{\s*animation:\s*none/.test(rmBlock), "reduced-motion 下面包屑光标停闪");
  ok(
    /\.sb-item\.sb-flash::before, \.tabbar-item\.sb-flash::after\s*\{\s*animation:\s*none/.test(rmBlock),
    "reduced-motion 下扫光关闭"
  );
  ok(/\.badge\.speaking\s*\{\s*animation:\s*none/.test(rmBlock), "reduced-motion 下 LIVE 脉冲关闭");
  ok(/\.sec-draw\s*\{\s*transition:\s*none/.test(rmBlock), "reduced-motion 下绘制线过渡关闭");
  ok(
    /\.pw-seg\s*\{\s*transition:\s*none/.test(rmBlock) && /\.dim-bar > div\s*\{\s*transition:\s*none/.test(rmBlock),
    "reduced-motion 下强度计与维度条过渡关闭"
  );

  console.log(`\n===== v26 结果：${pass} 通过，${fail} 失败 =====`);
  process.exit(fail ? 1 : 0);
}
