/* v67 · AI 小助手接入后端（检索 + 限流 + 引用都在服务端）
 *
 * 这次改动的实质不是「多发一个请求」，而是把三件事从前端搬到了服务端：
 *   ① 知识库检索——原来靠浏览器下载 20MB 模型算向量，换台机器质量就变；
 *   ② 参考资料编号——前端自己拼 prompt，回答里的 [1][2] 与界面引用可能对不上；
 *   ③ 额度——前端限流改一行 JS 就能绕过，而访客现在可以直接调用真实模型。
 *
 * 断言分七组：
 *   ① 接线：api.js 有小助手专用方法，且不再依赖面试页初始化
 *   ② 数据：后端 kb_data.json 与前端 kb.js 同源同量
 *   ③ 状态：三级模式标签（后端 / 直连 / 本地检索）
 *   ④ 降级：额度、未配置、普通失败三种文案各不相同
 *   ⑤ 上下文：历史对话带上但排除当前这一问
 *   ⑥ 引用：服务端给的标题原样列出，不重排不伪造
 *   ⑦ 成品：演示包内联了整套逻辑
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

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

const apiSrc = rd("frontend/js/core/api.js");
const assistantSrc = rd("frontend/js/features/assistant.js");
const kbJs = rd("frontend/js/data/kb.js");
const demoHtml = rd("public/futuremirror-demo.html");
const kbData = JSON.parse(rd("backend/app/kb_data.json"));

const ALL_MOTION = () => ({
  matches: false,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});

function boot() {
  const dom = new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(win) {
      win.matchMedia = ALL_MOTION;
      win.scrollTo = function () {};
      /* jsdom 本身没有 fetch，检查 backendReady 的代码会走 `typeof fetch` 分支
       * 直接返回。这里不注入假 fetch：注入一个「总是失败」的会触发网络监测的
       * 重试路径，测试进程反而挂住。需要哪一级状态就在用例里直接写 fmApi.health。 */
    },
  });
  return dom.window;
}

