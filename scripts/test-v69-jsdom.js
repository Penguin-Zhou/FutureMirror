/* v69 · 登录页改成「制图台」（Drafting Sheet）
 *
 * 改的不是配色，是形态：从「一张表单卡片」变成「一张工程图幅」。
 * 左边是图幅（图框 / 中心线 / 尺寸线 / 面镜 / 标题栏 / 左侧标尺），
 * 右边是核验表（图注编号、规尺发丝线、字段状态徽记、扫描式提交条）。
 *
 * 断言分七组：
 *   ① 形态：图幅语汇真的落到 DOM 上，不是只有几个类名
 *   ② 纪律：零投影 / 零玻璃 / 无上浮入场 / 颜色只走变量
 *   ③ 动效契约：起笔、呼吸、扫描、滑块四个动画都在，且 reduced-motion 能停
 *   ④ 字段状态：边打字只报通过，失焦才报不符
 *   ⑤ 提交：忙碌态、出错抖动、离开页面后收回
 *   ⑥ 视差：光标移动写入 --af-x/--af-y，指针离开归零
 *   ⑦ 成品：演示包内联，且改版没有丢掉合规文案与既有 id
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

const themeCss = rd("frontend/css/theme.css");
const demoHtml = rd("public/futuremirror-demo.html");

/* 只取 v69 这一段，避免别处的历史规则把断言喂饱 */
const cssFrom = themeCss.indexOf("v69 · 登录页：制图台");
const cssTo = themeCss.indexOf("/* ============ 面试 / 聊天：方形气泡", cssFrom);
const authCss = cssFrom >= 0 && cssTo > cssFrom ? themeCss.slice(cssFrom, cssTo) : "";

/* 登录页那一块 HTML（id 白名单靠它做回归） */
const htmlFrom = demoHtml.indexOf('id="view-auth"');
const htmlTo = demoHtml.indexOf("/view-auth", htmlFrom);
const authHtml = htmlFrom >= 0 && htmlTo > htmlFrom ? demoHtml.slice(htmlFrom - 40, htmlTo) : "";

/* matchMedia 桩：精细指针为真（视差才挂），不做减弱动效 */
function mm(query) {
  return {
    matches: /pointer:\s*fine/.test(query),
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  };
}

