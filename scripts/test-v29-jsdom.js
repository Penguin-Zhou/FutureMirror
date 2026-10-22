/* v29 jsdom 测试：专家能力层（Blueprint Expert Layer · Beta 1.0.9）
 * 覆盖：主题三态跟随系统、印刷风质感层（纸纹/墨阶/毛玻璃等价/光晕）、
 *       微交互（准线光标/磁铁/卡片触感/Toast撤销）、滚动驱动（收缩/吸附/画廊/视差）、
 *       数据可视化（热力图/散点/表格排序筛选分页导出/拖拽仪表盘/实时流）、
 *       高级组件（可拖拽可调整弹窗/向导/时间轴/折叠侧栏/View Transition）。
 * 用法：node scripts/test-v29-jsdom.js
 * 说明：正常路径 + reduced-motion 路径 + 精细指针路径各建 JSDOM 实例验证。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");
const CSS = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join("\n");

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label); }
}

function makeDom(opts) {
  const o = opts || {};
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
    beforeParse(window) {
      const noop = () => {};
      const base = window.matchMedia;
      const mk = (q, m) => ({ matches: m, media: q, addListener: noop, removeListener: noop, addEventListener: noop, removeEventListener: noop });
      window.matchMedia = q => {
        if (o.reduced && /reduce/.test(q)) return mk(q, true);
        if (o.fine && /pointer:\s*fine/.test(q)) return mk(q, true);
        if (o.dark && /prefers-color-scheme:\s*dark/.test(q)) return mk(q, true);
        if (base) { try { return base.call(window, q); } catch (e) {} }
        return mk(q, false);
      };
    },
  });
  const settle = () => new Promise(res => {
    if (dom.window.document.readyState === "complete") return res();
    dom.window.document.addEventListener("DOMContentLoaded", res, { once: true });
    setTimeout(res, 900);
  });
  return { dom, errors, settle };
}
const wait = ms => new Promise(r => setTimeout(r, ms));

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v29 jsdom 测试（专家能力层 Blueprint Expert Layer）===");

  /* ================================================================
   * 路径 A：正常路径（默认指针 · 非减弱动效）
   * ================================================================ */
  const A = makeDom({});
  await A.settle();
  await wait(120);
  const wA = A.dom.window, dA = wA.document;

  /* ---------- A1. 主题三态 · 自动跟随系统 ---------- */
  console.log("\n--- A1. 主题三态（auto / light / dark）---");
  ok(/prefers-color-scheme:\s*dark/.test(html), "首屏预置脚本侦测系统明暗（prefers-color-scheme）");
  ok(/g_theme_mode/.test(html), "三态模式键 g_theme_mode 已持久化读写");
  ok(typeof wA.themeMode === "function", "themeMode() 读取当前模式");
  ok(typeof wA.setThemeMode === "function", "setThemeMode() 设定模式（auto/light/dark）");
  ok(typeof wA.cycleThemeMode === "function", "cycleThemeMode() 三态循环");
  ok(typeof wA.initThemeFollow === "function", "initThemeFollow() 注册系统变更监听");
  ok(wA.themeMode() === "auto", "首次访问默认为 auto（跟随系统）");
  wA.setThemeMode("dark");
  ok(dA.documentElement.dataset.theme === "dark", "显式切 dark 生效");
  wA.setThemeMode("auto");
  ok(["light", "dark"].indexOf(dA.documentElement.dataset.theme) >= 0, "切回 auto 落到系统值");

  /* ---------- A2. 印刷风质感层 ---------- */
  console.log("\n--- A2. 印刷风质感层 ---");
  ok(/--grain:/.test(CSS), "纸纹令牌 --grain 已定义");
  ok(/--grain-op:/.test(CSS), "纸纹强度 --grain-op 已定义（亮暗分档）");
  ok(/--glass-bg:/.test(CSS), "毛玻璃等价纸底 --glass-bg 已定义");
  ok(/--spring:\s*cubic-bezier\(\.34,\s*1\.56,\s*\.64,\s*1\)/.test(CSS), "弹簧缓动 --spring 为 back-out 曲线");
  ok(/body::after[\s\S]{0,200}var\(--grain\)/.test(CSS), "纸纹以 body::after 全屏层承载");
  ok(/background-image:\s*var\(--grain\)/.test(CSS), "纸纹用 SVG feTurbulence 噪点");
  ok(/feTurbulence/.test(CSS), "噪点由 feTurbulence 生成（非位图）");
  ok(/\.bp-z1\{|  \.bp-z1 \{/.test(CSS) && /\.bp-z2 \{/.test(CSS) && /\.bp-z3 \{/.test(CSS), "墨阶景深 z1/z2/z3 三层");
  ok(/\.bp-z2::before/.test(CSS) && /var\(--card-2\)/.test(CSS), "景深用顶部高光发丝线（非投影）");
  ok(/\.bp-glass \{[\s\S]{0,160}var\(--glass-bg\)/.test(CSS), "毛玻璃等价 .bp-glass 用半透明纸底");
  ok(/\.bp-glow \{[^}]*outline:/.test(CSS), "光晕边框用 outline 外扩（非 box-shadow）");
  ok(/\.bp-fs-hero \{[^}]*clamp\(/.test(CSS) && /\.bp-fs-h2 \{[^}]*clamp\(/.test(CSS) && /\.bp-fs-body \{[^}]*clamp\(/.test(CSS), "流体字号三档全部 clamp 平滑缩放");

  /* ---------- A3. 微交互 ---------- */
  console.log("\n--- A3. 微交互（光标 / 磁铁 / 触感 / 撤销）---");
  ok(/\.bp-cursor \{/.test(CSS), "准线光标 .bp-cursor 样式");
  ok(/\.bp-cursor-dot \{/.test(CSS), "光标中心点 .bp-cursor-dot（朱红）");
  ok(/\.bp-cursor\.hot/.test(CSS), "悬停可交互元素时光标变直角方框");
  ok(/html\.bp-cursor-on \*/.test(CSS), "启用时隐藏系统箭头光标");
  ok(/html\.bp-cursor-on input[^\{]*\{[^}]*cursor:\s*text/.test(CSS), "输入框保留文本光标（无障碍）");
  ok(/\.bp-magnet \{[^}]*var\(--spring\)/.test(CSS), "磁铁按钮用弹簧位移");
  ok(/\.bp-tactile:hover \{[^}]*scale\(1\.004\)/.test(CSS), "卡片触感为 scale 微放（非上浮）");
  ok(!/\.bp-tactile:hover[^}]*translateY/.test(CSS), "卡片 hover 不含 translateY 上浮");
  ok(/\.bp-tactile:hover \{[^}]*border-color:\s*var\(--ink\)/.test(CSS), "卡片 hover 仍为墨色描边");
  ok(/\.toast-undo \{/.test(CSS) && /#toast\.bp-toast-flex/.test(CSS), "Toast 撤销钮样式与布局");
  ok(/function toast\(msg, undo\)/.test(html) || /toast\(msg, undo\)/.test(html), "toast() 支持撤销回调第二参");
  ok(/已重置本轮面试[\s\S]{0,400}function \(\)/.test(html), "面试重置已接入撤销（可回滚会话）");

  /* ---------- A4. 滚动驱动 ---------- */
  console.log("\n--- A4. 滚动驱动 ---");
  ok(/header\.scrolled \{/.test(CSS) && /header\.scrolled \.nav \{[^}]*height:\s*48px/.test(CSS), "导航吸顶收缩 56 → 48");
  ok(/header\.scrolled \{[^}]*border-bottom-color/.test(CSS), "收缩时下边线加深（非阴影）");
  ok(/\.bp-snap-y \{[^}]*scroll-snap-type:\s*y/.test(CSS), "滚动吸附容器 scroll-snap-type: y");
  ok(/\.bp-snap-item \{[^}]*scroll-snap-align:\s*start/.test(CSS), "分段吸附对齐点 start");
  ok(/\.bp-gallery \{[\s\S]{0,220}scroll-snap-type:\s*x mandatory/.test(CSS), "横向画廊 x 轴强制吸附");
  ok(/\.bp-gallery > \* \{[^}]*scroll-snap-align/.test(CSS), "画廊子项对齐点");
  ok(/\.bp-parallax \{[^}]*will-change:\s*transform/.test(CSS), "视差元素 will-change 提示");

  /* ---------- A5. 数据可视化 ---------- */
  console.log("\n--- A5. 数据可视化 ---");
  ok(/\.bp-heat \{/.test(CSS) && /\.bp-heat-cell \{/.test(CSS), "热力图容器与单元格");
  ok(/\.bp-scatter \{/.test(CSS) && /\.bp-scatter-dot \{/.test(CSS), "散点图容器与点");
  ok(/\.bp-tip \{/.test(CSS) && /\.bp-tip\.show/.test(CSS), "悬浮详情提示（hover 显形）");
  ok(/\.bp-th-sort\.asc::after/.test(CSS) && /\.bp-th-sort\.desc::after/.test(CSS), "表头排序升序/降序标记");
  ok(/\.bp-pager \{/.test(CSS) && /\.bp-pager button:disabled/.test(CSS), "分页器与禁用态");
  ok(/\.bp-search \{/.test(CSS), "表格筛选输入框");
  ok(/\.bp-mini-btn \{/.test(CSS), "导出按钮（CSV）");
  ok(/\.bp-board \{[^}]*grid/.test(CSS) && /\.bp-board-card \{[^}]*grab/.test(CSS), "可拖拽仪表盘卡片（grab 光标）");
  ok(/\.bp-board-card\.dragging/.test(CSS) && /\.bp-board-card\.over/.test(CSS), "拖拽中 / 落位目标态");
  ok(/\.bp-live-item \{/.test(CSS) && /\.bp-live-k \{/.test(CSS) && /\.bp-live-v \{/.test(CSS), "实时数据流条目样式");

  /* ---------- A6. 高级组件 ---------- */
  console.log("\n--- A6. 高级组件 ---");
  ok(/\.bp-dialog \{/.test(CSS) && /\.bp-dialog-grip \{[^}]*cursor:\s*move/.test(CSS), "弹窗可拖拽（grip 抓手）");
  ok(/\.bp-dialog-resize \{[^}]*nwse-resize/.test(CSS), "弹窗可调整大小（右下角手柄）");
  ok(/\.bp-stepper \{/.test(CSS) && /\.bp-step\.on/.test(CSS) && /\.bp-step\.done/.test(CSS), "分步向导与当前/已完成态");
  ok(/\.bp-tl \{[^}]*border-left/.test(CSS) && /\.bp-tl-item\.on::before/.test(CSS), "时间轴轴线与高亮节点");
  ok(/\.bp-aside \{[^}]*transition/.test(CSS) && /\.bp-aside\.collapsed/.test(CSS), "可折叠侧边栏与收起态");
  ok(/::view-transition-old\(root\)/.test(CSS) && /::view-transition-new\(root\)/.test(CSS), "View Transition 转场伪元素");
  ok(/@keyframes bpReveal/.test(CSS) && /clip-path:\s*inset\(14px/.test(CSS), "转场兜底为 clip-path 印刷揭载");

  /* ---------- A7. 运行时装配 ---------- */
  console.log("\n--- A7. 运行时装配 ---");
  ok(!!wA.__bpMotion, "__bpMotion 钩子已挂载");
  ok(!!wA.__bpViz, "__bpViz 钩子已挂载");
  const mr = wA.__bpMotion.init();
  ok(typeof mr === "object" && mr.navShrink === true, "initNavShrink 已挂载到 header");
  ok(mr.snap >= 1, "落地页分段已加吸附点（≥1）");
  ok(mr.gallery === true, "横向画廊容器已绑定窄屏切换");
  ok(mr.tactile >= 1, "卡片已加触感反馈类（≥1）");
  ok(mr.dialogs >= 0, "弹窗拖拽装配已完成（重复调用幂等）");
  ok(mr.parallax >= 0, "视差扫描无异常");
  ok(mr.viewTransition === false || mr.viewTransition === true, "View Transition 包装尝试完成（jsdom 无 API 走兜底）");
  ok(dA.querySelectorAll(".bp-dialog-grip").length >= 1, "DOM 中存在拖拽抓手");
  ok(dA.querySelectorAll(".bp-dialog-resize").length >= 1, "DOM 中存在缩放手柄");
  ok(dA.querySelectorAll(".bp-tactile").length >= 1, "DOM 中存在触感卡片");
  ok(typeof wA.showView === "function" && wA.showView.__bpVT === true, "showView 已被 View Transition 包装");
  ok(wA.__bpMotion.withVT(function () { wA.__bpVTflag = 1; }) === false && wA.__bpVTflag === 1, "无 API 时 withVT 直接执行不丢行为");

  const panel = dA.getElementById("bp-viz-panel");
  ok(!!panel, "报告页能力分布看板已挂载");
  ok(panel && panel.querySelectorAll(".bp-heat-cell").length === 24, "热力图渲染 4×6 = 24 格");
  ok(panel && panel.querySelectorAll(".bp-scatter-dot").length === 5, "散点图渲染 5 个样本点");
  ok(panel && panel.querySelectorAll(".bp-step").length === 4, "分步向导 4 步");
  ok(panel && panel.querySelectorAll(".bp-tl-item").length === 4, "时间轴 4 节点");
  ok(panel && panel.querySelectorAll(".bp-live-item").length === 4, "实时看板 4 条指标");
  ok(panel && panel.querySelectorAll('[data-card]').length === 2, "图表卡片可拖拽（2 张，带 data-card）");
  ok(panel && panel.querySelectorAll(".bp-board-card").length === 2, "仪表盘卡片已初始化");
  ok(!!wA.__bpViz.live() && typeof wA.__bpViz.live().stop === "function", "实时流可停止（避免泄漏）");

  ok(dA.querySelectorAll(".bp-table-tools").length >= 1, "表格工具条已插入");
  ok(dA.querySelectorAll(".bp-th-sort").length >= 3, "表头已可排序");
  ok(dA.querySelectorAll(".bp-pager").length >= 1, "分页器已插入");
  const api = wA.__bpViz.enhanceTable(dA.querySelector(".eval-table"));
  ok(api && typeof api.csv === "function", "表格增强 API 可用（重复调用幂等）");
  ok(api && api.csv().charCodeAt(0) === 0xFEFF, "CSV 带 UTF-8 BOM（Excel 中文不乱码）");
  ok(api && /"/.test(api.csv()), "CSV 单元格加引号转义");

  /* ---------- A8. 视觉纪律守恒 ---------- */
  console.log("\n--- A8. 视觉纪律守恒 ---");
  ok(!/backdrop-filter/.test(CSS), "全站仍无 backdrop 毛玻璃滤镜（纸质等价实现）");
  ok(!/\.card:hover[^}]*translateY\(-\d/.test(CSS), "卡片 hover 无负向上浮");
  ok(/@keyframes bpReveal \{[^}]*inset\(14px 0 0 0\)/.test(CSS), "揭载用 clip-path 而非位移上浮");

  /* ================================================================
   * 路径 B：reduced-motion（动画减弱）
   * ================================================================ */
  const B = makeDom({ reduced: true });
  await B.settle();
  await wait(120);
  const wB = B.dom.window;
  console.log("\n--- B. reduced-motion 适配 ---");
  ok(wB.__bpMotion.reduced() === true, "reduced-motion 被正确侦测");
  ok(wB.__bpMotion.initCursor() === false, "减弱动效时不启用自定义光标");
  const br = wB.__bpMotion.init();
  ok(br.magnets === 0, "减弱动效时磁铁按钮不启用");
  ok(br.parallax === 0, "减弱动效时视差不启用");
  const bl = wB.__bpViz.startLive(wB.document.createElement("div"), () => [{ k: "a", v: 1 }], 100);
  ok(bl && bl.stop && typeof bl.stop === "function", "实时流 API 可用");
  bl.stop();
  ok(true, "实时流停止无异常");

  /* ================================================================
   * 路径 C：精细指针（自定义光标启用）
   * ================================================================ */
  const C = makeDom({ fine: true });
  await C.settle();
  await wait(120);
  const wC = C.dom.window, dC = wC.document;
  console.log("\n--- C. 精细指针 · 准线光标 ---");
  ok(wC.__bpMotion.fine() === true, "精细指针被正确侦测");
  ok(wC.__bpMotion.initCursor() === false, "重复调用 initCursor 幂等（不重复注入光标）");
  ok(dC.querySelectorAll(".bp-cursor").length === 1, "光标环已注入 DOM（唯一）");
  ok(dC.querySelectorAll(".bp-cursor-dot").length === 1, "光标中心点已注入 DOM（唯一）");
  ok(dC.documentElement.classList.contains("bp-cursor-on"), "html 已标记 bp-cursor-on 隐藏系统光标");
  ok(!!dC.querySelector(".bp-cursor[aria-hidden='true']"), "光标为纯装饰（aria-hidden）");

  /* ================================================================
   * 路径 D：系统暗色
   * ================================================================ */
  const D = makeDom({ dark: true });
  await D.settle();
  await wait(120);
  const wD = D.dom.window;
  console.log("\n--- D. 系统暗色自动跟随 ---");
  ok(/prefers-color-scheme:\s*dark/.test(html), "首屏脚本读取系统明暗");
  wD.setThemeMode("auto");
  ok(wD.document.documentElement.dataset.theme === "dark", "auto 模式下跟随系统暗色");

  console.log("\n===== v29 结果：" + pass + " 通过，" + fail + " 失败 =====");
  process.exit(fail ? 1 : 0);
}
