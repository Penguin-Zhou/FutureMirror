"use strict";
/* ============================================================
 * v19 · 题库与小测模块 + VIP 会员体系
 *   ① QUIZ_CATS / QUIZ_BANK 题库数据层
 *   ② VIP 体系：isVip / syncVipUi / renderVipCard / toggleVipDemo
 *   ③ 题库页：renderQuizPage / switchQuizTab / showQuizCat / backToQuizCats
 *   ④ 小测引擎：startQuiz / 计时器 / answerQuiz / nextQuiz / finishQuiz / quitQuiz
 *   ⑤ 成绩档案：getQuizData / saveQuizRecord / renderQuizStats（fm_quiz）
 * ============================================================ */

/* ---------- ① 题库数据 ---------- */
const QUIZ_CATS = [
  { id: "sql",     icon: "🗄", name: "SQL 数据库",     desc: "连接、索引、事务与 SQL 注入——后端面试高频考点。", vip: false },
  { id: "network", icon: "🌐", name: "计算机网络",     desc: "TCP/UDP、HTTP 与 HTTPS、DNS——网络基础一网打尽。", vip: false },
  { id: "os",      icon: "💻", name: "操作系统",       desc: "进程线程、内存管理、死锁与 IO 模型。", vip: true },
  { id: "algo",    icon: "🧮", name: "算法与数据结构", desc: "复杂度分析、哈希、排序与高频算法思路。", vip: true },
  { id: "star",    icon: "⭐", name: "STAR 行为面",    desc: "行为面试经典问题与结构化表达框架。", vip: true },
];

