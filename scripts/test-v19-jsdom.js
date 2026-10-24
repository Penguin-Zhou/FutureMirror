/* v19 jsdom 功能测试：题库与小测模块 + VIP 会员体系
 *   ① 路由与结构  ② 知识点学习（VIP 锁）  ③ 完整小测流程（计时 / 反馈 / 解析）
 *   ④ 非 VIP 每日限制  ⑤ VIP 解锁  ⑥ VIP 卡 / 徽章 / 报告封面  ⑦ 演示账号自动 VIP
 *   ⑧ 游客态  ⑨ CSSOM
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v19-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => {
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

/* 工具：读取当前题目在题库中的完整数据 */
function currentQuestion() {
  return window.eval(`(function(){
    var q = quizState.list[quizState.idx];
    return QUIZ_BANK.find(function(x){ return x.id === q.id; });
  })()`);
}
/* 工具：点击当前题的正确选项 */
function clickCorrectOption() {
  const q = currentQuestion();
  document.getElementById("quiz-opt-" + q.ans).click();
  return q;
}
/* 工具：点击「下一题 / 查看成绩」 */
function clickNext() {
  document.getElementById("quiz-next-row").querySelector(".btn-primary").click();
}

setTimeout(runTests, 300);

function runTests() {
  console.log("\n=== v19 jsdom 功能测试（题库小测 + VIP 会员体系）===");

  ok(errors.length === 0, "页面脚本加载无错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

  /* 播种测试用户（非 VIP） */
  window.eval("currentUser = { id: 'u_test', email: 't@t.com', name: '演示用户' }");
  window.eval("renderUserMenu()");

  /* ============ A. 路由与结构 ============ */
  console.log("\n-- A. 路由与结构 --");
  ok(window.eval("APP_PAGES.includes('quiz')"), "路由表含 quiz");
  ok(window.eval("APP_PAGE_TITLES.quiz") === "题库小测", "quiz 有中文标题");
  ok(document.querySelectorAll('.sb-item[data-nav="quiz"]').length === 1, "侧栏含题库小测入口");
  ok(document.querySelectorAll('.tabbar-item[data-nav="quiz"]').length === 1, "底栏含题库入口");
  ok(!!document.querySelector('.app-page[data-page="quiz"] .page-header'), "题库页有 page-header");
  ok(
    document.querySelectorAll('.app-page[data-page="quiz"] .quiz-tab').length === 5,
    "题库页含 5 个子页签（v20 新增错题本/收藏夹）"
  );
  ok(document.querySelectorAll('.app-page[data-page="quiz"] .quiz-pane').length === 5, "题库页含 5 个面板容器");
  ok(!!document.getElementById("vip-pill"), "顶栏含 VIP 徽章元素");
  ok(document.getElementById("vip-pill").hidden === true, "未登录/非 VIP 时徽章隐藏");

  /* 题库数据层 */
  console.log("\n-- B. 题库数据 --");
  ok(window.eval("QUIZ_CATS.length") === 5, "题库分 5 个分类");
  ok(window.eval("QUIZ_BANK.length") === 24, "题库共 24 题");
  ok(
    window.eval("QUIZ_CATS.filter(c => c.vip).map(c => c.id).join(',')") === "os,algo,star",
    "VIP 分类为 os/algo/star"
  );
  ok(
    window.eval("QUIZ_BANK.every(q => q.opts.length === 4 && q.ans >= 0 && q.ans < 4 && q.explain && q.q)"),
    "每题 4 个选项 + 合法答案 + 解析"
  );
  ok(
    window.eval("QUIZ_BANK.filter(q => q.cat === 'sql').length") === 6 &&
      window.eval("QUIZ_BANK.filter(q => q.cat === 'network').length") === 6,
    "SQL / 网络各 6 题（免费）"
  );
  ok(
    window.eval("QUIZ_LEN") === 5 && window.eval("QUIZ_PER_Q") === 60 && window.eval("QUIZ_DAILY_FREE") === 1,
    "小测参数：5 题 / 60 秒 / 每日 1 次免费"
  );

  /* ============ C. 知识点学习 ============ */
  window.location.hash = "#/quiz";
  setTimeout(() => {
    ok(document.querySelector('.app-page[data-page="quiz"]').classList.contains("active"), "quiz 页激活");
    ok(document.getElementById("bc-current").textContent === "题库小测", "面包屑显示题库小测");
    ok(document.querySelectorAll("#quiz-pane-learn .quiz-cat").length === 5, "学习面板渲染 5 个分类卡");
    ok(document.querySelectorAll("#quiz-pane-learn .quiz-cat-lock").length === 3, "非 VIP 时 3 个 VIP 分类上锁");
    ok(document.querySelector("#quiz-pane-learn").textContent.includes("SQL 数据库"), "分类卡显示 SQL 数据库");

    /* 免费分类可进入 */
    window.eval("showQuizCat('sql')");
    ok(window.eval("quizLearnCat") === "sql", "点击免费分类进入学习");
    ok(document.querySelectorAll("#quiz-pane-learn .learn-item").length === 6, "SQL 学习列表 6 题");
    ok(document.querySelectorAll("#quiz-pane-learn .learn-opt.correct").length === 6, "每题标注正确答案");
    ok(document.querySelectorAll("#quiz-pane-learn .learn-explain").length === 6, "每题附解析");

    /* VIP 分类被拦截 */
    window.eval("showQuizCat('os')");
    ok(window.eval("quizLearnCat") === "sql", "非 VIP 点击 VIP 分类被拦截（保持原页面）");
    ok(document.querySelector("#toast").textContent.includes("VIP"), "拦截时给出 VIP 提示");

    window.eval("backToQuizCats()");
    ok(
      window.eval("quizLearnCat") === null && document.querySelectorAll("#quiz-pane-learn .quiz-cat").length === 5,
      "返回全部分类"
    );

    /* ============ D. 小测引擎：计时器 ============ */
    console.log("\n-- D. 小测引擎：计时器 --");
    window.eval("switchQuizTab('exam')");
    ok(
      document.getElementById("quiz-pane-exam").hidden === false &&
        document.getElementById("quiz-pane-learn").hidden === true,
      "子页签切换到小测"
    );
    ok(document.querySelector("#quiz-pane-exam .quiz-intro"), "小测首页（规则 + 入口）已渲染");
    ok(document.querySelector("#quiz-pane-exam .quiz-daily-note").textContent.includes("1"), "非 VIP 显示每日免费次数");

    window.eval("startQuiz('sql')");
    ok(window.eval("quizState.running") === true, "开始小测（sql）");
    ok(window.eval("quizState.list.length") === 5, "随机抽取 5 题");
    ok(window.eval("quizState.list.every(q => q.cat === 'sql')"), "分类小测只从该分类抽题");
    ok(!!document.getElementById("quiz-timer"), "计时器元素就位");
    ok(document.getElementById("quiz-timer").textContent.includes("60"), "初始显示 60 秒");
    ok(document.querySelectorAll("#quiz-pane-exam .quiz-opt").length === 4, "当前题渲染 4 个选项");

    /* 倒计时递减与警示态（先把剩余时间压到 12 秒） */
    window.eval("quizState.left = 12");
    setTimeout(() => {
      ok(window.eval("quizState.left") < 12, "计时器每秒递减");
      ok(document.getElementById("quiz-timer").classList.contains("warn"), "≤15 秒进入警示态（红色脉冲）");

      /* 超时分支：answerQuiz(-1) */
      window.eval("answerQuiz(-1)");
      ok(document.querySelector("#quiz-feedback-slot .quiz-feedback").textContent.includes("已超时"), "超时给出提示");
      ok(document.querySelectorAll("#quiz-pane-exam .quiz-opt.correct").length === 1, "超时后高亮正确答案");
      ok(document.getElementById("quiz-next-row").hidden === false, "答题后出现下一题按钮");
      ok(window.eval("quizState.correct") === 0, "超时不计入答对");

      /* 进入下一题，验证正常答对分支 */
      clickNext();
      clickCorrectOption();
      ok(
        document.querySelector("#quiz-feedback-slot .quiz-feedback").classList.contains("correct"),
        "答对给出正确反馈"
      );
      ok(document.querySelector("#quiz-feedback-slot").textContent.includes("解析"), "反馈附解析");
      ok(window.eval("quizState.correct") === 1, "答对计数 +1");

      window.eval("quitQuiz()");
      ok(window.eval("quizState.running") === false, "退出小测后停止");
      ok(!!document.querySelector("#quiz-pane-exam .quiz-intro"), "退出后回到小测首页");
      ok(window.eval("getQuizData().history.length") === 0, "中途退出不写入成绩");

      /* ============ E. 完整一轮 + 成绩归档 ============ */
      console.log("\n-- E. 完整小测流程与成绩归档 --");
      window.eval("startQuiz('mix')");
      ok(window.eval("quizState.running") === true, "开始综合模考");
      ok(window.eval("quizState.list.every(q => quizAllowed(q))"), "非 VIP 综合模考只抽免费分类");

      window.eval("answerQuiz(-1)"); /* Q1 超时 */
      clickNext();
      clickCorrectOption();
      clickNext(); /* Q2 答对 */
      clickCorrectOption();
      clickNext(); /* Q3 答对 */
      clickCorrectOption();
      clickNext(); /* Q4 答对 */
      clickCorrectOption(); /* Q5 答对 */
      ok(window.eval("quizState.correct") === 4, "4 题计入答对（第 1 题超时未计）");
      clickNext(); /* 最后一题 → 查看成绩 */

      ok(window.eval("quizState.running") === false, "最后一题后结束小测");
      ok(!!document.querySelector("#quiz-pane-exam .quiz-result"), "渲染成绩卡");
      ok(
        document.querySelector("#quiz-pane-exam .quiz-result-score .score-num").textContent === "80",
        "得分 = 80（4/5）"
      );
      ok(document.querySelector("#quiz-pane-exam .quiz-result-score").classList.contains("good"), "80 分归入优秀档");
      ok(
        document.querySelector("#quiz-pane-exam .quiz-result-stats").textContent.includes("4/5"),
        "成绩卡显示答对 4/5"
      );

      const qd = window.eval("getQuizData()");
      ok(qd.history.length === 1 && qd.todayCount === 1, "成绩归档到 fm_quiz（历史 1 条 / 今日 1 次）");
      ok(qd.history[0].score === 80 && qd.history[0].total === 5 && qd.history[0].cat === "mix", "归档记录字段完整");

      window.eval("switchQuizTab('stats')");
      ok(document.querySelector("#quiz-pane-stats .qss-card").textContent.includes("1"), "成绩档案显示累计 1 轮");
      ok(document.querySelector("#quiz-pane-stats .quiz-history-item"), "成绩档案含历史条目");

      /* ============ F. 非 VIP 每日限制 ============ */
      console.log("\n-- F. 非 VIP 每日限制 --");
      window.eval("startQuiz('mix')");
      ok(window.eval("quizState.running") === false, "用完免费次数后无法再开始");
      ok(document.getElementById("quiz-pane-stats").hidden === false, "用尽次数后引导到成绩页");
      ok(document.querySelector("#toast").textContent.includes("已用完"), "给出次数用尽提示");

      /* ============ G. VIP 解锁 ============ */
      console.log("\n-- G. VIP 权益解锁 --");
      ok(window.eval("isVip()") === false, "初始为非 VIP");
      window.eval("toggleVipDemo()");
      ok(window.eval("isVip()") === true, "演示开关开通 VIP");
      ok(document.getElementById("vip-pill").hidden === false, "顶栏 VIP 徽章显示");

      window.eval("switchQuizTab('learn')");
      ok(document.querySelectorAll("#quiz-pane-learn .quiz-cat-lock").length === 0, "VIP 后所有分类解锁");
      window.eval("showQuizCat('os')");
      ok(
        window.eval("quizLearnCat") === "os" && document.querySelectorAll("#quiz-pane-learn .learn-item").length === 4,
        "VIP 可学习操作系统分类（4 题）"
      );

      window.eval("switchQuizTab('exam')");
      ok(!document.querySelector("#quiz-pane-exam .quiz-daily-note"), "VIP 不再显示每日次数提示");
      window.eval("startQuiz('algo')");
      ok(
        window.eval("quizState.running") === true && window.eval("quizState.list.length") === 4,
        "VIP 可小测算法分类（4 题）"
      );
      window.eval("startQuiz('mix')");
      ok(window.eval("quizState.running") === true, "VIP 不受每日次数限制（可再次开始）");
      window.eval("quitQuiz()");

      /* ============ H. VIP 卡 / 报告封面 / 演示账号 ============ */
      console.log("\n-- H. VIP 卡 / 报告封面 / 演示账号自动 VIP --");
      window.location.hash = "#/profile";
      setTimeout(() => {
        const card = document.getElementById("vip-card");
        ok(!!card, "个人中心渲染 VIP 卡");
        ok(card && !card.classList.contains("vip-off"), "VIP 态卡片样式（非关闭态）");
        ok(card && card.textContent.includes("VIP 权益已生效"), "卡片显示权益生效");
        ok(card && card.querySelectorAll(".vip-perk").length === 4, "卡片列出 4 项权益");

        const cover = window.eval("renderReportCover()");
        ok(cover.includes("👑 VIP 会员"), "报告封面显示 VIP 徽章");

        /* 演示账号登录 → 自动 VIP（jsdom 无 matchMedia，先为 bootApp 打桩） */
        window.eval(`window.matchMedia = window.matchMedia || function(q){
          return { matches: false, media: q, onchange: null,
            addListener: function(){}, removeListener: function(){},
            addEventListener: function(){}, removeEventListener: function(){},
            dispatchEvent: function(){ return false; } };
        }`);
        window.eval("quickDemoLogin()");
        ok(window.eval("currentUser.email") === "demo@futuremirror.app", "演示账号登录成功");
        ok(window.eval("isVip()") === true, "演示账号自动获得 VIP");
        ok(document.getElementById("vip-pill").hidden === false, "演示账号顶栏徽章显示");
        ok(window.eval("renderReportCover()").includes("👑 VIP 会员"), "演示账号报告封面带 VIP 徽章");

        /* 关闭 VIP 后徽章与封面同步 */
        window.eval("toggleVipDemo()");
        ok(window.eval("isVip()") === false, "演示开关可关闭 VIP");
        ok(document.getElementById("vip-pill").hidden === true, "关闭后徽章隐藏");
        ok(!window.eval("renderReportCover()").includes("👑 VIP 会员"), "关闭后报告封面无 VIP 徽章");

        /* ============ I. 游客态 ============ */
        console.log("\n-- I. 游客态 --");
        window.eval("logout()");
        window.location.hash = "#/quiz";
        setTimeout(() => {
          ok(document.querySelector('.app-page[data-page="quiz"]').classList.contains("active"), "游客可进入题库页");
          ok(window.eval("quizLearnCat") === null, "权益失效后回落分类网格（不残留 VIP 分类视图）");
          ok(document.querySelectorAll("#quiz-pane-learn .quiz-cat-lock").length === 3, "游客态 3 个 VIP 分类上锁");
          ok(document.getElementById("vip-pill").hidden === true, "游客态徽章隐藏");
          ok(window.eval("isVip()") === false, "游客态 isVip() 为 false");

          /* ============ J. CSSOM ============ */
          console.log("\n-- J. CSSOM 断言 --");
          const cssText = [...document.styleSheets]
            .map((s) => {
              try {
                return [...s.cssRules].map((r) => r.cssText).join("\n");
              } catch (e) {
                return "";
              }
            })
            .join("\n");
          ok(cssText.includes(".quiz-tab.active"), "子页签激活态样式就位");
          ok(/\.quiz-pane\[hidden\]\s*\{\s*display:\s*none/.test(cssText), "隐藏面板不占位");
          ok(/\.vip-pill\[hidden\]\s*\{\s*display:\s*none/.test(cssText), "VIP 徽章可隐藏");
          ok(
            /\.quiz-opt\.correct\s*\{[^}]*\}/.test(cssText) && /\.quiz-opt\.wrong\s*\{[^}]*\}/.test(cssText),
            "选项正确/错误态样式"
          );
          ok(/repeat\(9,\s*1fr\)/.test(cssText), "底部 Tab 栏 9 格布局");
          ok(cssText.includes(".vip-card"), "个人中心 VIP 卡样式");
          ok(cssText.includes(".quiz-result-score"), "成绩环样式");

          ok(errors.length === 0, "全程无脚本错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

          console.log(`\n结果：${pass} 通过，${fail} 失败`);
          process.exit(fail ? 1 : 0);
        }, 250);
      }, 300);
    }, 1200);
  }, 250);
}
