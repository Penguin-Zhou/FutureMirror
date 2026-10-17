/* v16 jsdom 功能测试：个人中心 / 头像系统 / 偏好设置 / 数据管理
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v16-jsdom.js
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
  console.log("\n=== v16 jsdom 功能测试 ===");

  ok(errors.length === 0, "页面脚本加载无错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

  /* 登录（播种测试用户） */
  window.eval("currentUser = { id: 'u_test', email: 't@t.com', name: '演示用户' }");
  window.eval("renderUserMenu()");
  ok(!document.getElementById("user-menu-box").hidden, "登录后用户菜单显示");
  ok(document.getElementById("nav-avatar").textContent.trim() === "演", "顶栏头像默认取姓名首字母");

  /* 进入个人中心 */
  window.location.hash = "#/profile";
  setTimeout(() => {
    ok(document.querySelector('.app-page[data-page="profile"]').classList.contains("active"), "profile 页激活");
    ok(!document.getElementById("profile-body").hidden, "登录后资料区可见");
    ok(document.getElementById("profile-gate").innerHTML === "", "登录后门槛为空");
    ok(document.getElementById("profile-name").textContent === "演示用户", "概览显示昵称");
    ok(document.getElementById("profile-email").textContent === "t@t.com", "概览显示邮箱");
    ok(document.getElementById("profile-completion-text").textContent === "0%", "空资料完成度 0%");

    /* 头像选择器 */
    const opts = document.querySelectorAll("#avatar-picker .avatar-option");
    ok(opts.length === 19, `头像选择器 19 个选项（1 自动 + 18 表情，实际 ${opts.length}）`);
    ok(opts[0].classList.contains("active"), "默认选中「首字母」");

    /* 切换表情头像 */
    opts[5].click();
    ok(window.eval("getProfile().avatar.type") === "emoji", "点击表情 → 头像类型 emoji");
    ok(document.querySelector("#nav-avatar .avatar-emoji"), "顶栏头像渲染为表情");
    ok(document.querySelector("#profile-avatar .avatar-emoji"), "个人中心大头像同步为表情");

    /* 切回首字母 */
    opts[0].click();
    ok(document.getElementById("nav-avatar").textContent.trim() === "演", "切回首字母头像");

    /* 上传形态头像（直接播种 dataURL，FileReader 链路由 uploadAvatar 覆盖） */
    window.eval(`saveProfile({ avatar: { type: "image", value: "data:image/jpeg;base64,TESTDATA" } }); refreshAllAvatars();`);
    const img = document.querySelector("#nav-avatar img.avatar-img");
    ok(!!img && img.getAttribute("src") === "data:image/jpeg;base64,TESTDATA", "图片头像渲染 <img>");

    /* 求职信息表单 */
    const firstCareer = window.eval("CAREER_DB[0]");
    document.getElementById("pf-city").value = "杭州";
    document.getElementById("pf-degree").value = "本科";
    document.getElementById("pf-years").value = "1-3 年";
    document.getElementById("pf-target").value = firstCareer.id;
    document.getElementById("pf-bio").value = "3 年后端开发经验，主导过日活百万级订单系统改造，期望转向基础架构方向。";
    window.eval("saveProfileForm()");
    ok(window.eval("getProfile().city") === "杭州", "保存城市");
    ok(window.eval("getProfile().target") === firstCareer.id, "保存目标岗位");
    const tagsText = document.getElementById("profile-tags").textContent;
    ok(tagsText.includes("杭州") && tagsText.includes(firstCareer.name), "概览标签含城市与目标岗位");
    ok(document.getElementById("profile-completion-text").textContent === "80%", `填写后完成度 80%（实际 ${document.getElementById("profile-completion-text").textContent}）`);

    /* 技能标签（3 个 → 100%） */
    const chips = document.querySelectorAll("#pf-skills .chip-btn");
    ok(chips.length === 18, `技能标签 18 个（实际 ${chips.length}）`);
    chips[0].click(); chips[1].click(); chips[2].click();
    ok(window.eval("getProfile().skills.length") === 3, "选择 3 个技能");
    ok(document.getElementById("profile-completion-text").textContent === "100%", "完成度 100%");

    /* 偏好开关 */
    const swVoice = document.getElementById("sw-voice");
    ok(swVoice.getAttribute("aria-checked") === "true", "语音输入默认开");
    swVoice.click();
    ok(window.eval("getProfile().prefs.voice") === false, "关闭语音输入偏好已持久化");
    ok(swVoice.getAttribute("aria-checked") === "false", "开关状态同步");

    document.getElementById("sw-auto").click();
    ok(window.eval("getProfile().prefs.autoSpeak") === true, "开启自动朗读偏好");
    ok((() => { try { window.eval("v16MaybeAutoSpeak()"); return true; } catch (e) { return false; } })(), "自动朗读钩子不抛错");

    document.getElementById("sw-dark").click();
    ok(document.documentElement.dataset.theme === "dark", "暗色开关切到 dark");
    ok(document.getElementById("sw-dark").getAttribute("aria-checked") === "true", "暗色开关状态同步");
    document.getElementById("sw-dark").click();
    ok(document.documentElement.dataset.theme === "light", "再切回 light");

    /* 数据管理 */
    window.eval("refreshStorage()");
    ok(document.getElementById("storage-text").textContent.includes("KB"), "存储占用已计算");
    window.eval("resetOnboardingFlag()");
    ok(!document.getElementById("onboarding").hidden, "重置首访引导后引导卡重新显示");

    /* 报告封面 */
    window.eval(`session.turns = [
      { agent: "技术面试官", question: "介绍一下你的项目", answer: "我做过电商秒杀系统，QPS 从 200 提升到 1200，使用 Redis 缓存与消息队列保证最终一致性。", notes: "量化成果", mode: "tech" },
      { agent: "HR 面试官", question: "为什么离职", answer: "希望寻找更大平台。", notes: "动机", mode: "general" }
    ]; renderReport();`);
    const cover = document.querySelector("#report-content .report-cover");
    ok(!!cover, "报告封面已渲染");
    ok(cover && cover.textContent.includes("演示用户"), "封面含用户名");
    ok(cover && /FM-/.test(cover.textContent), "封面含报告编号");
    ok(cover && cover.textContent.includes(firstCareer.name), "封面含目标岗位");

    /* 清除数据 */
    window.confirm = () => true;
    window.eval("clearUserData()");
    ok(window.eval("getProfile().city") === "", "清除后资料重置");
    ok(document.getElementById("profile-completion-text").textContent === "0%", "清除后完成度归零");

    /* 游客门槛 */
    window.eval("logout()");
    window.location.hash = "#/profile";
    setTimeout(() => {
      ok(document.getElementById("profile-body").hidden, "游客态资料区隐藏");
      ok(document.getElementById("profile-gate").textContent.includes("登录后即可自定义"), "游客态显示登录门槛");

      /* 导航结构 */
      ok(document.querySelectorAll('.sb-item[data-nav="profile"]').length === 1, "侧栏含个人中心入口");
      ok(document.querySelectorAll('.tabbar-item[data-nav="profile"]').length === 1, "底栏含个人中心入口");
      ok(window.eval("APP_PAGES.includes('profile')"), "路由表含 profile");
      ok(window.eval("APP_PAGE_TITLES.profile") === "个人中心", "个人中心有中文标题");

      console.log(`\n结果：${pass} 通过，${fail} 失败`);
      process.exit(fail ? 1 : 0);
    }, 200);
  }, 200);
}