const QUIZ_BANK = [
  /* ---- SQL 数据库（免费） ---- */
  {
    id: "sql-1", cat: "sql", level: "基础",
    q: "SQL 中 LEFT JOIN 与 INNER JOIN 的核心区别是？",
    opts: [
      "LEFT JOIN 以左表为准保留全部行，INNER JOIN 只保留两表匹配的行",
      "INNER JOIN 以左表为准保留全部行，LEFT JOIN 只保留匹配的行",
      "两者完全等价，只是写法不同",
      "LEFT JOIN 只能用于两表，INNER JOIN 可以用于多表",
    ],
    ans: 0,
    explain: "LEFT JOIN 保留左表全部记录，右表无匹配时填 NULL；INNER JOIN 只返回两表联结条件同时满足的记录，任一侧未匹配都会被丢弃。",
  },
  {
    id: "sql-2", cat: "sql", level: "基础",
    q: "关于数据库索引，下列说法正确的是？",
    opts: [
      "索引越多越好，可以显著提升所有操作性能",
      "索引通过减少扫描行数加快查询，但会带来写入与存储开销",
      "索引对 WHERE、ORDER BY、JOIN 都没有帮助",
      "建立索引后查询计划不会再变化",
    ],
    ans: 1,
    explain: "索引以 B+ 树等结构维护，查询时可将 O(n) 全表扫描降为 O(log n) 级别；但每次插入/更新/删除都要维护索引，且占用额外空间，因此不是越多越好。",
  },
  {
    id: "sql-3", cat: "sql", level: "进阶",
    q: "以下哪种情况最容易导致索引失效？",
    opts: [
      "WHERE 条件使用索引列作为等值条件",
      "在索引列上使用函数或隐式类型转换",
      "ORDER BY 使用索引列排序",
      "JOIN 条件使用已建索引的外键列",
    ],
    ans: 1,
    explain: "对索引列套函数（如 WHERE YEAR(create_time)=2024）或发生隐式类型转换（字符串列与数字比较）时，优化器无法直接使用索引，通常退化为全表扫描。",
  },
  {
    id: "sql-4", cat: "sql", level: "基础",
    q: "事务的 ACID 中，「隔离性（Isolation）」指的是？",
    opts: [
      "事务提交后数据永久保存，重启不丢失",
      "事务要么全部成功要么全部回滚",
      "并发事务之间互不干扰，彼此看不到对方未提交的中间状态",
      "数据库必须始终满足预设的业务约束",
    ],
    ans: 2,
    explain: "隔离性关注并发控制：通过锁与 MVCC 等机制，使并发执行的事务效果与串行执行等价。「永久保存」是持久性，「全部成功或回滚」是原子性，「满足约束」是一致性。",
  },
  {
    id: "sql-5", cat: "sql", level: "进阶",
    q: "什么是 SQL 注入？最有效的防御手段是？",
    opts: [
      "数据库被物理损坏；定期备份即可",
      "攻击者通过构造恶意输入改变 SQL 语义；使用参数化查询（预编译）",
      "查询速度太慢导致拒绝服务；增加缓存",
      "索引失效导致慢查询；重建索引",
    ],
    ans: 1,
    explain: "SQL 注入把用户输入拼进 SQL 语句从而改变语义（如 ' OR '1'='1）。参数化查询让数据与代码分离，输入永远作为参数值而非 SQL 片段执行，是根治手段。",
  },
  {
    id: "sql-6", cat: "sql", level: "进阶",
    q: "「不可重复读」和「幻读」的区别是？",
    opts: [
      "没有区别，只是不同教材的叫法",
      "不可重复读是同一条记录内容被修改，幻读是符合范围的记录行数发生变化",
      "幻读只发生在读已提交隔离级别，不可重复读只发生在串行化级别",
      "不可重复读是插入新记录，幻读是更新已有记录",
    ],
    ans: 1,
    explain: "同一事务内两次读取：不可重复读指同行数据内容变了（UPDATE/DELETE）；幻读指同样范围查询返回的行集合变了（INSERT 导致多出/少了几行）。",
  },

  /* ---- 计算机网络（免费） ---- */
  {
    id: "net-1", cat: "network", level: "基础",
    q: "TCP 与 UDP 的核心区别是？",
    opts: [
      "TCP 无连接、不可靠但快；UDP 面向连接、可靠但慢",
      "TCP 面向连接、可靠传输、有流量与拥塞控制；UDP 无连接、尽力交付",
      "两者都可靠，只是 TCP 传输层在 UDP 之上",
      "TCP 用于局域网，UDP 只能用于广域网",
    ],
    ans: 1,
    explain: "TCP 通过三次握手建立连接，提供序号、确认、重传、窗口与拥塞控制，保证可靠有序；UDP 无连接、无状态、头部开销小，适合实时音视频、DNS 查询等场景。",
  },
  {
    id: "net-2", cat: "network", level: "基础",
    q: "HTTPS 相比 HTTP 的安全性主要来自？",
    opts: [
      "使用了更快的传输协议",
      "在 HTTP 之下加入 TLS，提供加密、身份验证与完整性保护",
      "服务器开启了防火墙",
      "只允许 POST 请求",
    ],
    ans: 1,
    explain: "HTTPS = HTTP over TLS。TLS 通过握手协商密钥、证书验证服务器身份，之后的数据传输经过对称加密并带 MAC 校验，兼具机密性、完整性与身份认证。",
  },
  {
    id: "net-3", cat: "network", level: "进阶",
    q: "TCP 三次握手中，第二次握手的报文标志位是？",
    opts: [
      "只有 SYN",
      "SYN + ACK",
      "只有 ACK",
      "FIN + ACK",
    ],
    ans: 1,
    explain: "第一次：客户端发 SYN；第二次：服务端回应 SYN + ACK（同意建立连接并确认收到请求）；第三次：客户端发 ACK。之后进入 ESTABLISHED，开始传输数据。",
  },
  {
    id: "net-4", cat: "network", level: "进阶",
    q: "浏览器输入 URL 到看到页面，第一个发生的网络动作通常是？",
    opts: [
      "直接向目标服务器发送 HTTP 请求",
      "DNS 解析，把域名转换为 IP 地址",
      "与服务器进行 TCP 三次握手",
      "渲染进程解析 HTML",
    ],
    ans: 1,
    explain: "顺序大致是：DNS 解析（含浏览器/系统/运营商多级缓存）→ TCP 三次握手（TLS 握手若为 HTTPS）→ 发送 HTTP 请求 → 接收响应并解析渲染。",
  },
  {
    id: "net-5", cat: "network", level: "基础",
    q: "HTTP 常见的状态码 404 与 502 分别表示？",
    opts: [
      "404 服务器内部错误；502 资源不存在",
      "404 请求的资源不存在；502 网关/代理从上游收到无效响应",
      "两者都表示请求成功",
      "404 未授权；502 请求超时",
    ],
    ans: 1,
    explain: "404 属于 4xx 客户端错误，表示路径没有对应资源；502 Bad Gateway 属于 5xx 服务端错误，表示反向代理/网关与上游服务器通信时收到无效响应。",
  },
  {
    id: "net-6", cat: "network", level: "进阶",
    q: "DNS 污染 / 缓存投毒攻击主要利用了什么？",
    opts: [
      "DNS 查询与响应的明文传输及缺少来源校验",
      "TCP 序列号可预测",
      "HTTP 无状态特性",
      "CDN 节点过少",
    ],
    ans: 0,
    explain: "传统 DNS 查询使用 UDP 明文，攻击者在响应中抢先注入伪造答案即可让域名指向恶意 IP。防御手段包括 DNSSEC 签名校验、DoH/DoT 加密传输等。",
  },

  /* ---- 操作系统（VIP） ---- */
  {
    id: "os-1", cat: "os", level: "基础",
    q: "进程（Process）与线程（Thread）的关系，下列说法正确的是？",
    opts: [
      "一个进程只能有一个线程",
      "线程是 CPU 调度的基本单位，同一进程内的线程共享进程地址空间",
      "线程拥有独立地址空间，进程之间共享地址空间",
      "线程切换开销比进程切换更大",
    ],
    ans: 1,
    explain: "进程是资源分配的基本单位，拥有独立地址空间；线程是调度执行的基本单位，同一进程的线程共享代码段、堆与全局数据，但各有栈与寄存器。线程切换更轻量。",
  },
  {
    id: "os-2", cat: "os", level: "进阶",
    q: "死锁产生的四个必要条件不包括以下哪项？",
    opts: [
      "互斥条件",
      "请求与保持条件",
      "优先级抢占条件",
      "循环等待条件",
    ],
    ans: 2,
    explain: "四个必要条件是：互斥、请求与保持（占有部分资源再请求新资源）、不可剥夺、循环等待。「优先级抢占」不是死锁必要条件——死锁关注资源僵持，而非调度优先级。",
  },
  {
    id: "os-3", cat: "os", level: "进阶",
    q: "用户态与内核态的区别，描述正确的是？",
    opts: [
      "用户态代码可以直接操作硬件",
      "内核态拥有最高权限，可执行特权指令；用户态通过系统调用陷入内核",
      "两者只是命名不同，权限完全一样",
      "只有磁盘读写需要进入内核态",
    ],
    ans: 1,
    explain: "CPU 分用户态与内核态（特权级别）。普通应用运行在用户态，访问硬件、修改页表等必须通过系统调用/中断陷入内核态执行，形成安全边界。",
  },
  {
    id: "os-4", cat: "os", level: "进阶",
    q: "关于虚拟内存与页面置换，下列说法正确的是？",
    opts: [
      "虚拟内存让程序可以使用比物理内存更大的地址空间",
      "页面置换算法只工作在编译期",
      "缺页中断意味着程序一定出现了 bug",
      "交换分区（swap）比内存条更快",
    ],
    ans: 0,
    explain: "虚拟内存通过分页把磁盘作为内存的扩展，程序看到的是连续的虚拟地址空间；缺页时触发缺页中断，由操作系统按置换算法（如 LRU）把所需页调入物理内存。",
  },

  /* ---- 算法与数据结构（VIP） ---- */
  {
    id: "algo-1", cat: "algo", level: "基础",
    q: "二分查找的时间复杂度是？",
    opts: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    ans: 1,
    explain: "每轮比较把候选区间减半，n 个元素最多需要 log₂n 轮，故为 O(log n)。前提是数据有序且支持随机访问。",
  },
  {
    id: "algo-2", cat: "algo", level: "进阶",
    q: "哈希表平均查找 O(1)，最坏情况下可能退化到什么程度？",
    opts: ["O(log n)", "O(n)", "O(n log n)", "仍然保持 O(1)"],
    ans: 1,
    explain: "大量 key 冲突到同一桶（或恶意构造碰撞）时，桶内退化成链表/长串扫描，查找变为 O(n)。工业级实现用链地址法 + 扩容/树化来控制退化。",
  },
  {
    id: "algo-3", cat: "algo", level: "进阶",
    q: "快速排序的最坏时间复杂度与触发场景是？",
    opts: [
      "O(n log n)，任何输入都一样",
      "O(n²)，每次分区都极度不均（如已排序数组且总取端点为主元）",
      "O(n²)，输入完全随机时",
      "O(n)，数组已经有序时",
    ],
    ans: 1,
    explain: "快排最坏情况是每次分区一边为空：序列基本有序又总取首/尾元素做主元时，递归深度退化为 n，复杂度 O(n²)。随机主元或三数取中可显著降低概率。",
  },
  {
    id: "algo-4", cat: "algo", level: "基础",
    q: "以下排序算法中，属于稳定排序的是？",
    opts: ["快速排序", "堆排序", "归并排序", "简单选择排序"],
    ans: 2,
    explain: "稳定排序保证相等元素的相对顺序不变。归并排序在合并时按「左优先」策略取元素，因此稳定；快排的分区交换、堆排序的跳跃交换、选择排序的远距离交换都可能改变相等元素的相对次序。",
  },

  /* ---- STAR 行为面（VIP） ---- */
  {
    id: "star-1", cat: "star", level: "基础",
    q: "STAR 法则的四个字母分别代表？",
    opts: [
      "Situation 情境、Task 任务、Action 行动、Result 结果",
      "Skill 技能、Time 时间、Attitude 态度、Result 结果",
      "Story 故事、Target 目标、Analysis 分析、Review 复盘",
      "Strategy 策略、Tactic 战术、Action 行动、Reward 回报",
    ],
    ans: 0,
    explain: "STAR 是行为面试的结构化表达框架：先交代背景情境（S），明确目标任务（T），重点讲你做了什么（A，突出个人贡献而非团队泛泛而谈），最后用可量化结果收尾（R）。",
  },
  {
    id: "star-2", cat: "star", level: "进阶",
    q: "回答「你遇到过最大的挑战是什么？」时，最加分的讲法是？",
    opts: [
      "强调挑战来自他人不配合，突出自己的无奈",
      "把 80% 篇幅放在渲染困难多严重",
      "选一个与目标岗位能力相关的真实挑战，用 STAR 讲清决策与行动，并量化结果",
      "直接回答没有遇到过挑战",
    ],
    ans: 2,
    explain: "面试官通过这道题考察问题解决与抗压。选与岗位核心能力匹配的真实案例，用 STAR 结构化呈现，把重点放在你的分析、决策与行动上，并用数据（转化率、耗时、稳定性）量化结果。",
  },
  {
    id: "star-3", cat: "star", level: "进阶",
    q: "行为面中「量化成果」最恰当的做法是？",
    opts: [
      "尽可能把数字往大里说，突出影响力",
      "给出与业务直接相关的基线 → 行动 → 对比，数字可被追问细节",
      "避免用数字，只说「效果很好」",
      "只引用团队总数据，不区分个人贡献",
    ],
    ans: 1,
    explain: "可信的量化 = 清晰基线 + 你的行动带来的前后对比，且经得起追问（口径、周期、样本）。编造或夸大的数字一旦被细节问倒，可信度会崩塌。",
  },
  {
    id: "star-4", cat: "star", level: "基础",
    q: "被问「你的缺点是什么」时，较好的策略是？",
    opts: [
      "说一个真实存在、已在改进的短板，并给出改进动作与阶段进展",
      "把优点包装成缺点（「我太追求完美」）",
      "回答「我没有缺点」",
      "说一个与岗位核心能力冲突严重的致命短板",
    ],
    ans: 0,
    explain: "面试官考察自我认知与成长性。安全的答法：选非核心岗位能力的真实短板 + 具体改进措施（课程/工具/复盘机制）+ 已看到的进展。避重就轻的「伪缺点」会减分。",
  },
];

