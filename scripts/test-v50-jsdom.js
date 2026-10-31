/* v50 · 全面检测后的修复（不升版，仍是 Beta 1.1.2）
 *
 * 这一批不是新功能，是把「检测脚本 + 真实浏览器点一遍」暴露出来的五处不一致修掉，
 * 每一处都能用一句话说清「用户看到什么、为什么错、改成什么」：
 *
 *   ① 计划页写着「0/21 项任务」，工作台却把「学习任务」显示成「--」
 *      ——基线计划只在内存里生成、从不落盘，指挥台读 fm_plan 自然是空的。
 *      现在首次读取即落盘，两处读的是同一份数据。
 *   ② 畸形本地数据（days 里混进 null / tasks 不是数组）会让整块指挥台渲染失败
 *      ——改成跳过坏数据，仪表照常显示。
 *   ③ 暗色主题下仪表空弧用 --line（#322D23）压在 --card（#1D1A15）上，
 *      几乎看不见，整只仪表像没画出来 ——换成 --line-2。
 *   ④ 面试等回复时点「重新面试」，旧回复回来仍会写进新会话：
 *      界面 0/5、实际 1/5，报告还会给一条从未显示过的回答打分。
 *      ——加轮次世代号 + 中止在途请求，两个通道同时生效。
 *   ⑤ MBTI 结果页标题写死「你的面试策略已调整」，正文却说「不启用个性化策略」
 *      ——按典型度分两套说法，不再先承诺再否认。
 *
 * 这里守住三类约束：
 *   A. 行为：指挥台与计划读同一份数据、坏数据不炸、仪表分段正确；
 *   B. 竞态：重新面试必须让上一轮作废（两个通道都检查世代号）；
 *   C. 口径：弱人格不许出现「已调整」，强人格才允许。
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

const appfx = rd("frontend/js/features/appfx.js");
const planSrc = rd("frontend/js/features/plan.js");
const interviewSrc = rd("frontend/js/features/interview.js");
const personaSrc = rd("frontend/js/features/persona.js");
const demoHtml = rd("public/futuremirror-demo.html");

/* 取指挥台渲染逻辑（与 v49 相同的切片方式，保证测的是真代码而不是复刻版） */
const src = appfx.slice(appfx.indexOf("function cmdGaugeSVG"), appfx.indexOf("FX.renderCmdBand = renderCmdBand;"));

function makeWin(data, opts) {
  const o = opts || {};
  const dom = new JSDOM(`<!doctype html><html><body><section class="cmd-band"></section></body></html>`, {
    url: "https://example.test/",
    virtualConsole: new VirtualConsole(),
  });
  const w = dom.window;
  const calls = [];
  const store = {
    get(k, d) {
      return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : d;
    },
  };
  const session = { turns: data.__turns ? new Array(data.__turns) : [] };
  const escHtml = (v) =>
    String(v == null ? "" : v).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
    );
  const deps = [w.document, store, session, escHtml, (page) => calls.push(page)];
  const names = ["document", "store", "session", "escHtml", "switchTab"];
  if (typeof o.lpGet === "function") {
    deps.push(o.lpGet);
    names.push("lpGet");
  }
  const fn = new Function(...names, src + "\n;return renderCmdBand;")(...deps);
  return { w, render: () => fn(), calls };
}

console.log("\n① 计划页与指挥台：读同一份数据");
{
  const plan = { days: [{ tasks: [{ done: true }, { done: true }, { done: false }] }, { tasks: [{ done: true }] }] };
  const nav = makeWin({ fm_resume: "简历" }, { lpGet: () => plan });
  nav.render();
  const box = nav.w.document.querySelector(".cmd-band");
  const text = box.textContent.replace(/\s+/g, " ");
  ok(/3\/4/.test(text), "指挥台按计划实况读 3/4，而不是「--」");
  ok(box.querySelector(".cmd-bar i").getAttribute("style").includes("75%"), "进度条按 3/4=75% 填充");
  ok(box.querySelectorAll(".cmd-v-empty").length === 1, "此时只剩「最近总分」一个占位符");
}
{
  /* lpGet 抛错（例如存储被禁用）→ 必须回落 fm_plan，而不是让整块仪表消失 */
  const nav = makeWin(
    { fm_plan: { days: [{ tasks: [{ done: true }, { done: false }] }] } },
    {
      lpGet: () => {
        throw new Error("storage disabled");
      },
    }
  );
  let threw = false;
  try {
    nav.render();
  } catch (e) {
    threw = true;
  }
  ok(!threw, "lpGet 抛错不影响渲染");
  ok(/1\/2/.test(nav.w.document.querySelector(".cmd-band").textContent), "回落读 fm_plan（1/2）");
}
ok(/lpCreate\("baseline"\)[\s\S]{0,80}lpSave\(seed\)/.test(planSrc), "基线计划首次读取即落盘（不再只活在内存里）");
ok(
  /typeof lpGet === "function" \? lpGet\(\) : g\("fm_plan", null\)/.test(appfx),
  "指挥台通过 lpGet 读计划（拿不到时才回落 fm_plan）"
);

console.log("\n② 畸形本地数据：跳过去，不要炸整块");
{
  const nav = makeWin({ fm_plan: { days: [null, { tasks: "oops" }, { tasks: [{ done: true }] }] } });
  let threw = false;
  try {
    nav.render();
  } catch (e) {
    threw = true;
  }
  ok(!threw, "days 里混 null / tasks 不是数组时不抛错");
  const text = nav.w.document.querySelector(".cmd-band").textContent;
  ok(/1\/1/.test(text), "坏数据跳过，好数据仍然计数（1/1）");
  ok(nav.w.document.querySelectorAll(".cmd-v-empty").length === 1, "指标格没有被坏数据打空");
}
ok(/Array\.isArray\(plan\.days\)/.test(appfx), "plan.days 做了数组校验");
ok(/!Array\.isArray\(d\.tasks\)\) return/.test(appfx), "单日 tasks 也做了数组校验");
ok(/if \(!d \|\| typeof d !== "object"\) return;/.test(planSrc), "计划读取时同样跳过非对象的天");

