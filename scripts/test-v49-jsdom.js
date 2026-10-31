/* v49 · 视觉升级：工程规格书质感
 *
 * 这一版不加装饰（不引入投影 / 圆角 / 玻璃 / 渐变），只做三件事：
 *   ① 版式：等宽小标签 + 衬线标题 + 表格数字，建立层级；
 *   ② 结构：零散卡片合成「一张规格表」，页头短墨规；
 *   ③ 数据：工作台指挥台（5 段仪表 + 4 格指标 + 下一步），
 *      第一屏呈现「我的进度」，而不是把品牌口号再喊一遍。
 *
 * 这里守住四类约束：
 *   ① 纪律没被破坏：无投影 / 无玻璃 / 无位移 hover / 无蓝紫渐变；
 *   ② 结构成立：指挥台在 dashboard 首位、7 张入口卡编号连续、末张补满整行；
 *   ③ 数据诚实：无数据不编造分值、单次记录不画趋势、仪表读数随状态切换；
 *   ④ 响应式不塌：手机上仍为 2×2，不竖排成四行。
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

const css = rd("frontend/css/pages.css");
const appfx = rd("frontend/js/features/appfx.js");
const indexHtml = rd("frontend/index.html");
const demoHtml = rd("public/futuremirror-demo.html");

/* v49 区块切片：只看这一版加的规则，避免被旧规则干扰 */
const v49Start = css.indexOf("v49 · 视觉升级");
const v49 = v49Start < 0 ? "" : css.slice(v49Start);

console.log("\n① 纪律：不靠装饰堆「高级感」");
ok(v49.length > 2000, "v49 样式层存在");
ok(!/box-shadow\s*:\s*(?!inset)/.test(v49), "v49 未引入投影（只允许 inset 内嵌线）");
ok(!/backdrop-filter/.test(v49), "v49 未引入玻璃拟态");
ok(!/translateY\(-\d/.test(v49), "v49 无 translateY 上浮 hover");
/* 直接取值判断：/border-radius\s*:\s*(?!0)/ 这种写法会因 \s* 回溯而误判 */
const radii = [...v49.matchAll(/border-radius\s*:\s*([^;}]+)/g)].map((m) => m[1].trim());
ok(
  radii.every((v) => /^0(\s+0)*$/.test(v)),
  "v49 未引入圆角（取值全为 0）"
);
ok(!/radial-gradient|linear-gradient/.test(v49), "v49 未引入渐变（靠线框与编号分层）");

console.log("\n② 版式：短墨规 + 等宽标签 + 表格数字");
ok(
  /\.page-header::before\s*\{[^}]*width:\s*56px[^}]*height:\s*2px[^}]*background:\s*var\(--ink\)/.test(css),
  "页头有 56px 短墨规"
);
ok(/\.page-header::after\s*\{[^}]*height:\s*1px[^}]*background:\s*var\(--line-2\)/.test(css), "页头有贯通发丝线");
ok(/\.page-header h2\s*\{[^}]*font-size:\s*30px/.test(css), "页头标题上提到 30px");
ok(/\.breadcrumb\s*\{[^}]*font-family:\s*var\(--mono\)/.test(css), "面包屑改等宽字");
ok(/\.sb-group-label\s*\{[^}]*font-family:\s*var\(--mono\)/.test(css), "侧栏分组标签等宽化");
ok(/font-variant-numeric:\s*tabular-nums/.test(v49), "数字统一表格对齐（tabular-nums）");
ok(/:root\s*\{[^}]*--fs-xs:\s*11px/.test(v49) && /--sp-4:\s*16px/.test(v49), "补齐字号/间距令牌");

