/* v63 · 能力网：中心 → 五个主题 → 二十个实现点（不升版）
 *
 * 形态参照 mimo.mi.com 的「开发者的声音」：中心一个标题、四周一圈主题、
 * 每个主题外挂若干细标签、细线相连、整体缓慢浮动、悬停弹出一张说明卡。
 * 参考站用 canvas 逐帧重绘；这里用 DOM + SVG，理由写在 voices.js 的横幅里
 * （可选中 / 可读屏 / 可打印 / jsdom 可断言）。
 *
 * 断言分七组：
 * ① 结构与数量：1 + 5 + 20 = 26 个节点、25 条连线、5 个列表组
 * ② 布局：所有节点落在舞台内、左右上下不偏斜、四个角都用到
 * ③ 浮动：位移由逐帧驱动、线端点与节点同源、进视口才跑
 * ④ 弹卡：悬停 / 聚焦都能开，文案与节点对得上，位置不出舞台
 * ⑤ 降级：reduced-motion 关干净、窄屏换列表、无 JS 不留空框
 * ⑥ 文案诚实：不编造用户评价，每个点都能对上仓库里的实现
 * ⑦ 成品：演示包内联了整套规则与脚本
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

const landingCss = rd("frontend/css/landing.css");
const voicesSrc = rd("frontend/js/features/voices.js");
const indexHtml = rd("frontend/index.html");
const demoHtml = rd("public/futuremirror-demo.html");

/* 只取顶格写的那条规则：reduced-motion 块里的同名选择器带两格缩进，
 * 若按裸字符串找会先命中 media 内的降级声明，把正常态的值看错。 */
function rule(css, selector) {
  const i = css.indexOf("\n" + selector + " {");
  if (i < 0) return "";
  return css.slice(i + 1, css.indexOf("}", i));
}
function media(css, query) {
  const i = css.lastIndexOf(query);
  if (i < 0) return "";
  let depth = 0;
  const start = css.indexOf("{", i);
  for (let p = start; p < css.length; p++) {
    if (css[p] === "{") depth++;
    else if (css[p] === "}") {
      depth--;
      if (depth === 0) return css.slice(start, p + 1);
    }
  }
  return "";
}

const ALL_MOTION = (q) => ({
  matches: false,
  media: q,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});
const NO_MOTION = (q) => ({
  matches: /reduced-motion/.test(q),
  media: q,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});

function boot(opts) {
  const o = opts || {};
  const dom = new JSDOM(demoHtml, {
    url: "https://example.com/",
    runScripts: o.plain ? undefined : "dangerously",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(win) {
      win.matchMedia = o.matchMedia || ALL_MOTION;
      win.scrollTo = function () {};
      /* jsdom 没有布局：clientWidth/Height 恒 0，卡片定位会全挤到左上角。
       * 给舞台一个假尺寸，只为验证「不出界」这条逻辑，不冒充真像素。 */
      Object.defineProperty(win.HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get() {
          return this.id === "fv-stage" ? 1180 : 0;
        },
      });
      Object.defineProperty(win.HTMLElement.prototype, "clientHeight", {
        configurable: true,
        get() {
          return this.id === "fv-stage" ? 520 : 0;
        },
      });
    },
  });
  return dom.window;
}

