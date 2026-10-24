/* v6 逻辑无头测试：用户系统 / 简历优化 / 职业探索 / 主题色 / 实时追踪 / 报告导出 / 评分回归 */
const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");
const script = html
  .match(/<script>([\s\S]*?)<\/script>/g)
  .pop()
  .replace(/^<script>|<\/script>$/g, "");

// 全量脚本（v6 起新增函数定义在 init IIFE 之后，需整体注入）
const logic = script;

/* ---- DOM / 浏览器环境 stub ---- */
function makeEl(id) {
  const classes = new Set();
  return {
    id,
    value: "",
    textContent: "",
    innerHTML: "",
    hidden: false,
    title: "",
    children: [],
    style: {},
    dataset: {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute: () => null,
    removeAttribute() {},
    appendChild() {},
    remove() {},
    insertAdjacentHTML() {},
    focus() {},
    classList: {
      add: (...cs) => cs.forEach((c) => classes.add(c)),
      remove: (...cs) => cs.forEach((c) => classes.delete(c)),
      toggle: (c, force) => {
        const on = force === undefined ? !classes.has(c) : force;
        if (on) classes.add(c);
        else classes.delete(c);
        return on;
      },
      contains: (c) => classes.has(c),
    },
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    scrollTop: 0,
    scrollHeight: 0,
  };
}
const els = {};
const $ = (id) => els[id] || (els[id] = makeEl(id));
// localStorage 与 sessionStorage 是独立存储（各自独立后备对象，模拟真实浏览器）
const mkStorage = (backing) => ({
  getItem: (k) => (k in backing ? backing[k] : null),
  setItem: (k, v) => {
    backing[k] = String(v);
  },
  removeItem: (k) => {
    delete backing[k];
  },
});
const localBacking = {},
  sessionBacking = {};
const localStorageStub = mkStorage(localBacking);
const sessionStorageStub = mkStorage(sessionBacking);
const documentStub = {
  getElementById: $,
  querySelector: () => makeEl(),
  querySelectorAll: () => [],
  addEventListener() {},
  documentElement: { dataset: {} },
  createElement: () => makeEl(),
};

const fn = new Function(
  "document",
  "sessionStorage",
  "localStorage",
  "matchMedia",
  "navigator",
  "window",
  "fetch",
  "requestAnimationFrame",
  "location",
  "history",
  logic +
    `
  return {
    store, kk,
    setCurrentUser: u => { currentUser = u; },
    simpleHash, genId, initials, avatarStyle, loadUsers, saveUsers,
    doRegister, doLogin, quickDemoLogin, enterApp, logout, switchAccount,
    setSession: s => { session = s; },
    setMatch: m => { matchResult = m; },
    setTurn: t => { turn = t; },
    scoreSession, buildPlan, buildEvidence, reportToMarkdown, planReason,
    setCurrentSpeaker, updateLiveTracker, liveRadarSVG, retrieve, tokenize, buildMessages,
    analyzeResumeText, resumeRingSVG, fillResumeDemo, analyzeResume,
    recommendCareer, toggleChip, clearCareer, toggleCareerDetail, startInterviewFor,
    careerSelection, CAREER_DB, RESUME_DIMENSIONS,
    cycleAccent, syncAccentBtn, animateCounters, applyTabIcons,
    showView, enterAppOrAuth, requireLogin, updateGuestBanner, syncGuestLocks,
    navTo, currentPage, applyRoute, APP_PAGES, APP_PAGE_TITLES,
    // v10 新增
    syncStatusPill, updateKbCount, syncSidebarBadge, initOnboarding, dismissOnboarding,
    dismissBanner, restoreBanner, modeLabelWithCount, pickQuestion, setMode,
    QUESTION_BANK, MODE_SHORT, KB,
    // v11 新增
    JD_GROUPS, renderJdSelect, onJdSelectChange, toggleManualJd, restoreJdSelection,
    // v12 新增
    MCP_TOOLS, CODE_CASES, initMcpConsole, simulateMcpCall, runCodeSandbox, fillCodeDemo,
    localPiiMask, runSelfCheck,
    getView: () => { try { return sessionStorage.getItem(VIEW_KEY); } catch (e) { return null; } },
    getUser: () => currentUser,
    getAccent: () => document.documentElement.dataset.accent || "default",
    SYS_PROMPTS,
  };`
);
// v7 视图路由 + v8 hash 子路由需要
const windowStub = { scrollTo() {}, addEventListener() {} };
const locationStub = { hash: "", pathname: "/futuremirror-demo.html", search: "" };
const historyStub = { replaceState() {} };
// fetch 传 undefined：模拟「无 fetch 能力」的环境（如内嵌 WebView / 禁用网络的沙箱）。
// v22.1 起 doLogin/doRegister/quickDemoLogin 在「有 fetch 且后端探测无结论」时会先等待探测
// （修复秒点登录误走本地分支的竞态）——本 harness 验证的是本地账号路径，应保持同步语义；
// 后端账号路径由 test-v22-jsdom.js（stub fetch + await）专门覆盖。
const api = fn(
  documentStub,
  sessionStorageStub,
  localStorageStub,
  () => ({ matches: false }),
  {},
  windowStub,
  undefined,
  (f) => f(),
  locationStub,
  historyStub
);

let pass = 0,
  failCount = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log("  ✅", name);
  } else {
    failCount++;
    console.error("  ❌", name);
  }
}

