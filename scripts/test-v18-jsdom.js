/* v18 jsdom 功能测试：求职管理（投递看板 + 面试复盘）/ 答题计时器 / 连环追问 /
   语音输入实时反馈 / 句子级改写证据 / 人设题库 / Mock 派发对照断言 / Bento Grid / 可访问性修正
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v18-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => {
  const msg = (e && e.message) || String(e);
  if (!/^Not implemented:/.test(msg)) errors.push("jsdomError: " + msg);
});
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));

const dom = new JSDOM(html, {
  url: "https://example.com/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;
const { document } = window;

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label); }
}

setTimeout(runTests, 300);

function runTests() {
  console.log("\n=== v18 jsdom 功能测试 ===");

  ok(errors.length === 0, "页面脚本加载无错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

  /* 登录（播种测试用户） */
  window.eval("currentUser = { id: 'u_test', email: 't@t.com', name: '演示用户' }");
  window.eval("renderUserMenu()");

  /* ============ A. 求职管理：路由与结构 ============ */
  console.log("\n-- A. 求职管理路由与结构 --");
  ok(window.eval("APP_PAGES.includes('jobs')"), "路由表含 jobs");
  ok(window.eval("APP_PAGE_TITLES.jobs") === "求职管理", "jobs 有中文标题");
  ok(document.querySelectorAll('.sb-item[data-nav="jobs"]').length === 1, "侧栏含求职管理入口");
  ok(document.querySelectorAll('.tabbar-item[data-nav="jobs"]').length === 1, "底栏含求职入口");
  ok(document.querySelector('.app-page[data-page="jobs"] .jobs-tabs'), "求职管理页含子页签");
  ok(document.querySelectorAll('.app-page[data-page="jobs"] .jobs-pane').length === 2, "含看板 / 复盘两个子页");

  /* ============ B. 投递看板 ============ */
  console.log("\n-- B. 投递看板 --");
  window.location.hash = "#/jobs";
  setTimeout(() => {
    ok(document.querySelector('.app-page[data-page="jobs"]').classList.contains("active"), "jobs 页激活");
    ok(document.getElementById("bc-current").textContent === "求职管理", "面包屑显示求职管理");
    ok(document.querySelector("#board-columns .board-empty"), "空看板显示占位");
    ok(document.getElementById("review-list").textContent.includes("还没有复盘记录"), "复盘列表空态");

    /* 添加投递记录 */
    document.getElementById("app-company").value = "字节跳动";
    document.getElementById("app-role").value = "后端开发工程师";
    document.getElementById("app-status").value = "applied";
    document.getElementById("app-note").value = "内推 · 张三";
    window.eval("addApplication()");
    ok(document.querySelectorAll("#board-columns .board-card").length === 1, "添加后看板出现 1 张卡");
    ok(document.getElementById("board-stats").textContent.includes("总投递"), "统计卡已渲染");
    ok(window.eval("getApplications().length") === 1, "投递记录已持久化（localStorage）");
    ok(document.querySelector("#board-columns").textContent.includes("字节跳动"), "卡片显示公司名");

    /* 状态流转 */
    const appId = window.eval("getApplications()[0].id");
    window.eval(`moveApplication("${appId}", 1)`);
    ok(window.eval("getApplications()[0].status") === "written", "→ 推进到「笔试中」");
    window.eval(`moveApplication("${appId}", 1)`);
    ok(window.eval("getApplications()[0].status") === "interview", "→ 推进到「面试中」");
    window.eval(`moveApplication("${appId}", 1)`);
    ok(window.eval("getApplications()[0].status") === "offer", "→ 直达「已拿 Offer」");
    ok(document.getElementById("board-stats").textContent.includes("100%"), "Offer 转化率 100%");

    /* 删除 */
    window.eval(`removeApplication("${appId}")`);
    ok(window.eval("getApplications().length") === 0, "删除后看板清空");
    ok(document.querySelector("#board-columns .board-empty"), "清空后恢复占位");

    /* ============ C. 面试复盘 ============ */
    console.log("\n-- C. 面试复盘（6 轮对话 → 结论） --");
    window.eval("switchJobsTab('review')");
    ok(!document.querySelector('[data-jobs-pane="review"]').hidden, "复盘子页显示");
    ok(document.querySelector('[data-jobs-pane="board"]').hidden, "看板子页同步隐藏");

    window.eval("startReview()");
    setTimeout(() => {
      ok(document.querySelectorAll("#review-chat .review-msg.ai").length >= 2, "复盘助手已提出第 1 问");
      ok(!document.getElementById("review-input-row").hidden, "输入行已展开");

      const answers = [
        "字节跳动 · 后端开发工程师",
        "技术二面 · 视频面试",
        "Redis 缓存一致性怎么保证",
        "讲了延迟双删方案，自评 6 分",
        "待定",
        "应该补充量化数据与监控细节",
      ];
      answers.forEach(a => {
        document.getElementById("review-input").value = a;
        window.eval("submitReviewAnswer()");
      });
      ok(window.eval("getReviews().length") === 1, "6 轮问答后生成 1 条复盘记录");
      const r = window.eval("getReviews()[0]");
      ok(r && r.conclusion.includes("字节跳动") && r.conclusion.includes("6"), "结论包含公司与自评分");
      ok(r && r.conclusion.includes("压力面"), "结论给出后续训练建议");
      ok(document.querySelectorAll("#review-list .review-item").length === 1, "复盘列表渲染");
      ok(document.querySelector("#review-list .review-conclusion").textContent.includes("📌"), "结论卡渲染");
      ok(document.getElementById("review-input-row").hidden, "完成后输入行收起");

      /* 取消流程不落库 */
      window.eval("startReview()");
      window.eval("cancelReview()");
      ok(window.eval("getReviews().length") === 1, "取消复盘不产生新记录");

      /* ============ D. 答题计时器 ============ */
      console.log("\n-- D. 答题计时器 --");
      ok(!!document.getElementById("answer-timer"), "chat-head 含答题计时器");
      window.eval("startAnswerTimer()");
      ok(document.getElementById("answer-timer").textContent === "⏱ 90s", "提问后启动 90 秒倒计时");
      window.eval("answerLeft = 10; paintAnswerTimer();");
      ok(document.getElementById("answer-timer").classList.contains("warn"), "≤15 秒进入警示态");
      const sysBefore = document.querySelectorAll("#chat-body .msg-system").length;
      window.eval("onAnswerTimeout()");
      ok(document.querySelectorAll("#chat-body .msg-system").length === sysBefore + 1, "超时后面试官追问一句话总结");
      ok(document.getElementById("timeline").textContent.includes("抗压表现"), "超时记入抗压维度证据");
      window.eval("stopAnswerTimer()");

      /* ============ E. 语音输入实时反馈 ============ */
      console.log("\n-- E. 语音输入实时反馈（本地规则） --");
      window.eval('analyzeVoiceInput("然后那个就是我们的核心方案，我们负责优化了接口性能", 5000)');
      ok(/语速 \d+(\.\d)? 字\/秒 · 填充词 \d+ 次/.test(document.getElementById("timeline").textContent), "时间线显示语速与填充词统计");
      window.eval('analyzeVoiceInput("然后那个就是我们的核心方案我们负责优化了接口性能并且完成了全链路压测与容量评估", 4000)');
      ok(document.getElementById("timeline").textContent.includes("语速偏快") || document.getElementById("timeline").textContent.includes("填充词偏多"), "异常语速/填充词给出提示");

      /* ============ F. 句子级改写证据 ============ */
      console.log("\n-- F. 句子级改写证据 --");
      window.eval(`session.turns = [
        { agent: "技术面试官", question: "q1", answer: "我负责后端接口的开发与维护，保障系统稳定运行。", notes: "n", mode: "tech" },
        { agent: "HR 面试官", question: "q2", answer: "我优化了数据库查询性能，提升了响应速度。", notes: "n", mode: "general" },
        { agent: "压力面试官", question: "q3", answer: "我设计并实现了消息队列模块，支撑业务高峰。", notes: "n", mode: "pressure" },
        { agent: "HR 面试官", question: "q4", answer: "希望寻找更大平台。", notes: "n", mode: "general" }
      ]; renderReport();`);
      ok(window.eval("buildSentenceRewrites(session.turns).length") === 3, "检出 3 句无量化动词句（第 4 句无触发词跳过）");
      ok(!!document.getElementById("rewrites"), "报告渲染句子级改写区块");
      ok(document.getElementById("rewrites").textContent.includes("主导"), "「负责」句给出主导+量化改写模板");
      ok(document.getElementById("rewrites").textContent.includes("STAR"), "「设计」句给出 STAR 改写模板");
      ok(document.getElementById("report-content").textContent.includes("真实面试复盘"), "报告含真实面试复盘入口");

      /* ============ G. 连环追问与人设题库 ============ */
      console.log("\n-- G. 连环追问 + 面试官人设题库 --");
      window.eval('deepDive = { topic: null, left: 0 }; maybeStartDeepDive("Redis 缓存一致性", "general", 1);');
      ok(window.eval("deepDive.left") === 2, "技术关键词触发连环追问（left=2）");
      const q1 = window.eval('pickQuestion("general", 1, "Redis 缓存一致性")');
      ok(q1.includes("Redis 缓存一致性"), "第 1 轮返回同主题深挖题");
      const q2 = window.eval('pickQuestion("general", 2, "Redis 缓存一致性")');
      ok(q2.includes("Redis 缓存一致性"), "第 2 轮继续深挖同一点");
      ok(window.eval("deepDive.left") === 0, "两轮后深挖状态自动重置");

      /* 题库耗尽后按人设选池 */
      window.eval('session.turns = QUESTION_BANK.general.map(q => ({ agent: "压力面试官", question: q, answer: "测试回答", notes: "n", mode: "general" }));');
      const hrq = window.eval('pickQuestion("general", 6, "团队协作", { id: "hr", name: "HR 面试官" })');
      ok(/价值主张|成长|方向|不认可/.test(hrq), "HR 面试官使用动机/稳定性专属题库");
      const pq = window.eval('pickQuestion("general", 6, "方案", { id: "pressure", name: "压力面试官" })');
      ok(pq.startsWith("等等"), "压力面试官使用三段式话术（打断-否定-要求举证）");
      const gq = window.eval('pickQuestion("general", 6, "方案", { id: "tech", name: "技术面试官" })');
      ok(gq.includes("方案"), "技术面试官仍走技术深挖题库");

      /* ============ H. Mock ↔ 完整工程 派发对照断言 ============ */
      console.log("\n-- H. 自检面板对照断言 --");
      window.eval("session.turns = [];");
      window.eval("runSelfCheckPanel()");
      ok(document.querySelectorAll("#self-check-list .check-item.fail").length === 0, "工程自检 7/7 全部通过");
      ok(document.getElementById("self-check-summary").textContent.includes("7/7"), "自检汇总显示 7/7");
      ok(document.getElementById("self-check-list").textContent.includes("Mock 派发一致性"), "自检含派发一致性断言");
      ok(document.getElementById("self-check-list").textContent.includes("连环追问触发"), "自检含连环追问断言");

      /* ============ I. Bento Grid 与可访问性修正 ============ */
      console.log("\n-- I. Bento Grid / 玻璃拟态 / 对比度 --");
      ok(document.querySelectorAll(".quick-entries-hero .qe-featured").length === 2, "2 张核心入口 featured 化");
      const cssText = [...document.styleSheets[0].cssRules].map(r => r.cssText).join("\n");
      ok(cssText.includes(".quick-entries-hero") && /repeat\(4,\s*1fr\)/.test(cssText), "快速入口升级为 4 列 Bento 网格");
      ok(cssText.includes("grid-column: span 2"), "核心入口跨列（span 2）");
      ok(cssText.includes("repeat(9, 1fr)"), "底部 Tab 栏 9 格布局（v19 新增题库入口）");
      ok(cssText.includes("rgba(255,255,255,0.85)"), "亮色玻璃边框对比度增强");
      ok(/#8A90B8/.test(cssText), "暗色 --faint 提升至 #8A90B8（WCAG AA）");
      ok(/color-mix\(in srgb, var\(--bg\) 92%, #000\)/.test(cssText), "诊断日志背景主题化");
      ok(document.getElementById("answer-timer").className.includes("answer-timer"), "计时器样式类就位");

      /* ============ J. 版本号与游客态 ============ */
      console.log("\n-- J. 版本号与游客态 --");
      ok(document.querySelector(".sb-footer").textContent.includes("beta1.0"), "侧栏版本号 beta1.0");
      window.eval("logout()");
      window.location.hash = "#/jobs";
      setTimeout(() => {
        ok(document.querySelector('.app-page[data-page="jobs"]').classList.contains("active"), "游客态可进入求职管理");
        ok(!!document.querySelector("#board-columns .board-empty"), "游客态看板为空且无报错");
        ok(errors.length === 0, "全程无脚本错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

        console.log(`\n结果：${pass} 通过，${fail} 失败`);
        process.exit(fail ? 1 : 0);
      }, 250);
    }, 400);
  }, 250);
}