console.log("\n③ 指挥台：结构与数据口径");
const dashStart = indexHtml.indexOf('data-page="dashboard"');
const dashBlock = indexHtml.slice(dashStart, indexHtml.indexOf('data-page="match"'));
ok(dashBlock.includes('class="cmd-band"'), "工作台含指挥台");
ok(
  dashBlock.indexOf('class="cmd-band"') < dashBlock.indexOf('id="onboarding"'),
  "指挥台排在首次引导之前（先看进度，再看说明）"
);
ok((dashBlock.match(/class="cmd-metric"/g) || []).length === 4, "4 格指标");
ok(dashBlock.includes('class="cmd-next"'), "含「建议下一步」区");
ok(
  /\.cmd-band\s*\{[^}]*grid-template-columns:\s*264px minmax\(0,\s*1fr\) minmax\(240px,\s*300px\)/.test(css),
  "指挥台三栏栅格（仪表 / 指标 / 建议）"
);
ok(/\.cmd-band\s*\{[^}]*border-top-width:\s*2px/.test(css), "指挥台墨色顶规");

console.log("\n④ 入口卡：编号连续、末张补满整行");
ok((dashBlock.match(/class="qe-no"/g) || []).length === 7, "7 张入口卡都有编号");
const nos = [...dashBlock.matchAll(/class="qe-no"[^>]*>(\d\d)</g)].map((m) => m[1]);
ok(nos.join(",") === "01,02,03,04,05,06,07", "编号自 01 到 07 递增：" + nos.join(" "));
ok(
  /\.quick-entries-hero \.quick-entry:last-child\s*\{[^}]*grid-column:\s*1 \/ -1/.test(css),
  "末张入口补满整行（7 张卡不留半排空格）"
);
ok(/\.quick-entries-hero \.quick-entry:last-child\s*\{[^}]*display:\s*flex/.test(css), "末张改为横排索引行");

console.log("\n⑤ 构建产物：改动确实进了演示包");
ok(demoHtml.includes("cmd-band"), "演示包含指挥台");
ok(demoHtml.includes("cmdGaugeSVG"), "演示包含仪表绘制函数");
ok((demoHtml.match(/class="qe-no"/g) || []).length === 7, "演示包含 7 个编号");

console.log("\n⑥ 行为：仪表读数随状态切换，不编造数据");
const src = appfx.slice(appfx.indexOf("function cmdGaugeSVG"), appfx.indexOf("FX.renderCmdBand = renderCmdBand;"));
ok(src.length > 1500, "取得指挥台渲染逻辑");

function makeWin(data) {
  const dom = new JSDOM(`<!doctype html><html><body><section class="cmd-band"></section></body></html>`, {
    url: "https://example.test/",
    virtualConsole: new VirtualConsole(),
  });
  const w = dom.window;
  const calls = [];
  const store = {
    get(k, d) {
      return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : d;
    },
  };
  const session = { turns: data.__turns ? new Array(data.__turns) : [] };
  const escHtml = (v) =>
    String(v == null ? "" : v).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
    );
  /* 依赖显式注入：这段代码真实依赖 document / store / session / escHtml / switchTab，
   * 显式传参比依赖 window 上的属性更稳，也让测试能观察跳转目标。 */
  const fn = new Function("document", "store", "session", "escHtml", "switchTab", src + "\n;return renderCmdBand;")(
    w.document,
    store,
    session,
    escHtml,
    (page) => calls.push(page)
  );
  const render = () => fn();
  return { w, render, calls };
}

/* ① 空态：没有报告、没有简历 */
{
  const nav = makeWin({});
  nav.render();
  const box = nav.w.document.querySelector(".cmd-band");
  const text = box.textContent.replace(/\s+/g, " ");
  ok(box.querySelectorAll(".cmd-gauge").length === 1, "空态也渲染仪表");
  ok(box.querySelectorAll("circle").length === 5, "仪表固定 5 段（对应 5 轮画像）");
  ok(/已完成模拟轮次/.test(text), "无进行中的面试时读「已完成轮次」");
  ok(box.querySelectorAll(".cmd-v-empty").length === 2, "无数据的两格用占位符，不写 0 分");
  ok(!/0\/100/.test(text), "没有报告时不显示 0/100（0 分是假信息）");
  ok(/去简历匹配/.test(text), "无简历时建议先去简历匹配");
  ok(box.querySelectorAll(".cmd-spark").length === 0, "没有历史记录不画趋势");
}