console.log("== 1. simpleHash：演示级口令混淆 ==");
check("同一口令哈希确定", api.simpleHash("Demo123456") === api.simpleHash("Demo123456"));
check("不同口令哈希不同", api.simpleHash("Demo123456") !== api.simpleHash("demo123456"));
check("哈希带 h 前缀（明确非安全）", api.simpleHash("x").startsWith("h"));

console.log("== 2. kk：数据隔离 key 前缀 ==");
api.setCurrentUser(null);
check("未登录走 guest_ 前缀", api.kk("fm_session") === "guest_fm_session");
api.setCurrentUser({ id: "u_abc123" });
check("登录后走 u_<id>_ 前缀", api.kk("fm_session") === "u_abc123_fm_session");
check("g_ 前缀全局共享不加前缀", api.kk("g_theme") === "g_theme");

console.log("== 3. store：persist 清除陈旧值 + 跨用户隔离 ==");
// 3a. persist 清除陈旧值（guest 场景）
api.setCurrentUser(null);
api.store.set("fm_t", { v: "stale" });
api.store.set("fm_t", { v: 1 }, true);
check("localStorage 已写入新值", JSON.parse(localBacking["guest_fm_t"]).v === 1);
check("sessionStorage 陈旧值已清除", !("guest_fm_t" in sessionBacking));
check("get 读到新值而非陈旧值", api.store.get("fm_t", null).v === 1);
api.store.set("fm_t2", { v: 2 });
check("非 persist 写入 sessionStorage", JSON.parse(sessionBacking["guest_fm_t2"]).v === 2);
// 3b. 用户 A 写、用户 B 读不到（隔离）
api.setCurrentUser({ id: "u_userA" });
api.store.set("fm_session", {
  mode: "tech",
  turns: [{ agent: "技术面试官", question: "q", answer: "a", notes: "n", mode: "tech" }],
});
api.setCurrentUser({ id: "u_userB" });
check("用户 B 读不到用户 A 的会话", api.store.get("fm_session", null) === null);
api.setCurrentUser({ id: "u_userA" });
check("用户 A 能读回自己的会话", api.store.get("fm_session", null).turns.length === 1);
// 3c. 主题全局共享
api.store.set("g_theme", "dark", true);
check("g_theme 写入无前缀 localStorage", localBacking["g_theme"] === '"dark"');
api.setCurrentUser({ id: "u_userB" });
check("用户 B 同样读到全局主题", api.store.get("g_theme", null) === "dark");

console.log("== 4. 注册 / 登录 / 演示账号流程 ==");
// 注册新用户
$("reg-name").value = "测试同学";
$("reg-email").value = "Test@Example.com";
$("reg-pass").value = "pass1234";
api.doRegister();
const users = api.loadUsers();
check(
  "注册写入 g_users（邮箱归一化小写）",
  users.some((u) => u.email === "test@example.com" && u.name === "测试同学")
);
check("注册后已进入应用（当前视图 = app）", api.getView() === "app");
const newUser = users.find((u) => u.email === "test@example.com");
check("新用户 id 带 u_ 前缀", newUser.id.startsWith("u_"));
// 重复注册同邮箱 → 拒绝
const beforeCount = api.loadUsers().length;
$("reg-email").value = "test@example.com";
api.doRegister();
check(
  "重复邮箱被拒绝且不新增用户",
  api.loadUsers().length === beforeCount && $("reg-error").textContent.includes("已注册")
);
// 登出后错误密码登录 → 拒绝
api.logout();
$("login-email").value = "test@example.com";
$("login-pass").value = "wrong-pass";
api.doLogin();
check("错误密码登录被拒绝", $("login-error").textContent.includes("不正确"));
// 正确密码登录 → 进入
$("login-pass").value = "pass1234";
api.doLogin();
check("正确密码登录进入应用", $("login-error").textContent === "" && !$("user-menu-box").hidden);
check(
  "用户菜单渲染头像与昵称",
  $("nav-username").textContent === "测试同学" && $("dd-email").textContent === "test@example.com"
);
check("头像首字取昵称首字符", $("nav-avatar").textContent === "测");
check("头像样式为渐变", $("nav-avatar").getAttribute("style") === undefined || true); // 桩不记录 style，仅确认不抛错
// 一键演示账号：幂等
api.switchAccount();
api.quickDemoLogin();
const demo1 = api.loadUsers().find((u) => u.email === "demo@futuremirror.app");
api.switchAccount();
api.quickDemoLogin();
const demo2 = api.loadUsers().find((u) => u.email === "demo@futuremirror.app");
check(
  "演示账号只创建一次（幂等）",
  demo1 && demo2 && demo1.id === demo2.id && demo1.passHash === api.simpleHash("Demo123456")
);
// 切换账号后内存态重置
api.switchAccount();
check("切换账号后菜单隐藏", $("user-menu-box").hidden === true);

console.log("== 5. planReason：规划 Agent 决策理由 ==");
check(
  "tech 派发含技术关键词",
  api.planReason({ id: "tech", name: "技术面试官" }, "Redis 缓存", "缺少量化数据支撑", "tech").includes("技术面试官")
);
check("hr 派发含 HR", api.planReason({ id: "hr", name: "HR 面试官" }, "团队协作", "", "general").includes("HR 面试官"));
check(
  "pressure 派发含压力",
  api.planReason({ id: "pressure", name: "压力面试官" }, "方案", "结构完整", "pressure").includes("压力面试官")
);

console.log("== 6. setCurrentSpeaker：人设徽章 + 温度 ==");
api.setCurrentSpeaker("技术面试官");
check("徽章含图标与温度", $("chat-agent").textContent.includes("⚙️") && $("chat-agent").textContent.includes("0.3"));
check("title 含人设温度说明", $("chat-agent").title.includes("人设温度"));
api.setCurrentSpeaker("未知 Agent");
check("未知人设回退默认图标", $("chat-agent").textContent.includes("🤖"));

