"use strict";
/* ============================================================
 * 6. RAG 面经问答（BM25 + 端侧向量混合检索；接入模型后真实生成）
 *    检索层实现见文件下半部分「BM25 + 端侧向量混合」，40 条面经向量
 *    由 Transformers.js（all-MiniLM-L6-v2）在浏览器内计算并缓存 localStorage。
 * ============================================================ */
const KB = [
  { title: "字节跳动后端二面高频问题（合成面经）", source: "合成面经·字节跳动后端（示例）", tags: ["字节","后端","二面","项目深挖"], content: "字节后端二面通常围绕简历项目深挖：项目 QPS 与峰值、慢查询定位、缓存一致性方案、分布式锁实现与坑；手撕代码多为字符串处理与简单动态规划；终面关注职业规划与跨部门协作案例。" },
  { title: "后端开发工程师 JD（互联网大厂·示例）", source: "合成JD·后端开发（示例）", tags: ["后端","Java","分布式","MySQL","Redis"], content: "岗位要求：熟练掌握 Java/Go 至少一门语言；熟悉 MySQL 索引与事务、Redis 缓存设计；了解分布式系统基本原理，有高并发场景经验；熟悉 Docker 与 Linux 日常运维。" },
  { title: "STAR 法则讲项目（合成题库）", source: "合成题库·STAR（示例）", tags: ["STAR","项目","表达"], content: "STAR：Situation 背景一句话交代业务与团队；Task 说明你的目标与衡量指标；Action 讲 2-3 个关键动作，突出个人贡献与技术决策；Result 用量化数据收尾，如延迟降低 40%、转化率提升 12%。" },
  { title: "MySQL 索引八股：为什么选 B+ 树（合成题库）", source: "合成题库·MySQL（示例）", tags: ["MySQL","索引","八股"], content: "B+ 树数据只在叶子节点、叶子间有链表，范围查询与排序友好；层高通常 3 层以内，千万级数据约 3 次磁盘 IO；相比二叉树与 B 树，B+ 树单节点可存更多键，IO 更少。" },
  { title: "Redis 缓存穿透/击穿/雪崩区别（合成题库）", source: "合成题库·Redis（示例）", tags: ["Redis","缓存","八股"], content: "穿透：查询不存在的数据，用布隆过滤器或空值缓存解决；击穿：热点 key 过期，用互斥锁或逻辑过期解决；雪崩：大量 key 同时过期，用随机 TTL 与多级缓存解决。" },
  { title: "算法岗面试常见流程（合成面经）", source: "合成面经·算法工程师（示例）", tags: ["算法","机器学习","八股"], content: "算法岗一面重基础：过拟合与正则化、梯度消失与解决、LR 与 SVM 区别；二面重项目：特征工程思路、模型上线与 AB 实验；手撕代码以数据预处理为主。" },
  { title: "产品经理群面与单面要点（合成面经）", source: "合成面经·产品经理（示例）", tags: ["产品","群面","案例分析"], content: "产品群面考察结构化表达与推动共识的能力；单面常考需求优先级判断、数据异动分析、AB 实验设计；建议准备 2 个完整的从 0 到 1 案例，用数据讲结果。" },
  { title: "无实习经历如何包装课程项目（合成题库）", source: "合成题库·STAR（示例）", tags: ["STAR","课程项目","简历"], content: "课程项目同样适用 STAR：把课程要求转化为任务目标，把技术选型转化为 Action 中的决策对比，把课程评分转化为可量化结果；强调你在团队中的角色与协作冲突的处理。" },
];

/* ============================================================
 * v10 · 面经知识库扩充（8 → 40）
 * ============================================================ */
