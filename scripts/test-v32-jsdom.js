/* v32 jsdom 测试：面试轮次收尾 + 侧栏滚动回归（Beta 1.1.2）
 * 覆盖：① MAX_TURNS 常量与「实时能力追踪」口径统一为 5 轮
 *       ② 未达 5 轮不收尾（防止第 1 题就自动结束）
 *       ③ 第 5 题答完由面试官发通知并自动结束（文案 / 输入锁定 / 进度条 / 提示）
 *       ④ 收尾幂等：双通道（Mock 与真实 LLM）不会重复发通知
 *       ⑤ 「重新面试」解锁输入并回到 0/5
 *       ⑥ .bp-aside 纵向可滚动（不再被 overflow:hidden 吃掉滚动）
 * 用法：node scripts/test-v32-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");
const themeCss = fs.readFileSync(path.join(__dirname, "..", "frontend", "css", "theme.css"), "utf8");

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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function makeDom() {
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
  });
  const settle = () =>
    new Promise((res) => {
      if (dom.window.document.readyState === "complete") return res();
      dom.window.document.addEventListener("DOMContentLoaded", res, { once: true });
      setTimeout(res, 900);
    });
  return { dom, errors, settle };
}

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v32 jsdom 测试（面试 5 轮自动收尾 + 侧栏滚动回归 · Beta 1.1.2）===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  const d = w.document;
  await settle();
  // 顶层 const/let 不挂 window，统一用 w.eval 读
  const ev = (expr) => w.eval(expr);

  /* ---------- ① 轮次常量与口径 ---------- */
  console.log("\n① 轮次上限常量");
  ok(ev("typeof MAX_TURNS === 'number' && MAX_TURNS === 5"), "MAX_TURNS 固定为 5");
  ok(ev("typeof MODE_LABEL === 'object' && typeof MODE_SHORT === 'object'"), "面试模式标签表就绪（收尾文案要用）");
  ok(/0\/\$\{MAX_TURNS\}|0\/5/.test(html), "重置态进度文案走 MAX_TURNS，不写死 5");

  /* ---------- ② 侧栏滚动 ---------- */
  console.log("\n② 「实时能力追踪」所在侧栏可纵向滚动");
  const asideBlock = (themeCss.match(/\.bp-aside\s*\{[^}]*\}/) || [""])[0];
  ok(/overflow-y:\s*auto/.test(asideBlock), ".bp-aside 纵向 overflow-y: auto");
  ok(!/overflow:\s*hidden/.test(asideBlock), ".bp-aside 不再用 overflow: hidden 简写（会裁掉纵向滚动）");
  ok(/overflow-x:\s*hidden/.test(asideBlock), ".bp-aside 横向仍裁剪（折叠收放需要）");
  const asideInBuild = (html.match(/\.bp-aside\s*\{[^}]*\}/) || [""])[0];
  ok(/overflow-y:\s*auto/.test(asideInBuild), "构建产物 public/futuremirror-demo.html 同步含该规则");

  /* ---------- 准备：登录 + 屏蔽报告跳转 ---------- */
  ev("currentUser = { id: 'u_test', email: 't@example.com', name: '测试' };");
  // finishInterview 会异步拉报告，这里换成空实现，只校验收尾本身
  ev("if (typeof finishInterview === 'function') { finishInterview = function () {}; }");

  const seed = (n) =>
    ev(`
      (function () {
        session.mode = 'tech';
        session.turns = [];
        for (var i = 1; i <= ${n}; i++) {
          session.turns.push({ agent: '技术面试官', question: 'Q' + i, answer: 'A' + i, notes: 'n' + i, mode: 'tech' });
        }
        return session.turns.length;
      })()
    `);
  const notices = () =>
    ev(
      "Array.from(document.querySelectorAll('.chat-body .msg-system')).filter(function(e){return /面试到此结束/.test(e.textContent);}).length"
    );

  /* ---------- ③ 未达轮次不收尾 ---------- */
  console.log("\n③ 未达 5 轮不触发收尾");
  seed(3);
  ev("interviewClosed = false; lockInput(false);");
  ev("document.getElementById('chat-body').innerHTML = '';");
  const early = ev("maybeFinishAtTurnLimit()");
  ok(early === false, "3 轮时 maybeFinishAtTurnLimit() 返回 false");
  ok(notices() === 0, "3 轮时未发出结束通知");
  ok(d.getElementById("chat-input").disabled === false, "3 轮时输入框仍可用");

  /* ---------- ④ 第 5 轮自动收尾 ---------- */
  console.log("\n④ 第 5 轮答完由面试官收尾");
  seed(5);
  ev("interviewClosed = false; lockInput(false);");
  ev("document.getElementById('chat-body').innerHTML = '';");
  const late = ev("maybeFinishAtTurnLimit()");
  ok(late === true, "5 轮时 maybeFinishAtTurnLimit() 返回 true");
  ok(notices() === 1, "发出且仅发出 1 条结束通知");
  const noticeText = ev(
    "Array.from(document.querySelectorAll('.chat-body .msg-system')).filter(function(e){return /面试到此结束/.test(e.textContent);})[0].textContent"
  );
  ok(/面试官/.test(noticeText), "通知以「面试官」口吻发出");
  ok(/5 轮问答已完成/.test(noticeText), "通知说明已完成 5 轮问答");
  ok(/技术面/.test(noticeText), "通知带上具体面试模式");
  ok(d.getElementById("chat-input").disabled === true, "输入框被冻结");
  ok(/5\/5/.test(d.getElementById("chat-input").placeholder), "输入框提示为已结束（5/5）");
  ok(d.getElementById("chat-send").disabled === true, "发送按钮被冻结");
  ok(/本轮面试已结束/.test(d.getElementById("live-hint").textContent), "实时能力追踪提示切换为已结束");
  ok(d.getElementById("progress-bar").style.width === "100%", "进度条置满");
  ok(ev("interviewClosed === true"), "interviewClosed 置位，防止重复收尾");

  /* ---------- ⑤ 幂等 ---------- */
  console.log("\n⑤ 收尾幂等（Mock / 真实 LLM 双通道不重复）");
  ev("maybeFinishAtTurnLimit(); finishByInterviewer();");
  ok(notices() === 1, "重复调用后仍只有 1 条结束通知");

  /* ---------- ⑥ 重新面试解锁 ---------- */
  console.log("\n⑥ 「重新面试」回到可答题状态");
  ev("restartInterview()");
  await wait(200);
  ok(ev("session.turns.length === 0"), "新一轮问答数归零");
  ok(ev("interviewClosed === false"), "收尾状态被清除");
  ok(d.getElementById("chat-input").disabled === false, "输入框解冻");
  ok(/0\/5/.test(d.getElementById("live-turn").textContent), "实时追踪回 0/5");
  ok(d.getElementById("progress-bar").style.width === "0%", "进度条归零");

  /* ---------- 收尾 ---------- */
  console.log("\n⑦ 运行期无脚本错误");
  ok(errors.length === 0, "jsdom 无未预期脚本错误" + (errors.length ? "：" + errors[0].slice(0, 120) : ""));

  console.log("\n----------------------------------------------------------");
  console.log(`v32 结果：${pass} 通过，${fail} 失败`);
  console.log("==========================================================");
  process.exit(fail ? 1 : 0);
}
