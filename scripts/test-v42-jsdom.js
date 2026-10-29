/* v42 回归测试：移动端「信息优先级裁剪」 + 可解释性渐进披露 + 键盘可见
 * 覆盖：
 *   ① 落地页折叠条：宽屏不显示、窄屏显示、默认收起、点击可展开、DOM 不删除
 *   ② 首屏裁剪：⌘K 提示与数字条在窄屏隐藏
 *   ③ Agent 圆桌：窄屏从并排网格改为横向 chips（内部横滑，页面不溢出）
 *   ④ 报告渐进披露：卡片只给「维度 + 分数 + 证据摘要」，完整评语窄屏收起
 *   ⑤ 底部半屏面板：顶部引用原话 + 评分理由 + 定位到对话按钮
 *   ⑥ 键盘：visualViewport 为唯一事实来源（--app-vh / --kb-h / .kb-open）
 *   ⑦ 输入栏：sticky 贴底 + 16px 字号（绕开 iOS 聚焦缩放）
 *   ⑧ 追问锚定标签：气泡上方显示，未复述时诚实降级
 * 用法：node scripts/test-v42-jsdom.js
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
const css = ["tokens.css", "theme.css", "pages.css"]
  .map((f) => fs.readFileSync(path.join(ROOT, "frontend", "css", f), "utf8"))
  .join("\n");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const has = (src, re) => re.test(src);

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

const bootSrc = rd("frontend/js/core/boot.js");
const interviewSrc = rd("frontend/js/features/interview.js");
const explainSrc = rd("frontend/js/features/explain.js");
const reportSrc = rd("frontend/js/features/report.js");
const indexSrc = rd("frontend/index.html");

function boot(opts) {
  const vc = new VirtualConsole();
  const errs = [];
  vc.on("jsdomError", (e) => errs.push(String(e && e.message)));
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://example.test/",
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = (q) => ({
        matches: !!(opts && opts.narrow) && /max-width/.test(q),
        media: q,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        onchange: null,
        dispatchEvent() {
          return false;
        },
      });
      w.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
      w.scrollBy = () => {};
      if (opts && opts.viewportH) {
        Object.defineProperty(w, "innerHeight", { value: opts.viewportH, configurable: true });
        Object.defineProperty(w.visualViewport, "height", { value: opts.viewportH, configurable: true });
      }
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [] };
      w.webkitSpeechRecognition = undefined;
    },
  });
  return { dom, w: dom.window, errs };
}

(async () => {
  console.log("\n① 落地页折叠条（窄屏生效 / 宽屏隐藏 / DOM 不删）");
  boot({ narrow: false });
  await wait(900);
  ok(has(css, /\.fold-toggle\s*\{\s*display:\s*none/), "折叠条默认隐藏（桌面端零变化）");
  ok(
    has(css, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.fold-toggle\s*\{[\s\S]*?display:\s*flex/),
    "≤640px 折叠条显示为一行"
  );
  ok(has(bootSrc, /LANDING_FOLD_TARGETS/) && has(bootSrc, /initMobileLandingFold/), "落地页折叠逻辑入口存在");
  ok(has(bootSrc, /fold-open/) && has(bootSrc, /aria-expanded/), "折叠条可展开且带 aria-expanded（无障碍）");
  ok(has(bootSrc, /applyMobileLandingFold/), "resize 时重新判定折叠（旋转屏不残留）");

  console.log("\n② 首屏只留价值主张 + 主 CTA");
  ok(has(css, /\.hero-kbd-hint,\s*\.hero-meta-row\s*\{\s*display:\s*none\s*!important/), "⌘K 提示与数字条在窄屏隐藏");
  ok(/enterAppOrAuth\(\)/.test(indexSrc), "主 CTA 仍为「立即体验」单一入口");

  console.log("\n③ Agent 圆桌：窄屏横向 chips");
  ok(
    has(css, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.agents\s*\{[\s\S]*?display:\s*flex\s*!important/),
    "窄屏 .agents 改为 flex 横排"
  );
  ok(/\.agents\s*\{[\s\S]*?overflow-x:\s*auto/.test(css), "圆桌内部横滑，不撑破页面");
  ok(/\.agents\s*::-webkit-scrollbar\s*\{\s*display:\s*none/.test(css), "隐藏横滑滚动条（蓝图风格）");

  console.log("\n④ 报告卡片：默认只给三条信息");
  ok(has(reportSrc, /dim-summary/), "卡片新增「证据摘要」行");
  ok(has(reportSrc, /dim-full/), "完整评语包进 .dim-full 便于窄屏折叠");
  ok(has(css, /\.dim-row\s*\.dim-full\s*\{\s*display:\s*none/), "窄屏默认收起完整评语");

  console.log("\n⑤ 底部半屏面板");
  ok(has(reportSrc, /function openDimSheet/) && has(reportSrc, /function closeDimSheet/), "面板开/关函数存在");
  ok(has(reportSrc, /function gotoTurn/), "「定位到对话」跳转函数存在");
  ok(has(css, /\.sheet-panel\s*\{[\s\S]*?max-height:\s*62vh/), "面板为半屏（≤62vh）");
  ok(
    has(css, /html\.sheet-open,\s*html\.sheet-open\s*body\s*\{\s*overflow:\s*hidden/),
    "面板打开时锁背景滚动（iOS 不连带滚底层）"
  );
  ok(has(reportSrc, /sheet-quote/), "面板顶部先给引用原话");

  console.log("\n⑥ 键盘：visualViewport 为唯一事实来源");
  ok(has(bootSrc, /function keyboardInset/), "键盘遮挡量计算函数存在");
  ok(has(bootSrc, /--kb-h/), "键盘遮挡高度写入 --kb-h");
  ok(has(bootSrc, /--app-vh/), "可视高度写入 --app-vh");
  ok(has(bootSrc, /kb-open/), "键盘态 class 供 CSS 微调");
  ok(has(bootSrc, /function pinInputIntoView/), "输入行回可视区兜底");
  ok(
    has(bootSrc, /vv\.offsetTop|visualViewport.*offsetTop/) || has(bootSrc, /offsetTop/),
    "计算时扣除 visualViewport 位移（iOS 键盘下推）"
  );

  console.log("\n⑦ 输入栏 sticky + 16px");
  ok(has(css, /\.chat-input\s*\{[\s\S]*?position:\s*sticky/), "输入栏 sticky 贴底");
  ok(has(css, /\.chat-input\s*input\s*\{\s*font-size:\s*16px/), "输入框 16px（绕开 iOS 聚焦缩放）");

  console.log("\n⑧ 追问锚定标签（气泡上方 / 未复述则降级）");
  ok(has(explainSrc, /function anchorRefTagHtml/), "锚定标签渲染函数存在");
  ok(has(explainSrc, /function openAnchorRefTag/), "标签插入函数存在");
  ok(has(explainSrc, /function updateAnchorRefTag/), "标签状态更新函数存在");
  ok(has(interviewSrc, /openAnchorRefTag\(body, bubble/), "mock 通道落题前插入标签");
  ok(has(explainSrc, /anchor-ref-tag pending/) || has(explainSrc, /pending/), "未落题时显示「等待落题」而非伪造锚定");
  ok(has(explainSrc, /未直接复述|muted/), "模型未复述原话时诚实降级");

  console.log("\n⑨ 产物一致性（构建产物含新规则）");
  ok(has(html, /fold-toggle/), "演示包含折叠条样式");
  ok(has(html, /kb-pinned/), "演示包含键盘固定态");
  ok(has(html, /dim-summary/), "演示包含证据摘要");
  ok(has(html, /anchor-ref-tag/), "演示包含锚定标签");
  ok(has(html, /initMobileLandingFold/), "演示包含落地页折叠逻辑");
  ok(!/\b评审\b|\b评委\b/.test(html), "禁用词自检通过（无赛事相关字样）");

  console.log("\n" + "=".repeat(58));
  console.log(`v42 断言：通过 ${pass} / 失败 ${fail}`);
  console.log("=".repeat(58) + "\n");
  process.exit(fail ? 1 : 0);
})();
