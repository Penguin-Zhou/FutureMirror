/* ============================================================
 * test-beta1-vector-jsdom.js —— beta1.0 端侧向量检索测试
 *   覆盖：中文 bigram 分词 / BM25 索引与 IDF / n-gram hashing 向量
 *        （维度·L2 归一·确定性）/ 余弦相似度 / localStorage 向量缓存
 *        （写入·命中·损坏回退）/ 混合打分融合与门槛 / RAG 页 UI
 *        （索引状态条·两路得分·Mock 回答）/ MiniLM 不可达时降级
 *        / 版本标识 beta1.0 与页脚 AI 辅助开发说明
 *   方法：jsdom 加载单文件演示版，直接调用检索层函数。
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "futuremirror-demo.html"), "utf8");

let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log("  ✅", name); }
  else { fail++; console.log("  ❌", name); }
};

const vc = new VirtualConsole();   // 动态 import 在 jsdom 无实现：静默，走降级分支
const dom = new JSDOM(html, {
  url: "https://example.com/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const w = dom.window;
const doc = w.document;

w.eval(`
  window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
  window.IntersectionObserver = window.IntersectionObserver || class { constructor(cb){ this.cb = cb; } observe(el){ this.cb([{ isIntersecting: true, target: el }], this); } unobserve(){} disconnect(){} };
`);

const js = code => JSON.parse(w.eval(`JSON.stringify(${code})`));
const S = (cond, name) => ok(cond, name);

(async () => {
  /* ============ A. 分词 ============ */
  console.log("\n-- A. 中文 bigram 分词 --");
  const tok1 = js('tokenList("Redis 缓存穿透")');
  S(tok1.includes("redis"), "英文整词保留：redis");
  S(tok1.includes("缓存穿透"), "中文整段保留：缓存穿透");
  S(tok1.includes("缓存") && tok1.includes("存穿") && tok1.includes("穿透"), "中文 bigram 切分：缓存 / 存穿 / 穿透");
  S(js('tokenize("缓存 缓存")').length === 1, "tokenize 去重（词频交给 BM25 的 tf）");
  S(js('tokenList("面 试")').length === 0, "单字词被过滤（避免噪声召回）");
  const tok2 = js('tokenList("MySQL，索引。事务")');
  S(tok2.includes("mysql") && tok2.includes("索引") && tok2.includes("事务"), "中英标点混排切分正常");
  S(js('tokenList("字节后端").filter(t => t.length === 2).length') === 3, "四字串产生 3 个 bigram");

  /* ============ B. BM25 ============ */
  console.log("\n-- B. BM25 索引 --");
  S(js("bm25Index().N") === 40, "索引覆盖全部 40 条面经");
  S(js("bm25Index().k1") === 1.5 && js("bm25Index().b") === 0.75, "BM25 参数 k1=1.5 / b=0.75");
  S(js("bm25Index().avgdl") > 0, "平均文档长度已计算（长度归一用）");
  S(w.eval("bm25Score(['redis']).every(x => x >= 0)"), "IDF 恒正——高频词不会产生负权重");
  const bmRedis = js('bm25Score(["穿透"])');
  S(Math.max(...bmRedis) > 0, "「穿透」在库内命中（非零 BM25）");
  S(bmRedis[4] === Math.max(...bmRedis), "含「穿透」的 Redis 条目 BM25 得分最高（下标 4）");
  S(w.eval(`(function(){ const t = tokenList("Redis 缓存穿透 击穿 雪崩 区别").slice(); let n = 0; for (const x of t) if (bm25Index().df.get(x)) n++; return n; })()`) > 3, "查询词多数能在倒排表命中");

  /* ============ C. 向量层 ============ */
  console.log("\n-- C. 端侧向量（hashing 兜底） --");
  S(w.eval("ensureVecIndex()") === true, "ensureVecIndex 同步建索引成功");
  S(w.eval("vecIndex.provider") === "hash", "无模型文件时 provider=hash（离线可跑）");
  S(w.eval("vecIndex.dim") === 256, "兜底向量维度 256");
  S(w.eval("vecIndex.vectors.length") === 40, "40 条面经各一条向量");
  S(w.eval("vecIndex.vectors.every(v => v.length === 256)"), "每条向量维度一致");
  S(w.eval("vecIndex.vectors.every(v => v.every(x => Number.isFinite(x)))"), "向量元素均为有限数（无 NaN/Inf）");
  const norm0 = js("(function(){ const v = vecIndex.vectors[0]; return v.reduce((s, x) => s + x * x, 0); })()");
  S(Math.abs(norm0 - 1) < 0.01, "向量已 L2 归一（模长 ≈ 1，余弦可退化为点积）");
  S(w.eval('JSON.stringify(hashEmbed("STAR 法则", 256))') === w.eval('JSON.stringify(hashEmbed("STAR 法则", 256))'), "同文本向量确定性一致");
  S(w.eval('JSON.stringify(hashEmbed("STAR 法则", 256))') !== w.eval('JSON.stringify(hashEmbed("MySQL 索引", 256))'), "不同文本向量不同");
  S(Math.abs(w.eval("cosine([1,0],[0,1])")) === 0, "正交向量余弦为 0");
  S(w.eval("cosine([1,0,0],[1,0])") === 0, "维度不一致时余弦安全返回 0");
  S(Math.abs(w.eval("cosine([0.6,0.8],[0.6,0.8])") - 1) < 1e-9, "自相似余弦为 1");

  /* ============ D. localStorage 向量缓存 ============ */
  console.log("\n-- D. 向量索引缓存 --");
  const rawCache = w.localStorage.getItem("fm_kb_vec_v1");
  S(!!rawCache, "向量已写入 localStorage（预计算缓存）");
  const cache = JSON.parse(rawCache || "{}");
  S(cache.n === 40 && cache.provider === "hash" && cache.dim === 256, "缓存元信息完整（n / provider / dim）");
  S(Array.isArray(cache.vectors) && cache.vectors.length === 40, "缓存内含 40 条向量");
  S(rawCache.length < 512 * 1024, `缓存体积可控（${Math.round(rawCache.length / 1024)}KB < 512KB）`);
  // 命中缓存：清掉内存态后应能从 localStorage 恢复
  w.eval("vecIndex.ready = false; vecIndex.vectors = null; vecIndex.source = '';");
  S(w.eval("restoreVecIndex()") === true, "二次访问从缓存恢复索引");
  S(w.eval("vecIndex.source") === "cache", "恢复来源标记为 cache（零推理启动）");
  // 缓存损坏（条目数不匹配）应拒绝使用，而不是带病检索
  w.localStorage.setItem("fm_kb_vec_v1", JSON.stringify({ n: 3, provider: "hash", dim: 2, vectors: [[1, 2]], model: "" }));
  w.eval("vecIndex.ready = false; vecIndex.vectors = null;");
  S(w.eval("restoreVecIndex()") === false, "缓存与知识库不符时拒绝恢复（防脏索引）");
  w.eval("buildHashIndex(); persistVecIndex();");
  S(w.eval("ensureVecIndex() && vecIndex.vectors.length === 40"), "重建索引后恢复可用");

  /* ============ E. 混合检索 ============ */
  console.log("\n-- E. BM25 + 余弦 混合检索 --");
  const rowRedis = js('hybridRetrieve("Redis 缓存穿透 击穿 雪崩 区别", 3)');
  S(rowRedis.length === 3, "返回 3 条结果");
  S(rowRedis[0].entry.title.includes("Redis"), "Top1 命中 Redis 缓存三兄弟");
  S(Math.abs(rowRedis[0].score - (0.6 * rowRedis[0].cos + 0.4 * rowRedis[0].bm25Norm)) < 0.01, "融合分 = 余弦×0.6 + BM25归一分×0.4（重排不改变 score 语义）");
  S(rowRedis.every((r, i) => i === 0 || rowRedis[i - 1].final >= r.final), "结果按重排分 final 降序");
  S(rowRedis.every(r => r.score > 0 && r.entry.content), "每条结果带分数与正文（可展示证据）");
  S(js('hybridRetrieve("", 3)').length === 0, "空查询返回空");
  S(js('hybridRetrieve("   ", 3)').length === 0, "纯空白查询返回空");
  S(js('hybridRetrieve("xyzzy", 3)').length === 0, "无意义查询不硬凑结果（防余弦噪声召回）");
  S(js('hybridRetrieve("字节后端二面一般问什么", 3)').length === 3, "中文无空格长句命中 3 条");
  S(js('hybridRetrieve("字节后端二面一般问什么", 1)').length === 1, "k 参数截断生效");
  const r1 = js('retrieve("STAR 法则怎么讲项目", 3)');
  S(r1.length === 3 && r1[0].title.includes("STAR"), "retrieve 兼容旧接口（返回 entry，Top1 为 STAR）");
  S(r1.every(e => typeof e.title === "string" && typeof e.source === "string"), "entry 结构完整（title / source / content）");
  S(js('hybridRetrieve("MySQL 索引为什么用 B+ 树", 3)')[0].entry.title.includes("B+"), "同义改写查询命中 B+ 树条目");

  /* ============ E2. 重排序 ============ */
  console.log("\n-- E2. 特征重排（混合召回复用后的精排）--");
  const rr = js('hybridRetrieve("字节 后端 二面", 5)');
  S(rr.length > 0 && rr.every(r => r.feat && typeof r.final === "number"), "重排结果带 5 特征分解与 final 分");
  S(rr.every((r, i) => i === 0 || rr[i - 1].final >= r.final), "重排后严格按 final 降序");
  S(rr.every(r => r.feat.title >= 0 && r.feat.title <= 1 && r.feat.phrase >= 0 && r.feat.phrase <= 1), "特征值均在 [0,1]（可解释、可展示）");
  S(rr[0].entry.title.includes("字节") && rr[0].entry.title.includes("二面"), "标题全覆盖查询的词条被重排到 Top1");
  const rrPhrase = js('hybridRetrieve("Redis 缓存穿透", 3)');
  S(rrPhrase[0].entry.title.includes("穿透") && rrPhrase[0].feat.phrase >= 0.9, "完整短语命中获得高 phrase 特征分");
  const rrNoise = js('hybridRetrieve("xyzzy", 3)');
  S(rrNoise.length === 0, "无召回时重排不硬凑结果");
  const rrStar = js('hybridRetrieve("STAR 法则怎么讲项目", 3)');
  S(rrStar[0].entry.title.includes("STAR"), "STAR 查询重排后 Top1 仍是 STAR 条目");
  const pool = js('scoreAll(tokenize("字节 后端 二面"), null).slice(0, 8)');
  const before = pool.map(r => r.entry.title);
  const after = js('rerank("字节 后端 二面", scoreAll(tokenize("字节 后端 二面"), null).slice(0, 8))').map(r => r.entry.title);
  S(after.length === pool.length && before.every(t => after.includes(t)), "重排是候选池的重新排列（不引入新条目）");
  S(js('rerank("字节 后端 二面", [])').length === 0, "空候选池重排返回空");

  /* ============ F. RAG 页 UI ============ */
  console.log("\n-- F. RAG 页向量索引状态条 --");
  S(!!doc.getElementById("vec-bar"), "索引状态条 #vec-bar 存在");
  S(!!doc.getElementById("vec-dot"), "状态灯 #vec-dot 存在");
  const statusTxt = doc.getElementById("vec-status").textContent;
  S(/向量索引 40 条/.test(statusTxt), "状态条显示索引条数");
  S(/256d/.test(statusTxt), "状态条显示向量维度");
  S(/余弦/.test(statusTxt) && /BM25/.test(statusTxt), "状态条显示融合公式");
  S(doc.querySelector("#vec-bar .vec-dot").className.includes("warn"), "兜底向量以琥珀色提示（非真实语义）");
  const btn = doc.getElementById("vec-build-btn");
  S(!!btn && !btn.disabled, "「加载 MiniLM」按钮可点击");
  S(btn.textContent.includes("MiniLM"), "按钮文案标明模型名");
  const pane = doc.querySelector('[data-page="rag"]').textContent;
  S(/Transformers\.js/.test(pane), "页面说明写明向量由 Transformers.js 在浏览器内计算");
  S(/离线可跑/.test(pane) && /不需要后端/.test(pane), "页面说明写明零后端零 API、离线可跑");
  S(/localStorage/.test(pane), "页面说明写明向量缓存位置");
  S(/pgvector/.test(pane) && /RRF/.test(pane), "页面说明保留完整版升级路径（pgvector + RRF + Rerank）");

  /* ============ G. askRag 渲染（Mock 路径） ============ */
  console.log("\n-- G. 混合检索结果渲染 --");
  w.eval("currentUser = { id: 'u_b1', email: 'b1@t.com', name: 'beta 测试' }; llm = null;");
  doc.getElementById("rag-input").value = "Redis 缓存穿透 击穿 雪崩 区别";
  await w.eval("askRag()");
  const ragTxt = doc.getElementById("rag-result").textContent;
  S(/Mock 模式/.test(ragTxt), "未接模型时走 Mock 摘要");
  S(/hybrid\(bm25×0\.4\+cos×0\.6\)/.test(ragTxt), "回答标注 retriever=hybrid(bm25×0.4+cos×0.6)");
  S(/vec=hash-ngram 256d/.test(ragTxt), "回答标注向量提供者与维度");
  S(/bm25 [\d.]+ · cos [\d.]+ · 融合 [\d.]+/.test(ragTxt), "引用来源逐条展示两路得分");
  S(/引用来源/.test(ragTxt), "答案强制附引用来源");
  doc.getElementById("rag-input").value = "量子退火玻色采样";
  await w.eval("askRag()");
  S(/暂未检索到相关资料/.test(doc.getElementById("rag-result").textContent), "库外问题明确说没有资料（不硬编答案）");

  /* ============ H. MiniLM 不可达时降级 ============ */
  console.log("\n-- H. 端侧模型降级 --");
  const loaded = await Promise.race([
    w.eval("loadVecModel(true)"),
    new Promise(r => setTimeout(() => r("timeout"), 4000)),
  ]);
  S(loaded === false, "CDN 不可达时 loadVecModel 返回 false（不抛异常）");
  S(/加载失败/.test(doc.getElementById("vec-status").textContent), "状态条如实显示加载失败原因");
  S(w.eval("vecIndex.provider") === "hash" && w.eval("vecIndex.vectors.length") === 40, "降级后仍保有 40 条离线向量索引");
  S(doc.getElementById("vec-build-btn").textContent.includes("MiniLM"), "失败后按钮可重试");
  S(js('hybridRetrieve("Redis 缓存穿透", 3)').length > 0, "降级后检索链路不中断");

  /* ============ H2. 权重源解析（自托管优先） ============ */
  console.log("\n-- H2. 权重源解析 --");
  const hosts = js("vecHosts()");
  S(Array.isArray(hosts) && hosts.length >= 4, `权重源列表含同源与兜底（${hosts.length} 个）`);
  S(/^https:\/\/example\.com\/models\/$/.test(hosts[0]), "首个权重源是同源 models/（自托管，零跨域）");
  S(hosts.includes("https://penguin-zhou.github.io/FutureMirror/models/"), "跨域兜底为 Pages 的 models/（带 ACAO:*）");
  S(hosts.includes("https://hf-mirror.com/") && hosts.includes("https://huggingface.co/"), "外网源保留为最后兜底");
  S(new Set(hosts).size === hosts.length, "权重源列表已去重");
  S(js('hostLabel(vecHosts()[0])') === "本站 models/", "同源源在状态条显示为「本站 models/」");
  S(js('hostLabel("https://hf-mirror.com/")') === "hf-mirror.com", "外网源显示为主机名");
  const savedFetch = w.fetch;
  w.fetch = undefined;
  const probeNoFetch = await w.eval("probeHost(vecHosts()[0])");
  const wasmNoFetch = await w.eval("probeWasm(vecHosts()[0])");
  w.fetch = savedFetch;
  S(probeNoFetch === true, "无 fetch 环境探测直接放行，交由 pipeline 报错（不误判为源不可用）");
  S(wasmNoFetch === false, "无 fetch 环境时 wasm 探测返回 false，回退 CDN 路径");
  S(w.eval("VEC_CFG.ortPath") === "ort/" && /jsdelivr/.test(w.eval("VEC_CFG.ortCdn")), "wasm 同源路径与 CDN 兜底均已配置");

  /* ============ I. 版本与声明 ============ */
  console.log("\n-- I. beta1.0 版本与页脚声明 --");
  S(/beta1\.0/.test(doc.querySelector(".sb-footer").textContent), "侧栏版本号 beta1.0");
  /* 静态 <title> 标注版本；运行期 applyRoute 会按子路由改写 document.title（属预期行为） */
  S(/Beta 1\.0/.test((html.match(/<title>([^<]*)<\/title>/) || [])[1] || ""), "页面标题标注 Beta 1.0");
  S(/Beta 1\.0/.test(doc.querySelector(".banner").textContent), "演示横幅标注 Beta 1.0");
  S(/AI辅助开发说明/.test(doc.querySelector("#view-landing footer").textContent), "落地页页脚含 AI 辅助开发说明");
  const footers = [...doc.querySelectorAll("footer")].map(f => f.textContent);
  S(footers.filter(t => /AI辅助开发说明/.test(t)).length >= 3, `三处页脚均已声明（实际 ${footers.filter(t => /AI辅助开发说明/.test(t)).length} 处）`);
  S(/多Agent调度/.test(footers.join("")) || /多Agent/.test(footers.join("")), "页脚声明区分 AI 辅助项与团队独立实现项");
  S(html.includes('version: "beta1.0.5"'), "诊断导出报告版本号 beta1.0.5");
  S(/版本 beta1\.0\.5 · 蓝图编辑风/.test(html), "开发者日志版本号 beta1.0.5");
  S(w.eval("typeof window.loadVecModel === 'function'"), "全局暴露 loadVecModel（按钮 onclick 可调）");
  S(/fm_kb_vec_v1/.test(html), "缓存 key 固定为 fm_kb_vec_v1（可被清理脚本识别）");

  console.log(`\n结果：${pass} 通过 / ${fail} 失败（beta1.0 端侧向量检索）`);
  process.exit(fail ? 1 : 0);
})();