const QUIZ_LEN = 5;          /* 每轮题数 */
const QUIZ_PER_Q = 60;       /* 每题秒数 */
const QUIZ_DAILY_FREE = 1;   /* 非 VIP 每日免费小测次数 */

let quizTab = "learn";                 /* learn / exam / stats */
let quizLearnCat = null;               /* 学习模式下正在查看的分类 */
let quizState = {
  running: false, list: [], idx: 0, answered: false,
  correct: 0, cat: "mix", left: QUIZ_PER_Q,
  timer: null, wrongList: [], result: null,
  mode: "exam",
};

function quizCatName(id) {
  const c = QUIZ_CATS.find(x => x.id === id);
  return c ? c.name : id;
}
function quizAllowed(q) {
  const c = QUIZ_CATS.find(x => x.id === q.cat);
  return !c || !c.vip || isVip();
}

/* ---------- ② VIP 会员体系 ---------- */
function isVip() {
  try { return getProfile().vip === true; } catch (e) { return false; }
}
function setVip(on) {
  const next = !!on;
  saveProfile({ vip: next });
  syncVipUi();
  return next;
}
/* 演示用权益开关：真实产品中此处应为支付 / 兑换流程 */
function toggleVipDemo() {
  const next = setVip(!isVip());
  toast(next ? "👑 VIP 权益已开通（演示）" : "VIP 权益已关闭（演示）");
}
/* VIP 相关 UI 同步：顶栏徽章 / 个人中心卡片 / 题库页锁态 */
function syncVipUi() {
  const pill = $("vip-pill");
  if (pill) pill.hidden = !(currentUser && isVip());
  const card = $("vip-card");
  if (card) card.outerHTML = renderVipCard();
  if (typeof currentPage === "function" && currentPage() === "quiz") renderQuizPage();
}
function renderVipCard() {
  const vip = isVip();
  const perks = [
    { ico: "📚", t: "解锁全部题库分类：操作系统 / 算法 / STAR 行为面" },
    { ico: "⏱", t: "不限次数限时小测（免费版每日 1 次）" },
    { ico: "📈", t: "小测成绩档案与进步曲线追踪" },
    { ico: "👑", t: "专属 VIP 标识与评估报告封面徽章" },
  ];
  return `
    <div class="vip-card${vip ? "" : " vip-off"}" id="vip-card">
      <div class="vip-card-top">
        <span class="vip-card-badge">${vip ? "VIP 会员" : "未开通"}</span>
        <span class="vip-card-title">${vip ? "VIP 权益已生效" : "开通 VIP，解锁全部题库"}</span>
      </div>
      <div class="vip-card-perks">
        ${perks.map(p => `<div class="vip-perk${vip ? " on" : ""}"><span class="pk-ico">${p.ico}</span><span>${p.t}</span></div>`).join("")}
      </div>
      <div class="vip-card-row">
        ${vip
          ? `<button class="vip-btn ghost" onclick="toggleVipDemo()">演示：关闭 VIP</button>`
          : `<button class="vip-btn" onclick="toggleVipDemo()">👑 立即开通（演示）</button>`}
        <span class="vip-card-note">演示版权益开关。测试账号 demo@futuremirror.app 登录后自动获得 VIP。</span>
      </div>
    </div>`;
}

