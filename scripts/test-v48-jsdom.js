/* v48 · 弹窗按钮被拖拽逻辑吞掉点击
 *
 * 起因：反馈「开发者模式还是进不去，点击没反应」。真机复现到的因果链是：
 *   .modal-box 的拖拽抓手（没有 .modal-head 时回退成整个弹窗）
 *   → 在弹窗里任何位置按下都会执行 grip.setPointerCapture()
 *   → 指针被弹窗捕获，pointerup / mouseup / click 全部重定向到弹窗本身
 *   → 里面按钮的 onclick 永远收不到事件（键盘 Enter 反而正常）
 * 也就是「密码输完点『进入』毫无反应」，取消按钮同样点不动。
 *
 * 这里守住四件事：
 *   ① 拖拽不再用指针捕获（结构断言，防止回退）；
 *   ② 在按钮 / 输入框等可交互元素上按下时不启动拖拽；
 *   ③ 拖拽本身仍然可用（在弹窗空白处按下仍能拖）；
 *   ④ 弹窗里的按钮确实能收到点击。
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

const motionSrc = rd("frontend/js/core/motion.js");
const demoHtml = rd("public/futuremirror-demo.html");
const dragSrc = motionSrc.slice(
  motionSrc.indexOf("function makeDraggable"),
  motionSrc.indexOf("function makeResizable")
);

console.log("\n① 结构：不许再用指针捕获");
ok(!dragSrc.includes("setPointerCapture"), "拖拽逻辑里没有 setPointerCapture（它会把弹窗内按钮的 click 抢走）");
ok(!/[.\w]setPointerCapture\(/.test(motionSrc), "motion.js 里没有指针捕获调用（注释不影响）");
ok(/DRAG_SKIP/.test(motionSrc), "定义了可交互元素白名单 DRAG_SKIP");
["button", "a", "input", "select", "textarea", "label"].forEach((sel) => {
  ok(new RegExp("DRAG_SKIP = [\"'][^\"']*" + sel).test(motionSrc), "白名单覆盖 " + sel);
});
ok(/function inInteractive\(/.test(motionSrc), "抽出 inInteractive() 统一判断，避免各处漏写");
ok(/if \(inInteractive\(e\.target\)\) return;/.test(dragSrc), "按下点在可交互元素上时直接不启动拖拽");
ok(/doc\.addEventListener\("pointermove"/.test(dragSrc), "拖动监听挂在 document（指针移出弹窗也不断）");
ok(/doc\.addEventListener\("pointerup", stop\)/.test(dragSrc), "松手监听挂在 document");
ok(/doc\.addEventListener\("pointercancel", stop\)/.test(dragSrc), "pointercancel 同样收尾，不会卡在拖动中");
ok(/box\.style\.animation = "none"/.test(dragSrc), "拖动前解除入场动画（fill:both 会压住内联 transform）");

console.log("\n② 构建产物一致性");
ok(demoHtml.includes("DRAG_SKIP"), "演示包内含新拖拽逻辑");
ok(!/grip\.setPointerCapture\(/.test(demoHtml), "演示包里拖拽不再申请指针捕获");

console.log("\n③ 行为回放：弹窗里按下按钮不应被当成拖拽");
const dom = new JSDOM(
  `<!doctype html><html><head></head><body>
     <div class="modal" id="m">
       <div class="modal-box">
         <h3>进入开发者模式</h3>
         <input id="pw" type="password">
         <button id="go">进入</button>
       </div>
     </div>
   </body></html>`,
  {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
  }
);
const w = dom.window;
const doc = w.document;
const box = doc.querySelector(".modal-box");
let captured = 0;
box.setPointerCapture = () => {
  captured++;
};
let clicks = 0;
doc.getElementById("go").addEventListener("click", () => {
  clicks++;
});

w.eval(motionSrc);
/* 迷你页的 DOMContentLoaded 可能已经错过，显式再挂一次（initDialogs 自身幂等） */
try {
  if (w.__bpMotion && w.__bpMotion.initDialogs) w.__bpMotion.initDialogs();
} catch (e) {}

const ptr = (type, target, x, y) => {
  const e = new w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  target.dispatchEvent(e);
  return e;
};

ok(box.classList.contains("bp-dialog-grip"), "没有 .modal-head 时整块弹窗仍作为抓手（行为不回退）");
ok(!!doc.querySelector(".bp-dialog-resize"), "缩放手柄仍然挂上");

ptr("pointerdown", doc.getElementById("go"), 100, 100);
ptr("pointermove", doc, 160, 140);
ok(box.style.transform === "", "在按钮上按下 + 移动，弹窗没有被拖动");
ok(captured === 0, "按下按钮时没有申请指针捕获");

ptr("pointerdown", doc.getElementById("pw"), 100, 120);
ptr("pointermove", doc, 200, 200);
ok(box.style.transform === "", "在输入框上按下也不会拖动弹窗");

ptr("pointerdown", box, 100, 100);
ptr("pointermove", doc, 140, 130);
ok(/translate3d\(40px,\s*30px/.test(box.style.transform), "在弹窗空白处按下仍能拖动（功能保住）");
ptr("pointerup", doc, 140, 130);
ptr("pointermove", doc, 300, 300);
ok(/translate3d\(40px,\s*30px/.test(box.style.transform), "松手后不再跟随（拖动结束）");

doc.getElementById("go").click();
ok(clicks === 1, "弹窗里的按钮能收到点击");

console.log("\n④ 门禁流程回归（结构层面）");
const indexSrc = rd("frontend/index.html");
const gateBlock = indexSrc.slice(indexSrc.indexOf('id="eval-gate-modal"'), indexSrc.indexOf('id="toast"'));
ok(/id="eval-password"/.test(gateBlock), "密码框仍在弹窗内");
ok(/onclick="submitEvalPassword\(\)"/.test(gateBlock), "「进入」按钮仍绑定提交函数");
ok(/onclick="closeEvalGate\(\)"/.test(gateBlock), "「取消」按钮仍绑定关闭函数");
ok(
  /onkeydown="if\(event\.key==='Enter'\)submitEvalPassword\(\)"/.test(gateBlock),
  "回车提交仍是键盘路径（鼠标失效时的兜底）"
);
ok(!/grip\.setPointerCapture\(/.test(demoHtml), "整包内拖拽无指针捕获残留");

dom.window.close();
console.log("\n结果：" + pass + " 通过 / " + fail + " 失败（共 " + (pass + fail) + " 项）");
process.exit(fail ? 1 : 0);