KB.push(
  // ----- 公司面经 -----
  { title: "腾讯后端一面高频问题（合成面经）", source: "合成面经·腾讯后端（示例）", tags: ["腾讯","后端","一面","C++"], content: "腾讯后端一面重基础：C++ 内存模型、虚函数、智能指针、多线程同步；算法题偏字符串与链表；项目要求讲清技术选型与压测数据。" },
  { title: "阿里 Java 后端二面（合成面经）", source: "合成面经·阿里Java后端（示例）", tags: ["阿里","Java","二面","JVM"], content: "阿里 Java 二面深挖 JVM：GC 算法对比、CMS/G1 区别、JVM 调优经验；中间件常考 RocketMQ 顺序消息、事务消息实现；分布式事务方案设计。" },
  { title: "美团算法岗面试流程（合成面经）", source: "合成面经·美团算法（示例）", tags: ["美团","算法","机器学习"], content: "美团算法岗：一面基础（LR 与 GBDT 区别、过拟合）；二面项目（推荐系统、特征工程）；三面系统设计（如何设计外卖推荐系统）；HR 面关注学习能力。" },
  { title: "字节前端三面（合成面经）", source: "合成面经·字节前端（示例）", tags: ["字节","前端","三面","性能优化"], content: "字节前端三面：性能优化（首屏、懒加载、SSR）；工程化（Webpack/Vite 原理）；手写 Promise.all、防抖节流、深拷贝；项目深挖技术选型。" },
  { title: "拼多多数据分析面试（合成面经）", source: "合成面经·拼多多数据分析（示例）", tags: ["拼多多","数据分析","SQL"], content: "拼多多数分：SQL 多表关联 + 窗口函数（必考）；业务题如 GMV 下降如何拆解；AB 实验设计与显著性判断；Excel 建模能力。" },
  { title: "华为研发岗综合面（合成面经）", source: "合成面经·华为研发（示例）", tags: ["华为","研发","综合面"], content: "华为研发：技术面重基础（数据结构、操作系统、网络）；综合面关注抗压能力、团队协作、职业规划；性格测试需提前了解企业文化。" },
  { title: "小米产品经理面试（合成面经）", source: "合成面经·小米产品（示例）", tags: ["小米","产品经理","案例分析"], content: "小米 PM：产品 Sense（如何改进手机系统）；数据分析（留存下降怎么办）；竞品分析（小米 vs 友商）；逻辑表达清晰，准备 2 个完整项目案例。" },
  { title: "网易游戏策划面试（合成面经）", source: "合成面经·网易游戏策划（示例）", tags: ["网易","游戏策划","数值"], content: "网易游戏策划：系统设计（设计一个社交玩法）；数值计算（用 Excel 建立数值模型）；游戏阅历（准备 3 款拆解深度案例）；笔试含游戏拆解报告。" },

  // ----- 技术八股 -----
  { title: "操作系统进程与线程区别（合成题库）", source: "合成题库·操作系统（示例）", tags: ["操作系统","进程","线程"], content: "进程是资源分配单位，有独立地址空间；线程是调度单位，共享进程资源；进程切换开销大（需切换页表），线程切换开销小；进程通信方式：管道、消息队列、共享内存、信号量、Socket。" },
  { title: "TCP 三次握手四次挥手（合成题库）", source: "合成题库·网络（示例）", tags: ["TCP","网络","握手"], content: "三次握手：SYN → SYN+ACK → ACK；目的是确认双方收发能力并同步序列号。四次挥手：FIN → ACK → FIN → ACK；TIME_WAIT 等待 2MSL 确保最后 ACK 到达，防止旧连接数据干扰。" },
  { title: "HTTP 与 HTTPS 区别（合成题库）", source: "合成题库·网络（示例）", tags: ["HTTP","HTTPS","网络"], content: "HTTP 明文传输，HTTPS 通过 TLS 加密；HTTPS 默认 443 端口，HTTP 为 80；HTTPS 需要 CA 证书，握手多 2 个 RTT；HTTPS 防篡改、防窃听、防冒充。" },
  { title: "JVM 内存结构与 GC（合成题库）", source: "合成题库·JVM（示例）", tags: ["JVM","Java","GC"], content: "JVM 内存：堆、栈、方法区、程序计数器、本地方法栈；堆分新生代（Eden + 2 个 Survivor）和老年代；GC 算法：标记清除、复制、标记整理；常见收集器：CMS、G1、ZGC。" },
  { title: "MySQL 事务隔离级别（合成题库）", source: "合成题库·MySQL（示例）", tags: ["MySQL","事务","隔离级别"], content: "四种隔离级别：读未提交、读已提交（RC）、可重复读（RR，MySQL 默认）、串行化；RC 解决脏读，RR 解决不可重复读（通过 MVCC），串行化解决幻读（通过间隙锁）。" },
  { title: "Redis 持久化 RDB 与 AOF（合成题库）", source: "合成题库·Redis（示例）", tags: ["Redis","持久化","RDB","AOF"], content: "RDB：定时快照，文件小恢复快，但可能丢数据；AOF：追加写日志，可配置 everysec / always / no，丢数据少但文件大；生产建议 RDB + AOF 混合使用。" },
  { title: "分布式锁的三种实现（合成题库）", source: "合成题库·分布式（示例）", tags: ["分布式锁","Redis","ZooKeeper"], content: "1）Redis SET NX + 过期时间（注意锁续期）；2）ZooKeeper 临时顺序节点；3）数据库唯一索引；Redis 性能最好但需处理续期和误删，ZooKeeper 更可靠但性能略低。" },
  { title: "CAP 与 BASE 理论（合成题库）", source: "合成题库·分布式（示例）", tags: ["CAP","BASE","分布式"], content: "CAP：一致性、可用性、分区容错性三者不可兼得，分布式系统必须保 P；BASE：基本可用、软状态、最终一致；常见选择：CP（ZooKeeper）vs AP（Eureka）。" },
  { title: "微服务架构核心组件（合成题库）", source: "合成题库·微服务（示例）", tags: ["微服务","架构","Spring Cloud"], content: "核心组件：注册中心（Nacos/Eureka）、配置中心、网关（Gateway）、负载均衡、熔断降级（Sentinel/Hystrix）、链路追踪（SkyWalking）、消息队列。" },

  // ----- 算法与手撕 -----
  { title: "手撕：LRU 缓存（合成题库）", source: "合成题库·手撕（示例）", tags: ["手撕","LRU","数据结构"], content: "LRU 用哈希表 + 双向链表实现，get/put O(1)；面试变体：LFU、带过期时间；注意判空、边界条件、并发场景加锁。" },
  { title: "手撕：反转链表（合成题库）", source: "合成题库·手撕（示例）", tags: ["手撕","链表","算法"], content: "双指针迭代法：pre=null, cur=head; while(cur){ next=cur.next; cur.next=pre; pre=cur; cur=next; } return pre；递归法注意终止条件与栈溢出。" },
  { title: "手撕：Promise.all 实现（合成题库）", source: "合成题库·手撕（前端）", tags: ["手撕","Promise","前端"], content: "核心：维护 count 和 results 数组；遍历 promises，每个 then 里 count++，当 count===len 时 resolve(results)；注意处理非 Promise 值和错误短路。" },
  { title: "手撕：快排与归并（合成题库）", source: "合成题库·手撕（示例）", tags: ["手撕","快排","归并"], content: "快排：选基准，分治，平均 O(n log n)，最坏 O(n²)，不稳定；归并：分治 + 合并有序数组，稳定 O(n log n)，需 O(n) 额外空间。面试常考快排优化（三数取中、小数组插排）。" },

  // ----- 行为面试 -----
  { title: "STAR 法则与行为面试（合成题库）", source: "合成题库·行为面试（示例）", tags: ["行为面试","STAR","软技能"], content: "STAR：Situation 背景（1 句）、Task 目标（1 句）、Action 行动（2-3 个关键动作，突出个人贡献）、Result 结果（量化数据）；常考题：最有成就感的项目、最大的失败、与团队冲突如何处理。" },
  { title: "自我介绍 3 分钟模板（合成题库）", source: "合成题库·自我介绍（示例）", tags: ["自我介绍","面试技巧"], content: "结构：背景（学校/专业/届别）+ 核心技能（3 个关键词）+ 代表项目（1 个，用 STAR）+ 求职动机（为什么这个岗位/公司）。控制在 90-180 秒，突出与岗位强相关的经历。" },
  { title: "如何回答「你的缺点」（合成题库）", source: "合成题库·面试技巧（示例）", tags: ["面试技巧","缺点"], content: "避坑：不要说「我太追求完美」这种套路；建议说一个真实但可改进的缺点 + 具体改进动作 + 目前的改善效果；如「公开表达不够自信 → 主动争取了 3 次技术分享 → 现在能独立主持组会」。" },
  { title: "谈薪与 offer 选择（合成题库）", source: "合成题库·谈薪（示例）", tags: ["谈薪","offer"], content: "1）先了解市场价；2）不要先报具体数字，让 HR 先说范围；3）综合考虑：薪资结构、base 地点、团队、成长空间、行业前景；4）有竞争 offer 时礼貌告知，但不要撒谎。" },

  // ----- 综合与行业 -----
  { title: "应届生求职时间线（合成指南）", source: "合成指南·求职时间线", tags: ["求职","校招","时间线"], content: "大三暑假：暑期实习（可转正）；大四 9-10 月：秋招提前批 + 正式批；11-12 月：补录与补招；春招（3-4 月）：补录；建议：提前 3 个月准备简历与项目，暑期实习是秋招最重要的跳板。" },
  { title: "无实习如何提升简历竞争力（合成指南）", source: "合成指南·简历提升", tags: ["简历","实习","项目"], content: "1）开源贡献（提 PR 到自己常用的库）；2）独立项目（有线上地址 + 数据）；3）竞赛（Kaggle、天池、蓝桥杯）；4）技术博客（沉淀思考，面试官会看）；5）课程项目深挖（把课程项目做到极致）。" },
  { title: "AI 时代求职趋势（合成报告）", source: "合成报告·AI 求职趋势", tags: ["AI","趋势","求职"], content: "近年趋势：1）AI 工程化人才需求激增（会调 API 是基础，懂 RAG/Agent 编排是加分）；2）传统前端/后端岗位要求「AI 集成能力」；3）Prompt 工程、MCP 生态是新兴方向；4）软技能（沟通、业务理解）权重提升。" },
  { title: "技术面试常见套路（合成指南）", source: "合成指南·面试套路", tags: ["面试","套路","技巧"], content: "1）不会的问题：先说思路，再写伪代码，避免沉默；2）遇到 bug：说明排查过程，体现调试能力；3）手撕代码：先问边界条件，再写主体；4）项目深挖：准备好「为什么这么做」「有什么替代方案」。" },
  { title: "简历投递渠道对比（合成指南）", source: "合成指南·投递渠道", tags: ["简历","投递","渠道"], content: "1）官网直投：命中率高但流程慢；2）内推：进度快，可查状态，但需要靠谱内推人；3）招聘平台：沟通成本高但机会多；4）校园宣讲会：部分公司现场收简历可直通面试。" },
  { title: "Linux 排障常用命令（合成题库）", source: "合成题库·Linux（示例）", tags: ["Linux","运维","排障"], content: "CPU/内存：top、free、vmstat；磁盘：df、du、iostat；网络：ss、netstat、tcpdump；进程：ps、pstree；日志：journalctl、tail -f、grep。面试官常问「线上 CPU 飙到 100% 怎么排查」，标准答法：top 找进程 → top -Hp 找线程 → jstack/perf 抓栈 → 定位热代码。" },
  { title: "Docker 与 Kubernetes 面试要点（合成题库）", source: "合成题库·云原生（示例）", tags: ["Docker","Kubernetes","云原生"], content: "Docker：镜像分层与 UnionFS、Dockerfile 优化（多阶段构建、减少层数）、容器与虚拟机区别（共享内核）。K8s：Pod/Deployment/Service/Ingress 关系、探针（liveness/readiness）、滚动更新与回滚、HPA 扩缩容、ConfigMap 与 Secret 区别。" }
);


