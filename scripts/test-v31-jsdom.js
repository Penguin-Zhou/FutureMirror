/* v31 jsdom 测试：体验修复层 + 学习计划 + 图标系统（Beta 1.1.2）
 * 覆盖：① 面试页「重新面试」入口与登录守卫
 *       ② 滚动吸附作用域收窄到 landing 视图 + 题库子页签切换回顶
 *       ③ 能力分布看板随报告刷新（refreshReportPanel / removeReportPanel）
 *       ④ 偏好设置「十字鼠标追踪」开关（prefs.crosshair，默认开）
 *       ⑤ 学习计划板块（7 天路径 + 每日时间分配 + 报告同步 + 打卡进度）
 *       ⑥ 全站蓝图风 SVG 图标系统（data-ic 换装 + 主题钮 + favicon）
 *       ⑦ 版本串口径（BETA 1.1.2 / beta1.1.2）
 * 用法：node scripts/test-v31-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label); }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

function makeDom() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => {
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
  const settle = () => new Promise(res => {
    if (dom.window.document.readyState === "complete") return res();
    dom.window.document.addEventListener("DOMContentLoaded", res, { once: true });
    setTimeout(res, 900);
  });
  return { dom, errors, settle };
}

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v31 jsdom 测试（体验修复层 + 学习计划 + 图标系统 · Beta 1.1.2）===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  const d = w.document;
  await settle();
  await wait(300);

  /* ================================================================
     ① 面试页「重新面试」入口
     ================================================================ */
  console.log("\n—— ① 面试页重新面试入口 ——");
  ok(/onclick="restartInterview\(\)"/.test(html), "HTML 含 restartInterview() 调用按钮");
  const interviewBtn = d.querySelector('.app-page[data-page="interview"] button[onclick="restartInterview()"]');
  ok(!!interviewBtn, "面试页容器内存在「重新面试」按钮");
  const restartSrc = w.eval("restartInterview.toString()");
  ok(/requireLogin\(\)/.test(restartSrc), "restartInterview 含 requireLogin() 守卫");
  ok(/requireLogin\(\)/.test(w.eval("finishInterview.toString()")), "finishInterview 同样含登录守卫（一致性）");
  ok(/重新面试/.test(interviewBtn ? interviewBtn.textContent : ""), "按钮文案为「重新面试」");

  /* ================================================================
     ② 滚动吸附作用域（仅 landing 视图）+ 题库子页签回顶
     ================================================================ */
  console.log("\n—— ② 滚动吸附作用域与题库回顶 ——");
  ok(!!(w.__bpMotion && typeof w.__bpMotion.setSnap === "function"), "__bpMotion.setSnap 已暴露");
  ok(d.documentElement.classList.contains("bp-snap-y"), "初始视图（landing）下吸附就位");
  w.eval("showView('landing')");
  ok(d.documentElement.classList.contains("bp-snap-y"), "进入 landing 视图后挂上 bp-snap-y");
  w.eval("showView('app')");
  ok(!d.documentElement.classList.contains("bp-snap-y"), "离开 landing 后拆除 bp-snap-y（应用内不再被吸附阻滞）");
  w.eval("showView('landing')");
  ok(d.documentElement.classList.contains("bp-snap-y"), "再次进入 landing 可重新挂载");
  w.eval("showView('app')");
  w.eval("window.__bpMotion.setSnap(false)");
  ok(!d.documentElement.classList.contains("bp-snap-y"), "setSnap(false) 直接拆除吸附");
  const initSnapSrc = w.eval("window.__bpMotion && window.__bpMotion.initSnap ? window.__bpMotion.initSnap.toString() : ''");
  ok(!!initSnapSrc && /view-landing/.test(initSnapSrc), "initSnap 按当前视图决定吸附（不再无条件常驻 documentElement）");
  /* 题库子页签切换回顶 */
  const scrolled = [];
  w.scrollTo = o => scrolled.push(o);
  w.eval("switchQuizTab('fav')");
  ok(scrolled.length === 1 && scrolled[0] && scrolled[0].behavior === "smooth", "switchQuizTab 触发平滑回顶（behavior=smooth）");
  ok(typeof scrolled[0].top === "number" && scrolled[0].top >= 0, "回顶目标为非负坐标");

  /* ================================================================
     ③ 能力分布看板随报告刷新
     ================================================================ */
  console.log("\n—— ③ 能力分布看板刷新 ——");
  const viz = w.__bpViz || {};
  ok(typeof viz.refreshReportPanel === "function", "__bpViz.refreshReportPanel 已暴露");
  ok(typeof viz.removeReportPanel === "function", "__bpViz.removeReportPanel 已暴露");
  ok(/refreshReportPanel/.test(w.eval("renderReport.toString()")), "renderReport 成功渲染末尾调用 refreshReportPanel");
  ok(/removeReportPanel/.test(w.eval("renderReport.toString()")), "renderReport 空态路径调用 removeReportPanel");
  w.eval("window.__bpViz.refreshReportPanel()");
  const panel1 = d.getElementById("bp-viz-panel");
  ok(!!panel1, "refreshReportPanel 能挂载能力分布看板");
  w.eval("window.__bpViz.refreshReportPanel()");
  ok(d.querySelectorAll("#bp-viz-panel").length === 1, "重复刷新仍只有一个面板实例（幂等）");
  w.eval("window.__bpViz.removeReportPanel()");
  ok(!d.getElementById("bp-viz-panel"), "removeReportPanel 能撤下看板（空态不留陈旧面板）");

  /* ================================================================
     ④ 偏好设置「十字鼠标追踪」开关
     ================================================================ */
  console.log("\n—— ④ 十字鼠标追踪偏好开关 ——");
  ok(w.eval("JSON.stringify(PROFILE_DEFAULTS.prefs)").indexOf('"crosshair":true') > -1, "PROFILE_DEFAULTS.prefs.crosshair 默认 true");
  ok(!!d.getElementById("sw-cross"), "偏好设置区存在 sw-cross 开关");
  const swCross = d.getElementById("sw-cross");
  ok(!!swCross && /togglePref\('crosshair'\)/.test(swCross.getAttribute("onclick") || ""), "sw-cross 绑定 togglePref('crosshair')");
  const crossOn = d.querySelectorAll(".bp-cross-x, .bp-cross-y").length;
  ok(crossOn === 2, "默认开启时准线两条已注入（实际 " + crossOn + "）");
  w.eval("togglePref('crosshair')");
  ok(d.querySelectorAll(".bp-cross-x, .bp-cross-y").length === 0, "关闭偏好后准线撤除");
  ok(swCross.getAttribute("aria-checked") === "false", "关闭后开关 aria-checked=false");
  ok(w.eval("getProfile().prefs.crosshair") === false, "关闭态已持久化到 profile");
  w.eval("togglePref('crosshair')");
  ok(d.querySelectorAll(".bp-cross-x, .bp-cross-y").length === 2, "重新开启后准线恢复注入");
  ok(swCross.getAttribute("aria-checked") === "true", "重开后开关 aria-checked=true");
  ok(w.eval("getProfile().prefs.crosshair") === true, "开启态已持久化到 profile");

  /* ================================================================
     ⑤ 学习计划板块
     ================================================================ */
  console.log("\n—— ⑤ 学习计划板块 ——");
  ok(w.eval("APP_PAGES").indexOf("plan") > -1, "APP_PAGES 含 plan");
  ok(w.eval("APP_PAGE_TITLES").plan === "学习计划", "路由标题登记为「学习计划」");
  ok(/data-page="plan"/.test(html), "HTML 含 plan 页面容器");
  ok(!!d.getElementById("lp-grid") && !!d.getElementById("lp-toolbar") && !!d.getElementById("lp-alloc"), "plan 页四个渲染容器就位");
  w.eval("renderPlanPage()");
  ok(d.querySelectorAll("#lp-grid .lp-day").length === 7, "renderPlanPage 渲染 7 张日卡");
  ok(d.querySelectorAll("#lp-grid .lp-check").length >= 7, "每日卡含任务复选框（可打卡）");
  ok(/合计 \d+′/.test(d.querySelector("#lp-grid .lp-day .lp-day-total").textContent), "日卡含当日时间合计");
  ok(d.querySelectorAll("#lp-alloc .lp-table tbody tr").length === 8, "时间分配总表 7 行 + 合计行");
  let p0 = w.eval("lpGet()");
  ok(p0.days.length === 7 && p0.source === "baseline", "无面试记录时计划为通用基线版");
  ok(p0.days.every(dd => dd.alloc.learn + dd.alloc.practice + dd.alloc.review === 60), "标准预算每日合计 60 分钟");
  w.eval("setPlanBudget('light')");
  ok(w.eval("lpGet()").days.every(dd => dd.alloc.learn + dd.alloc.practice + dd.alloc.review === 45), "紧凑预算每日合计 45 分钟");
  w.eval("setPlanBudget('deep')");
  ok(w.eval("lpGet()").days.every(dd => dd.alloc.learn + dd.alloc.practice + dd.alloc.review === 90), "强化预算每日合计 90 分钟");
  w.eval("setPlanBudget('std')");
  /* 先登录（store 按账号隔离，打卡须在同一账号下进行），再造面试会话 */
  w.eval(`
    currentUser = { id: 'u-plan', email: 'plan@t.com', name: '计划测试' };
    session.turns = [];
  `);
  w.eval("togglePlanTask(0,0)");
  let p1 = w.eval("lpGet()");
  ok(p1.days[0].tasks[0].done === true, "togglePlanTask 可打卡（Day1 首任务 done）");
  let pr = w.eval("lpProgress(lpGet())");
  ok(pr.done === 1 && pr.total === p1.days.reduce((s, x) => s + x.tasks.length, 0), "进度统计 已打卡/总数 正确（" + pr.done + "/" + pr.total + "）");
  ok(/已同步自最新评估报告/.test(d.getElementById("lp-src").textContent) === false, "基线版来源注记为「通用基线计划」");
  /* 无面试时同步 → 保持基线 */
  w.eval("syncPlanFromReport()");
  ok(w.eval("lpGet()").source === "baseline", "无面试记录时同步保持基线计划");
  /* 造面试会话 → 同步为报告版并按日保留进度 */
  w.eval(`
    session.turns = [
      { q: 'q1', answer: '通过 Redis 缓存把 QPS 从 800 提升到 4200，延迟下降 60%', agent: '技术 Agent', mode: 'normal' },
      { q: 'q2', answer: '背景是电商大促，目标是保障下单链路，我负责网关限流，最终通过压测', agent: '技术 Agent', mode: 'pressure' },
      { q: 'q3', answer: '然后那个就是，我们用 STAR 拆解：背景目标行动结果都覆盖了', agent: '观察员', mode: 'normal' },
      { q: 'q4', answer: '数据库索引优化，从 2.3s 降到 180ms，覆盖 12 个慢查询', agent: '技术 Agent', mode: 'normal' },
      { q: 'q5', answer: '不是我的问题，但时间确实紧张，最终完成了上线', agent: '压力 Agent', mode: 'pressure' },
    ];
  `);
  const fromReport = w.eval("lpTasksFromReport()");
  ok(!!fromReport && fromReport.groups.length === 7, "有会话时 lpTasksFromReport 聚合出 7 天任务");
  w.eval("syncPlanFromReport()");
  const p2 = w.eval("lpGet()");
  ok(p2.source === "report", "同步后计划来源为 report（按最弱维度动态生成）");
  ok(p2.days[0].tasks[0].done === true, "同步按日保留 Day1 首任务完成态");
  ok(/已同步自最新评估报告/.test(d.getElementById("lp-src").textContent), "来源注记切换为「已同步自最新评估报告」");
  const md = w.eval("lpMarkdown(lpGet())");
  ok(/^# 7 天学习计划/.test(md) && /## Day 1 ·/.test(md) && /时间分配：学习 \d+′/.test(md), "lpMarkdown 导出含标题 / Day 1 / 时间分配");

  /* ================================================================
     ⑥ 全站蓝图风 SVG 图标系统
     ================================================================ */
  console.log("\n—— ⑥ 图标系统 ——");
  const bpIcons = w.__bpIcons || {};
  ok(!!bpIcons.icon && Object.keys(bpIcons.set || {}).length >= 30, "图标库 >= 30 枚（实际 " + Object.keys(bpIcons.set || {}).length + "）");
  const icDash = bpIcons.icon ? bpIcons.icon("dashboard") : "";
  ok(/viewBox="0 0 24 24"/.test(icDash) && /currentColor/.test(icDash), "icon() 输出 24×24 currentColor 线性 SVG");
  ok(/var\(--brand\)/.test(bpIcons.icon("report") || ""), "report 图标含朱红 accent");
  ok(/var\(--brand\)/.test(bpIcons.icon("plan") || ""), "plan 图标含朱红 accent");
  const sbSvgs = d.querySelectorAll('.sb-item .sb-icon[data-ic] svg.bp-ic').length;
  ok(sbSvgs === 11, "侧栏 11 枚图标换装（实际 " + sbSvgs + "）");
  const tbSvgs = d.querySelectorAll('.tabbar-item .tb-icon[data-ic] svg.bp-ic').length;
  ok(tbSvgs === 10, "底 Tab 10 枚图标换装（实际 " + tbSvgs + "）");
  const qeSvgs = d.querySelectorAll(".qe-icon[data-ic] svg.bp-ic").length;
  ok(qeSvgs === 7, "快速入口 7 枚图标换装（实际 " + qeSvgs + "）");
  const leftIcons = Array.prototype.filter.call(d.querySelectorAll("[data-ic]"), el => !el.querySelector("svg.bp-ic"));
  ok(leftIcons.length === 0, "全部 data-ic 均已换装（残留 " + leftIcons.length + "）");
  w.eval("applyTheme('dark')");
  const darkBtn = d.getElementById("theme-btn");
  ok(darkBtn && /M12 2\.8v2\.4/.test(darkBtn.innerHTML), "暗色下主题钮切为 sun 图形");
  w.eval("applyTheme('light')");
  ok(darkBtn && /M20\.2 14\.6/.test(darkBtn.innerHTML), "亮色下主题钮回到 moon 图形");
  ok(/%23BE3A1E/.test(d.querySelector('link[rel="icon"]').getAttribute("href")), "favicon 升级为含朱红瞳点的取景器");

  /* ================================================================
     ⑥b 图表快照颜色链路（v31.1 hotfix：data-URI 双重编码致全黑）
     ================================================================ */
  console.log("\n—— ⑥b 快照颜色链路 ——");
  ok(typeof viz.radarSnap === "function" && typeof viz.heatSnap === "function", "__bpViz 暴露 radarSnap / heatSnap");
  const snapSrc = w.eval("window.__bpViz.radarSnap.toString() + window.__bpViz.heatSnap.toString()");
  ok(!/%23/.test(snapSrc), "radarSnap/heatSnap 源码无 %23 预编码残留（防双重编码复发）");
  const radarUri = w.eval("window.__bpViz.radarSnap(360, true)");
  const heatUri = w.eval("window.__bpViz.heatSnap(360)");
  ok(!!radarUri && /^data:image\/svg\+xml/.test(radarUri), "radarSnap 返回 data-URI");
  ok(!/%2523/.test(radarUri), "radarSnap data-URI 无 %2523（双重编码特征）");
  ok(/%23F4F1E8/.test(radarUri), "radarSnap data-URI 背景色正确编码为 %23F4F1E8");
  ok(!/%2523/.test(heatUri), "heatSnap data-URI 无 %2523（双重编码特征）");
  ok(/%23F4F1E8/.test(heatUri), "heatSnap data-URI 背景色正确编码为 %23F4F1E8");
  /* 模拟浏览器侧一次解码：SVG 源码中的颜色必须全部合法 */
  const decodeOnce = uri => decodeURIComponent(uri.replace("data:image/svg+xml;charset=utf-8,", ""));
  const radarSvg = decodeOnce(radarUri), heatSvg = decodeOnce(heatUri);
  const legal = svg => {
    const cols = [...svg.matchAll(/(?:fill|stroke)='([^']*)'/g)].map(m => m[1]);
    return cols.length > 0 && cols.every(c => c === "none" || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c));
  };
  ok(legal(radarSvg), "radar 快照解码后颜色全部合法（" + (radarSvg.match(/fill='[^']*'/g) || []).slice(0, 2).join(" ") + " …）");
  ok(legal(heatSvg), "heat 快照解码后颜色全部合法");
  ok(/#F4F1E8/.test(radarSvg) && /#BE3A1E/.test(radarSvg) && /#B9B29A/.test(radarSvg), "radar 快照含暖纸底/朱红数据/卡其网格");
  ok(/#F4F1E8/.test(heatSvg) && /#1C1913/.test(heatSvg), "heat 快照含暖纸底/墨阶格子");
  /* 挂载后面板内两张快照 img：jsdom 无 IntersectionObserver，媒体层直接取资源并移除 data-src */
  w.eval("window.__bpViz.refreshReportPanel()");
  const shotImgs = d.querySelectorAll("#bp-viz-panel .bp-shot img");
  ok(shotImgs.length === 2, "看板内两张快照 img 就位（实际 " + shotImgs.length + "）");
  ok([...shotImgs].every(im => /^data:image\/svg\+xml/.test(im.getAttribute("src") || "")), "两张快照 src 均为 data-URI SVG（懒加载已取资源）");
  ok(![...shotImgs].some(im => /%2523/.test(im.getAttribute("src") || "")), "快照 src 无双重编码痕迹");

  /* ================================================================
     ⑥b2 看板与主雷达同源（v31.3：注入真实维度后快照一致）
     ================================================================ */
  console.log("\n—— ⑥b2 看板与主雷达同源 ——");
  const rBefore = w.eval("window.__bpViz.radarSnap(360, true)");
  const hBefore = w.eval("window.__bpViz.heatSnap(360)");
  const realDims = [
    { dimension: "内容深度", score: 88, comment: "量化充分" },
    { dimension: "结构逻辑", score: 42, comment: "结构松散" },
    { dimension: "语言表达", score: 73, comment: "流畅" },
    { dimension: "岗位匹配", score: 60, comment: "部分匹配" },
    { dimension: "抗压表现", score: 55, comment: "偶有防御" },
  ];
  w.eval("window.__bpViz.refreshReportPanel(" + JSON.stringify({ dims: realDims, turns: 5 }) + ")");
  const panel = d.getElementById("bp-viz-panel");
  ok(!!panel, "注入真实维度后仍能挂载看板");
  const rAfter = w.eval("window.__bpViz.radarSnap(360, true)");
  const hAfter = w.eval("window.__bpViz.heatSnap(360)");
  ok(rBefore !== rAfter, "radarSnap 随注入维度变化（不再是固定硬编码）");
  ok(hBefore !== hAfter, "heatSnap 随注入维度变化（热力与主雷达同源）");
  const rAfterSvg = decodeOnce(rAfter);
  ok(/内容深度/.test(rAfterSvg) && /结构逻辑/.test(rAfterSvg) && /语言表达/.test(rAfterSvg) && /岗位匹配/.test(rAfterSvg) && /抗压表现/.test(rAfterSvg),
    "radarSnap 五个维度名与主雷达 radarSVG(dims) 完全一致");
  const heatCells = panel.querySelectorAll(".bp-heat-cell");
  ok(heatCells.length === 24, "看板热力图 24 格就位（实际 " + heatCells.length + "）");
  let hotCells = 0;
  heatCells.forEach(c => { if (c.style.opacity === "1") hotCells++; });
  ok(hotCells >= 1, "高分维度在热力图中被标红（朱红热区 " + hotCells + " 格）");
  const scatterDots = panel.querySelectorAll(".bp-scatter-dot");
  ok(scatterDots.length === 5, "看板散点 5 个维度分布点就位（实际 " + scatterDots.length + "）");
  ok(legal(decodeOnce(hAfter)), "注入后 heat 快照解码颜色仍全部合法");
  w.eval("window.__bpViz.removeReportPanel()");

  /* ================================================================
     ⑥c 悬停放大预览层防遮挡（v31.2：被右下悬浮件盖住 / 溢出视口）
     ================================================================ */
  console.log("\n—— ⑥c 预览层防遮挡 ——");
  const prevCss = html.match(/\.bp-preview \{[\s\S]*?\}/);
  const pz = prevCss ? (prevCss[0].match(/z-index:\s*(\d+)/) || [])[1] : "";
  ok(+pz >= 1100, "预览浮层盖过返回顶部(1100)/Toast(100)/AI 悬浮球(90)（实际 z-index " + pz + "）");
  ok(+pz > 0 && +pz < 1300, "预览浮层仍低于命令面板(1300)");
  const placeSrc = w.eval("window.__bpMedia.place.toString()");
  ok(/innerHeight/.test(placeSrc) && /r\.top - h - 10/.test(placeSrc), "place() 含垂直翻转分支（下方不足翻到上方）");
  ok(/offsetHeight \|\| 260/.test(placeSrc), "place() 未解码时按 260 估算高度（防图片加载后溢出）");
  const showSrc = w.eval("window.__bpMedia.showPreview.toString()");
  ok(/onload/.test(showSrc) && /place\(previewFor\)/.test(showSrc), "showPreview 图片加载后重新校准位置");
  /* 运行时行为：构造探针节点打桩 rect，验证三种场景的落点 */
  const probe = d.createElement("div");
  probe.setAttribute("data-preview", "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E");
  d.body.appendChild(probe);
  w.__probeNode = probe;
  const placeAt = rect => { probe.getBoundingClientRect = () => rect; w.eval("window.__bpMedia.showPreview(window.__probeNode)"); return d.querySelector(".bp-preview"); };
  let p = placeAt({ top: 300, bottom: 404, left: 100, width: 140, height: 104 });
  ok(!!p && p.classList.contains("show") && p.style.top === "414px", "缩略图居中部 → 面板落在下方（top " + (p && p.style.top) + "）");
  p = placeAt({ top: 560, bottom: 664, left: 100, width: 140, height: 104 });
  ok(!!p && p.style.top === "290px", "缩略图靠近底部 → 翻转到上方（top " + (p && p.style.top) + "）");
  p = placeAt({ top: 700, bottom: 804, left: 100, width: 140, height: 104 });
  ok(!!p && p.style.top === "430px", "缩略图极靠底部 → 翻转后仍 clamp 在视口内（top " + (p && p.style.top) + "）");
  w.eval("window.__bpMedia.hidePreview()");
  ok(!d.querySelector(".bp-preview").classList.contains("show"), "hidePreview 可收起");

  /* ================================================================
     ⑦ 版本串口径
     ================================================================ */
  console.log("\n—— ⑦ 版本口径 ——");
  ok(/BETA 1\.1\.2/.test(html), "页面版本串为 BETA 1.1.2");
  ok(/beta1\.1\.2/.test(html), "开发者模式版本串为 beta1.1.2");
  ok(!/beta1\.1\.1/.test(html), "无 beta1.1.1 残留");

  /* ================================================================
     汇总
     ================================================================ */
  const realErrors = errors.filter(e => !/Not implemented/.test(e));
  ok(realErrors.length === 0, "运行期无未捕获脚本错误（" + (realErrors[0] || "无") + "）");
  console.log("\n===== v31 结果：" + pass + " 通过，" + fail + " 失败 =====");
  dom.window.close();
  process.exit(fail ? 1 : 0);
}