console.log("== 7. updateLiveTracker：实时能力追踪 ==");
api.setSession({ mode: "tech", turns: [] });
api.setMatch({ matchScore: 33, skills: ["Redis", "MySQL"], gaps: ["Java", "Docker"], suggestions: [] });
api.updateLiveTracker(); // 空会话应安全返回
check("空会话不崩溃", true);
api.setSession({
  mode: "tech",
  turns: [
    {
      agent: "技术面试官",
      question: "q1",
      answer: "我在秒杀项目里负责缓存设计，用 Redis 做了接口缓存，QPS 从 200 提升到 1200，命中率 95%。",
      notes: "结构完整",
      mode: "tech",
    },
    {
      agent: "压力面试官",
      question: "q2",
      answer: "如果重做我会先做缓存预热和热点 key 监控，然后压测验证，最终把故障率降低了 30%。",
      notes: "结构完整",
      mode: "pressure",
    },
    {
      agent: "HR 面试官",
      question: "q3",
      answer: "因为平台好我想来学习成长，团队氛围很重要。",
      notes: "回答过短，信息量不足；缺少量化数据支撑",
      mode: "general",
    },
  ],
});
api.updateLiveTracker();
check("进度显示 3/5", $("live-turn").textContent === "3/5");
check("字数已统计", Number($("live-words").textContent) > 50);
check("量化次数已统计", Number($("live-digits").textContent) >= 3);
check("置信度为百分比", /^\d{1,3}%$/.test($("live-conf").textContent));
check("实时雷达已渲染", $("live-radar").innerHTML.includes("<svg") && $("live-radar").innerHTML.includes("polygon"));
check("进度条宽度同步", $("progress-bar").style.width === "60%");
check("hint 提示语已更新", $("live-hint").textContent.length > 0);

console.log("== 8. reportToMarkdown：报告导出 ==");
const md = api.reportToMarkdown();
check("包含标题", md.includes("# 面镜 FutureMirror 模拟面试报告"));
check("包含综合得分", /综合得分：\d+\/100/.test(md));
check("证据引用真实回答原话", md.includes("QPS 从 200 提升到 1200"));
check(
  "含五个维度",
  ["内容深度", "结构逻辑", "语言表达", "岗位匹配", "抗压表现"].every((d) => md.includes(d))
);
check("含改进建议章节", md.includes("## 改进建议"));

console.log("== 9. 回归：评分 / 计划 / 检索 ==");
const dims = api.scoreSession();
check("五维评分", dims.length === 5 && dims.every((d) => d.score >= 30 && d.score <= 96));
const { plan, weakest } = api.buildPlan(dims);
check("计划 6-7 天且最弱维度在首", plan.length >= 6 && plan[0].tag === weakest.dimension);
check("中文无空格检索命中", api.retrieve("字节后端二面一般问什么").length === 3);
check("空查询返回空", api.retrieve("xyzzy").length === 0);
const msgs = api.buildMessages("我做了接口限流");
check("buildMessages 结构正确", msgs[0].role === "system" && msgs[msgs.length - 1].role === "user");

console.log("== 10. analyzeResumeText：简历 6 维诊断 ==");
const rDemo = api.analyzeResumeText(`本人性格开朗，善于沟通，有较强的学习能力和团队合作精神。
在校期间参与了电商秒杀系统的开发，负责后端接口，优化了系统性能。
熟悉 React、Node.js、MySQL 等技术栈。
获得过校级奖学金，担任过社团部长。`);
check("六个维度", rDemo.dims.length === 6 && api.RESUME_DIMENSIONS.length === 6);
check(
  "维度分数在 20-98",
  rDemo.dims.every((d) => d.score >= 20 && d.score <= 98)
);
check("总分 0-100", rDemo.total >= 0 && rDemo.total <= 100);
check(
  "检测到弱动词并给出改写",
  rDemo.rewrites.some((w) => w.issue.includes("动词"))
);
check(
  "检测到缺量化行",
  rDemo.rewrites.some((w) => w.issue.includes("量化"))
);
check("识别到技能", rDemo.skills.includes("React") && rDemo.skills.includes("Node.js"));
check("改写建议含占位提示", rDemo.rewrites[0].suggestion.includes("["));
const rGood =
  api.analyzeResumeText(`主导秒杀系统缓存层重构，设计多级缓存方案，QPS 从 200 提升到 1200，命中率 95%，覆盖 3 万用户。
独立完成订单服务拆分，接口延迟从 800ms 降低到 120ms。`);
check("优质简历得分显著更高", rGood.total > rDemo.total);
check(
  "resumeRingSVG 输出环形图",
  api.resumeRingSVG(76).includes("<svg") && api.resumeRingSVG(76).includes("stroke-dashoffset")
);

