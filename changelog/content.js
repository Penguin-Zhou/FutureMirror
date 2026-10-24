// 自动生成：来自 更新日志.html，已加 id 与可点击版本索引（锚点跳转）。
export const changelogHtml = `
<div class="container">

  <!-- ============ 标题 ============ -->
  <div class="header">
    <h1>面镜 FutureMirror</h1>
    <div class="sub">版本更新日志 · v1 → Beta 1.1.2</div>
    <div class="meta">
      <span>已发布 <b>35</b> 个版本</span>
      <span>当前版本 <b>Beta 1.1.2</b></span>
      <span>规划中 <b>1</b> 个版本</span>
      <span>覆盖 <b>2026.08 → 2026.10</b></span>
    </div>
  </div>

  <!-- ============ 阅读指引 ============ -->
  <div class="reading-guide">
    <b>阅读指引：</b>本日志按版本倒序排列。带 <span class="badge-pub">已发布</span> 标记的版本均已上线；带 <span class="badge-cur">当前版本</span> 标记的是 Beta 1.1.2，为当前正式发布版本（体验修复层：3 个主流程缺陷修复 + 学习计划板块 + 十字准线开关 + 36 枚自制图标）；带 <span class="badge-plan">规划中</span> 标记的版本为下一步迭代计划，虚线边框与浅黄背景以便区分。所有数据指标均来自对应版本代码库的实际统计；本文档仅记录团队自研功能的演进，不含任何第三方内容。
  </div>

  <!-- ============ 总览 ============ -->
  <div class="overview">
    <div class="ov-card"><div class="ov-num">35</div><div class="ov-label">已发布版本</div></div>
    <div class="ov-card"><div class="ov-num">11</div><div class="ov-label">功能页</div></div>
    <div class="ov-card"><div class="ov-num">5</div><div class="ov-label">协作 Agent</div></div>
    <div class="ov-card"><div class="ov-num">24</div><div class="ov-label">岗位数据库</div></div>
    <div class="ov-card"><div class="ov-num">40</div><div class="ov-label">面经知识库</div></div>
    <div class="ov-card"><div class="ov-num">5</div><div class="ov-label">题库分类</div></div>
    <div class="ov-card"><div class="ov-num">24</div><div class="ov-label">题库题目</div></div>
    <div class="ov-card"><div class="ov-num">1427</div><div class="ov-label">前端断言</div></div>
  </div>

  <!-- ========================================================
       v23 · 规划中
       ======================================================== -->
  <nav class="cl-toc" aria-label="版本索引">
  <div class="cl-toc-title">版本索引 · 点击跳转</div>
  <ul class="cl-toc-list">
    <li><a href="#vbeta1-10"><span class="cl-toc-tag">Beta 1.1.0</span><span class="cl-toc-title-txt">完整性补全层 · 骨架屏 + 媒体三层 + Excel + WebSocket + 键盘可达</span></a></li>
    <li><a href="#vbeta1-12"><span class="cl-toc-tag">Beta 1.1.2</span><span class="cl-toc-title-txt">体验修复层 · 重新面试 + 滚动吸附收窄 + 看板实时刷新 + 学习计划 + 图标系统</span></a></li>
    <li><a href="#vbeta1-11"><span class="cl-toc-tag">Beta 1.1.1</span><span class="cl-toc-title-txt">审计加固层 · 文档一致性 + 安全加固 + XSS 收口 + 泄漏修复 + 视觉纪律</span></a></li>
    <li><a href="#v23"><span class="cl-toc-tag">v23 · 规划中</span><span class="cl-toc-title-txt">完整版对齐 · 生产级 RAG · 多模态扩展</span></a></li>
    <li><a href="#vbeta1-9"><span class="cl-toc-tag">Beta 1.0.9</span><span class="cl-toc-title-txt">专家能力层 · 印刷风质感 + 微交互 + 滚动驱动 + 数据可视化</span></a></li>
    <li><a href="#vbeta1-8"><span class="cl-toc-tag">Beta 1.0.8</span><span class="cl-toc-title-txt">深度交互层 · 命令面板 Pro + 报告可视化 + 实时批注</span></a></li>
  <li><a href="#vbeta1-7"><span class="cl-toc-tag">Beta 1.0.7</span><span class="cl-toc-title-txt">全站交互层 · 图纸动作铺满每个页面</span></a></li>
    <li><a href="#vbeta1-6"><span class="cl-toc-tag">Beta 1.0.6</span><span class="cl-toc-title-txt">交互深化层 · 命令面板与滚动语言</span></a></li>
    <li><a href="#vbeta1-5"><span class="cl-toc-tag">Beta 1.0.5</span><span class="cl-toc-title-txt">动态层 · 粒子场与微交互</span></a></li>
    <li><a href="#vbeta1-4"><span class="cl-toc-tag">Beta 1.0.4</span><span class="cl-toc-title-txt">体验层增强 · 交互反馈与可访问性</span></a></li>
    <li><a href="#vbeta1-3"><span class="cl-toc-tag">Beta 1.0.3</span><span class="cl-toc-title-txt">蓝图编辑风视觉重构 · 去 AI 模板化</span></a></li>
    <li><a href="#vbeta"><span class="cl-toc-tag">Beta 1.0</span><span class="cl-toc-title-txt">检索层升级与版本定位</span></a></li>
    <li><a href="#vbeta1-2"><span class="cl-toc-tag">Beta 1.0.2</span><span class="cl-toc-title-txt">真实模型上线 · 检索重排与评分校准</span></a></li>
    <li><a href="#vbeta1-1"><span class="cl-toc-tag">Beta 1.0.1</span><span class="cl-toc-title-txt">后端上线 · 全渠道接通真实服务</span></a></li>
    <li><a href="#v22"><span class="cl-toc-tag">v22</span><span class="cl-toc-title-txt">后端适配与工程化</span></a></li>
    <li><a href="#v21"><span class="cl-toc-tag">v21</span><span class="cl-toc-title-txt">悬浮球拖拽冻结 + 移动端美化</span></a></li>
    <li><a href="#v20"><span class="cl-toc-tag">v20</span><span class="cl-toc-title-txt">题库增强 + AI 小助手 + 移动端导航顶部化</span></a></li>
    <li><a href="#v19"><span class="cl-toc-tag">v19</span><span class="cl-toc-title-txt">题库小测模块 + VIP 会员体系</span></a></li>
    <li><a href="#v18"><span class="cl-toc-tag">v18</span><span class="cl-toc-title-txt">产品闭环深化 · 求职管理 + 面试真实感</span></a></li>
    <li><a href="#v17"><span class="cl-toc-tag">v17</span><span class="cl-toc-title-txt">深海蓝 AI Native 视觉重构</span></a></li>
    <li><a href="#v16"><span class="cl-toc-tag">v16</span><span class="cl-toc-title-txt">个人中心 · 头像系统 · 偏好与数据管理</span></a></li>
    <li><a href="#v15"><span class="cl-toc-tag">v15 · Beta</span><span class="cl-toc-title-txt">工作台精简与互动升级</span></a></li>
    <li><a href="#v14"><span class="cl-toc-tag">v14</span><span class="cl-toc-title-txt">开发者模式升级</span></a></li>
    <li><a href="#v13"><span class="cl-toc-tag">v13</span><span class="cl-toc-title-txt">评审专区（加密 + 一键进入）</span></a></li>
    <li><a href="#v12"><span class="cl-toc-tag">v12</span><span class="cl-toc-title-txt">可验证运行时能力三件套</span></a></li>
    <li><a href="#v11"><span class="cl-toc-tag">v11</span><span class="cl-toc-title-txt">目标岗位下拉选择器</span></a></li>
    <li><a href="#v10"><span class="cl-toc-tag">v10</span><span class="cl-toc-title-txt">导航重构与数据扩充</span></a></li>
    <li><a href="#v9"><span class="cl-toc-tag">v9</span><span class="cl-toc-title-txt">修复 HTML 结构 + 细节完善</span></a></li>
    <li><a href="#v8"><span class="cl-toc-tag">v8</span><span class="cl-toc-title-txt">多页面路由 + 导航系统</span></a></li>
    <li><a href="#v7"><span class="cl-toc-tag">v7</span><span class="cl-toc-title-txt">首页落地页 + 游客模式</span></a></li>
    <li><a href="#v6"><span class="cl-toc-tag">v6</span><span class="cl-toc-title-txt">真实模型修复 + 新板块 + UI 重构</span></a></li>
    <li><a href="#v5"><span class="cl-toc-tag">v5</span><span class="cl-toc-title-txt">登录系统 + UI 全面升级</span></a></li>
    <li><a href="#v4"><span class="cl-toc-tag">v4</span><span class="cl-toc-title-txt">深度完善版</span></a></li>
    <li><a href="#v3"><span class="cl-toc-tag">v3</span><span class="cl-toc-title-txt">深度完善 · 修复模型调用</span></a></li>
    <li><a href="#v2"><span class="cl-toc-tag">v2</span><span class="cl-toc-title-txt">体验完善版</span></a></li>
    <li><a href="#v1"><span class="cl-toc-tag">v1</span><span class="cl-toc-title-txt">初始原型</span></a></li>
  </ul>
</nav>
<div class="version v23 planning" id="v23">
    <div class="version-head">
      <span class="v-tag v-tag-plan">v23 · 规划中</span>
      <span class="v-title">完整版对齐 · 生产级 RAG · 多模态扩展</span>
      <span class="v-date">待排期</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        下一阶段目标：把演示层的关键能力向生产级对齐，同时补齐多模态与部署工程化的空白。以下为规划项，尚未进入代码库。
      </div>

      <div class="cat">
        <span class="cat-title cat-plan">📋 RAG 升级</span>
        <ul class="changelog">
          <li><b>pgvector 持久化</b>：向量库从浏览器 localStorage 迁到 PostgreSQL + pgvector，支持跨设备与多用户共享知识库</li>
          <li><b>RRF 融合</b>：用 Reciprocal Rank Fusion 替代当前的 min-max 归一加权，减少人工调参</li>
          <li><b>Cross-Encoder Rerank</b>：对 Top-K 结果做二阶段重排序，提升相关条目的排序稳定性</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-plan">🤖 Agent 升级</span>
        <ul class="changelog">
          <li><b>真实 MCP Server</b>：从"本地模拟 Server"升级为跨进程真实 MCP，支持跨 Agent 工具发现</li>
          <li><b>多轮规划</b>：引入有限状态机式的 Agent 编排，支持复杂面试场景的长链路决策</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-plan">📊 评分增强</span>
        <ul class="changelog">
          <li><b>确定性引擎 + LLM 质性增强（已在 Beta 1.1.2 落地）</b>：分数由确定性规则引擎给出（可复现、可解释），LLM 仅负责逐维度质性评语与教练总评的生成与兜底</li>
          <li><b>人工专家评审一致性验证（规划中）</b>：邀请领域专家对抽样面试独立打分，与引擎分数做点对点对比，定位分维度偏差</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-plan">🎤 多模态扩展</span>
        <ul class="changelog">
          <li><b>Whisper ASR</b>：用 Whisper 替代 Web Speech API，提升噪声环境下的识别准确度</li>
          <li><b>语速 / 停顿分析</b>：从语音输入中提取语速、停顿、填充词密度，作为"语言表达"维度的新信号</li>
          <li><b>白板代码识别</b>：支持从面试白板截图或手写板中识别代码并结构化入沙盒</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-plan">🚀 部署工程化</span>
        <ul class="changelog">
          <li><b>多租户隔离</b>：后端从 SQLite 迁到 PostgreSQL，支持多租户数据隔离</li>
          <li><b>限流与配额</b>：按用户 / IP 限流，防止滥用</li>
          <li><b>对象存储</b>：简历文件、报告 PDF、代码沙盒产物的独立存储层</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 规划指标（预估）</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">3</div><div class="m-label">RAG 升级项</div></div>
          <div class="metric"><div class="m-val">2</div><div class="m-label">Agent 升级项</div></div>
          <div class="metric"><div class="m-val">2</div><div class="m-label">评分升级项</div></div>
          <div class="metric"><div class="m-val">3</div><div class="m-label">多模态升级项</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.0 · 检索层升级与版本定位
       ======================================================== -->
  <div class="version vbeta" id="vbeta">
    <div class="version-head">
      <span class="v-tag">Beta 1.0</span>
      <span class="v-title">检索层升级与版本定位</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        RAG 检索从"关键词匹配"升级为 <b>BM25 + 端侧向量混合检索</b>——BM25 负责词面召回，Transformers.js 在浏览器内运行 <code>all-MiniLM-L6-v2</code>（384 维）负责语义召回，40 条面经向量预计算后写入 <code>localStorage</code>；无模型文件时自动降级为 n-gram hashing 向量（256 维）；两路 min-max 归一分后按 <code>cos×0.6 + bm25×0.4</code> 融合。同时统一版本号为 <b>beta1.0</b>，README 顶部与三处页脚补齐 AI 辅助开发声明。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>BM25 词面召回</b>：<code>k1=1.5</code>、<code>b=0.75</code>，IDF 用 <code>log(1+…)</code> 保证恒正，标题字段重复计入 = 权重 ×2；中文 bigram 分词支持无空格召回</li>
          <li><b>端侧向量语义召回</b>：Transformers.js + <code>all-MiniLM-L6-v2</code>（384 维，mean pooling + L2 归一），浏览器内推理，零后端零 API</li>
          <li><b>向量索引缓存</b>：<code>localStorage["fm_kb_vec_v1"]</code>，存 40 条向量 + 元信息（provider / dim / n / builtAt）；<code>n</code> 与知识库不符时<b>拒绝加载</b>防脏索引</li>
          <li><b>离线兜底</b>：n-gram hashing 向量（256 维，有符号特征哈希 + L2 归一），CDN 不可达时自动启用，检索链路不中断</li>
          <li><b>融合公式</b>：<code>score = 0.6 × cosine + 0.4 × bm25_normalized</code>；纯语义召回设余弦门槛（MiniLM 0.15 / hashing 0.32）防噪声</li>
          <li><b>向量索引状态条</b>：RAG 页顶部实时显示 provider / 维度 / 条数 / 缓存命中 / 融合公式，三种状态（MiniLM 绿 / hashing 琥珀 / 加载中蓝）</li>
          <li><b>逐条展示两路得分</b>：每条引用显示 <code>bm25 0.82 · cos 0.61 · 融合 0.74</code>，可当场核对</li>
          <li><b>80 项新断言</b>：<code>test-beta1-vector-jsdom.js</code> 覆盖分词 / BM25 / 向量归一与确定性 / 缓存命中与失效 / 融合排序 / UI / CDN 降级</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b><code>askRag()</code> 改走异步混合检索</b>：MiniLM 就绪时用模型编码 query，否则用词面向量；缓存命中但模型未加载时后台热加载，本次先走 BM25</li>
          <li><b>README 与三处页脚统一 AI 辅助开发声明</b>：明确区分 AI 辅助项（CSS / 工具函数 / 文案）与团队独立实现项（多 Agent / 评分引擎 / RAG 策略 / 架构 / 测试体系）</li>
          <li><b>版本号统一</b>：侧栏、标题、演示横幅、诊断导出、开发者日志全部为 <code>beta1.0</code></li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">384d</div><div class="m-label">MiniLM 语义维度</div></div>
          <div class="metric"><div class="m-val">256d</div><div class="m-label">hashing 兜底维度</div></div>
          <div class="metric"><div class="m-val">0.6/0.4</div><div class="m-label">融合权重</div></div>
          <div class="metric"><div class="m-val">80</div><div class="m-label">新增断言</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.0.5 · 动态层（Blueprint Motion Kit）
       ======================================================== -->
  <!-- ========================================================
       Beta 1.0.9 · 专家能力层（Blueprint Expert Layer）
       ======================================================== -->
  <div class="version vbeta1-12 current" id="vbeta1-12">    <div class="version-head">
      <span class="v-tag v-tag-current">Beta 1.1.2</span>
      <span class="v-title">体验修复层 · 重新面试入口 + 滚动吸附收窄 + 看板实时刷新 + 学习计划板块 + 全站图标</span>
      <span class="v-date">2026.10.24 <span class="cur-mark">当前版本</span></span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        收集一轮真实使用反馈，修掉 <strong>3 个影响主流程的缺陷</strong>，并把「7 天学习路径」从报告页里的一小块摘要升级为<strong>独立板块</strong>：<strong>① 模拟面试无法重新面试</strong>——重面入口此前只藏在 ⌘K 面板与报告页，面试页 chat-head 新增「🔄 重新面试」按钮（沿用带撤销 toast 的重置快照机制，并补登录守卫）；<strong>② 题库页滚动粘滞</strong>——滚动吸附 <code>.bp-snap-y</code> 此前无条件常驻挂在 <code>documentElement</code> 上，应用内所有页面的滚动都被分段吸附阻滞，现收窄为仅落地页视图生效（进入挂载、离开拆除），题库子页签切换后平滑回顶；<strong>③ 能力分布看板数据冻结</strong>——看板此前只在开机装配一次，面试后仍显示「基线数据」，新增 <code>refreshReportPanel()</code>（停旧 live → 摘旧面板 → 按最新会话重挂）并由 <code>renderReport()</code> 在渲染末尾调用，空态路径同步撤下面板。<strong>④ 新增「学习计划」板块</strong>——7 天路径 + 每日时间分配规划：计划内容一键「同步评估报告」按最弱维度动态生成（scoreSession + buildPlan），无报告时回落通用基线；每日时间按「学习 : 练习 : 复盘」权重切分，三档预算（45 / 60 / 90 分钟）切换后自动重算；逐任务打卡 + 进度条 + 印章完成态，支持复制 Markdown 与打印。<strong>⑤ 偏好设置新增「十字鼠标追踪」开关</strong>——准线默认开启，关闭即时撤除、开启即时恢复（<code>prefs.crosshair</code>）。<strong>⑥ 全站图标替换</strong>——36 枚自制蓝图风线性 SVG 图标（24×24、stroke=currentColor 继承文字色、方头直角、每枚仅一枚朱红 accent）替换 63 处模板化 emoji，覆盖侧栏 / 底 Tab / 页头 / 快速入口 / 统计卡 / 落地页 / 主题钮 / 用户菜单 / AI 悬浮球，favicon 升级为取景器标识；保留 emoji 作无 JS 兜底。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>面试能重来了</b>：chat-head 直接重新面试，重置可撤销</div>
        <div class="vh-item"><b>页面能滚动了</b>：滚动吸附只留在落地页，应用内滚动不再被卡住</div>
        <div class="vh-item"><b>看板看得到自己了</b>：每次进报告都按最新会话重画，不再是基线快照</div>
        <div class="vh-item"><b>7 天计划成板块了</b>：按最弱维度动态生成 + 每日时间分配 + 打卡进度</div>
        <div class="vh-item"><b>全栈收口了</b>：移除未部署的 Next.js 平行实验、接入 LLM 混合评分增强、文档去除非实证表述</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">3</div><div class="m-label">修复缺陷</div></div>
        <div class="metric"><div class="m-val">36</div><div class="m-label">自制 SVG 图标</div></div>
        <div class="metric"><div class="m-val">110</div><div class="m-label">v31 新增断言</div></div>
        <div class="metric"><div class="m-val">1427</div><div class="m-label">前端断言总数</div></div>
      </div>
    </div>
  </div>

  <div class="version vbeta1-11" id="vbeta1-11">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.1</span>
      <span class="v-title">审计加固层 · 文档一致性 + 安全加固 + XSS 收口 + 泄漏修复 + 视觉纪律 + 全量测试入口</span>
      <span class="v-date">2026.10.23</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        对「网站 + 代码仓库 + 全部交付文件」做了一次<strong>逐项复核</strong>，把发现的 12 类问题全部修掉并各自补齐回归断言。本轮不新增功能，只做<strong>正确性 / 安全性 / 一致性 / 工程化</strong>四个方向的收口。重点几项：<strong>① 文档一致性</strong>——技术文档 <code>&lt;title&gt;</code> 长期停留在 v1.2（正文已是 v1.9）已修正为 v1.10 并随版本联动，同时补上 <code>&lt;meta name="viewport"&gt;</code> 与 720px 断点（技术文档在手机上不再溢出）；README 附录版本日志此前仍标「当前版本 Beta 1.0.9 / 共 29 个版本」，与正文矛盾，已统一。<strong>② 环境变量模板</strong>——根 <code>.env.example</code> 列的是早期 Next 原型的 GEMINI / OpenRouter / 智谱 / DeepSeek / Supabase 变量，后端一个都不读，照抄必然失败，已重写为「后端变量 + 构建期 <code>FM_API_BASE</code> + 早期原型变量」三段。<strong>③ 安全</strong>——<code>SECRET_KEY</code> 未配置时不再回退硬编码常量（改为进程启动时随机生成，最坏结果只是重启后令牌失效，而非令牌可伪造）；<code>/api/chat/stream</code> 增加单条 4000 字 / 整段 24000 字上限；<code>/ws/live</code> 增加 50 连接上限与计数回收。<strong>④ XSS 收口</strong>——新增统一 <code>escHtml()</code>，接入简历改写建议、面试时间线、报告证据链（引用原话）、岗位匹配结果；打字机效果由 innerHTML 拼接改为 <code>textContent</code>。<strong>⑤ 内存泄漏</strong>——报告页每次重渲染都会遗留一条实时看板定时器与 WebSocket，已加单实例守卫。<strong>⑥ 视觉纪律</strong>——Hero 光晕的 indigo 径向渐变 + <code>blur(30px)</code>、落地页三色蓝紫渐变、雷达填充与头像调色板的撞色，均已改为单色品牌晕染与墨阶调色板，并补 3 条按色值兜底的断言（旧断言只查 <code>linear-gradient</code> + hex，抓不到 <code>radial-gradient</code> 的 rgba 写法）。<strong>⑦ 工程化</strong>——新增 <code>scripts/run-tests.js</code> 全量测试入口，一条命令跑完 18 套 1317 断言。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>一条命令验全部</b>：<code>npm run test:all</code> 一次跑完 18 套 1317 断言 + vitest + tsc</div>
        <div class="vh-item"><b>令牌不再可伪造</b>：SECRET_KEY 漏配时随机生成，而不是回退硬编码常量</div>
        <div class="vh-item"><b>引用原话也不怕</b>：简历原文、面试回答、报告证据链统一走 escHtml 转义</div>
        <div class="vh-item"><b>蓝紫撞色清零</b>：Hero 光晕与头像调色板改走墨阶 + 单一朱红，并加了防复发断言</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">12</div><div class="m-label">修复类别</div></div>
        <div class="metric"><div class="m-val">1317</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">21</div><div class="m-label">后端 pytest</div></div>
        <div class="metric"><div class="m-val">29</div><div class="m-label">技术文档页数</div></div>
      </div>
    </div>
  </div>

  <div class="version vbeta1-10" id="vbeta1-10">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.0</span>
      <span class="v-title">完整性补全层 · 骨架屏 + 媒体三层 + Excel 导出 + WebSocket 实时看板 + 键盘可达</span>
      <span class="v-date">2026.10.23</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        对「高级网页能力清单」做第二轮逐项复核，把上一轮只有样式雏形、尚未真正接线的 6 处补齐为<strong>可运行、可测试、可降级</strong>：骨架屏（此前只有 <code>.skeleton</code> 样式定义，页面从未真正渲染占位，本轮新增 <code>skeleton.js</code> 并在报告页等待服务端评分引擎期间真实挂载，带最小驻留防闪烁）；媒体三层（<code>media.js</code>：<code>[data-src]</code> 懒加载 + <code>data-src-sm</code> 渐进 blur-up + <code>[data-preview]</code> 悬停 / 键盘预览，报告看板图表快照即走此通道，纯 data-URI 零外链）；表格导出 Excel（BOM + <code>vnd.ms-excel</code>，与 CSV 并存）；实时看板 WebSocket（后端 <code>/ws/live</code> 每 3 秒推送聚合指标，前端按 apiBase 推导 ws / wss，失败降级 <code>/api/live/stats</code> 轮询）；图表悬停详情（<code>initChartTips()</code> 统一接管 <code>[data-tip]</code>，进步曲线与趋势柱均已带提示）；键盘可达性（跳到主内容 skip link + 弹窗焦点陷阱 <code>role=dialog</code> / <code>aria-modal</code>）。新增 test-v30-jsdom.js 测试套件 74 项断言锁定全部行为（含 reduced-motion 与 WebSocket mock 双路径）。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>等数据时不抖了</b>：骨架屏在服务端评分返回前占位，最小驻留避免秒回闪烁</div>
        <div class="vh-item"><b>图片会懒加载了</b>：进视口才取资源，低清先落再淡入高清，悬停可放大预览</div>
        <div class="vh-item"><b>看板真连后端了</b>：WebSocket 实时推送聚合指标，断了自动降级轮询，状态明示</div>
        <div class="vh-item"><b>键盘能走完全程</b>：跳到主内容 + 弹窗焦点陷阱 + 图表详情支持聚焦查看</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">74</div><div class="m-label">v30 新增断言</div></div>
        <div class="metric"><div class="m-val">1314</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">18</div><div class="m-label">jsdom 测试套件</div></div>
        <div class="metric"><div class="m-val">6</div><div class="m-label">补齐方向</div></div>
      </div>
    </div>
  </div>

  <div class="version vbeta1-9" id="vbeta1-9">
    <div class="version-head">
      <span class="v-tag">Beta 1.0.9</span>
      <span class="v-title">专家能力层 · 印刷风质感 + 微交互 + 滚动驱动 + 数据可视化</span>
      <span class="v-date">2026.10.22</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        在 1.0.8 深度交互层之后，按「高级网页能力清单」逐项补齐 30 项能力，全部沿用印刷风<strong>等价表达</strong>而非照搬玻璃拟态：主题三态（默认 auto 跟随系统明暗，light / dark 显式覆盖，系统切换即时响应）；质感层（<code>feTurbulence</code> 纸纹噪点固定层、墨阶景深 z1/z2/z3 用顶部高光发丝线替代投影、毛玻璃等价 <code>.bp-glass</code> 用半透明纸底 + 纸纹 + 发丝线、光晕边框用 outline 外扩）；微交互（准线十字光标 + 朱红中心点、磁铁按钮向光标吸附、卡片触感 scale 微放而非上浮、Toast 撤销钮可回滚面试重置）；滚动驱动（导航吸顶收缩 56→48、分段 scroll-snap 吸附、窄屏横向画廊、<code>data-speed</code> 视差）；数据可视化（热力图 / 散点图自绘 + 悬浮详情、表格排序筛选分页导出 CSV（含 UTF-8 BOM）、图表卡片可拖拽换位并持久化、基于真实会话的轮询实时看板）；高级组件（可拖拽可调整大小弹窗、分步向导、时间轴、可折叠侧栏、View Transition 路由转场，无 API 时兜底为 clip-path 印刷揭载）。新增 test-v29-jsdom.js 测试套件 103 项断言锁定全部行为（含 reduced-motion 与精细指针双路径）。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>主题会跟随系统</b>：auto / light / dark 三态，系统明暗切换即时响应，命令面板可一键回到自动</div>
        <div class="vh-item"><b>质感不用毛玻璃</b>：纸纹 + 墨阶 + 发丝线 + outline 外扩，印刷风本来的样子</div>
        <div class="vh-item"><b>图表与表格能操作</b>：热力 / 散点悬浮详情、排序筛选分页导出 CSV、卡片拖拽换位</div>
        <div class="vh-item"><b>每个细节可撤销</b>：Toast 撤销钮完整回滚面试重置，弹窗可拖动可缩放</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">103</div><div class="m-label">v29 新增断言</div></div>
        <div class="metric"><div class="m-val">1240</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">17</div><div class="m-label">jsdom 测试套件</div></div>
        <div class="metric"><div class="m-val">6</div><div class="m-label">能力方向</div></div>
      </div>
    </div>
  </div>


  <div class="version vbeta1-8" id="vbeta1-8">
    <div class="version-head">
      <span class="v-tag">Beta 1.0.8</span>
      <span class="v-title">深度交互层 · 命令面板 Pro + 报告可视化联动 + 面试实时批注</span>
      <span class="v-date">2026.10.22</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        在 v27 全站交互层之上继续深化「可操作」：命令面板 Pro（记录最近访问并空查询置顶、子序列评分过滤替代纯子串、面试页注入清空对话 / 切换模式 / 查看评分三条上下文指令）；报告可视化联动（雷达图自绘动画 stroke-dashoffset 0→全绘、维度行 hover 与对应雷达顶点同步高亮、维度悬浮提示，顺手清掉报告雷达的 indigo 硬编码填充改为朱红 tint）；表单焦点微交互（登录输入框聚焦时发丝线自左画出）；面试实时批注（每条面试官提问可附批注，落到 session.turns[i].notes，自动进入报告「评分证据」与学习路径证据链，零新增存储结构）。全站沿用动效宪法——reduced-motion 下全部静态落位、无 JS 内容完整可见。新增 test-v27-jsdom.js 测试套件 44 项断言锁定全部行为（含降级链）。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>命令面板会记忆</b>：最近访问置顶、子序列模糊匹配、面试页专属指令，评委演示一秒直达</div>
        <div class="vh-item"><b>报告会联动</b>：雷达自绘 + 维度行与顶点同步高亮 + 悬浮提示，数据不再静态陈列</div>
        <div class="vh-item"><b>面试可批注</b>：每条提问随手写批注，自动沉淀进报告证据链，闭环可解释评分</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">44</div><div class="m-label">v27 新增断言</div></div>
        <div class="metric"><div class="m-val">1137</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">16</div><div class="m-label">jsdom 测试套件</div></div>
        <div class="metric"><div class="m-val">4</div><div class="m-label">深度交互方向</div></div>
      </div>
    </div>
  </div>

  <div class="version vbeta1-7" id="vbeta1-7">
    <div class="version-head">
      <span class="v-tag">Beta 1.0.7</span>
      <span class="v-title">全站交互层 · 图纸动作铺满每个页面</span>
      <span class="v-date">2026.10.22</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        上一轮的交互深化层只铺在落地页。本轮新增 appfx.js（v27 全站交互层），把同一套「图纸动作」语言推广到<b>应用内 10 个功能页 / 登录页 / 开发者页</b>：切页编舞（标题区与卡片自上而下 clip-path 揭载 + 面包屑等宽光标 + 侧栏规尺扫光）、登录页动态（密码强度四段计 + CapsLock 提示 + 分栏入场）、面试 LIVE 脉冲（MutationObserver 观察面试官轮转，零侵入打 .speaking）、报告与小测数字滚动（#report-total / score-num 计到终值 + 维度条自左生长）、十字准线全站化（由 landingfx 迁出，聚焦输入框时自动隐身）、坐标读数扩展（功能页卡 PG-xx / 开发者节 SEC-xx）、开发者页绘制线（12 节 stagger 展开）。同步把 tokens.css 里遗留的 pageIn 上浮位移统一为 clip-path 揭载——全站不再有任何上浮。v26 测试套件 59 项断言锁定全部行为（含 reduced-motion 双实例降级链）。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>每个页面都会动</b>：切页有揭载与光标、登录有强度计、面试有 LIVE 脉冲、报告有数字滚动</div>
        <div class="vh-item"><b>测绘语言贯穿全站</b>：十字准线 + PG / SEC 坐标读数，功能页与开发者页同样「在图纸上量取」</div>
        <div class="vh-item"><b>零上浮收尾</b>：清掉最后一处 translateY 入场，全站动效只剩裁切、扫光与脉冲三种图纸动作</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">26</div><div class="m-label">坐标读数卡片</div></div>
        <div class="metric"><div class="m-val">59</div><div class="m-label">v26 新增断言</div></div>
        <div class="metric"><div class="m-val">1093</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">15</div><div class="m-label">jsdom 测试套件</div></div>
      </div>
    </div>
  </div>

  <div class="version vbeta1-6" id="vbeta1-6">
    <div class="version-head">
      <span class="v-tag">Beta 1.0.6</span>
      <span class="v-title">交互深化层 · 命令面板与滚动语言</span>
      <span class="v-date">2026.10.22</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        在动态层之上增加<b>交互深化层</b>：命令面板（Ctrl/⌘+K 呼出，17 项命令覆盖区块跳转 / 10 个功能页 / 主题切换 / 开发者模式 / 回顶，分组 + 过滤 + 全键盘导航，面试页保留聚焦输入框原行为）；滚动驱动三件套——返回顶部（直角墨框 + SVG 朱红进度环，600px 阈值）、落地页导航滚动侦测（当前区块点亮朱红下划线）、工作流蓝图绘制线（入视口自左画出，120ms stagger）；落地页动态四件套——Hero 等宽打字机轮播（5 条价值点 + 方块硬切光标）、面试实录气泡依序揭载 + 流式光标、蓝图十字准线（落地页光标测绘线，触屏 / reduced-motion 不注入）、特性卡坐标读数（BLK 编号 + X/Y 测绘 chip）。新增 scrollfx.js / landingfx.js / command.js 三个模块，v25 测试套件 64 项断言锁定全部行为。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>⌘K 直达一切</b>：17 项命令分组呈现，过滤 + 全键盘，评委演示时可一秒跳到任意功能页</div>
        <div class="vh-item"><b>滚动可感知</b>：进度环 / 导航点亮 / 蓝图绘制线，长落地页有了「阅读仪表盘」</div>
        <div class="vh-item"><b>图纸气质延续</b>：十字准线、坐标读数、打字机光标——动态全部长在蓝图语言上</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">17</div><div class="m-label">命令面板条目</div></div>
        <div class="metric"><div class="m-val">64</div><div class="m-label">v25 新增断言</div></div>
        <div class="metric"><div class="m-val">1031</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">3</div><div class="m-label">新增模块</div></div>
      </div>
    </div>
  </div>

  <div class="version vbeta1-5" id="vbeta1-5">
    <div class="version-head">
      <span class="v-tag">Beta 1.0.5</span>
      <span class="v-title">动态层 · 粒子场与微交互</span>
      <span class="v-date">2026.10.22</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        在体验层之上增加<b>动态层</b>：全站 Canvas 粒子场——方形墨点 + 发丝线连线 + 稀疏朱红标记的「图纸测绘点」气质（严禁圆点 / 发光 / 渐变，密度刻意压低至 30–90 点），光标附近粒子受轻微斥力、落地页点击产生朱红方形涟漪；Hero 双栏鼠标视差（规格面板与预览窗反向微移 ±7px，空间深度而非上浮）。微交互批次：按钮方形涟漪、消息气泡左淡入、雷达扫描线旋转、导航下划线扫入、取景角标 hover 延展、文档顶规 hover 点亮朱红。粒子层带完整降级链：无 canvas → 无 2d context → reduced-motion 静态帧 → document.hidden 暂停，全部服从动效宪法。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>图纸测绘点</b>：方点 + 发丝线 + 朱红标记，密度刻意压低，与 AI 模板「星空光点」彻底区隔</div>
        <div class="vh-item"><b>鼠标可感</b>：斥力吹散 / 方形涟漪 / 双栏反向视差，落地页专属不干扰应用内操作</div>
        <div class="vh-item"><b>降级完备</b>：三层降级链 + 动效宪法，任何环境不白屏不报错</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">43</div><div class="m-label">v24 新增断言</div></div>
        <div class="metric"><div class="m-val">967</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">6</div><div class="m-label">微交互批次</div></div>
        <div class="metric"><div class="m-val">3 层</div><div class="m-label">降级链</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.0.4 · 体验层增强（Blueprint Editorial UX Kit）
       ======================================================== -->
  <div class="version vbeta1-4" id="vbeta1-4">
    <div class="version-head">
      <span class="v-tag">Beta 1.0.4</span>
      <span class="v-title">体验层增强 · 交互反馈与可访问性</span>
      <span class="v-date">2026.10.22</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        视觉体系确立后的<b>体验层深化</b>：新增「蓝图 UX Kit」——打字指示器（三点墨点 stagger 脉冲，LLM 流式首字到达前的等待反馈）、面试初始空状态（虚线发丝框 + 等宽眉标 + 可点击建议 chip + 快捷键提示）、滚动进度线（fixed 顶部朱红 2px，rAF 节流）、Toast 划入动画（左侧朱红竖线 + 墨板右滑）。交互语言全面校准：渐入动画由 Arkira 时代残留的 translateY 上浮改为<b>印刷揭载</b>（clip-path 自上而下揭开，与「零上浮」设计语言统一）、视图切换退化为纯淡入、按钮新增按压反馈（1px 位移）与键盘焦点双圈（朱红外圈 + 品牌底光环）。工程侧新增<b>动效宪法</b>：prefers-reduced-motion 全局覆盖（一切动画/过渡瞬时化）、平滑滚动、触屏去蓝闪。测试侧新增 v23 体验层套件锁定全部 UX 行为。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>等待可感知</b>：墨点脉冲代替静默转圈，真实流式与 Mock 双通道均已接线</div>
        <div class="vh-item"><b>空态有引导</b>：新用户第一眼看到建议入口而非空白，快捷键随屏提示</div>
        <div class="vh-item"><b>动效有宪法</b>：系统级减少动效偏好优先，一切动画可瞬时退化</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">24</div><div class="m-label">体验增强项</div></div>
        <div class="metric"><div class="m-val">44</div><div class="m-label">v23 新增断言</div></div>
        <div class="metric"><div class="m-val">924</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">100%</div><div class="m-label">reduced-motion 覆盖</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.0.3 · 蓝图编辑风视觉重构
       ======================================================== -->
  <div class="version vbeta1-3" id="vbeta1-3">
    <div class="version-head">
      <span class="v-tag">Beta 1.0.3</span>
      <span class="v-title">蓝图编辑风视觉重构 · 去 AI 模板化</span>
      <span class="v-date">2026.10.21</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        针对「AI 默认模板」风险的视觉体系整体重构：彻底摆脱蓝紫渐变、玻璃拟态圆角卡、径向光晕与 hover 上浮的模板三件套，确立<b>「蓝图编辑风（Blueprint Editorial）」</b>设计语言——暖纸底面 + 淡蓝图网格（工程图纸感）、墨色正文 + 衬线大标题 + 等宽字体标注（编辑排版三件套）、全直角 + 发丝线分隔 + 零投影（层次靠线条而非阴影）、单一朱红强调色（红笔批注 / 印章，全局占比 ≤5%）。功能 DOM / ID / class 全保留，视觉断言随新体系同步重写。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>蓝图编辑风设计系统</b>：<code>theme.css</code> 全量重写——纸 / 墨 / 线 / 朱红四组令牌、暗色主题同构、衬线 + 等宽 + 无衬线三字体栈；<code>body</code> 四层蓝图网格（36px 细线 + 180px 主线，fixed 附着不随滚动）</li>
          <li><b>签名装置</b>：眉标（编号 + 等宽标签 + 通栏发丝线）、取景器角标（左上 + 右下朱红 L 括线，非对称）、斜置双线印章、能力走马灯（无缝循环）、规格表面板（点线引导键值行）</li>
          <li><b>Hero 非对称重构</b>：1.4fr / 0.6fr 双栏——左栏衬线大标题 + 真实指标行（真实后端 / 5 Agent / 880 / 37 页），右栏 <code>RUNTIME SPEC</code> 规格表面板（GLM-4-Flash / 5 席 / 880 + 17 / Live 印章）；等宽窗栏替代 mac 圆点</li>
          <li><b>changelog 与技术文档同风格重塑</b>：更新日志页、技术文档从 indigo 蓝紫系切换为纸墨 + 朱红，文档式结构不变</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>扁平化 33 处渐变</b>：渐变按钮 / Hero 渐变文字 / CTA 通栏 / VIP 深金卡 / 骨架屏等全部改为平色或墨板反白；28 处 <code>backdrop-filter</code> 玻璃拟态三层清零</li>
          <li><b>去圆角 / 投影 / 上浮</b>：250+ 圆角与 107 处阴影全局归零（保留 50% 圆形头像），hover 语言从 <code>translateY</code> 上浮改为描边变化</li>
          <li><b>图标系统去 emoji</b>：9 个特性卡 emoji → 等宽编号 <code>01</code>–<code>09</code>，徽章改方形等宽，主题色 tooltip「紫」→「朱红」</li>
          <li><b>测试基线 879 → 880</b>：v17 视觉断言随设计语言换代重写（57 → 58 项），11 套 jsdom 全绿；<code>split-frontend.js</code> / <code>build-manifest.json</code> 分区定位针同步更新，round-trip 保持可逐字节重建</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">880</div><div class="m-label">前端断言全绿</div></div>
          <div class="metric"><div class="m-val">17</div><div class="m-label">后端测试通过</div></div>
          <div class="metric"><div class="m-val">33</div><div class="m-label">渐变扁平化</div></div>
          <div class="metric"><div class="m-val">28</div><div class="m-label">玻璃拟态清除</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.0.2 · 真实模型上线 · 检索重排与评分校准
       ======================================================== -->
  <div class="version vbeta1-2" id="vbeta1-2">
    <div class="version-head">
      <span class="v-tag">Beta 1.0.2</span>
      <span class="v-title">真实模型上线 · 检索重排与评分校准</span>
      <span class="v-date">2026.10.21</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        智谱 GLM（glm-4-flash）Key 配置上线——服务端环境变量注入后重新发布，<b>聊天、模拟面试提问、RAG 问答全部从 Mock 切换为真实流式</b>，线上 <code>/api/health</code> 返回 <code>llm_ready:true</code>，完整面试闭环（登录 → 建会话 → LLM 提问 → 同步 → 服务端评分报告）实测通过；Key 只存服务端 <code>.env</code>，前端零接触。同期完成两项算法升级：<b>RAG 检索新增五特征重排阶段</b>（混合召回复用后的精排，引用展示三阶段得分）；<b>评分引擎修复双引擎舍入分歧</b>（Python 银行家舍入 vs JS 半价向上，对拍从 3/5 到 5/5 一致）。技术文档新增第 7 章「核心算法详解与原创性论证」，把多 Agent 调度、RAG 混合检索与重排、评分引擎设计与校准展开到算法级。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>真实 LLM 流式上线</b>：<code>backend/.env</code> 配置智谱 Key（glm-4-flash，Base URL 为智谱开放平台 v4），重新发布后聊天 / 面试提问 / RAG 问答全部走真实模型；线上实测完整面试闭环：登录 → 建会话 → 面试官 Agent 真实提问 → 同步问答 → 服务端评分报告（总分 78，量化回答被内容深度维度正确识别）</li>
          <li><b>RAG 五特征重排</b>：混合检索召回的 Top-8 候选，按标题覆盖 / 标签覆盖 / 短语命中 / 类型先验 / 长度先验五个可解释特征精排（<code>final = 0.55 × 融合归一分 + 0.45 × 特征分</code>）；实测「MySQL 索引」查询中后端 JD 条目从召回第 2 名被重排到第 3 名（标题零命中）</li>
          <li><b>RAG 页三阶段得分展示</b>：每条引用展示 <code>bm25 · cos · 融合 · 重排</code> 四段得分，检索过程完全透明可当场核对</li>
          <li><b>服务端同策略检索</b>：<code>lib/ai/rag.ts</code> 从纯关键词升级为 BM25 + hashing 向量 + 加权融合 + 五特征重排（与端侧演示页同一套策略，服务端形态零依赖）</li>
          <li><b>评分校准套件</b>：<code>calibration-cases.json</code>（5 个答题质量递进的标准样本）+ <code>calibrate_scoring.py</code> / <code>calibrate-scoring.js</code> 双引擎对拍脚本 + 11 条校准不变量断言（单调性 / 维度分离 / 确定性 / 边界 / 舍入规则）</li>
          <li><b>技术文档第 7 章「核心算法详解与原创性论证」</b>：多 Agent 两层调度算法（模式层轮转 + 内容层派发 + 连环追问状态机 + SSE 事件协议）、RAG 六阶段管线与重排实证、评分引擎设计动机与四步校准过程（含一次真实缺陷修复）、与「AI 默认模板」作品的逐条差异论证</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>修复评分引擎双引擎舍入分歧</b>：双引擎对拍首跑发现 C1/C5 样本「内容深度」差 1 分——根因是 Python 内置 <code>round()</code> 为银行家舍入（90.5 → 90）而 JS <code>Math.round</code> 为半价向上（90.5 → 91），评分真值恰好落在 .5 边界；服务端改用 <code>floor(v + 0.5)</code> 后对拍 5/5 完全一致。该缺陷靠肉眼读代码无法发现，是对拍方法论的价值证明</li>
          <li><b>检索层文档同步</b>：技术文档 4.3 节「三层架构」更新为「六阶段架构」并补重排行；4.2 / 4.3 / 4.7 增加第 7 章算法级细节指引</li>
          <li><b>测试扩充</b>：vitest RAG 测试 4 → 11 项（新增 7 项重排契约）；端侧向量检索套件 91 → 99 断言（新增重排专项）；后端 pytest 6 → 17 项（新增校准套件）</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">1</div><div class="m-label">真实模型通道上线</div></div>
          <div class="metric"><div class="m-val">5</div><div class="m-label">重排特征</div></div>
          <div class="metric"><div class="m-val">5/5</div><div class="m-label">双引擎对拍一致</div></div>
          <div class="metric"><div class="m-val">879</div><div class="m-label">前端断言全绿</div></div>
          <div class="metric"><div class="m-val">17</div><div class="m-label">后端测试通过</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.0.1 · 后端上线（部署补丁）
       ======================================================== -->
  <div class="version vbeta1-1" id="vbeta1-1">
    <div class="version-head">
      <span class="v-tag">Beta 1.0.1</span>
      <span class="v-title">后端上线 · 全渠道接通真实服务</span>
      <span class="v-date">2026.10.20</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        FastAPI 后端正式上线：国内镜像域名从纯静态托管切换为 <b>「演示页 + API 同源托管」</b>——同一个域名同时提供页面与 <code>/api/*</code> 接口，彻底免除跨域配置；GitHub Pages 演示页则在构建时注入后端地址（跨域访问，CORS 已默认放行）。两个在线入口从「纯前端 Mock」升级为 <b>真实后端模式</b>：JWT 登录、面试会话持久化、服务端评分报告全部真实可用；未配置模型 Key 时聊天自动回退 Mock，演示不中断。本版本为 Beta 1.0 的部署补丁，功能集与版本号展示不变。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>后端同源托管</b>：<code>backend/static/</code>（演示页 + 技术文档 + 更新日志 + 41MB 端侧模型）由 FastAPI 挂载到站点根路径，镜像站一个域名同时提供页面与 API</li>
          <li><b>演示账号自动种子</b>：后端启动时自动创建 <code>demo@futuremirror.app</code>（VIP），全新数据库开箱即可一键登录，无需预注册</li>
          <li><b>Pages 跨域接通</b>：<code>FM_API_BASE=&lt;后端地址&gt; node scripts/deploy-pages.js --build</code> 构建时把后端地址写入演示页，CORS 默认放行两个演示域名</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>构建脚本升级</b>：<code>build-demo.js</code> 支持 <code>--out</code> 输出路径与环境变量 <code>FM_API_BASE</code>（完整 URL 或 <code>same-origin</code>）；新增 <code>build-backend-static.js</code> 组装同源托管目录</li>
          <li><b>健康检查超时 4s → 8s</b>：跨境网络下更稳，避免把慢启动误判成「未部署」</li>
          <li><b>CORS 默认放开演示域名</b>：<code>backend/app/main.py</code> 默认来源包含 GitHub Pages 与国内镜像，部署零配置</li>
          <li><b>静态挂载条件化</b>：仅当 <code>backend/static/</code> 存在时挂载（本地开发保持纯 API 形态），产物目录已加入 .gitignore</li>
          <li><b>修复游客横幅不隐藏</b>：<code>.guest-banner</code> 的 <code>display:flex</code> 覆盖了 <code>hidden</code> 属性，登录后「游客模式」提示仍旧显示；补全局 <code>[hidden] { display:none !important }</code>（同类隐患 .review-input-row 一并覆盖）</li>
          <li><b>修复公网鉴权头被网关覆盖</b>：托管平台边缘网关会用自己的 JWT 覆盖请求的 <code>Authorization</code> 头，导致线上登录后面试会话/报告等全部鉴权接口 401；令牌主通道改用自定义头 <code>X-Auth-Token</code>（网关原样透传），<code>Authorization</code> 保留作本地开发回退；线上实测登录→建会话→拉列表全链路真实可用</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">2</div><div class="m-label">在线入口接通</div></div>
          <div class="metric"><div class="m-val">870</div><div class="m-label">前端断言全绿</div></div>
          <div class="metric"><div class="m-val">6</div><div class="m-label">后端测试通过</div></div>
          <div class="metric"><div class="m-val">42MB</div><div class="m-label">同源托管产物</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v22 · 后端适配与工程化
       ======================================================== -->
  <div class="version v22" id="v22">
    <div class="version-head">
      <span class="v-tag">v22</span>
      <span class="v-title">后端适配与工程化</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        FastAPI 后端落地——SQLite 数据模型 + scrypt 密码哈希 + JWT 鉴权、GLM SSE 流式代理（<b>Key 只存服务端环境变量</b>）、评分引擎 Python 同构移植、面试会话与报告落库；演示版改造为"后端优先 + 三级降级"（<code>fmApi</code> 适配层：健康检查 30s 缓存 / SSE 分片解析 / 登录注册走后端 / 报告服务端生成 + 本地兜底）；单文件版按版本横幅机械拆分为 <code>frontend/</code> 27 模块 + 3 CSS 层，<code>build-demo.js</code> 可逐字节重建。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>FastAPI 后端</b>：<code>backend/</code> 目录，含 <code>db.py</code> / <code>llm.py</code> / <code>scoring.py</code> / <code>main.py</code>，附 <code>.env.example</code> 与 pytest 冒烟 + 评分引擎单测（6 项）</li>
          <li><b>鉴权体系</b>：JWT（HS256，12h TTL）+ scrypt 密码哈希；<code>demo@futuremirror.app</code> 注册即自动 VIP</li>
          <li><b>SQLite 持久化</b>：<code>users</code> / <code>interviews</code> / <code>turns</code> / <code>reports</code> 四张表；<code>/sync</code> 按 <code>seq</code> 幂等去重</li>
          <li><b>SSE 流式代理</b>：<code>/api/chat/stream</code> 通过 <code>httpx</code> 流式转发到 GLM 的 OpenAI 兼容端点，Key 不出后端</li>
          <li><b>前端 <code>fmApi</code> 适配层</b>：健康检查 30s 缓存 / SSE 分片解析 / 登录注册走后端 / 报告服务端生成 + 本地兜底</li>
          <li><b>三级降级</b>：后端真实 → 浏览器直连 Key → 本地 Mock；后端 5xx / 超时同样回退，演示不中断</li>
          <li><b>报告页徽章</b>：「服务端评分引擎 · 已落库」/「启发式引擎演示」两态自动切换</li>
          <li><b>单文件版拆分</b>：<code>scripts/split-frontend.js</code> 按版本横幅机械拆出 <code>frontend/</code> 27 模块；<code>scripts/build-demo.js</code> 反向合并（除 hashchange 监听归位外逐字节一致）</li>
          <li><b>契约核对（v22.1）</b>：批量 <code>/sync</code> 与 body 版 <code>/report</code> 前后端一致，<code>match_score / code_score / match_gaps</code> 全程参与服务端评分</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>登录 / 注册优先走后端</b>：后端在线时走 scrypt + JWT；不可达时回退本地演示账号，功能一致</li>
          <li><b>报告页同会话只同步一次</b>：签名 <code>interviewId:轮数:匹配分:代码分</code> 命中即跳过，切页不重复请求</li>
          <li><b>直连 Key 模式保留</b>：后端离线时的逃生通道，Key 仅存 sessionStorage，关闭即清除</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-fix">🐛 缺陷修复（v22.1）</span>
        <ul class="changelog">
          <li><b>「后端登录后刷新掉线」</b>：后端用户写入本地用户表供 <code>restoreUser</code> 找回；<b>不落 passHash</b>，后端在线时登录永远走后端校验</li>
          <li><b>「RAG / 简历改写 / AI 小助手退化为关键词检索」</b>：后端在线时同样走模型（Key 在服务端），不再误判为无 Key 状态</li>
          <li><b>「再来一次」不重置 interviewId</b>：导致新一轮问答被 <code>/sync</code> 判重为"已入库"，报告读到上一轮旧数据；现重置 <code>session.interviewId</code></li>
          <li><b>「秒点登录误走本地分支」</b>：后端探测无结论时先等待探测（<code>await fmApi.checkHealth()</code>），避免竞态</li>
          <li><b>「<code>llmLabel()</code> 在 llm 为空时报 TypeError」</b>：返回「Mock 模式」而非抛异常</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">6</div><div class="m-label">后端 pytest</div></div>
          <div class="metric"><div class="m-val">3</div><div class="m-label">降级层级</div></div>
          <div class="metric"><div class="m-val">27</div><div class="m-label">前端模块</div></div>
          <div class="metric"><div class="m-val">4</div><div class="m-label">数据库表</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v21 · 悬浮球拖拽冻结 + 移动端美化
       ======================================================== -->
  <div class="version v21" id="v21">
    <div class="version-head">
      <span class="v-tag">v21</span>
      <span class="v-title">悬浮球拖拽冻结 + 移动端美化</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        AI 悬浮球从"固定右下角"升级为"可拖动并贴边冻结"——位置按账号持久化，边界钳制不越界，误触抑制不误开抽屉；移动端做一轮系统性的体验优化：大圆角卡片、触控 ≥42px、输入框 16px 防 iOS 缩放、底部弹层把手与安全区适配。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>悬浮球拖拽</b>：pointer 事件接管拖动（<code>touch-action: none</code>），位移阈值 6px 抑制误触；拖动中按实时位置判定贴边</li>
          <li><b>贴边冻结</b>：松开后以 style 实时位置判定 left / right，贴边留白 16px；<code>pos = { side, y }</code> 持久化到 <code>fm_ai_fab</code></li>
          <li><b>左侧镜像抽屉</b>：冻结在左侧时抽屉从左侧滑出（<code>body.ai-fab-left</code>），符合视线与操作习惯</li>
          <li><b>首次进入提示光环</b>：<code>.ai-fab.hint::after</code> 脉冲 2 次，提示"可拖动"</li>
          <li><b>视口变化重新钳制</b>：resize 时 120ms 防抖重算位置，避免越界</li>
          <li><b>抽屉打开时收起悬浮球</b>：<code>body.ai-open .ai-fab</code> 淡出缩放，不遮挡对话</li>
          <li><b>移动端页面美化</b>：卡片 18px 大圆角 + 柔和投影、按钮 ≥42px、<code>input</code> 16px 防自动放大、底部弹层把手、<code>env(safe-area-inset-bottom)</code> 适配</li>
          <li><b>触控反馈</b>：tabbar / quick-entry / quiz-opt 等 <code>:active</code> 缩放 0.94–0.99</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>顶部导航栏采用 momentum 滚动 + 轻投影</li>
          <li>Toast 贴边留白（<code>bottom: calc(20px + env(safe-area-inset-bottom))</code>）</li>
          <li>移动端 AI 悬浮球默认位置避开顶部导航栏与底部安全区</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">6px</div><div class="m-label">拖动阈值</div></div>
          <div class="metric"><div class="m-val">16px</div><div class="m-label">贴边留白</div></div>
          <div class="metric"><div class="m-val">42px</div><div class="m-label">触控最小高度</div></div>
          <div class="metric"><div class="m-val">100%</div><div class="m-label">位置按账号记忆</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v20 · 题库增强 + AI 小助手
       ======================================================== -->
  <div class="version v20" id="v20">
    <div class="version-head">
      <span class="v-tag">v20</span>
      <span class="v-title">题库增强 + AI 小助手 + 移动端导航顶部化</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        把题库从"做一轮小测"升级为"持续刷题训练"：错题本、收藏夹、题目搜索、三种练习模式、每日一练、学习数据看板；同时用 AI 小助手把分散的功能入口收拢成对话式引导，并把移动端导航从底部 Tab 移到顶部，解决底部栏与 iOS 手势区冲突的问题。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>错题本（VIP）</b>：自动收录答错与超时的题目，支持按分类筛选、重复练习、移除已掌握；持久化到 <code>fm_wrong</code></li>
          <li><b>收藏夹</b>：每道题增加星标按钮，收藏状态持久化到 <code>fm_fav</code>，支持单独练习收藏夹；三处状态同步</li>
          <li><b>题目搜索</b>：按题目文本 / 选项文本 / 分类名称关键词匹配，返回匹配列表并支持直接跳转练习</li>
          <li><b>顺序练习 / 章节练习</b>：在原有"随机抽 5 题限时小测"之外，新增不限时的顺序模式与章节模式，<code>quizState.mode</code> 扩展为 <code>exam</code> / <code>practice</code> / <code>chapter</code></li>
          <li><b>每日一练 + 连续打卡</b>：每天从题库随机抽 3 题，完成即算打卡，记录连续打卡天数；持久化到 <code>fm_daily</code></li>
          <li><b>学习数据看板增强</b>：在"成绩档案"基础上新增正确率趋势、各分类掌握度、累计刷题数</li>
          <li><b>AI 小助手</b>：桌面端右下角圆形悬浮球，移动端固定顶部导航下方；点击展开抽屉式对话面板，支持预设意图跳转、RAG 检索、流式回答、Mock 兜底</li>
          <li><b>移动端导航顶部化</b>：<code>.app-tabbar</code> 从 <code>bottom: 0</code> 改为 <code>top: 58px</code>，紧贴顶栏下方，横向滚动不遮挡内容</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>刷题模式选择条</b>：小测页新增 <code>.quiz-mode-bar</code> 三态切换（限时模考 / 顺序练习 / 章节练习）</li>
          <li><b>学习面板搜索</b>：<code>.quiz-search-box</code> + 命中列表，一键练习命中题目</li>
          <li><b>入口卡</b>：收藏夹 / 错题本作为学习面板顶部的双卡片入口</li>
          <li><b>主内容区适配</b>：<code>.app-main</code> 顶部 padding 增加到"顶栏 58px + 导航栏约 44px"，底部不再需要为 Tab 栏留空间</li>
          <li><b>AI 悬浮球避开顶部导航</b>：移动端 <code>.ai-fab</code> 的 <code>top: 112px</code></li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">+4</div><div class="m-label">刷题模块</div></div>
          <div class="metric"><div class="m-val">+1</div><div class="m-label">AI 小助手</div></div>
          <div class="metric"><div class="m-val">5</div><div class="m-label">移动端核心入口</div></div>
          <div class="metric"><div class="m-val">3</div><div class="m-label">刷题模式</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v19 · 已发布
       ======================================================== -->
  <div class="version v19" id="v19">
    <div class="version-head">
      <span class="v-tag">v19</span>
      <span class="v-title">题库小测模块 + VIP 会员体系</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        把"刷题"从模拟面试的附属功能升级为独立模块。新增 5 个知识分类共 24 道选择题，支持"知识点学习 + 限时小测 + 成绩档案"三态切换；同时引入 VIP 会员体系，把 VIP 专属分类、无限次小测、成绩档案归档与免费用户区分开，形成可持续的商业化钩子。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>题库页（quiz）</b>：新增第 10 个功能页，含 3 个子页签（知识点学习 / 限时小测 / 成绩档案）</li>
          <li><b>5 个知识分类</b>：SQL 数据库（6 题，免费）/ 计算机网络（6 题，免费）/ 操作系统（4 题，VIP）/ 算法与数据结构（4 题，VIP）/ STAR 行为面（4 题，VIP），共 <b>24 题</b></li>
          <li><b>学习模式</b>：每题 4 个选项 + 正确答案标记 + 详细解析，先建立知识框架再做题</li>
          <li><b>限时小测</b>：每轮 5 题，每题 60 秒倒计时，答错或超时立即展示解析，自动判分</li>
          <li><b>成绩档案</b>：累计次数 / 平均分 / 最高分 / 累计答对 / 历史记录列表，持久化到 <code>fm_quiz</code></li>
          <li><b>VIP 会员体系</b>：demo@futuremirror.app 登录自动获得 VIP；顶栏新增 VIP 徽章；个人中心新增 VIP 权益卡；侧栏新增 VIP 徽章</li>
          <li><b>免费 / VIP 分级</b>：免费用户每日 1 次小测、解锁 2 个分类；VIP 用户不限次数、解锁全部 5 个分类</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>工程自检扩展到 9 项</b>：新增"题库结构完整性""VIP 判定逻辑""题库计分正确性"三项内联断言</li>
          <li><b>底部 Tab 扩到 9 格</b>：新增题库入口，移动端底部栏承载 9 个功能入口</li>
          <li><b>侧栏新增题库入口</b>：桌面端左侧栏"训练与评估"分组下新增「📝 题库小测」</li>
          <li><b>报告封面加入 VIP 徽章</b>：VIP 用户的评估报告封面显示「👑 VIP 会员」</li>
          <li><b>顶栏状态胶囊联动</b>：VIP 徽章与用户登录态、Mock/真实模式并列展示</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">5</div><div class="m-label">题库分类</div></div>
          <div class="metric"><div class="m-val">24</div><div class="m-label">题库题目</div></div>
          <div class="metric"><div class="m-val">3</div><div class="m-label">VIP 分类</div></div>
          <div class="metric"><div class="m-val">9</div><div class="m-label">自检断言</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v18 · 已发布
       ======================================================== -->
  <div class="version v18" id="v18">
    <div class="version-head">
      <span class="v-tag">v18</span>
      <span class="v-title">产品闭环深化 · 求职管理 + 面试真实感</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        补齐从"训练"到"实战"的最后一环：新增求职管理页（投递看板 + 面试复盘），让模拟面试的表现数据与真实面试的复盘结论形成对流；同时通过答题计时器、连环追问、HR 与压力面专属题库，把面试的真实感从"概念"落到可感知的交互。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>求职管理页（jobs）</b>：新增第 9 个功能页，含 2 个子页签</li>
          <li><b>投递看板</b>：5 阶段（已投递 / 笔试中 / 面试中 / 已拿 Offer / 已拒绝），支持上下移动与删除，实时统计总投递 / 进行中 / Offer / 转化率</li>
          <li><b>面试复盘</b>：6 轮对话补全（公司 / 轮次 / 最难问题 / 当时回答+自评 / 结果 / 改进点），自动生成可回查的复盘结论，持久化到 <code>fm_reviews</code></li>
          <li><b>答题计时器</b>：每题 90 秒倒计时，≤15 秒警示，超时自动写入「抗压表现」维度证据</li>
          <li><b>连环追问机制</b>：识别技术关键词后，35% 概率触发连续 2 轮深挖同一点，呈现"Agent 决策"而非固定轮转</li>
          <li><b>HR / 压力面专属题库</b>：HR 面试官使用动机 / 稳定性专属题库，压力面试官引入"打断-否定-要求举证"三段式话术</li>
          <li><b>语音输入实时反馈</b>：纯本地规则计算语速与填充词密度，零网络请求</li>
          <li><b>句子级改写建议</b>：规则引擎自动识别无量化动词句，按维度给出改写模板，无需 LLM</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>玻璃拟态可读性修正</b>：亮色下更明确的玻璃边界 + 更深层级阴影；暗色辅助文字 <code>--faint</code> 提升到 <code>#8A90B8</code>，满足 WCAG AA</li>
          <li><b>Bento Grid</b>：快速入口的核心卡片（简历匹配 / 模拟面试）跨列放大，形成视觉优先级</li>
          <li><b>底部 Tab 扩到 8 格</b>：新增「📋 求职」入口</li>
          <li><b>报告页新增复盘入口卡</b>：从报告可直接跳转到面试复盘</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">5</div><div class="m-label">投递阶段</div></div>
          <div class="metric"><div class="m-val">6</div><div class="m-label">复盘对话轮次</div></div>
          <div class="metric"><div class="m-val">90s</div><div class="m-label">答题时限</div></div>
          <div class="metric"><div class="m-val">35%</div><div class="m-label">连环追问概率</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v17 · 已发布
       ======================================================== -->
  <div class="version v17" id="v17">
    <div class="version-head">
      <span class="v-tag">v17</span>
      <span class="v-title">深海蓝 AI Native 视觉重构</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        从"高信息密度工具风"转向"AI Native 产品的设计语言"：深海蓝 + 电光蓝的品牌基调、玻璃拟态卡片、衬线标题与无衬线正文的对比、滚动渐入的入场节奏。视觉上从"工具感"提升到"产品感"，同时保留所有功能不变。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>深海蓝主题</b>：暖白背景 <code>#FAFBFF</code> + 深海军蓝文字 <code>#10163A</code> + 电光蓝品牌色 <code>#2E3FE8</code></li>
          <li><b>午夜蓝暗色模式</b>：<code>#070B1F</code> 基底 + 奶油白文字 <code>#F0EEE9</code>，替代原刺眼纯白</li>
          <li><b>玻璃拟态</b>：卡片、顶栏、侧栏使用 <code>backdrop-filter: blur(16px)</code> + 半透明背景 + 玻璃边框 + 内高光</li>
          <li><b>衬线标题</b>：h1 / h2 使用 Georgia / Songti SC 衬线字体，与无衬线正文形成对比</li>
          <li><b>滚动渐入</b>：<code>IntersectionObserver</code> + <code>transitionend</code> 清理，避免与 hover 的 transform 冲突</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>顶栏从纯色改为玻璃效果（<code>saturate(180%) blur(18px)</code>）</li>
          <li>主按钮从纯色改为品牌色渐变 + 微光阴影</li>
          <li>卡片 hover 从 <code>translateY(-3px)</code> 改为带缓动曲线的上浮</li>
          <li>登录页左右分栏的品牌色渐变重绘</li>
          <li>落地页 Hero 区域使用网格背景 + 多层径向渐变</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">2</div><div class="m-label">主题（亮/暗）</div></div>
          <div class="metric"><div class="m-val">3</div><div class="m-label">品牌色变体</div></div>
          <div class="metric"><div class="m-val">16px</div><div class="m-label">玻璃模糊半径</div></div>
          <div class="metric"><div class="m-val">0</div><div class="m-label">功能变更</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v16 · 已发布
       ======================================================== -->
  <div class="version v16" id="v16">
    <div class="version-head">
      <span class="v-tag">v16</span>
      <span class="v-title">个人中心 · 头像系统 · 偏好与数据管理</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        首次引入"用户画像"概念：个人中心不只是头像和昵称，而是把求职信息、技能标签、偏好设置与数据管理集中在一个页面，让简历匹配、职业探索、模拟面试、评估报告都能读取同一份用户档案，形成"资料越完整、推荐越准确"的正向循环。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>个人中心页（profile）</b>：新增第 8 个功能页</li>
          <li><b>三态头像</b>：上传图片（自动压缩为 128px）/ 18 种 emoji / 姓名首字母（自动生成渐变底色）</li>
          <li><b>求职信息表单</b>：姓名 / 城市 / 目标岗位 / 学历 / 年限 / 状态 / 简介 / 技能标签（最多 8 个）</li>
          <li><b>资料完成度</b>：7 项检查加权 100 分，顶部进度条实时反映</li>
          <li><b>偏好设置</b>：暗色模式 / 语音输入 / 面试官自动朗读 / 每周学习提醒</li>
          <li><b>数据管理</b>：本地存储占用条 / 导出个人数据 JSON / 清除全部数据</li>
          <li><b>报告封面</b>：头像 + 姓名 + 目标岗位 + 日期 + 编号（<code>FM-UID-YYYYMMDD</code>）</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>用户下拉菜单新增「👤 个人中心」入口</li>
          <li>头像在顶栏、下拉菜单、个人中心、报告封面四处同步</li>
          <li>所有个人资料持久化到 <code>fm_profile</code>，按用户 ID 前缀隔离</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">3</div><div class="m-label">头像形态</div></div>
          <div class="metric"><div class="m-val">7</div><div class="m-label">完成度检查项</div></div>
          <div class="metric"><div class="m-val">8</div><div class="m-label">技能标签上限</div></div>
          <div class="metric"><div class="m-val">4</div><div class="m-label">偏好开关</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v15-beta · 已发布
       ======================================================== -->
  <div class="version v15" id="v15">
    <div class="version-head">
      <span class="v-tag v-tag-beta">v15 · Beta</span>
      <span class="v-title">工作台精简与互动升级</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        Beta 版本收尾。工作台从"半成品拼接"升级为"干净的产品首页"：项目材料收进开发者模式，只服务评委；6 张快速入口卡片和 4 张数据看板卡全部可点击；新增"今日推荐岗位"制造每次打开的新鲜感。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>今日推荐岗位</b>：从 24 个岗位中随机抽取 4 个，点击直达模拟面试，支持"🔄 换一批"</li>
          <li><b>快速入口升级为 6 张互动卡片</b>：hover 时渐变光晕 + 图标放大旋转 + 箭头滑入 + 描述展开</li>
          <li><b>数据看板可点击跳转</b>：4 张 stat-card 全部绑定对应功能页，hover 显示 → 箭头</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>工作台去材料化</b>：删除 dashboard 里的"项目材料"区块（4 个跳转按钮），仅开发者模式可见</li>
          <li><b>Hero 区域放大</b>：h1 从 46px 提升到 48px，padding 从 48px 提升到 56px，视觉更大气</li>
          <li><b>Agent 圆桌可点击</b>：HR / 技术 / 压力面 / 教练 4 个 Agent 点击跳转对应页面</li>
          <li><b>首访引导增强</b>：新增右上角光晕装饰 + 层级调整</li>
          <li><b>MCP 提示行美化</b>：从纯文本提示升级为虚线框提示卡</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">6</div><div class="m-label">快速入口</div></div>
          <div class="metric"><div class="m-val">4</div><div class="m-label">今日推荐</div></div>
          <div class="metric"><div class="m-val">100%</div><div class="m-label">卡片可点击</div></div>
          <div class="metric"><div class="m-val">0</div><div class="m-label">材料暴露</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v14
       ======================================================== -->
  <div class="version v14" id="v14">
    <div class="version-head">
      <span class="v-tag">v14</span>
      <span class="v-title">开发者模式升级</span>
      <span class="v-date">2026.10</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        把"评审专区"正式升级为"开发者模式"。新增运行环境检测、性能指标、诊断日志、5 个开发者工具，让评委可以一站式验证技术能力，不再只是"看图"。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>运行环境检测</b>：自动识别浏览器 / OS / 语言 / 网络 / 屏幕 / 视口 / DPR / CPU 核心 / 设备内存</li>
          <li><b>技术能力矩阵</b>：9 项能力检测（WebGL / WebGPU / Web Speech ASR / TTS / Worker / IndexedDB / Clipboard / Web Share / File API）</li>
          <li><b>性能指标面板</b>：页面加载耗时 / DOM 节点数 / JS 堆内存 / 知识库条目 / 岗位数 / MCP 工具数</li>
          <li><b>诊断日志终端</b>：终端风格，记录最近 100 条关键操作事件（时间 + 类型 + 消息）</li>
          <li><b>5 个开发者工具</b>：导出诊断 JSON / 复制测试账号 / 切换 LLM 模式 / 重置引导 / 清空本地数据</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>"评审专区"全站改名为"开发者模式"</li>
          <li>顶栏"代码仓库"按钮替换为「🎛 开发者模式」</li>
          <li>落地页底部入口同步改名为「🎛 开发者模式」</li>
          <li>密码弹窗文案全面更新</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">9</div><div class="m-label">环境检测项</div></div>
          <div class="metric"><div class="m-val">6</div><div class="m-label">性能指标</div></div>
          <div class="metric"><div class="m-val">5</div><div class="m-label">开发者工具</div></div>
          <div class="metric"><div class="m-val">100</div><div class="m-label">日志上限</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v13
       ======================================================== -->
  <div class="version v13" id="v13">
    <div class="version-head">
      <span class="v-tag">v13</span>
      <span class="v-title">评审专区（加密 + 一键进入）</span>
      <span class="v-date">2026.09</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        新增加密的"评审专区"，把技术验证内容（工程自检、MCP 运行时验证、技术架构、评分映射）从普通用户视野中隔离。提供三种进入方式：URL 一键、密码 <code>FM2026</code>、快捷键 <code>Ctrl+Shift+J</code>。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>评审专区视图</b>：<code>#/evaluator?key=FM2026</code> 独立视图</li>
          <li><b>交付材料清单</b>：5 个材料（仓库 / 视频 / 文档 / 在线演示 / 测试账号）状态与跳转</li>
          <li><b>工程自检面板</b>：5 项内联断言可视化运行</li>
          <li><b>MCP 运行时验证</b>：3 个工具的 tool_call → 执行 → JSON 返回完整链路</li>
          <li><b>评分维度映射表</b>：6 大评分维度 → 具体实现 → 快速跳转</li>
          <li><b>已知边界清单</b>：6 条诚实声明</li>
          <li><b>密码 modal</b>：<code>FM2026</code> 解锁，<code>sessionStorage</code> 持久化</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>普通 dashboard 的"MCP 工具清单"增加提示行，指向评审专区</li>
          <li>落地页 CTA 区域下方新增"评审入口"按钮</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">5</div><div class="m-label">材料清单</div></div>
          <div class="metric"><div class="m-val">5</div><div class="m-label">自检断言</div></div>
          <div class="metric"><div class="m-val">3</div><div class="m-label">MCP 工具</div></div>
          <div class="metric"><div class="m-val">3</div><div class="m-label">进入方式</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v12
       ======================================================== -->
  <div class="version v12" id="v12">
    <div class="version-head">
      <span class="v-tag">v12</span>
      <span class="v-title">可验证运行时能力三件套</span>
      <span class="v-date">2026.09</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        目标是让"AI Native"从口号变成可现场验证的运行时代码。新增 MCP 实时控制台、代码面试沙盒、本地 PII 脱敏预览、工程自检面板——每一项都能被评委当场点击验证。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>MCP 实时控制台</b>：3 个工具（search_job_db / fetch_interview_experience / schedule_mock）注册 + 一键调用 + JSON 返回</li>
          <li><b>代码面试沙盒</b>：Worker 隔离 + 2s 超时熔断，twoSum 3 个用例，通过率入评估报告</li>
          <li><b>本地 PII 脱敏预览</b>：正则脱敏手机号 / 邮箱 / 身份证，0 网络请求，显示绿色徽章</li>
          <li><b>工程自检面板</b>：5 项断言（简历匹配 / RAG / 评分引擎 / MCP 注册 / 岗位库完整性）</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>评分引擎联动</b>：<code>session.codeScore</code> 并入评估报告"内容深度"维度（权重 20%）</li>
          <li><b>简历匹配页</b>：新增"本地脱敏预览"按钮 + "✓ 浏览器内完成 · 0 网络请求"徽章</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">3</div><div class="m-label">MCP 工具</div></div>
          <div class="metric"><div class="m-val">3</div><div class="m-label">代码用例</div></div>
          <div class="metric"><div class="m-val">5</div><div class="m-label">工程断言</div></div>
          <div class="metric"><div class="m-val">2s</div><div class="m-label">超时熔断</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v11
       ======================================================== -->
  <div class="version v11" id="v11">
    <div class="version-head">
      <span class="v-tag">v11</span>
      <span class="v-title">目标岗位下拉选择器</span>
      <span class="v-date">2026.09</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        把"复制粘贴 JD"的原始体验升级为"选岗位即得信息卡"。24 个岗位分组呈现，选择后自动带出描述 / 薪资 / 技能 / 加分项 / 学习路径，同时自动生成匹配报告。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>岗位下拉选择器</b>：5 个分组（技术 / 产品 / 设计 / 商业 / 新兴）共 24 个岗位</li>
          <li><b>岗位信息预览卡</b>：图标 + 薪资 + 描述 + 核心技能 + 加分项 + 5 步学习路径</li>
          <li><b>手动输入模式</b>：保留 textarea 作为备选，可随时切换</li>
          <li><b>岗位偏好持久化</b>：<code>fm_jd_id</code> 使用 localStorage，关闭标签页后仍记住</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><b>自动生成 JD 文本</b>：选择岗位后自动构造 JD 写入底层 textarea，<code>analyze()</code> 零改动</li>
          <li><b>自动生成匹配报告</b>：若简历已填，选择岗位后自动触发 <code>analyze()</code></li>
          <li><b>职业探索跳转联动</b>：<code>startInterviewFor()</code> 自动同步 <code>jd-select</code> 选中项</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-fix">🐛 缺陷修复</span>
        <ul class="changelog">
          <li><b>退出后旧 JD 复活</b>：<code>logout()</code> 未清理 <code>fm_jd</code> 存储，修复为在 <code>currentUser</code> 置空前清理</li>
          <li><b>手动 JD 被覆盖无提示</b>：切换岗位前增加 <code>confirm</code> 确认，避免误删</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">24</div><div class="m-label">岗位</div></div>
          <div class="metric"><div class="m-val">5</div><div class="m-label">分组</div></div>
          <div class="metric"><div class="m-val">5</div><div class="m-label">学习步骤</div></div>
          <div class="metric"><div class="m-val">4</div><div class="m-label">岗位字段</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v10
       ======================================================== -->
  <div class="version v10" id="v10">
    <div class="version-head">
      <span class="v-tag">v10</span>
      <span class="v-title">导航重构与数据扩充</span>
      <span class="v-date">2026.09</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        从"三段式导航"重构为"左侧栏 + 底部 Tab 双导航"，同时把岗位数据库从 8 个扩充到 24 个，面经知识库从 8 条扩充到 40 条，新增 3 套面试题库。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>左侧栏导航（桌面）</b>：240px 固定宽度，2 个分组 + 7 项 + 面试进度徽章</li>
          <li><b>底部 Tab 栏（移动端）</b>：6 项（工作台 / 面试 / 匹配 / 简历 / 职业 / 面经）</li>
          <li><b>顶栏状态胶囊</b>：游客 / Mock / 真实三态，替代原 7 元素顶栏</li>
          <li><b>面包屑导航</b>：每页顶部显示当前页面名</li>
          <li><b>24 个岗位数据库</b>：原 8 个 + 新增 16 个（运维 / 安全 / 大数据 / 嵌入式 / 区块链 / 产品运营 / 游戏策划 / 用户研究 / 视觉 / 内容 / 商业分析 / 增长 / 投资 / AIGC / AI 方案 / Prompt / MCP）</li>
          <li><b>40 条面经知识库</b>：原 8 条 + 新增 32 条（公司面经 8 + 八股 9 + 手撕 4 + 行为 4 + 行业 7）</li>
          <li><b>3 套面试题库</b>：general / tech / pressure 各 6 题</li>
          <li><b>首访引导卡</b>：localStorage 记忆，可关闭</li>
          <li><b>横幅可关闭</b>：sessionStorage 记忆</li>
          <li><b>快捷键帮助</b>：⌨️ 按钮显示 Ctrl+Enter / Ctrl+K / Esc</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>顶栏从 7 元素精简为 4 元素（状态胶囊 + 主题 + 主题色 + 用户菜单）</li>
          <li>删除"功能导航"下拉（与子导航冗余）</li>
          <li><code>modeLabelWithCount()</code> 显示题库数量</li>
          <li><code>pickQuestion()</code> 优先发未问过的题库原题</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-fix">🐛 缺陷修复</span>
        <ul class="changelog">
          <li><b><code>init()</code> 早于 <code>CAREER_DB</code> 定义触发 TDZ</b>：<code>bootApp()</code> 移至 <code>bootstrapV10</code> 末尾</li>
          <li><b>简历上传后数据丢失</b>：编程式赋值不触发 <code>input</code> 事件，手动 <code>store.set</code></li>
          <li><b>宽屏布局松散</b>：<code>.app-shell</code> 限宽 1320px</li>
          <li><b>移动端 Tab 缺入口</b>：从 5 项扩展为 6 项</li>
          <li><b>重复定义 <code>switchTab</code></b>：删除重复定义</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">24</div><div class="m-label">岗位</div></div>
          <div class="metric"><div class="m-val">40</div><div class="m-label">面经</div></div>
          <div class="metric"><div class="m-val">18</div><div class="m-label">题库</div></div>
          <div class="metric"><div class="m-val">7</div><div class="m-label">功能页</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v9
       ======================================================== -->
  <div class="version v9" id="v9">
    <div class="version-head">
      <span class="v-tag">v9</span>
      <span class="v-title">修复 HTML 结构 + 细节完善</span>
      <span class="v-date">2026.08</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        修复 v8 引入 hash 路由后出现的严重 HTML 结构错乱：所有非 dashboard 的 app-page 被嵌套在 dashboard 内部，导致切换到任何非工作台页面时显示空白。
      </div>

      <div class="cat">
        <span class="cat-title cat-fix">🐛 缺陷修复</span>
        <ul class="changelog">
          <li><b>app-page 嵌套错乱</b>：把 6 个非 dashboard 的 app-page 从 dashboard 中移出，做成平级兄弟元素</li>
          <li><b>打印样式遗漏</b>：补充 <code>.app-subnav</code> / <code>.nav-dropdown-wrap</code> / <code>.guest-banner</code> 打印隐藏</li>
          <li><b><code>applyTabIcons()</code> 空转</b>：注释掉调用（v8 移除 <code>.tabs</code> 后已失效）</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>dashboard 快速入口从 4 卡扩展为 6 卡（含简历匹配 / 面经问答）</li>
          <li>报告页未登录空状态增加登录引导</li>
          <li>子导航左右边缘渐隐（<code>mask-image</code>）</li>
          <li>切页滚动从 <code>smooth</code> 改为 <code>instant</code></li>
          <li><code>Esc</code> 键同步关闭"功能导航"下拉</li>
          <li>极窄屏功能导航按钮隐藏文字，只留图标</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v8
       ======================================================== -->
  <div class="version v8" id="v8">
    <div class="version-head">
      <span class="v-tag">v8</span>
      <span class="v-title">多页面路由 + 导航系统</span>
      <span class="v-date">2026.08</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        把"单页塞满所有功能"重构为"7 个独立页面的应用"。新增 hash 路由、顶部子导航栏、用户头像旁的"功能导航"下拉，刷新后保持当前页。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>hash 路由系统</b>：7 个页面 <code>#/dashboard</code> / <code>#/match</code> / <code>#/interview</code> / <code>#/rag</code> / <code>#/resume</code> / <code>#/career</code> / <code>#/report</code></li>
          <li><b>顶部子导航栏</b>：横向胶囊导航，激活态高亮</li>
          <li><b>功能导航下拉</b>：用户头像旁新增 <code>☰ 功能导航</code> 按钮</li>
          <li><b>多页面路由容器</b>：每个功能页独立 <code>.app-page</code> 容器</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li><code>switchTab()</code> 兼容旧 API，等价于 <code>navTo()</code></li>
          <li>子导航键盘左右切换（ArrowLeft / ArrowRight）</li>
          <li><code>document.title</code> 随路由更新</li>
          <li><code>meta description</code> 随路由更新</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">7</div><div class="m-label">页面路由</div></div>
          <div class="metric"><div class="m-val">2</div><div class="m-label">导航入口</div></div>
          <div class="metric"><div class="m-val">100%</div><div class="m-label">刷新保持</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v7
       ======================================================== -->
  <div class="version v7" id="v7">
    <div class="version-head">
      <span class="v-tag">v7</span>
      <span class="v-title">首页落地页 + 游客模式</span>
      <span class="v-date">2026.08</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        从"打开就是功能页"升级为"先看落地页，再决定是否进入"。未登录用户可完整体验产品叙事与视觉，触达 AI 功能时自然引导登录。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>首页落地页</b>：Hero + 产品预览 Mock + 功能网格 + 工作流 + 数据条 + CTA</li>
          <li><b>多视图路由</b>：landing / app / auth 三视图</li>
          <li><b>游客只读模式</b>：未登录可浏览 UI，AI 功能点击触发登录</li>
          <li><b>游客横幅</b>：未登录访问 app 时显示</li>
          <li><b><code>requireLogin()</code> 拦截</b>：7 个 AI 功能按钮全部拦截</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>落地页滚动进场动画（IntersectionObserver）</li>
          <li>特性卡片鼠标光晕跟随</li>
          <li>落地页数字滚动动画</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v6
       ======================================================== -->
  <div class="version v6" id="v6">
    <div class="version-head">
      <span class="v-tag">v6</span>
      <span class="v-title">真实模型修复 + 新板块 + UI 重构</span>
      <span class="v-date">2026.08</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        修复真实模型调用失败问题（CORS / Base URL / 超时 / 流式解析兼容），新增简历优化工作台与职业探索板块，参考高信息密度工具风格做 UI 重构。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>简历优化工作台</b>：6 维诊断（量化 / STAR / 动词 / 匹配 / 精炼 / 技能）+ 逐条改写建议 + LLM 深度改写</li>
          <li><b>职业探索板块</b>：专业 + 技能 + 兴趣 → Top 3 岗位推荐 + 技能对比 + 学习路径</li>
          <li><b>数据看板</b>：4 张 stat-card（协作 Agent / 评估维度 / 推荐岗位 / 简历维度）</li>
          <li><b>快速入口</b>：4 张卡片跳转核心功能</li>
          <li><b>主题色变体</b>：紫 / 绿 / 蓝三色切换</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-fix">🐛 缺陷修复</span>
        <ul class="changelog">
          <li><b>CORS 跨域失败</b>：详细错误提示 + 推荐智谱 / OpenRouter</li>
          <li><b>Base URL 路径拼接</b>：去除尾部斜杠</li>
          <li><b>30s 超时太短</b>：改为 60s</li>
          <li><b>流式解析兼容性</b>：兼容 <code>content</code> / <code>reasoning_content</code> / <code>text</code> 三种字段</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>UI 整体美化：高信息密度 + 卡片化</li>
          <li>Tab 图标胶囊化</li>
          <li>Hero 光晕增强</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v5
       ======================================================== -->
  <div class="version v5" id="v5">
    <div class="version-head">
      <span class="v-tag">v5</span>
      <span class="v-title">登录系统 + UI 全面升级</span>
      <span class="v-date">2026.08</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        从"单用户静态页"升级为"多用户应用"。新增登录 / 注册 / 一键演示账号，所有数据按用户前缀隔离，顶栏加入用户头像菜单。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>登录 / 注册页</b>：左右分栏布局，左侧品牌 + 特性，右侧表单</li>
          <li><b>一键演示账号</b>：<code>demo@futuremirror.app</code> / <code>Demo123456</code></li>
          <li><b>数据隔离</b>：<code>u_\${userId}_</code> 前缀，多用户切换不串数据</li>
          <li><b>用户菜单</b>：顶栏头像 + 下拉（演示账号 / 切换账号 / 退出登录）</li>
          <li><b>退出登录</b>：清理 sessionStorage，回到落地页</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>玻璃顶栏（<code>backdrop-filter: saturate(180%) blur(14px)</code>）</li>
          <li>Hero 光晕增强</li>
          <li>登录页左侧品牌渐变 + 圆形装饰</li>
          <li>卡片 hover 微动效</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">3</div><div class="m-label">登录方式</div></div>
          <div class="metric"><div class="m-val">100%</div><div class="m-label">数据隔离</div></div>
          <div class="metric"><div class="m-val">1</div><div class="m-label">演示账号</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v4
       ======================================================== -->
  <div class="version v4" id="v4">
    <div class="version-head">
      <span class="v-tag">v4</span>
      <span class="v-title">深度完善版</span>
      <span class="v-date">2026.08</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        针对评审标准中"AI 技术深度 35%"与"用户体验 10%"做细颗粒度补齐：实时能力追踪器、Prompt 查看器、进度指示器、报告分享导出、降级 UI、Agent 决策理由。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>实时能力追踪器</b>：面试过程中动态更新雷达图，显示进度 / 字数 / 量化 / 置信度</li>
          <li><b>Prompt 查看器</b>：查看当前面试模式的 System Prompt</li>
          <li><b>面试进度条</b>：5 轮进度可视化</li>
          <li><b>快捷键</b>：Ctrl+Enter 发送 / Ctrl+K 聚焦 / Esc 关闭</li>
          <li><b>报告分享</b>：复制 Markdown / 导出 PDF / 分享报告</li>
          <li><b>降级 UI</b>：真实模型失败时显示红色横幅</li>
          <li><b>Agent 决策理由</b>：规划 Agent 输出派发逻辑</li>
          <li><b>置信度</b>：观察员证据附带置信度百分比</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>面试官人设徽章：图标 + 温度可视化</li>
          <li>报告页加入"较上次"分数变化</li>
          <li>打印样式补全</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v3
       ======================================================== -->
  <div class="version v3" id="v3">
    <div class="version-head">
      <span class="v-tag">v3</span>
      <span class="v-title">深度完善 · 修复模型调用</span>
      <span class="v-date">2026.08</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        修复真实模型调用失败的阻塞性问题，新增简历优化与职业探索两大板块，为后续产品完整闭环打基础。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>简历优化工作台</b>：6 维诊断 + 逐条改写建议</li>
          <li><b>职业探索</b>：专业 + 技能 + 兴趣匹配 8 个岗位</li>
          <li><b>面试题库</b>：general / tech / pressure 各 6 题</li>
          <li><b>实时能力追踪器</b>：初版</li>
          <li><b>工程自检面板</b>：初版</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-fix">🐛 缺陷修复</span>
        <ul class="changelog">
          <li><b>真实模型调用失败</b>：修复 CORS / Base URL / 超时 / 流式解析兼容</li>
          <li><b>降级机制缺失</b>：三级降级（真实 → 降级流式 → Mock）</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v2
       ======================================================== -->
  <div class="version v2" id="v2">
    <div class="version-head">
      <span class="v-tag">v2</span>
      <span class="v-title">体验完善版</span>
      <span class="v-date">2026.08</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        补齐 v1 原型缺失的体验细节：暗色模式、语音输入、TTS、动态报告、历史曲线、MCP 清单、无障碍属性。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>暗色模式</b>：<code>data-theme="dark"</code>，<code>localStorage</code> 持久化</li>
          <li><b>语音输入</b>：Web Speech API（Chrome / Edge）</li>
          <li><b>TTS 朗读</b>：speechSynthesis 朗读面试官问题</li>
          <li><b>动态评估报告</b>：基于真实回答动态生成</li>
          <li><b>历史进步曲线</b>：localStorage 最近 8 次记录</li>
          <li><b>MCP 工具清单</b>：6 个工具的静态展示</li>
          <li><b>无障碍属性</b>：<code>aria-label</code> / <code>role</code> / <code>focus-visible</code></li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-improve">🔧 优化改进</span>
        <ul class="changelog">
          <li>评估报告从静态 Mock 升级为动态生成</li>
          <li>加载状态动画（骨架屏 / 打字机）</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ========================================================
       v1
       ======================================================== -->
  <div class="version v1" id="v1">
    <div class="version-head">
      <span class="v-tag">v1</span>
      <span class="v-title">初始原型</span>
      <span class="v-date">2026.08</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        面镜 FutureMirror 的起点。一个单文件静态 HTML 演示页，包含 4 个 Tab：简历匹配、模拟面试、RAG 面经问答、评估报告。确立了"多 Agent 模拟面试 + 可解释评分 + RAG 引用"的差异化定位。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>简历匹配</b>：粘贴简历 + JD，启发式匹配度计算</li>
          <li><b>模拟面试</b>：单 Agent 流式追问，3 种模式</li>
          <li><b>RAG 面经问答</b>：BM25 风格关键词检索 + 强制引用</li>
          <li><b>评估报告</b>：5 维雷达 + 评分证据 + 学习路径</li>
          <li><b>项目材料入口</b>：代码仓库 / 视频 / 文档 / 在线演示 / 测试账号</li>
        </ul>
      </div>

      <div class="cat">
        <span class="cat-title cat-data">📊 数据指标</span>
        <div class="metrics">
          <div class="metric"><div class="m-val">4</div><div class="m-label">功能 Tab</div></div>
          <div class="metric"><div class="m-val">8</div><div class="m-label">面经条目</div></div>
          <div class="metric"><div class="m-val">5</div><div class="m-label">评估维度</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ 页脚 ============ -->
  <div class="footer">
    <b>面镜 FutureMirror</b> · 版本更新日志 v1 → Beta 1.0.7 · v23 规划中<br>
    28 个已发布版本 · 从单文件原型到可验证的 AI Native 产品雏形<br>
    <span class="notice-line">本文档为团队内部版本记录，仅描述自研功能与数据，不引用、不转载任何第三方内容</span><br>
    © 2026 面镜 FutureMirror 团队 · 内部文档
  </div>

</div>
`;
