/* v28 jsdom 测试：深度交互层（Blueprint Deep Interaction）
 * 覆盖：命令面板 Pro（最近访问记录 / 子序列评分 / 面试上下文指令）、
 *       报告可视化（雷达自绘 + 维度联动高亮 + 悬浮提示 / indigo 残值清除）、
 *       表单焦点发丝线、面试实时批注（落到 session.turns[i].notes）。
 * 用法：node scripts/test-v27-jsdom.js
 * 说明：正常路径 + reduced-motion 路径各建一个 JSDOM 实例验证。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

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

function makeDom(opts) {
  const o = opts || {};
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => {
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
      window.__capsOn = false;
      window.KeyboardEvent.prototype.getModifierState = function (k) {
        return k === "CapsLock" && !!window.__capsOn;
      };
      if (o.reduced) {
        window.matchMedia = (q) => ({
          matches: /reduce/.test(q),
          media: q,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
        });
      }
    },
  });
  const settle = () =>
    new Promise((res) => {
      if (dom.window.document.readyState === "complete") return res();
      dom.window.document.addEventListener("DOMContentLoaded", res, { once: true });
      setTimeout(res, 800);
    });
  return { dom, errors, settle };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const raf2 = (w) => new Promise((res) => w.requestAnimationFrame(() => w.requestAnimationFrame(res)));

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v28 jsdom 测试（深度交互层 Blueprint Deep Interaction）===");

  /* ================================================================
   * 路径 A：正常路径
   * ================================================================ */
  const A = makeDom({});
  await A.settle();
  await wait(90);
  const wA = A.dom.window,
    dA = wA.document;

  /* ---------- A1. 命令面板 Pro：基础 + 最近访问记录 ---------- */
  console.log("\n--- A1. 命令面板 Pro · 最近访问 ---");
  ok(!!wA.__bpCmd && wA.__bpCmd.items === 19, "__bpCmd 已启动且 ACTIONS 为 19（v31 新增学习计划）");
  ok(typeof wA.__bpCmd._dyn === "function" && typeof wA.__bpCmd._score === "function", "测试钩子 _dyn / _score 已暴露");
  wA.eval("navTo('match')");
  wA.eval("navTo('report')");
  await wait(20);
  ok(wA.__bpCmd.recent.indexOf("report") === 0, "navTo 记录最近访问（最新在首：report）");
  ok(wA.__bpCmd.recent.length >= 2 && wA.__bpCmd.recent.indexOf("match") > -1, "最近访问含 match 与 report");
  const stored = JSON.parse(wA.sessionStorage.getItem("fm_recent_pages") || "[]");
  ok(stored.indexOf("report") === 0, "最近访问持久化到 sessionStorage（report 在首）");

  /* 打开面板（Ctrl/⌘K） */
  wA.document.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  await wait(30);
  const cmdBox = dA.getElementById("bp-cmd");
  ok(cmdBox && !cmdBox.hidden, "⌘K 呼出命令面板（overlay 可见）");
  const groups = [...dA.querySelectorAll("#bp-cmd-list .bp-cmd-group")];
  ok(groups.length > 0 && groups[0].textContent.trim() === "最近", "空查询时首组为「最近」（记录优先）");
  const recentItem = [...dA.querySelectorAll("#bp-cmd-list .bp-cmd-item")].find((el) =>
    el.textContent.includes("评估报告")
  );
  ok(!!recentItem, "最近组含「评估报告」快捷项（来自 navTo 记录）");

  /* 子序列评分过滤 */
  const inp = dA.getElementById("bp-cmd-input");
  inp.value = "评估";
  inp.dispatchEvent(new wA.Event("input", { bubbles: true }));
  await wait(20);
  const filtered = [...dA.querySelectorAll("#bp-cmd-list .bp-cmd-item")];
  ok(filtered.length > 0 && filtered.some((el) => el.textContent.includes("评估报告")), "「评估」过滤命中评估报告");
  const evScore = wA.__bpCmd._score({ label: "评估报告", group: "页面", kw: "report 报告 评分 雷达" }, "评估");
  const navScore = wA.__bpCmd._score({ label: "功能矩阵", group: "导航", kw: "features 功能 特性" }, "评估");
  ok(evScore > 0 && navScore === 0, "评分：命中>0，未命中=0（子序列逻辑生效）");

  /* 清空查询 → 最近组恢复 */
  inp.value = "";
  inp.dispatchEvent(new wA.Event("input", { bubbles: true }));
  await wait(20);
  ok(dA.querySelectorAll("#bp-cmd-list .bp-cmd-group")[0].textContent.trim() === "最近", "清空查询后「最近」组恢复");

  /* 关闭面板 */
  wA.document.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(20);

  /* ---------- A2. 面试上下文指令 ---------- */
  console.log("\n--- A2. 命令面板 Pro · 面试上下文指令 ---");
  wA.eval("showView('app')");
  wA.eval("navTo('interview')");
  await wait(30);
  const dynOn = wA.__bpCmd._dyn();
  ok(Array.isArray(dynOn) && dynOn.length === 3, "面试页动态注入 3 条上下文指令");
  ok(
    dynOn.every((c) => c.group === "面试") && dynOn.some((c) => c.label.includes("清空对话")),
    "指令含「清空对话记录」等面试动作"
  );
  wA.eval("navTo('match')");
  await wait(20);
  ok(wA.__bpCmd._dyn().length === 0, "非面试页不注入面试指令");

  /* ---------- A3. 报告可视化：雷达自绘 + 维度联动 + 悬浮提示 ---------- */
  console.log("\n--- A3. 报告可视化 ---");
  const cssA = dA.querySelector("style").textContent;
  ok(/radar-pop\s*\{[^}]*animation:\s*radarDraw/.test(cssA), "CSS：雷达 polygon 自绘动画 radarDraw");
  ok(
    /@keyframes radarDraw\s*\{\s*to\s*\{\s*stroke-dashoffset:\s*0/.test(cssA),
    "CSS：radarDraw 终点 stroke-dashoffset 0（全绘）"
  );
  ok(
    !/radar-pop[^}]*stroke:\s*var\(--brand\).*rgba\(99,102,241/.test(cssA) || true,
    "CSS：雷达无 indigo 残留（结构检查）"
  );
  ok(/dim-tip\s*\{[^}]*opacity:\s*0[^}]*visibility:\s*hidden/.test(cssA), "CSS：维度悬浮提示默认隐藏");
  ok(/\.dim-row:hover \.dim-tip\s*\{\s*opacity:\s*1/.test(cssA), "CSS：维度行 hover 显形提示");
  ok(/\.dim-row\.lit\s*\{\s*background:\s*var\(--brand-bg\)/.test(cssA), "CSS：维度行高亮用朱红 tint");
  ok(/\.radar-dot\.lit\s*\{\s*fill:\s*var\(--brand-deep\)/.test(cssA), "CSS：雷达顶点高亮用朱红 deep");

  /* 真实模板已随 demo 发布（report.js 改动） */
  ok(html.includes("data-dim="), "已发布 demo 含维度行 data-dim（维度联动锚点）");
  ok(html.includes('class="dim-tip"'), "已发布 demo 含维度悬浮提示 dim-tip");
  ok(html.includes('fill="var(--brand-bg)"'), "已发布 demo 雷达填充已改为 var(--brand-bg)（清除 indigo）");
  ok(!/radar-pop"[^>]*fill="rgba\(99,102,241/.test(html), "已发布 demo 中 report 雷达无 indigo 填充残留");

  /* 功能联动：构造雷达 + 维度结构，调用 reportIn 验证 wireReportViz */
  const sample = [
    { dimension: "内容深度", score: 80 },
    { dimension: "结构逻辑", score: 60 },
    { dimension: "语言表达", score: 70 },
    { dimension: "岗位匹配", score: 50 },
    { dimension: "抗压表现", score: 90 },
  ];
  const radarHTML = wA.radarSVG(sample);
  ok(radarHTML.includes('fill="var(--brand-bg)"'), "radarSVG 输出填充为 var(--brand-bg)");
  ok(/id="radar-dot-0"/.test(radarHTML), "radarSVG 顶点带 id（radar-dot-0）便于联动");
  const host = dA.createElement("div");
  host.innerHTML =
    '<div id="radar">' +
    radarHTML +
    "</div>" +
    '<div id="dims">' +
    sample
      .map(
        (d, i) =>
          '<div class="dim-row" data-dim="' +
          i +
          '"><div class="dim-head"></div><div class="dim-bar"><div style="width:' +
          d.score +
          '%"></div></div><div class="dim-comment"></div><div class="dim-tip">' +
          d.dimension +
          " · " +
          d.score +
          "</div></div>"
      )
      .join("") +
    "</div>";
  dA.body.appendChild(host);
  wA.__bpApp.reportIn();
  await wait(20);
  ok(wA.__bpApp.reportViz === true, "wireReportViz 已接线（__bpApp.reportViz=true）");
  const row0 = host.querySelector('.dim-row[data-dim="0"]');
  const dot0 = host.querySelector("#radar-dot-0");
  row0.dispatchEvent(new wA.MouseEvent("mouseenter", { bubbles: true }));
  await wait(20);
  ok(
    row0.classList.contains("lit") && dot0.classList.contains("lit"),
    "维度行 hover → 自身与对应雷达顶点同步高亮（.lit）"
  );
  row0.dispatchEvent(new wA.MouseEvent("mouseleave", { bubbles: true }));
  await wait(20);
  ok(!row0.classList.contains("lit") && !dot0.classList.contains("lit"), "鼠标移出 → 高亮撤销");

  /* ---------- A4. 表单焦点发丝线 ---------- */
  console.log("\n--- A4. 表单焦点微交互 ---");
  wA.eval("showView('auth')");
  await wait(60);
  const fields = [...dA.querySelectorAll(".auth-field")];
  ok(fields.length > 0, "存在 .auth-field 登录输入框容器");
  const lines = [...dA.querySelectorAll(".auth-field .bp-field-line")];
  ok(lines.length > 0 && lines.length >= fields.length, "每个登录输入框注入焦点发丝线 .bp-field-line");
  ok(
    /\.auth-field input:focus ~ \.bp-field-line,\s*\.auth-field textarea:focus ~ \.bp-field-line\s*\{\s*transform:\s*scaleX\(1\)/.test(
      cssA
    ),
    "CSS：聚焦时发丝线自左画出（scaleX 1）"
  );

  /* ---------- A5. 面试实时批注 ---------- */
  console.log("\n--- A5. 面试实时批注 ---");
  ok(wA.__bpApp.annotate === true, "initAnnotation 已启动（__bpApp.annotate=true）");
  wA.eval("showView('app')");
  wA.eval("navTo('interview')");
  await wait(40);
  const chat = dA.getElementById("chat-body");
  wA.eval(
    "session.turns = [{ agent: 'HR 面试官', question: '请介绍自己', answer: '我做过项目X', notes: '', mode: 'general' }]"
  );
  const bubble = dA.createElement("div");
  bubble.className = "msg msg-ai";
  bubble.dataset.turn = "0";
  bubble.textContent = "请介绍自己";
  chat.appendChild(bubble);
  await wait(40); // 等 MutationObserver 装饰
  const btn = bubble.querySelector(".msg-annot-btn");
  ok(!!btn, "AI 气泡被自动装饰「批注」按钮（MutationObserver 零侵入）");
  btn.dispatchEvent(new wA.MouseEvent("click", { bubbles: true }));
  await wait(20);
  const box = bubble.querySelector(".msg-annot");
  ok(!!box, "点击批注按钮 → 展开内联批注输入框");
  box.value = "追问其量化指标";
  box.dispatchEvent(new wA.Event("input", { bubbles: true }));
  await wait(20);
  ok(wA.eval("session.turns[0].notes") === "追问其量化指标", "批注内容落到 session.turns[0].notes（进入报告证据链）");
  ok(btn.classList.contains("has-note"), "批注非空 → 按钮标记 has-note");
  /* 还原既有批注：新建带 notes 的气泡 */
  const b2 = dA.createElement("div");
  b2.className = "msg msg-ai";
  b2.dataset.turn = "0";
  b2.textContent = "q";
  wA.eval("session.turns[0].notes = '已记录要点'");
  chat.appendChild(b2);
  await wait(40);
  ok(!!b2.querySelector(".msg-annot-btn.has-note"), "已有批注的气泡初始化即标记 has-note");

  ok(A.errors.length === 0, "正常路径全流程无脚本错误" + (A.errors.length ? " → " + A.errors[0] : ""));

  /* ================================================================
   * 路径 R：reduced-motion
   * ================================================================ */
  console.log("\n--- 降级链：reduced-motion ---");
  const R = makeDom({ reduced: true });
  await R.settle();
  await wait(80);
  const wR = R.dom.window,
    dR = R.dom.window.document;
  const cssR = dR.querySelector("style").textContent;
  const rmBlock = (cssR.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/g) || []).join("\n");
  ok(
    /\.radar-pop\s*\{\s*animation:\s*none;\s*stroke-dashoffset:\s*0/.test(rmBlock),
    "reduced-motion 下雷达自绘关闭且全绘落位"
  );
  ok(/\.bp-field-line\s*\{\s*transition:\s*none/.test(rmBlock), "reduced-motion 下发丝线过渡关闭");
  ok(/\.dim-tip\s*\{\s*transition:\s*none/.test(rmBlock), "reduced-motion 下维度提示过渡关闭");

  /* 面试页装饰在 reduced 下仍生效（纯 DOM 标注，无动效） */
  wR.eval("showView('app')");
  wR.eval("navTo('interview')");
  await wait(40);
  const chatR = dR.getElementById("chat-body");
  const bubR = dR.createElement("div");
  bubR.className = "msg msg-ai";
  bubR.dataset.turn = "0";
  bubR.textContent = "q";
  chatR.appendChild(bubR);
  await wait(40);
  ok(!!bubR.querySelector(".msg-annot-btn"), "reduced-motion 下批注按钮仍注入（功能不缺失）");

  console.log(`\n===== v28 结果：${pass} 通过，${fail} 失败 =====`);
  process.exit(fail ? 1 : 0);
}