console.log("\n③ 仪表：暗色主题下也要看得见分段");
{
  const nav = makeWin({});
  nav.render();
  const circles = nav.w.document.querySelectorAll(".cmd-band circle");
  ok(circles.length === 5, "仍然是 5 段");
  const strokes = Array.from(circles).map((c) => c.getAttribute("stroke"));
  ok(
    strokes.every((s) => s === "var(--line-2)"),
    "空弧统一用 --line-2（暗色下不再隐入背景）"
  );
  ok(!strokes.some((s) => s === "var(--line)"), "不再使用低对比的 --line");
}
{
  const nav = makeWin({ fm_history: [{ total: 70 }, { total: 80 }] });
  nav.render();
  const on = nav.w.document.querySelectorAll('.cmd-band circle[stroke="var(--brand)"]');
  ok(on.length === 2, "点亮段仍用品牌色（2 次记录 → 2 段）");
}

console.log("\n④ 重新面试：上一轮必须作废");
ok(/let roundGen = 0;/.test(interviewSrc), "存在轮次世代号 roundGen");
ok(/let inflightCtrl = null;/.test(interviewSrc), "存在在途请求句柄 inflightCtrl");
const restartBody = interviewSrc.slice(
  interviewSrc.indexOf("function restartInterview()"),
  interviewSrc.indexOf("function restartInterview()") + 900
);
ok(/roundGen\+\+/.test(restartBody), "重新面试先自增世代号");
ok(
  restartBody.indexOf("roundGen++") < restartBody.indexOf("session.turns = []"),
  "自增发生在清空会话之前（先作废旧轮，再清状态）"
);
ok(/inflightCtrl\.abort\(\)/.test(restartBody), "重新面试会中止在途请求");
ok(/inflightCtrl = ctrl;/.test(interviewSrc), "真实通道发送时登记 AbortController");
ok((interviewSrc.match(/gen !== roundGen/g) || []).length >= 6, "两个通道共 6 处以上世代校验");
const realBody = interviewSrc.slice(
  interviewSrc.indexOf("async function sendMsgReal"),
  interviewSrc.indexOf("function finishInterview()")
);
ok(/const gen = roundGen;/.test(realBody), "真实通道发送时记下世代号");
ok((realBody.match(/gen !== roundGen/g) || []).length >= 2, "成功路径与降级路径都做校验");
const mockBody = interviewSrc.slice(
  interviewSrc.indexOf("function sendMsgMock"),
  interviewSrc.indexOf("v42b · 降级演练开关")
);
ok(/const gen = roundGen;/.test(mockBody), "Mock 通道同样记下世代号");
ok((mockBody.match(/gen !== roundGen/g) || []).length >= 4, "Mock 通道的时间线回调也都做校验");
ok(/if \(inflightCtrl === ctrl\) inflightCtrl = null;/.test(realBody), "请求结束后清理句柄（不误杀下一轮）");

console.log("\n⑤ MBTI 策略卡：说真话");
{
  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    url: "https://example.test/",
    runScripts: "dangerously",
    virtualConsole: new VirtualConsole(),
  });
  const w = dom.window;
  const boot = w.document.createElement("script");
  boot.textContent =
    'function escHtml(v){return String(v==null?"":v).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}';
  w.document.body.appendChild(boot);
  const s = w.document.createElement("script");
  s.textContent = personaSrc;
  w.document.body.appendChild(s);

  const build = (pct) =>
    `personaBridgeHtml(personaParams({type:"ESTJ",dims:[{key:"EI",pctA:${pct},strength:${Math.abs(pct - 50) * 2},name:"精力来源",letter:"E"}]}))`;
  const weak = w.eval(build(50));
  const strong = w.eval(build(90));
  ok(/本次按通用策略提问/.test(weak), "典型度不足时标题说「按通用策略提问」");
  ok(!/你的面试策略已调整/.test(weak), "典型度不足时不再声称「已调整」");
  ok(/不启用个性化策略/.test(weak), "同时保留不启用的原因说明");
  ok(/不据此改写提问方式/.test(weak), "导语说明本次不据参数改写");
  ok(/看看通用策略怎么问/.test(weak), "按钮文案跟着改（不暗示个性化）");
  ok(/你的面试策略已调整/.test(strong), "典型度足够时才说「已调整」");
  ok(!/本次按通用策略提问/.test(strong), "强人格不出现「通用策略」字样");
}

console.log("\n⑥ 交付一致性：构建产物里确实带着修复");
ok(/roundGen/.test(demoHtml), "演示包含轮次世代号（修复已进交付物）");
ok(/本次按通用策略提问/.test(demoHtml), "演示包含诚实版策略卡文案");
ok(/var\(--line-2\)/.test(demoHtml), "演示包含仪表新描边色");
ok(/首次读取即落盘/.test(demoHtml), "演示包含计划落盘说明");
ok(!/on \? "var\(--brand\)" : "var\(--line\)"/.test(demoHtml), "演示包里已无空弧旧色（逐字比对仪表模板）");

console.log("\n" + "-".repeat(58));
console.log(`合计 ${pass + fail} 项：通过 ${pass}，失败 ${fail}`);
process.exit(fail ? 1 : 0);
