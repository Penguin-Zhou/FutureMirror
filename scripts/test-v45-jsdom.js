/* v45 · 交互确定性层断言
 *
 * 界面漂亮到一定程度之后，剩下的风险不在「有没有」，而在「点了之后多久有反应」。
 * 这一版只处理三件事：
 *   ① 按下必须当帧可见（绕开 transition，不等 DOM 重建）；
 *   ② 评分理由与引用原话绑成一个折不断的证据单元；
 *   ③ 窄屏 / 减弱动效 / 低端机上，装饰性描边一次性落位，功能反馈照旧。
 * 另外给一处现场读数（window.__bpPerf），让「快不快」可以被量出来而不是被感觉。
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
function done() {
  console.log("\n结果：" + pass + " 通过，" + fail + " 失败");
  /* jsdom 的 rAF 循环会让进程常驻，收尾必须显式退出 */
  process.exit(fail ? 1 : 0);
}

const demoHtml = rd("public/futuremirror-demo.html");
const perfSrc = rd("frontend/js/core/perf.js");
const reportSrc = rd("frontend/js/features/report.js");
const mbtiSrc = rd("frontend/js/features/mbti.js");
const cssSrc = rd("frontend/css/pages.css");
const indexSrc = rd("frontend/index.html");

const v45Start = cssSrc.indexOf("v45 · 交互确定性层");
const v45 = v45Start >= 0 ? cssSrc.slice(v45Start) : "";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkDom = (beforeParse) =>
  new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse,
  });

const dom = mkDom();
const w = dom.window;
const ev = (code) => w.eval(code);

