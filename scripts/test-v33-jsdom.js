/* v33 jsdom 测试：摄像头面试状态监测（前端检测 + 后端聚合 · Beta 1.1.2）
 * 覆盖：① 摄像头按钮 / 预览 / 状态条 DOM 齐备且初始隐藏
 *       ② toggleCamera / stopCamera 模块就绪，face-api 同源自托管优先 + CDN 兜底
 *       ③ 运行时开启摄像头：getUserMedia → 预览、状态条显示、向后端发心跳
 *       ④ 隐私红线：后端只收到结构化结果（face_present/attentive/label），从不收原始帧
 *       ⑤ 检测循环：face-api 就绪后按「居中=专注」产出状态文案
 *       ⑥ 关闭清理：stopCamera 收掉轨道 / 清定时器 / 隐藏条 / 上报「已关闭」
 *       ⑦ 收尾联动：finishInterview / restartInterview 调用 stopCamera 收摄像头
 *       ⑧ 运行期无脚本错误
 * 用法：node scripts/test-v33-jsdom.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");
const srcInterview = fs.readFileSync(path.join(__dirname, "..", "frontend", "js", "features", "interview.js"), "utf8");

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

function makeDom() {
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
  });
  const settle = () =>
    new Promise((res) => {
      if (dom.window.document.readyState === "complete") return res();
      dom.window.document.addEventListener("DOMContentLoaded", res, { once: true });
      setTimeout(res, 900);
    });
  return { dom, errors, settle };
}

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v33 jsdom 测试（摄像头面试状态监测 · Beta 1.1.2）===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  const d = w.document;
  await settle();
  const ev = (expr) => w.eval(expr);

  /* ---------- ① DOM 齐备且初始隐藏 ---------- */
  console.log("\n① 摄像头交互 DOM 齐备");
  ok(!!d.getElementById("cam-btn"), "#cam-btn 摄像头按钮存在");
  ok(!!d.getElementById("cam-bar"), "#cam-bar 状态条容器存在");
  ok(!!d.getElementById("cam-preview"), "#cam-preview 预览 <video> 存在");
  ok(!!d.getElementById("cam-state"), "#cam-state 状态文案节点存在");
  ok(!!d.getElementById("cam-sub"), "#cam-sub 聚合指标节点存在");
  ok(d.getElementById("cam-bar").hidden === true, "摄像头未开启时 #cam-bar 处于隐藏态");
  ok(/toggleCamera\(/.test(d.getElementById("cam-btn").outerHTML), "摄像头按钮 onclick 绑定 toggleCamera");

  /* ---------- ② 模块与常量就绪 ---------- */
  console.log("\n② 摄像头模块与 face-api 常量就绪");
  ok(ev("typeof toggleCamera === 'function'"), "toggleCamera 是函数");
  ok(ev("typeof stopCamera === 'function'"), "stopCamera 是函数");
  ok(ev("typeof camDetectLoop === 'function'"), "camDetectLoop 是函数");
  ok(
    ev(
      "typeof FACEAPI_LIB_LOCAL === 'string' && FACEAPI_LIB_LOCAL.indexOf('models/faceapi/face-api.min.js') >= 0 && typeof FACEAPI_JS === 'string' && FACEAPI_JS.indexOf('face-api.js@0.22.2') >= 0"
    ),
    "face-api 库：同源自托管(models/faceapi/) + CDN 兜底(@0.22.2)"
  );
  ok(
    ev(
      "typeof FACEAPI_WEIGHTS_LOCAL === 'string' && FACEAPI_WEIGHTS_LOCAL.indexOf('models/faceapi/weights') >= 0 && typeof FACEAPI_WEIGHTS === 'string' && FACEAPI_WEIGHTS.indexOf('weights') >= 0"
    ),
    "权重目录：同源自托管 + CDN 兜底（npm 包无 weights/ 已修正）"
  );
  // 静态：收尾 / 重置必须联动收摄像头（隐私：结束后不残留设备占用）
  ok(
    /function finishInterview\(\)[\s\S]*?stopCamera\(\)/.test(srcInterview),
    "finishInterview 内部调用 stopCamera（结束后收摄像头）"
  );
  ok(
    /function restartInterview\(\)[\s\S]*?stopCamera\(\)/.test(srcInterview),
    "restartInterview 内部调用 stopCamera（重置前收摄像头）"
  );

  /* ---------- 准备：登录 + 伪造浏览器媒体环境 + 拦截 fetch ---------- */
  ev("currentUser = { id: 'u_test', email: 't@example.com', name: '测试' };");
  const fakeStream = { getTracks: () => [{ stop() {} }] };
  Object.defineProperty(w.navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: () => Promise.resolve(fakeStream) },
  });
  Object.defineProperty(w.HTMLMediaElement.prototype, "srcObject", {
    configurable: true,
    set() {},
    get() {
      return null;
    },
  });
  Object.defineProperty(w.HTMLMediaElement.prototype, "videoWidth", {
    configurable: true,
    get() {
      return 320;
    },
  });
  Object.defineProperty(w.HTMLMediaElement.prototype, "videoHeight", {
    configurable: true,
    get() {
      return 240;
    },
  });
  w.HTMLMediaElement.prototype.play = function () {
    return Promise.resolve();
  };
  // face-api 桩：让 loadFaceApi 直接就绪（避免真实网络加载挂起）
  w.faceapi = {
    nets: { tinyFaceDetector: { loadFromUri: () => Promise.resolve() } },
    TinyFaceDetectorOptions: function () {},
    detectSingleFace: async () => ({ box: { x: 100, y: 80, width: 120, height: 160 } }),
  };

  const fetchCalls = [];
  w.fetch = function (url, opts) {
    const rec = { url: String(url), body: opts && opts.body ? String(opts.body) : "" };
    fetchCalls.push(rec);
    const isCreate = /\/api\/interviews$/.test(rec.url) && (!opts || opts.method == null || opts.method === "POST");
    const json = isCreate
      ? { id: "iv_test_123" }
      : { id: "iv_test_123", presence_rate: 100, attentive_rate: 100, count: 1, latest: "专注面试中" };
    return Promise.resolve({ ok: true, json: async () => json });
  };

  /* ---------- ③ 运行时开启摄像头 ---------- */
  console.log("\n③ 开启摄像头：预览 / 状态条 / 后端心跳");
  await ev("toggleCamera()");
  await wait(350); // 让心跳 fetch 落地
  ok(ev("camOn === true"), "开启后 camOn 置位");
  ok(d.getElementById("cam-bar").hidden === false, "#cam-bar 由隐藏变为显示");
  ok(d.getElementById("cam-state").textContent !== "摄像头未开启", "状态文案已由默认「摄像头未开启」更新");
  const created = fetchCalls.some((c) => /\/api\/interviews$/.test(c.url));
  ok(created, "向后端 POST /api/interviews 创建/复用会话用于上报状态");
  const statusCalls = fetchCalls.filter((c) => /\/status$/.test(c.url));
  ok(statusCalls.length >= 1, "向后端 /status 上报了至少一次面试状态");

  /* ---------- ④ 隐私红线：只发结构化结果，从不发原始帧 ---------- */
  console.log("\n④ 隐私红线：后端只收结构化状态，不收视频帧");
  let leaked = false;
  for (const c of statusCalls) {
    const b = c.body || "";
    if (/data:image|blob:|video|frame|stream/.test(b)) leaked = true;
  }
  ok(!leaked, "状态上报 body 不含 data:image / blob / video / frame / stream（原始像素不出浏览器）");
  ok(
    statusCalls.every((c) => /face_present/.test(c.body) && /label/.test(c.body)),
    "状态上报 body 仅含 face_present / attentive / label 等结构化字段"
  );
  ok(
    d.getElementById("cam-sub").textContent.indexOf("在场率") >= 0,
    "状态条展示后端聚合的在场率（后台检测面试状态已生效）"
  );

  /* ---------- ⑤ 检测循环产出专注文案 ---------- */
  console.log("\n⑤ 检测循环：face-api 就绪后按居中判定专注");
  // jsdom 的 videoWidth/videoHeight 是只读访问器且不可重定义原型；改为在 <video> 实例上挂自有数据属性，
  // 让 camDetectLoop 的「画面就绪」守卫通过（真实浏览器里这两项由解码器填充）。
  const _pv = d.getElementById("cam-preview");
  try {
    Object.defineProperty(_pv, "videoWidth", { configurable: true, value: 320 });
  } catch (e) {}
  try {
    Object.defineProperty(_pv, "videoHeight", { configurable: true, value: 240 });
  } catch (e) {}
  ev("faceApiReady = true;");
  await ev("camDetectLoop()");
  await wait(50);
  ok(/专注面试中/.test(d.getElementById("cam-state").textContent), "居中人脸 → 状态文案「专注面试中」");
  ok(ev("camLastDetect && camLastDetect.face_present === true"), "检测记录 face_present=true");
  ok(ev("camLastDetect && camLastDetect.attentive === true"), "检测记录 attentive=true（居中=面向镜头）");

  /* ---------- ⑥ 关闭清理 ---------- */
  console.log("\n⑥ 关闭摄像头：收轨道 / 清定时器 / 隐藏条 / 上报关闭");
  fetchCalls.length = 0;
  ev("stopCamera()");
  await wait(50);
  ok(ev("camOn === false"), "关闭后 camOn 复位");
  ok(d.getElementById("cam-bar").hidden === true, "#cam-bar 重新隐藏");
  ok(ev("camDetectTimer === null && camSendTimer === null"), "检测 / 上报定时器已清除");
  ok(
    fetchCalls.some((c) => /\/status$/.test(c.url) && /摄像头已关闭/.test(c.body)),
    "关闭时向后端上报「摄像头已关闭」事件"
  );

  /* ---------- ⑦ 收尾联动 ---------- */
  console.log("\n⑦ 收尾 / 重置联动收摄像头");
  // 重新开摄像头，再触发重新面试，应自动收掉
  await ev("toggleCamera()");
  await wait(200);
  ok(ev("camOn === true"), "重新开启后 camOn 置位（联动前置）");
  ev("restartInterview()");
  await wait(100);
  ok(ev("camOn === false"), "restartInterview() 触发后摄像头被自动收掉（联动 stopCamera）");

  /* ---------- ⑧ 无脚本错误 ---------- */
  console.log("\n⑧ 运行期无脚本错误");
  ok(errors.length === 0, "jsdom 无未预期脚本错误" + (errors.length ? "：" + errors[0].slice(0, 120) : ""));

  console.log("\n----------------------------------------------------------");
  console.log(`v33 结果：${pass} 通过，${fail} 失败`);
  console.log("==========================================================");
  process.exit(fail ? 1 : 0);
}