(async () => {
  console.log("── ① 结构与数量 ──");
  ok(/id="fv-stage"/.test(indexHtml), "舞台容器在源页面里");
  ok(/id="fv-list"/.test(indexHtml), "窄屏列表容器在源页面里");
  ok(/class="fv-tip" id="fv-tip"/.test(indexHtml), "说明卡预置在舞台内");

  const w = boot();
  await new Promise((r) => setTimeout(r, 700));

  const d = w.document;
  const nodes = [...d.querySelectorAll("#fv-stage .fv-node")];
  const groups = [...d.querySelectorAll("#fv-stage .fv-group")];
  const leaves = [...d.querySelectorAll("#fv-stage .fv-leaf")];
  const links = [...d.querySelectorAll("#fv-stage .fv-link")];
  const center = d.querySelector("#fv-stage .fv-center");

  ok(nodes.length === 26, "节点 26 个（1 中心 + 5 主题 + 20 实现点），实际 " + nodes.length);
  ok(groups.length === 5, "主题节点 5 个，实际 " + groups.length);
  ok(leaves.length === 20, "实现点 20 个，实际 " + leaves.length);
  ok(links.length === 25, "连线 25 条（5 主干 + 20 分支），实际 " + links.length);
  ok(!!center && center.textContent.trim() === "面镜 FutureMirror", "中心节点是产品名");
  ok(d.getElementById("fv-stage").classList.contains("fv-ready"), "渲染完成后挂 fv-ready");
  ok(w.__bpVoices && w.__bpVoices.ready === true, "打点 __bpVoices.ready = true");
  ok(w.__bpVoices.nodes === 26 && w.__bpVoices.links === 25, "打点数与 DOM 一致");

  console.log("\n── ② 布局 ──");
  const coords = nodes.map((n) => ({
    t: n.textContent.trim(),
    x: parseFloat(n.style.getPropertyValue("--x")),
    y: parseFloat(n.style.getPropertyValue("--y")),
  }));
  ok(
    coords.every((c) => c.x > 4 && c.x < 96 && c.y > 4 && c.y < 96),
    "所有节点都在舞台中间 92% 区域内（不贴边、不出界）"
  );
  const xs = coords.map((c) => c.x);
  const ys = coords.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  ok(maxX - minX > 70, "横向铺开 > 70%（实际 " + (maxX - minX).toFixed(1) + "%）");
  ok(maxY - minY > 60, "纵向铺开 > 60%（实际 " + (maxY - minY).toFixed(1) + "%）");
  /* 左右平衡：内容左边界到右边界的中点，应当接近舞台中线 */
  const midX = (minX + maxX) / 2;
  ok(Math.abs(midX - 50) < 6, "左右大致对称（内容中线 " + midX.toFixed(1) + "%）");
  const midY = (minY + maxY) / 2;
  ok(Math.abs(midY - 47) < 6, "上下大致对称（内容中线 " + midY.toFixed(1) + "%）");
  ok(center.style.getPropertyValue("--x") === "50", "中心节点钉在 50%");
  /* 主干线必须从中心出发 */
  const hubs = [...d.querySelectorAll("#fv-stage .fv-link-hub")];
  ok(hubs.length === 5, "主干线 5 条");
  ok(
    hubs.every((l) => l.getAttribute("x1") === "50" && l.getAttribute("y1") === "47"),
    "主干线都从中心 (50, 47) 出发"
  );

  console.log("\n── ③ 浮动 ──");
  ok(/@keyframes fvIn/.test(landingCss), "入场关键帧 fvIn 存在");
  ok(/@keyframes fvBloom/.test(landingCss), "连线绽开关键帧 fvBloom 存在");
  const nodeRule = rule(landingCss, "#view-landing .fv-node");
  ok(/transform: translate\(-50%, -50%\)/.test(nodeRule), "居中用 transform，与位移分离（互不覆盖）");
  ok(/opacity: 0/.test(nodeRule), "未入场时不可见，不闪一帧裸文字");
  ok(/requestAnimationFrame/.test(voicesSrc), "位移由逐帧驱动（线的两端才咬得住）");
  ok(/style\.translate/.test(voicesSrc), "浮动写的是 translate 属性");
  ok(!/style\.transform/.test(voicesSrc), "不碰 transform（那是居中的活）");
  ok(/IntersectionObserver/.test(voicesSrc), "进视口才跑，离开即停");
  ok(/visibilitychange/.test(voicesSrc), "切到后台即停，不空转");
  ok(!/@keyframes fvDrift/.test(landingCss), "旧的 CSS 位移关键帧已移除（点与线必须同源）");
  const durs = new Set(nodes.map((n) => n.style.getPropertyValue("--dur")));
  const dels = new Set(nodes.map((n) => n.style.getPropertyValue("--del")));
  const axs = new Set(nodes.map((n) => n.style.getPropertyValue("--ax")));
  ok(durs.size >= 4, "时长至少 4 种（实际 " + durs.size + "）");
  ok(dels.size >= 8, "相位至少 8 种错开（实际 " + dels.size + "）");
  ok(axs.size >= 3, "横摆幅度至少 3 种（实际 " + axs.size + "）");
  ok(
    [...dels].every((v) => parseFloat(v) < 0),
    "相位用负延迟：首屏即刻处于动画中段，不是整齐地从 0 开始"
  );
  ok(
    nodes.every((n) => parseFloat(n.style.getPropertyValue("--ax")) >= 3),
    "每个点都有可见幅度（中心 3.6 / 主题 8+ / 细节 11+）"
  );

  console.log("\n── ③b 位移与端点 ──");
  ok(w.__bpVoices.motion === "static", "无 IntersectionObserver 时不启动 rAF（jsdom 走静态）");
  ok(d.getElementById("fv-stage").classList.contains("is-live"), "静态兜底也要挂 is-live，否则永远停在入场首帧");

  const snap = w.__bpVoices.tick(4.2);
  ok(snap.nodes === 26 && snap.links === 25, "tick 能驱动全部 26 点 / 25 线");
  ok(
    snap.dx.some((v) => Math.abs(v) > 3),
    "推进到第 4.2 秒，确有节点被推开（最大 " + Math.max(...snap.dx.map(Math.abs)).toFixed(1) + "px）"
  );
  ok(
    snap.dx.slice(1).some((v, i) => Math.abs(v - snap.dx[i]) > 0.2),
    "相邻两点的位移不等（不是整块刚性平移）"
  );

  const hub0 = d.querySelector("#fv-stage .fv-link-hub");
  const cdx = parseFloat(d.querySelector("#fv-stage .fv-center").style.translate.split(" ")[0]);
  const wantX = 50 + (cdx * 100) / 1180;
  ok(Math.abs(wantX - parseFloat(hub0.getAttribute("x1"))) < 0.02, "主干线起点跟着中心一起动（同一份位移，差 < 0.02）");
  const leavesAll = [...d.querySelectorAll("#fv-stage .fv-link:not(.fv-link-hub)")];
  ok(
    leavesAll.every((l) => {
      const v = ["x1", "y1", "x2", "y2"].map((k) => parseFloat(l.getAttribute(k)));
      return v.every((n) => isFinite(n) && n > -20 && n < 120);
    }),
    "所有端点换算后仍落在合理范围（没有 NaN / 飞出舞台）"
  );

  console.log("\n── ④ 弹卡 ──");
  const tip = d.getElementById("fv-tip");
  ok(tip && tip.getAttribute("aria-hidden") === "true", "初始 aria-hidden = true");
  ok(/transition: opacity 0\.2s/.test(rule(landingCss, "#view-landing .fv-tip")), "出入过渡 0.2s（照参考站）");
  ok(/border-radius: 12px/.test(rule(landingCss, "#view-landing .fv-tip")), "卡片圆角 12px");
  ok(
    /0 4px 24px rgba\(0, 0, 0, 0\.08\)/.test(rule(landingCss, "#view-landing .fv-tip")),
    "卡片阴影 0 4px 24px / 8%（参考站实测值）"
  );

  const leaf = leaves.find((n) => n.textContent.trim() === "证据引原话");
  ok(!!leaf, "找到「证据引原话」节点");
  w.__bpVoices.show(leaf);
  ok(tip.classList.contains("is-on"), "show() 后卡片打开");
  ok(tip.getAttribute("aria-hidden") === "false", "打开后 aria-hidden = false");
  ok(tip.querySelector(".fv-tip-name").textContent === "证据引原话", "卡片标题是节点名");
  ok(tip.querySelector(".fv-tip-group").textContent === "可解释评分", "卡片副标题是所属主题");
  ok(tip.querySelector(".fv-tip-idx").textContent === "01", "序号是主题编号 01");
  ok(/原文片段/.test(tip.querySelector(".fv-tip-body").textContent), "卡片正文是该节点的解释");
  ok(leaf.classList.contains("is-hot"), "被悬停的节点挂 is-hot");
  const tipLeft = parseFloat(tip.style.left);
  const tipTop = parseFloat(tip.style.top);
  ok(tipLeft >= 0 && tipLeft <= 1180 - 272, "卡片左边界在舞台内（" + tipLeft + "）");
  ok(tipTop >= 0 && tipTop <= 520 - 100, "卡片上边界在舞台内（" + tipTop + "）");

  w.__bpVoices.hide();
  ok(!tip.classList.contains("is-on"), "hide() 后卡片关闭");
  ok(tip.getAttribute("aria-hidden") === "true", "关闭后 aria-hidden 复原");
  ok(leaf.classList.contains("is-hot") === false, "is-hot 清掉");

  /* 主题节点给的是这一组的综述，不是某一条的说明 */
  const gNode = groups[2];
  w.__bpVoices.show(gNode);
  ok(tip.querySelector(".fv-tip-group").textContent === "4 个实现点", "主题节点的副标题写「4 个实现点」");
  ok(tip.querySelector(".fv-tip-name").textContent === gNode.textContent.trim(), "主题节点显示自己的名字");
  ok(d.getElementById("fv-stage").dataset.focus === "2", "悬停哪一组，舞台就记下哪个焦点（其余四组退背景）");
  ok(/\[data-focus="2"\] \.fv-node\[data-g="2"\]/.test(landingCss), "焦点组的文字保住墨色（CSS 里按分组编号各写一条）");
  w.__bpVoices.hide();
  ok(!d.getElementById("fv-stage").dataset.focus, "关闭后焦点撤销，五组重新等权");

  console.log("\n── ⑤ 降级 ──");
  const rm = media(landingCss, "@media (prefers-reduced-motion: reduce)");
  ok(/\.fv-node\s*\{[^}]*animation: none/.test(rm), "reduced-motion 下浮动全停");
  ok(/\.fv-node\s*\{[^}]*opacity: 1/.test(rm), "reduced-motion 下节点直接可见（不留半透明）");
  ok(/\.fv-links\s*\{[^}]*clip-path: none/.test(rm), "reduced-motion 下不裁剪（圆不开就一条线都没有）");
  const narrow = media(landingCss, "@media (max-width: 900px)");
  ok(/\.fv-stage\s*\{[^}]*display: none/.test(narrow), "窄屏隐藏力导图");
  ok(/\.fv-list\s*\{[^}]*display: block/.test(narrow), "窄屏改用分组列表");
  ok(/\.fv-hint-hover\s*\{[^}]*display: none/.test(narrow), "窄屏不写「悬停」（触屏没有悬停）");
  ok(/\.fv-hint-tap\s*\{[^}]*display: inline/.test(narrow), "窄屏换成触屏也成立的引导句");

  const listGroups = [...d.querySelectorAll("#fv-list .fv-list-group")];
  ok(listGroups.length === 5, "窄屏列表 5 组，实际 " + listGroups.length);
  ok(d.querySelectorAll("#fv-list dt").length === 20, "窄屏列表 20 条");
  ok(listGroups[0].querySelector("dd").textContent.includes("权重"), "窄屏列表带解释正文（不是只有标题）");

  const wNoJs = boot({ plain: true });
  await new Promise((r) => setTimeout(r, 150));
  ok(wNoJs.document.querySelectorAll("#fv-stage .fv-node").length === 0, "无 JS：不生成任何节点");
  ok(
    !wNoJs.document.getElementById("fv-stage").classList.contains("fv-ready"),
    "无 JS：舞台不挂 fv-ready（留空也不留残影）"
  );
  wNoJs.close();

  const wRm = boot({ matchMedia: NO_MOTION });
  await new Promise((r) => setTimeout(r, 400));
  ok(wRm.document.querySelectorAll("#fv-stage .fv-node").length === 26, "reduced-motion 下节点照常生成（只是不飘）");
  wRm.close();

  console.log("\n── ⑥ 文案诚实 ──");
  const allText = nodes.map((n) => n.textContent.trim()).join("|");
  ok(!/用户说|好评|赞不绝口|口碑|五星/.test(allText), "不编造用户评价（没有真实用户就不假装有）");
  ok(!/开发者的话|他们说/.test(indexHtml), "标题不冒充「用户证言」");
  const bodies = [...d.querySelectorAll("#fv-list dd")].map((e) => e.textContent);
  ok(bodies.length === 20 && bodies.every((b) => b.length >= 14), "20 条解释都写成了完整句子");
  ok(
    bodies.every((b) => !/领先|第一|最强|唯一/.test(b)),
    "解释里没有绝对化宣传词（写的是实现，不是卖点）"
  );
  ok(/scoring|评分模块|公式/.test(bodies.join("")), "评分那条讲的是确定性公式，与 scoring 口径一致");
  ok(/不上行|不出端|端侧/.test(bodies.join("")), "隐私那条讲的是数据不出端，与既有承诺一致");

  console.log("\n── ⑦ 成品 ──");
  ok(demoHtml.includes("@keyframes fvBloom"), "演示包内联了连线绽开关键帧");
  ok(demoHtml.includes("fv-tip-body"), "演示包内联了卡片结构");
  ok(/__bpVoices/.test(voicesSrc), "模块自报打点，便于现场核对");
  ok(!/getContext\(|createElement\("canvas"\)/.test(voicesSrc), "没有走 canvas 路线（可选中 / 可读屏 / 可打印）");
  ok(!/!important/.test(voicesSrc), "模块内零 !important");
  ok(!/!important/.test(rule(landingCss, "#view-landing .fv-node")), "节点规则零 !important");

  console.log("\n" + (fail === 0 ? "✅ 全部通过" : "❌ 有失败") + "：" + pass + " 通过 / " + fail + " 失败");
  w.close();
  process.exit(fail === 0 ? 0 : 1);
})();
