/* v52 · 演示可用性修复（不升版，仍是 1.0.0）
 *
 * 起因：给演示准备一份 PDF 简历，导入后发现整份简历只拆出「简历正文」一个板块，
 * 姓名、教育、技能、自我评价全空。追下去发现是一条链上的四个缺陷，都不是简历的问题：
 *
 * ① parsePdfText 把所有文字用空格拼成一整段，丢掉了 pdf.js 的 hasEOL 换行标记。
 *    而简历拆分完全靠「行」识别板块标题与姓名——一行到底之后必然全空。
 * ② splitSegmentItems 的项目符号用了 [0-9]+[.、]，于是「2026.03 — …」被当成
 *    「1.」式有序列表剥掉开头（「03 — …」），「3.2s 降到」被剥成「2s 降到」。
 * ③ 同一条经历里的折行写在下一行、且不带符号时会被整行丢弃；以年份开头的新条目
 *    反而被并进上一条，公司名与时间就这样从板块里消失。
 * ④ 技能匹配用 includes，判定 JavaScript 命中 Java、MySQL 命中 SQL——
 *    一份前端简历的「已具备技能」里凭空多出一个 Java。
 *
 * 另修一处同源问题：报告页第二次进入时跳过同步请求却拿不到 payload，
 * 静默退化成本地引擎，同一场面试出现两个分数（服务端 66 / 本地 72），
 * 历史进步曲线还多出一条并不存在的记录。
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
const resumeSrc = rd("frontend/js/features/resume.js");
const reportSrc = rd("frontend/js/features/report.js");
const interviewSrc = rd("frontend/js/features/interview.js");
const demoHtml = rd("public/futuremirror-demo.html");

/* 从源码里切出要测的函数（测真代码，不复制一份） */
const cut = (src, from, to) => src.slice(src.indexOf(from), src.indexOf(to));

const pdfSrc = cut(matchSrc, "const PDF_CJK", "async function parsePdfText");
const pdfMod = new Function(pdfSrc + "\n;return { pdfTidyLine, pdfJoinLine };")();
const segSrc = cut(resumeSrc, "function splitSegmentItems", "function splitResumeText");
const splitSegmentItems = new Function(segSrc + "\n;return splitSegmentItems;")();
const skillSrc = cut(matchSrc, "function skillIn", "function heuristicParse");
const { skillIn } = new Function(skillSrc + "\n;return { skillIn };")();

/* ---------- ① PDF 文本还原成行 ---------- */
console.log("\n① PDF 文本还原：换行、字距、逐字母");
{
  const items = [
    { str: "林 砚 舟", hasEOL: true, transform: [1, 0, 0, 1, 0, 700], width: 40, height: 12 },
    { str: "0 1 教 育 背 景", hasEOL: true, transform: [1, 0, 0, 1, 0, 680], width: 60, height: 10 },
    { str: "2023.09 — 2027.06", hasEOL: false, transform: [1, 0, 0, 1, 0, 660], width: 100, height: 10 },
    { str: "同济大学", hasEOL: true, transform: [1, 0, 0, 1, 130, 660], width: 40, height: 10 },
  ];
  const line1 = pdfMod.pdfTidyLine(pdfMod.pdfJoinLine([items[0]]));
  ok(line1 === "林砚舟", `字距造成的「林 砚 舟」合回姓名（${line1}）`);
  const line2 = pdfMod.pdfTidyLine(pdfMod.pdfJoinLine([items[1]]));
  ok(
    /01/.test(line2.replace(/\s/g, "")) && /教育背景/.test(line2.replace(/\s/g, "")),
    `章节标题归一后仍是「教育背景」（${line2}）`
  );
  const oneGap = pdfMod.pdfTidyLine("同济大学 · 软件工程 · 本科 上海");
  ok(/本科 上海/.test(oneGap), "单个空格视为真实分隔，不当字距吃掉");
  const spaced = pdfMod.pdfTidyLine("L I N   Y A N Z H O U");
  ok(spaced === "LIN YANZHOU", `逐字母标题合并（${spaced}）`);
  const geo = pdfMod.pdfJoinLine([
    { str: "A", hasEOL: false, transform: [1, 0, 0, 1, 0, 500], width: 6, height: 10 },
    { str: "B", hasEOL: false, transform: [1, 0, 0, 1, 20, 500], width: 6, height: 10 },
  ]);
  ok(geo === "A B", `几何间隙补空格，避免英文单词粘连（${geo}）`);
  const tight = pdfMod.pdfJoinLine([
    { str: "Re", hasEOL: false, transform: [1, 0, 0, 1, 0, 500], width: 10, height: 10 },
    { str: "act", hasEOL: false, transform: [1, 0, 0, 1, 10.4, 500], width: 12, height: 10 },
  ]);
  ok(tight === "React", `字内微间隙不补空格（${tight}）`);
  ok(
    /hasEOL/.test(matchSrc) && !/items\.map\(\(it\) => it\.str \|\| ""\)\.join\(" "\)/.test(matchSrc),
    "旧的一行到底拼接已删除"
  );
  ok(/if \(buf\.length\) lines\.push/.test(matchSrc), "末行没有 hasEOL 也不丢内容");
}