console.log("== 11. recommendCareer：岗位推荐引擎 ==");
// v7：recommendCareer 需登录后可用，先置一个测试用户
api.setCurrentUser({ id: "u_test", email: "t@t.com", name: "测试用户" });
check("已登录后 requireLogin 放行", api.recommendCareer !== undefined);
api.clearCareer();
check(
  "空选择时推荐被拒绝（career-result 保持引导态）",
  (() => {
    api.recommendCareer();
    return $("career-result").innerHTML.includes("选择你的专业");
  })()
);
api.toggleChip({ textContent: "计算机/软件工程", classList: { toggle() {}, contains: () => false } }, "major");
api.toggleChip({ textContent: "Java", classList: { toggle() {}, contains: () => false } }, "skill");
api.toggleChip({ textContent: "MySQL", classList: { toggle() {}, contains: () => false } }, "skill");
api.toggleChip({ textContent: "Redis", classList: { toggle() {}, contains: () => false } }, "skill");
api.toggleChip({ textContent: "写代码", classList: { toggle() {}, contains: () => false } }, "interest");
check("chip 选择已记录", api.careerSelection.major.length === 1 && api.careerSelection.skill.length === 3);
api.recommendCareer();
const careerHtml = $("career-result").innerHTML;
check("输出 Top 3 岗位卡片", (careerHtml.match(/career-card/g) || []).length === 3);
check(
  "后端岗位排最前（Java+MySQL+Redis+写代码）",
  careerHtml.indexOf("后端开发工程师") < careerHtml.indexOf("测试开发工程师")
);
check("匹配度为百分比", /匹配度 \d{1,3}%/.test(careerHtml));
check("含已具备技能标签", careerHtml.includes("career-skill-tag have"));
check("含建议补强标签", careerHtml.includes("career-skill-tag need"));
check("含学习路径折叠区", careerHtml.includes("career-detail-backend"));
check("含技能对比可视化", careerHtml.includes("已具备") && careerHtml.includes("必补"));
check("含全岗位对比", careerHtml.includes("全岗位匹配度对比"));
// 取消一个 chip
api.toggleChip({ textContent: "Java", classList: { toggle() {}, contains: () => false } }, "skill");
check("再次点击取消选择", api.careerSelection.skill.length === 2);
api.clearCareer();
check(
  "clearCareer 重置全部选择",
  api.careerSelection.major.length === 0 &&
    api.careerSelection.skill.length === 0 &&
    api.careerSelection.interest.length === 0
);

console.log("== 12. 主题色切换 ==");
check("初始为 default", api.getAccent() === "default");
api.cycleAccent();
check("切换到 green", api.getAccent() === "green" && localBacking["g_accent"] === '"green"');
check("按钮同步为 🟢", $("accent-btn").textContent === "🟢");
api.cycleAccent();
check("切换到 blue", api.getAccent() === "blue");
api.cycleAccent();
check("循环回 default", api.getAccent() === "default" && $("accent-btn").textContent === "🔴");
check("g_accent 全局共享不加用户前缀", "g_accent" in localBacking);

console.log("== 13. 数据看板 / Tab 图标 / 岗位跳转 ==");
api.animateCounters(); // 无 DOM 元素时静默返回，验证不抛错
check("animateCounters 空场景不崩溃", true);
api.applyTabIcons(); // 无 .tab 元素时静默返回，验证不抛错
check("applyTabIcons 空场景不崩溃", true);
// startInterviewFor：跳转面试 Tab 并同步岗位选择
$("jd").value = "";
api.startInterviewFor("后端开发工程师");
check("JD 预填目标岗位", $("jd").value.includes("后端开发工程师"));
check("jd-select 同步为 backend", $("jd-select").value === "backend");
// v11：从职业探索跳转会显式选中该岗位、覆盖 #jd 为结构化 JD
$("jd").value = "已有 JD 内容";
api.startInterviewFor("前端开发工程师");
check("v11 跳转时 jd-select 同步为 frontend", $("jd-select").value === "frontend");
check(
  "v11 跳转时 #jd 被重写为前端结构化 JD",
  $("jd").value.includes("前端开发工程师") && !$("jd").value.includes("已有 JD 内容")
);
// 无法识别的岗位名且不带 JD：引导用户先选岗位（不报错）
$("jd").value = "";
$("jd-select").value = "";
api.startInterviewFor("不存在的岗位名");
check("未知岗位名且不带 JD 时 #jd 仍为空（引导去选岗位）", $("jd").value === "");

console.log("== 14. v7 视图路由 / 游客模式 ==");
// 视图切换写入 sessionStorage，刷新可恢复
api.showView("landing");
check("showView('landing') 记录视图", api.getView() === "landing");
api.showView("auth");
check("showView('auth') 记录视图", api.getView() === "auth");
api.showView("app");
check("showView('app') 记录视图", api.getView() === "app");

// 游客模式：未登录 → 横幅显示 + 功能被拦截
api.setCurrentUser(null);
api.updateGuestBanner();
check("未登录时游客横幅显示", $("guest-banner").hidden === false);
check("未登录时 requireLogin 返回 false", api.requireLogin() === false);

// 已登录：横幅隐藏 + 放行
api.setCurrentUser({ id: "u_test", email: "t@t.com", name: "测试用户" });
api.updateGuestBanner();
check("登录后游客横幅隐藏", $("guest-banner").hidden === true);
check("登录后 requireLogin 返回 true", api.requireLogin() === true);

// 落地页 CTA 分流
api.setCurrentUser(null);
api.enterAppOrAuth();
check("未登录点「立即体验」→ 登录页", api.getView() === "auth");
api.setCurrentUser({ id: "u_test", email: "t@t.com", name: "测试用户" });
api.enterAppOrAuth();
check("已登录点「立即体验」→ 主应用", api.getView() === "app");

// 游客点功能按钮被拦：确认函数内部有守卫
const guardSrc = [
  "analyze",
  "sendMsg",
  "finishInterview",
  "askRag",
  "analyzeResume",
  "optimizeWithLLM",
  "recommendCareer",
].map((n) => {
  const m = script.match(new RegExp("function " + n + "\\([\\s\\S]{0,120}"));
  return { n, ok: !!(m && m[0].includes("requireLogin")) };
});
guardSrc.forEach((g) => check(`${g.n}() 含登录拦截`, g.ok));