/* ---------- ③ 题库页 ---------- */
function renderQuizPage() {
  const learn = $("quiz-pane-learn"), exam = $("quiz-pane-exam"), stats = $("quiz-pane-stats"),
        wrong = $("quiz-pane-wrong"), fav = $("quiz-pane-fav");
  if (!learn || !exam || !stats) return;
  learn.innerHTML = renderQuizLearnPane();
  exam.innerHTML = quizState.running ? renderQuizRunner()
    : quizState.result ? renderQuizResult()
    : renderQuizIntro();
  stats.innerHTML = renderQuizStats();
  if (wrong) wrong.innerHTML = renderQuizWrongPane();
  if (fav) fav.innerHTML = renderQuizFavPane();
  /* v20：搜索状态在重渲染后恢复（输入框 value 已随 HTML 重建） */
  if (quizSearchKw) { try { runQuizSearch(); } catch (e) {} }
  // v27：全站交互层——小测得分数字滚动（reduced-motion 下静态落位）
  try { if (window.__bpApp && window.__bpApp.countUpScan) window.__bpApp.countUpScan(exam); } catch (e) {}
}
function switchQuizTab(tab) {
  quizTab = tab;
  ["learn", "exam", "stats", "wrong", "fav"].forEach(t => {
    const pane = $("quiz-pane-" + t);
    if (pane) pane.hidden = t !== tab;
    const btn = document.querySelector('.quiz-tab[data-quiz="' + t + '"]');
    if (btn) {
      btn.classList.toggle("active", t === tab);
      btn.setAttribute("aria-selected", t === tab ? "true" : "false");
    }
  });
  /* v20：收藏夹 / 错题本内容可被其他页签的操作改变，切换到时刷新，避免展示陈旧数据 */
  if (tab === "fav" || tab === "wrong") renderQuizPage();
}
function showQuizCat(catId) {
  const cat = QUIZ_CATS.find(c => c.id === catId);
  if (!cat) return;
  if (cat.vip && !isVip()) { toast("🔒 「" + cat.name + "」为 VIP 专属分类，开通后即可学习"); return; }
  quizLearnCat = catId;
  renderQuizPage();
}
function backToQuizCats() {
  quizLearnCat = null;
  renderQuizPage();
}
function renderQuizLearnPane() {
  if (quizLearnCat) {
    const cat = QUIZ_CATS.find(c => c.id === quizLearnCat);
    /* 权益失效（VIP 到期 / 登出）时回落分类网格，避免绕过锁看到内容 */
    if (!cat || (cat.vip && !isVip())) { quizLearnCat = null; }
  }
  if (quizLearnCat) {
    const cat = QUIZ_CATS.find(c => c.id === quizLearnCat);
    const qs = QUIZ_BANK.filter(q => q.cat === quizLearnCat);
    return `
      <div class="learn-back-row">
        <button class="btn btn-ghost" onclick="backToQuizCats()">← 返回全部分类</button>
      </div>
      <div class="page-card" style="margin-bottom:16px">
        <div class="card-section-title">${cat.icon} ${esc(cat.name)} · 知识点学习</div>
        <p class="card-section-sub">${esc(cat.desc)}共 ${qs.length} 题，先看解析建立知识框架，再去「限时小测」检验记忆。</p>
      </div>
      ${qs.map((q, i) => quizLearnItem(q, i)).join("")}
    `;
  }
  const vip = isVip();
  const favN = getFavs().length;
  const wrongN = getWrongBook().length;
  const searching = !!quizSearchKw;
  return `
    <div class="quiz-search-box">
      <input type="text" id="quiz-search-input" placeholder="搜索题目 / 选项 / 分类关键词，回车搜索" value="${esc(quizSearchKw)}" onkeydown="if(event.key==='Enter')runQuizSearch()">
      <button class="btn btn-primary" onclick="runQuizSearch()">🔍 搜索</button>
    </div>
    <div id="quiz-search-results" hidden></div>
    <div class="quiz-entry-row">
      <button class="quiz-entry-card" onclick="switchQuizTab('fav')">
        <span class="qec-icon">⭐</span>
        <span class="qec-body"><span class="qec-title">收藏夹</span><span class="qec-sub">${favN} 道收藏的题目</span></span>
        <span class="qec-arrow">›</span>
      </button>
      <button class="quiz-entry-card" onclick="switchQuizTab('wrong')">
        <span class="qec-icon">📕</span>
        <span class="qec-body"><span class="qec-title">错题本</span><span class="qec-sub">${vip ? wrongN + " 道待攻克" : "VIP 专属功能"}</span></span>
        <span class="qec-arrow">›</span>
      </button>
    </div>
    <div id="quiz-cat-zone" ${searching ? "hidden" : ""}>
      <div class="quiz-cat-grid">
        ${QUIZ_CATS.map(c => {
          const locked = c.vip && !vip;
          const n = QUIZ_BANK.filter(q => q.cat === c.id).length;
          return `
          <button class="quiz-cat" onclick="showQuizCat('${c.id}')">
            <div class="quiz-cat-icon">${c.icon}</div>
            <div class="quiz-cat-name">${esc(c.name)}</div>
            <div class="quiz-cat-desc">${esc(c.desc)}</div>
            <div class="quiz-cat-meta"><span class="quiz-cat-count">${n} 题</span>${c.vip ? '<span class="quiz-cat-vip">👑 VIP</span>' : ""}</div>
            ${locked ? `<div class="quiz-cat-lock"><span style="font-size:22px">🔒</span><b>VIP 专属分类</b><span class="lock-cta">开通 VIP 解锁</span></div>` : ""}
          </button>`;
        }).join("")}
      </div>
      <div class="quiz-daily-note" style="margin-top:16px">💡 学习模式随时开放；限时小测对免费用户每天开放 <b>${QUIZ_DAILY_FREE}</b> 次，VIP 会员不限次数并解锁全部题库分类与错题本。</div>
    </div>
  `;
}
/* v20：单题学习卡（学习列表 / 搜索结果 / 收藏夹共用） */
function quizLearnItem(q, i) {
  return `
    <div class="learn-item">
      <div class="learn-q"><span class="learn-no">Q${i + 1}.</span>${esc(q.q)}${quizFavBtn(q.id)}</div>
      <div class="learn-opts">
        ${q.opts.map((o, oi) => `<div class="learn-opt${oi === q.ans ? " correct" : ""}">${"ABCD"[oi]}. ${esc(o)}${oi === q.ans ? " ✓" : ""}</div>`).join("")}
      </div>
      <div class="learn-explain"><b>解析：</b>${esc(q.explain)}</div>
    </div>`;
}