(async function run() {
  /* ---------- ① 让帧与设备分档 ---------- */
  console.log("\n① 让帧与设备分档");
  ok(v45.length > 200, "v45 样式区块存在");
  ok(typeof ev("perfTier") === "function", "存在设备分档函数");
  ok(typeof ev("yieldToMain") === "function", "存在让帧函数 yieldToMain");
  ok(/window\.scheduler/.test(perfSrc) && /scheduler\.yield\(\)/.test(perfSrc), "优先用 scheduler.yield 让出长任务");
  ok(/setTimeout\(r,\s*0\)/.test(perfSrc), "不支持 scheduler 时回落 setTimeout(0)");
  {
    const p = ev("yieldToMain")();
    ok(p && typeof p.then === "function", "yieldToMain 返回可等待对象");
    let resumed = false;
    await p.then(() => {
      resumed = true;
    });
    ok(resumed === true, "让帧后回调确实执行（不会卡死交互）");
  }
  ok(ev("__bpPerf") && typeof ev("__bpPerf").summary === "function", "暴露 __bpPerf.summary 现场读数");
  {
    const s = ev("__bpPerf").summary();
    ok(
      ["tier", "events", "p50", "p98", "worst", "longTasks", "longWorst"].every(
        (k) => typeof s[k] === "number" || typeof s[k] === "string"
      ),
      "读数包含 p50 / p98 / 最差 / 长任务计数"
    );
    ok(s.tier === "high" || s.tier === "low", "档位只分 high / low 两档");
  }
  ok(/type:\s*"longtask"/.test(perfSrc), "观察长任务（INP 恶化的主因）");
  ok(/type:\s*"event"/.test(perfSrc) && /durationThreshold/.test(perfSrc), "观察交互事件时序（对应 INP 口径）");
  ok(!/localStorage|fetch\(|XMLHttpRequest|navigator\.sendBeacon/.test(perfSrc), "读数只留本地，不上报任何内容");

  /* 低端机档位：另起一个文档，把核心数压到 2 */
  {
    const domLow = mkDom((win) => {
      Object.defineProperty(win.navigator, "hardwareConcurrency", { value: 2, configurable: true });
    });
    const wl = domLow.window;
    ok(wl.eval("perfTier")() === "low", "核心数 ≤4 判为低端档");
    ok(
      wl.document.documentElement.classList.contains("perf-low"),
      "低端档自动挂 html.perf-low（样式侧据此停用装饰动画）"
    );
    ok(/html\.perf-low \.radar-pop/.test(v45), "低端档关闭雷达描边动画");
    ok(/html\.perf-low \.dim-bar > div/.test(v45), "低端档关闭维度条生长过渡");
    wl.close();
  }

  /* ---------- ② 按压确认 ---------- */
  console.log("\n② 按压确认：手指落下那一帧就要有变化");
  ok(typeof ev("markTap") === "function", "存在统一的按压标记函数");
  {
    const box = w.document.createElement("div");
    box.className = "dim-row";
    w.document.body.appendChild(box);
    ev("markTap")(box);
    ok(box.classList.contains("tapped"), "按下即挂 tapped（同步，不等渲染）");
    await sleep(240);
    ok(!box.classList.contains("tapped"), "180ms 后自动撤销，不残留选中感");
    box.remove();
  }
  ok(/\.mbti-opt:active,[\s\S]{0,240}transition:\s*none/.test(v45), "MBTI 选项按下态无过渡（任何设备当帧到位）");
  ok(/\.mbti-opt\.picked/.test(v45), "已选项有独立的 picked 态（重渲染前先表态）");
  ok(/\.dim-row\.tapped/.test(v45), "维度卡按下态有独立类");
  ok(/touch-action:\s*manipulation/.test(v45), "去掉双击缩放等待（触控响应不被延迟）");
  ok(/box-shadow:\s*inset\s+3px 0 0 var\(--brand\)/.test(v45), "按下用内嵌竖条示意，不位移、不重排");
  {
    /* 零投影纪律：允许的唯一「阴影」是 inset 内嵌色条（不产生投影、不占布局） */
    const shadows = v45.match(/box-shadow:[^;]+/g) || [];
    ok(shadows.length > 0 && shadows.every((s) => /inset/.test(s)), "仍然零投影（只允许 inset 内嵌色条）");
  }
  ok(!/border-radius:\s*(?!0)[1-9]/.test(v45), "仍然全直角");

  /* ---------- ③ 证据单元绑定 ---------- */
  console.log("\n③ 证据绑定：理由与引文折不断");
  ok(/class="ev-unit"/.test(reportSrc), "面板把「原话 + 理由」收进同一个 ev-unit");
  {
    ev(
      "lastReportData = { dims: [{ dimension: '表达结构', score: 72, comment: '理由是这条' }], lensViews: { items: [] } }"
    );
    ev("lastDimEvidence = [{ quote: '原话样本', turn: 1, from: '技术面', note: '' }]");
    const html = ev("dimSheetHtml")(0);
    const iUnit = html.indexOf("ev-unit");
    const iQuote = html.indexOf("sq-lead");
    const iReason = html.indexOf("评分理由");
    const iBody = html.indexOf("sheet-body");
    ok(iUnit > -1 && iQuote > iUnit, "原话落在证据单元内部");
    ok(iReason > iQuote && iReason < iBody, "理由紧跟原话，且都在证据单元里（不是分居两段）");
    ok(/ev-label/.test(html), "理由上方有一句「由上句得出」说明因果");
    ok(html.indexOf("sheet-body") > html.indexOf("sh-reason"), "两位面试官判断在证据单元之后，不与理由混排");
  }
  ok(/\.ev-unit\s*\{[^}]*border-left:\s*2px solid var\(--brand\)/.test(v45), "证据单元用一条左色条贯穿");
  ok(/\.ev-unit \.sheet-quote\s*\{[^}]*background:\s*transparent/.test(v45), "引文底色并入单元（不再是一个独立色块）");
  ok(
    /\.dim-row\.expanded \.dim-summary,\s*\.dim-row\.expanded \.dim-full\s*\{[^}]*border-left:\s*2px solid var\(--brand\)[^}]*background:\s*var\(--brand-bg\)/.test(
      v45
    ),
    "展开态下摘要与理由共用同一条色条与同一底色（桌面端同样绑定）"
  );

  /* ---------- ④ 面板装配让帧 ---------- */
  console.log("\n④ 面板装配不让输入帧背重活");
  ok(/function mountDimSheetShell/.test(reportSrc), "面板先挂「轻壳」（遮罩 + 标题 + 占位行）");
  ok(/function fillDimSheet/.test(reportSrc), "真实内容单独填充");
  ok(
    /yieldToMain\(\)\.then\(function \(\) \{\s*fillDimSheet\(idx\);/.test(reportSrc),
    "内容填充让出一帧，输入帧不夹带 innerHTML 重活"
  );
  ok(!/yieldToMain\(\)\.then\(mount\)/.test(reportSrc), "不再把整块面板一起推到下一帧（那样面板会晚一帧才出现）");
  ok(/dimSheetIdx/.test(reportSrc), "记录当前挂着的维度");
  ok(
    /if \(dimSheetEl && !dimSheetEl\.hidden && dimSheetIdx === idx\) return;/.test(reportSrc),
    "连点同一张卡不重复装配"
  );
  {
    Object.defineProperty(w, "matchMedia", {
      configurable: true,
      value: (q) => ({
        matches: /max-width:\s*640px/.test(q),
        media: q,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
      }),
    });
    ev("openDimSheet")(0, null);
    ok(ev("dimSheetIdx") === 0, "点击后立即记录目标维度");
    /* 轻壳是同步挂的：这一步返回时面板已经出现在 DOM 里（同帧可见） */
    const shell = w.document.querySelector(".sheet .sheet-panel");
    ok(!!shell && w.document.querySelector(".sheet").hidden === false, "按下这一帧面板就已出现（不等下一帧）");
    ok(!!w.document.querySelector(".sheet .sheet-ghost"), "壳里先给占位行，不是空白面板");
    await sleep(60);
    ok(!!w.document.querySelector(".sheet .ev-unit"), "下一任务后内容填进来，能看到证据单元");
    ok(!w.document.querySelector(".sheet .sheet-ghost"), "占位行被真实内容替换，不残留");
    ev("openDimSheet")(0, null);
    await sleep(30);
    ok(w.document.querySelectorAll(".sheet").length === 1, "同一张卡连点不会叠出第二个面板");
    ev("closeDimSheet")();
    ok(ev("dimSheetIdx") === -1, "关闭后清空当前维度记录");
  }

  /* ---------- ④b 令牌与溢出（实拍发现的两处真实缺陷） ---------- */
  console.log("\n④b 令牌与溢出");
  {
    /* 面板底色曾写成 var(--paper)，而这枚令牌在主题里从未定义 → 面板一直是透明的，
     * 内容稍多就与背后的页面叠字。这里用「引用必须有定义」兜住同类问题。 */
    const allCss = rd("frontend/css/tokens.css") + rd("frontend/css/theme.css") + cssSrc;
    const defined = new Set();
    allCss.replace(/(--[a-z0-9-]+)\s*:/g, (m, n) => defined.add(n));
    /* 这些由 JS 运行时写在元素 style 上，不在样式表里定义 */
    const runtime = ["--app-vh", "--kb-h", "--hdr-h", "--mx", "--my", "--bp-i", "--sec-i", "--ws-i"];
    const missing = [];
    allCss.replace(/var\(\s*(--[a-z0-9-]+)/g, (m, n) => {
      if (!defined.has(n) && runtime.indexOf(n) < 0 && missing.indexOf(n) < 0) missing.push(n);
      return m;
    });
    ok(missing.length === 0, "样式引用的令牌都有定义" + (missing.length ? "（缺：" + missing.join(", ") + "）" : ""));
    ok(!/var\(--paper\)/.test(allCss), "不再引用未定义的 --paper");
    ok(/\.sheet-panel \{[^}]*background: var\(--card\)/.test(cssSrc), "面板底色走 --card（不再透明叠字）");
    ok(/\.sheet-panel \{[^}]*overflow: hidden/.test(cssSrc), "面板自身裁切，内容不从边缘溢出");
    ok(/\.sheet-scroll \{[^}]*overflow-y: auto/.test(cssSrc), "证据单元与正文同处一个可滚区域");
    const html = ev("dimSheetHtml")(0);
    ok(
      html.indexOf("sheet-scroll") > -1 &&
        html.indexOf("sheet-scroll") < html.indexOf("ev-unit") &&
        html.indexOf("sheet-scroll") < html.indexOf("sheet-body"),
      "面板结构为 head → scroll(证据单元 + 正文) → actions"
    );
  }

  /* ---------- ⑤ 动效降级 ---------- */
  console.log("\n⑤ 装饰动画降级，功能反馈保留");
  ok(
    /@media \(prefers-reduced-motion: reduce\), \(max-width: 640px\)\s*\{[\s\S]{0,400}\.radar-pop\s*\{\s*animation:\s*none;\s*stroke-dashoffset:\s*0/.test(
      v45
    ),
    "窄屏与减弱动效下雷达描边一次性落位"
  );
  ok(/html\.perf-calm \.radar-pop/.test(v45), "同一声明覆盖「减弱动效」类（与媒体查询共用判据）");
  ok(
    /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,400}\.dim-bar > div \{ transition: none/.test(v45),
    "窄屏不再逐像素长维度条"
  );
  {
    const activeRule = v45.slice(v45.indexOf(".dim-row:active"), v45.indexOf(".dim-row:active") + 200);
    ok(/background:\s*var\(--brand-bg\)/.test(activeRule), "按下反馈没有被一起降级掉（仍是即时可见的底色）");
  }
  ok(
    /\.sheet-panel,\s*\n?\s*\.sheet-body \{ overscroll-behavior: contain/.test(v45) ||
      /overscroll-behavior:\s*contain/.test(v45),
    "面板滚动不传染底层页面"
  );
  ok(/\.sheet-close \{[^}]*width:\s*44px;[^}]*height:\s*44px/.test(cssSrc.replace(/\n/g, " ")), "关闭按钮触控区 ≥44px");

  /* ---------- ⑥ MBTI 换题的确认感 ---------- */
  console.log("\n⑥ MBTI 换题：先确认再换页");
  ok(/function scheduleMbtiQuestion/.test(mbtiSrc), "换题渲染独立成可合并的调度函数");
  ok(/mbtiRenderPending/.test(mbtiSrc), "同一帧内只重建一次 DOM");
  ok(/onclick="answerMbti\(\$\{s\.v\}, this\)"/.test(mbtiSrc), "选项把自身传给处理器（才能立刻标记按下）");
  ok(/aria-pressed="false"/.test(mbtiSrc), "选项带 aria-pressed，读屏也能感知选中");
  {
    ev("startMbti")();
    const before = ev("$")("mbti-quiz").innerHTML;
    ok(/aria-pressed/.test(before), "渲染出的选项带按压语义");
    ev(
      "const __r=renderMbtiQuestion; window.__renderCount=0; renderMbtiQuestion=function(){window.__renderCount++;return __r.apply(null,arguments);}"
    );
    ev("answerMbti")(2);
    ev("answerMbti")(-1);
    ok(ev("getMbtiDraft")().i === 2, "状态同步推进（每答一题即落盘不受渲染节奏影响）");
    await sleep(60);
    ok(ev("window.__renderCount") === 1, "同一帧连点只重建一次答题区");
    ok(/已完成 2\/20/.test(ev("$")("mbti-quiz").innerHTML), "界面停在第 3 题，进度连续");
    ev("cancelMbti")();
  }

  /* ---------- ⑦ 接线与产物一致 ---------- */
  console.log("\n⑦ 接线与产物");
  ok(/<script src="js\/core\/perf.js"><\/script>/.test(indexSrc), "模块在 index.html 注册");
  ok(/js\/core\/perf\.js/.test(rd("frontend/build-manifest.json")), "构建清单包含新模块");
  ok(/v45 · 交互确定性层/.test(demoHtml), "演示页已合入该层（横幅存在）");
  ok(/window\.__bpPerf/.test(demoHtml), "演示页内可现场读数");
  ok(/markTap\(trigger\)/.test(reportSrc), "点击处理器第一件事是给出按压确认");

  done();
})().catch((e) => {
  console.error("测试异常：" + (e && e.stack ? e.stack : e));
  process.exit(1);
});