/* ============================================================
 * beta1.0 · 检索层：BM25 + 端侧向量混合（RAG retrieval）
 *   ① 分词：中文 bigram + 英文/数字整词（与 lib/ai/rag.ts 同款策略）
 *   ② BM25：k1=1.5 / b=0.75，标题字段加权（标题重复计入）+ 文档长度归一
 *   ③ 向量：all-MiniLM-L6-v2（Transformers.js，384 维，浏览器内推理，
 *           模型权重走浏览器缓存，零后端、零 API）；无模型文件时降级为
 *           n-gram hashing 向量（256 维，纯本地计算，离线可跑）
 *   ④ 融合：两路各自 min-max 归一分后加权求和（余弦 0.6 / BM25 0.4）
 *   ⑤ 缓存：40 条面经向量预计算一次写入 localStorage，二次访问零推理
 * ============================================================ */
const VEC_CFG = {
  dimHash: 256,
  dimMinilm: 384,
  model: "Xenova/all-MiniLM-L6-v2",
  cdn: [
    "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2",
    "https://unpkg.com/@xenova/transformers@2.17.2",
  ],
  storeKey: "fm_kb_vec_v1",
  wVec: 0.6,        // 融合权重：余弦相似度
  wBm25: 0.4,       // 融合权重：BM25
  minCosMinilm: 0.15,   // 纯语义召回门槛（MiniLM）
  minCosHash: 0.32,     // 纯语义召回门槛（hashing，无真实语义能力，门槛更高）
};

