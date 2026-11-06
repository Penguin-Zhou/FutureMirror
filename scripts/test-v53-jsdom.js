/* v53 · 对话式匹配的落点（不升版，仍是 1.0.0）
 *
 * 起因：为演示写「4 轮追问把匹配度从 71% 拉到 86%」这段脚本时，在真实浏览器里
 * 走了一遍完整流程，发现答完第 4 问之后屏幕上既没有输入框、也没有按钮、更没有
 * 汇总卡——追问流程唯一的落点（71% → 86% 那张卡）只有「不等答完就手动结束」
 * 才看得到。追下去是两个缺陷：
 *
 * ① renderMatchQa 的 done 分支渲染空串，把回答区与「结束并应用」一起收掉。
 *    而汇总卡只在 finishMatchQa 里渲染，于是答满 4 问 = 流程断在半路。
 * ② applyQaEvidence 会往 matchResult.skills 里并入新证据、从 gaps 里剔除已补齐的，
 *    但屏幕上只更新了分数环（paintMatchRing），技能与缺口两块仍是首次渲染的文字，
 *    出现「86 分 / 缺口仍列着 Next.js」这种自相矛盾的画面。
 */
const fs = require("fs");
const path = require("path");

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

const matchSrc = rd("frontend/js/features/match.js");
const demoHtml = rd("public/futuremirror-demo.html");
const globalsJson = rd("frontend/eslint-globals.json");
const cut = (src, from, to) => src.slice(src.indexOf(from), src.indexOf(to));

/* ---------- 用最小假 DOM 跑真代码 ---------- */
const QA_N = 4;
function harness(stateI, summaryChildren) {
  const node = summaryChildren === null ? null : { children: new Array(summaryChildren).fill(0) };
  const body = { innerHTML: "" };
  const $ = (id) => (id === "match-qa-body" ? body : id === "match-qa-summary" ? node : null);
  const matchQaState = {
    i: stateI,
    log: [
      { role: "ai", text: "第 1 问：…" },
      { role: "user", text: "我做过协同白板" },
    ],
    scoreTrail: [{ label: "第 1 轮", v: 71 }],
  };
  const fn = new Function(
    "$",
    "matchQaState",
    "MATCH_QA_STEPS",
    "trendSVG",
    "escHtml",
    cut(matchSrc, "function renderMatchQa", "function submitMatchQaAnswer") + "\n;return renderMatchQa;"
  );
  const render = fn(
    $,
    matchQaState,
    new Array(QA_N).fill({ key: "k", q: "q" }),
    () => "<svg>chart</svg>",
    (s) => String(s)
  );
  render();
  return body.innerHTML;
}

console.log("\n① 答满 4 问后有落点");
{
  const mid = harness(1, 0);
  ok(/id="mqa-input"/.test(mid), "没答完时仍有回答输入框");
  ok(/结束并应用/.test(mid), "没答完时有「结束并应用」");
  ok(!/生成对话增强结果/.test(mid), "没答完时不出现过早的收尾按钮");

  const doneEmpty = harness(QA_N, 0);
  ok(/生成对话增强结果/.test(doneEmpty), "答满且汇总空时给出收尾按钮");
  ok(/onclick="finishMatchQa\(\)"/.test(doneEmpty), "收尾按钮接的是 finishMatchQa");
  ok(/已答完 4 问/.test(doneEmpty), "并说明 4 问已答完");
  ok(!/id="mqa-input"/.test(doneEmpty), "答满后不再显示输入框");
  ok(!/结束并应用/.test(doneEmpty), "答满后旧按钮不再重复出现");

  const doneFilled = harness(QA_N, 1);
  ok(!/生成对话增强结果/.test(doneFilled), "汇总卡已渲染时不再重复给收尾按钮");
  ok(!/id="mqa-input"/.test(doneFilled), "汇总卡已渲染时也不再显示输入框");

  const nullSummary = harness(QA_N, null);
  ok(/mqa-log/.test(nullSummary), "没有汇总容器时不抛错、对话记录仍保留");
  ok(!/id="mqa-input"/.test(nullSummary), "答满后同样不显示输入框");
}

