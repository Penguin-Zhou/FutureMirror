/* v35 回归测试：简历 .pdf 上传端侧解析（pdfjs-dist 自托管 + CDN 兜底）
 * 覆盖：
 *   ① 注入 mock pdfjsLib 后，上传 .pdf → 文本解析并填入简历框，提示含页数
 *   ② 上传 .txt → 回归：仍直接读取填入（不触发 PDF 解析）
 *   ③ 上传 .pdf 但 getDocument 失败 → 提示「解析失败」且不影响其他功能
 *   ④ 源码接线：match.js 含 parsePdfText / ensurePdfJs / PDFJS_VERSION / worker 路径
 *   ⑤ 运行期无脚本错误
 * 用法：node scripts/test-v35-jsdom.js
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
const srcMatch = fs.readFileSync(path.join(ROOT, "frontend", "js", "features", "match.js"), "utf8");

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

function mockPdfJsOk() {
  return {
    GlobalWorkerOptions: {},
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: 2,
        getPage: () =>
          Promise.resolve({
            getTextContent: () =>
              Promise.resolve({
                items: [{ str: "张三 技能 React TypeScript Node.js" }, { str: "项目 电商秒杀系统 高并发" }],
              }),
          }),
      }),
    }),
  };
}
function mockPdfJsFail() {
  return {
    GlobalWorkerOptions: {},
    getDocument: () => ({ promise: Promise.reject(new Error("worker 不可用")) }),
  };
}

async function triggerUpload(w, file) {
  const input = w.document.getElementById("resume-upload");
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new w.Event("change"));
  await wait(400); // 等待 async change handler 完成
}

setTimeout(runTests, 400);

async function runTests() {
  console.log("\n=== v35：简历 .pdf 上传端侧解析（pdfjs-dist 自托管 + CDN 兜底）===");
  const { dom, errors, settle } = makeDom();
  const w = dom.window;
  await settle();

  /* ① 注入成功 mock，上传 PDF → 解析填入 */
  console.log("\n① 上传 .pdf → 端侧解析文本并填入简历框");
  w.pdfjsLib = mockPdfJsOk();
  const pdfFile = new w.File(["%PDF-1.4 fake-bytes"], "resume.pdf", { type: "application/pdf" });
  pdfFile.arrayBuffer = () => Promise.resolve(new Uint8Array([1, 2, 3, 4]));
  await triggerUpload(w, pdfFile);
  const resumeVal = w.document.getElementById("resume").value;
  const box1 = w.document.getElementById("resume-file").textContent;
  ok(/张三/.test(resumeVal) && /React/.test(resumeVal), "PDF 文本已提取并填入简历框（含「张三/React」）");
  ok(/已解析/.test(box1) && /2 页/.test(box1), "提示区显示「已解析」且标注页数（2 页）");

  /* ② .txt 回归：仍直接读取，不触发 PDF 解析 */
  console.log("\n② 上传 .txt → 回归：直接读取填入（不触发 PDF 解析）");
  const txtFile = new w.File(["熟悉 Java Python 微服务"], "r.txt", { type: "text/plain" });
  await triggerUpload(w, txtFile);
  const resumeVal2 = w.document.getElementById("resume").value;
  const box2 = w.document.getElementById("resume-file").textContent;
  ok(/熟悉 Java Python/.test(resumeVal2), "txt 文本已读取填入简历框");
  ok(/已读取/.test(box2), "提示区显示「已读取」");

  /* ③ PDF 解析失败 → 友好提示，不崩 */
  console.log("\n③ 上传 .pdf 但解析引擎失败 → 友好提示且不影响页面");
  w.pdfjsLib = mockPdfJsFail();
  const pdfFile2 = new w.File(["%PDF-1.4"], "bad.pdf", { type: "application/pdf" });
  pdfFile2.arrayBuffer = () => Promise.resolve(new Uint8Array([9]));
  await triggerUpload(w, pdfFile2);
  const box3 = w.document.getElementById("resume-file").textContent;
  ok(/解析失败/.test(box3), "解析失败给出「解析失败」提示而非白屏/报错");

  /* ④ 源码接线 */
  console.log("\n④ 源码接线确认");
  ok(/async function parsePdfText/.test(srcMatch), "match.js 实现 parsePdfText");
  ok(/async function ensurePdfJs/.test(srcMatch), "match.js 实现 ensurePdfJs（加载 pdfjs 库）");
  ok(/PDFJS_VERSION/.test(srcMatch) && /pdf\.worker\.min\.js/.test(srcMatch), "声明 PDFJS 版本与 worker 路径常量");
  ok(/PDFJS_LIB_LOCAL/.test(srcMatch) && /PDFJS_LIB_CDN/.test(srcMatch), "采用同源自托管 + CDN 兜底双源策略");

  /* ⑤ 运行期无错误 */
  console.log("\n⑤ 运行期无脚本错误");
  ok(errors.length === 0, errors.length ? "出现脚本错误：" + errors.slice(0, 2).join(" | ") : "无 jsdom 脚本错误");

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  if (fail) process.exitCode = 1;
  dom.window.close();
}