const vecIndex = {
  provider: "none",     // none | hash | minilm
  dim: 0,
  model: "",
  vectors: null,
  extractor: null,
  ready: false,
  building: false,
  source: "",           // memory | cache
  builtAt: 0,
  reloadTried: false,
};

/* ---------- 分词：英文/数字整词 + 中文 bigram ---------- */
function tokenList(text) {
  const raw = String(text).toLowerCase()
    .split(/[\s，。、；：？！,.;:?!()（）[\]{}"'“”…·\u3000]+/).filter(t => t.length >= 2);
  const out = raw.slice();
  for (const t of raw) {
    if (/[\u4e00-\u9fff]/.test(t)) {
      for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
    }
  }
  return out;
}

function tokenize(text) { return [...new Set(tokenList(text))]; }

/* ---------- BM25 索引（惰性构建，KB 为静态数据只建一次） ---------- */
let BM25_INDEX = null;
function bm25Index() {
  if (BM25_INDEX) return BM25_INDEX;
  const docs = KB.map(entry => {
    // 标题重复一次 = 标题字段权重 ×2
    const list = tokenList(`${entry.title} ${entry.title} ${entry.tags.join(" ")} ${entry.content}`);
    const tf = new Map();
    for (const t of list) tf.set(t, (tf.get(t) || 0) + 1);
    return { tf, len: list.length };
  });
  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  BM25_INDEX = {
    docs, df,
    N: docs.length,
    avgdl: docs.reduce((s, d) => s + d.len, 0) / docs.length,
    k1: 1.5, b: 0.75,
  };
  return BM25_INDEX;
}

function bm25Score(qTokens) {
  const { docs, df, N, avgdl, k1, b } = bm25Index();
  return docs.map(d => {
    let s = 0;
    for (const t of qTokens) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = df.get(t) || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));   // 恒正，避免高频词负权重
      s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avgdl));
    }
    return s;
  });
}