/* ---------- ④ 小测引擎 ---------- */
function renderQuizIntro() {
  const vip = isVip();
  const qd = getQuizData();
  const daily = getDaily();
  const leftFree = vip ? Infinity : Math.max(0, QUIZ_DAILY_FREE - qd.todayCount);
  const cats = QUIZ_CATS.filter(c => vip || !c.vip);
  const dis = leftFree === 0 ? "disabled" : "";
  const practicePool = QUIZ_BANK.filter(quizAllowed);
  const modes = [["exam", "⏱ 限时模考"], ["practice", "📒 顺序练习"], ["chapter", "📑 章节练习"]];
  return `
    <div class="daily-card${daily.done ? " done" : ""}">
      <div class="daily-info">
        <div class="daily-title">📅 每日一练</div>
        <div class="daily-sub">每天 ${QUIZ_DAILY_LEN} 题，完成即打卡${daily.streak > 0 ? ` · 已连续打卡 <b>${daily.streak}</b> 天` : " · 开始你的打卡之旅"}${daily.best > 0 ? ` · 最佳 ${daily.best} 天` : ""}</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="startDailyPractice()" ${daily.done ? "disabled" : ""}>${daily.done ? "今日已打卡 ✓" : "开始每日一练"}</button>
    </div>
    <div class="quiz-mode-bar" role="tablist" aria-label="练习模式">
      ${modes.map(m => `<button class="quiz-mode-btn${quizExamMode === m[0] ? " active" : ""}" data-mode="${m[0]}" role="tab" aria-selected="${quizExamMode === m[0] ? "true" : "false"}" onclick="switchQuizMode('${m[0]}')">${m[1]}</button>`).join("")}
    </div>
    <div class="quiz-mode-pane" id="quiz-mode-exam" ${quizExamMode === "exam" ? "" : "hidden"}>
      <div class="quiz-intro">
        <div class="quiz-intro-icon">⏱</div>
        <h3>限时小测 · ${vip ? "VIP 全库" : "免费题库"}</h3>
        <p>每轮随机抽取 ${QUIZ_LEN} 题，每题 ${QUIZ_PER_Q} 秒倒计时。答错或超时会立即展示解析，帮你在时间压力下定位知识盲区。</p>
        <div class="quiz-intro-rules">
          <span class="quiz-rule-chip">每轮 <b>${QUIZ_LEN}</b> 题</span>
          <span class="quiz-rule-chip">每题 <b>${QUIZ_PER_Q}</b> 秒</span>
          <span class="quiz-rule-chip">答错 <b>即看解析</b></span>
          <span class="quiz-rule-chip">成绩 <b>自动归档</b></span>
        </div>
        ${vip ? "" : `<div class="quiz-daily-note">今日免费小测剩余 <b>${leftFree}</b> / ${QUIZ_DAILY_FREE} 次${leftFree === 0 ? "，明日恢复——开通 VIP 不限次数" : ""}</div>`}
        <div class="quiz-intro-actions" style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="startQuiz('mix')" ${dis}>🚀 综合模考（${vip ? "全部分类" : "免费分类"}）</button>
          ${cats.map(c => `<button class="btn btn-ghost" onclick="startQuiz('${c.id}')" ${dis}>${c.icon} ${esc(c.name)}</button>`).join("")}
        </div>
      </div>
    </div>
    <div class="quiz-mode-pane" id="quiz-mode-practice" ${quizExamMode === "practice" ? "" : "hidden"}>
      <div class="quiz-mode-card">
        <h3>📒 顺序练习</h3>
        <p>按题库原始顺序逐题练习（当前账号可练习 <b>${practicePool.length}</b> 题），不限时、答错即看解析——适合系统性过一遍知识点，不消耗每日免费次数。</p>
        <button class="btn btn-primary" onclick="startPractice()">▶ 开始顺序练习</button>
      </div>
    </div>
    <div class="quiz-mode-pane" id="quiz-mode-chapter" ${quizExamMode === "chapter" ? "" : "hidden"}>
      <div class="quiz-mode-card">
        <h3>📑 章节练习</h3>
        <p>选定一个分类，按顺序刷完该分类全部题目，不限时，答错即看解析。</p>
        <div class="quiz-cat-chips">
          ${QUIZ_CATS.map(c => `<button class="quiz-chip" onclick="startChapter('${c.id}')" ${c.vip && !vip ? "disabled" : ""}>${c.icon} ${esc(c.name)}（${QUIZ_BANK.filter(q => q.cat === c.id).length} 题）${c.vip ? " 👑" : ""}</button>`).join("")}
        </div>
      </div>
    </div>
  `;
}
function renderQuizRunner() {
  const st = quizState;
  const q = st.list[st.idx];
  const pct = Math.round(st.idx / st.list.length * 100);
  const cfg = QUIZ_MODES[st.mode] || QUIZ_MODES.exam;
  return `
    <div class="quiz-runner">
      <div class="quiz-progress-row">
        <span class="quiz-progress-text">${esc(cfg.label)} · 第 ${st.idx + 1} / ${st.list.length} 题 · 已答对 ${st.correct}</span>
        ${cfg.timed ? `<span class="answer-timer" id="quiz-timer">⏱ ${st.left}s</span>` : `<span class="quiz-mode-chip">不限时</span>`}
      </div>
      <div class="quiz-progress-track"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
      <span class="quiz-q-cat">${esc(quizCatName(q.cat))}</span>
      <div class="quiz-q-text">${esc(q.q)}</div>
      <div class="quiz-opts">
        ${q.opts.map((o, i) => `<button class="quiz-opt" id="quiz-opt-${i}" onclick="answerQuiz(${i})"><span class="quiz-opt-key">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`).join("")}
      </div>
      <div id="quiz-feedback-slot"></div>
      <div class="quiz-feedback-row" id="quiz-next-row" hidden>
        <button class="btn btn-ghost" onclick="quitQuiz()">✕ 退出${esc(cfg.label)}</button>
        <button class="btn btn-primary" onclick="nextQuiz()">${st.idx + 1 >= st.list.length ? (st.mode === "daily" ? "完成打卡 →" : "查看成绩 →") : "下一题 →"}</button>
      </div>
    </div>
  `;
}
function renderQuizResult() {
  const r = quizState.result;
  const cfg = QUIZ_MODES[r.mode] || QUIZ_MODES.exam;
  const cls = r.score >= 80 ? "good" : r.score >= 60 ? "mid" : "bad";
  const verdict = r.mode === "daily"
    ? (r.correct === r.total ? "全部答对，打卡成功！" : "打卡成功！错的题已收入错题本，明天再战。")
    : r.score >= 80 ? "表现优秀，知识掌握扎实！"
    : r.score >= 60 ? "勉强及格，薄弱点值得回看解析。"
    : "错得有点多，建议先学习再挑战。";
  return `
    <div class="quiz-result">
      <div class="quiz-result-score ${cls}">
        <span class="score-num" data-count="${r.score}">${r.score}</span>
        <span class="score-unit">得分</span>
      </div>
      <h3>${esc(cfg.label)} · 本轮到此结束</h3>
      <p class="qr-sub">${verdict}</p>
      <div class="quiz-result-stats">
        <div class="qr-stat"><div class="n">${r.correct}/${r.total}</div><div class="l">答对题数</div></div>
        <div class="qr-stat"><div class="n">${cfg.timed ? QUIZ_PER_Q + "s" : "不限时"}</div><div class="l">时间规则</div></div>
        <div class="qr-stat"><div class="n">${r.cat === "mix" ? "综合" : esc(quizCatName(r.cat))}</div><div class="l">本轮范围</div></div>
      </div>
      <div class="quiz-result-actions">
        <button class="btn btn-primary" onclick="restartQuizRound()">🔁 再来一轮</button>
        <button class="btn btn-ghost" onclick="quitQuiz()">返回小测首页</button>
        <button class="btn btn-ghost" onclick="switchQuizTab('stats')">📈 查看学习数据</button>
      </div>
    </div>
  `;
}
function startQuiz(cat, mode) {
  mode = mode || "exam";
  if (quizState.running) return;
  const vip = isVip();
  /* 分类门控 */
  if (cat !== "mix") {
    const c = QUIZ_CATS.find(x => x.id === cat);
    if (c && c.vip && !vip) { toast("🔒 「" + c.name + "」为 VIP 专属，开通后可小测"); return; }
  }
  /* 非 VIP 每日次数门控（仅限时模考） */
  if (mode === "exam" && !vip) {
    const qd = getQuizData();
    if (qd.todayCount >= QUIZ_DAILY_FREE) {
      toast("今日免费小测次数已用完，开通 VIP 不限次数");
      switchQuizTab("stats");
      renderQuizPage();
      return;
    }
  }
  let pool = QUIZ_BANK.filter(q => cat === "mix" ? true : q.cat === cat);
  if (!vip) pool = pool.filter(quizAllowed);
  if (!pool.length) { toast("题库为空，暂无法开始"); return; }
  beginQuiz(pool, mode, cat);
}
/* v20：统一出题入口（模式决定题量 / 是否乱序 / 是否计时） */
function beginQuiz(pool, mode, cat) {
  if (quizState.running) return;
  if (!pool || !pool.length) { toast("没有可练习的题目"); return; }
  const cfg = QUIZ_MODES[mode] || QUIZ_MODES.exam;
  let list = pool.slice();
  if (cfg.shuffle) list = quizShuffle(list);
  if (mode === "exam") list = list.slice(0, Math.min(QUIZ_LEN, list.length));
  if (mode === "daily") list = list.slice(0, Math.min(QUIZ_DAILY_LEN, list.length));
  quizState = {
    running: true, list, idx: 0, answered: false,
    correct: 0, cat: cat || "mix", left: QUIZ_PER_Q,
    timer: null, wrongList: [], result: null, mode,
  };
  switchQuizTab("exam");
  renderQuizPage();
  if (cfg.timed) startQuizTimer();
}
function quizShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function startQuizTimer() {
  stopQuizTimer();
  quizState.left = QUIZ_PER_Q;
  const el = $("quiz-timer");
  quizState.timer = setInterval(() => {
    quizState.left--;
    const t = $("quiz-timer");
    if (t) {
      t.textContent = "⏱ " + quizState.left + "s";
      t.classList.toggle("warn", quizState.left <= 15);
    }
    if (quizState.left <= 0) { stopQuizTimer(); answerQuiz(-1); }
  }, 1000);
  if (el) el.classList.toggle("warn", quizState.left <= 15);
}
function stopQuizTimer() {
  if (quizState.timer) { clearInterval(quizState.timer); quizState.timer = null; }
}
function answerQuiz(i) {
  const st = quizState;
  if (!st.running || st.answered) return;
  st.answered = true;
  stopQuizTimer();
  const q = st.list[st.idx];
  const ok = i === q.ans;
  if (ok) st.correct++;
  else {
    st.wrongList.push(q);
    addWrong(q.id);          /* v20：自动收入错题本 */
  }
  recordAnswer(q, ok);       /* v20：计入学习统计（全模式） */
  q.opts.forEach((_, oi) => {
    const el = $("quiz-opt-" + oi);
    if (!el) return;
    el.disabled = true;
    if (oi === q.ans) el.classList.add("correct");
    else if (oi === i) el.classList.add("wrong");
    else el.classList.add("dim");
  });
  const slot = $("quiz-feedback-slot");
  if (slot) {
    const head = ok ? "✅ <b>回答正确！</b>"
      : i < 0 ? "⏰ <b>已超时</b>，正确答案是 " + "ABCD"[q.ans]
      : "❌ <b>回答错误</b>，正确答案是 " + "ABCD"[q.ans];
    const wrongNote = ok ? "" : `<span class="fb-wrong-note">已自动收入错题本${isVip() ? "，去「📕 错题本」反复练习" : "（VIP 可练习错题）"}</span>`;
    slot.innerHTML = `<div class="quiz-feedback ${ok ? "correct" : "wrong"}">${head}<span class="fb-explain"><b>解析：</b>${esc(q.explain)}</span>${wrongNote}${quizFavBtn(q.id)}</div>`;
  }
  const row = $("quiz-next-row");
  if (row) row.hidden = false;
}
function nextQuiz() {
  const st = quizState;
  if (!st.running) return;
  st.idx++;
  if (st.idx >= st.list.length) { finishQuiz(); return; }
  st.answered = false;
  renderQuizPage();
  const cfg = QUIZ_MODES[st.mode] || QUIZ_MODES.exam;
  if (cfg.timed) startQuizTimer();
}
function finishQuiz() {
  const st = quizState;
  st.running = false;
  stopQuizTimer();
  const total = st.list.length;
  const score = total ? Math.round(st.correct / total * 100) : 0;
  const cfg = QUIZ_MODES[st.mode] || QUIZ_MODES.exam;
  st.result = { score, correct: st.correct, total, cat: st.cat, at: Date.now(), mode: st.mode };
  if (cfg.history) saveQuizRecord(st.result);   /* 仅限时小测计入成绩档案 */
  if (st.mode === "daily") markDailyDone();     /* v20：每日一练打卡 */
  renderQuizPage();
  toast(st.mode === "daily"
    ? `每日一练完成：答对 ${st.correct}/${total}，打卡成功！`
    : `${cfg.label}完成：答对 ${st.correct}/${total}，得分 ${score}`);
}
function quitQuiz() {
  stopQuizTimer();
  quizState.running = false;
  quizState.result = null;
  renderQuizPage();
}

