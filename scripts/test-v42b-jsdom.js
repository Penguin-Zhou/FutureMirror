/* v42b · 降级演练（主动失效）断言
 *
 * 三级降级此前只是文档里的承诺。这一组断言要把它钉成「可当场复现的动作」：
 * ① 存在显式演练开关，不依赖真的断网；
 * ② 降级横幅角色化 + 非阻塞（不弹窗、不锁输入）；
 * ③ 演练用完即解除，不会一直污染后续提问；
 * ④ 失败走的是与真实失败相同的兜底分支，不伪造结果。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const has = (s, re) => re.test(s);
/* 源码里常含 \s*$ 这类字面量，直接用正则元字符会误判；
 * 断言跨行结构时先归一化空白，再匹配。 */
const nrm = (s) => s.replace(/\s+/g, " ");

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

const interviewSrc = rd("frontend/js/features/interview.js");
const indexSrc = rd("frontend/index.html");
const cssSrc = rd("frontend/css/pages.css") + rd("frontend/css/theme.css");
const demoHtml = rd("public/futuremirror-demo.html");

function boot() {
  const dom = new JSDOM(indexSrc, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "http://localhost/",
    beforeParse(w) {
      w.matchMedia = (q) => ({
        matches: false,
        media: q,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
      });
      w.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
      w.scrollTo = () => {};
      w.scrollBy = () => {};
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [] };
    },
  });
  const w = dom.window;
  const src = interviewSrc.replace(/^\s*import[^\n]*\n/gm, "").replace(/^\s*export\s+/gm, "");
  try {
    w.eval(
      "var $ = function(id){return document.getElementById(id);};\n" +
        "var toast = function(){};\n" +
        "var persistSession = function(){};\n" +
        "var addTimeline = function(){};\n" +
        "var buildMessages = function(){return [];};\n" +
        "var streamChat = function(){return Promise.resolve();};\n" +
        "var llmLabel = function(){return 'mock';};\n" +
        "var showTyping = function(){}; var hideTyping = function(){};\n" +
        "var annotateAnchorRef = function(){return [];};\n" +
        "var v16MaybeAutoSpeak = function(){};\n" +
        "var startAnswerTimer = function(){};\n" +
        "var updateLiveTracker = function(){};\n" +
        "var maybeFinishAtLimit = function(){};\n" +
        "var maybeFinishAtTurnLimit = function(){};\n" +
        "var pickQuestion = function(){return 'q';};\n" +
        "var planReason = function(){return 'r';};\n" +
        src
    );
  } catch (e) {
    console.log("  ⚠️ 源码 eval 未完全执行（仅影响运行时断言）:", String(e.message).slice(0, 160));
  }
  return w;
}

console.log("\n=== v42b · 降级演练（主动失效） ===\n");

console.log("① 演练开关：无需真的断网");
ok(has(interviewSrc, /function armDegradeDemo/), "开启演练函数存在");
ok(has(interviewSrc, /function disarmDegradeDemo/), "解除演练函数存在");
ok(has(interviewSrc, /function syncDegradeArmState/), "演练状态同步函数存在");
ok(has(indexSrc, /onclick="armDegradeDemo\(\)"/), "开发者模式暴露演练入口");
ok(has(indexSrc, /onclick="disarmDegradeDemo\(\)"/), "开发者模式暴露解除入口");
ok(has(indexSrc, /id="degrade-arm-state"/), "演练状态徽章存在");