/* ---------- 向量层 ---------- */
function docVecText(entry) {
  return `${entry.title}。${entry.tags.join("、")}。${entry.content}`;
}

function l2normalize(vec) {
  let n = 0;
  for (const x of vec) n += x * x;
  n = Math.sqrt(n) || 1;
  return vec.map(x => Math.round((x / n) * 10000) / 10000);
}

/* 有符号特征哈希：同一 token 落两个桶一正一负，降低碰撞导致的相似度虚高 */
function hashEmbed(text, dim) {
  const v = new Array(dim).fill(0);
  const toks = tokenize(text).slice(0, 160);
  for (const tok of toks) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    v[h % dim] += 1;
    v[(h >>> 11) % dim] -= 1;
  }
  return l2normalize(v);
}

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function buildHashIndex() {
  vecIndex.provider = "hash";
  vecIndex.dim = VEC_CFG.dimHash;
  vecIndex.model = "n-gram hashing（离线兜底）";
  vecIndex.vectors = KB.map(e => hashEmbed(docVecText(e), VEC_CFG.dimHash));
  vecIndex.ready = true;
  vecIndex.source = "memory";
  vecIndex.builtAt = Date.now();
  return vecIndex.vectors;
}

function persistVecIndex() {
  try {
    localStorage.setItem(VEC_CFG.storeKey, JSON.stringify({
      v: 1,
      provider: vecIndex.provider,
      dim: vecIndex.dim,
      model: vecIndex.model,
      n: KB.length,
      builtAt: vecIndex.builtAt,
      vectors: vecIndex.vectors,
    }));
    return true;
  } catch (e) { return false; }   // 隐私模式 / 配额不足：内存态继续可用
}

