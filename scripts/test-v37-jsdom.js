/* v37 回归测试：五大新板块的可视化增强
 * 覆盖：
 *   ① charts.js 七个组件：空态兜底、数值安全化（NaN 不进 SVG）、随主题取 CSS 变量
 *   ② 简历板块：求职档案完整度（空→0%、示例→100%）、加权核心项、缺项清单
 *   ③ MBTI：结果页含双极条 / 雷达 / 典型度条形；答题页含点阵进度
 *   ④ 真实岗位：匹配度排行条形图 + 城市分布柱状图 + 点击定位（focusRealJob）
 *   ⑤ 对话式匹配：scoreTrail 逐轮累积，演进折线在 ≥2 点时出现
 *   ⑥ 报告追问：维度条形图渲染且点击回调指向 askReportFollowup
 *   ⑦ 演示包接线（40 模块）+ 运行期无脚本错误
 * 用法：node scripts/test-v37-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const DEMO = path.join(ROOT, "public", "futuremirror-demo.html");
if (!fs.existsSync(DEMO)) {
  console.error("❌ 未找到 public/futuremirror-demo.html，请先运行 node scripts/build-demo.js");
  process.exit(1);
}
const html = fs.readFileSync(DEMO, "utf8");

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
  console.log("\n=== v37：新板块可视化增强（图表 / 完整度 / 雷达 / 排行 / 演进） ===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  await settle();

  /* 演示态登录，让依赖 requireLogin 的交互可用 */
  w.eval('currentUser = { id: "v37test", name: "测试用户", email: "v37@example.com" };');

  /* ---------- ① 通用图表组件 ---------- */
  console.log("\n① charts.js 通用图表组件");
  ok(typeof w.eval("donutSVG") === "function", "donutSVG 已注入全局");
  ok(
    /<svg/.test(w.eval('donutSVG(72,{label:"完整度"})')) && /72%/.test(w.eval("donutSVG(72)")),
    "donutSVG 输出 SVG 且含百分比"
  );
  ok(
    !/NaN/.test(w.eval("donutSVG(undefined)")) && !/NaN/.test(w.eval("donutSVG(null)")),
    "donutSVG 对空值安全（无 NaN）"
  );
  ok(/chart-empty/.test(w.eval("hbarSVG([])")), "hbarSVG 空数据返回可读空态而非空图");
  ok(/<svg/.test(w.eval('hbarSVG([{label:"腾讯",value:80},{label:"阿里",value:60}])')), "hbarSVG 正常输出条形");
  ok(/onclick/.test(w.eval("hbarSVG([{label:'a',value:1,onclick:\"go('x')\"}])")), "hbarSVG 支持点击回调");
  ok(/data-tip/.test(w.eval("hbarSVG([{label:'a',value:1}])")), "hbarSVG 自带 data-tip（由 viz 统一接管悬停）");
  ok(
    /chart-empty/.test(w.eval("bipolarBarsSVG([])")) && /chart-empty/.test(w.eval("radar4SVG([{name:'a',value:1}])")),
    "双极条 / 雷达对维度不足给空态"
  );
  ok(
    /<polygon/.test(
      w.eval("radar4SVG([{name:'E',value:70},{name:'S',value:40},{name:'T',value:80},{name:'J',value:55}])")
    ),
    "radar4SVG 输出雷达多边形"
  );
  ok(/<polyline/.test(w.eval("trendSVG([{label:'初始',v:25},{label:'第1轮',v:75}])")), "trendSVG 输出折线");
  ok(
    /chart-empty/.test(w.eval("columnSVG([])")) && /<rect/.test(w.eval("columnSVG([{label:'北京',value:5}])")),
    "columnSVG 空态与正常输出"
  );
  ok(/<rect/.test(w.eval("progressDotsSVG(20, 3)")), "progressDotsSVG 输出点阵");
  const donutSvg = w.eval("donutSVG(50)");
  ok(
    /var\(--/.test(donutSvg) && !/(#[0-9a-fA-F]{3,6})/.test(donutSvg),
    "图表颜色只走 CSS 变量（随主题反转，无硬编码色值）"
  );
  ok(!/NaN/.test(w.eval("trendSVG([{label:'x',v:'abc'}])")), "trendSVG 对非数值安全");

  /* ---------- ② 简历板块：求职档案完整度 ---------- */
  console.log("\n② 简历板块 · 求职档案完整度可视化");
  ok(w.eval("JOBSEEK_FIELDS.length") === 11, "11 个字段纳入完整度统计");
  w.eval('store.del ? store.del("fm_jobseek") : store.set("fm_jobseek", {}, true);');
  w.eval('store.set("fm_jobseek", {}, true);');
  const c0 = w.eval("jobseekCompleteness()");
  ok(c0.pct === 0 && c0.filled === 0, "空档案完整度为 0%");
  ok(c0.missing.length === 11, "空档案列出全部 11 项待补");
  w.eval("fillJobseekDemo();");
  const c1 = w.eval("jobseekCompleteness()");
  ok(c1.pct === 100, "示例档案完整度 100%（实际 " + c1.pct + "%）");
  ok(c1.corePct === 100, "示例档案核心项 100%");
  /* 加权：只填核心项之一也应体现出权重差异 */
  w.eval('store.set("fm_jobseek", { projects: "一个项目" }, true);');
  const c2 = w.eval("jobseekCompleteness()");
  ok(c2.pct > 0 && c2.pct < 40, "只填高权重单项时完整度按比例计算（" + c2.pct + "%）");
  ok(c2.corePct > c2.pct, "核心项占比高于整体占比（加权生效）");
  const gaugeHtml = (() => {
    w.eval("renderJobseekGauge();");
    const el = w.document.getElementById("js-gauge");
    return el ? el.innerHTML : "";
  })();
  ok(/<svg/.test(gaugeHtml) && /chart-donut/.test(gaugeHtml), "仪表区渲染环形图");
  ok(/js-chip/.test(gaugeHtml), "仪表区渲染字段清单 chip");
  ok(/js-chip miss/.test(gaugeHtml), "未填字段在清单中标记为待补");
  ok(typeof w.eval("syncJobseekForm") === "function", "表单输入可实时同步（syncJobseekForm）");
  ok(typeof w.eval("renderJobseekForm") === "function", "进入页面可回填档案（renderJobseekForm）");

  /* ---------- ③ MBTI 可视化 ---------- */
  console.log("\n③ MBTI · 双极条 / 雷达 / 点阵进度");
  const mbtiHtml = (() => {
    w.eval("renderMbtiResult(computeMbtiResult(MBTI_QUESTIONS.map(() => ({ dim: 'EI', dir: 1, v: 2 }))));");
    const el = w.document.getElementById("mbti-result");
    return el ? el.innerHTML : "";
  })();
  ok(/chart-bipolar/.test(mbtiHtml), "结果页渲染四维双极条");
  ok(/chart-radar/.test(mbtiHtml), "结果页渲染人格轮廓雷达");
  ok(/chart-hbar/.test(mbtiHtml), "结果页渲染典型度条形");
  ok(!/NaN/.test(mbtiHtml), "MBTI 图表无 NaN 属性");
  const qHtml = (() => {
    w.eval("startMbti();");
    const el = w.document.getElementById("mbti-quiz");
    return el ? el.innerHTML : "";
  })();
  ok(/chart-dots/.test(qHtml), "答题页渲染点阵进度");
  ok(/第 1 \/ 20 题/.test(qHtml), "答题页显示题序");
  w.eval("cancelMbti();");

  /* ---------- ④ 真实岗位可视化 ---------- */
  console.log("\n④ 真实岗位 · 匹配度排行 + 城市分布");
  ok(typeof w.eval("renderRealJobCharts") === "function", "岗位图表函数已注入");
  w.eval("renderRealJobs();");
  await wait(30);
  const chartsHtml = (() => {
    const el = w.document.getElementById("rj-charts");
    return el ? el.innerHTML : "";
  })();
  ok(/chart-hbar/.test(chartsHtml), "岗位区渲染匹配度排行条形图");
  ok(/chart-column/.test(chartsHtml), "岗位区渲染城市分布柱状图");
  ok(/focusRealJob\(/.test(chartsHtml), "条形图带点击定位回调");
  ok(!/NaN/.test(chartsHtml), "岗位图表无 NaN 属性");
  ok(/id="rj-card-/.test(w.eval('document.getElementById("real-jobs-list").innerHTML')), "岗位卡带可定位 id");
  ok(typeof w.eval("focusRealJob") === "function", "focusRealJob 可用于滚动定位");

  /* ---------- ⑤ 对话式匹配演进 ---------- */
  console.log("\n⑤ 对话式匹配 · 匹配度演进折线");
  w.eval(`
    matchResult = { skills: [], gaps: ["Redis", "Kafka"], matchScore: 25, evidences: [] };
    startMatchQa();
  `);
  ok(w.eval("matchQaState.scoreTrail.length") === 1, "起始轨迹含初始分");
  ok(w.eval("matchQaState.scoreTrail[0].v") === 25, "初始分记录为 25");
  w.eval(`
    document.getElementById("mqa-input").value = "用过 Redis 缓存和 Kafka 消息队列，QPS 提升了 3 倍";
    submitMatchQaAnswer();
  `);
  await wait(20);
  ok(
    w.eval("matchQaState.scoreTrail.length") === 2,
    "答完一轮后轨迹累积（实际 " + w.eval("matchQaState.scoreTrail.length") + "）"
  );
  const mqaHtml = w.eval('document.getElementById("match-qa-body").innerHTML');
  ok(/chart-trend/.test(mqaHtml), "对话区渲染匹配度演进折线");
  ok(!/NaN/.test(mqaHtml), "演进折线无 NaN 属性");
  const up = w.eval("matchQaState.scoreTrail[1].v") > w.eval("matchQaState.scoreTrail[0].v");
  ok(
    up,
    "补充证据后匹配度上升（" +
      w.eval("matchQaState.scoreTrail[0].v") +
      " → " +
      w.eval("matchQaState.scoreTrail[1].v") +
      "）"
  );
  w.eval("finishMatchQa();");
  await wait(20);
  const sumHtml = w.eval('document.getElementById("match-qa-summary").innerHTML');
  ok(/chart-trend/.test(sumHtml), "结束卡同样展示演进折线");

  /* ---------- ⑥ 报告追问维度图 ---------- */
  console.log("\n⑥ 报告追问 · 维度条形图点击直达");
  w.eval(`
    lastReportData = {
      total: 71,
      dims: [
        { dimension: "内容深度", score: 60, comment: "有细节但未量化" },
        { dimension: "结构逻辑", score: 88, comment: "层次清晰" },
        { dimension: "语言表达", score: 52, comment: "口头禅较多" },
      ],
      evidence: [],
      plan: [],
    };
  `);
  const cardHtml = w.eval("reportFollowupCard()");
  ok(/chart-hbar/.test(cardHtml), "追问卡渲染维度条形图");
  ok(/askReportFollowup\(/.test(cardHtml), "维度条点击直接调用追问");
  ok(/语言表达/.test(cardHtml), "维度名出现在图表中");
  ok(!/NaN/.test(cardHtml), "维度图表无 NaN 属性");

  /* ---------- ⑦ 演示包接线与运行期错误 ---------- */
  console.log("\n⑦ 演示包接线与运行期错误");
  ok(/js\/features\/charts\.js/.test(html) || /通用图表组件/.test(html), "演示包已内联 charts.js 模块");
  ok(html.indexOf("donutSVG") > 0 && html.indexOf("bipolarBarsSVG") > 0, "演示包含全部新图表符号");
  ok(errors.length === 0, "运行期无脚本错误（" + errors.length + "）");

  console.log("\n———————————————————————————");
  console.log(`v37 结果：${pass} 通过 / ${fail} 失败`);
  dom.window.close();
  process.exit(fail ? 1 : 0);
}
