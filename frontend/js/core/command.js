"use strict";
/* ============================================================
 * v26 · 命令面板（Blueprint Command Palette）
 * 设计要点：
 * 1) Ctrl/⌘+K 呼出（面试页保留原行为：聚焦输入框，避免双入口冲突）；
 * 2) 蓝图语言：直角墨框 + 等宽输入 + 朱红选中条（border-left 点亮），
 *    无圆角、无阴影、无渐变——与全局视觉宪法一致；
 * 3) 分组（导航 / 页面 / 动作）+ 子串过滤（label / 关键词 / 分组）；
 * 4) 键盘：↑↓ 选择 · Enter 执行 · Esc 关闭 · 点击遮罩关闭；
 * 5) 纯增强：DOM 懒建（首次打开才注入），异常只静默跳过。
 * ============================================================ */
(function initCommandPalette() {
  const reduced = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };

  /* ---------- 动作清单 ---------- */
  function jump(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    const y = el.getBoundingClientRect().top + (window.scrollY || 0) - 72;
    try { window.scrollTo({ top: y, behavior: reduced() ? "auto" : "smooth" }); }
    catch (e) { try { window.scrollTo(0, y); } catch (e2) { /* 老浏览器兜底 */ } }
  }
  function page(p) {
    if (typeof showView === "function") showView("app");
    if (typeof navTo === "function") navTo(p);
  }
  const ACTIONS = [
    { group: "导航", label: "功能矩阵", hint: "§ 01", kw: "features 功能 特性", run: () => jump("#features") },
    { group: "导航", label: "使用流程", hint: "§ 02", kw: "workflow 流程 四步", run: () => jump("#workflow") },
    { group: "导航", label: "关键数字", hint: "§ 03", kw: "stats 数据 指标", run: () => jump("#stats") },
    { group: "导航", label: "更新日志", hint: "CHANGELOG", kw: "changelog 日志 版本", run: () => { try { window.open("changelog.html", "_blank"); } catch (e) {} } },
    { group: "页面", label: "工作台", hint: "DASHBOARD", kw: "dashboard 首页 工作台", run: () => page("dashboard") },
    { group: "页面", label: "简历匹配", hint: "MATCH", kw: "match 简历 匹配 jd", run: () => page("match") },
    { group: "页面", label: "模拟面试", hint: "INTERVIEW", kw: "interview 面试 多agent", run: () => page("interview") },
    { group: "页面", label: "面经问答", hint: "RAG", kw: "rag 面经 问答 检索", run: () => page("rag") },
    { group: "页面", label: "简历优化", hint: "RESUME", kw: "resume 简历 优化 改写", run: () => page("resume") },
    { group: "页面", label: "职业探索", hint: "CAREER", kw: "career 职业 探索 岗位", run: () => page("career") },
    { group: "页面", label: "评估报告", hint: "REPORT", kw: "report 报告 评分 雷达", run: () => page("report") },
    { group: "页面", label: "题库小测", hint: "QUIZ", kw: "quiz 题库 小测 刷题", run: () => page("quiz") },
    { group: "页面", label: "学习计划", hint: "PLAN", kw: "plan 学习 计划 七天 路径 时间分配", run: () => page("plan") },
    { group: "页面", label: "求职管理", hint: "JOBS", kw: "jobs 求职 投递 管理", run: () => page("jobs") },
    { group: "页面", label: "个人中心", hint: "PROFILE", kw: "profile 个人 中心 头像", run: () => page("profile") },
    { group: "动作", label: "切换亮 / 暗主题", hint: "THEME", kw: "theme 主题 暗色 亮色", run: () => { if (typeof toggleTheme === "function") toggleTheme(); } },
    { group: "动作", label: "主题：跟随系统（自动明暗）", hint: "AUTO", kw: "auto 自动 跟随系统 system 主题", run: () => { if (typeof setThemeMode === "function") setThemeMode("auto"); } },
    { group: "动作", label: "开发者模式", hint: "EVALUATOR", kw: "dev evaluator 开发者 访客", run: () => { if (typeof openEvaluatorGate === "function") openEvaluatorGate(); } },
    { group: "动作", label: "回到顶部", hint: "TOP", kw: "top 顶部 返回", run: () => { try { window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); } catch (e) { try { window.scrollTo(0, 0); } catch (e2) {} } } },
  ];

  const CMD = (window.__bpCmd = { open: false, items: ACTIONS.length, visible: 0, sel: -1, recent: [] });

  /* v28 · 命令面板 Pro：页面 id 映射 + 最近访问 + 子序列评分 + 面试上下文指令 */
  const PAGE_OF = {
    "工作台": "dashboard", "简历匹配": "match", "模拟面试": "interview", "面经问答": "rag",
    "简历优化": "resume", "职业探索": "career", "评估报告": "report", "题库小测": "quiz",
    "学习计划": "plan", "求职管理": "jobs", "个人中心": "profile",
  };
  ACTIONS.forEach(a => { if (PAGE_OF[a.label]) a.page = PAGE_OF[a.label]; });

  const RECENT_KEY = "fm_recent_pages";
  function loadRecent() { try { return JSON.parse(sessionStorage.getItem(RECENT_KEY) || "[]"); } catch (e) { return []; } }
  function saveRecent(arr) { try { sessionStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, 5))); } catch (e) {} }
  function recordRecent(page) {
    if (!page) return;
    const cur = loadRecent().filter(p => p !== page);
    cur.unshift(page);
    saveRecent(cur);
    CMD.recent = cur.slice(0, 5);
  }
  /* 包装 navTo 以记录最近访问（行为完全不变，仅旁路记录） */
  try {
    const _navTo = window.navTo;
    if (typeof _navTo === "function" && !_navTo.__wrapped) {
      window.navTo = function (p) { try { recordRecent(p); } catch (e) {} return _navTo.apply(this, arguments); };
      window.navTo.__wrapped = true;
    }
  } catch (e) {}
  CMD.recent = loadRecent().slice(0, 5);

  /* 子序列评分：标签前缀 > 子串 > 子序列（按字符顺序出现） */
  function scoreAction(a, q) {
    const f = (a.label + " " + a.group + " " + a.kw).toLowerCase();
    if (f.includes(q)) {
      if (a.label.toLowerCase().startsWith(q)) return 100;
      if (a.label.toLowerCase().includes(q)) return 60;
      return 40;
    }
    let qi = 0;
    for (let i = 0; i < f.length && qi < q.length; i++) if (f[i] === q[qi]) qi++;
    return qi === q.length ? 10 : 0;
  }
  /* 面试页上下文指令（动态注入，仅在该页出现） */
  function dynamicActions() {
    if (typeof currentPage !== "function" || currentPage() !== "interview") return [];
    return [
      { group: "面试", label: "清空对话记录", hint: "RESET", kw: "清空 重置 重来 对话 面试", run: () => { if (typeof restartInterview === "function") restartInterview(); } },
      { group: "面试", label: "切换面试模式", hint: "MODE", kw: "模式 综合 技术 压力 切换", run: () => { try { cycleMode(); } catch (e) {} } },
      { group: "面试", label: "查看能力评分", hint: "REPORT", kw: "评分 报告 能力 查看", run: () => { if (typeof showView === "function") showView("app"); if (typeof navTo === "function") navTo("report"); } },
    ];
  }
  function cycleMode() {
    const order = ["general", "tech", "pressure"];
    const cur = (typeof session !== "undefined" && session && session.mode) || "general";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    if (typeof setMode === "function") setMode(next);
  }
  /* 测试钩子：暴露动态指令与评分函数，供 v28 jsdom 测试断言（不影响生产行为） */
  CMD._dyn = dynamicActions;
  CMD._score = scoreAction;

  let overlay = null, input = null, list = null, count = null;
  let current = ACTIONS.slice();

  function ensureDom() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "bp-cmd";
    overlay.id = "bp-cmd";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "命令面板");
    overlay.innerHTML =
      '<div class="bp-cmd-box">' +
      '<div class="bp-cmd-head">' +
      '<span class="bp-cmd-sig" aria-hidden="true">⌘K</span>' +
      '<input id="bp-cmd-input" type="text" placeholder="输入命令 / 页面 / 动作…" aria-label="命令筛选" autocomplete="off" spellcheck="false">' +
      '<span class="bp-cmd-kbd" aria-hidden="true">ESC</span>' +
      "</div>" +
      '<div class="bp-cmd-list" id="bp-cmd-list" role="listbox" aria-label="命令列表"></div>' +
      '<div class="bp-cmd-foot"><span>↑↓ 选择</span><span>↵ 执行</span><span>Esc 关闭</span><span class="bp-cmd-count" id="bp-cmd-count"></span></div>' +
      "</div>";
    (document.body || document.documentElement).appendChild(overlay);
    input = overlay.querySelector("#bp-cmd-input");
    list = overlay.querySelector("#bp-cmd-list");
    count = overlay.querySelector("#bp-cmd-count");
    input.addEventListener("input", () => render(input.value));
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    list.addEventListener("click", e => {
      const it = e.target.closest ? e.target.closest(".bp-cmd-item") : null;
      if (!it || !it._act) return;
      const act = it._act;
      close();
      act.run();
    });
    list.addEventListener("mousemove", e => {
      const it = e.target.closest ? e.target.closest(".bp-cmd-item") : null;
      if (!it) return;
      const idx = current.indexOf(it._act);
      if (idx > -1 && idx !== CMD.sel) { CMD.sel = idx; paintSel(); }
    });
  }

  function render(q) {
    const query = (q || "").trim().toLowerCase();
    const dyn = dynamicActions();
    if (!query) {
      const recent = loadRecent().slice(0, 5);
      CMD.recent = recent;
      const recentItems = recent.map(p => {
        const src = ACTIONS.find(a => a.page === p);
        const label = src ? src.label : p;
        return { group: "最近", label, hint: "↺", kw: p,
          run: () => { if (typeof showView === "function") showView("app"); if (typeof navTo === "function") navTo(p); } };
      });
      current = [...recentItems, ...dyn, ...ACTIONS.slice()];
    } else {
      current = [...dyn, ...ACTIONS].map(a => ({ a, s: scoreAction(a, query) }))
        .filter(x => x.s > 0).sort((x, y) => y.s - x.s).map(x => x.a);
    }
    CMD.visible = current.length;
    CMD.sel = current.length ? 0 : -1;
    if (!current.length) {
      list.innerHTML = '<div class="bp-cmd-empty">无匹配命令 · 试试「面试」「主题」…</div>';
      if (count) count.textContent = "0 项";
      return;
    }
    let html = "", lastGroup = "";
    current.forEach((a, i) => {
      if (a.group !== lastGroup) {
        html += '<div class="bp-cmd-group" role="presentation">' + a.group + "</div>";
        lastGroup = a.group;
      }
      html += '<div class="bp-cmd-item" role="option" data-idx="' + i + '" aria-selected="false">' +
        "<span>" + a.label + "</span>" +
        '<span class="ci-key">' + a.hint + "</span>" +
        "</div>";
    });
    list.innerHTML = html;
    [...list.querySelectorAll(".bp-cmd-item")].forEach((el, i) => { el._act = current[i]; });
    if (count) count.textContent = current.length + " 项";
    paintSel();
  }

  function paintSel() {
    [...list.querySelectorAll(".bp-cmd-item")].forEach((el, i) => {
      const on = i === CMD.sel;
      el.setAttribute("aria-selected", on ? "true" : "false");
      if (on && el.scrollIntoView) { try { el.scrollIntoView({ block: "nearest" }); } catch (e) {} }
    });
  }

  function move(d) {
    if (!current.length) return;
    CMD.sel = (CMD.sel + d + current.length) % current.length;
    paintSel();
  }

  function open() {
    ensureDom();
    overlay.hidden = false;
    input.value = "";
    render("");
    CMD.open = true;
    try { input.focus(); } catch (e) {}
  }
  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    CMD.open = false;
    try { input.blur(); } catch (e) {}
  }
  function exec() {
    const a = current[CMD.sel];
    if (!a) return;
    close();
    a.run();
  }

  /* ---------- 键盘入口 ---------- */
  document.addEventListener("keydown", e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === "k" || e.key === "K")) {
      // 面试页：聚焦输入框的原行为由 reveal.js 的处理函数负责，此处让行
      if (typeof currentPage === "function" && currentPage() === "interview") return;
      e.preventDefault();
      if (CMD.open) close(); else open();
      return;
    }
    if (!CMD.open) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") { e.preventDefault(); exec(); }
  });

  // v39：暴露给顶栏「⌘K」入口按钮（无障碍 / 触屏也可达）
  window.__openCommandPalette = open;
})();