function restoreVecIndex() {
  try {
    const raw = localStorage.getItem(VEC_CFG.storeKey);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || d.n !== KB.length || !Array.isArray(d.vectors) || d.vectors.length !== KB.length) return false;
    if (!d.vectors[0] || d.vectors[0].length !== d.dim) return false;
    vecIndex.provider = d.provider || "hash";
    vecIndex.dim = d.dim;
    vecIndex.model = d.model || "";
    vecIndex.vectors = d.vectors;
    vecIndex.ready = true;
    vecIndex.source = "cache";
    vecIndex.builtAt = d.builtAt || 0;
    return true;
  } catch (e) { return false; }
}

/* 同步确保索引可用：优先 localStorage 缓存，其次现算 hashing 向量（毫秒级） */
function ensureVecIndex() {
  if (vecIndex.ready && vecIndex.vectors && vecIndex.vectors.length === KB.length) return true;
  if (restoreVecIndex()) { renderVecBar(); return true; }
  buildHashIndex();
  persistVecIndex();
  renderVecBar();
  return true;
}

/* ---------- 混合打分 ---------- */
function scoreAll(qTokens, queryVec) {
  const bm = bm25Score(qTokens);
  const maxBm = bm.reduce((m, x) => Math.max(m, x), 0);
  const vecs = vecIndex.vectors;
  const useVec = !!(queryVec && vecs && vecs.length === KB.length && queryVec.length === vecs[0].length);
  const gate = vecIndex.provider === "minilm" ? VEC_CFG.minCosMinilm : VEC_CFG.minCosHash;
  const out = [];
  KB.forEach((entry, i) => {
    const lexical = bm[i] > 0;
    const cos = useVec ? Math.max(0, cosine(queryVec, vecs[i])) : 0;
    if (!lexical && !(useVec && cos >= gate)) return;
    const bmNorm = maxBm > 0 ? bm[i] / maxBm : 0;
    const score = VEC_CFG.wVec * cos + VEC_CFG.wBm25 * bmNorm;
    if (score <= 0.001) return;
    out.push({
      entry, index: i,
      bm25: +bm[i].toFixed(3),
      bm25Norm: +bmNorm.toFixed(3),
      cos: +cos.toFixed(3),
      score: +score.toFixed(4),
    });
  });
  return out.sort((a, b) => b.score - a.score);
}

/* 同步检索：无模型时（hash / 缓存命中但模型未加载）走 BM25 + hashing 余弦 */
function hybridRetrieve(query, k = 3) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  ensureVecIndex();
  const queryVec = vecIndex.provider === "minilm" && !vecIndex.extractor
    ? null
    : hashEmbed(query, VEC_CFG.dimHash);
  return scoreAll(qTokens, queryVec).slice(0, k);
}

/* 异步检索：MiniLM 已加载时用模型编码 query，走真实语义余弦 */
async function hybridRetrieveAsync(query, k = 3) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  ensureVecIndex();
  let queryVec = null;
  if (vecIndex.provider === "minilm") {
    if (vecIndex.extractor) {
      try {
        const rows = await embedWithModel([query]);
        queryVec = rows[0];
      } catch (e) { queryVec = null; }
    } else if (!vecIndex.reloadTried && !vecIndex.building) {
      // 向量来自缓存但模型未在本会话加载：本次先走 BM25，同时后台热加载
      vecIndex.reloadTried = true;
      loadVecModel(true);
    }
  } else {
    queryVec = hashEmbed(query, VEC_CFG.dimHash);
  }
  return scoreAll(qTokens, queryVec).slice(0, k);
}

