/* v36 回归测试：求职信息 + 一键导出 PDF / MBTI 测评 / 真实岗位 / 对话式匹配 / 报告追问
 * 覆盖：
 *   ① 求职信息档案：fillJobseekDemo → getJobseek；buildResumeHtml 含关键字段与打印样式
 *   ② 一键导出 PDF：走打印视图（window.open 打桩）产出可打印 HTML
 *   ③ AI 优化建议：无模型时的规则兜底含「岗位匹配 / 面试风险」
 *   ④ MBTI：20 题四维各 5 题；computeMbtiResult 确定性（全同意→ESTJ / 全反对→INFP）；同步个人中心
 *   ⑤ 真实岗位：全部带 https 官网链接；matchJobToResume 命中/缺口正确；渲染含官网跳转
 *   ⑥ 对话式匹配：applyQaEvidence 补技能、消缺口、提升匹配分
 *   ⑦ 报告追问：无报告时上下文为空；有报告时渲染追问卡与确定性兜底答案
 *   ⑧ 演示包接线 + 运行期无脚本错误
 * 用法：node scripts/test-v36-jsdom.js
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
  console.log("\n=== v36：求职信息 / PDF 导出 / MBTI / 真实岗位 / 对话式匹配 / 报告追问 ===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  await settle();

  /* 让 requireLogin 通过（演示态登录） */
  w.eval('currentUser = { id: "v36test", name: "测试用户", email: "v36@example.com" };');

  /* ---------- ① 求职信息档案 ---------- */
  console.log("\n① 求职信息档案（填写 → 结构化 → 可导出）");
  w.fillJobseekDemo();
  const js = w.eval("getJobseek()");
  ok(js.name === "张三" && js.targetRole === "后端开发工程师", "填入示例后档案含姓名与目标岗位");
  ok(/Java/.test(js.skills) && /MySQL/.test(js.skills), "档案含技能标签（Java / MySQL）");
  const nameEl = w.document.getElementById("js-name");
  ok(nameEl && nameEl.value === "张三", "示例已回填到表单（js-name）");
  const readBack = w.readJobseekForm();
  ok(readBack.name === "张三", "readJobseekForm 能从表单读回并存盘");

  /* ---------- ② 一键导出 PDF ---------- */
  console.log("\n② 一键导出 PDF（打印视图，零依赖）");
  const doc1 = w.buildResumeHtml(js);
  ok(/张三/.test(doc1) && /后端开发工程师/.test(doc1), "简历文档含姓名与目标岗位");
  ok(/@page/.test(doc1) && /A4/.test(doc1), "含 A4 打印页面规则（@page size: A4）");
  ok(/技能标签/.test(doc1) && /教育背景/.test(doc1) && /项目与经历/.test(doc1), "含技能/教育/项目三大板块");
  let printed = "";
  w.open = () => ({
    document: {
      open() {},
      write(h) {
        printed = h;
      },
      close() {},
    },
    focus() {},
    print() {},
  });
  w.exportResumePdf();
  await wait(600);
  ok(/张三/.test(printed) && /@page/.test(printed), "点击导出后经打印视图产出含简历内容的 HTML");

  /* ---------- ③ AI 优化建议（规则兜底） ---------- */
  console.log("\n③ AI 优化建议（未接模型时的规则兜底）");
  const advice = w.eval("ruleResumeAdvice")(js, "我参与了电商秒杀系统的开发");
  ok(/岗位匹配/.test(advice), "建议含「岗位匹配」诊断");
  ok(/面试风险/.test(advice), "建议含「面试风险预警」");
  ok(/六维诊断|内容缺失/.test(advice), "建议含六维诊断或内容缺失提示");

  /* ---------- ④ MBTI 测评 ---------- */
  console.log("\n④ MBTI 测评（4 维度 × 20 题，结果同步个人中心）");
  const qs = w.eval("MBTI_QUESTIONS");
  ok(qs.length === 20, "共 20 道题");
  const perDim = {};
  qs.forEach((q) => {
    perDim[q.dim] = (perDim[q.dim] || 0) + 1;
  });
  ok(Object.keys(perDim).length === 4 && Object.values(perDim).every((v) => v === 5), "四个维度（EI/SN/TF/JP）各 5 题");
  const agreeAll = qs.map((q) => ({ dim: q.dim, dir: q.dir, v: 2 }));
  const rAgree = w.eval("computeMbtiResult")(agreeAll);
  ok(rAgree.type === "ESTJ", `全选「完全同意」→ 确定性结果 ESTJ（实际 ${rAgree.type}）`);
  const disagreeAll = qs.map((q) => ({ dim: q.dim, dir: q.dir, v: -2 }));
  const rDis = w.eval("computeMbtiResult")(disagreeAll);
  ok(rDis.type === "INFP", `全选「完全不同意」→ 确定性结果 INFP（实际 ${rDis.type}）`);
  ok(rAgree.dims.length === 4 && typeof rAgree.clarity === "number", "返回四维明细与清晰度");
  w.eval("syncMbtiToProfile")(rAgree);
  const prof = w.eval("getProfile()");
  ok(prof.mbti === "ESTJ", `MBTI 已自动同步到个人信息（fm_profile.mbti = ${prof.mbti}）`);
  w.eval("saveMbti")(rAgree); // 落盘 fm_mbti（正式流程由 finishMbti 调用）
  ok(w.eval("currentMbti()").type === "ESTJ", "currentMbti() 可被其他模块读取");

  /* ---------- ⑤ 真实岗位推荐 ---------- */
  console.log("\n⑤ 真实岗位（官网链接 + 简历匹配）");
  const jobs = w.eval("REAL_JOBS");
  ok(Array.isArray(jobs) && jobs.length >= 10, `真实岗位库 ${jobs.length} 条`);
  ok(
    jobs.every((j) => /^https:\/\//.test(j.url)),
    "每个岗位都带 https 企业招聘官网链接"
  );
  ok(
    jobs.every((j) => j.company && j.role && j.city && Array.isArray(j.tags) && j.tags.length),
    "每条含公司 / 岗位 / 城市 / 技能标签"
  );
  w.document.getElementById("resume").value = "熟悉 Java MySQL Redis 分布式系统";
  const jobJava = jobs.find((j) => j.tags.includes("Java"));
  const mJava = w.eval("matchJobToResume")(jobJava);
  ok(mJava.hit.includes("Java") && mJava.score > 0, "简历含 Java → 命中且匹配分 > 0");
  const jobTorch = jobs.find((j) => j.tags.includes("PyTorch"));
  const mTorch = w.eval("matchJobToResume")(jobTorch);
  ok(mTorch.miss.includes("PyTorch"), "简历不含 PyTorch → 正确记为缺口");
  w.renderRealJobs();
  const listHtml = w.document.getElementById("real-jobs-list").innerHTML;
  ok(/招聘官网/.test(listHtml), "岗位卡渲染出「前往 … 招聘官网」跳转入口");
  ok(/匹配\s*\d+%/.test(listHtml), "岗位卡显示匹配度百分比");

  /* ---------- ⑥ 对话式匹配增强 ---------- */
  console.log("\n⑥ 对话式匹配增强（补证据 → 提升匹配度）");
  const steps = w.eval("MATCH_QA_STEPS");
  ok(steps.length === 4, "4 轮追问（量化 / 技能 / 缺口 / 隐藏经历）");
  const base = w.eval("heuristicParse")("熟悉 Java", "要求 Java MySQL Redis");
  w.eval("matchResult = " + JSON.stringify(base));
  const before = base.matchScore;
  const ev = w.eval("applyQaEvidence")("我用 Java 和 MySQL 做过项目，QPS 提升 50%");
  ok(ev.added.includes("MySQL"), "回答中识别到新技能证据（MySQL）");
  ok(ev.quantified >= 1, "识别到量化证据（QPS 提升 50%）");
  ok(ev.score > before, `匹配分由 ${before} 提升到 ${ev.score}（越问越准）`);
  ok(w.eval("matchResult").gaps.indexOf("MySQL") < 0, "MySQL 已从能力缺口中移除");

  /* ---------- ⑦ 报告追问 ---------- */
  console.log("\n⑦ 报告追问（报告数据注入 AI 小助手）");
  ok(w.eval("buildReportContext")() === "", "无报告时上下文为空（不编造数据）");
  w.eval(
    "lastReportData = { total: 72, dims: [{dimension:'内容深度', score:55, comment:'缺少量化'}," +
      "{dimension:'结构逻辑', score:88, comment:'清晰'}], evidence:[{agent:'技术官', quote:'我负责了后端', note:'缺少量化'}]," +
      "plan:[{day:'Day 1', task:'练习 STAR'}], weakest:{dimension:'内容深度', score:55} };"
  );
  const ctx = w.eval("buildReportContext")();
  ok(/72/.test(ctx) && /内容深度/.test(ctx) && /练习 STAR/.test(ctx), "上下文含总分 / 维度 / 学习路径");
  const ans = w.eval("ruleReportAnswer")("我最弱的是哪个维度");
  ok(/内容深度/.test(ans), "兜底答案正确指出最弱维度");
  const fcard = w.eval("reportFollowupCard")();
  ok(/追问细节/.test(fcard) && /askReportFollowupPreset/.test(fcard), "报告页渲染追问卡与预设问题");

  /* ---------- ⑧ 演示包接线 + 无脚本错误 ---------- */
  console.log("\n⑧ 演示包接线与运行时健康");
  ok(/data-page="mbti"/.test(html), "演示包含 MBTI 页面");
  ok(/js-advice-btn/.test(html) && /exportResumePdf/.test(html), "演示包含 AI 建议与导出 PDF 入口");
  ok(/real-jobs-list/.test(html) && /rj-keyword/.test(html), "演示包含真实岗位列表与筛选框");
  ok(/startMatchQa/.test(html) && /match-qa-body/.test(html), "演示包含对话式增强匹配面板");
  ok(/reportFollowupCard/.test(html), "演示包含报告追问区块");
  ok(errors.length === 0, errors.length ? "出现脚本错误：" + errors.slice(0, 2).join(" | ") : "无 jsdom 脚本错误");

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  if (fail) process.exitCode = 1;
  dom.window.close();
}