console.log("\n② 演练语义：只用一次，用完即解");
ok(has(interviewSrc, /if \(degradeArmed\) \{\s*\n\s*degradeArmed = false;/), "触发后立即解除 armed");
ok(has(interviewSrc, /degradeDrill = true/), "标记本次为演练触发（供文案诚实标注）");
ok(has(interviewSrc, /throw new Error\("模拟网关无响应"\)/), "演练以真实抛出方式进入失败分支");

console.log("\n③ 降级横幅：角色化 + 非阻塞");
ok(has(interviewSrc, /function showDegradeBanner/), "横幅展示函数存在");
ok(has(indexSrc, /id="fallback-who"/), "横幅含角色占位");
ok(
  has(nrm(interviewSrc), /raw \? raw\.replace\(\/面试官\\s\*\$\/, ""\) \+ "面" : "当前"/),
  "角色名归一为「技术面 / HR 面 / 压力面」"
);
ok(has(interviewSrc, /"演练触发 · " \+ reason/), "演练触发时文案如实标注，不假装真实故障");
ok(has(indexSrc, /role="status" aria-live="polite"/), "横幅用 status 而非 alert（非阻塞播报）");
ok(!has(indexSrc, /id="fallback-banner"[^>]*role="alert"/), "横幅不再使用 alert 强打断语义");

console.log("\n④ 横幅贴顶常驻：降级必须看得见");
ok(has(cssSrc, /\.fallback-banner\s*\{[^}]*position:\s*sticky/), "横幅 sticky 贴顶");
ok(has(cssSrc, /\.fallback-banner\s*\{[^}]*top:\s*calc\(var\(--hdr-h/), "贴顶位置跟随实测顶栏高度");
ok(has(cssSrc, /\.fallback-banner\[hidden\]\s*\{\s*display:\s*none/), "hidden 时不占位");
ok(has(cssSrc, /@keyframes fbPulse/), "状态点脉冲提示");
ok(has(cssSrc, /prefers-reduced-motion[\s\S]{0,200}\.fb-dot\s*\{\s*animation:\s*none/), "降级动效尊重降低动效偏好");

console.log("\n⑤ 兜底分支：不伪造结果，流程不中断");
ok(has(interviewSrc, /已自动降级为本地推理，面试继续/), "提示语强调「面试继续」而非报错");
ok(
  has(interviewSrc, /sendMsgMock\(text, speaker, keyword, notes, anchors\);\s*\n\s*return;/),
  "失败后回落到本地引擎继续作答"
);
ok(
  has(interviewSrc, /staleTag\.classList\.contains\("anchor-ref-host"\)\)\s*staleTag\.remove\(\)/),
  "降级时清理孤儿锚定标签（不留无主提示）"
);

console.log("\n⑥ 运行时行为（jsdom 实测开关状态机）");
const w = boot();
const hook = w.__bpDegrade;
ok(!!hook && typeof hook.arm === "function", "测试钩子 __bpDegrade 已注册");
if (hook) {
  ok(hook.armed() === false, "初始状态为未开启");
  hook.arm();
  ok(hook.armed() === true, "开启后 armed 为 true");
  const badge = w.document.getElementById("degrade-arm-state");
  ok(badge && /已开启/.test(badge.textContent), "徽章同步为「已开启」");
  hook.disarm();
  ok(hook.armed() === false, "解除后回到未开启");
  ok(badge && /未开启/.test(badge.textContent), "徽章同步回「未开启」");
  const b = hook.banner();
  ok(!!b && b.hidden === true, "横幅默认隐藏（无误报）");
}

console.log("\n⑦ 产物一致性与纯净度");
ok(has(demoHtml, /armDegradeDemo/), "构建产物含演练开关");
ok(has(demoHtml, /fallback-who/), "构建产物含角色化横幅");
ok(has(demoHtml, /degrade-arm-state/), "构建产物含演练状态");
ok(
  nrm(interviewSrc).includes("当前已是本地推理模式：降级演练需在接入真实模型后触发"),
  "本就是本地模式时如实告知，不让开关挂着不触发"
);
ok(!/\b评审\b|\b评委\b|\b答辩\b/.test(demoHtml), "禁用词自检通过");

console.log("\n" + "=".repeat(58));
console.log(`v42b 断言：通过 ${pass} / 失败 ${fail}`);
console.log("=".repeat(58) + "\n");
process.exit(fail ? 1 : 0);
