/* 临时复现：能力分布看板是否挂载 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");
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
    const mk = (q, m) => ({ matches: m, media: q, addListener: noop, removeListener: noop, addEventListener: noop, removeEventListener: noop });
    window.matchMedia = q => mk(q, false);
  },
});
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await wait(1200);
  const w = dom.window, d = w.document;
  console.log("readyState:", d.readyState);
  console.log("__bpViz:", typeof w.__bpViz);
  if (w.__bpViz) {
    try { console.log("initAll():", JSON.stringify(w.__bpViz.init())); } catch (e) { console.log("initAll threw:", e.message); }
  }
  const panel = d.getElementById("bp-viz-panel");
  console.log("#bp-viz-panel:", !!panel);
  if (panel) {
    console.log("panel parent:", panel.parentNode && panel.parentNode.className);
    console.log("panel children:", panel.children.length);
    console.log("live items:", panel.querySelectorAll(".bp-live-item").length);
    console.log("heat cells:", panel.querySelectorAll(".bp-heat-cell").length);
    console.log("scatter dots:", panel.querySelectorAll(".bp-scatter-dot").length);
  }
  const rc = d.getElementById("report-content");
  console.log("report-content parent children:", rc ? [...rc.parentNode.children].map(c => c.id || c.tagName).join(",") : "none");
  console.log("errors:", errors.slice(0, 10));
  process.exit(0);
})();
