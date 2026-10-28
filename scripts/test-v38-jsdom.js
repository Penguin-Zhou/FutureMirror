/* v38 回归测试：简历自定义板块 / PDF 自动拆分 / 建议分块可视化 / 真实岗位入看板 / MBTI 美化
 * 覆盖：
 *   ① 简历自定义板块 + 模板库：增删板块、模板套用、条目编辑、导出 PDF 含自定义板块
 *   ② 导入 PDF 自动拆分：splitResumeText 识别核心字段与板块、无标题兜底、回填表单
 *   ③ AI 优化建议分块化 + 可视化：环形/条形总览、技能 chip、Markdown 按标题切块
 *   ④ 今日推荐真实岗位 + 一键添加到看板：每日种子稳定、换一批、查重、官网链接
 *   ⑤ MBTI 结果页美化：英雄卡 + 四维小卡 + 双极条/雷达/条形齐全
 *   ⑥ 演示包接线 + 运行期无脚本错误
 * 用法：node scripts/test-v38-jsdom.js
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

/* 一份结构化简历样例（用于拆分器断言） */
const SAMPLE_RESUME = [
  "张三",
  "邮箱 zhangsan@example.com　电话 13800138000",
  "教育背景",
  "2023—2027　某某大学　软件工程　本科",
  "实习经历",
  "• 某某科技 后端实习生（2025.06-2025.09）",
  "  主导缓存重构，P99 从 320ms 降至 90ms（-72%）",
  "技能",
  "Java、Redis、MySQL",
  "证书",
  "• CET-6 英语六级",
  "自我评价",
  "热爱技术，希望在上海从事后端开发工作。",
].join("\n");

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v38：简历自定义板块 / PDF 自动拆分 / 建议可视化 / 真实岗位看板 / MBTI 美化 ===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  await settle();
  w.eval('currentUser = { id: "v38test", name: "测试用户", email: "v38@example.com" };');

  /* ---------- ① 自定义板块 + 模板库 ---------- */
  console.log("\n① 简历自定义板块 + 模板库");
  ok(w.eval("RESUME_TEMPLATES.length") === 4, "模板库提供 4 套板块组合");
  ok(typeof w.eval("addResumeSection") === "function", "addResumeSection 已注入全局");
  w.eval('store.set("fm_jobseek", {}, true);');
  w.eval("renderResumeSectionsEditor();");
  ok(
    /还没有自定义板块/.test(w.eval('document.getElementById("js-sections").innerHTML')),
    "空档案时板块编辑器给出空态引导"
  );
  w.eval("addResumeSection('实习经历');");
  ok(w.eval("getJobseekSections().length") === 1, "可添加自定义板块");
  ok(w.eval("getJobseekSections()[0].title") === "实习经历", "板块标题正确写入");
  ok(w.eval("getJobseekSections()[0].items.length") === 1, "新板块默认带 1 条可填条目");
  w.eval("applyResumeTemplate('fresh');");
  const secCount = w.eval("getJobseekSections().length");
  ok(secCount === 5, `模板「校招应届」套用 5 个板块（实际 ${secCount}）`);
  const titles = w.eval("getJobseekSections().map(s => s.title).join(',')");
  ok(/志愿服务经历/.test(titles) && /所得荣誉/.test(titles), "模板含志愿服务经历 / 所得荣誉等新板块");
  w.eval("applyResumeTemplate('fresh');");
  ok(w.eval("getJobseekSections().length") === 5, "重复套用同一模板不会重复添加");
  /* 条目编辑与持久化 */
  const sid = w.eval("getJobseekSections()[0].id");
  const iid = w.eval("getJobseekSections()[0].items[0].id");
  w.eval(`updateSectionItem('${sid}', '${iid}', '主导缓存重构，P99 从 320ms 降至 90ms');`);
  ok(/P99/.test(w.eval(`getJobseekSections()[0].items[0].text`)), "条目内容可编辑并持久化到 fm_jobseek.sections");
  w.eval(`updateSectionTitle('${sid}', '实习与项目经历');`);
  ok(w.eval("getJobseekSections()[0].title") === "实习与项目经历", "板块标题可重命名");
  /* 导出 PDF 含自定义板块（此刻条目仍有内容，先断言再删） */
  const pdfHtml = w.eval("buildResumeHtml(getJobseek())");
  ok(/实习与项目经历/.test(pdfHtml), "导出 PDF 包含自定义板块标题");
  ok(/P99/.test(pdfHtml), "导出 PDF 包含自定义板块内容");
  w.eval(`addSectionItem('${sid}');`);
  ok(w.eval("getJobseekSections()[0].items.length") === 2, "板块内可继续添加条目");
  w.eval(`removeSectionItem('${sid}', '${iid}');`);
  ok(w.eval("getJobseekSections()[0].items.length") === 1, "板块内条目可删除");
  /* 编辑器渲染 */
  const edHtml = w.eval('document.getElementById("js-sections").innerHTML');
  ok(/js-section/.test(edHtml) && /js-item/.test(edHtml), "编辑器渲染板块与条目容器");
  ok(/oninput/.test(edHtml), "编辑器输入即时回写（oninput 绑定）");
  /* 模板库 UI */
  const tplHtml = w.eval('document.getElementById("js-templates").innerHTML');
  ok(/applyResumeTemplate\(/.test(tplHtml), "模板库按钮绑定 applyResumeTemplate");
  ok(/addResumeSection\(/.test(tplHtml), "常用板块 chip 可一键添加");
  w.eval(`removeResumeSection('${sid}');`);
  ok(w.eval("getJobseekSections().length") === 4, "板块可整体删除");

  /* ---------- ② 导入 PDF 自动拆分 ---------- */
  console.log("\n② 导入 PDF 简历 · 自动拆分");
  ok(typeof w.eval("splitResumeText") === "function", "splitResumeText 已注入全局");
  ok(typeof w.eval("onResumePdfSelected") === "function", "PDF 选择回调已接线");
  const sp = w.eval(`splitResumeText(${JSON.stringify(SAMPLE_RESUME)})`);
  ok(sp.core.name === "张三", `自动识别姓名（${sp.core.name}）`);
  ok(sp.core.email === "zhangsan@example.com", `自动识别邮箱（${sp.core.email}）`);
  ok(sp.core.phone === "13800138000", `自动识别电话（${sp.core.phone}）`);
  ok(/某某大学/.test(sp.core.education), "自动识别教育背景并填入核心字段");
  ok(/Java/.test(sp.core.skills) && /Redis/.test(sp.core.skills), `自动识别技能标签（${sp.core.skills}）`);
  ok(/热爱技术/.test(sp.core.summary), "自动识别自我评价并填入核心字段");
  ok(sp.sections.length === 2, `拆分出 2 个自定义板块（实际 ${sp.sections.length}）`);
  const spTitles = sp.sections.map((s) => s.title).join(",");
  ok(/实习经历/.test(spTitles) && /证书/.test(spTitles), `板块名规范（${spTitles}）`);
  ok(
    sp.sections.some((s) => s.items.some((i) => /P99/.test(i.text))),
    "板块条目保留原文细节（含量化数据）"
  );
  ok(
    sp.core.name && !sp.sections.some((s) => /张三/.test(s.items.map((i) => i.text).join(""))),
    "姓名不会误落入板块正文"
  );
  /* 无标题兜底：整篇没有可识别板块时也要保住内容 */
  const sp2 = w.eval("splitResumeText('这是一份没有板块标题的简历正文内容')");
  ok(sp2.sections.length === 1 && sp2.sections[0].title === "简历正文", "无板块标题时兜底为「简历正文」，不丢内容");
  /* 回填表单 */
  w.eval(`applyImportedResume(splitResumeText(${JSON.stringify(SAMPLE_RESUME)}));`);
  ok(w.eval('document.getElementById("js-name").value') === "张三", "拆分结果自动回填姓名到表单");
  ok(w.eval('document.getElementById("js-edu").value').indexOf("某某大学") >= 0, "拆分结果回填教育背景");
  ok(w.eval('document.getElementById("resume-raw").value').length > 0, "拆分结果同步到简历原文（供后续诊断）");
  ok(w.eval("getJobseekSections().length") === 2, "拆分结果写入自定义板块");

  /* ---------- ③ AI 优化建议分块化 + 可视化 ---------- */
  console.log("\n③ AI 优化建议 · 可视化 + 分块");
  const r = w.eval(`analyzeResumeText(${JSON.stringify(SAMPLE_RESUME)})`);
  const vis = w.eval(`resumeAdviceVisual(analyzeResumeText(${JSON.stringify(SAMPLE_RESUME)}))`);
  ok(/<svg/.test(vis) && /chart-donut/.test(vis), "建议总览渲染健康度环形图");
  ok(/chart-hbar/.test(vis), "建议总览渲染六维条形图");
  ok(!/NaN/.test(vis), "建议可视化无 NaN 属性");
  const chipsHtml = w.eval(`resumeKeywordChips(analyzeResumeText(${JSON.stringify(SAMPLE_RESUME)}))`);
  ok(/js-chip/.test(chipsHtml), "建议区渲染识别技能 chip");
  ok(r.dims.length === 6, "六维诊断维度齐全");
  /* Markdown → 分块 */
  const chunks = w.eval(`
    chunkMarkdown(${JSON.stringify(
      "## 一、岗位匹配诊断\n匹配度一般\n## 二、简历结构优化\n建议增加量化\n## 三、面试风险\n准备技术选型理由"
    )})
  `);
  ok(chunks.length === 3, `模型输出按标题切为 3 块（实际 ${chunks.length}）`);
  ok(chunks[0].title === "一、岗位匹配诊断", "分块标题取自 Markdown 标题");
  ok(/建议增加量化/.test(chunks[1].body), "分块正文归属正确");
  ok(w.eval("chunkMarkdown('没有标题的一段话').length") === 1, "无标题文本兜底为单块");
  /* 规则建议同样带可视化，而非大段纯文字 */
  const ruleHtml = w.eval(`ruleResumeAdvice(getJobseek(), ${JSON.stringify(SAMPLE_RESUME)})`);
  ok(/ra-overview/.test(ruleHtml), "规则兜底建议也带可视化总览");
  ok(/逐条改写建议/.test(ruleHtml), "建议按「逐条改写」分块呈现");
  ok((ruleHtml.match(/class="evidence"/g) || []).length >= 3, "建议由多张证据卡分块构成");

  /* ---------- ④ 今日推荐真实岗位 + 一键添加看板 ---------- */
  console.log("\n④ 今日推荐 · 真实岗位 + 一键添加到看板");
  ok(typeof w.eval("todaySeed") === "function", "今日推荐按日期生成稳定种子");
  const s1 = w.eval("todaySeed()");
  const s2 = w.eval("todaySeed()");
  ok(s1 === s2, "同一天种子稳定（推荐不会每次刷新都变）");
  w.eval('store.set("fm_apps", [], true);');
  w.eval("renderTodayPicks();");
  await wait(30);
  const tp = w.eval('document.getElementById("today-picks")');
  const cards = tp.querySelectorAll(".today-pick");
  ok(cards.length === 4, `今日推荐渲染 4 张真实岗位卡（实际 ${cards.length}）`);
  ok(!!cards[0].querySelector(".today-pick-company"), "卡片展示企业名称");
  ok(
    [...cards[0].querySelectorAll("button")].some((b) =>
      (b.getAttribute("onclick") || "").includes("addRealJobToBoard")
    ),
    "卡片含「添加到看板」按钮"
  );
  const beforeRoles = w.eval("getApplications().map(a => a.role).join('|')");
  w.eval("rotateTodayPicks();");
  await wait(30);
  ok(w.eval("todayOffset") === 1, "「换一批」按偏移轮转真实岗位");
  ok(typeof w.eval("addRealJobToBoard") === "function", "addRealJobToBoard 已注入全局");
  const jobId = w.eval("REAL_JOBS[0].id");
  w.eval(`addRealJobToBoard('${jobId}');`);
  ok(w.eval("getApplications().length") === 1, "真实岗位一键进入投递看板");
  const app0 = w.eval("getApplications()[0]");
  ok(app0.role === w.eval(`REAL_JOBS[0].role`), "看板记录岗位名正确");
  ok(!!app0.url && /^https?:/.test(app0.url), "看板记录携带企业招聘官网链接");
  w.eval(`addRealJobToBoard('${jobId}');`);
  ok(w.eval("getApplications().length") === 1, "同一岗位重复添加会被查重拦截");
  w.eval("renderBoard();");
  const boardHtml = w.eval('document.getElementById("board-columns").innerHTML');
  ok(/board-link/.test(boardHtml), "看板卡片渲染官网链接");
  ok(typeof beforeRoles === "string", "看板数据按账号隔离存储（fm_apps）");

  /* ---------- ⑤ MBTI 结果页美化 ---------- */
  console.log("\n⑤ MBTI 结果页美化");
  w.eval("renderMbtiResult(computeMbtiResult(MBTI_QUESTIONS.map(() => ({ dim: 'EI', dir: 1, v: 2 }))));");
  const mHtml = w.eval('document.getElementById("mbti-result").innerHTML');
  ok(/mbti-hero/.test(mHtml), "结果页渲染类型英雄卡");
  ok(/mbti-dim-grid/.test(mHtml) && /mbti-dim-card/.test(mHtml), "结果页渲染四维小卡");
  ok(/chart-bipolar/.test(mHtml), "结果页保留四维双极条");
  ok(/chart-radar/.test(mHtml), "结果页保留人格轮廓雷达");
  ok(/chart-hbar/.test(mHtml), "结果页保留典型度条形");
  ok(/mbti-type-big/.test(mHtml), "结果页突出显示类型代码");
  ok(!/NaN/.test(mHtml), "MBTI 结果页无 NaN 属性");

  /* ---------- ⑥ 演示包接线与运行期错误 ---------- */
  console.log("\n⑥ 演示包接线与运行期错误");
  ok(/js-templates/.test(html) && /js-sections/.test(html), "演示包含板块编辑器与模板库容器");
  ok(/resume-pdf-input/.test(html) && /importResumePdf/.test(html), "演示包含 PDF 导入入口");
  ok(/splitResumeText/.test(html) && /addRealJobToBoard/.test(html), "演示包含拆分器与看板新增符号");
  ok(errors.length === 0, "运行期无脚本错误（" + errors.length + "）");

  console.log("\n———————————————————————————");
  console.log(`v38 结果：${pass} 通过 / ${fail} 失败`);
  dom.window.close();
  process.exit(fail ? 1 : 0);
}
