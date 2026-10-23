/* v30 jsdom 测试：完整性补全层（Beta 1.1.0）
 * 覆盖：① 骨架屏（挂载/幂等/最小驻留/真实接入）
 *       ② 媒体：懒加载 + 渐进 blur-up + 悬停/聚焦预览 + Esc
 *       ③ 表格导出 Excel（.xls，BOM + vnd.ms-excel）
 *       ④ 实时看板 WebSocket（优先 WS，失败降级 REST 轮询）
 *       ⑤ 图表悬停详情（[data-tip] 统一接管，鼠标与键盘双通道）
 *       ⑥ 键盘可达性（跳到主内容 / 弹窗焦点陷阱 / aria-modal）
 * 用法：node scripts/test-v30-jsdom.js
 * 说明：正常路径 + reduced-motion 路径 + WebSocket mock 路径分别验证。
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
        if (base) { try { return base.call(window, q); } catch (e) {} }
        return mk(q, false);
      };
      if (o.ws) {
        window.__wsInstances = [];
        window.WebSocket = function (url) {
          this.url = url;
          this.readyState = 0;
          this.sent = [];
          this.send = d => this.sent.push(d);
          this.close = () => { this.readyState = 3; if (this.onclose) this.onclose({ code: 1000 }); };
          window.__wsInstances.push(this);
        };
      }
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
  console.log("\n=== v30 jsdom 测试（完整性补全层 · Beta 1.1.0）===");

  /* ================================================================
   * 路径 A：正常路径
   * ================================================================ */
  const A = makeDom({});
  await A.settle();
  await wait(150);
  const wA = A.dom.window, dA = wA.document;

  /* ---------- A1. 骨架屏 ---------- */
  console.log("\n--- A1. 骨架屏（占位 · 防抖 · 最小驻留）---");
  ok(!!wA.__bpSkeleton, "__bpSkeleton 模块已挂载");
  ok(/\.bp-skel\s*\{/.test(CSS), "CSS：.bp-skel 骨架容器已定义");
  ok(/\.skeleton\s*\{/.test(CSS), "CSS：.skeleton 占位块已定义（脉冲呼吸）");
  ok(/bpSkeleton\(box,/.test(html), "真实接入：报告页服务端评分前挂载骨架");

  const host = dA.createElement("div");
  dA.body.appendChild(host);
  const sk = wA.__bpSkeleton.mount(host, { rows: 3, cols: 2, minDwell: 400 });
  ok(!!sk && sk.blocks === 6, "mount() 生成 3×2 = 6 个占位块");
  ok(!!host.querySelector(".bp-skel"), "骨架容器挂载到目标节点");
  ok(host.querySelectorAll(".skeleton").length === 6, "占位块使用 .skeleton 类（复用既有脉冲样式）");
  ok(wA.__bpSkeleton.mount(host, { rows: 1 }) === sk, "重复 mount 幂等（同一容器不叠加）");
  ok(wA.__bpSkeleton.pending() >= 1, "pending() 记录在场的骨架数量");
  const before = host.querySelector(".bp-skel");
  sk.clear();                                  // 未到最小驻留：应延迟移除
  ok(!!host.querySelector(".bp-skel"), "最小驻留内调用 clear 不立即移除（防闪烁）");
  sk.clear(true);                              // 强制立即移除
  ok(!host.querySelector(".bp-skel") && before !== null, "clear(true) 立即移除占位");
  ok(wA.__bpSkeleton.pending() === 0, "清除后 pending 归零");

  const host2 = dA.createElement("div");
  dA.body.appendChild(host2);
  wA.__bpSkeleton.during(host2, { rows: 2, cols: 1, minDwell: 0 }, () => 42);
  await wait(30);
  ok(host2.querySelectorAll(".skeleton").length === 0, "during() 同步任务结束后自动清除骨架");

  /* ---------- A2. 媒体：懒加载 / 渐进 / 悬停预览 ---------- */
  console.log("\n--- A2. 媒体懒加载 · 渐进加载 · 悬停预览 ---");
  ok(!!wA.__bpMedia, "__bpMedia 模块已挂载");
  ok(/\.bp-media\s*\{/.test(CSS) && /\.bp-media\.bp-media-in\s*\{/.test(CSS), "CSS：渐进加载（blur → 淡入）已定义");
  ok(/\.bp-preview\s*\{/.test(CSS) && /\.bp-preview\.show\s*\{/.test(CSS), "CSS：悬停预览浮层已定义");

  const lazyBox = dA.createElement("div");
  dA.body.appendChild(lazyBox);
  lazyBox.innerHTML =
    '<img id="im1" alt="a" data-src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E">' +
    '<img id="im2" alt="b" data-src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E" data-src-sm="data:image/svg+xml,%3Csvg/%3E">';
  const nLazy = wA.__bpMedia.initLazy(lazyBox);
  ok(nLazy === 2, "initLazy 接管 2 个 data-src 媒体");
  const im1 = dA.getElementById("im1");
  ok(im1.classList.contains("bp-media"), "懒加载目标被标记 .bp-media");
  ok(im1.getAttribute("loading") === "lazy", "补充原生 loading=lazy 兜底");
  ok(!im1.hasAttribute("data-src"), "进入视口后 data-src 已消费（真实赋值 src）");
  const im2 = dA.getElementById("im2");
  ok(/^data:image\/svg\+xml/.test(im2.getAttribute("src") || ""), "渐进加载：先落低清占位图");
  ok(im2.classList.contains("bp-media") && !im2.classList.contains("bp-media-in"), "高清未就绪前不标记完成态");

  const pvBox = dA.createElement("div");
  dA.body.appendChild(pvBox);
  pvBox.innerHTML = '<span id="pv" data-preview="data:image/svg+xml,%3Csvg%3E%3C/svg%3E">查看</span>';
  const nPv = wA.__bpMedia.initPreview(pvBox);
  ok(nPv === 1, "initPreview 绑定 1 个悬停预览目标");
  const pv = dA.getElementById("pv");
  ok(pv.getAttribute("tabindex") === "0", "预览目标自动获得 tabindex（键盘可达）");
  pv.dispatchEvent(new wA.MouseEvent("mouseenter", { bubbles: false }));
  ok(wA.__bpMedia.visible(), "mouseenter 弹出预览浮层");
  pv.dispatchEvent(new wA.MouseEvent("mouseleave", { bubbles: false }));
  ok(!wA.__bpMedia.visible(), "mouseleave 收起预览浮层");
  pv.dispatchEvent(new wA.FocusEvent("focus", { bubbles: false }));
  ok(wA.__bpMedia.visible(), "键盘 focus 同样弹出预览（无障碍）");
  dA.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  ok(!wA.__bpMedia.visible(), "Esc 收起预览浮层");

  /* ---------- A3. 表格导出 Excel ---------- */
  console.log("\n--- A3. 表格高级功能：导出 Excel ---");
  ok(!!wA.__bpViz && typeof wA.__bpViz.toExcelHtml === "function", "toExcelHtml() 已导出");
  const tbl = dA.querySelector(".eval-table");
  ok(!!tbl, "演示页存在评分维度表格 .eval-table");
  if (tbl) {
    const xls = wA.__bpViz.toExcelHtml(tbl);
    ok(xls.charCodeAt(0) === 0xFEFF, "Excel 导出带 UTF-8 BOM（中文不乱码）");
    ok(/<table border="1">/.test(xls) && /urn:schemas-microsoft-com:office:excel/.test(xls), "输出 Excel 可识别的 HTML table 结构");
    const btns = Array.prototype.slice.call(dA.querySelectorAll(".bp-table-tools .bp-mini-btn"));
    ok(btns.length === 2, "表格工具条含 2 个导出按钮（CSV + Excel）");
    ok(btns.some(b => /导出 Excel/.test(b.textContent)), "存在「导出 Excel」按钮");
    let threw = false;
    try { btns.filter(b => /导出 Excel/.test(b.textContent))[0].click(); } catch (e) { threw = true; }
    ok(!threw, "点击导出 Excel 不抛错（无 URL API 时静默降级）");
  } else {
    ok(false, "表格存在性（缺失）"); ok(false, "BOM"); ok(false, "结构"); ok(false, "按钮数"); ok(false, "按钮名"); ok(false, "点击");
  }

  /* ---------- A4. 实时看板：WebSocket + 降级轮询 ---------- */
  console.log("\n--- A4. 实时数据流：WebSocket 优先，失败降级 ---");
  ok(/\/ws\/live/.test(html), "前端接入 /ws/live 端点");
  ok(/\/api\/live\/stats/.test(html), "降级通道 /api/live/stats 已定义");
  ok(typeof wA.__bpViz.wsEndpoint === "function", "wsEndpoint() 可推导 WebSocket 地址");
  const ep = wA.__bpViz.wsEndpoint();
  ok(/^wss?:\/\/[^/]+\/ws\/live$/.test(ep), "地址推导正确（same-origin → " + ep + "）");
  ok(typeof wA.__bpViz.statsEndpoint === "function" &&
     /\/api\/live\/stats$/.test(wA.__bpViz.statsEndpoint()), "REST 降级地址推导正确");

  /* ---------- A5. 图表悬停详情 ---------- */
  console.log("\n--- A5. 图表悬停详情（折线 / 柱状 / 雷达统一）---");
  ok(!!dA.querySelector(".bp-chart-tip"), "图表详情浮层已注入");
  ok(/bp-chart-tip/.test(CSS) && /\.bp-chart-tip\.show\s*\{/.test(CSS), "CSS：图表详情浮层样式已定义");
  ok(/data-tip="第 \$\{i \+ 1\} 次/.test(html), "报告进步曲线每个数据点带 data-tip");
  ok(/data-tip="\$\{tipTxt\}"/.test(html), "小测趋势柱带 data-tip");
  const dot = dA.createElement("div");
  dot.setAttribute("data-tip", "第 1 次 · 总分 78");
  dot.style.cssText = "width:20px;height:20px";
  dA.body.appendChild(dot);
  dot.dispatchEvent(new wA.MouseEvent("mouseover", { bubbles: true }));
  const tipEl = dA.querySelector(".bp-chart-tip");
  ok(tipEl.classList.contains("show"), "鼠标悬停数据点弹出详情");
  ok(/总分 78/.test(tipEl.textContent), "详情内容取自 data-tip");
  dot.dispatchEvent(new wA.MouseEvent("mouseout", { bubbles: true }));
  ok(!tipEl.classList.contains("show"), "移出后收起详情");
  dot.dispatchEvent(new wA.FocusEvent("focusin", { bubbles: true }));
  ok(tipEl.classList.contains("show"), "键盘聚焦同样显示详情（无障碍）");
  dA.dispatchEvent(new wA.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  ok(!tipEl.classList.contains("show"), "Esc 关闭图表详情");

  /* ---------- A6. 键盘可达性 ---------- */
  console.log("\n--- A6. 键盘可达性（跳到主内容 / 焦点陷阱）---");
  const skip = dA.querySelector(".bp-skip");
  ok(!!skip, "存在「跳到主内容」skip link");
  ok(!!skip && /#main/.test(skip.getAttribute("href") || ""), "skip link 指向 #main");
  ok(!!dA.getElementById("main"), "主内容容器已具备 id=main（锚点可用）");
  ok(/\.bp-skip:focus\s*\{/.test(CSS), "CSS：skip link 聚焦时显现");
  const box = dA.querySelector(".modal-box");
  ok(!!box && box.getAttribute("aria-modal") === "true", "弹窗被标记为 aria-modal（焦点陷阱已挂）");
  ok(!!box && box.getAttribute("role") === "dialog", "弹窗具备 role=dialog");
  ok(!!wA.__bpMotion && typeof wA.__bpMotion.trapFocus === "function", "trapFocus() 可复用给任意浮层");
  const fake = dA.createElement("div");
  fake.innerHTML = '<button id="f1">a</button><button id="f2">b</button>';
  dA.body.appendChild(fake);
  const trap = wA.__bpMotion.trapFocus(fake);
  ok(!!trap && fake.getAttribute("aria-modal") === "true", "trapFocus 给容器补 aria-modal");
  ok(trap.release() === true && !fake.hasAttribute("aria-modal"), "release() 释放并清理 aria-modal");
  ok(A.errors.length === 0, "正常路径无脚本错误" + (A.errors.length ? "：" + A.errors[0] : ""));

  /* ================================================================
   * 路径 B：WebSocket mock（真实连接 → 数据上屏）
   * ================================================================ */
  console.log("\n--- B. WebSocket 通道（mock 连接 · 推送上屏）---");
  const B = makeDom({ ws: true });
  await B.settle();
  await wait(150);
  const wB = B.dom.window, dB = wB.document;
  ok(typeof wB.WebSocket === "function", "测试环境注入 WebSocket 构造器");
  const booted = (wB.__wsInstances || []).length;   // 页面启动时报告看板已建连
  const liveHost = dB.createElement("div");
  dB.body.appendChild(liveHost);
  const live = wB.__bpViz.startLive(liveHost, () => [{ k: "本地", v: 1 }], 2500, { remote: true });
  await wait(30);
  const socks = wB.__wsInstances || [];
  const sock = socks[socks.length - 1];
  ok(socks.length === booted + 1, "startLive({remote:true}) 新建 1 条 WebSocket 连接");
  ok(!!sock && /\/ws\/live$/.test(sock.url), "连接地址指向 /ws/live");
  if (sock) {
    sock.readyState = 1;
    if (sock.onopen) sock.onopen({});
    ok(live.mode() === "ws", "连接建立后看板标记为 WS 实时");
    if (sock.onmessage) {
      sock.onmessage({ data: JSON.stringify({ ok: true, interviews: 7, finished: 3, turns: 21, avg_score: 76.4, llm_ready: true }) });
    }
    const txt = liveHost.textContent || "";
    ok(/在线会话/.test(txt) && /21/.test(txt), "服务端推送的聚合指标已上屏");
    ok(!!liveHost.parentNode.querySelector(".bp-live-state[data-mode='ws']"), "通道标记显示 WS 实时");
    if (sock.onclose) sock.onclose({ code: 1006 });
    ok(live.mode() === "poll", "连接断开后自动降级为轮询模式");
  } else {
    ok(false, "WS 状态"); ok(false, "推送上屏"); ok(false, "通道标记"); ok(false, "降级");
  }
  live.stop();
  ok(live.ws() === null, "stop() 关闭连接并清理定时器");
  ok(B.errors.length === 0, "WS 路径无脚本错误" + (B.errors.length ? "：" + B.errors[0] : ""));

  /* ================================================================
   * 路径 C：reduced-motion（功能不缺失，动效停用）
   * ================================================================ */
  console.log("\n--- C. reduced-motion 路径（能力保留，动效停用）---");
  const C = makeDom({ reduced: true });
  await C.settle();
  await wait(150);
  const wC = C.dom.window, dC = wC.document;
  ok(wC.__bpMedia.reduced() === true, "媒体层识别减弱动效偏好");
  ok(/prefers-reduced-motion[^{]*\{[^}]*\.bp-media/.test(CSS), "CSS：减弱动效下媒体不做模糊/过渡");
  const cBox = dC.createElement("div");
  dC.body.appendChild(cBox);
  cBox.innerHTML = '<img alt="c" data-src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E" data-preview="data:image/svg+xml,%3Csvg%3E%3C/svg%3E">';
  ok(wC.__bpMedia.initLazy(cBox) === 1, "减弱动效下懒加载照常接管");
  ok(wC.__bpMedia.initPreview(cBox) === 1, "减弱动效下悬停预览照常可用（功能不缺失）");
  const cHost = dC.createElement("div");
  dC.body.appendChild(cHost);
  const cSkel = wC.__bpSkeleton.mount(cHost, { rows: 2, cols: 2 });
  ok(!!cSkel && cHost.querySelectorAll(".skeleton").length === 4, "减弱动效下骨架屏照常渲染占位");
  cSkel.clear(true);
  ok(C.errors.length === 0, "减弱动效路径无脚本错误" + (C.errors.length ? "：" + C.errors[0] : ""));

  console.log("\n===== v30 结果：" + pass + " 通过，" + fail + " 失败 =====");
  process.exit(fail ? 1 : 0);
}
