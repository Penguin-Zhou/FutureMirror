/* v43 · 人格参数化层断言
 *
 * MBTI 原本是「功能列表里的第 10 项」：测完给四个字母，结束。
 * 这一组断言要证明它已经变成面试的输入参数，而且这个过程是可审计的：
 * ① 四个维度被折算成带方向与强度的数值参数，每个都能回溯到维度与百分比；
 * ② 同一句回答，参数不同 → 追问不同（规则确定，可复现）；
 * ③ 压力面强度适配会在追问下方显性标注；
 * ④ 报告的「人格 - 表现关联」必须允许说「无显著关联」，不能硬编故事；
 * ⑤ 测评结果逐题可溯源；20 题可分段续答；
 * ⑥ 无测评 / 参数不显著时一律诚实降级，不臆测人格；
 * ⑦ 人格参数从不进入评分（scoring 里没有任何 MBTI 痕迹）。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const has = (s, re) => re.test(s);
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
const scoringPy = rd("backend/app/scoring.py");

/* 与既有套件一致：装载构建后的单文件演示包。
 * 顶层 const 不会挂到 window（jsdom 里也一样），必须走同一段脚本的作用域，
 * 后续用 w.eval("符号名") 读取——这也是「测试读构建产物」的既定口径。 */
function boot() {
  const dom = new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new (require("jsdom").VirtualConsole)(),
  });
  return dom.window;
}

const w = boot();
const ev = (code) => w.eval(code);

/* 用整卷作答构造确定结果：全 2 → ESTJ，全 -2 → INFP，全 0 → 四维居中。
 * 注意：题目 dir 交替，全选「同意」并不等于 100% 倾向（原始分只有 ±2），
 * 因此再做一组「一致最大化」作答（v = ±2·dir），把四维推到 100%，
 * 用来验证参数方向而不是验证量表强度。 */
function resultOf(v) {
  return ev("computeMbtiResult")(ev("MBTI_QUESTIONS").map((q) => ({ dim: q.dim, dir: q.dir, v })));
}
function resultExtreme(sign) {
  return ev("computeMbtiResult")(ev("MBTI_QUESTIONS").map((q) => ({ dim: q.dim, dir: q.dir, v: 2 * sign * q.dir })));
}

const rEstj = resultOf(2);
const rInfp = resultOf(-2);
const rMid = resultOf(0);
const rEstjMax = resultExtreme(1); // 全维推向 a 字母：E / S / T / J
const rInfpMax = resultExtreme(-1); // 全维推向 b 字母：I / N / F / P

/* ---------- ① 参数化：四维 → 带方向与来源的参数 ---------- */
console.log("\n① 人格参数化（可检查的行为权重，不是形容词）");
ok(rEstj.type === "ESTJ" && rInfp.type === "INFP", `基准结果可复现（ESTJ / INFP）`);
ok(rEstjMax.type === "ESTJ" && rInfpMax.type === "INFP", "一致最大化作答仍收敛到同一类型");
const pE = ev("personaParams")(rEstjMax);
const pI = ev("personaParams")(rInfpMax);
const pM = ev("personaParams")(rMid);
const val = (p, k) => ev("personaParam")(p, k).value;
ok(pE && pE.params.length === 5, "四个维度折算为 5 个行为参数");
ok(
  pE.params.every((x) => x.from && typeof x.from.pct === "number" && Math.abs(x.value) <= 1),
  "每个参数都带来源维度与百分比（value ∈ [-1,1]）"
);
ok(
  val(pE, "structure") > 0.3 && val(pE, "openness") > 0.3 && val(pE, "empathy") < -0.3,
  "ESTJ：偏 J（结构化）· 偏 E（开放）· 偏 T（低情绪适配）"
);
ok(val(pE, "evidence") > 0.3 && val(pE, "concrete") > 0.3, "ESTJ：偏 T 举证 · 偏 S 细节");
ok(
  val(pI, "structure") < -0.3 && val(pI, "openness") < -0.3 && val(pI, "empathy") > 0.3,
  "INFP：偏 P · 偏 I · 偏 F（方向全部反转，说明取的是补数而非写死）"
);
ok(val(pI, "concrete") < -0.3, "INFP：偏 N（模式而非细节）");
ok(pM && pM.significant === false, "四维全居中时判定「参数不显著」");

/* ---------- ② 策略：三角色各自变化 ---------- */
console.log("\n② 三角色策略（同一份测评，三种面法）");
const sE = ev("personaStrategy")(pE);
const sI = ev("personaStrategy")(pI);
ok(sI.pressure.level === "温和" && sI.adapted === true, "偏 F → 压力面强度降为「温和」并标记已适配");
ok(sE.pressure.level === "高强度" && sE.adapted === true, "偏 T → 压力面按「高强度」施压");
ok(sI.hr.label === "结构化递进", "偏 I → HR 面改结构化递进（减少开放式施压）");
ok(sE.hr.label === "开放式引导", "偏 E → HR 面保留开放式引导");
ok(sI.tech.label === "模式与迁移" && sE.tech.label === "细节与经验", "偏 N / 偏 S 的技术面追问侧重点不同");