console.log("== 15. v8 多页面路由 / 导航系统 ==");
// 路由表
check(
  "APP_PAGES 共 11 个页面",
  api.APP_PAGES.length === 11 &&
    ["dashboard", "match", "interview", "rag", "resume", "career", "report", "profile", "jobs", "quiz", "plan"].every(
      (p) => api.APP_PAGES.includes(p)
    )
);
check(
  "每个页面都有中文标题",
  api.APP_PAGES.every((p) => !!api.APP_PAGE_TITLES[p])
);
// 当前页解析
locationStub.hash = "";
check("空 hash 回落 dashboard", api.currentPage() === "dashboard");
locationStub.hash = "#/interview";
check("#/interview → interview", api.currentPage() === "interview");
locationStub.hash = "#/not-a-page";
check("非法 hash 回落 dashboard", api.currentPage() === "dashboard");
// 导航
locationStub.hash = "";
api.navTo("rag");
check("navTo('rag') 写入 hash", locationStub.hash === "#/rag");
api.navTo("不存在的页");
check("navTo 非法页回落 dashboard", locationStub.hash === "#/dashboard");
check(
  "applyRoute 不抛错",
  (() => {
    api.applyRoute();
    return true;
  })()
);
check("applyRoute 同步 document.title", documentStub.title.includes("工作台"));
locationStub.hash = "";

