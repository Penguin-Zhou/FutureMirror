/* v44 · 感知密度层断言
 *
 * 前几版把「纵深」堆出来了：可解释评分、实时锚点、Agent 分歧、人格参数、
 * 三级降级。问题换了一个：这些纵深要连着点开三层才看得见。
 * 这一版只做一件事——把已经存在的东西摆到 3 秒能被看见的位置，
 * 而且摆上去的每一个数字都必须有出处，不能为了好看编一个。
 *
 * ① 报告首屏给「一句诊断」，且这句话由确定性规则拼出，可复现；
 * ② 五维轮廓缩略与点阵评分是视觉冗余，数字与读屏语义不能被顶掉；
 * ③ 分歧标记只在真的分开时出现，且与维度卡引用的轮次同一；
 * ④ 雷达的目标线必须自报口径（产品达标参考，不是人群统计）；
 * ⑤ 降级演练要落成报告里的一条记录；没触发时整块不渲染；
 * ⑥ MBTI 结果页顺序改成「策略 → 依据 → 轮廓」，四段进度条按维度推进；
 * ⑦ 视觉规范不破：新增区块零投影、零圆角、朱红只做强调。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

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

const interviewSrc = rd("frontend/js/features/interview.js");
const demoHtml = rd("public/futuremirror-demo.html");

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

const dims = [
  { key: "depth", dimension: "内容深度", score: 86, comment: "回答包含量化数据" },
  { key: "logic", dimension: "结构逻辑", score: 78, comment: "具备 STAR 结构意识" },
  { key: "expression", dimension: "语言表达", score: 74, comment: "表达流畅度良好" },
  { key: "fit", dimension: "岗位匹配", score: 70, comment: "按技能命中估算" },
  { key: "stress", dimension: "抗压表现", score: 52, comment: "出现防御性表述" },
];
const dimsFlat = [
  { key: "depth", dimension: "内容深度", score: 76, comment: "" },
  { key: "logic", dimension: "结构逻辑", score: 74, comment: "" },
  { key: "expression", dimension: "语言表达", score: 72, comment: "" },
  { key: "fit", dimension: "岗位匹配", score: 70, comment: "" },
  { key: "stress", dimension: "抗压表现", score: 72, comment: "" },
];

/* ---------- ① 首屏诊断：确定性、指向明确、承认「没有短板」 ---------- */
console.log("\n① 报告首屏：一句诊断（规则拼装，可复现）");
const dg = ev("reportDiagnosis")(dims);
ok(dg.best.dimension === "内容深度" && dg.worst.dimension === "抗压表现", "最强项 / 最弱项识别正确");
ok(dg.gap === 34 && dg.tone === "wide", "差距 34 分 → tone=wide");
ok(/内容深度/.test(dg.say) && /抗压表现/.test(dg.say), "诊断句同时点名最强与最弱");
ok(/最需要投入/.test(dg.say), "弱项 <60 时给出「最需要投入」的判断");
ok(JSON.stringify(ev("reportDiagnosis")(dims)) === JSON.stringify(dg), "同一输入两次调用结果完全一致（可复现）");
const dgFlat = ev("reportDiagnosis")(dimsFlat);
ok(dgFlat.tone === "flat" && /分布集中/.test(dgFlat.say), "五维接近时不硬造短板（tone=flat）");
ok(ev("reportDiagnosis")([]).say === "", "空维度返回空诊断，不编话");