/* ---------- ⑤ 成绩档案（fm_quiz） ---------- */
function quizToday() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function getQuizData() {
  let d = null;
  try { d = store.get("fm_quiz", null); } catch (e) { d = null; }
  d = d || {};
  const today = quizToday();
  const st = (d.stats && typeof d.stats === "object") ? d.stats : {};
  return {
    history: Array.isArray(d.history) ? d.history.slice(0, 30) : [],
    today: today,
    todayCount: d.today === today ? (Number(d.todayCount) || 0) : 0,
    /* v20：学习统计（全部练习模式的累计作答） */
    stats: {
      answers: Number(st.answers) || 0,
      correct: Number(st.correct) || 0,
      perCat: (st.perCat && typeof st.perCat === "object") ? st.perCat : {},
    },
  };
}
function saveQuizRecord(rec) {
  const d = getQuizData();
  d.history.unshift({ score: rec.score, correct: rec.correct, total: rec.total, cat: rec.cat, at: rec.at });
  d.history = d.history.slice(0, 30);
  d.todayCount = d.todayCount + 1;
  try { store.set("fm_quiz", d, true); } catch (e) {}
}
function renderQuizStats() {
  const d = getQuizData();
  const h = d.history;
  const st = d.stats;
  const daily = getDaily();
  const acc = st.answers ? Math.round(st.correct / st.answers * 100) : 0;
  const trend = h.slice(0, 10).reverse();   /* 旧 → 新 */
  const catRows = QUIZ_CATS.filter(c => st.perCat[c.id] && st.perCat[c.id].a > 0);
  if (!h.length && !st.answers) {
    return `<div class="quiz-empty"><span class="qe-icon">📈</span>还没有练习记录<br>完成第一轮小测或练习后，这里会展示成绩趋势与分类掌握度</div>`;
  }
  return `
    <div class="quiz-stats-summary">
      <div class="qss-card"><div class="n">${h.length}<small> 轮</small></div><div class="l">累计小测</div></div>
      <div class="qss-card"><div class="n">${h.length ? Math.round(h.reduce((s, x) => s + x.score, 0) / h.length) : 0}</div><div class="l">平均得分</div></div>
      <div class="qss-card"><div class="n">${h.length ? Math.max.apply(null, h.map(x => x.score)) : 0}</div><div class="l">最高得分</div></div>
      <div class="qss-card"><div class="n">${acc}<small>%</small></div><div class="l">总正确率</div></div>
    </div>
    <div class="qs-panel-card">
      <div class="qs-panel-title">📅 每日一练 <span>坚持就是胜利</span></div>
      <div class="daily-stat-row">
        <div class="daily-stat"><div class="n">${daily.streak}</div><div class="l">当前连签（天）</div></div>
        <div class="daily-stat"><div class="n">${daily.best}</div><div class="l">最佳连签（天）</div></div>
        <div class="daily-stat"><div class="n">${daily.done ? "已打卡" : "未打卡"}</div><div class="l">今日状态</div></div>
      </div>
    </div>
    <div class="qs-panel-card">
      <div class="qs-panel-title">📚 分类掌握度 <span>基于全部练习作答（累计 ${st.answers} 题）</span></div>
      ${catRows.length ? catRows.map(c => {
        const pc = st.perCat[c.id];
        const pct = Math.round(pc.c / pc.a * 100);
        const cls = pct >= 80 ? "good" : pct >= 60 ? "mid" : "bad";
        return `
        <div class="qs-bar-row">
          <span class="qs-bar-name">${c.icon} ${esc(c.name)}</span>
          <div class="qs-bar-track"><div class="qs-bar-fill ${cls}" style="width:${pct}%"></div></div>
          <span class="qs-bar-val">${pc.c}/${pc.a} · ${pct}%</span>
        </div>`;
      }).join("") : `<div class="quiz-empty" style="padding:18px">还没有分类作答数据，去练习几题吧</div>`}
    </div>
    ${trend.length ? `
    <div class="qs-panel-card">
      <div class="qs-panel-title">📈 最近成绩趋势 <span>最近 ${trend.length} 轮小测</span></div>
      <div class="trend-row">
        ${trend.map((x, ti) => {
          const cls = x.score >= 80 ? "good" : "";
          const tipTxt = `第 ${ti + 1} 轮 · ${x.score} 分 · ${x.score >= 80 ? "优秀" : x.score >= 60 ? "及格" : "待提高"}`;
          return `<div class="trend-bar" tabindex="0" data-tip="${tipTxt}"><div class="trend-bar-track"><div class="trend-bar-fill ${cls}" style="height:${Math.max(4, x.score)}%"></div></div><span class="trend-bar-label">${x.score}</span></div>`;
        }).join("")}
      </div>
    </div>` : ""}
    ${h.length ? `<div class="qs-panel-title" style="margin:6px 0 12px">🕘 小测历史</div>` : ""}
    ${h.map(x => {
      const cls = x.score >= 80 ? "good" : x.score >= 60 ? "mid" : "bad";
      const label = x.score >= 80 ? "优秀" : x.score >= 60 ? "及格" : "待提高";
      return `
      <div class="quiz-history-item">
        <div class="qhi-score ${cls}">${x.score}</div>
        <div class="qhi-body">
          <div class="qhi-title">${label} · 答对 ${x.correct}/${x.total}</div>
          <div class="qhi-meta">${new Date(x.at).toLocaleString("zh-CN")}</div>
        </div>
        <span class="qhi-cat">${x.cat === "mix" ? "综合" : esc(quizCatName(x.cat))}</span>
      </div>`;
    }).join("")}
  `;
}

/* ============================================================
 * v20 · 题库增强 + AI 小助手
 *   ① 模式引擎 QUIZ_MODES（限时 / 顺序 / 章节 / 错题 / 每日 / 搜索）
 *   ② 错题本（fm_wrong · VIP 专属）
 *   ③ 收藏夹（fm_fav）
 *   ④ 题目搜索（题目 / 选项 / 分类关键词）
 *   ⑤ 每日一练（fm_daily · 连签打卡）
 *   ⑥ 学习数据看板增强（fm_quiz.stats）
 *   ⑦ AI 小助手（retrieve 检索 + streamChat 流式 / Mock 兜底）
 * ============================================================ */