/* ---------- ② 项目符号不吃日期与小数 ---------- */
console.log("\n② 条目切分：符号、日期、折行");
{
  const dated = splitSegmentItems("2026.03 — 2026.08 烛远科技 · 前端开发实习生\n• 重构数据看板，首屏 3.2s 降到 1.1s");
  ok(dated.length === 2, `日期行与符号行各成一条（${dated.length}）`);
  ok(/^2026\.03/.test(dated[0].text), `日期没有被当成列表符号剥掉（${dated[0].text.slice(0, 24)}）`);
  ok(/3\.2s 降到 1\.1s/.test(dated[1].text), `小数没有被当成列表符号剥掉（${dated[1].text.slice(0, 22)}）`);
  const wrapped = splitSegmentItems(
    "• 重构数据看板 3 个核心页面：路由级分包\n虚拟滚动 + 接口并发改造，首屏 1.1s\n• 搭 Playwright 冒烟用例 38 条"
  );
  ok(wrapped.length === 2, `折行并入上一条，不丢内容（${wrapped.length} 条）`);
  ok(/虚拟滚动/.test(wrapped[0].text), "折行内容保留在第一条里");
  ok(/Playwright/.test(wrapped[1].text), "第二条仍然是独立条目");
  const twoEntries = splitSegmentItems(
    "2026.09 — 至今 协同白板\n• 多人实时协作\n2025.10 — 2026.01 岗位聚合站\n• 聚合成 6 个站点"
  );
  ok(twoEntries.length === 4, `第二个日期开头另起一条（${twoEntries.length} 条）`);
  ok(/岗位聚合站/.test(twoEntries[2].text), "第二段经历的公司没有被并进上一条");
  const ordered = splitSegmentItems("1. 负责前端研发\n2. 负责性能优化\n3. 负责组件沉淀");
  ok(ordered.length === 3 && ordered[1].text === "负责性能优化", `有序列表仍按条切（${ordered.length} 条）`);
  const plain = splitSegmentItems("热爱技术。\n希望在杭州做前端。");
  ok(plain.length === 1, "没有符号也没有日期的段落不被硬切");
}

/* ---------- ③ 技能词按词边界匹配 ---------- */
console.log("\n③ 技能匹配：词边界");
{
  ok(!skillIn("熟练 JavaScript 与 TypeScript", "Java"), "JavaScript 不再命中 Java");
  ok(skillIn("熟练 TypeScript / JavaScript", "JavaScript"), "JavaScript 自身仍能命中");
  ok(skillIn("用 Node.js 写过 BFF", "Node.js"), "带点的技能名命中");
  ok(!skillIn("数据库用的 MySQL", "SQL"), "MySQL 不再命中 SQL");
  ok(skillIn("熟悉 SQL 调优", "SQL"), "独立出现的 SQL 仍命中");
  ok(skillIn("机器学习相关项目", "机器学习"), "中文技能名照常命中");
  ok(skillIn("React Native 开发", "React"), "React 在 React Native 里仍被识别（同族词不误伤）");
  ok(!/resumeText\.includes\(s\)/.test(matchSrc), "旧的 includes 技能判定已全部替换");
}

/* ---------- ④ 报告不再二次退化成本地引擎 ---------- */
console.log("\n④ 报告：服务端结果复用");
{
  ok(/let lastBackendPayload = null/.test(reportSrc), "新增服务端评分缓存");
  ok(/lastBackendPayload = backendPayload/.test(reportSrc), "请求成功后写入缓存");
  ok(/else if \(lastBackendPayload\)/.test(reportSrc), "同一会话不再请求时复用缓存");
  const cacheIdx = reportSrc.indexOf("else if (lastBackendPayload)");
  const localIdx = reportSrc.indexOf("dims = scoreSession()");
  ok(cacheIdx > 0 && localIdx > cacheIdx, "复用分支排在本地引擎兜底之前");
  ok(/lastBackendPayload = null/.test(interviewSrc), "重新面试时作废缓存");
}

/* ---------- ⑤ 交付一致性 ---------- */
console.log("\n⑤ 演示包一致性");
{
  ok(/pdfTidyLine/.test(demoHtml) && /pdfJoinLine/.test(demoHtml), "演示包含 PDF 行还原");
  ok(/skillIn/.test(demoHtml), "演示包含词边界匹配");
  ok(/lastBackendPayload/.test(demoHtml), "演示包含报告缓存");
  /* 导入不再无条件等模型：规则先拆，拆不动才请模型（30–45 秒的等待只留给真需要的情况） */
  ok(/let result = splitResumeText\(text\)/.test(resumeSrc), "先跑规则拆分");
  ok(/const weak = result\.sections\.length < 2/.test(resumeSrc), "只在拆不出板块/关键字段时才判为弱");
  ok(/if \(weak && hasLLM\)/.test(resumeSrc), "弱结果且有模型时才重排");
  ok(
    resumeSrc.indexOf("let result = splitResumeText(text)") < resumeSrc.indexOf("await aiSplitResumeText"),
    "规则拆分排在模型重排之前"
  );
  ok(!/join\(" "\) \+ "\\n"/.test(demoHtml), "演示包已无旧的一行到底拼接");
}

console.log("\n" + "-".repeat(58));
console.log(`合计 ${pass + fail} 项：通过 ${pass}，失败 ${fail}`);
process.exit(fail ? 1 : 0);
