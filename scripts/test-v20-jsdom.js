/* v20 jsdom 功能测试：题库增强（错题本/收藏/搜索/多模式/每日一练/数据看板）
 *             + AI 小助手 + 移动端顶部导航
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v20-jsdom.js
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
  console.log("\n=== v20 jsdom 功能测试（题库增强 + AI 小助手）===");

  ok(errors.length === 0, "页面脚本加载无错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

  /* 播种测试用户（非 VIP） */
  window.eval("currentUser = { id: 'u_test', email: 't@t.com', name: '演示用户' }");
  window.eval("renderUserMenu()");

  /* ============ A. 结构 ============ */
  console.log("\n-- A. 结构：五页签 / AI 助手 / 模式条 --");
  ok(document.querySelectorAll('.app-page[data-page="quiz"] .quiz-tab').length === 5, "题库页 5 个子页签");
  ok(document.querySelectorAll('.app-page[data-page="quiz"] .quiz-pane').length === 5, "题库页 5 个面板");
  ok(document.querySelectorAll('.quiz-tab[data-quiz="wrong"]').length === 1 && document.querySelectorAll('.quiz-tab[data-quiz="fav"]').length === 1, "错题本 / 收藏夹页签就位");
  ok(!!document.getElementById("ai-fab"), "AI 小助手悬浮按钮存在");
  ok(!!document.getElementById("ai-assistant-panel"), "AI 助手抽屉存在");
  ok(document.getElementById("ai-assistant-panel").classList.contains("open") === false, "抽屉默认收起");
  ok(document.querySelector(".sb-footer").textContent.includes("beta1.0"), "侧栏版本号 beta1.0");
  ok(window.eval("QUIZ_MODES.exam.timed") === true && window.eval("QUIZ_MODES.practice.timed") === false, "模式配置：exam 计时 / practice 不限时");

  /* ============ B. 题目搜索 ============ */
  window.location.hash = "#/quiz";
  setTimeout(() => {
    ok(document.querySelector('.app-page[data-page="quiz"]').classList.contains("active"), "quiz 页激活");
    ok(!!document.getElementById("quiz-search-input"), "学习面板含搜索框");
    ok(document.querySelectorAll("#quiz-pane-learn .quiz-entry-card").length === 2, "收藏夹 / 错题本入口卡");
    ok(document.querySelectorAll("#quiz-pane-learn .quiz-cat").length === 5, "分类网格仍为 5 张卡");

    /* 搜索命中（题目文本关键词） */
    window.eval("runQuizSearch('索引')");
    const resBox = document.getElementById("quiz-search-results");
    ok(resBox.hidden === false, "搜索后结果区展开");
    ok(document.querySelectorAll("#quiz-search-results .learn-item").length >= 2, "「索引」命中至少 2 题（sql-2 / sql-3）");
    ok(resBox.textContent.includes("道与"), "结果头部显示命中数量");
    ok(document.getElementById("quiz-cat-zone").hidden === true, "搜索时收起分类网格");

    /* VIP 内容对非 VIP 过滤 */
    window.eval("runQuizSearch('死锁')");
    ok(document.querySelectorAll("#quiz-search-results .learn-item").length === 0, "非 VIP 搜索不到 VIP 分类内容（死锁）");
    ok(document.getElementById("quiz-search-results").textContent.includes("VIP 分类需开通后才可搜索"), "过滤时给出 VIP 提示");

    /* 按分类名搜索 */
    window.eval("runQuizSearch('网络')");
    ok(document.querySelectorAll("#quiz-search-results .learn-item").length === 6, "按分类名「网络」命中 6 题");

    /* 清除搜索 */
    window.eval("clearQuizSearch()");
    ok(document.getElementById("quiz-search-results").hidden === true && document.getElementById("quiz-cat-zone").hidden === false, "清除搜索后恢复分类网格");

    /* 搜索练习模式 */
    window.eval("runQuizSearch('TCP')");
    window.eval("startSearchPractice()");
    ok(window.eval("quizState.running") === true && window.eval("quizState.mode") === "search", "可从搜索结果开始练习");
    ok(window.eval("quizState.list.length") >= 1 && window.eval("quizState.list.every(q => q.q.includes('TCP') || q.opts.some(o => o.includes('TCP')))"), "搜索练习题目来自命中集");
    ok(!document.getElementById("quiz-timer"), "搜索练习不限时（无计时器）");
    ok(!!document.querySelector("#quiz-pane-exam .quiz-mode-chip"), "不限时模式显示「不限时」标记");
    window.eval("quitQuiz()");

    /* ============ C. 收藏 ============ */
    console.log("\n-- C. 收藏夹 --");
    ok(window.eval("isFav('sql-1')") === false, "初始未收藏");
    window.eval("toggleFav('sql-1')");
    ok(window.eval("isFav('sql-1')") === true, "toggleFav 收藏成功");
    ok(window.eval("getFavs()")[0] === "sql-1", "收藏持久化到 fm_fav（store）");
    ok(window.eval("JSON.parse(localStorage.getItem('u_test_fm_fav'))[0]") === "sql-1", "localStorage 中可读回");

    /* 学习列表中星标按钮 */
    window.eval("showQuizCat('sql')");
    const favBtn = document.querySelector('#quiz-pane-learn .learn-item [data-fav-btn="sql-1"]');
    ok(!!favBtn && favBtn.classList.contains("on"), "学习列表星标反映收藏态");
    favBtn.click();
    ok(window.eval("isFav('sql-1')") === false, "点击星标取消收藏");
    ok(document.querySelectorAll('#quiz-pane-learn [data-fav-btn="sql-1"].on').length === 0, "取消后按钮态同步");

    /* 收藏夹页 */
    window.eval("toggleFav('net-1')");
    window.eval("toggleFav('sql-1')");
    window.eval("switchQuizTab('fav')");
    ok(document.querySelectorAll("#quiz-pane-fav .learn-item").length === 2, "收藏夹渲染 2 题");
    ok(document.getElementById("quiz-pane-fav").textContent.includes("TCP"), "收藏夹显示题目内容");
    ok(document.querySelectorAll('#quiz-pane-fav [data-fav-btn].on').length === 2, "收藏夹中星标均为已收藏态");
    window.eval("toggleFavBtn('net-1', document.querySelector('#quiz-pane-fav [data-fav-btn=\"net-1\"]'))");
    ok(document.querySelectorAll("#quiz-pane-fav .learn-item").length === 1, "收藏夹内取消后即时移除");

    /* ============ D. 错题本 ============ */
    console.log("\n-- D. 错题本 --");
    window.eval("switchQuizTab('wrong')");
    ok(!!document.querySelector("#quiz-pane-wrong .vip-lock-pane"), "非 VIP 看到错题本锁页");
    ok(document.querySelector("#quiz-pane-wrong").textContent.includes("VIP 专属"), "锁页含 VIP 引导");

    /* 答错自动收录 */
    window.eval("switchQuizTab('exam')");
    window.eval("startQuiz('sql')");
    const q0 = window.eval("QUIZ_BANK.find(q => q.id === quizState.list[0].id)");
    const wrongIdx = (q0.ans + 1) % 4;
    document.getElementById("quiz-opt-" + wrongIdx).click();
    ok(window.eval("getWrongBook().length") === 1, "答错自动收入错题本");
    ok(window.eval("getWrongBook()[0].id") === q0.id && window.eval("getWrongBook()[0].times") === 1, "错题记录含 id 与错误次数");
    ok(document.querySelector("#quiz-feedback-slot").textContent.includes("已自动收入错题本"), "反馈区提示已收入错题本");
    ok(!!document.querySelector("#quiz-feedback-slot [data-fav-btn]"), "反馈区带收藏按钮");
    /* 统计同步 */
    const st1 = window.eval("getQuizData().stats");
    ok(st1.answers === 1 && st1.correct === 0 && st1.perCat.sql.a === 1, "作答计入学习统计（stats）");
    window.eval("quitQuiz()");

    /* VIP 后错题本可用 */
    window.eval("toggleVipDemo()");
    ok(window.eval("isVip()") === true, "开通 VIP（演示开关）");
    window.eval("switchQuizTab('wrong')");
    ok(!document.querySelector("#quiz-pane-wrong .vip-lock-pane"), "VIP 后错题本解锁");
    ok(document.querySelectorAll("#quiz-pane-wrong .wrong-item").length === 1, "错题本渲染 1 条");
    ok(document.querySelector("#quiz-pane-wrong").textContent.includes("错误"), "错题条目显示错误次数");
    ok(document.querySelectorAll("#quiz-pane-wrong .quiz-chip").length === 2, "筛选 chips：全部 + sql");

    /* 错题练习 */
    window.eval("startWrongPractice()");
    ok(window.eval("quizState.running") === true && window.eval("quizState.mode") === "wrong", "可从错题本开始练习");
    ok(window.eval("quizState.list.length") === 1 && window.eval("quizState.list[0].id") === q0.id, "错题练习只含错题");
    ok(!document.getElementById("quiz-timer"), "错题练习不限时");
    window.eval("quitQuiz()");

    /* 看解析 → 跳转学习分类 */
    window.eval("showWrongQuestion('" + q0.id + "')");
    ok(window.eval("quizLearnCat") === "sql", "看解析跳转到对应分类");
    ok(document.getElementById("quiz-pane-learn").hidden === false, "跳转后切回学习页签");

    /* 移除 */
    window.eval("switchQuizTab('wrong')");
    window.eval("removeWrongItem('" + q0.id + "')");
    ok(window.eval("getWrongBook().length") === 0, "移除后错题本为空");
    ok(!!document.querySelector("#quiz-pane-wrong .quiz-empty"), "空错题本显示空态");

    /* ============ E. 多模式练习 ============ */
    console.log("\n-- E. 多模式练习（顺序 / 章节 / 每日）--");
    window.eval("switchQuizTab('exam')");
    ok(document.querySelectorAll("#quiz-pane-exam .quiz-mode-btn").length === 3, "模式条 3 个模式");
    ok(!!document.querySelector("#quiz-pane-exam .daily-card"), "每日一练卡常驻");
    ok(document.querySelector("#quiz-pane-exam .daily-card").textContent.includes("每日一练"), "每日卡标题");
    ok(!document.querySelector("#quiz-pane-exam .daily-card").classList.contains("done"), "初始未打卡");

    /* 顺序练习：全量、原顺序、不限时 */
    window.eval("switchQuizMode('practice')");
    ok(document.getElementById("quiz-mode-practice").hidden === false && document.getElementById("quiz-mode-exam").hidden === true, "切换到顺序练习模式卡");
    window.eval("startPractice()");
    ok(window.eval("quizState.mode") === "practice", "顺序练习模式");
    ok(window.eval("quizState.list.length") === 24, "VIP 顺序练习覆盖全部 24 题");
    ok(window.eval("quizState.list[0].id") === "sql-1" && window.eval("quizState.list[23].id") === "star-4", "按题库原始顺序出题");
    ok(!document.getElementById("quiz-timer"), "顺序练习无计时器");
    window.eval("quitQuiz()");

    /* 章节练习 */
    window.eval("switchQuizMode('chapter')");
    window.eval("startChapter('network')");
    ok(window.eval("quizState.mode") === "chapter" && window.eval("quizState.cat") === "network", "章节练习模式");
    ok(window.eval("quizState.list.length") === 6 && window.eval("quizState.list[0].id") === "net-1", "章节练习覆盖该分类全部 6 题且保序");
    window.eval("quitQuiz()");

    /* 每日一练：3 题 + 打卡 + 连签 + 当日阻止 */
    window.eval("startDailyPractice()");
    ok(window.eval("quizState.mode") === "daily" && window.eval("quizState.list.length") === 3, "每日一练 3 题");
    for (let i = 0; i < 3; i++) {
      window.eval("answerQuiz(quizState.list[quizState.idx].ans)");
      window.eval("nextQuiz()");
    }
    ok(window.eval("quizState.running") === false, "每日一练完成");
    ok(!!document.querySelector("#quiz-pane-exam .quiz-result"), "完成后展示成绩卡");
    ok(document.querySelector("#quiz-pane-exam .quiz-result").textContent.includes("打卡"), "成绩卡提示打卡成功");
    const daily1 = window.eval("getDaily()");
    ok(daily1.done === true && daily1.streak === 1 && daily1.best === 1, "打卡成功：连签 1 天");
    window.eval("quitQuiz()");
    ok(document.querySelector("#quiz-pane-exam .daily-card").classList.contains("done"), "返回首页后每日卡切换为已打卡态");
    ok(document.querySelector("#quiz-pane-exam .daily-card button").disabled === true, "已打卡后按钮禁用");
    window.eval("startDailyPractice()");
    ok(window.eval("quizState.running") === false, "当日重复开始被阻止");

    /* ============ F. 学习数据看板 ============ */
    console.log("\n-- F. 学习数据看板 --");
    window.eval("switchQuizTab('stats')");
    ok(!!document.querySelector("#quiz-pane-stats .qs-panel-card"), "看板含增强面板");
    ok(document.querySelectorAll("#quiz-pane-stats .daily-stat").length === 3, "每日一练统计卡（连签/最佳/今日）");
    ok(document.querySelectorAll("#quiz-pane-stats .qs-bar-row").length >= 1, "分类掌握度条形图");
    ok(document.querySelector("#quiz-pane-stats").textContent.includes("总正确率"), "汇总卡含总正确率");
    const st2 = window.eval("getQuizData().stats");
    ok(st2.answers === 4 && st2.correct === 3, "统计累计 4 题 / 对 3 题（含每日一练）");

    /* ============ G. AI 小助手 ============ */
    console.log("\n-- G. AI 小助手 --");
    ok(window.eval("llm") === null, "测试环境无 LLM（走 Mock 检索）");
    window.eval("toggleAiAssistant()");
    ok(document.getElementById("ai-assistant-panel").classList.contains("open"), "点击 FAB 打开抽屉");
    ok(document.getElementById("ai-assistant-messages").children.length === 1, "首次打开有欢迎语");
    ok(document.querySelectorAll("#ai-panel-quick .ai-quick-chip").length === 3, "3 个快捷问题 chips");
    ok(document.getElementById("ai-mode-tag").textContent.includes("Mock"), "模式标签显示 Mock");

    /* 预设意图：使用引导 */
    document.getElementById("ai-assistant-input").value = "怎么开始模拟面试";
    window.eval("sendAiAssistant()");
    setTimeout(() => {
      const msgs = document.querySelectorAll("#ai-assistant-messages .ai-msg");
      ok(msgs.length === 3, "用户消息 + 助手回复已上屏");
      ok(msgs[msgs.length - 1].textContent.includes("三步开始模拟面试"), "命中「开始面试」预设引导");
      ok(!!document.querySelector("#ai-assistant-messages .ai-actions button"), "预设回复带跳转操作按钮");

      /* Mock 检索应答 */
      document.getElementById("ai-assistant-input").value = "MySQL 索引";
      window.eval("sendAiAssistant()");
      setTimeout(() => {
        const last = document.querySelectorAll("#ai-assistant-messages .ai-msg");
        const lastMsg = last[last.length - 1];
        ok(lastMsg.textContent.includes("Mock 模式") && lastMsg.textContent.includes("知识库中相关的内容"), "Mock 模式返回检索摘要");
        ok(lastMsg.textContent.includes("B+ 树"), "摘要内容来自知识库命中");

        /* 未知问题 + 无命中（检索器按 2-gram 模糊匹配，用无中文串确保零命中） */
        document.getElementById("ai-assistant-input").value = "qqqqzzzz";
        window.eval("sendAiAssistant()");
        setTimeout(() => {
          const l2 = document.querySelectorAll("#ai-assistant-messages .ai-msg");
          ok(l2[l2.length - 1].textContent.includes("暂未找到"), "无检索结果时诚实说明");

          /* 关闭 */
          window.eval("toggleAiAssistant(false)");
          ok(!document.getElementById("ai-assistant-panel").classList.contains("open"), "可关闭抽屉");

          /* ============ H. CSSOM：移动端顶部导航 ============ */
          console.log("\n-- H. CSSOM：移动端顶部导航 + AI 面板 --");
          const mediaText = [...document.styleSheets].map(s => {
            try {
              return [...s.cssRules].filter(r => r.type === 4).map(r => "@media " + r.conditionText + " {" + r.cssText + "}").join("\n");
            } catch (e) { return ""; }
          }).join("\n").replace(/;\s*/g, ";");
          ok(/@media \(max-width: 900px\) \{\s*\.app-tabbar \{[^}]*position:\s*fixed[^}]*top:\s*58px/.test(mediaText), "移动端 Tab 栏 fixed 定位于顶栏下方（top:58px）");
          ok(/\.tabbar-item \{[^}]*flex-direction:\s*row/.test(mediaText), "移动端 Tab 条目横向排列");
          ok(/\.app-main \{[^}]*padding:\s*108px/.test(mediaText), "主内容区为顶部双栏留位（108px）");
          ok(/\.ai-fab \{[^}]*top:\s*112px/.test(mediaText), "AI 悬浮按钮避开顶部导航（top:112px）");
          const cssText = [...document.styleSheets].map(s => {
            try { return [...s.cssRules].map(r => r.cssText).join("\n"); } catch (e) { return ""; }
          }).join("\n");
          ok(cssText.includes(".ai-panel.open"), "AI 抽屉展开样式");
          ok(/\.quiz-mode-pane\[hidden\]\s*\{\s*display:\s*none/.test(cssText), "模式面板可隐藏");
          ok(cssText.includes(".daily-card"), "每日一练卡样式");
          ok(cssText.includes(".wrong-item"), "错题本条目样式");
          ok(cssText.includes(".qs-bar-fill"), "掌握度条样式");
          ok(/repeat\(9,\s*1fr\)/.test(cssText), "Tab 栏 9 格规则仍在");

          /* ============ I. 游客态 ============ */
          console.log("\n-- I. 游客态 --");
          window.eval("logout()");
          window.eval("backToQuizCats()");
          window.location.hash = "#/quiz";
          setTimeout(() => {
            ok(document.querySelector('.app-page[data-page="quiz"]').classList.contains("active"), "游客可进入题库页");
            ok(document.querySelectorAll("#quiz-pane-learn .quiz-cat-lock").length === 3, "游客态 3 个 VIP 分类上锁");
            ok(window.eval("isVip()") === false, "游客 isVip 为 false");
            window.eval("toggleAiAssistant()");
            ok(document.getElementById("ai-assistant-panel").classList.contains("open"), "游客可用 AI 小助手");
            window.eval("toggleAiAssistant(false)");
            ok(!!document.querySelector("#quiz-pane-wrong .vip-lock-pane"), "游客错题本为锁页");

            ok(errors.length === 0, "全程无脚本错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

            console.log(`\n结果：${pass} 通过，${fail} 失败`);
            process.exit(fail ? 1 : 0);
          }, 250);
        }, 120);
      }, 120);
    }, 120);
  }, 250);
}