function retrieve(query, k = 3) { return hybridRetrieve(query, k).map(r => r.entry); }

/* ---------- Transformers.js 端侧模型 ---------- */
async function embedWithModel(texts) {
  const out = await vecIndex.extractor(texts, { pooling: "mean", normalize: true });
  const rows = typeof out.tolist === "function" ? out.tolist() : out;
  return rows.map(row => Array.from(row, x => Math.round(x * 10000) / 10000));
}

async function loadVecModel(silent) {
  if (vecIndex.building) return false;
  if (vecIndex.provider === "minilm" && vecIndex.extractor) {
    if (!silent) toast("MiniLM 端侧模型已就绪");
    return true;
  }
  vecIndex.building = true;
  renderVecBar();
  setVecStatus("正在加载 Transformers.js 运行时…", "load");
  try {
    let mod = null;
    for (const url of VEC_CFG.cdn) {
      try {
        const m = await import(url);
        if (m && typeof m.pipeline === "function") { mod = m; break; }
      } catch (e) { /* 换下一个源 */ }
    }
    if (!mod) throw new Error("CDN 不可达（离线环境请继续使用 hash 向量）");
    if (mod.env) { mod.env.allowLocalModels = false; mod.env.useBrowserCache = true; }
    setVecStatus("模型权重加载中（首次约 23MB，之后走浏览器缓存）…", "load");
    const extractor = await mod.pipeline("feature-extraction", VEC_CFG.model, {
      quantized: true,
      progress_callback: p => {
        if (p && p.status === "progress" && p.total) {
          setVecStatus(`模型权重下载中 ${Math.round(p.loaded / p.total * 100)}%…`, "load");
        }
      },
    });
    vecIndex.extractor = extractor;
    setVecStatus("正在为 40 条面经计算 384 维向量…", "load");
    const rows = await embedWithModel(KB.map(docVecText));
    vecIndex.provider = "minilm";
    vecIndex.dim = VEC_CFG.dimMinilm;
    vecIndex.model = VEC_CFG.model.replace("Xenova/", "");
    vecIndex.vectors = rows;
    vecIndex.ready = true;
    vecIndex.source = "memory";
    vecIndex.builtAt = Date.now();
    const cached = persistVecIndex();
    renderVecBar();
    setVecStatus(`MiniLM 就绪 · ${rows.length} 条 × ${rows[0].length} 维${cached ? " · 已写入 localStorage" : ""}`, "ok");
    if (!silent) toast("端侧向量索引已就绪（浏览器内计算，零 API）");
    return true;
  } catch (e) {
    vecIndex.building = false;
    renderVecBar();
    setVecStatus(`端侧模型加载失败：${e.message} · 继续使用离线 hash 向量（${vecIndex.dim}d）`, "warn");
    if (!silent) toast("模型加载失败，已保持离线向量索引");
    return false;
  } finally {
    vecIndex.building = false;
  }
}

/* ---------- 索引状态条 ---------- */
function vecProviderLabel() {
  if (!vecIndex.ready) return "未初始化";
  if (vecIndex.provider === "minilm") return `MiniLM ${vecIndex.dim}d`;
  return `hash-ngram ${vecIndex.dim}d`;
}

function setVecStatus(text, kind) {
  const el = $("vec-status"), dot = $("vec-dot");
  if (el) el.textContent = text;
  if (dot) dot.className = "vec-dot " + (kind || "");
}

