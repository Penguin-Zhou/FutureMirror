/* v25 jsdom 测试：交互深化层（Blueprint Interaction Kit）——返回顶部进度环 / 滚动侦测 /
 * 蓝图绘制线 / Hero 打字机轮播 / 实录播台 / 十字准线 / 坐标读数 / 命令面板 / 降级链
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v25-jsdom.js
 * 说明：正常路径与 reduced-motion 路径各建一个 JSDOM 实例验证。
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

function makeDom(opts) {
  const o = opts || {};
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => {
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
      if (o.reduced) {
        window.matchMedia = q => ({ matches: /reduce/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeListener() {} });
      }
    },
  });
  const settle = () => new Promise(res => {
    if (dom.window.document.readyState === "complete") return res();
    dom.window.document.addEventListener("DOMContentLoaded", res, { once: true });
    setTimeout(res, 800);
  });
  return { dom, errors, settle };
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const raf2 = w => new Promise(res => w.requestAnimationFrame(() => w.requestAnimationFrame(res)));

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v25 jsdom 测试（交互深化层 Blueprint Interaction Kit）===");

  /* ================================================================
   * 路径 A：正常路径
   * ================================================================ */
  const A = makeDom({});
  await A.settle();
  await wait(90);                                   // 等三模块 boot + 首帧
  const wA = A.dom.window, dA = wA.document;

  /* ---------- A1. 返回顶部 + 进度环 ---------- */
  console.log("\n--- A1. 返回顶部与进度环 ---");
  const top = dA.getElementById("bp-top");
  ok(!!top, "返回顶部按钮已注入（#bp-top）");
  ok(top && top.getAttribute("aria-label") === "返回顶部", "按钮含无障碍标签");
  ok(wA.__bpScroll && wA.__bpScroll.top === true, "__bpScroll.top = true（滚动模块已启动）");
  wA.__bpScroll.initTop();
  ok(dA.querySelectorAll("#bp-top").length === 1, "重复调用 initTop 幂等（不叠加）");
  const fg = dA.querySelector("#bp-top .bp-top-fg");
  const C = 2 * Math.PI * 19;
  ok(!!fg && Math.abs(parseFloat(fg.getAttribute("stroke-dasharray")) - C) < 0.05, "进度环 dasharray = 2πr（" + (fg && fg.getAttribute("stroke-dasharray")) + "）");
  ok(top && !top.classList.contains("show"), "顶部位置不显形（阈值 600px）");
  let scrollArgs = null;
  wA.scrollTo = (...a) => { scrollArgs = a; };
  Object.defineProperty(wA, "scrollY", { value: 800, configurable: true });
  wA.dispatchEvent(new wA.Event("scroll"));
  await wait(60);
  ok(top.classList.contains("show"), "滚动超过 600px 后显形");
  const off = parseFloat(fg.style.strokeDashoffset);
  ok(!isNaN(off) && off >= 0 && off <= C + 0.01, "进度环偏移随滚动更新（offset " + off.toFixed(1) + " / " + C.toFixed(1) + "）");
  top.click();
  ok(!!scrollArgs && scrollArgs[0] && scrollArgs[0].top === 0, "点击回顶（scrollTo top:0）");

  /* ---------- A2. 滚动侦测 ---------- */
  console.log("\n--- A2. 滚动侦测（导航点亮）---");
  ok(wA.__bpScroll.spy === true && typeof wA.__bpScroll.updateSpy === "function", "__bpScroll.spy = true 且 updateSpy 已暴露");
  const feats = dA.getElementById("features"), stats = dA.getElementById("stats");
  const linkFeats = dA.querySelector('.landing-nav-links a[href="#features"]');
  const linkStats = dA.querySelector('.landing-nav-links a[href="#stats"]');
  ok(!!linkFeats && !!linkStats, "落地页导航含区块锚链接");
  Object.defineProperty(wA, "scrollY", { value: 500, configurable: true });
  feats.getBoundingClientRect = () => ({ top: -200, height: 900, bottom: 700 });
  stats.getBoundingClientRect = () => ({ top: 2000, height: 600, bottom: 2600 });
  wA.__bpScroll.updateSpy();
  ok(linkFeats.classList.contains("active") && !linkStats.classList.contains("active"), "功能区块入视口 → 对应导航点亮");
  Object.defineProperty(wA, "scrollY", { value: 2500, configurable: true });
  feats.getBoundingClientRect = () => ({ top: -3000, height: 900, bottom: -2100 });
  stats.getBoundingClientRect = () => ({ top: 0, height: 600, bottom: 600 });
  wA.__bpScroll.updateSpy();
  ok(linkStats.classList.contains("active") && !linkFeats.classList.contains("active"), "数据区块入视口 → 点亮转移");
  wA.eval("showView('app')");
  wA.__bpScroll.updateSpy();
  ok(!linkStats.classList.contains("active") && !linkFeats.classList.contains("active"), "离开落地页 → 导航点亮清除");

  /* ---------- A3. 蓝图绘制线 ---------- */
  console.log("\n--- A3. 蓝图绘制线 ---");
  const steps = [...dA.querySelectorAll(".workflow-step")];
  const draws = [...dA.querySelectorAll(".workflow-step .ws-draw")];
  ok(steps.length === 4 && draws.length === 4, "每个工作流步骤注入蓝图绘制线（" + draws.length + "/4）");
  const idxs = steps.map(s => s.style.getPropertyValue("--ws-i"));
  ok(idxs.join(",") === "0,1,2,3", "绘制线 stagger 索引 0..3（" + idxs.join(",") + "）");
  const cssA = dA.querySelector("style").textContent;
  ok(/\.workflow-step\.bp-drawn \.ws-draw\s*\{[^}]*transform:\s*scaleX\(1\)/.test(cssA), "CSS：bp-drawn 后绘制线展开 scaleX(1)");
  ok(/\.ws-draw\s*\{[^}]*transition-delay:\s*calc\(var\(--ws-i/.test(cssA), "CSS：绘制线 stagger 延迟（120ms×索引）");

  /* ---------- A4. Hero 文案轮播 ---------- */
  console.log("\n--- A4. Hero 文案轮播 ---");
  const hr = dA.getElementById("hr-text");
  ok(!!hr && !!dA.querySelector(".hero-rotator .hr-caret"), "Hero 轮播元素与方块光标存在");
  ok(wA.__bpLanding && wA.__bpLanding.rotator === true && wA.__bpLanding.phrases === 5, "__bpLanding.rotator = true（5 条文案）");
  await wait(820);
  const t1 = hr.textContent;
  ok(t1.length >= 1 && "多 AGENT 圆桌协同追问".startsWith(t1), "打字机逐字敲出首句（「" + t1 + "」）");
  await wait(900);
  ok(hr.textContent.length > t1.length, "轮播持续打字（「" + hr.textContent + "」）");
  ok(/@keyframes caretBlink/.test(cssA) && /\.hero-rotator \.hr-caret\s*\{[^}]*animation:\s*caretBlink/.test(cssA), "CSS：方块光标硬切闪烁");

  /* ---------- A5. 面试实录播台 ---------- */
  console.log("\n--- A5. 面试实录播台 ---");
  const mockBody = dA.querySelector(".hero-mock-body");
  const bubbles = [...dA.querySelectorAll(".hero-mock-body .mock-bubble")];
  ok(mockBody.classList.contains("mock-play"), "实录播台已激活（.mock-play）");
  await wait(2400);
  ok(bubbles.every(b => b.classList.contains("mock-in")), "三个气泡依序揭载完成（" + bubbles.filter(b => b.classList.contains("mock-in")).length + "/3）");
  const lastB = bubbles[bubbles.length - 1];
  ok(!!lastB.querySelector(".mock-caret"), "末气泡跟流式光标（预告 SSE 逐字体验）");
  ok(/@keyframes mockIn\s*\{\s*from\s*\{\s*opacity:\s*0;\s*clip-path/.test(cssA) && !/mockIn[\s\S]{0,140}translateY/.test(cssA), "CSS：播台揭载用 clip-path（零上浮）");

  /* ---------- A6. 蓝图十字准线（v27 起全站化：输入聚焦隐身） ---------- */
  console.log("\n--- A6. 十字准线 ---");
  wA.eval("currentUser = { id: 'u1', email: 'demo@futuremirror.app', name: 'Demo' }");  // 免游客保护 blur
  wA.eval("navTo('interview')");                       // 落到面试页（含 chat-input）
  await wait(90);
  const cx = dA.querySelector(".bp-cross-x"), cy = dA.querySelector(".bp-cross-y");
  ok(!!cx && !!cy && cx.getAttribute("aria-hidden") === "true", "十字准线已注入且对辅助技术隐藏");
  wA.dispatchEvent(new wA.MouseEvent("mousemove", { clientX: 300, clientY: 200 }));
  await raf2(wA);
  ok(cx.style.top === "200px" && cy.style.left === "300px", "准线跟随光标定位（" + cx.style.top + " / " + cy.style.left + "）");
  ok(cx.style.visibility !== "hidden", "应用视图下准线可见（v27 全站化，不再限定落地页）");
  dA.getElementById("chat-input").focus();
  await raf2(wA);
  ok(cx.style.visibility === "hidden" && cy.style.visibility === "hidden", "聚焦输入框 → 准线隐身（不干扰录入）");
  dA.getElementById("chat-input").blur();
  await raf2(wA);
  ok(cx.style.visibility !== "hidden", "失焦 → 准线恢复");
  wA.eval("showView('landing')");
  await raf2(wA);
  ok(cx.style.visibility !== "hidden" && cx.style.top === "200px", "回到落地页准线仍在（全站常驻）");
  wA.eval("history.replaceState(null, '', location.pathname)");   // 清掉 #/interview，恢复 A8 前置（⌘K 弹面板）
  ok(/\.bp-cross\s*\{[^}]*pointer-events:\s*none/.test(cssA) && /\.bp-cross\s*\{[^}]*opacity:\s*\.16/.test(cssA), "CSS：准线零指针拦截 + 墨色 .16");

  /* ---------- A7. 特性卡坐标读数 ---------- */
  console.log("\n--- A7. 坐标读数 ---");
  const chips = [...dA.querySelectorAll("#view-landing .feature-block .fb-coord")];
  ok(chips.length === 9, "9 张特性卡全部挂载坐标 chip");
  ok(chips[0].textContent.indexOf("BLK-01") === 0, "chip 等宽测绘编号（" + chips[0].textContent + "）");
  const fb0 = dA.querySelector("#view-landing .feature-block");
  fb0.dispatchEvent(new wA.MouseEvent("mousemove", { clientX: 40, clientY: 30, bubbles: true }));
  await raf2(wA);
  ok(/^BLK-01 · X040 Y030$/.test(chips[0].textContent), "mousemove 更新坐标（" + chips[0].textContent + "）");
  ok(/\.feature-block:hover \.fb-coord\s*\{[^}]*opacity:\s*1/.test(cssA) && /@media \(hover: none\)\s*\{\s*\.fb-coord\s*\{\s*display:\s*none/.test(cssA), "CSS：hover 显形 + 触屏隐藏");

  /* ---------- A8. 命令面板 ---------- */
  console.log("\n--- A8. 命令面板 ---");
  const cmd = () => dA.getElementById("bp-cmd");
  ok(wA.__bpCmd && wA.__bpCmd.items === 18, "命令清单 18 项（导航 4 + 页面 10 + 动作 4，v29 新增跟随系统）");
  ok(cmd() === null, "面板懒建：未呼出前不注入 DOM");
  dA.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
  ok(cmd().hidden === false && wA.__bpCmd.open === true, "Ctrl/⌘+K 呼出面板");
  ok(dA.activeElement === dA.getElementById("bp-cmd-input"), "打开后自动聚焦筛选框");
  ok(dA.querySelectorAll("#bp-cmd-list .bp-cmd-item").length >= 17, "列表渲染 ≥17 项（基础动作 + v28 最近/上下文动态组）");
  const gtxt = [...dA.querySelectorAll("#bp-cmd-list .bp-cmd-group")].map(g => g.textContent.trim());
  ok(gtxt.includes("导航") && gtxt.includes("页面") && gtxt.includes("动作"), "分组含 导航/页面/动作（v28 增加「最近」动态组）");
  const cmdInput = dA.getElementById("bp-cmd-input");
  cmdInput.value = "主题";
  cmdInput.dispatchEvent(new wA.Event("input", { bubbles: true }));
  ok(dA.querySelectorAll("#bp-cmd-list .bp-cmd-item").length === 2 && wA.__bpCmd.visible === 2, "过滤「主题」收敛为 2 项（切换 + 跟随系统）");
  cmdInput.value = "zzzz-不存在";
  cmdInput.dispatchEvent(new wA.Event("input", { bubbles: true }));
  ok(!!dA.querySelector("#bp-cmd-list .bp-cmd-empty") && dA.getElementById("bp-cmd-count").textContent === "0 项", "无匹配时显示空态与 0 项计数");
  cmdInput.value = "";
  cmdInput.dispatchEvent(new wA.Event("input", { bubbles: true }));
  dA.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
  const selIdx = () => [...dA.querySelectorAll("#bp-cmd-list .bp-cmd-item")].findIndex(el => el.getAttribute("aria-selected") === "true");
  ok(selIdx() === 1, "↓ 键移动选中（当前第 " + selIdx() + " 项）");
  cmdInput.value = "工作台";
  cmdInput.dispatchEvent(new wA.Event("input", { bubbles: true }));
  dA.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  ok(cmd().hidden === true, "Enter 执行后面板关闭");
  ok(dA.getElementById("view-app").classList.contains("active"), "「工作台」动作切到应用视图");
  await wait(60);
  ok(wA.location.hash === "#/dashboard", "动作同步 hash 子路由（" + wA.location.hash + "）");
  dA.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
  ok(cmd().hidden === false, "再次 ⌘K 可重新呼出");
  dA.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  ok(cmd().hidden === true, "Esc 关闭面板");
  dA.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
  cmd().dispatchEvent(new wA.MouseEvent("click", { bubbles: true }));
  ok(cmd().hidden === true, "点击遮罩关闭面板");
  wA.location.hash = "#/interview";
  await wait(80);
  dA.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
  ok(cmd() && cmd().hidden === true && wA.__bpCmd.open === false, "面试页 ⌘K 保留聚焦输入框原行为（不弹面板）");
  ok(/\.bp-cmd-box\s*\{[^}]*border:\s*2px solid var\(--ink\)/.test(cssA) && !/\.bp-cmd[^{]*\{[^}]*border-radius/.test(cssA), "CSS：命令面板直角墨框（无圆角）");
  ok(/@keyframes cmdIn\s*\{\s*from\s*\{\s*opacity:\s*0;\s*clip-path/.test(cssA), "CSS：面板入场用 clip-path 揭载（零上浮）");

  ok(A.errors.length === 0, "正常路径全流程无脚本错误" + (A.errors.length ? " → " + A.errors[0] : ""));

  /* ================================================================
   * 路径 R：reduced-motion（动效宪法）
   * ================================================================ */
  console.log("\n--- 降级链：reduced-motion ---");
  const R = makeDom({ reduced: true });
  await R.settle();
  await wait(80);
  const wR = R.dom.window, dR = wR.document;

  ok(!!dR.getElementById("bp-top"), "reduced-motion 下返回顶部仍注入（功能不缺失）");
  ok(dR.getElementById("hr-text").textContent === "多 AGENT 圆桌协同追问", "reduced-motion 下轮播静态落位首句");
  const tR = dR.getElementById("hr-text").textContent;
  await wait(900);
  ok(dR.getElementById("hr-text").textContent === tR, "reduced-motion 下轮播不跑定时器（文案稳定）");
  const rb = [...dR.querySelectorAll(".hero-mock-body .mock-bubble")];
  ok(rb.every(b => b.classList.contains("mock-in")), "reduced-motion 下实录气泡全部可见（无揭载动画）");
  ok(!dR.querySelector(".mock-caret"), "reduced-motion 下不挂流式光标");
  ok(!dR.querySelector(".bp-cross-x"), "reduced-motion 下不注入十字准线");

  const cssR = dR.querySelector("style").textContent;
  const rmBlock = (cssR.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/g) || []).join("\n");
  ok(/\.bp-top\s*\{\s*transition:\s*none/.test(rmBlock), "reduced-motion 下回顶过渡关闭");
  ok(/\.hero-rotator \.hr-caret\s*\{\s*animation:\s*none/.test(rmBlock), "reduced-motion 下光标停闪");
  ok(/\.mock-caret\s*\{\s*animation:\s*none/.test(rmBlock) && /\.hmh-live::before\s*\{\s*animation:\s*none/.test(rmBlock), "reduced-motion 下流式光标与 LIVE 点静止");
  ok(/\.bp-cmd-enter\s*\{\s*animation:\s*none/.test(rmBlock), "reduced-motion 下面板入场动画关闭");

  console.log(`\n===== v25 结果：${pass} 通过，${fail} 失败 =====`);
  process.exit(fail ? 1 : 0);
}