/* ---------- ③ 系统提示词：只给指令，不给标签 ---------- */
console.log("\n③ 提示词注入（真实 LLM 通道）");
const suffix = ev("personaPromptSuffix")(pE);
ok(/提问策略参数/.test(suffix), "提示词追加「提问策略参数」段");
ok(/不得在提问中提及人格类型/.test(suffix), "明确禁止把人格类型说给候选人听");
ok(/偏向 E（100%/.test(suffix), "参数以「字母 + 百分比」形式写入，可核对");
ok(ev("personaPromptSuffix")(pM) === "", "参数不显著时返回空串（不硬塞噪声）");
ok(ev("personaPromptSuffix")(null) === "", "无测评时不注入任何人格内容");

/* ---------- ④ 出题差异：同一回答，不同追问 ---------- */
console.log("\n④ Mock 通道：同一句回答，参数不同 → 追问不同");
const qE = ev("personaQuestionBias")(pE, 1, "缓存一致性");
const qI = ev("personaQuestionBias")(pI, 1, "缓存一致性");
ok(qE && qI, "参数显著时给出人格偏置追问");
ok(qE.question !== qI.question, `同一关键词下两种人格问出不同问题`);
ok(qI.question.includes("缓存一致性") && qE.question.includes("缓存一致性"), "偏置追问仍锚定原关键词");
ok(ev("personaQuestionBias")(pE, 2, "缓存一致性") === null, "偶数轮不接管（留给题库原题，避免机械感）");
ok(ev("personaQuestionBias")(pM, 1, "缓存一致性") === null, "参数不显著时不出偏置题");
ok(ev("personaQuestionBias")(null, 1, "缓存一致性") === null, "无测评时不臆测人格");

/* ---------- ⑤ 压力强度显性标注 ---------- */
console.log("\n⑤ 压力强度适配的显性标注");
const noteI = ev("personaPressureNoteHtml")(pI);
const noteE = ev("personaPressureNoteHtml")(pE);
ok(/下调一档/.test(noteI), "偏 F 时标注「已按情绪偏好下调一档」");
ok(/偏 F 100%/.test(noteI), "标注里带具体百分比（可核对，不是空话）");
ok(/证据对撞/.test(noteE), "偏 T 时标注按证据对撞施压");
ok(ev("personaPressureNoteHtml")(pM) === "", "参数不显著时不标注（不为了好看伪造适配）");

/* ---------- ⑥ 报告：人格 - 表现关联 ---------- */
console.log("\n⑥ 报告页「人格 - 表现关联」");
const dimsFor = (o) => [
  { key: "depth", dimension: "内容深度", score: o.depth },
  { key: "logic", dimension: "结构逻辑", score: o.logic },
  { key: "expression", dimension: "语言表达", score: o.expression },
  { key: "fit", dimension: "岗位匹配", score: o.fit },
  { key: "stress", dimension: "抗压表现", score: o.stress },
];
const cardNone = ev("personaFitCard")(dimsFor({ depth: 80, logic: 80, expression: 80, fit: 80, stress: 80 }), null);
ok(/还没有 MBTI 测评结果/.test(cardNone), "无测评时引导去测评，而不是编造关联");
ok(/不会凭空推测你的人格/.test(cardNone), "明确写出「不凭空推测」");
const cardI = ev("personaFitCard")(dimsFor({ depth: 55, logic: 58, expression: 60, fit: 70, stress: 52 }), pI);
ok(/人格 - 表现关联/.test(cardI), "有测评时渲染关联卡片");
ok(/相关性不等于因果/.test(cardI), "卡片自带相关性免责声明");
ok(/从不参与打分/.test(cardI), "卡片明确人格参数不参与打分");
/* 偏 J（有规划习惯）却结构分低 → 应解释为临场组织问题，而不是「你不擅长规划」 */
const cardJ = ev("personaFitCard")(dimsFor({ depth: 70, logic: 58, expression: 72, fit: 70, stress: 70 }), pE);
ok(/临场组织/.test(cardJ), "偏 J 但结构分低 → 解释为临场组织问题（给出可用结论）");
ok(/不是缺陷，是可以练的领域/.test(cardI), "偏 F 但抗压低 → 诚实措辞，不贴负面标签");
ok(/岗位匹配[\s\S]{0,400}无显著关联/.test(cardI), "岗位匹配维度如实标注「无显著关联」");
const cardWeak = ev("personaFitCard")(dimsFor({ depth: 80, logic: 80, expression: 80, fit: 80, stress: 80 }), pM);
ok(/不做关联推断/.test(cardWeak), "参数不显著时拒绝做关联推断（不拿噪声贴标签）");