console.log("\n② 最后一问答完自动收尾");
{
  const submitSrc = cut(matchSrc, "function submitMatchQaAnswer", "v53：整卡重渲染已由 renderMatchResult");
  ok(/matchQaState\.i\+\+/.test(submitSrc), "提交后推进问数");
  ok(
    /if \(matchQaState\.i >= MATCH_QA_STEPS\.length\) \{\s*finishMatchQa\(\);\s*return;/.test(submitSrc),
    "推进到末问即调用 finishMatchQa 并返回"
  );
  ok(submitSrc.indexOf("finishMatchQa()") < submitSrc.indexOf("renderMatchQa()"), "自动收尾排在普通重渲染之前");
  ok(!/paintMatchRing\s*\(/.test(matchSrc), "已无只改分数环的旧调用");
  ok(!/function paintMatchRing/.test(demoHtml), "演示包也无 paintMatchRing 残留");
}

console.log("\n③ 分数、技能、缺口同源渲染");
{
  const rrSrc = cut(matchSrc, "function renderMatchResult", "/* 简历文件上传");
  ok(/function renderMatchResult/.test(matchSrc), "结果卡抽成独立渲染函数");
  ok(/p\.skills\.map/.test(rrSrc) && /p\.gaps\.map/.test(rrSrc), "技能与缺口都由同一对象渲染");
  ok(/ringSVG\(p\.matchScore\)/.test(rrSrc), "分数环也取自同一对象");
  ok(
    /renderMatchResult\(p\)/.test(cut(matchSrc, "function analyze", "v53：结果卡单独抽成渲染函数")),
    "analyze 走同一个入口"
  );
  ok(/renderMatchResult\(matchResult\)/.test(matchSrc), "追问写入证据后同入口重渲染");

  /* 真跑一遍渲染，确认三块内容都来自入参而不是残留 */
  const box = { innerHTML: "" };
  const $ = (id) => (id === "match-result" ? box : null);
  const fn = new Function(
    "$",
    "ringSVG",
    "escHtml",
    "requestAnimationFrame",
    cut(matchSrc, "function renderMatchResult", "/* 简历文件上传") + "\n;return renderMatchResult;"
  );
  const render = fn(
    $,
    (s) => `<svg aria-label="匹配分 ${s} 分"></svg>`,
    (s) => String(s),
    (f) => f()
  );
  render({ matchScore: 86, skills: ["React", "Next.js"], gaps: ["Tailwind"], suggestions: ["补强 Tailwind"] });
  ok(/匹配分 86 分/.test(box.innerHTML), "环上分数是新的 86");
  ok(/chip-green">Next\.js/.test(box.innerHTML), "刚补齐的 Next.js 出现在已具备技能里");
  ok(!/chip-red">Next\.js/.test(box.innerHTML), "同时不再出现在能力缺口里");
  ok(/chip-red">Tailwind/.test(box.innerHTML), "真正的缺口 Tailwind 仍在");
  ok(/补强 Tailwind/.test(box.innerHTML), "建议随新对象刷新");
  render({ matchScore: 92, skills: ["React"], gaps: [], suggestions: [] });
  ok(/无明显缺口/.test(box.innerHTML), "缺口清空时给出「无明显缺口」");
  ok(!/chip-green">Next\.js/.test(box.innerHTML), "重渲染不残留上一轮的芯片");
  render(null);
  ok(box.innerHTML.indexOf("匹配分 92") >= 0, "空对象直接返回、不覆盖已有内容");
}

console.log("\n④ 全局符号与演示包");
{
  ok(/"renderMatchResult"/.test(globalsJson), "白名单收录 renderMatchResult");
  ok(!/"paintMatchRing"/.test(globalsJson), "白名单已移除 paintMatchRing");
  ok(/renderMatchResult/.test(demoHtml), "演示包含新渲染入口");
  ok(/生成对话增强结果/.test(demoHtml), "演示包含答满后的收尾按钮");
  ok(/已答完/.test(demoHtml) && /needFinish/.test(demoHtml), "演示包含答满态判定");
}

console.log("\n" + "-".repeat(58));
console.log(`合计 ${pass + fail} 项：通过 ${pass}，失败 ${fail}`);
process.exit(fail ? 1 : 0);
