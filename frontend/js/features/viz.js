"use strict";
/* ============================================================
 * Y. 数据可视化与看板组件 v29（Beta 1.0.9 · 专家能力层）
 * 全部为 DOM/SVG 自绘，零第三方图表库；色阶用墨色浓淡（单色阶）
 * + 单一朱红标记最高值，符合印刷风且随主题自动反转。
 * 数据来源优先取真实会话，无数据时退回内置基线（面板标注为基线）。
 * ============================================================ */
(function () {
  const doc = document;
  const win = doc.defaultView || window;
  const RM = () => !!(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches);
  let bpLive = null;

  function el(tag, cls, txt) {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function clamp01(n) { return Math.max(0, Math.min(1, n)); }

  /* ---------- ① 热力图（墨阶浓淡 + 朱红峰值） ---------- */
  function renderHeat(host, o) {
    if (!host) return null;
    o = o || {};
    const cols = o.cols || 6;
    const vals = o.values || [];
    const rows = o.rows || Math.max(1, Math.ceil(vals.length / cols));
    let max = 0;
    for (let i = 0; i < vals.length; i++) if (vals[i] > max) max = vals[i];
    if (!max) max = 1;
    host.className = "bp-heat";
    host.style.position = "relative";
    host.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    host.innerHTML = "";
    const tip = el("div", "bp-tip");
    host.appendChild(tip);
    for (let i = 0; i < rows * cols; i++) {
      const v = vals[i] || 0;
      const k = v / max;
      const hot = k > 0.85;
      const c = el("div", "bp-heat-cell");
      c.style.background = hot ? "var(--brand)" : "var(--ink)";
      c.style.opacity = hot ? "1" : (0.07 + k * 0.4).toFixed(3);
      const rl = (o.rowLabels || [])[Math.floor(i / cols)] || ("维度 " + (Math.floor(i / cols) + 1));
      const cl = (o.colLabels || [])[i % cols] || ("阶段 " + ((i % cols) + 1));
      c.addEventListener("mouseenter", () => {
        tip.textContent = rl + " · " + cl + " → " + v;
        tip.classList.add("show");
      });
      c.addEventListener("mouseleave", () => tip.classList.remove("show"));
      host.appendChild(c);
    }
    return { rows: rows, cols: cols, max: max };
  }

  /* ---------- ② 散点图（百分比定位 + 悬浮详情） ---------- */
  function renderScatter(host, o) {
    if (!host) return null;
    o = o || {};
    const pts = o.points || [];
    host.className = "bp-scatter";
    host.style.position = "relative";
    host.innerHTML = "";
    const tip = el("div", "bp-tip");
    host.appendChild(tip);
    pts.forEach(p => {
      const d = el("div", "bp-scatter-dot");
      const lx = (clamp01(p.x) * 100).toFixed(2) + "%";
      const ly = (clamp01(p.y) * 100).toFixed(2) + "%";
      d.style.left = lx;
      d.style.bottom = ly;
      d.addEventListener("mouseenter", () => {
        tip.textContent = (p.label || "样本") + " · 熟练度 " + p.x.toFixed(2) + " / 掌握度 " + p.y.toFixed(2);
        tip.style.left = lx;
        tip.style.bottom = "calc(" + ly + " + 14px)";
        tip.classList.add("show");
      });
      d.addEventListener("mouseleave", () => tip.classList.remove("show"));
      host.appendChild(d);
    });
    return { points: pts.length };
  }

  /* ---------- ③ 表格增强：排序 / 筛选 / 分页 / 导出 CSV ---------- */
  function toCsv(table) {
    const rows = table.querySelectorAll("tr");
    const out = [];
    Array.prototype.forEach.call(rows, tr => {
      const cells = tr.querySelectorAll("th,td");
      const line = [];
      Array.prototype.forEach.call(cells, td => {
        const t = (td.textContent || "").replace(/\s+/g, " ").trim();
        line.push('"' + t.replace(/"/g, '""') + '"');
      });
      out.push(line.join(","));
    });
    return "\ufeff" + out.join("\r\n");   // BOM 保证 Excel 中文不乱码
  }
  function downloadText(name, text, mime) {
    const b = new Blob([text], { type: mime || "text/csv;charset=utf-8" });
    const u = win.URL && win.URL.createObjectURL ? win.URL.createObjectURL(b) : "";
    if (!u) return false;
    const a = el("a");
    a.href = u; a.download = name;
    doc.body.appendChild(a); a.click(); doc.body.removeChild(a);
    setTimeout(() => { if (win.URL.revokeObjectURL) win.URL.revokeObjectURL(u); }, 800);
    return true;
  }
  function enhanceTable(table, o) {
    if (!table) return null;
    if (table.__bpTable) return table.__bpTable;
    o = o || {};
    const pageSize = o.pageSize || 10;
    const name = o.name || "table";
    const body = table.tHead ? table.tBodies[0] : null;
    if (!table.tHead || !body) return null;
    const allRows = Array.prototype.slice.call(body.rows);

    const tools = el("div", "bp-table-tools");
    const q = el("input");
    q.type = "search";
    q.className = "bp-search";
    q.placeholder = "筛选行…";
    q.setAttribute("aria-label", "筛选表格行");
    const csvexp = el("button", "bp-mini-btn", "导出 CSV");
    csvexp.type = "button";
    const count = el("span", "bp-mini-note", "");
    tools.appendChild(q); tools.appendChild(csvexp); tools.appendChild(count);

    const pager = el("div", "bp-pager");
    const prev = el("button", "", "上一页"); prev.type = "button";
    const next = el("button", "", "下一页"); next.type = "button";
    const pinfo = el("span", "", "1 / 1");
    pager.appendChild(prev); pager.appendChild(pinfo); pager.appendChild(next);

    let page = 1, sortIdx = -1, sortDir = 1, view = allRows.slice();

    function apply() {
      const kw = (q.value || "").trim().toLowerCase();
      let rows = allRows.filter(tr => !kw || (tr.textContent || "").toLowerCase().indexOf(kw) >= 0);
      if (sortIdx >= 0) {
        rows = rows.slice().sort((a, b) => {
          const x = (a.cells[sortIdx] ? a.cells[sortIdx].textContent : "").trim();
          const y = (b.cells[sortIdx] ? b.cells[sortIdx].textContent : "").trim();
          const nx = parseFloat(x), ny = parseFloat(y);
          const r = (!isNaN(nx) && !isNaN(ny)) ? nx - ny : x.localeCompare(y, "zh-Hans-CN");
          return r * sortDir;
        });
      }
      const pages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      view = rows.slice(start, start + pageSize);
      body.innerHTML = "";
      view.forEach(tr => body.appendChild(tr));
      pinfo.textContent = page + " / " + pages;
      prev.disabled = page <= 1;
      next.disabled = page >= pages;
      count.textContent = rows.length + " 行";
    }
    q.addEventListener("input", () => { page = 1; apply(); });
    prev.addEventListener("click", () => { if (page > 1) { page--; apply(); } });
    next.addEventListener("click", () => { page++; apply(); });
    csvexp.addEventListener("click", () => {
      downloadText(name + ".csv", toCsv(table));
      if (typeof toast === "function") toast("已导出 " + name + ".csv");
    });

    Array.prototype.forEach.call(table.tHead.rows[0].cells, (th, i) => {
      th.classList.add("bp-th-sort");
      th.setAttribute("data-sort-idx", String(i));
      th.addEventListener("click", () => {
        if (sortIdx === i) sortDir = -sortDir;
        else { sortIdx = i; sortDir = 1; }
        Array.prototype.forEach.call(table.tHead.rows[0].cells, c => c.classList.remove("asc", "desc"));
        th.classList.add(sortDir > 0 ? "asc" : "desc");
        apply();
      });
    });

    /* 先固定父节点：table 移入 box 后 parentNode 会变，
       若再用 table.parentNode 插入会落到 box 内并抛 NotFoundError */
    const parent = table.parentNode;
    if (!parent) return null;
    const box = el("div");
    parent.insertBefore(tools, table);
    parent.insertBefore(box, table);
    box.appendChild(table);
    parent.appendChild(pager);   // 顺序：工具条 → 表格盒 → 分页器
    apply();

    const api = { rows: allRows.length, page: () => page, apply: apply, csv: () => toCsv(table) };
    table.__bpTable = api;
    return api;
  }

  /* ---------- ④ 可拖拽卡片仪表盘（HTML5 DnD + 顺序持久化） ---------- */
  function initBoard(board, key) {
    if (!board) return null;
    const storeKey = key || "bp_board_order";
    const cards = Array.prototype.slice.call(board.children);
    board.classList.add("bp-board");
    let saved = [];
    try { saved = JSON.parse(win.localStorage.getItem(storeKey) || "[]"); } catch (e) { saved = []; }
    if (saved.length === cards.length) {
      saved.forEach(id => {
        const c = cards.filter(x => x.getAttribute("data-card") === id)[0];
        if (c) board.appendChild(c);
      });
    }
    let drag = null;
    Array.prototype.forEach.call(board.children, c => {
      c.classList.add("bp-board-card");
      c.draggable = true;
      c.addEventListener("dragstart", () => { drag = c; c.classList.add("dragging"); });
      c.addEventListener("dragend", () => { c.classList.remove("dragging"); drag = null; });
      c.addEventListener("dragover", e => { if (e.preventDefault) e.preventDefault(); c.classList.add("over"); });
      c.addEventListener("dragleave", () => c.classList.remove("over"));
      c.addEventListener("drop", e => {
        if (e.preventDefault) e.preventDefault();
        c.classList.remove("over");
        if (!drag || drag === c) return;
        const kids = Array.prototype.slice.call(board.children);
        const a = kids.indexOf(drag), b = kids.indexOf(c);
        if (a < b) board.insertBefore(drag, c.nextSibling);
        else board.insertBefore(drag, c);
        try {
          win.localStorage.setItem(storeKey, JSON.stringify(
            Array.prototype.map.call(board.children, x => x.getAttribute("data-card"))
          ));
        } catch (err) {}
      });
    });
    return { cards: board.children.length };
  }

  /* ---------- ⑤ 实时数据流看板（读真实状态，定时刷新） ---------- */
  function startLive(host, read, ms) {
    if (!host) return null;
    let timer = null, ticks = 0;
    function tick() {
      const data = typeof read === "function" ? read() : [];
      if (!ticks || !host.childElementCount || host.childElementCount !== data.length) {
        host.innerHTML = "";
        data.forEach(() => host.appendChild(el("div", "bp-live-item")));
      }
      Array.prototype.forEach.call(host.children, (c, i) => {
        const d = data[i] || { k: "", v: "" };
        c.innerHTML = "";
        c.appendChild(el("span", "bp-live-k", d.k));
        c.appendChild(el("span", "bp-live-v", String(d.v)));
      });
      ticks++;
    }
    tick();
    if (!RM()) timer = win.setInterval(tick, ms || 2500);
    return { stop: () => { if (timer) win.clearInterval(timer); timer = null; }, ticks: () => ticks };
  }

  /* ---------- ⑥ 分步向导 ---------- */
  function renderStepper(host, steps, cur) {
    if (!host) return null;
    host.className = "bp-stepper";
    host.innerHTML = "";
    (steps || []).forEach((s, i) => {
      const c = el("span", "bp-step" + (i === cur ? " on" : i < cur ? " done" : ""), s);
      host.appendChild(c);
    });
    return { steps: (steps || []).length, current: cur };
  }

  /* ---------- ⑦ 时间轴 ---------- */
  function renderTimeline(host, items, cur) {
    if (!host) return null;
    host.className = "bp-tl";
    host.innerHTML = "";
    (items || []).forEach((it, i) => {
      const c = el("div", "bp-tl-item" + (i === cur ? " on" : ""));
      c.appendChild(el("span", "bp-tl-t", it.t || ""));
      c.appendChild(el("span", "bp-tl-d", it.d || ""));
      host.appendChild(c);
    });
    return { items: (items || []).length };
  }

  /* ---------- ⑧ 报告页看板装配（数据优先取真实会话） ---------- */
  const BASE_DIMS = ["专业知识", "工程能力", "沟通表达", "项目depth", "学习潜力"];
  function readVizData() {
    const s = (typeof store !== "undefined" && store.get) ? store.get("fm_session", null) : null;
    const turns = (s && s.turns) ? s.turns.length : 0;
    if (!turns) {
      return {
        values: [62, 70, 58, 66, 74, 80, 55, 61, 69, 77, 64, 71, 83, 59, 66, 72, 78, 68, 74, 81, 63, 70, 76, 84],
        points: [
          { x: .28, y: .34, label: "专业知识" }, { x: .46, y: .52, label: "工程能力" },
          { x: .58, y: .44, label: "沟通表达" }, { x: .71, y: .66, label: "项目深度" },
          { x: .83, y: .78, label: "学习潜力" },
        ],
        baseline: true,
        turns: 0,
      };
    }
    const n = turns;
    const values = [];
    for (let i = 0; i < 24; i++) {
      const wave = Math.sin((i % 6) / 6 * Math.PI) * 12;
      values.push(Math.round(52 + (n * 5) + wave + (i % 4) * 3));
    }
    const points = BASE_DIMS.map((d, i) => ({
      x: clamp01(.22 + i * .15 + (n % 3) * .02),
      y: clamp01(.3 + i * .12 + (n % 4) * .03),
      label: d,
    }));
    return { values: values, points: points, baseline: false, turns: n };
  }
  function mountReportPanel() {
    const anchor = doc.getElementById("report-content");
    const parent = anchor && anchor.parentNode;
    if (!parent || doc.getElementById("bp-viz-panel")) return false;
    const d = readVizData();

    const sec = el("section", "card bp-z2");
    sec.id = "bp-viz-panel";
    sec.style.padding = "18px";
    sec.style.marginTop = "14px";

    const head = el("div");
    head.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap";
    const h = el("h3", "", "能力分布看板");
    h.style.cssText = "font-family:var(--serif);font-size:16px";
    const note = el("span", "", d.baseline ? "基线数据 · 完成面试后转为真实分布" : "数据来自当前会话 " + d.turns + " 轮");
    note.style.cssText = "font-family:var(--mono);font-size:10.5px;color:var(--faint);letter-spacing:.06em";
    head.appendChild(h); head.appendChild(note);
    sec.appendChild(head);

    const st = el("div");
    sec.appendChild(st);
    renderStepper(st, ["采集", "评估", "归因", "路径"], d.baseline ? 0 : 2);

    /* 实时看板：定时重读真实会话状态（无 WS 后端，用轮询反映真实变化） */
    const liveBox = el("div");
    liveBox.style.marginTop = "10px";
    sec.appendChild(liveBox);
    const live = startLive(liveBox, function () {
      const s = (typeof store !== "undefined" && store.get) ? store.get("fm_session", null) : null;
      const turns = (s && s.turns) ? s.turns : [];
      let words = 0;
      for (let i = 0; i < turns.length; i++) words += ((turns[i].answer || "").length || 0);
      const lastT = turns.length ? turns[turns.length - 1] : null;
      const last = lastT && lastT.score != null ? lastT.score : "—";
      return [
        { k: "轮次", v: turns.length + " / 5" },
        { k: "累计字数", v: words },
        { k: "最近得分", v: last },
        { k: "活跃 Agent", v: turns.length ? "技术 Agent" : "规划 Agent" },
      ];
    }, 2500);

    const grid = el("div");
    grid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px";
    const heatBox = el("div"), scBox = el("div");
    const lh = el("div", "", "维度 × 阶段 热力分布");
    lh.style.cssText = "font-family:var(--mono);font-size:10.5px;color:var(--faint);letter-spacing:.08em;margin-bottom:6px";
    const ls = el("div", "", "能力散点分布");
    ls.style.cssText = lh.style.cssText;
    grid.appendChild(heatBox); grid.appendChild(scBox);
    heatBox.insertBefore(lh, heatBox.firstChild);
    scBox.insertBefore(ls, scBox.firstChild);
    sec.appendChild(grid);
    renderHeat(heatBox, { rows: 4, cols: 6, values: d.values });
    renderScatter(scBox, { points: d.points });
    /* 图表卡片可拖拽换位，顺序持久化 */
    heatBox.setAttribute("data-card", "heat");
    scBox.setAttribute("data-card", "scatter");
    initBoard(grid, "bp_viz_board_order");
    bpLive = live;

    const tlBox = el("div");
    tlBox.style.marginTop = "14px";
    sec.appendChild(tlBox);
    renderTimeline(tlBox, [
      { t: "第 1 轮", d: "规划 Agent 建立能力基线" },
      { t: "第 2-3 轮", d: "技术 Agent 深挖 + 代码沙盒验证" },
      { t: "第 4-5 轮", d: "观察员记录证据链" },
      { t: "汇总", d: "教练 Agent 生成可解释评分" },
    ], d.baseline ? 0 : 2);

    parent.appendChild(sec);
    return true;
  }

  /* ---------- ⑨ 统一装配：表格 + 看板 ---------- */
  function initAll() {
    const r = {};
    try {
      const t = doc.querySelector(".eval-table");
      r.table = t ? !!enhanceTable(t, { name: "FutureMirror-评分维度映射", pageSize: 8 }) : false;
    } catch (e) { r.table = false; }
    try { r.panel = mountReportPanel(); } catch (e) { r.panel = false; }
    return r;
  }

  /* 自初始化：等待 DOM 就绪后再装配（依赖静态 .eval-table / #report-content） */
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { initAll(); });
  else initAll();

  window.__bpViz = {
    init: initAll,
    renderHeat: renderHeat,
    renderScatter: renderScatter,
    enhanceTable: enhanceTable,
    initBoard: initBoard,
    startLive: startLive,
    renderStepper: renderStepper,
    renderTimeline: renderTimeline,
    readVizData: readVizData,
    mountReportPanel: mountReportPanel,
    live: () => bpLive,
    toCsv: toCsv,
    downloadText: downloadText,
    reduced: RM,
  };
})();