/* ② 有 3 次报告 + 计划 + 简历 */
{
  const nav = makeWin({
    fm_history: [
      { total: 62, turns: 5 },
      { total: 71, turns: 5 },
      { total: 78, turns: 5 },
    ],
    fm_plan: { days: [{ tasks: [{ done: true }, { done: false }] }, { tasks: [{ done: true }, { done: false }] }] },
    fm_resume: "某份简历",
    fm_mbti: { type: "INTJ" },
  });
  nav.render();
  const box = nav.w.document.querySelector(".cmd-band");
  const text = box.textContent.replace(/\s+/g, " ");
  ok(/78/.test(text) && /\/100/.test(text), "最近总分读 78/100");
  ok(box.querySelectorAll(".cmd-spark i").length === 3, "趋势条按历史记录数画 3 根");
  ok(/2\/4/.test(text), "学习任务读 2/4");
  ok(box.querySelector(".cmd-bar i").getAttribute("style").includes("50%"), "学习任务进度条按 50% 填充");
  ok(/INTJ/.test(text), "人格类型沿用测评结果");
  ok(/打开学习计划/.test(text), "已有报告时建议进入学习计划");
  ok(box.querySelectorAll('circle[stroke="var(--brand)"]').length === 3, "仪表点亮 3 段（对应 3 次已完成）");
}

/* ③ 面试进行中：改读本轮答题数 */
{
  const nav = makeWin({ __turns: 2, fm_history: [{ total: 80, turns: 5 }], fm_resume: "简历" });
  nav.render();
  const text = nav.w.document.querySelector(".cmd-band").textContent.replace(/\s+/g, " ");
  ok(/本轮答题进度/.test(text), "有进行中的面试时读「本轮答题进度」");
  ok(/答完 3 题生成本轮报告/.test(text), "提示还差几题，数量随轮次变化");
  ok(nav.w.document.querySelectorAll('.cmd-band circle[stroke="var(--brand)"]').length === 2, "点亮段数等于已答题数");
}

/* ④ 只有 1 次记录：不画趋势（一个点不是趋势） */
{
  const nav = makeWin({ fm_history: [{ total: 66, turns: 5 }], fm_resume: "简历" });
  nav.render();
  ok(nav.w.document.querySelectorAll(".cmd-spark").length === 0, "仅 1 次记录时不画趋势条");
}

/* ⑤ 点击「下一步」会跳到对应页 */
{
  const nav = makeWin({});
  nav.render();
  const btn = nav.w.document.querySelector(".cmd-band .btn");
  btn.dispatchEvent(new nav.w.Event("click"));
  ok(nav.calls[0] === "match", "点击按钮跳到建议的目标页（" + nav.calls.join(",") + "）");
}

console.log("\n⑦ 响应式：手机上不塌成四行");
const m720 = css.slice(css.indexOf("@media (max-width: 720px)"));
ok(/\.cmd-band\s*\{\s*grid-template-columns:\s*1fr/.test(m720), "≤720px 单列堆叠");
/* 文件里有多处 420px 媒体查询（v42 移动端裁剪也有一处），取 v49 这一处 */
const at420 = css.lastIndexOf("@media (max-width: 420px)");
const m420 = css.slice(at420, css.indexOf("@media (prefers-reduced-motion", at420));
ok(!/\.cmd-metrics\s*\{[^}]*grid-template-columns:\s*1fr/.test(m420), "≤420px 指标仍是 2×2（不乱成四行）");
ok(/\.cmd-gauge svg\s*\{[^}]*width:\s*64px/.test(m420), "≤420px 仪表缩小到 64px");

console.log("\n⑧ 空态：同一套框法，不冒充「无数据」");
ok(/\.empty-state\s*\{[^}]*border:\s*1px dashed var\(--line-2\)/.test(css), "空态用虚线图框");
ok(!/\.empty-state::before\s*\{[^}]*content:\s*"NO DATA"/.test(css), "空态不再打印 NO DATA（聊天起始位会被误读）");
ok(/\.empty-state \.ic\s*\{[^}]*filter:\s*grayscale\(1\)/.test(css), "空态图标去色，不抢标题");

console.log("\n" + (fail === 0 ? "✅ 全部通过" : "❌ 有失败项") + "：" + pass + " 项断言");
process.exit(fail === 0 ? 0 : 1);