function renderVecBar() {
  const el = $("vec-status"), dot = $("vec-dot"), btn = $("vec-build-btn");
  if (!el) return;
  if (vecIndex.ready) {
    const tag = vecIndex.source === "cache" ? " · localStorage 缓存命中" : "";
    const sem = vecIndex.provider === "minilm" ? "语义" : "词面";
    el.textContent = `向量索引 ${vecIndex.vectors.length} 条 · ${vecProviderLabel()}（${sem}）${tag} · 融合 余弦×${VEC_CFG.wVec} + BM25×${VEC_CFG.wBm25}`;
    setVecStatus(el.textContent, vecIndex.provider === "minilm" ? "ok" : "warn");
  } else {
    setVecStatus("向量索引未初始化", "");
  }
  if (dot) dot.className = "vec-dot " + (vecIndex.provider === "minilm" ? "ok" : (vecIndex.ready ? "warn" : ""));
  if (btn) {
    if (vecIndex.provider === "minilm" && vecIndex.ready) {
      btn.disabled = true;
      btn.textContent = "✅ MiniLM 端侧模型已就绪";
    } else if (vecIndex.building) {
      btn.disabled = true;
      btn.textContent = "⏳ 模型加载中…";
    } else {
      btn.disabled = false;
      btn.textContent = "⚡ 加载端侧模型 MiniLM（需联网，约 23MB）";
    }
  }
}

function askRagPreset(q) {
  $("rag-input").value = q;
  askRag();
}

async function askRag(skipLlm) {
  if (!requireLogin()) return;
  const q = $("rag-input").value.trim();
  if (!q) { toast("请输入问题后再检索"); return; }
  // beta1.0：混合检索——BM25 词面召回 + 端侧向量余弦语义召回，归一后加权融合
  const ranked = await hybridRetrieveAsync(q, 3);
  const hits = ranked.map(r => r.entry);
  const box = $("rag-result");
  if (!hits.length) {
    box.innerHTML = `<div class="rag-answer weak fade-up">知识库中暂未检索到相关资料，请更换关键词，例如「STAR 法则」「MySQL 索引」「字节 二面」。</div>`;
    return;
  }
  const citeBlock = `<div class="rag-cite"><b style="font-size:12px;color:var(--faint)">引用来源（BM25 / 余弦 两路得分）</b>
      ${ranked.map((r, i) => `<p>[${i + 1}] <b style="color:var(--muted)">${r.entry.source}</b> — ${r.entry.content.slice(0, 70)}…
        <code style="color:var(--faint)">bm25 ${r.bm25} · cos ${r.cos} · 融合 ${r.score}</code></p>`).join("")}
    </div>`;
  const retrieverTag = `hybrid(bm25×${VEC_CFG.wBm25}+cos×${VEC_CFG.wVec}) · vec=${vecProviderLabel()}`;

  // v22.1：后端在线同样走模型（Key 在服务端，前端零接触）
  const useLlm = (llm || fmApi.backendReady()) && !skipLlm;
  const modelLabel = fmApi.backendReady() ? `后端 ${fmApi.backendModel()}` : (llm ? llm.model : "模型");
  if (useLlm) {
    box.innerHTML = `<div class="rag-answer fade-up"><b>（真实模型 · ${modelLabel}）</b>基于以下 ${hits.length} 条检索结果生成：<div id="rag-stream"></div></div>`;
    const target = $("rag-stream");
    const ctx = hits.map((h, i) => `[${i + 1}] ${h.source}：${h.content}`).join("\n");
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 60000);
    let full = "";
    try {
      await streamChat([
        { role: "system", content: "你是面经问答助手。只能基于给定资料回答，用中文，条理清晰；引用资料时标注序号如 [1]；资料无法回答时明确说「暂无相关资料」。" },
        { role: "user", content: `问题：${q}\n\n资料：\n${ctx}` },
      ], piece => { full += piece; target.textContent = full; }, ctrl.signal);
      target.textContent = full;
      box.querySelector(".rag-answer").insertAdjacentHTML("beforeend", citeBlock + `<div class="rag-score">retriever=${retrieverTag} · llm=${modelLabel} · hits=${hits.length}</div>`);
    } catch (e) {
      toast("真实模型调用失败，已降级为关键词检索结果");
      askRag(true);
    }
    return;
  }

  box.innerHTML = `<div class="rag-answer fade-up">
    <b>（Mock 模式）</b>混合检索命中 ${hits.length} 条相关资料，最相关的是「${hits[0].source}」；接入模型后，这里将由真实模型基于以下资料生成带引用的完整回答：
    ${citeBlock}
    <div class="rag-score">retriever=${retrieverTag} · tokens=${tokenize(q).length} · hits=${hits.length}</div>
  </div>`;
}

