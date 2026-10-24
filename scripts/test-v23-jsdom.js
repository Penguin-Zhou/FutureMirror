/* v23 jsdom 测试：体验层增强（UX Kit）——印刷揭载渐入 / 动效宪法 / 打字指示器 / 空状态 / 滚动进度线 / 按压与焦点反馈
 * 用法：NODE_PATH=<managed-node-workspace>/node_modules node scripts/test-v23-jsdom.js
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

setTimeout(runTests, 300);

function runTests() {
  console.log("\n=== v23 jsdom 测试（体验层 UX Kit）===");

  ok(errors.length === 0, "页面脚本加载无错误" + (errors.length ? " → " + errors.slice(0, 3).join(" | ") : ""));

  const css = document.querySelector("style").textContent;
  const has = (sel) => css.includes(sel);

  /* ---------- A. 渐入气质：印刷揭载（零 transform 上浮） ---------- */
  ok(!/\.reveal\s*\{[^}]*translateY/.test(css), ".reveal 不再使用 translateY 上浮（Arkira 残留已清除）");
  ok(/\.reveal\s*\{[^}]*clip-path:\s*inset\(14px 0 0 0\)/.test(css), ".reveal 使用 clip-path 自上而下揭载");
  ok(/\.reveal\.in\s*\{[^}]*clip-path:\s*inset\(0 0 0 0\)/.test(css), ".reveal.in 揭载完成态 inset(0)");
  ok(
    /@keyframes viewIn\s*\{\s*from\s*\{\s*opacity:\s*0;?\s*\}/.test(css) && !/viewIn[\s\S]{0,120}translateY/.test(css),
    "视图切换 viewIn 退化为纯淡入（无上浮）"
  );

  /* ---------- B. 动效宪法：平滑滚动 + 触屏 + reduced-motion 全局覆盖 ---------- */
  ok(/html\s*\{\s*scroll-behavior:\s*smooth/.test(css), "html 平滑滚动（锚点跳转体验）");
  ok(has("-webkit-tap-highlight-color: transparent"), "触屏去掉蓝色高亮闪烁");
  const rmBlock = (css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/g) || []).join("\n");
  ok(/animation-duration:\s*\.01ms\s*!important/.test(rmBlock), "reduced-motion 全局动画瞬时化");
  ok(/transition-duration:\s*\.01ms\s*!important/.test(rmBlock), "reduced-motion 全局过渡瞬时化");
  ok(/scroll-behavior:\s*auto/.test(rmBlock), "reduced-motion 下关闭平滑滚动");

  /* ---------- C. 打字指示器 ---------- */
  ok(/\.typing-dots\s*\{[^}]*display:\s*inline-flex/.test(css), ".typing-dots 三点容器已定义");
  ok(/@keyframes typingBlink/.test(css), "typingBlink 脉冲关键帧已定义");
  ok(
    /\.typing-dots i:nth-child\(2\)\s*\{[^}]*animation-delay/.test(css) &&
      /\.typing-dots i:nth-child\(3\)\s*\{[^}]*animation-delay/.test(css),
    "三点 stagger 延迟（.18s/.36s）"
  );
  ok(/\.msg-typing/.test(css), ".msg-typing 气泡样式已定义");
  ok(/\.typing-dots i\s*\{[^}]*animation:\s*none/.test(rmBlock), "reduced-motion 下墨点停止脉冲");

  /* ---------- D. 空状态 ---------- */
  ok(/\.empty-state\s*\{[^}]*border:\s*1px dashed/.test(css), ".empty-state 虚线发丝框");
  ok(
    /\.empty-state \.es-eyebrow/.test(css) &&
      /\.empty-state \.es-title/.test(css) &&
      /\.empty-state \.es-desc/.test(css),
    "空状态三段式结构（眉标/衬线标题/描述）"
  );
  ok(/\.empty-state \.es-chip:hover\s*\{[^}]*background:\s*var\(--ink\)/.test(css), "建议 chip hover 墨色反转");
  ok(/\.empty-state \.es-chip:focus-visible/.test(css), "建议 chip 键盘焦点环");

  /* ---------- E. 滚动进度线 ---------- */
  ok(/\.bp-progress\s*\{[^}]*position:\s*fixed/.test(css), ".bp-progress fixed 顶置");
  ok(/\.bp-progress\s*\{[^}]*background:\s*var\(--brand\)/.test(css), "进度线为朱红");
  ok(/\.bp-progress\s*\{[^}]*transform:\s*scaleX\(0\)/.test(css), "进度线初始 scaleX(0)");
  ok(/\.bp-progress\s*\{\s*display:\s*none/.test(rmBlock), "reduced-motion 下隐藏进度线");

  /* ---------- F. 按钮反馈：按压 + 焦点双圈 ---------- */
  ok(
    /\.btn:active:not\(:disabled\)\s*\{[^}]*transform:\s*translateY\(1px\)/.test(css),
    "按钮按压反馈 1px（非悬浮上浮）"
  );
  ok(
    /\.btn:focus-visible\s*\{[^}]*box-shadow:\s*0 0 0 4px var\(--brand-bg\)/.test(css),
    "按钮键盘焦点双圈（朱红外圈 + 品牌底光环）"
  );

  /* ---------- G. Toast 划入 ---------- */
  ok(/#toast\s*\{[^}]*border-left:\s*3px solid var\(--brand\)/.test(css), "Toast 左侧朱红竖线");
  ok(/@keyframes toastIn/.test(css), "toastIn 划入关键帧");
  ok(/#toast\.show\s*\{[^}]*animation:\s*toastIn/.test(css), "Toast 显示时划入动画");

  /* ---------- H. JS 交互：进度线 / 打字指示器 / 建议填充 ---------- */
  ok(window.eval("typeof initScrollProgress") === "function", "initScrollProgress 函数已定义");
  ok(window.eval("document.querySelectorAll('.bp-progress').length") === 1, "页面初始化后自动注入 1 个进度线");
  ok(
    window.eval("document.querySelector('.bp-progress').getAttribute('aria-hidden')") === "true",
    "进度线对辅助技术隐藏（aria-hidden）"
  );
  window.eval("initScrollProgress()");
  ok(window.eval("document.querySelectorAll('.bp-progress').length") === 1, "重复调用幂等（不叠加）");

  ok(
    window.eval("typeof showTyping") === "function" && window.eval("typeof hideTyping") === "function",
    "showTyping/hideTyping 已定义"
  );
  window.eval("showTyping('生成追问中')");
  ok(window.eval("!!document.getElementById('typing-row')"), "showTyping 注入 #typing-row");
  ok(window.eval("document.querySelectorAll('#typing-row .typing-dots i').length") === 3, "指示器含 3 个墨点");
  ok(
    window.eval("document.querySelector('#typing-row .typing-label').textContent") === "生成追问中",
    "指示器标签文案正确"
  );
  window.eval("showTyping('模型生成中')");
  ok(window.eval("document.querySelectorAll('#typing-row').length") === 1, "重复 showTyping 不叠加（先清后建）");
  window.eval("hideTyping()");
  ok(window.eval("document.querySelectorAll('#typing-row').length") === 0, "hideTyping 移除指示器");

  ok(window.eval("typeof fillChatSuggestion") === "function", "fillChatSuggestion 已定义");
  window.eval("fillChatSuggestion('请面试我')");
  ok(window.eval("document.getElementById('chat-input').value") === "请面试我", "建议 chip 文案填入输入框");

  /* ---------- I. 空状态接线（boot 初始态，查 JS 产物原文） ---------- */
  ok(
    html.includes("empty-state") && html.includes("es-eyebrow") && html.includes("READY · 面试待开始"),
    "boot 初始态为空状态引导（面试页）"
  );
  ok(/fillChatSuggestion\('我是计算机专业应届生/.test(html), "空状态含可点击建议 chip");
  ok(/<kbd>Enter<\/kbd>/.test(html) && /<kbd>Ctrl\/⌘\+K<\/kbd>/.test(html), "空状态含快捷键提示");
  ok(/if \(!session\.turns\.length\)/.test(html), "有历史会话时不渲染空态（restoreSession 独占）");

  console.log(`\n===== v23 结果：${pass} 通过，${fail} 失败 =====`);
  process.exit(fail ? 1 : 0);
}