/* ---------- ① 模式引擎 ---------- */
const QUIZ_DAILY_LEN = 3;
const QUIZ_MODES = {
  exam:     { label: "限时小测", timed: true,  shuffle: true,  history: true },
  practice: { label: "顺序练习", timed: false, shuffle: false, history: false },
  chapter:  { label: "章节练习", timed: false, shuffle: false, history: false },
  wrong:    { label: "错题练习", timed: false, shuffle: true,  history: false },
  daily:    { label: "每日一练", timed: false, shuffle: true,  history: false },
  search:   { label: "搜索练习", timed: false, shuffle: false, history: false },
};
let quizExamMode = "exam";      /* 小测页当前展示的模式卡 */
let quizWrongCat = null;        /* 错题本分类筛选 */
let quizSearchKw = "";          /* 学习面板搜索关键词（重渲染后恢复） */
let quizSearchIds = [];         /* 最近一次搜索命中的题目 id */

function beginQuiz(pool, mode, cat) {
  if (quizState.running) return;
  if (!pool || !pool.length) { toast("没有可练习的题目"); return; }
  const cfg = QUIZ_MODES[mode] || QUIZ_MODES.exam;
  let list = pool.slice();
  if (cfg.shuffle) list = quizShuffle(list);
  if (mode === "exam") list = list.slice(0, Math.min(QUIZ_LEN, list.length));
  if (mode === "daily") list = list.slice(0, Math.min(QUIZ_DAILY_LEN, list.length));
  quizState = {
    running: true, list, idx: 0, answered: false,
    correct: 0, cat: cat || "mix", left: QUIZ_PER_Q,
    timer: null, wrongList: [], result: null, mode,
  };
  switchQuizTab("exam");
  renderQuizPage();
  if (cfg.timed) startQuizTimer();
}
function startPractice() {
  if (quizState.running) return;
  beginQuiz(QUIZ_BANK.filter(quizAllowed), "practice", "mix");
}
function startChapter(cat) {
  if (quizState.running) return;
  const vip = isVip();
  const c = QUIZ_CATS.find(x => x.id === cat);
  if (c && c.vip && !vip) { toast("🔒 「" + c.name + "」为 VIP 专属，开通后可练习"); return; }
  const pool = QUIZ_BANK.filter(q => q.cat === cat);
  if (!pool.length) { toast("该分类暂无题目"); return; }
  beginQuiz(pool, "chapter", cat);
}
function startWrongPractice() {
  if (quizState.running) return;
  if (!isVip()) { toast("🔒 错题本为 VIP 专属功能"); switchQuizTab("wrong"); return; }
  let w = getWrongBook();
  if (quizWrongCat) {
    w = w.filter(x => { const q = QUIZ_BANK.find(b => b.id === x.id); return q && q.cat === quizWrongCat; });
  }
  const pool = w.map(x => QUIZ_BANK.find(b => b.id === x.id)).filter(Boolean);
  if (!pool.length) { toast("当前筛选下没有错题"); return; }
  beginQuiz(pool, "wrong", "mix");
}
function startDailyPractice() {
  if (quizState.running) return;
  const d = getDaily();
  if (d.done) { toast("今日每日一练已完成，明天再来保持连签"); return; }
  const pool = QUIZ_BANK.filter(quizAllowed);
  if (!pool.length) { toast("题库为空"); return; }
  beginQuiz(pool, "daily", "mix");
}
function startSearchPractice() {
  if (quizState.running) return;
  const pool = quizSearchIds.map(id => QUIZ_BANK.find(q => q.id === id)).filter(Boolean);
  if (!pool.length) { toast("请先搜索题目"); return; }
  beginQuiz(pool, "search", "mix");
}
function restartQuizRound() {
  const r = quizState.result;
  if (!r) return;
  quizState.result = null;
  if (r.mode === "daily") { startDailyPractice(); return; }
  if (r.mode === "wrong") { startWrongPractice(); return; }
  if (r.mode === "search") { startSearchPractice(); return; }
  startQuiz(r.cat, r.mode || "exam");
}
function switchQuizMode(mode) {
  quizExamMode = mode;
  ["exam", "practice", "chapter"].forEach(m => {
    const pane = $("quiz-mode-" + m);
    if (pane) pane.hidden = m !== mode;
    const btn = document.querySelector('.quiz-mode-btn[data-mode="' + m + '"]');
    if (btn) {
      btn.classList.toggle("active", m === mode);
      btn.setAttribute("aria-selected", m === mode ? "true" : "false");
    }
  });
}

/* ---------- ② 错题本（fm_wrong · VIP） ---------- */
function getWrongBook() {
  try {
    const w = store.get("fm_wrong", null);
    return Array.isArray(w) ? w.slice(0, 50) : [];
  } catch (e) { return []; }
}
function saveWrongBook(list) {
  try { store.set("fm_wrong", list.slice(0, 50), true); } catch (e) {}
}
function addWrong(qid) {
  const list = getWrongBook().filter(x => x.id !== qid);
  const old = getWrongBook().find(x => x.id === qid);
  list.unshift({ id: qid, at: Date.now(), times: old ? (old.times || 1) + 1 : 1 });
  saveWrongBook(list);
}
function removeWrong(qid) {
  saveWrongBook(getWrongBook().filter(x => x.id !== qid));
}
function removeWrongItem(qid) {
  removeWrong(qid);
  toast("已移出错题本");
  renderQuizPage();
}
function filterWrongBook(cid) {
  quizWrongCat = cid;
  renderQuizPage();
}
function showWrongQuestion(qid) {
  const q = QUIZ_BANK.find(b => b.id === qid);
  if (!q) return;
  if (q.cat && QUIZ_CATS.find(c => c.id === q.cat && c.vip) && !isVip()) { toast("🔒 该题为 VIP 专属分类"); return; }
  quizLearnCat = q.cat;
  renderQuizPage();
  switchQuizTab("learn");
  toast("已定位到「" + quizCatName(q.cat) + "」分类，找到该题查看解析");
}
function renderQuizWrongPane() {
  if (!isVip()) {
    return `<div class="vip-lock-pane">
      <div class="vlp-icon">🔒</div>
      <h3>错题本是 VIP 专属功能</h3>
      <p>开通 VIP 后，所有答错与超时的题目会自动收录到这里——支持按分类筛选、反复练习、移除已掌握，让做错的题不再错。</p>
      <button class="btn btn-primary" onclick="toggleVipDemo()">👑 立即开通（演示）</button>
    </div>`;
  }
  const all = getWrongBook();
  if (!all.length) {
    return `<div class="quiz-empty"><span class="qe-icon">📕</span>错题本是空的<br>小测中答错或超时的题目会自动收录到这里</div>`;
  }
  const cats = {};
  all.forEach(x => { const q = QUIZ_BANK.find(b => b.id === x.id); if (q) cats[q.cat] = (cats[q.cat] || 0) + 1; });
  const items = quizWrongCat
    ? all.filter(x => { const q = QUIZ_BANK.find(b => b.id === x.id); return q && q.cat === quizWrongCat; })
    : all;
  return `
    <div class="page-card" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>
        <div class="card-section-title">📕 错题本 · 共 ${all.length} 题</div>
        <p class="card-section-sub" style="margin-bottom:0">答错 / 超时的题目自动收录。反复练习直到不再错，掌握后即可移除。</p>
      </div>
      <button class="btn btn-primary btn-sm" onclick="startWrongPractice()">▶ 练习${quizWrongCat ? "筛选结果" : "全部"}（${items.length}）</button>
    </div>
    <div class="wrong-filter-bar">
      <button class="quiz-chip${quizWrongCat ? "" : " on"}" onclick="filterWrongBook(null)">全部（${all.length}）</button>
      ${Object.keys(cats).map(cid => `<button class="quiz-chip${quizWrongCat === cid ? " on" : ""}" onclick="filterWrongBook('${cid}')">${esc(quizCatName(cid))}（${cats[cid]}）</button>`).join("")}
    </div>
    ${items.map(x => {
      const q = QUIZ_BANK.find(b => b.id === x.id);
      if (!q) return "";
      return `
      <div class="wrong-item">
        <div class="wrong-item-body">
          <div class="wrong-item-q">${esc(q.q)}</div>
          <div class="wrong-item-meta">${esc(quizCatName(q.cat))} · 错误 <b>${x.times || 1}</b> 次 · 收录于 ${new Date(x.at).toLocaleDateString("zh-CN")}</div>
        </div>
        <div class="wrong-item-actions">
          <button class="btn btn-ghost btn-sm" onclick="showWrongQuestion('${q.id}')">📖 看解析</button>
          <button class="btn btn-ghost btn-sm" onclick="removeWrongItem('${q.id}')">🗑 移除</button>
        </div>
      </div>`;
    }).join("")}
  `;
}