/* ---------- ⑦ 逐题溯源 ---------- */
console.log("\n⑦ MBTI 逐题溯源");
ok(
  Array.isArray(rEstjMax.trace) && rEstjMax.trace.length === 20,
  `溯源覆盖全部 20 题（实际 ${rEstjMax.trace ? rEstjMax.trace.length : "无"}）`
);
const t0 = rEstjMax.trace[0];
ok(t0 && t0.q && t0.label && typeof t0.contrib === "number", "每条溯源含题目 / 你的选择 / 贡献分");
ok(
  rEstjMax.trace.filter((t) => t.dim === "EI").reduce((s, t) => s + t.contrib, 0) === 10,
  "同维度贡献分可加总（全同意 → +10）"
);
ok(rEstjMax.dims[0].raw === 10, "维度明细带原始分（-10..10），供溯源核对");
const page = ev("renderMbtiResult") && (ev("renderMbtiResult")(rEstjMax), ev("$")("mbti-result").innerHTML);
ok(/查看是哪 5 题导致的/.test(page), "结果页每个维度可展开看「哪几题」");
ok(/原始分 \+10/.test(page), "展开区显示该维原始分");

/* ---------- ⑧ 分段进度与断点续答 ---------- */
console.log("\n⑧ 分段进度 + 断点续答");
const g0 = ev("mbtiDimProgress")(0);
const g5 = ev("mbtiDimProgress")(5);
ok(g0.g === 0 && g0.inGroup === 1 && g0.inTotal === 5, "第 1 题落在「维度 1/4 · 第 1/5 题」");
ok(g5.g === 1 && g5.inGroup === 1 && g5.inTotal === 5, "第 6 题进入「维度 2/4 · 第 1/5 题」");
ev("startMbti")();
ev("answerMbti")(2);
ev("answerMbti")(-1);
const draft = ev("getMbtiDraft")();
ok(draft && draft.i === 2, `每答一题即落盘草稿（当前 ${draft ? draft.i : "无"} 题）`);
ev("pauseMbti")();
ok(ev("getMbtiDraft")() && ev("getMbtiDraft")().i === 2, "「稍后继续」保留草稿");
ev("resumeMbti")();
ok(
  ev("$")("mbti-quiz") && ev("$")("mbti-quiz").hidden === false,
  "resumeMbti 重新打开答题区（从断点继续，而非从第 1 题）"
);
const quizHtml = ev("$")("mbti-quiz").innerHTML;
ok(
  /维度 1\/4/.test(quizHtml) && /第 3\/5 题/.test(quizHtml) && /已完成 2\/20/.test(quizHtml),
  "恢复后停在断点题位，进度文案连续"
);
ev("cancelMbti")();
ok(ev("getMbtiDraft")() === null, "放弃测评会清空草稿（避免「继续」指向已放弃的卷）");

/* ---------- ⑨ 面试页接线 ---------- */
console.log("\n⑨ 面试链路接线");
ok(has(indexSrc, /id="persona-chip"/) && has(indexSrc, /id="persona-brief"/), "面试页有参数胶囊与策略面板容器");
ok(has(indexSrc, /togglePersonaBrief\(\)/), "胶囊可点开策略摘要");
ok(has(nrm(interviewSrc), /personaPromptSuffix\(activePersona\(\)\)/), "buildMessages 注入人格参数后缀");
ok(has(nrm(interviewSrc), /personaQuestionBias\(activePersona\(\), n \|\| 0, keyword\)/), "pickQuestion 接入人格偏置");
ok(has(nrm(interviewSrc), /attachPersonaNote\(body, bubble, speaker\)/), "追问落地后挂压力适配标注");
ok(has(nrm(interviewSrc), /capturePersona\(\)/), "开面时快照参数（中途重测不影响本场）");
ok(has(nrm(interviewSrc), /speaker\.id !== "pressure"/), "只在压力面标注强度适配（技术面不冒充）");

/* ---------- ⑩ 诚实边界与产物一致性 ---------- */
console.log("\n⑩ 诚实边界与产物一致性");
ok(ev("personaCapsuleText")(null) === "", "无测评时胶囊不显示（不暗示已识别）");
ok(!/mbti|persona|人格/i.test(scoringPy), "评分引擎里没有任何人格 / MBTI 痕迹（参数从不参与打分）");
ok(
  has(cssSrc, /\.persona-chip/) && has(cssSrc, /\.pf-tension/) && has(cssSrc, /\.mbti-trace/),
  "v43 样式已落在 CSS 层"
);
ok(has(demoHtml, /personaParams/) && has(demoHtml, /personaFitCard/), "演示包已内联人格参数化与关联卡片");
ok(has(demoHtml, /id="persona-chip"/) && has(demoHtml, /id="mbti-resume"/), "演示包含新 DOM 容器");

/* ---------- 汇总 ---------- */
/* 演示包启动后会挂定时器 / rAF，必须关窗，否则进程不退出 */
try {
  w.close();
} catch (e) {}
console.log("\n———————————————————————————");
console.log(`v43 结果：${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exitCode = 1;