console.log("\n② 五维轮廓缩略");
const strip = ev("profileStripHtml")(dims);
ok((strip.match(/class="rp-row"/g) || []).length === 5, "轮廓缩略渲染 5 条");
ok(/aria-label="五维得分轮廓/.test(strip), "缩略图对读屏给出等价的文字描述");
ok(strip.indexOf("86") > 0 && strip.indexOf("52") > 0, "每条带分数，不靠长度猜");
ok(/width:52%/.test(strip), "轨道宽度即分数");

/* ---------- ③ 点阵评分：5 格分档，数字不被顶掉 ---------- */
console.log("\n③ 点阵评分");
const dots = (s) => (ev("dimDots")(s).match(/class="on"/g) || []).length;
ok(dots(100) === 5 && dots(80) === 4 && dots(60) === 3 && dots(40) === 2 && dots(20) === 1, "五档映射正确");
ok(dots(0) === 0 && dots(86) === 4, "0 分不点灯；86 分落在第 4 档");
ok(/aria-hidden="true"/.test(ev("dimDots")(86)), "点阵对读屏隐藏（数字才是语义源）");

/* ---------- ④ 分歧标记：只在该维度引用的那一轮真的分开时出现 ---------- */
console.log("\n④ Agent 分歧：落到维度卡上");
const views = { items: [{ gap: 3 }, { gap: 12 }, { gap: 24 }] };
ok(ev("lensGapFor")(views, 2) === 12 && ev("lensGapFor")(views, 3) === 24, "按轮次取分歧分（与证据轮次对齐）");
ok(ev("lensGapFor")(views, 9) === null && ev("lensGapFor")(null, 1) === null, "没有数据返回 null，不伪造一致");
ok(ev("dimGapTag")(3) === "" && ev("dimGapTag")(null) === "", "分歧 <10 分不出现标记");
ok(ev("dimGapTag")(8) === "", "8 分的视角差属同一判断区间，不标（避免每张卡都挂标记）");
ok(/g-mid/.test(ev("dimGapTag")(10)), "10 分 → g-mid（amber），与完整分歧视图的 8 分阈值分层");
ok(/g-high/.test(ev("dimGapTag")(24)) && /⚖ 24/.test(ev("dimGapTag")(24)), "24 分 → g-high，并标出分值");

/* ---------- ⑤ 雷达目标线：加了口径，且不破坏原有结构 ---------- */
console.log("\n⑤ 雷达目标线");
const radar = ev("radarSVG")(dims, { ref: 70 });
ok(/radar-ref/.test(radar) && /stroke-dasharray/.test(radar), "虚线参考层存在");
ok(/fill="var\(--brand-bg\)"/.test(radar) && /id="radar-dot-0"/.test(radar), "原有填充与顶点 id 未被破坏");
ok(!/radar-ref/.test(ev("radarSVG")(dims)), "不传 ref 时不画目标线（线上默认不误导）");

/* ---------- ⑥ 降级账本：有记录才渲染，且说清「谁接管」 ---------- */
console.log("\n⑥ 降级账本（演练要留下记录，而不是只在当场表演）");
ok(ev("degradeLogCard")([]) === "" && ev("degradeLogCard")(null) === "", "没触发过 → 整块不渲染");
const dl = ev("degradeLogCard")([
  { turn: 3, drill: true },
  { turn: 5, drill: false },
]);
ok(/第 3 轮/.test(dl) && /第 5 轮/.test(dl), "逐条列出轮次");
ok(/演练触发（主动失效）/.test(dl), "区别于真实失败：标注为演练触发");
ok(/本地引擎接管 · 未伪造结果/.test(dl), "写明兜底来源，不假装是模型输出");
ok(/共 2 次/.test(dl), "给出次数");
ok(/degradeLog/.test(interviewSrc) && /session\.degradeLog = \[\]/.test(interviewSrc), "面试侧写入 + 新一轮清空");

/* ---------- ⑦ MBTI：四段进度 + 结果页信息顺序 ---------- */
console.log("\n⑦ MBTI：从「测评工具」到「面试输入」");
const st = ev("mbtiStageBar")({ g: 1, gTotal: 4 });
ok((st.match(/class="done"/g) || []).length === 1, "已完成维度 1 段");
ok((st.match(/class="now"/g) || []).length === 1, "当前维度 1 段高亮");
ok((st.match(/<i class=""/g) || []).length === 2, "未开始维度 2 段留空");
ok(/aria-valuenow="2"/.test(st), "进度对读屏可读");

const mbtiRes = ev("computeMbtiResult")(ev("MBTI_QUESTIONS").map((q) => ({ dim: q.dim, dir: q.dir, v: 2 * q.dir })));
ev("renderMbtiResult")(mbtiRes);
const mHtml = ev("$")("mbti-result").innerHTML;
ok(mHtml.indexOf("persona-link") > 0 && mHtml.indexOf("mbti-dim-grid") > 0, "策略卡与依据卡同时存在");
ok(
  mHtml.indexOf("persona-link") < mHtml.indexOf("mbti-dim-grid"),
  "顺序：先「面试策略已调整」，再逐维依据（先给结论）"
);
ok(/你的面试策略已调整/.test(mHtml), "策略卡标题直说「已调整」");
ok(/mbti-boundary/.test(mHtml) && /非专业心理测评/.test(mHtml), "边界说明收到底部小字，不抢焦点");
ok(/chart-bipolar/.test(mHtml), "四维刻度视图保留（v37/v38 口径不变）");
ok(/查看是哪 \d+ 题导致的/.test(mHtml), "逐维溯源仍在");

/* 说明与边界声明必须身在 #mbti-intro 之内：写在外面时 intro.hidden 管不到，
   测评完成后结果页会被这两段顶着，首屏看不到 ESTJ 与「策略已调整」。 */
const introHtml = (rd("frontend/index.html").match(/<div id="mbti-intro">[\s\S]*?<div id="mbti-quiz"/) || [""])[0];
ok(/答题约需 2 分钟/.test(introHtml), "时长说明位于 #mbti-intro 内部（随 intro 一并收起）");
ok(/本测评为端侧简易量表/.test(introHtml), "边界声明同样在 #mbti-intro 内部");
ok(!/mbti-intro-only/.test(rd("frontend/index.html")), "不再依赖 mbti-intro-only 补丁类来单独隐藏");
{
  const mbtiSrc = rd("frontend/js/features/mbti.js");
  ok(/document\.body\.classList\.add\("mbti-resulting"\)/.test(mbtiSrc), "有结果时进入结果态类");
  ok(/document\.body\.classList\.remove\("mbti-resulting"\)/.test(mbtiSrc), "无结果时退出结果态类（重新测评不残留）");
}
{
  const cssAll = rd("frontend/css/pages.css");
  ok(/body\.mbti-resulting\s+\.page-header\s+p/.test(cssAll), "结果态收起页头描述，首屏让给结论");
  ok(/body\.mbti-quizzing\s+\.page-header\s+p/.test(cssAll), "答题态同样收起页头描述（题干直接进视口）");
}

/* ---------- ⑧ 报告页真实渲染 ---------- */
console.log("\n⑧ 报告页渲染（用真实 DOM 验收）");
(async () => {
  const w2 = boot();
  const ev2 = (code) => w2.eval(code);
  /* 等 bootApp 跑完再注入状态：bootApp 会用 store 里的 fm_session 覆盖顶层 session，
     先注入会被它清空（turns 归零，报告读到空会话）。 */
  await new Promise((r) => setTimeout(r, 900));
  ev2("currentUser = { id: 'v44-test', name: '测试用户', email: 't@example.com' }");
  ev2("session = { mode: 'general', turns: [], voiceSegments: [] }");
  ev2(
    `session.turns = ${JSON.stringify([
      {
        agent: "技术面试官",
        question: "讲讲你做过的最有挑战的项目。",
        answer:
          "我在 2025 年做了一个实时协作白板，用 WebSocket 推送，单房间峰值 1200 连接，P99 延迟 86ms，缓存用 Redis 做了击穿保护。",
        notes: "有量化数据，技术细节充分",
        mode: "general",
      },
      {
        agent: "HR 面试官",
        question: "团队里有人不配合你怎么办？",
        answer: "我会先私下聊一次，了解他卡在哪里，然后把目标拆小一点，先让他拿到一次小成功。",
        notes: "协作导向，缺少结果",
        mode: "general",
      },
      {
        agent: "压力面试官",
        question: "这个方案如果重做，你会怎么改？",
        answer: "先把消息通道换成增量同步，其次把权限校验前移，最后补一套压测基线，之前就是没有基线所以调优靠猜。",
        notes: "有复盘意识",
        mode: "pressure",
      },
    ])}`
  );
  ev2("session.degradeLog = [{ turn: 2, drill: true, at: Date.now() }]");
  await ev2("renderReport(true)");
  const box = ev2("$")("report-content");
  const q = (sel) => box.querySelector(sel);
  ok(!!q("#report-headline"), "首屏诊断块存在");
  ok((q(".rh-say").textContent || "").length > 10, "诊断句非空");
  ok(box.querySelectorAll(".rh-strip .rp-row").length === 5, "轮廓缩略 5 条");
  ok(box.querySelectorAll("#dims .dim-row").length === 5, "五个维度卡仍在");
  ok(box.querySelectorAll("#dims .dim-dots").length === 5, "每张卡都有点阵评分");
  ok(
    Array.from(box.querySelectorAll("#dims .dim-score")).every((el) => /^\d+$/.test(el.textContent.trim())),
    "数字分仍在（点阵只是冗余）"
  );
  ok(box.querySelectorAll("#dims .dim-gap").length <= 3, "同一轮只标一次分歧（不在四张卡上重复同一事实）");
  ok(!!q("#report-degrade") && /演练触发/.test(q("#report-degrade").textContent), "降级记录进入报告");
  ok(!!q("#report-persona"), "人格 - 表现关联卡仍在");
  ok(!!q("#radar .radar-ref"), "雷达画出了目标线");
  ok(!!q("#plan.plan-list") && box.querySelectorAll("#plan .plan-day").length >= 1, "学习路径走时间线容器");
  ok(!!q("#report-total"), "总分锚点仍在（上传/打印依赖它）");

  /* 证据分散：五个维度不该全都引用同一轮 */
  const turns5 = ev2("session.turns");
  const picked = ["depth", "logic", "expression", "fit", "stress"].map(
    (k) => ev2("dimEvidenceFor")({ key: k }, turns5, 0).turn
  );
  ok(new Set(picked).size >= 2, `五个维度引用的轮次有区分度（实际 ${picked.join("/")}）`);
  ok(picked[4] === 3, "抗压维度优先引用压力轮（第 3 轮）");

  /* ---------- ⑩ 锚定标签的挂载顺序（v42 遗留缺陷） ---------- */
  console.log("\n⑩ 面试中的实时锚点：标签确实挂上了");
  const iMock = interviewSrc.indexOf("openAnchorRefTag(body, bubble, anchors.length)");
  const iAppend = interviewSrc.indexOf("body.appendChild(bubble)");
  ok(
    iAppend > 0 && iMock > 0 && iAppend < iMock,
    "Mock 通道：先入 DOM 再插标签（否则 insertBefore 抛 NotFoundError 被吞）"
  );
  ok(
    interviewSrc.indexOf('$("chat-body").appendChild(div)') <
      interviewSrc.indexOf('openAnchorRefTag($("chat-body"), div'),
    "恢复会话：同样先入 DOM 再插标签"
  );
  const host = w.document.createElement("div");
  const bub = w.document.createElement("div");
  ok(ev("openAnchorRefTag")(host, bub, 2) === null, "参考节点不在 DOM 时返回 null（原缺陷的可复现形态）");
  host.appendChild(bub);
  const wrap = ev("openAnchorRefTag")(host, bub, 2);
  ok(!!wrap && wrap.nextElementSibling === bub, "入 DOM 后标签落在气泡之前");
  ok(/anchor-ref-tag pending/.test(ev("anchorRefTagHtml")([], 2)), "未落题时是 pending 态，不预告结论");
  ok(/基于你提到的/.test(ev("anchorRefTagHtml")(["1200 连接"], 3)), "命中后写明锚定的是哪一句");

  /* ---------- ⑨ 视觉规范不破 ---------- */
  console.log("\n⑨ 视觉规范（蓝图编辑风）");
  const pageCss = rd("frontend/css/pages.css");
  const v44Start = pageCss.indexOf("v44 · 感知密度层");
  /* v45 起样式层叠在后面，区块切片要按下一个横幅截止，否则会把 v45 的规则算进 v44 */
  const v45Start = pageCss.indexOf("v45 · 交互确定性层");
  const v44 = pageCss.slice(v44Start, v45Start > v44Start ? v45Start : pageCss.length);
  ok(v44.length > 200, "v44 样式区块存在");
  ok(!/box-shadow/.test(v44), "v44 未引入投影");
  ok(!/border-radius:\s*(?!0)[1-9]/.test(v44), "v44 未引入圆角");
  ok(/border-left:\s*3px solid var\(--brand\)/.test(v44), "强调用「左侧 3px 朱红竖条」而非大面积底色");
  ok(/\.dim-dots i\.on\s*\{\s*background:\s*var\(--brand\)/.test(v44), "点阵填充走主题变量（换色不破）");
  ok(/\.plan-list::before/.test(v44), "时间线用发丝线绘制");
  ok(!/@media print[\s\S]*v44/.test(v44), "v44 不改打印样式");

  console.log(`\n${fail === 0 ? "✅ 通过" : "❌ 失败"}：${pass} 项断言，${fail} 项失败\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