function boot() {
  return new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(win) {
      win.matchMedia = mm;
      win.scrollTo = function () {};
      /* jsdom 不做布局，getBoundingClientRect 恒为 0；视差里有一段
       * 「读不到尺寸就跳过」的守卫，这里给一个真实尺寸，才能验到写入。 */
      win.Element.prototype.getBoundingClientRect = function () {
        return { width: 940, height: 653, top: 0, left: 0, right: 940, bottom: 653, x: 0, y: 0 };
      };
    },
  }).window;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log("── ① 形态：图幅语汇 ──");
  ok(/class="auth-sheet"/.test(authHtml), "有图幅容器 .auth-sheet（不是网格底纹，是一张图）");
  ok(
    /class="auth-figure"/.test(authHtml) && /viewBox="0 0 320 140"/.test(authHtml),
    "图幅用固定宽高比的 viewBox，缩放不裁边"
  );
  ok(
    /class="af-frame af-draw"/.test(authHtml) && /pathLength="100"/.test(authHtml),
    "图框带 pathLength，起笔进度与几何长度无关"
  );
  ok(/class="af-eye"/.test(authHtml) && /class="af-core"/.test(authHtml), "面镜（椭圆）与中心点在位");
  ok(/class="af-glint af-draw"/.test(authHtml), "面镜上有一道高光弧——没有它就是个几何椭圆，不是镜面");
  ok(
    /class="af-dim"/.test(authHtml) && /class="af-axis af-draw"/.test(authHtml),
    "尺寸线与中心线都在（图纸的基本语法）"
  );
  ok(/class="auth-titleblock"/.test(authHtml) && /FM-AUTH-01/.test(authHtml), "底部有标题栏与图号");
  ok(
    ["图号", "比例", "版本", "日期"].every((k) => authHtml.includes("<span>" + k + "</span>")),
    "标题栏四格齐全（图号 / 比例 / 版本 / 日期）"
  );
  ok(/Beta 1\.1\.2/.test(authHtml), "标题栏版本与产品版本一致（Beta 1.1.2，未升版）");
  ok(/class="auth-ruler"/.test(authHtml), "图幅左侧有标尺刻度");

  console.log("\n── ② 纪律：不破蓝图编辑风 ──");
  ok(!/box-shadow:\s*(?!none)/.test(authCss), "登录页整段无投影");
  ok(!/backdrop-filter/.test(authCss), "无玻璃拟态");
  ok(!/translateY/.test(authCss), "没有上浮入场/上浮 hover（位移只做横向与缩放）");
  const hexes = (authCss.match(/#[0-9a-fA-F]{3,8}\b/g) || []).filter((h) => h.toLowerCase() !== "#fff");
  ok(hexes.length === 0, "颜色全部走变量，未硬编码色值" + (hexes.length ? "→ " + hexes.join(",") : ""));
  ok(/\.auth-left h2[^{]*\{[^}]*var\(--serif\)/.test(themeCss), "标题仍是衬线（v17 的视觉断言不能破）");

  console.log("\n── ③ 动效契约 ──");
  ["afDraw", "afBreath", "afSweep", "afPop", "authScan", "authSheetIn", "authShake"].forEach((k) => {
    ok(new RegExp("@keyframes " + k + "\\b").test(authCss), "关键帧 " + k + " 存在");
  });
  ok(
    /translateX\(292px\)/.test(authCss) && /width="296"/.test(authHtml),
    "扫描线行程 = 图框宽度 − 起笔偏移（292 = 296 − 4）"
  );
  ok(/#tab-register\.active ~ \.auth-tab-ink/.test(authCss), "标签墨块靠兄弟选择器平移，不需要 JS 参与");
  const rmBlock = authCss.slice(authCss.indexOf("reduced-motion：三段起笔"));
  ok(
    /#view-auth \.af-eye/.test(rmBlock) &&
      /#view-auth \.auth-tab-ink/.test(rmBlock) &&
      /stroke-dashoffset: 0/.test(rmBlock),
    "reduced-motion 里把起笔、呼吸、滑块全部收到终态"
  );
  ok(/animation: authSheetIn/.test(authCss), "整屏以裁切揭载（不是整块淡入）");

  console.log("\n── ④ 字段状态 ──");
  const w = boot();
  await wait(700);
  const d = w.document;
  w.eval('showView("auth")');
  await wait(120);

  const email = d.getElementById("login-email");
  const emailField = email.closest(".auth-field");
  const type = (el, v) => {
    el.value = v;
    el.dispatchEvent(new w.Event("input", { bubbles: true }));
  };
  type(email, "a@b");
  ok(!emailField.getAttribute("data-state"), "打字打到一半不标红（边输入边判错最烦人）");
  email.dispatchEvent(new w.Event("blur", { bubbles: true }));
  ok(emailField.getAttribute("data-state") === "bad", "失焦后格式不符才标出来");
  ok(/不符/.test(emailField.getAttribute("data-mark") || ""), "徽记文案说明原因，不只是颜色");
  type(email, "you@example.com");
  ok(emailField.getAttribute("data-state") === "ok", "格式正确时给出通过状态");
  type(email, "");
  ok(
    !emailField.getAttribute("data-state") && !emailField.getAttribute("data-mark"),
    "清空后退回中性，不残留上一次结论"
  );

  const pw = d.getElementById("login-pass");
  type(pw, "12345");
  pw.dispatchEvent(new w.Event("blur", { bubbles: true }));
  ok(pw.closest(".auth-field").getAttribute("data-state") === "bad", "密码不足 6 位在失焦时报出");

  console.log("\n── ⑤ 提交：忙碌 / 出错 / 离开 ──");
  const form = d.getElementById("form-login");
  const btn = d.getElementById("login-submit");
  const card = d.querySelector("#view-auth .auth-card");
  /* 真实 doLogin 校验失败会同步报错，测不到「忙碌中」这一帧；
   * 这里换成一个不返回的桩，只验 UI 状态机本身。 */
  w.eval("window.__realDoLogin = doLogin; window.doLogin = function () { return new Promise(function () {}); };");
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  ok(btn.classList.contains("is-busy"), "提交后进入忙碌态（扫描条走起来）");
  ok(btn.getAttribute("aria-busy") === "true" && !!btn.getAttribute("data-busy"), "忙碌态同时给出读屏与文案");
  w.eval("window.doLogin = window.__realDoLogin;");
  w.eval('showAuthError("login", "邮箱或密码不正确")');
  await wait(60);
  ok(!btn.classList.contains("is-busy"), "错误提示一出现就收回忙碌态（不然下次进来还停在核对中）");
  ok(card.classList.contains("is-error"), "出错时整张卡横向轻抖");
  await wait(420);
  ok(!card.classList.contains("is-error"), "抖动是有限次的，不是常驻动画");

  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  w.eval("window.doLogin = function () { return new Promise(function () {}); };");
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  ok(btn.classList.contains("is-busy"), "再次提交仍能进入忙碌态");
  w.eval('showView("app")');
  await wait(80);
  ok(!btn.classList.contains("is-busy"), "离开登录页时把忙碌态收回（否则重进页面按钮卡住）");
  w.eval('showView("auth")');
  await wait(80);
  w.eval("window.doLogin = window.__realDoLogin;");

  console.log("\n── ⑥ 图面视差 ──");
  const plate = d.querySelector("#view-auth .auth-left");
  card.dispatchEvent(new w.MouseEvent("pointermove", { bubbles: true, clientX: 900, clientY: 480 }));
  await wait(80);
  const ax = plate.style.getPropertyValue("--af-x");
  ok(/^-?[\d.]+$/.test(ax), "光标移动写入 --af-x（写成数字，不是 NaN）");
  ok(Math.abs(parseFloat(ax)) <= 1.001, "归一化到 [-1,1]，图形不会跟着光标跑出图幅");
  card.dispatchEvent(new w.MouseEvent("pointerleave", { bubbles: true }));
  await wait(80);
  ok(parseFloat(plate.style.getPropertyValue("--af-y")) === 0, "指针离开后归零，图面回正");

  console.log("\n── ⑦ 成品与回归 ──");
  ok(demoHtml.includes("auth-titleblock") && demoHtml.includes("af-glint"), "演示包内联了图幅与高光弧");
  ok(/@keyframes afSweep/.test(demoHtml) && /@keyframes authScan/.test(demoHtml), "演示包内联了扫描与提交条动画");
  ok(w.eval("!!(window.__bpApp && window.__bpApp.authStage)"), "__bpApp.authStage 已点亮（可被外部探测）");
  ok(/演示级/.test(authHtml) && /demo1234/.test(authHtml), "合规文案没被改版弄丢（演示级 / 专用演示密码仍在）");
  const ids = [...authHtml.matchAll(/id="([^"]+)"/g)].map((m) => m[1]).sort();
  const want = [
    "auth-screen",
    "form-login",
    "form-register",
    "login-email",
    "login-error",
    "login-pass",
    "login-submit",
    "reg-email",
    "reg-error",
    "reg-name",
    "reg-pass",
    "reg-submit",
    "tab-login",
    "tab-register",
    "view-auth",
  ];
  ok(JSON.stringify(ids) === JSON.stringify(want), "登录页 id 仍是那 15 个（没有新增 id，validate:demo 的引用表不漂）");
  const onclickN = [...authHtml.matchAll(/onclick="/g)].length;
  ok(onclickN === 3, "内联 onclick 仍是 3 处（两个标签 + 一键演示），新交互都走 addEventListener");

  console.log((fail ? "❌ " : "✅ ") + `合计 ${pass + fail} 项：通过 ${pass}，失败 ${fail}`);
  try {
    w.close();
  } catch (e) {
    /* 窗口已关闭 */
  }
  process.exit(fail ? 1 : 0);
})();