/* ---------- ③ 收藏夹（fm_fav） ---------- */
function getFavs() {
  try {
    const f = store.get("fm_fav", null);
    return Array.isArray(f) ? f.slice(0, 100) : [];
  } catch (e) { return []; }
}
function isFav(qid) { return getFavs().indexOf(qid) >= 0; }
function toggleFav(qid) {
  const list = getFavs();
  const i = list.indexOf(qid);
  if (i >= 0) list.splice(i, 1); else list.unshift(qid);
  try { store.set("fm_fav", list.slice(0, 100), true); } catch (e) {}
  return list.indexOf(qid) >= 0;
}
function quizFavBtn(qid) {
  const on = isFav(qid);
  return `<button class="quiz-fav-btn${on ? " on" : ""}" data-fav-btn="${qid}" onclick="toggleFavBtn('${qid}', this)">${on ? "★ 已收藏" : "☆ 收藏"}</button>`;
}
function toggleFavBtn(qid, btn) {
  const on = toggleFav(qid);
  if (btn) {
    btn.textContent = on ? "★ 已收藏" : "☆ 收藏";
    btn.classList.toggle("on", on);
  }
  refreshFavButtons();
  /* 学习面板入口卡的收藏计数同步 */
  const subs = document.querySelectorAll(".quiz-entry-card .qec-sub");
  if (subs[0]) subs[0].textContent = getFavs().length + " 道收藏的题目";
  if (quizTab === "fav") renderQuizPage();
  toast(on ? "⭐ 已收藏该题" : "已取消收藏");
}
function refreshFavButtons() {
  document.querySelectorAll("[data-fav-btn]").forEach(b => {
    const on = isFav(b.getAttribute("data-fav-btn"));
    b.textContent = on ? "★ 已收藏" : "☆ 收藏";
    b.classList.toggle("on", on);
  });
}
function renderQuizFavPane() {
  const ids = getFavs();
  if (!ids.length) {
    return `<div class="quiz-empty"><span class="qe-icon">⭐</span>收藏夹是空的<br>在题目旁点击「☆ 收藏」，题目会出现在这里</div>`;
  }
  const qs = ids.map(id => QUIZ_BANK.find(q => q.id === id)).filter(Boolean);
  return `
    <div class="page-card" style="margin-bottom:14px">
      <div class="card-section-title">⭐ 收藏夹 · 共 ${qs.length} 题</div>
      <p class="card-section-sub" style="margin-bottom:0">收藏的题目常驻这里，方便面试前快速回顾。</p>
    </div>
    ${qs.map((q, i) => quizLearnItem(q, i)).join("")}
  `;
}

/* ---------- ④ 题目搜索 ---------- */
function runQuizSearch(kwArg) {
  const input = $("quiz-search-input");
  const box = $("quiz-search-results");
  if (!box) return;
  const raw = (kwArg != null && String(kwArg).trim()) ? String(kwArg).trim()
    : (input && input.value.trim()) ? input.value.trim() : quizSearchKw;
  quizSearchKw = raw;
  const kw = raw.toLowerCase();
  if (!kw) { clearQuizSearch(); return; }
  const vip = isVip();
  const tokens = kw.split(/\s+/).filter(Boolean);
  const hits = QUIZ_BANK.filter(q => {
    if (!vip && !quizAllowed(q)) return false;
    const hay = [q.q, q.explain, quizCatName(q.cat), q.cat].concat(q.opts).join(" ").toLowerCase();
    return tokens.every(t => hay.includes(t));
  });
  quizSearchIds = hits.map(q => q.id);
  const cz = $("quiz-cat-zone");
  if (cz) cz.hidden = true;
  box.hidden = false;
  if (!hits.length) {
    box.innerHTML = `<div class="quiz-empty">未找到与「${esc(raw)}」相关的题目${vip ? "" : "（VIP 分类需开通后才可搜索）"}，换个关键词试试</div>`;
    return;
  }
  box.innerHTML = `
    <div class="quiz-search-head">
      <span>找到 <b>${hits.length}</b> 道与「${esc(raw)}」相关的题目</span>
      <span style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="startSearchPractice()">▶ 练习这 ${hits.length} 题</button>
        <button class="btn btn-ghost btn-sm" onclick="clearQuizSearch()">✕ 清除</button>
      </span>
    </div>
    ${hits.map((q, i) => quizLearnItem(q, i)).join("")}
  `;
}
function clearQuizSearch() {
  quizSearchKw = "";
  quizSearchIds = [];
  const input = $("quiz-search-input");
  if (input) input.value = "";
  const box = $("quiz-search-results");
  if (box) { box.hidden = true; box.innerHTML = ""; }
  const cz = $("quiz-cat-zone");
  if (cz) cz.hidden = false;
}

/* ---------- ⑤ 每日一练（fm_daily · 连签） ---------- */
function quizDateOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function getDaily() {
  let d = null;
  try { d = store.get("fm_daily", null); } catch (e) { d = null; }
  d = d || {};
  const today = quizToday();
  const yd = quizDateOffset(-1);
  const alive = d.lastDone === today || d.lastDone === yd;
  return {
    date: today,
    done: d.lastDone === today,
    streak: alive ? (Number(d.streak) || 0) : 0,
    best: Number(d.best) || 0,
    lastDone: d.lastDone || "",
  };
}
function markDailyDone() {
  const d = getDaily();
  const today = quizToday();
  const yd = quizDateOffset(-1);
  const streak = d.lastDone === yd ? (d.streak || 0) + 1 : 1;
  try {
    store.set("fm_daily", { lastDone: today, streak: streak, best: Math.max(streak, d.best || 0) }, true);
  } catch (e) {}
}

/* ---------- ⑥ 学习统计（fm_quiz.stats） ---------- */
function recordAnswer(q, ok) {
  const d = getQuizData();
  const st = d.stats;
  st.answers += 1;
  if (ok) st.correct += 1;
  const pc = st.perCat[q.cat] || (st.perCat[q.cat] = { a: 0, c: 0 });
  pc.a += 1;
  if (ok) pc.c += 1;
  d.stats = st;
  try { store.set("fm_quiz", d, true); } catch (e) {}
}