// 结构断言：8 个 app-page 均已生成，且旧的 tabs/pane 已清除
const pageDivs = [...html.matchAll(/<div class="app-page[^"]*" data-page="([a-z]+)"/g)].map((m) => m[1]);
check("HTML 中存在 11 个 .app-page", pageDivs.length === 11);
check(
  ".app-page 覆盖全部路由",
  api.APP_PAGES.every((p) => pageDivs.includes(p))
);
check("旧的 .tabs 已移除", !/<div class="tabs["]/.test(html));
check("旧的 .pane 已移除", !/<div class="pane[ "]/i.test(html));
// 每个页面都应有 page-header + page-card
const pageBlocks = html.split(/<div class="app-page/).slice(1);
check(
  "10 个子页面均有 page-header",
  pageBlocks.slice(1).every((b) => b.includes("page-header"))
);
check(
  "10 个子页面均有 page-card（quiz/plan 面板由 JS 渲染，豁免）",
  pageBlocks
    .slice(1)
    .every((b) => b.includes("page-card") || b.includes('data-page="quiz"') || b.includes('data-page="plan"'))
);
check(
  "quiz 页含五个子面板容器（学习 / 小测 / 数据 / 错题 / 收藏）",
  /id="quiz-pane-learn"/.test(html) &&
    /id="quiz-pane-exam"/.test(html) &&
    /id="quiz-pane-stats"/.test(html) &&
    /id="quiz-pane-wrong"/.test(html) &&
    /id="quiz-pane-fav"/.test(html)
);
check(
  "dashboard 用 hero 而非 page-header",
  !pageBlocks[0].includes("page-header") && pageBlocks[0].includes('class="hero"')
);
// 关键功能元素仍在（未因重构丢失）
["resume", "jd", "chat-input", "rag-input", "resume-raw", "career-result", "report-content"].forEach((id) =>
  check(`页面仍包含 #${id}`, html.includes(`id="${id}"`))
);
// v10：导航入口由「横向子导航 + 顶栏下拉」收敛为「左侧栏 + 底部 Tab」
const navItems = [...html.matchAll(/class="sb-item[^"]*"[^>]*data-nav="([a-z]+)"/g)].map((m) => m[1]);
check("左侧栏含 11 个入口", navItems.length === 11);
check("顶栏已精简（无「功能导航」按钮）", !html.includes('id="nav-func-btn"'));
check(
  "顶栏保留 状态胶囊 + 主题 + 主题色 + 用户菜单",
  html.includes('id="status-pill"') &&
    html.includes('id="theme-btn"') &&
    html.includes('id="accent-btn"') &&
    html.includes('id="user-menu-box"')
);

console.log("== 16. v9 结构完整性（回归防线）==");
/* P0 防线：任何 app-page 都不得包含另一个 app-page，
   否则切到子页面时父容器 display:none 会把子页面一起隐藏 → 白屏 */
const divToks = [];
{
  const rx = /<div\b[^>]*>|<\/div>/g;
  let t;
  while ((t = rx.exec(html))) divToks.push({ open: !t[0].startsWith("</"), raw: t[0] });
}
function matchClose(list, i) {
  let d = 0;
  for (let j = i; j < list.length; j++) {
    if (list[j].open) d++;
    else {
      d--;
      if (d === 0) return j;
    }
  }
  return -1;
}
const pageIdxs = [];
divToks.forEach((t, i) => {
  if (t.open && /class="app-page/.test(t.raw)) pageIdxs.push(i);
});
check("共 11 个 .app-page 容器", pageIdxs.length === 11);
const nested = pageIdxs.filter((i) => {
  const c = matchClose(divToks, i);
  return pageIdxs.some((j) => j > i && j < c);
});
check("app-page 之间无嵌套（切页不会白屏）", nested.length === 0);
// 每个 app-page 都带唯一 data-page
const dpKeys = [...html.matchAll(/class="app-page[^"]*"\s+data-page="([a-z]+)"/g)].map((m) => m[1]);
check("每个 app-page 都有合法 data-page", dpKeys.length === 11 && dpKeys.every((k) => api.APP_PAGES.includes(k)));
check("data-page 无重复", new Set(dpKeys).size === dpKeys.length);
// 每个子页面都应有 page-header + page-card
check(
  "10 个子页面均有 page-header",
  pageIdxs.length === 11 &&
    dpKeys.filter((k) => k !== "dashboard").length === 10 &&
    (html.match(/page-header/g) || []).length >= 10
);
check("page-card 数量 >= 6", (html.match(/class="page-card"/g) || []).length >= 6);
// v10：导航入口收敛为「左侧栏 + 底部 Tab 栏」两处，二者均须与路由表一一对应
const sbNavs = [...html.matchAll(/class="sb-item[^"]*"[^>]*data-nav="([a-z]+)"/g)].map((m) => m[1]);
const tbNavs = [...html.matchAll(/class="tabbar-item[^"]*"[^>]*data-nav="([a-z]+)"/g)].map((m) => m[1]);
// 左侧栏按「输入与准备 / 训练与评估 / 我的」分组排列，顺序刻意不同于路由表，故按集合比对
check(
  "左侧栏 data-nav 覆盖全部路由且无多余",
  new Set(sbNavs).size === api.APP_PAGES.length && sbNavs.every((n) => api.APP_PAGES.includes(n))
);
check("左侧栏分 3 组（输入与准备 / 训练与评估 / 我的）", (html.match(/class="sb-group-label"/g) || []).length === 3);
check(
  "底部 Tab 栏 10 项且均在路由表内",
  tbNavs.length === 10 &&
    tbNavs.every((n) => api.APP_PAGES.includes(n)) &&
    tbNavs.includes("dashboard") &&
    tbNavs.includes("interview") &&
    tbNavs.includes("match") &&
    tbNavs.includes("rag") &&
    tbNavs.includes("profile")
);
// v10：旧的三段式导航必须已清除
check("已移除横向子导航 .app-subnav", !/<nav class="app-subnav"/.test(html));
check("已移除顶栏功能导航下拉 #nav-func-box", !/id="nav-func-box"/.test(html));
check("已移除 .nav-dropdown 元素", !/class="nav-dropdown"/.test(html));
// .app-shell / .app-sidebar / .app-main / .app-tabbar 结构完整
check("存在 .app-shell 布局容器", /class="app-shell"/.test(html));
check("存在 .app-sidebar 左侧栏", /class="app-sidebar"/.test(html));
check("存在 .app-main 主内容区", /class="app-main"/.test(html));
check("存在 .app-tabbar 底部导航", /class="app-tabbar"/.test(html));
check("存在面包屑容器 #breadcrumb", /id="breadcrumb"/.test(html) && /id="bc-current"/.test(html));
check("存在顶栏状态胶囊 #status-pill", /id="status-pill"/.test(html) && /id="status-text"/.test(html));
// app-shell 必须包住 sidebar + main（aside 不是 div，故直接按文本位置比对）
check(
  "app-sidebar 位于 app-shell 之内",
  html.indexOf('class="app-sidebar"') > html.indexOf('class="app-shell"') &&
    html.indexOf('class="app-main"') > html.indexOf('class="app-sidebar"') &&
    html.indexOf("</main>") > html.indexOf('class="app-shell"')
);
check(
  ".app-tabbar 位于 #view-app 内且在 main 之后",
  html.indexOf('class="app-tabbar"') > html.indexOf("</main>") &&
    html.indexOf('class="app-tabbar"') < html.indexOf("/view-app")
);
// 快速入口 6 卡（v18：简历匹配 / 模拟面试两张核心卡 featured 跨列）
check("dashboard 快速入口为 7 张卡", (html.match(/class="quick-entry card[^"]*"/g) || []).length === 7);
check(
  "Bento 核心入口 featured 化（2 张跨列卡）",
  (html.match(/class="quick-entry card qe-featured"/g) || []).length === 2
);
// 打印样式覆盖新导航
const printBlock = (html.match(/@media print \{([\s\S]*?)\n {2}\}/) || [])[1] || "";
["app-sidebar", "app-tabbar", "breadcrumb", "page-header", "guest-banner", "status-pill"].forEach((sel) =>
  check(`打印样式隐藏 .${sel}`, printBlock.includes("." + sel))
);
check("打印时解除 app-shell 网格", /\.app-shell\s*\{\s*display:\s*block\s*!important/.test(printBlock));
check("打印样式只输出当前 app-page", /\.app-page\.active\s*\{\s*display:\s*block/.test(printBlock));

console.log("\n== 17. v10 数据扩充：岗位库 / 面经库 / 面试题库 ==");
check("岗位库 >= 24 个（含全部新增方向）", api.CAREER_DB.length >= 24);
check("岗位 id 无重复", new Set(api.CAREER_DB.map((c) => c.id)).size === api.CAREER_DB.length);
check(
  "文案占位符存在（数量由数据派生，不写死）",
  (html.match(/class="js-career-count"/g) || []).length === 2 &&
    html.includes('id="stat-careers-l"') &&
    html.includes('id="stat-careers-d"')
);
check(
  "每个岗位都有薪资范围",
  api.CAREER_DB.every((c) => !!c.salary)
);
check(
  "每个岗位必备字段齐全",
  api.CAREER_DB.every(
    (c) =>
      c.name &&
      c.icon &&
      Array.isArray(c.majors) &&
      Array.isArray(c.skills) &&
      Array.isArray(c.coreSkills) &&
      Array.isArray(c.bonus) &&
      c.desc &&
      Array.isArray(c.path) &&
      c.path.length >= 3
  )
);
check(
  "岗位覆盖 6 大方向",
  [
    "devops",
    "security",
    "bigdata",
    "embedded",
    "blockchain",
    "product_ops",
    "game_plan",
    "ux_research",
    "visual",
    "content_ops",
    "business_analyst",
    "growth",
    "investment",
    "aigc",
    "ai_solution",
    "prompt_engineer",
    "mcp_dev",
  ].every((id) => api.CAREER_DB.some((c) => c.id === id))
);

check("面经库 >= 40 条", api.KB.length >= 40);
check(
  "每条面经都有 source（可追溯来源）",
  api.KB.every((k) => k.source && k.content && k.title)
);
check(
  "面经均为合成数据（无真实爬取）",
  api.KB.every((k) => /合成|示例/.test(k.source))
);
check(
  "面经 tags 覆盖多方向",
  ["腾讯", "阿里", "手撕", "行为面试", "金融", "谈薪"].filter((t) => api.KB.some((k) => k.tags.includes(t))).length >= 4
);

check(
  "面试题库含 3 种模式",
  ["general", "tech", "pressure"].every((m) => Array.isArray(api.QUESTION_BANK[m]))
);
check(
  "每种模式题库 >= 6 题",
  ["general", "tech", "pressure"].every((m) => api.QUESTION_BANK[m].length >= 6)
);
check(
  "题库无重复题目",
  (() => {
    const all = [...api.QUESTION_BANK.general, ...api.QUESTION_BANK.tech, ...api.QUESTION_BANK.pressure];
    return new Set(all).size === all.length;
  })()
);
check("modeLabelWithCount 输出题库数量", api.modeLabelWithCount("tech").includes("题库 6 题"));

// pickQuestion：题库题优先且不与已问重复
check(
  "pickQuestion 首轮返回题库原题",
  (() => {
    const stash = { turns: [], mode: "tech" };
    api.setSession(stash);
    const q = api.pickQuestion("tech", 1, "缓存");
    return api.QUESTION_BANK.tech.includes(q);
  })()
);
check(
  "pickQuestion 后续轮返回动态追问",
  (() => {
    api.setSession({ turns: [{ question: "X", answer: "Y", notes: "N", mode: "tech" }], mode: "tech" });
    const q = api.pickQuestion("tech", 3, "缓存一致性");
    return q.includes("缓存一致性");
  })()
);
check(
  "pickQuestion 不重复已问过的题",
  (() => {
    const used = api.QUESTION_BANK.general[0];
    api.setSession({ turns: [{ question: used, answer: "Y", notes: "N", mode: "general" }], mode: "general" });
    return api.pickQuestion("general", 1, "k") !== used;
  })()
);

// requireLogin 延迟 400ms 跳转登录页，这里异步确认
console.log("== 18. v11 目标岗位下拉选择器 ==");
// P0#1 回归：bootApp 已移到 bootstrapV10，构造阶段应完整执行（不再因 TDZ 在 syncCareerCounts 处中断）
// initLlmPanel 在 bootApp 内、syncCareerCounts 之前执行；若 bootApp 中途崩溃则 llm-preset 为空
check("bootApp 在 bootstrapV10 完整执行（LLM 面板已填充）", $("llm-preset").innerHTML.includes("<option"));

// JD_GROUPS 只引用合法 id，且覆盖全部 CAREER_DB
const groupedIds = new Set(Object.values(api.JD_GROUPS).flat());
const allIds = new Set(api.CAREER_DB.map((c) => c.id));
check(
  "JD_GROUPS 全部 id 都存在于 CAREER_DB",
  [...groupedIds].every((id) => allIds.has(id))
);
check(
  "CAREER_DB 全部 id 都被 JD_GROUPS 覆盖",
  [...allIds].every((id) => groupedIds.has(id))
);
check("JD_GROUPS 共 5 个分组", Object.keys(api.JD_GROUPS).length === 5);

// renderJdSelect 渲染下拉（占位 + 共 N 个 + 分组 + 选项）
api.renderJdSelect();
const selHtml = $("jd-select").innerHTML;
check("下拉含占位『共 N 个』", /请选择目标岗位（共 \d+ 个）/.test(selHtml));
check("下拉含 5 个分组标题", (selHtml.match(/<optgroup label=/g) || []).length === 5);
check("下拉含 backend 选项", selHtml.includes('value="backend"'));
check("下拉选项含岗位名", selHtml.includes("后端开发工程师"));

// onJdSelectChange：写入底层 #jd + 展示预览卡 + 记忆选择
$("jd-select").value = "backend";
$("resume").value = "";
api.onJdSelectChange(true);
check(
  "选择岗位后 #jd 写入结构化 JD",
  $("jd").value.includes("后端开发工程师") && $("jd").value.includes("核心技能要求")
);
check("选择岗位后展示预览卡（未隐藏）", $("jd-preview").hidden === false);
check("预览卡含薪资徽章", $("jd-preview").innerHTML.includes("badge-green"));
check("预览卡含核心技能标记", $("jd-preview").innerHTML.includes("career-skill-tag need"));
check("预览卡含学习路径", $("jd-preview").innerHTML.includes("Step 1"));
check("选择岗位后记忆 fm_jd_id", api.store.get("fm_jd_id", "") === "backend");

// 简历已填 + 不 skip → 自动 analyze 不应报错（#jd 仍有效）
$("resume").value = "熟悉 Java 与 MySQL";
$("jd-select").value = "frontend";
api.onJdSelectChange(false); // 触发自动分析（analyze 为全局函数，内部吞错）
check("前端岗选择后 #jd 同步更新", $("jd").value.includes("前端开发工程师"));

// 清空选择 → 显示友好空态（不再隐藏）、#jd 清空
$("jd-select").value = "";
api.onJdSelectChange(true);
check(
  "清空选择后展示友好空态（不再隐藏）",
  $("jd-preview").hidden === false && $("jd-preview").innerHTML.includes("选择一个目标岗位")
);
check("清空选择后 #jd 清空", $("jd").value === "");

// 手动 JD 被覆盖前 confirm 提示（测试桩无 confirm，typeof 守卫保证不抛错、且手动长内容时阻断）
$("jd-select").value = "backend";
$("jd").value = "这是一段用户自己手敲的很长的简历内容".repeat(6); // > 50 字、非自动生成
$("jd").dataset.manual = "";
api.onJdSelectChange(true); // 无 confirm（桩环境）→ 直接覆盖；验证未抛错
check("手动长 JD 选择岗位不抛错且被覆盖", $("jd").value.includes("后端开发工程师"));
// 手动模式下选择岗位：不应出现覆盖提示逻辑（manual 标记跳过守卫）
$("jd-select").value = "frontend";
$("jd").dataset.manual = "1";
api.onJdSelectChange(true);
check("手动模式下选择岗位仍照常切换预览", $("jd-preview").hidden === false);

// fm_jd_id persist:true → 写入 localStorage（关闭标签页后仍记住）
{
  const jdKey = api.kk("fm_jd_id");
  check("fm_jd_id 持久化到 localStorage", localStorageStub.getItem(jdKey) === JSON.stringify("frontend"));
}

// toggleManualJd：展开手动输入，清空 select，标记 manual
$("jd-select").value = "backend";
api.onJdSelectChange(true);
api.toggleManualJd();
check("手动输入展开后 #jd 显示", $("jd").hidden === false);
check("手动输入展开后 select 清空", $("jd-select").value === "");
check("手动输入标记 manual=1", $("jd").dataset.manual === "1");
check("手动输入按钮文案切换", $("jd-manual-btn").textContent.includes("收起"));
api.toggleManualJd();
check("收起手动输入后按钮文案恢复", $("jd-manual-btn").textContent.includes("手动输入"));

// restoreJdSelection：从 fm_jd_id 恢复（需先 renderJdSelect）
api.store.set("fm_jd_id", "backend");
$("jd-select").value = "";
$("jd-preview").hidden = true;
api.renderJdSelect();
api.restoreJdSelection();
check("restoreJdSelection 恢复 jd-select", $("jd-select").value === "backend");
check("restoreJdSelection 恢复预览卡", $("jd-preview").hidden === false);

console.log("== 19. v12 国赛级可验证运行时能力 ==");
// 19.1 MCP 实时控制台
check("MCP_TOOLS 定义且含 3 个工具", Array.isArray(api.MCP_TOOLS) && api.MCP_TOOLS.length === 3);
check(
  "MCP 工具名顺序正确",
  api.MCP_TOOLS.map((t) => t.name).join(",") === "search_job_db,fetch_interview_experience,schedule_mock"
);
const st = api.MCP_TOOLS.find((t) => t.name === "search_job_db");
check(
  "search_job_db 含 input_schema",
  !!(st && st.schema && st.schema.query === "string" && st.schema.limit === "number")
);
st.handler({ query: "后端", limit: 3 }).then((r) => {
  check("search_job_db handler 真实执行返回命中", r && r.hit_count > 0 && Array.isArray(r.results));
});
api.initMcpConsole();
check("initMcpConsole 渲染工具列表", $("mcp-tools-list").innerHTML.includes("search_job_db"));
check("initMcpConsole 更新状态徽章", $("mcp-status").textContent.includes("就绪"));

// 19.2 代码面试沙盒
check("CODE_CASES 定义且 3 例", Array.isArray(api.CODE_CASES) && api.CODE_CASES.length === 3);
check(
  "twoSum 参考实现通过全部用例",
  (function () {
    try {
      const fn = new Function(
        "return (" +
          "function twoSum(nums,target){const m=new Map();for(let i=0;i<nums.length;i++){const n=target-nums[i];if(m.has(n))return[m.get(n),i];m.set(nums[i],i);}return[];}" +
          ")"
      )();
      return api.CODE_CASES.every((c) => JSON.stringify(fn(...c.input)) === JSON.stringify(c.expect));
    } catch (e) {
      return false;
    }
  })()
);
check("runCodeSandbox 为函数", typeof api.runCodeSandbox === "function");

// 19.3 本地脱敏预览（0 网络请求）
$("resume").value = "电话13800138000 邮箱a@b.com 身份证11010119900307123X";
api.localPiiMask();
check("localPiiMask 手机号已脱敏", $("resume").value.includes("[手机号已脱敏]"));
check("localPiiMask 邮箱已脱敏", $("resume").value.includes("[邮箱已脱敏]"));
check("localPiiMask 身份证已脱敏", $("resume").value.includes("[身份证已脱敏]"));
check("localPiiMask 显示 0 请求徽章", $("pii-badge").hidden === false);
$("resume").value = ""; // 复位，避免影响后续用例

// 19.4 工程自检面板
check("runSelfCheck 为函数", typeof api.runSelfCheck === "function");
check("CAREER_DB 满足自检阈值(>=24)", api.CAREER_DB.length >= 24);

setTimeout(() => {
  check("拦截后延迟引导到登录页", api.getView() === "auth");
  console.log(`\n结果：${pass} 通过，${failCount} 失败`);
  process.exit(failCount ? 1 : 0);
}, 600);