(async () => {
  console.log("── ① 接线 ──");
  ok(/async assistantChat\(/.test(apiSrc), "api.js 提供小助手专用通道 assistantChat");
  ok(/assistantReady\(\)/.test(apiSrc), "api.js 提供 assistantReady（后端在线且配了模型）");
  ok(
    /err\.code = "quota"/.test(apiSrc) && /额度已用完/.test(apiSrc) && /res\.status === 429/.test(apiSrc),
    "429 被识别为额度问题，而不是笼统的调用失败"
  );
  ok(/err\.code = "no_key"/.test(apiSrc), "503 被识别为未配置模型");
  ok(/json\.meta/.test(apiSrc), "流首 meta 帧被单独解析（模型名 / 引用 / 额度）");
  ok(/try \{ fmApi\.init\(\); \}/.test(apiSrc), "后端地址在 api.js 加载时即初始化，不再依赖面试页");
  ok(
    /fmApi\.assistantReady\(\)/.test(assistantSrc) && /fmApi\.assistantChat\(/.test(assistantSrc),
    "小助手优先走后端通道"
  );
  /* 报告追问那段在文件更前面，且本来就走通用流（它自带专属 prompt、
   * 只有拿到本地报告的人才会触发），不能拿 streamChat 的首次出现位置来判。
   * 这里比的是「普通问答分支」：后端判定必须写在直连判定之前。 */
  ok(
    assistantSrc.indexOf("fmApi.assistantReady()") < assistantSrc.indexOf('typeof llm !== "undefined" && llm'),
    "普通问答里，后端分支写在直连分支之前（顺序就是优先级）"
  );
  ok(
    /aiReportCtx[\s\S]{0,400}streamChat\(/.test(assistantSrc),
    "报告追问仍走通用流：它带专属 prompt，且只有拿到本地报告的人会触发"
  );

  /* 面板原来写死 480px 高，报告追问那四句长问题各占一行，
   * 把消息区压到 42px——回答进去只剩结尾半句。这两条守住修复。 */
  const pagesCss = rd("frontend/css/pages.css");
  ok(/\.ai-panel\s*\{[^}]*max-height:\s*calc\(100vh/.test(pagesCss), "面板高度受视口约束（屏幕矮时不会顶出边界）");
  ok(/\.ai-panel-quick\s*\{[^}]*max-height:\s*\d+px/.test(pagesCss), "快捷问题区限高并可滚动，不再把消息区挤成一条缝");

  console.log("\n── ② 数据 ──");
  const jsTitles = [...kbJs.matchAll(/\{\s*title:\s*"([^"]+)"/g)].map((m) => m[1]);
  ok(kbData.count === kbData.entries.length, "count 与条目数一致");
  ok(kbData.count >= 30, "后端知识库条数 " + kbData.count + "（不能是「只导出了初始 8 条」）");
  ok(jsTitles.length === kbData.count, "前后端条数一致（" + jsTitles.length + " vs " + kbData.count + "）");
  ok(
    jsTitles.every((t, i) => kbData.entries[i].title === t),
    "条目顺序与标题逐一对应（重新导出后顺序不会漂）"
  );
  ok(
    kbData.entries.every((e) => e.title && e.source && e.content && Array.isArray(e.tags)),
    "每条都带 title / source / tags / content（后端拼 prompt 依赖这四个字段）"
  );

  const w = boot();
  await new Promise((r) => setTimeout(r, 700));
  const d = w.document;

  console.log("\n── ③ 状态 ──");
  const setHealth = (h) => w.eval(`fmApi.health = ${JSON.stringify(h)}; fmApi.ready = ${!!(h && h.ok)}`);
  setHealth(null);
  ok(w.eval("aiModeLabel()") === "本地检索", "无后端时标签写「本地检索」，不冒充模型");
  setHealth({ ok: true, llm_ready: false, model: null });
  ok(w.eval("aiModeLabel()") === "后端 · 未配置模型", "后端在线但没配 Key 时如实说明");
  setHealth({ ok: true, llm_ready: true, model: "glm-4-flash" });
  ok(w.eval("aiModeLabel()") === "后端 · glm-4-flash", "后端就绪时显示真实模型名");

  console.log("\n── ④ 降级 ──");
  const quota = w.eval('aiFailureText({ code: "quota", retryAfter: "30" }, "Redis 穿透")');
  const noKey = w.eval('aiFailureText({ code: "no_key" }, "Redis 穿透")');
  const plain = w.eval('aiFailureText({ message: "HTTP 500" }, "Redis 穿透")');
  ok(/额度已用完/.test(quota) && /30 秒/.test(quota), "额度用完给出等待时间");
  ok(/没有配置模型 Key/.test(noKey), "未配置 Key 与额度问题分开表述");
  ok(/模型调用失败/.test(plain) && /HTTP 500/.test(plain), "普通失败带上原因");
  ok(
    [quota, noKey, plain].every((t) => t.length > 20),
    "三种失败都附了本地检索结果，不是一句干巴巴的报错"
  );
  ok(quota !== noKey && noKey !== plain, "三段文案互不相同（不能一句「调用失败」包打天下）");

  console.log("\n── ⑤ 上下文 ──");
  const box = d.getElementById("ai-assistant-messages");
  box.innerHTML = "";
  w.eval('appendAiMsg("user", "第一问", false)');
  w.eval('appendAiMsg("ai", "第一答", false)');
  w.eval('appendAiMsg("user", "当前这一问", false)');
  const hist = JSON.parse(w.eval("JSON.stringify(aiRecentHistory())"));
  ok(hist.length === 2, "历史取两轮共 2 条，实际 " + hist.length);
  ok(hist[0].role === "user" && hist[0].content === "第一问", "第一条是上一轮的提问");
  ok(hist[1].role === "assistant", "第二条是上一轮的回答");
  ok(
    hist.every((m) => m.content.indexOf("当前这一问") < 0),
    "不吃掉当前这一问（否则服务端会收到重复问题）"
  );

  const typed = d.createElement("div");
  typed.className = "ai-msg ai typing";
  typed.textContent = "思考中…";
  box.appendChild(typed);
  ok(
    JSON.parse(w.eval("JSON.stringify(aiRecentHistory())")).every((m) => m.content !== "思考中…"),
    "「思考中…」占位气泡不进历史"
  );

  console.log("\n── ⑥ 引用 ──");
  box.innerHTML = "";
  w.eval(
    'aiCitationLine([{ title: "Redis 缓存穿透/击穿/雪崩区别", source: "合成题库" }, { title: "MySQL 索引八股" }])'
  );
  const cite = box.querySelector(".ai-cite");
  ok(!!cite, "引用行挂到对话区");
  ok(/\[1\]/.test(cite.textContent) && /\[2\]/.test(cite.textContent), "编号按服务端顺序标出");
  ok(/Redis 缓存穿透/.test(cite.textContent), "标题原样展示，不改写");
  ok(!/<script/i.test(cite.innerHTML), "引用内容经转义，不注入 HTML");
  w.eval("aiCitationLine([])");
  ok(box.querySelectorAll(".ai-cite").length === 1, "没有引用时不渲染空行");

  console.log("\n── ⑦ 成品 ──");
  ok(demoHtml.includes("assistantChat"), "演示包内联了小助手后端通道");
  ok(demoHtml.includes("/api/assistant/chat"), "演示包里能看到端点路径");
  ok(demoHtml.includes("aiFailureText"), "演示包内联了分级降级文案");
  ok(/kb_count/.test(demoHtml), "健康探测会读服务端知识库条数");

  console.log((fail ? "❌ " : "✅ ") + `合计 ${pass + fail} 项：通过 ${pass}，失败 ${fail}`);
  /* 必须显式收尾：pretendToBeVisual 会挂一条 rAF 心跳，
   * 不关窗口的话进程跑完断言也不退出，被上层当成超时杀掉。 */
  try {
    w.close();
  } catch (e) {
    /* 窗口已关闭 */
  }
  process.exit(fail ? 1 : 0);
})();
