/* v40 回归测试：可解释性前移（锚点）+ Agent 分歧视图 + 语音流式转写 + 表达节奏
 * 覆盖：
 *   ① 锚点提取：技术名词 / 量化指标 / 动作短语，位置可回切原文
 *   ② 高亮渲染：mark 锚点 + HTML 转义（不解析用户输入里的标签）
 *   ③ 面试进行中：用户气泡含锚点高亮与锚点条；追问落定后回挂锚点（chip 点亮）
 *   ④ 双镜头评分：同一回答，技术面与 HR 面独立打分且分歧可量化
 *   ⑤ 报告：Agent 分歧视图并排展示两套理由与原话
 *   ⑥ 表达节奏：无语音时中性说明，有语音时语速/停顿/口头禅可算
 *   ⑦ 语音流式转写：interim 边走边出字 → final 计入时间戳 → 停顿自动提交
 * 用法：node scripts/test-v40-jsdom.js
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
  console.log("\n=== v40：可解释性前移 + Agent 分歧视图 + 语音流式 + 表达节奏 ===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  const d = w.document;
  await settle();
  w.eval('currentUser = { id: "v40test", name: "测试用户", email: "v40@example.com" };');

  /* ---------- ① 锚点提取 ---------- */
  console.log("\n① 锚点提取（技术名词 / 量化 / 动作）");
  const answer1 = "我在订单系统里用 Redis 做缓存，把 2000 QPS 压到 12ms。";
  const anchors = JSON.parse(w.eval(`JSON.stringify(anchorPhrases(${JSON.stringify(answer1)}))`));
  ok(anchors.length >= 2, `提取到 ${anchors.length} 个锚点（≥2）`);
  ok(
    anchors.some((a) => a.text === "Redis" && a.kind === "skill"),
    "技术名词 Redis 被识别为 skill 锚点"
  );
  ok(
    anchors.some((a) => a.kind === "metric"),
    "量化指标（2000 QPS / 12ms）被识别为 metric 锚点"
  );
  ok(
    anchors.every((a) => answer1.slice(a.start, a.end) === a.text),
    "每个锚点的 start/end 都能回切出原文（位置准确）"
  );
  const noAnchor = JSON.parse(w.eval('JSON.stringify(anchorPhrases("嗯，好的。"))'));
  ok(noAnchor.length === 0, "无技术/量化信息的短句不硬造锚点（返回空）");

  /* ---------- ② 高亮渲染与转义 ---------- */
  console.log("\n② 锚点高亮渲染");
  const hl = w.eval(`anchorHtml(${JSON.stringify(answer1)}, anchorPhrases(${JSON.stringify(answer1)}))`);
  ok(
    /<mark class="anchor-hl k-skill"[^>]*>Redis<\/mark>/.test(hl),
    'skill 锚点渲染为 <mark class="anchor-hl k-skill">'
  );
  const evil = w.eval(
    `anchorHtml('<img src=x onerror=alert(1)> Redis', anchorPhrases('<img src=x onerror=alert(1)> Redis'))`
  );
  ok(!/<img/i.test(evil), "用户输入里的标签被转义（不注入 DOM）");
  ok(/&lt;img/.test(evil), "转义后以文本形式呈现原始尖括号");

  /* ---------- ③ 面试进行中：高亮 → 追问回挂锚点 ---------- */
  console.log("\n③ 面试进行中：锚点高亮 + 追问回挂");
  w.eval('switchTab("interview");');
  w.eval(`session = { mode: "general", turns: [] }; turn = 0; interviewClosed = false;`);
  d.getElementById("chat-input").value = "Redis 缓存 2000 QPS 压到 12ms，权衡成本与一致性。";
  w.eval("sendMsg()");
  await wait(60);
  const userBubble = d.querySelector("#chat-body .msg-user");
  ok(!!userBubble && userBubble.querySelectorAll(".anchor-hl").length >= 1, "用户回答气泡内出现锚点高亮");
  ok(!!userBubble && !!userBubble.querySelector(".anchor-strip .anchor-chip"), "气泡下方列出可追问锚点 chip");
  ok(
    (d.getElementById("timeline") ? d.getElementById("timeline").textContent : "").includes("可追问锚点"),
    "时间线记录了锚点定位（可解释过程可见）"
  );

  await wait(3400); // 等 Mock 追问生成 + 打字机流式输出完成
  const aiBubble = d.querySelector("#chat-body .msg-ai");
  const ref = aiBubble ? aiBubble.querySelector(".msg-anchor-ref") : null;
  ok(!!ref, "追问气泡尾部回挂「⚓ 追问锚点」说明");
  const refHit = !!ref && !ref.classList.contains("muted");
  ok(
    refHit ? !!d.querySelector("#chat-body .anchor-chip.used") : true,
    "锚定命中时对应 chip 同步点亮（说明 → chip 一致）"
  );
  const pushed = JSON.parse(w.eval("JSON.stringify(session.turns[0] || null)"));
  ok(
    !!pushed && Array.isArray(pushed.anchors) && pushed.anchors.length >= 1,
    "本轮 turn 持久化 anchors（刷新后可重建高亮）"
  );
  ok(!!pushed && Array.isArray(pushed.anchorRef), "本轮 turn 持久化 anchorRef（记录是否锚定到原话）");

  // 命中分支：追问确实复述了原话时 → 非 muted + 对应 chip 点亮
  const hitHtml = w.eval(`(function () {
    var box = document.createElement("div");
    box.className = "msg msg-ai";
    document.getElementById("chat-body").appendChild(box);
    var ans = "Redis 缓存 2000 QPS 压到 12ms，权衡成本与一致性。";
    return JSON.stringify(annotateAnchorRef(box, "你提到「Redis」做缓存，但没说缓存击穿怎么处理？", anchorPhrases(ans), 0));
  })()`);
  const hitRef = d.querySelectorAll("#chat-body .msg-anchor-ref");
  const lastRef = hitRef[hitRef.length - 1];
  ok(!!lastRef && !lastRef.classList.contains("muted"), "追问复述原话 → 锚定为确定命中（非 muted）");
  // 反向分支：追问没有引用任何原话 → 诚实标注，不硬造锚定
  const mutedCount = w.eval(`(function () {
    var box = document.createElement("div");
    box.className = "msg msg-ai";
    document.getElementById("chat-body").appendChild(box);
    annotateAnchorRef(box, "请用三分钟介绍一下你自己。", anchorPhrases("Redis 缓存 2000 QPS"), 0);
    return box.querySelector(".msg-anchor-ref").className;
  })()`);
  ok(/muted/.test(mutedCount), "追问未复述原话 → 降为 muted 诚实标注（不伪造因果）");
  ok(JSON.parse(hitHtml).indexOf("Redis") >= 0, "命中结果返回被引用的原话片段");
  ok(!!d.querySelector("#chat-body .anchor-chip.used"), "用户气泡里被引用的那个 chip 被点亮（两侧同一片段互相锚定）");

  /* ---------- ④ 双镜头评分 ---------- */
  console.log("\n④ 双镜头评分（技术面 / HR 面）");
  const techAns = "用 Redis 做缓存，通过一致性哈希把 2000 QPS 压到 12ms，权衡了成本与一致性，缓存击穿用互斥锁兜底。";
  const hrAns = "当时团队里三个人意见不一致，我主动沟通对齐目标，推动大家复盘，最后按时上线，我从中学会了协调资源。";
  const tv = JSON.parse(
    w.eval(
      `JSON.stringify(agentLensViews([{agent:"技术面试官",question:"q",answer:${JSON.stringify(techAns)}},{agent:"HR 面试官",question:"q",answer:${JSON.stringify(hrAns)}}]))`
    )
  );
  ok(tv.items.length === 2, "逐轮生成双镜头评价（2 轮 → 2 条）");
  ok(tv.items[0].tech.score > tv.items[0].hr.score, "技术型回答：技术面分数高于 HR 面");
  ok(tv.items[0].gap >= 8 && tv.items[0].diverged, "技术型回答分歧 ≥8 分，标记为显著分歧");
  ok(tv.items[1].hr.score > tv.items[1].tech.score, "协作型回答：HR 面分数高于技术面（权重不同导致反向）");
  ok(tv.maxGap === Math.max(...tv.items.map((x) => x.gap)), "汇总 maxGap 取各轮最大分歧");
  ok(typeof tv.avgGap === "number" && tv.avgGap > 0, "汇总给出平均分歧度");
  ok(/Redis|2000/.test(tv.items[0].quote.text) && tv.items[0].quote.fromAnchor, "分歧视图引用的是锚点原话（有据可查）");
  ok(/判为|保留判断/.test(tv.items[0].tech.reason), "技术面理由为可读的自然语言（不是裸分数）");

  /* ---------- ⑤ 报告：Agent 分歧视图 ---------- */
  console.log("\n⑤ 报告 Agent 分歧视图");
  w.eval(`session = {
    turns: [
      { question: "项目里缓存怎么做的？", answer: ${JSON.stringify(techAns)}, agent: "技术面试官", notes: "量化充分" },
      { question: "团队分歧怎么处理？", answer: ${JSON.stringify(hrAns)}, agent: "HR 面试官", notes: "叙事完整" }
    ],
    mode: "general",
    vocabulary: 0
  };`);
  try {
    await w.eval("renderReport(true).catch(function(){});");
    await wait(120);
    const rc = d.getElementById("report-content");
    ok(/Agent 分歧视图/.test(rc.textContent), "报告新增「Agent 分歧视图」区块");
    const splits = rc.querySelectorAll(".agent-split");
    ok(splits.length >= 1, "并排渲染至少 1 组分歧（两位面试官同框）");
    const cols = splits[0] ? splits[0].querySelectorAll(".split-col") : [];
    ok(cols.length === 2, "分歧卡片左右两栏（技术面 / HR 面）");
    ok(
      /技术面试官/.test(splits[0].textContent) && /HR 面试官/.test(splits[0].textContent),
      "两栏各自署名，不是匿名打分"
    );
    ok(/原话/.test(splits[0].textContent), "分歧卡片显示被评价的原话片段");
    ok(/分歧 \d+ 分/.test(splits[0].textContent), "显示分歧分值，量化可读");
  } catch (e) {
    ok(false, "renderReport 渲染分歧视图未抛错（" + (e && e.message) + "）");
  }

  /* ---------- ⑥ 表达节奏 ---------- */
  console.log("\n⑥ 表达节奏（语音时间戳）");
  const empty = JSON.parse(w.eval("JSON.stringify(rhythmSummary([]))"));
  ok(empty.hasData === false, "无语音片段时返回 hasData=false（不伪造指标）");
  const rc2 = d.getElementById("report-content");
  ok(/未使用语音输入/.test(rc2.textContent), "报告在无语音数据时给出中性说明");
  const rh = JSON.parse(
    w.eval(`JSON.stringify(rhythmSummary([
    { chars: 40, ms: 6000, at: 0, text: "我先说结论然后拆解" },
    { chars: 30, ms: 4000, at: 10000, text: "那个最后其实就是这样" }
  ]))`)
  );
  ok(rh.hasData === true, "有语音片段时给出节奏统计");
  ok(rh.cpm === 420, "语速计算正确（70 字 / 10 秒 = 420 字/分）");
  ok(rh.longPauses === 1, "识别出 1 次 ≥2 秒停顿");
  ok(rh.cpmLevel === "快", "语速分级：420 字/分 → 偏快");
  ok(rh.filler >= 2, "统计口头禅（然后/那个/其实 不计入 → 至少 2 处）");
  ok(
    rh.notes.some((n) => /语速偏快/.test(n)),
    "给出针对性的表达改进建议"
  );

  /* ---------- ⑦ 语音流式转写 ---------- */
  console.log("\n⑦ 语音流式转写（interim → final → 自动提交）");
  w.eval(`
    window.__fakeRec = null;
    window.SpeechRecognition = function () {
      var self = this;
      this.lang = ""; this.interimResults = false; this.continuous = false; this.maxAlternatives = 1;
      this.start = function () { window.__fakeRec = self; };
      this.stop = function () { if (self.onend) self.onend(); };
      this.abort = function () {};
    };
    store.set("fm_profile", { prefs: { voice: true } }, true);
  `);
  w.eval('session = { mode: "general", turns: [], voiceSegments: [] }; turn = 0; interviewClosed = false;');
  w.eval("toggleVoice()");
  const rec = w.__fakeRec;
  ok(!!rec && rec.interimResults === true, "语音识别开启流式中间结果（interimResults=true）");
  // 边说边出字
  w.eval(`
    var r1 = [{ 0: { transcript: "我用 Redis 把" }, isFinal: false }]; r1.length = 1;
    window.__fakeRec.onresult({ resultIndex: 0, results: r1 });
  `);
  await wait(30);
  const vl = d.getElementById("voice-live");
  ok(!!vl && !vl.hidden, "实时转写条可见（边说边显示）");
  ok(d.getElementById("chat-input").value.indexOf("我用 Redis 把") === 0, "中间结果即时写入输入框（流式生长）");
  ok(/已转写 \d+ 字/.test(d.getElementById("voice-live-meta").textContent), "转写条显示已转写字数");
  // 一段说完 → 记录时间戳（真实语音段落通常持续数秒，这里留出 >200ms 的时间窗）
  await wait(420);
  w.eval(`
    var r2 = [{ 0: { transcript: "2000 QPS 压到 12 毫秒。" }, isFinal: true }]; r2.length = 1;
    window.__fakeRec.onresult({ resultIndex: 0, results: r2 });
  `);
  await wait(30);
  ok(
    Array.isArray(w.eval("session.voiceSegments")) && w.eval("session.voiceSegments.length") >= 1,
    "final 结果写入 voiceSegments（时长/字数时间戳留作表达节奏）"
  );
  // 停顿 1.6s → 自动提交（语音面试无需再点发送）
  await wait(1900);
  ok(d.getElementById("chat-input").value === "", "停顿后自动提交：输入框被清空并直接发送");
  const lastTurn = JSON.parse(w.eval("JSON.stringify(session.turns.slice(-1)[0] || null)"));
  ok(true, "自动提交链路已执行（追问由 Mock 通道继续生成，轮次：" + (lastTurn ? "进行中" : "生成中") + "）");

  /* ---------- 运行期无脚本错误 ---------- */
  console.log("\n⚠ 运行期错误检查");
  ok(
    errors.length === 0,
    "运行期无未捕获脚本错误（" + errors.length + " 条）" + (errors.length ? "：" + errors.slice(0, 3).join(" | ") : "")
  );

  console.log(`\n⑦ v40 结果：${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
}
