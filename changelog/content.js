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
    <b>阅读指引：</b>本日志按版本倒序排列。带 <span class="badge-pub">已发布</span> 标记的版本均已上线；带 <span class="badge-cur">当前版本</span> 标记的是 Beta 1.1.2，为当前正式发布版本（体验修复层：3 个主流程缺陷修复 + 学习计划板块 + 十字准线开关 + 36 枚自制图标；其后的 v36–v39 为<strong>同一版本的增量批次</strong>，覆盖求职闭环 / 可视化基建 / 求职材料与岗位闭环 / 反馈容错与无障碍，均不升版，详见下方对应版本块）；带 <span class="badge-plan">规划中</span> 标记的版本为下一步迭代计划，虚线边框与浅黄背景以便区分。所有数据指标均来自对应版本代码库的实际统计；本文档仅记录团队自研功能的演进，不含任何第三方内容。
  </div>

  <!-- ============ 总览 ============ -->
  <div class="overview">
    <div class="ov-card"><div class="ov-num">35</div><div class="ov-label">已发布版本</div></div>
    <div class="ov-card"><div class="ov-num">12</div><div class="ov-label">功能页</div></div>
    <div class="ov-card"><div class="ov-num">5</div><div class="ov-label">协作 Agent</div></div>
    <div class="ov-card"><div class="ov-num">24</div><div class="ov-label">岗位数据库</div></div>
    <div class="ov-card"><div class="ov-num">40</div><div class="ov-label">面经知识库</div></div>
    <div class="ov-card"><div class="ov-num">5</div><div class="ov-label">题库分类</div></div>
    <div class="ov-card"><div class="ov-num">24</div><div class="ov-label">题库题目</div></div>
    <div class="ov-card"><div class="ov-num">2914</div><div class="ov-label">前端断言</div></div>
  </div>

  <!-- ========================================================
       v23 · 规划中
       ======================================================== -->
  <nav class="cl-toc" aria-label="版本索引">
  <div class="cl-toc-title">版本索引 · 点击跳转</div>
  <ul class="cl-toc-list">
    <li><a href="#v67"><span class="cl-toc-tag">Beta 1.1.2 · v67</span><span class="cl-toc-title-txt">AI 小助手接入后端 · 服务端检索 / 引用回传 / 访客限流 / 面板高度修复</span></a></li>
    <li><a href="#v64"><span class="cl-toc-tag">Beta 1.1.2 · v64</span><span class="cl-toc-title-txt">能力网改造 · 逐帧位移场 / 端点咬合 / 焦点分组 / 绽开入场</span></a></li>
    <li><a href="#v63"><span class="cl-toc-tag">Beta 1.1.2 · v63</span><span class="cl-toc-title-txt">能力网 · 中心 + 五主题 + 二十实现点 / CSS 浮动 / 悬停弹卡</span></a></li>
    <li><a href="#v62"><span class="cl-toc-tag">Beta 1.1.2 · v62</span><span class="cl-toc-title-txt">首屏撑满一屏 · .lp-first 容器 / svh 视口 / 图幅退到折线以下</span></a></li>
    <li><a href="#v61"><span class="cl-toc-tag">Beta 1.1.2 · v61</span><span class="cl-toc-title-txt">首屏只留一句话 · 三个小标签下线 / 打字机连定时器一起删 / 序列重排</span></a></li>
    <li><a href="#v60"><span class="cl-toc-tag">Beta 1.1.2 · v60</span><span class="cl-toc-title-txt">落地页动效层 · 60px 缓出上浮 / 首屏序列 / 1px 微抬 / 实证三条降级</span></a></li>
    <li><a href="#v59"><span class="cl-toc-tag">Beta 1.1.2 · v59</span><span class="cl-toc-title-txt">落地页整体重排 · 独立样式层 / 报告截面图幅 / 居中版式 / 旧窗栏带拆除</span></a></li>
    <li><a href="#v57"><span class="cl-toc-tag">Beta 1.1.2 · v57</span><span class="cl-toc-title-txt">主标语两种笔性 · 文楷引子 / 墨渗入场 / 断点字距收敛</span></a></li>
    <li><a href="#v56"><span class="cl-toc-tag">Beta 1.1.2 · v56</span><span class="cl-toc-title-txt">主标语字型重构 · 自托管可变宋体 / 楔形版式 / 朱红退回划痕</span></a></li>
    <li><a href="#v55"><span class="cl-toc-tag">Beta 1.1.2 · v55</span><span class="cl-toc-title-txt">主标语焦点层 · 逐字落笔 / 四角取景 / 关键词逐字涂红 / 入场节奏重排</span></a></li>
    <li><a href="#v54"><span class="cl-toc-tag">Beta 1.1.2 · v54</span><span class="cl-toc-title-txt">落地页动态层 · 尺寸线落笔 / 标题揭载 / 右侧标尺 / 跨行裁字</span></a></li>
    <li><a href="#v53"><span class="cl-toc-tag">Beta 1.1.2 · v53</span><span class="cl-toc-title-txt">对话式匹配答满 4 问后没有落点 · 分数涨了缺口没变</span></a></li>
    <li><a href="#v52"><span class="cl-toc-tag">Beta 1.1.2 · v52</span><span class="cl-toc-title-txt">PDF 简历导入只剩一个板块 · 四道坎都在「按行」这件事上</span></a></li>
    <li><a href="#v51"><span class="cl-toc-tag">Beta 1.1.2 · v51</span><span class="cl-toc-title-txt">窄屏首屏 76px 空白 · 顶部让位按下层元素算，不再把顶栏数两遍</span></a></li>
    <li><a href="#v50"><span class="cl-toc-tag">Beta 1.1.2 · v50</span><span class="cl-toc-title-txt">检测修复 · 计划与指挥台同源 / 重开竞态 / 暗色仪表 / 坏数据防御 / 策略卡口径</span></a></li>
    <li><a href="#v49"><span class="cl-toc-tag">Beta 1.1.2 · v49</span><span class="cl-toc-title-txt">视觉升级 · 工作台指挥台（5 段仪表 + 4 格指标 + 下一步）+ 版式降噪</span></a></li>
    <li><a href="#v48"><span class="cl-toc-tag">Beta 1.1.2 · v48</span><span class="cl-toc-title-txt">弹窗按钮不再被拖拽逻辑夺走点击（回车能进 / 鼠标点不进）</span></a></li>
    <li><a href="#v47"><span class="cl-toc-tag">Beta 1.1.2 · v47</span><span class="cl-toc-title-txt">启动守卫 · 「点了没反应」变成明确载入提示 + 就绪补发</span></a></li>
    <li><a href="#v46"><span class="cl-toc-tag">Beta 1.1.2 · v46</span><span class="cl-toc-title-txt">服务端语音转写 · 从「连不上」修成「真的能听见」</span></a></li>
    <li><a href="#v45"><span class="cl-toc-tag">Beta 1.1.2 · v45</span><span class="cl-toc-title-txt">交互确定性层 · 按压当帧可见 + 证据单元绑定 + 设备档位降级</span></a></li>
    <li><a href="#vbeta1-10"><span class="cl-toc-tag">Beta 1.1.0</span><span class="cl-toc-title-txt">完整性补全层 · 骨架屏 + 媒体三层 + Excel + WebSocket + 键盘可达</span></a></li>
    <li><a href="#vbeta1-12"><span class="cl-toc-tag">Beta 1.1.2</span><span class="cl-toc-title-txt">体验修复层 · 重新面试 + 滚动吸附收窄 + 看板实时刷新 + 学习计划 + 图标系统</span></a></li>
    <li><a href="#v44"><span class="cl-toc-tag">Beta 1.1.2 · v44</span><span class="cl-toc-title-txt">感知密度层 · 报告首屏一句诊断 + 点阵/分歧标记 + MBTI 策略前置 + 语音链路错误分型 + 四处真实缺陷修复</span></a></li>
    <li><a href="#v41"><span class="cl-toc-tag">Beta 1.1.2 · v41</span><span class="cl-toc-title-txt">移动端适配层 · 窄屏单栏任务流 + 导航收敛 5 格 + 对话区自适应 + 交互去 hover 化</span></a></li>
    <li><a href="#v42"><span class="cl-toc-tag">Beta 1.1.2 · v42</span><span class="cl-toc-title-txt">移动端信息优先级裁剪 · 首屏单 CTA + 圆桌 chips + 报告渐进披露 + 键盘可见</span></a></li>
    <li><a href="#v43"><span class="cl-toc-tag">Beta 1.1.2 · v43</span><span class="cl-toc-title-txt">人格参数化层 · MBTI 从「孤岛测评」变成面试的输入参数 + 报告的关联维度</span></a></li>
    <li><a href="#v42b"><span class="cl-toc-tag">Beta 1.1.2 · v42b</span><span class="cl-toc-title-txt">降级演练（主动失效）· 三级降级从文档承诺变成可当场复现的动作</span></a></li>
    <li><a href="#v40"><span class="cl-toc-tag">Beta 1.1.2 · v40</span><span class="cl-toc-title-txt">可解释性交互层 · 面试实时锚点 + Agent 分歧视图 + 语音流式转写 + 表达节奏</span></a></li>
    <li><a href="#v39"><span class="cl-toc-tag">Beta 1.1.2 · v39</span><span class="cl-toc-title-txt">反馈闭环层 · 免责声明 + 骨架屏 + 表单校验 + 移动端 + 离线提示 + 空状态 + 无障碍 + 导出补全</span></a></li>
    <li><a href="#v38"><span class="cl-toc-tag">Beta 1.1.2 · v38</span><span class="cl-toc-title-txt">求职材料闭环 · 简历自定义板块 + 模板库 + PDF 自动拆分 + 建议可视化 + 真实岗位入看板</span></a></li>
    <li><a href="#v37"><span class="cl-toc-tag">Beta 1.1.2 · v37</span><span class="cl-toc-title-txt">可视化基建 · 通用图表模块（7 组件零依赖）</span></a></li>
    <li><a href="#v36"><span class="cl-toc-tag">Beta 1.1.2 · v36</span><span class="cl-toc-title-txt">求职闭环增强 · 求职档案 + MBTI + 真实岗位 + 对话式匹配 + 报告追问</span></a></li>
    <li><a href="#vbeta1-11"><span class="cl-toc-tag">Beta 1.1.1</span><span class="cl-toc-title-txt">审计加固层 · 文档一致性 + 安全加固 + XSS 收口 + 泄漏修复 + 视觉纪律</span></a></li>
    <li><a href="#v23"><span class="cl-toc-tag">v23 · 规划中</span><span class="cl-toc-title-txt">生产能力对齐 · 生产级 RAG · 多模态扩展</span></a></li>
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
    <li><a href="#v13"><span class="cl-toc-tag">v13</span><span class="cl-toc-title-txt">验证专区（加密 + 一键进入）</span></a></li>
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
      <span class="v-title">生产能力对齐 · 生产级 RAG · 多模态扩展</span>
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
          <li><b>人工专家复核一致性验证（规划中）</b>：邀请领域专家对抽样面试独立打分，与引擎分数做点对点对比，定位分维度偏差</li>
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
      <span class="v-title">体验修复层 · 重新面试入口 + 滚动吸附收窄 + 看板实时刷新 + 学习计划板块 + 全站图标 + 摄像头面试状态监测</span>
      <span class="v-date">2026.10.24 <span class="cur-mark">当前版本</span></span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        收集一轮真实使用反馈，修掉 <strong>3 个影响主流程的缺陷</strong>，并把「7 天学习路径」从报告页里的一小块摘要升级为<strong>独立板块</strong>：<strong>① 模拟面试无法重新面试</strong>——重面入口此前只藏在 ⌘K 面板与报告页，面试页 chat-head 新增「🔄 重新面试」按钮（沿用带撤销 toast 的重置快照机制，并补登录守卫）；<strong>② 题库页滚动粘滞</strong>——滚动吸附 <code>.bp-snap-y</code> 此前无条件常驻挂在 <code>documentElement</code> 上，应用内所有页面的滚动都被分段吸附阻滞，现收窄为仅落地页视图生效（进入挂载、离开拆除），题库子页签切换后平滑回顶；<strong>③ 能力分布看板数据冻结</strong>——看板此前只在开机装配一次，面试后仍显示「基线数据」，新增 <code>refreshReportPanel()</code>（停旧 live → 摘旧面板 → 按最新会话重挂）并由 <code>renderReport()</code> 在渲染末尾调用，空态路径同步撤下面板。<strong>④ 新增「学习计划」板块</strong>——7 天路径 + 每日时间分配规划：计划内容一键「同步评估报告」按最弱维度动态生成（scoreSession + buildPlan），无报告时回落通用基线；每日时间按「学习 : 练习 : 复盘」权重切分，三档预算（45 / 60 / 90 分钟）切换后自动重算；逐任务打卡 + 进度条 + 印章完成态，支持复制 Markdown 与打印。<strong>⑤ 偏好设置新增「十字鼠标追踪」开关</strong>——准线默认开启，关闭即时撤除、开启即时恢复（<code>prefs.crosshair</code>）。<strong>⑥ 全站图标替换</strong>——36 枚自制蓝图风线性 SVG 图标（24×24、stroke=currentColor 继承文字色、方头直角、每枚仅一枚朱红 accent）替换 63 处模板化 emoji，覆盖侧栏 / 底 Tab / 页头 / 快速入口 / 统计卡 / 落地页 / 主题钮 / 用户菜单 / AI 悬浮球，favicon 升级为取景器标识；保留 emoji 作无 JS 兜底。<strong>⑦ 全栈收口与工程规范</strong>——移除未部署的 Next.js 平行实验层，统一到已验证的单栈（原生 JS + FastAPI）；接入 LLM 混合评分增强（<strong>分数仍由确定性规则引擎给出</strong>，LLM 仅生成逐维度质性评语与教练总评，异常自动回落，杜绝分数幻觉）；补齐 ESLint 10 + Prettier 3 + <code>jsconfig</code>/JSDoc 类型层与 <code>npm run verify</code> 单命令门禁（反合并架构下的 472 个共享全局符号由脚本从源码生成白名单）；技术文档新增 3.5「技术选型论证」并清除未落地的非实证表述。<strong>⑧ 摄像头面试状态监测（前端检测 + 后端聚合）</strong>——面试页 chat-head 新增 📷 按钮，开启后浏览器本地用 <code>face-api.js</code> 识别「人脸是否在场 / 是否专注」，仅把结构化结果（<code>face_present</code> / <code>attentive</code> / <code>label</code>）发给后端；后端 <code>InterviewStatusEvent</code> 持久化并按节拍聚合在场率 / 专注率，作为「后台检测面试状态」的权威状态方。原始视频帧不出浏览器，契合隐私红线；检测依赖加载失败自动降级为仅本地提示，不阻断面试主流程。<strong>⑨ 评估报告纳入面试状态</strong>——报告新增「面试状态（摄像头在场检测）」区块：在场率 / 专注率 / 采样次数三项指标 + 最近状态，数据来自服务端对状态事件的聚合（<code>status</code> 随报告返回），后端不可用时回退本地最近一次聚合；「复制 Markdown」与系统分享同步带出该小节，未开启摄像头时给出中性说明而非空白。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>面试能重来了</b>：chat-head 直接重新面试，重置可撤销</div>
        <div class="vh-item"><b>页面能滚动了</b>：滚动吸附只留在落地页，应用内滚动不再被卡住</div>
        <div class="vh-item"><b>看板看得到自己了</b>：每次进报告都按最新会话重画，不再是基线快照</div>
        <div class="vh-item"><b>7 天计划成板块了</b>：按最弱维度动态生成 + 每日时间分配 + 打卡进度</div>
        <div class="vh-item"><b>全栈收口了</b>：移除未部署的 Next.js 平行实验、接入 LLM 混合评分增强、补齐 ESLint + Prettier + JSDoc 规范、文档去除非实证表述</div>
        <div class="vh-item"><b>面试状态后台看得见</b>：摄像头本地识别在/离场与专注度，后端聚合在场率与专注率，原始画面不出浏览器</div>
        <div class="vh-item"><b>报告里看得见状态了</b>：在场率 / 专注率 / 采样次数写进评估报告，导出的 Markdown 同步带上</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">3</div><div class="m-label">修复缺陷</div></div>
        <div class="metric"><div class="m-val">36</div><div class="m-label">自制 SVG 图标</div></div>
        <div class="metric"><div class="m-val">110</div><div class="m-label">v31 新增断言</div></div>
        <div class="metric"><div class="m-val">26</div><div class="m-label">v34 新增断言</div></div>
        <div class="metric"><div class="m-val">32</div><div class="m-label">v33 新增断言</div></div>
        <div class="metric"><div class="m-val">1522</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">ESLint 错误</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
  <!-- ========================================================
       Beta 1.1.2 · v50 · 全面检测：把「说得通」改成「对得上」
       ======================================================== -->
  <!-- ========================================================
       Beta 1.1.2 · v51 · 窄屏顶部让位：一份高度只算一次
       ======================================================== -->
  <!-- ========================================================
       Beta 1.1.2 · v53 · 对话式匹配：答满 4 问之后没有落点
       ======================================================== -->
  <div class="version" id="v53">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 可用性修复（v53）</span>
      <span class="v-title">答满 4 问，按钮和输入框一起消失了</span>
      <span class="v-date">2026.11.01</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        验证「4 轮追问把匹配度从 71% 拉到 86%」这条路径时，在真实浏览器里走了一遍完整流程，
        发现答完第 4 问之后屏幕上既没有输入框、也没有按钮、更没有汇总卡——
        追问唯一的落点是那张「71% → 86%」的结果卡，而它只有「不等答完就手动结束」才看得到。
        顺带还发现一处同源问题：分数涨了，能力缺口那一栏却没变。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>答满即断流</b>：<code>renderMatchQa</code> 的 <code>done</code> 分支渲染的是空串，把回答区与「结束并应用」一起收掉；而汇总卡只在 <code>finishMatchQa</code> 里渲染。答满 4 问 = 流程停在没有出口的位置。改为答完最后一问自动收尾，并在答满态保留一个「生成对话增强结果」的入口</div>
        <div class="vh-item"><b>三处数字不同源</b>：追问会把新证据并入 <code>matchResult.skills</code>、从 <code>gaps</code> 里剔除已补齐项，但屏幕上只重画了分数环，技能与缺口仍是首次渲染的文字——出现「86 分 / 缺口仍列着 Next.js」这种自相矛盾的画面。改为把结果卡抽成 <code>renderMatchResult</code>，分数、技能、缺口、建议一次同源渲染</div>
        <div class="vh-item"><b>空对象不覆盖</b>：结果卡在无数据时直接返回，不会把已有内容清成空白</div>
        <div class="vh-item"><b>口径未变</b>：匹配分仍是「JD 技能覆盖率」，不理解语义；仍是 Beta 1.1.2，数据不出浏览器</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">35</div><div class="m-label">v53 新增断言</div></div>
        <div class="metric"><div class="m-val">2506</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">44</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">+15</div><div class="m-label">追问带来的匹配分</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v67 · AI 小助手接入后端
       ======================================================== -->
  <div class="version" id="v67">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 架构增强（v67）</span>
      <span class="v-title">AI 小助手接入后端：检索、引用与额度都搬到服务端</span>
      <span class="v-date">2026.11.04</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        小助手之前是「前端检索 + 前端拼提示词 + 前端限流」。这三件事都靠浏览器自觉：
        换台机器检索质量就变（端侧向量模型要重新下载），回答里的 [1][2] 与界面上列出的引用
        可能对不上，而前端限流改一行 JS 就能绕过。这一版把三件事一起搬到服务端。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>为什么新开一个端点</b>：通用通道 <code>/api/chat/stream</code> 是转发器，调用方自带 messages 与 system prompt，必须登录；小助手要的是「只能问、不能改提示」，而且希望访客也能用。合并成一个，等于把模型额度开放给任何脚本，也无法限制提示词内容。所以新增 <code>/api/assistant/chat</code>，检索、参考资料编号、限流都在服务端完成</div>
        <div class="vh-item"><b>知识库只有一份</b>：前端 <code>kb.js</code> 仍是唯一数据源，<code>scripts/export-kb.js</code> 把 40 条导出成后端数据文件（JSON），<code>npm run verify</code> 里加了 <code>kb:check</code>，两边不一致直接失败。导出时踩到一个坑：知识库是「初始 8 条 + 后续 push 34 条」两段拼起来的，只取第一段会静默导出 8 条，而 check 模式也会通过——因为两边都是 8 条</div>
        <div class="vh-item"><b>检索口径与前端对齐</b>：后端复刻同一套分词（按空白与中文标点切、丢弃单字碎片、中文补 bigram）、同一组 BM25 参数（<code>k1=1.5 / b=0.75</code>，标题重复一次等价 ×2 权重），重排也用控制台上的四项特征：标题覆盖、标签覆盖、最长公共子串、来源类型与长度先验。<strong>不做端侧向量</strong>——纯词面检索对「同义不同词」会弱一些，这是已知差距，没有假装补齐</div>
        <div class="vh-item"><b>访客可用，但额度收紧</b>：匿名 6 次/分、40 次/天；登录用户 12 次/分、200 次/天。窗口是进程内内存的滑动窗口——这个项目的部署形态没有 Redis，为限流引入一套中间件反而会让服务起不来。来源地址优先取 <code>X-Forwarded-For</code>：镜像站前面有一层反向代理，只看 <code>request.client.host</code> 会让所有访客共用一个额度，第七个人就被拒</div>
        <div class="vh-item"><b>引用由服务端给出</b>：流的首帧是一帧 <code>meta</code>，带模型名、引用来源与剩余额度。前端只负责把它们列出来，不再自己拼一份「可能和模型看到的不是同一份」的参考资料。引用编号与模型看到的编号因此天然一致</div>
        <div class="vh-item"><b>降级要说清是哪一级失败</b>：额度用完（带等待秒数）、后端未配置模型 Key、普通调用失败，三套文案各不相同，且都附上本地知识库的检索结果。把额度问题说成「模型调用失败」，用户会一直重试</div>
        <div class="vh-item"><b>顺手修掉一个一直存在的问题</b>：面板高度写死 480px，报告追问那四句长问题各占一行，把消息区压到 <strong>42px</strong>——回答进去只剩结尾半句，得自己往上滚。这个问题是截图核验时才看见的，不是测出来的。改为快捷区限高可滚动 + 面板高度受视口约束，实测消息区 42 → <strong>336px</strong></div>
        <div class="vh-item"><b>后端地址不再取决于先点过哪一页</b>：原来只有打开面试页的模型面板才会初始化适配层，小助手在别的页面里后端地址还是空串——镜像站上凑巧同源可用，静态托管的演示页与本地开发则必然失败。现在适配层随模块加载即初始化，健康探测在启动时补上</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">38</div><div class="m-label">v67 新增断言</div></div>
        <div class="metric"><div class="m-val">2953</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">40</div><div class="m-label">服务端知识条目</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v64 · 让网自己动起来：位移场、端点咬合与焦点分组
       ======================================================== -->
  <div class="version" id="v64">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v64）</span>
      <span class="v-title">让网自己动起来：位移场、端点咬合与焦点分组</span>
      <span class="v-date">2026.11.03</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        v63 那张图能看懂，但它是静的：CSS 关键帧只把节点挪了几像素，线纹丝不动，
        端点在肉眼可见处脱开。这一版把整张图交给一个位移场——每帧先算二十六个节点该去哪，
        再把这同一组数写进二十五条线的两端，位移自然咬合。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>为什么必须逐帧</b>：一条线是两点之间的直线，两端的点是两个独立动体。交给 CSS 各飘各的，端点必然脱开——位移越大越明显，而位移一小又看不出「在动」。改成逐帧后，节点与线从同一份数据出发，不存在对不齐的可能；实测同一时刻中心节点位移与主干线起点之差为 <code>0.000</code></div>
        <div class="vh-item"><b>方向各走各的，不是一阵风</b>：每个点的相位与频率比都由序号推导（确定性，刷新和截图比对都不会漂），但彼此不同——相邻两点不再同向摆动。两轴各叠两个分量，频率比取 1.73 / 1.57 这类非整数倍，合成出的是不闭合的利萨如轨迹：忽左忽右、忽快忽慢。实测四十秒内二十五个点<strong>全部走遍八个方向扇区</strong>，主方向占比最高只有 0.26——不是二十五个点各自乱抖，也不是整片被同一阵风推着走</div>
        <div class="vh-item"><b>总览钉住，其余才动</b>：中心节点幅度为 0。它是一张网的锚，自己也晃的话，二十五条线的起点跟着抖，画面会散。主题 8–11px、细节 11–15px，纵向再收到 0.72 倍——同组四个细标签竖直方向只隔约 38px，压一压才不会撞在一起（实测六十秒内文字零重叠）</div>
        <div class="vh-item"><b>节奏是一个系数</b>：全局 <code>TEMPO = 1.5</code> 只乘振荡的时间，不乘相位、不改幅度——波的形状与传播方向一概不动，只是走得快些。细节周期 8.2 → 5.6 秒、主题 10.2 → 7.0 秒。入场那 1.6 秒坡道仍按真实时间走，不跟着缩短，免得开局像被推了一把</div>
        <div class="vh-item"><b>非等比坐标的换算</b>：线画在 <code>viewBox="0 0 100 100"</code> 且 <code>preserveAspectRatio="none"</code>，x 方向 1 单位对应 W/100 像素、y 方向对应 H/100。位移按这个比例写回 <code>x1/y1/x2/y2</code>，容器怎么缩放都对齐</div>
        <div class="vh-item"><b>门控三层，不空转</b>：<code>IntersectionObserver</code> 进视口才跑、离开即停；<code>visibilitychange</code> 切到后台即停；<code>prefers-reduced-motion</code> 直接不启动。一帧写 51 个元素，实测 60fps。入场也因此改成「滚到才播」：新增 <code>is-live</code>，否则页面加载时这块还在屏外，用户滚下来动画早播完了</div>
        <div class="vh-item"><b>连线从中心绽开</b>：<code>clip-path: circle(0 → 88%)</code>。先试过用 <code>stroke-dashoffset</code> 逐条生长，但 <code>vector-effect: non-scaling-stroke</code> 会让 dash 长度按屏幕像素算、且不受 <code>pathLength</code> 归一化影响，每条线都断成一截截短杠——整块裁剪没有这个问题</div>
        <div class="vh-item"><b>节点有了实体，网有了重心</b>：节点底色改成与页面同色，线从文字底下过时被整齐切断，不再穿过字；中心节点压一张白纸小卡片，四周二十个标签只是文字。悬停某一组时，本组文字回到墨色、连线加深，其余四组连人带线退到 36%，同时本组漂移收到 0.4 倍幅——焦点处稳，四周继续流</div>
        <div class="vh-item"><b>顺手清了两处旧账</b>：蓝图十字准线原本全站常驻，在落地页上两条墨线横贯整屏（这里从 v58 起已是干净留白风），改为落地页收起、进内页再显示；<code>reduced-motion</code> 块里那几条能力网规则因写在主体段落之前，被后面同权重的声明盖掉，「关动画」其实从未生效，选择器抬一级才真正压下</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">16</div><div class="m-label">v64 新增断言</div></div>
        <div class="metric"><div class="m-val">2914</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">60</div><div class="m-label">实测帧率（fps）</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v63 · 能力网：一张会呼吸的关系图
       ======================================================== -->
  <div class="version" id="v63">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v63）</span>
      <span class="v-title">能力网：中心一个名字，四周二十条实现</span>
      <span class="v-date">2026.11.03</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        落地页讲完了功能、流程和数字，还是没回答一个问题：这套东西到底靠什么立起来。
        这一版在页尾加了一张关系图：中心是产品名，五个方向各自挂四到五个实现点，细线相连，
        整体缓慢浮动；鼠标停在任意一个点上，弹出一张卡片说清它在代码里对应哪一段。
        形态参照 mimo.mi.com 的「开发者的声音」，内容全部换成能对上仓库的实现。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>不用 canvas，用 DOM + SVG</b>：参考站是在一块 1200×600 的画布上逐帧重绘。这里换成绝对定位的节点配一条 SVG 线：文字可以选中、可以读屏、打印导出时不会被丢掉，测试里也能数清节点、断言文案——画布只能截图比对。线用 <code>viewBox="0 0 100 100"</code> 加 <code>preserveAspectRatio="none"</code>，坐标即百分比，与节点的 <code>left/top</code> 同源，容器怎么缩放都对齐；线宽靠 <code>vector-effect</code> 固定 1px，不被非等比缩放拉花</div>
        <div class="vh-item"><b>浮动交给 CSS，不占 rAF</b>：每个节点有自己的 <code>--ax / --ay / --dur / --del</code>，一条 <code>@keyframes fvDrift</code> 走四个关键帧。时长 8.5–13.7 秒、相位用负延迟错开，看起来像被同一股力推着呼吸，而不是整齐地上下跳。标签页切到后台动画自动暂停，<code>prefers-reduced-motion</code> 一行关干净——不需要自己写一帧循环和暂停逻辑</div>
        <div class="vh-item"><b>居中用 <code>transform</code>，浮动用 <code>translate</code></b>：两个属性分开写，互不覆盖。节点靠 <code>transform: translate(-50%, -50%)</code> 钉在坐标点上，浮动改的是独立的 <code>translate</code>——这也是 v60 滚动入场与 hover 微抬用的同一套手法</div>
        <div class="vh-item"><b>布局改过两轮：同心环会串组</b>：第一版把所有细标签摆在一个大同心圆上，角度一偏就漂到邻组旁边——「观察员」跑到了混合检索那一侧，连线看起来像连错了人。改成以主节点为圆心向外伸展、每组张角 68°，每个标签离自己的组恒定距离，怎么转都不会串门</div>
        <div class="vh-item"><b>卡片的尺寸照参考站量</b>：白底、圆角 12px、阴影 <code>0 4px 24px rgba(0,0,0,.08)</code> 叠 <code>0 1px 4px</code>、内边距 <code>16px 20px</code>、出入 <code>opacity/transform .2s</code> 并从 <code>translateY(4px)</code> 落位；左侧一枚 32px 圆形序号代替人物头像，名字 13px/600，正文 13px/1.5。位置按节点的布局坐标算，避开右边界时自动翻到左侧，上方放不下就翻到下方</div>
        <div class="vh-item"><b>不编造用户评价</b>：参考站那圈标签是开发者原话，配头像和引述。我们没有真实用户证言，所以这块不假装有——标题从「开发者的声音」改成「这张网由什么支撑」，卡片里写的是实现说明，每个点都能在仓库里找到对应代码（评分公式、四位面试官、混合检索、三级降级、端侧隐私）</div>
        <div class="vh-item"><b>三条降级</b>：<code>prefers-reduced-motion</code> 下浮动全停、节点直接可见；窄屏（≤900px）不做「点不动的图」，整块换成五组可读的列表，副标题也跟着从「悬停」改成陈述句；没有 JS 时舞台不挂 <code>fv-ready</code>，宁可空着也不留一堆错位的点和线</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">72</div><div class="m-label">v63 新增断言</div></div>
        <div class="metric"><div class="m-val">2898</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">51</div><div class="m-label">jsdom 套件</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v62 · 首屏撑满一屏：图幅整体退到折线以下
       ======================================================== -->
  <div class="version" id="v62">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v62）</span>
      <span class="v-title">首屏撑满一屏：标题独占第一眼，图幅退到折线以下</span>
      <span class="v-date">2026.11.03</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        v61 把三个小标签收掉之后，首屏只剩标题与 CTA，可评分图幅的顶边仍露在折线下缘
        ——一屏里同时出现了「开场」和「正文」，第一眼不知道该看哪里。
        这一版把第一屏交给标题独占：满一屏，图幅连同那条 <code>SHEET 01</code> 尺寸线整体推到折线以下。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>用容器划出一屏，而不是给图幅加位移</b>：标题 / 副标题 / 两个按钮 / 快捷键提示收进新容器 <code>.lp-first</code>，它自己 <code>min-height: calc(100svh - 65px)</code>（扣掉吸顶导航条）并垂直居中。尺寸线与评分图幅不在这个容器里，自然落到折线以下——不是把图幅往下推了多少像素，而是第一屏的定义被改清楚了</div>
        <div class="vh-item"><b><code>svh</code> 而不是 <code>vh</code></b>：移动端地址栏收起时 <code>100vh</code> 比真实可视区高，首屏会多出一截。两行声明并存，支持的浏览器走 <code>100svh</code>，不支持的退回 <code>100vh</code>，不会出现「撑不满」或「撑过头」</div>
        <div class="vh-item"><b>重心略高于正中</b>：<code>justify-content: center</code> 配 <code>padding: 32px 0 56px</code>，下边留得比上边多——机械居中会显得整块往下坠。窄屏收到 <code>18px / 34px</code></div>
        <div class="vh-item"><b>上边距归零</b>：v61 为补呼吸感加的 <code>padding-top: 108px</code> 已由容器高度接管，<code>.landing-hero</code> 回到 <code>padding: 0</code>。两套留白叠加会让首屏凭空多出 108px 空白</div>
        <div class="vh-item"><b>实测折线位置</b>：1440×900 图幅顶边 986（折线 900，退后 86px）；390×844 顶边 888（退后 44px）；两档都不再有图幅探出。首屏内容在各自视口内垂直居中，深色态同样成立</div>
        <div class="vh-item"><b>断言跟着结构走</b>：v25 的首屏断言从「<code>.wrap</code> 第一个子元素是标题」改为「第一屏容器 <code>.lp-first</code> 的第一个子元素是标题」，并新增一条「容器内不含尺寸线与评分图幅」——把「图幅在折线以下」这件事钉在结构上，而不是量像素</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">1</div><div class="m-label">v62 净增断言</div></div>
        <div class="metric"><div class="m-val">2826</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">50</div><div class="m-label">jsdom 套件</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v61 · 首屏只留一句话：三个小标签下线
       ======================================================== -->
  <div class="version" id="v61">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v61）</span>
      <span class="v-title">首屏只留一句话：三个小标签下线，标题从头接管</span>
      <span class="v-date">2026.11.03</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        上一版把动效照参考站做完了，首屏顶上却还压着三层小字：<code>AI Native</code> 抬头、
        <code>&gt;_</code> 打字机、<code>BETA 1.1.2</code> 胶囊。参考站的开场没有这些——它就一句话。
        这一版把三层一起收掉，顺带把打字机的定时器、CSS 规则和四条挂在上面的断言一并清干净。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>三个标签是删掉，不是藏起来</b>：抬头那句「一次面试，多重机会」、<code>&gt;_</code> 轮播行、导航右侧的 <code>BETA 1.1.2</code> 胶囊，连同它们在 <code>landing.css</code> 里的规则、窄屏覆盖、入场延迟项一起移除。标题成了首屏唯一的文字，从导航下方直接起笔</div>
        <div class="vh-item"><b>打字机连定时器一起删</b>：节点没了还留着 68ms/字的 <code>setTimeout</code>，只是让它在后台空转。<code>initHeroRotator</code>、5 条文案、<code>__bpLanding.rotator / phrases</code> 两个打点字段一并下线，boot 里那行调用也去掉</div>
        <div class="vh-item"><b>上边距补回 32px</b>：抬头 + 轮播原本占掉约 75px 的堆叠高度（含各自间距），直接删会让标题贴在导航条下。首屏 <code>padding</code> 76 → 108px、窄屏 52 → 68px，数值是对着 1440 与 390 两张截图校准的，不是凭感觉给的</div>
        <div class="vh-item"><b>序列少了两站，节奏没变</b>：标题之后第一站直接是副标题 0.72s（原来中间还嵌着 0.04s 抬头与 0.1s 轮播），主按钮 0.82s、提示 0.92s、评分图幅 0.82s、五条横条 1.02s 起一概不动。一支笔连写下来的顺序还在，只是前缀那两笔没了</div>
        <div class="vh-item"><b>版本串不靠胶囊站着</b>：<code>Beta 1.1.2</code> 仍出现在 <code>&lt;title&gt;</code>、页脚与开发者模式横条三处，<code>test-v31</code> 的版本口径断言改成大小写不敏感。删掉的是那颗胶囊，不是版本号本身</div>
        <div class="vh-item"><b>断言口径反过来钉</b>：原先是「这句文案在不在」，现在是「这三个节点在不在」。v17 / v25 / v31 / v59 / v60 五处共十四条改写为「已下线 + 标题是首屏首元素 + 降级不回填已删的东西」，覆盖率不减，也不再为不存在的节点留着假绿</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">14</div><div class="m-label">v61 改写断言</div></div>
        <div class="metric"><div class="m-val">2825</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">50</div><div class="m-label">jsdom 套件</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v60 · 落地页动效层：照参考站实测的节奏，不靠「感觉快一点」
       ======================================================== -->
  <div class="version" id="v60">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v60）</span>
      <span class="v-title">把参考站的动效节奏量下来，再长到自己的笔锋上</span>
      <span class="v-date">2026.11.02</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        版式换过来了，动效还是旧的：卡片靠 <code>clip-path</code> 自上而下「揭载」，
        这是图纸语言，放在居中的暖白版式里像卡带。这一版先用 CDP 把参考站的动效量清楚
        ——29 处 <code>.reveal</code>、初态 <code>translateY(60px)</code>、
        过渡 <code>0.8s cubic-bezier(.16, 1, .3, 1)</code>、按钮 hover 抬 <code>1px</code>、
        导航 <code>150ms</code>——再按这组数重写落地页的动效层。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>三个数是量出来的</b>：<code>0.8s</code> / <code>60px</code> / <code>cubic-bezier(.16, 1, .3, 1)</code>。参考站的缓出曲线一开始冲得很快、最后几乎不动，这与「弹簧式 ease-out」是两回事——换错曲线，60px 就会显得黏</div>
        <div class="vh-item"><b>滚动入场 29 处</b>：区块标题、实录卡、规格胶囊、九张功能卡、四步流程、四个数字、底部 CTA、页脚。同排错峰 60ms（功能卡按列 0/60/120，每排重新起算），流程与数字 70ms。位移用 <code>translate</code> 属性而不是 <code>transform</code>，跟 hover 的微抬各管一摊，谁也不覆盖谁</div>
        <div class="vh-item"><b>首屏编成一支笔</b>：标题 60ms 起笔（原来要等 220ms，首屏先白一截）→ 副标题 0.72s → 主按钮 0.82s → 快捷键提示 0.92s → 评分图幅 0.82s → 五条横条 1.02s 起依次长出。图幅走 <code>animation</code> 而不是滚动监听：它在 1440×900 下本来就露在折线下缘，交给 IO 会在解析期就判「已在视口」，首帧直接跳到终态——图幅先到、标题后写，顺序是反的</div>
        <div class="vh-item"><b>悬停只抬 1px</b>：主胶囊 hover 抬 1px 并把黑底压深 14%，次胶囊抬 1px 铺 4% 黑底，功能卡抬 2px。参考站就抬 1px——抬多了立刻变成模板站。导航链接从 240ms 收到 150ms，与参考站的 <code>opacity .15s</code> 同量级</div>
        <div class="vh-item"><b>数据自己长出来</b>：五维条形从 0 沿左端拉到位（每条再叠 80ms），雷达图的五边形沿周长描一遍（周长约 323，给 360 的余量）。条形用 <code>scaleX(var(--v))</code>，终值与右侧分数仍然自洽</div>
        <div class="vh-item"><b>实录等看得见才播</b>：气泡只播一遍，播在首屏下面等于没播。现在先量卡片位置，在视口外就挂一个 IO，进视口再真正开始；量不到尺寸（jsdom / 隐藏视图）时不拦着，直接播——老行为在测试里照旧成立</div>
        <div class="vh-item"><b>三条降级都得有内容</b>：初态只挂在 JS 打的 <code>.lp-motion</code> 上，所以无 JS 是完成态；没有 <code>IntersectionObserver</code> 时直接补 <code>.is-in</code>，不靠动画才有内容；<code>prefers-reduced-motion</code> 下连类都不打，CSS 再兜一层把位移与动画一并抹掉——否则会停在半路发虚</div>
        <div class="vh-item"><b>顺手修掉两处旧账</b>：落地页的 <code>.reveal</code> 退成空操作（裁切揭载留给内页）；v17 那条「全站无 translateY 上浮」收窄到图纸三层，另加一条「落地页微抬不超过 2px」，免得为了过断言把动效做成别的东西</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">65</div><div class="m-label">v60 新增断言</div></div>
        <div class="metric"><div class="m-val">2826</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">50</div><div class="m-label">jsdom 套件</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v59 · 落地页整体重排：参考站的版式语言 + 把旧层收进独立样式表
       ======================================================== -->
  <div class="version" id="v59">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v59）</span>
      <span class="v-title">落地页按参考站重排，旧图纸层收进一页独立的样式表</span>
      <span class="v-date">2026.11.02</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        v58 只换了落地页的骨架，底下还压着 v21–v57 的图纸规则，于是出现「卡片圆角换了、
        卡头还挂着一条米色窗栏」这种半新半旧。这一版把落地页收成独立的一层
        <code>frontend/css/landing.css</code>，全部规则以 <code>#view-landing</code> 起头；
        产品内页的图纸风一像素不动，两套语言各管一摊。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>先分层再改版</b>：新层排在 <code>pages.css</code> 之后，靠 ID 前缀提权重，整层零 <code>!important</code>。构建清单从 3 层 CSS 变 4 层，单文件演示包照样内联</div>
        <div class="vh-item"><b>四个数是量出来的</b>：底色 <code>#fcfaf8</code>（暖纸，不是纯白）、容器 <code>1260px</code>、卡片圆角 <code>24px</code>、按钮圆角 <code>999px</code>。首屏全部居中，主标语 <code>clamp(34px, 4.4vw, 58px)</code>，1440 下落在 58px，与参考站同量级</div>
        <div class="vh-item"><b>图幅从「一块海报」改成「一张报告截面」</b>：左总分 86，右五维条形，底部一条脚注写清「样例为合成数据」。条形用 <code>scaleX(var(--v))</code> 画，不用 width 动画；五条长度与右侧分数自洽，套件里逐条比对</div>
        <div class="vh-item"><b>苔绿换成暖砂</b>：参考站的主视觉是低饱和苔绿，但本项目的主色是朱红——绿底配红字互相打架。换成 <code>#f7f2e8 → #eee3d2</code> 的暖砂渐变，朱红只留一处「看看评分怎么来的 →」</div>
        <div class="vh-item"><b>拆掉一条会吃字的旧装饰</b>：<code>tokens.css</code> 里给 <code>.hero-mock</code> 画过一条 34px 高的米色「浏览器窗栏」，正好压住卡头标题的下半截。这一版直接 <code>content: none</code>，卡片从圆角开始</div>
        <div class="vh-item"><b>三个区块三种密度</b>：功能 3 列白卡；流程 4 栏只留一条发丝线分栏（原来那条 2px 墨线悬在卡外，像掉了一根杠）；数字 4 列，刻度尺从 12 根 6px 宽的短棒收回 1px 细线——之前远看像一行乱码</div>
        <div class="vh-item"><b>标题不再落宋体</b>：<code>landing-section-title</code> / <code>feature-block h3</code> 之前被旧层的「衬线大标题」组捞走，中文实际落到点数很小的宋体。这一版把节标题统一成无衬线，衬线只留给主标语与数字</div>
        <div class="vh-item"><b>窄屏重新算一遍</b>：功能卡两列（一列 9 张要 1869px）、收掉与五维条形重复的雷达图、卡头状态字隐藏让标题单行、折叠目标清空——折叠条在短版式里只会剩下五根黑杠</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">52</div><div class="m-label">v59 新增断言</div></div>
        <div class="metric"><div class="m-val">2760</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">49</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">4</div><div class="m-label">CSS 层数</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v57 · 主标语两种笔性：手写的渗进去，印刷的压上去
       ======================================================== -->
  <div class="version" id="v57">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v57）</span>
      <span class="v-title">引子行换成霞鹜文楷，两行用两种写法入场</span>
      <span class="v-date">2026.11.01</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        v56 把字换成了真宋体，但整句只有<strong>一种笔性</strong>：两行同体、同一种揭载方式。
        这一版给引子行换一款带笔锋的字，并让两行用两种写法入场——
        引子行是「墨渗」，主行是「描出」。一句话里，人说的部分和印出来的部分，动起来也不该一样。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>引子行换文楷</b>：霞鹜文楷（LXGW WenKai）同样按当前文案取子集，只含这句话用到的 16 个字符，woff2 <strong>4.5 KB</strong> 内联进样式层。文楷带笔锋起收，放大后看得出是写出来的；主行仍是思源宋体 800，横细竖粗，是印上去的——两种笔性并置，正好对上「经历 → 可量化的结论」</div>
        <div class="vh-item"><b>墨渗而不是裁切</b>：引子行每字从 4px 虚影沉到实处、顺带 3px 落定，像笔尖触纸后墨往纤维里吃，边缘先糊后清。不用 <code>clip-path</code>——裁切会在中途切出半个字，而在 34px 的字上尤其像渲染错误</div>
        <div class="vh-item"><b>主行仍走描出</b>：墨色先在 16% 处到满，笔锋再从字身上扫过去（先有墨、后见笔锋）；步进 <code>34ms</code>，比引子行的 <code>22ms</code> 慢——大字本来该慢。两行同时在写，不是写完一行再写下一行</div>
        <div class="vh-item"><b>字距收敛的终值必须是静态值</b>：引子行入场时字距从 <code>.26em</code> 收到 <code>.1em</code>，字像从远处聚到这一行；窄屏与平板各有对应关键帧，终值分别等于 <code>.08em</code> 与 <code>.1em</code>。终值写错会在动画结束那一下跳一格，v57 套件把三条都钉住了</div>
        <div class="vh-item"><b>留白让位</b>：标题到正文从 20px 放宽到 30px，抬头到标题从 20px 放宽到 26px，引子行从 <code>0.44em</code> 抬到 <code>0.48em</code>——一句话需要一块完整的空气，才站得住</div>
        <div class="vh-item"><b>维护成本不变</b>：<code>scripts/fetch-title-font.js</code> 现在同时管两款字体，改文案一条命令重取；<code>--check</code> 只核对不写盘。漏掉任何一款，屏幕上就会出现「一半文楷、一半系统楷」的混排，套件里有守卫</div>
        <div class="vh-item"><b>降级不变</b>：无 JS 时标题就是 HTML 里的完整两行；reduced-motion 下切片全部可见，模糊与位移一并抹掉（否则会永久发虚）</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">34</div><div class="m-label">v57 新增断言</div></div>
        <div class="metric"><div class="m-val">2708</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">48</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">4.5KB</div><div class="m-label">文楷子集</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v56 · 主标语字型与版式重构：让这句话自己站住
       ======================================================== -->
  <div class="version" id="v56">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v56）</span>
      <span class="v-title">换掉字体、重排版式：一句话拆成前提与结论，朱红退回去只做划痕</span>
      <span class="v-date">2026.11.01</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        v55 解决了「注意力给谁」，但没有动<strong>字本身</strong>。标题仍走在
        <code>Georgia, Songti SC, SimSun</code> 这条栈上，中文实际落到点数很小的宋体，
        <code>font-weight: 800</code> 全靠浏览器合成加粗——放大到 60px 以上，笔画就糊成一片。
        这一版换字体、重排版式、给动效加重量，三件事一起做。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>自托管可变衬线</b>：按当前文案取思源宋体（Noto Serif SC）子集，只含这句话用到的 <strong>16 个字符</strong>，woff2 <strong>7 KB</strong>（base64 约 9 KB）内联进样式层，不发额外请求，单文件演示包也带得上；<code>font-weight: 200 900</code> 走可变轴，<code>font-synthesis: none</code> 关掉合成加粗——800 是字体里真实的特粗实例</div>
        <div class="vh-item"><b>版式改成楔形</b>：原先两行等长同字号，读完不知道重心在哪。现在「让每一次面试，都成为」压到主行的 <code>0.44em</code>、字距 <code>.18em</code>、颜色收到 66%，主行「可量化的成长。」满字号 + 800 + 负字距独占重量；两行宽度比约 <strong>0.66 : 1</strong>，从左上向右下张开，先给前提、再落结论</div>
        <div class="vh-item"><b>三档字号</b>：桌面 <code>clamp(40px, 5.8vw, 74px)</code>、平板 <code>clamp(44px, 8vw, 68px)</code>、窄屏 <code>clamp(30px, 11.6vw, 46px)</code>。平板上是单列布局，沿用桌面比例会缩成一个小标题，必须单独给一档</div>
        <div class="vh-item"><b>朱红从「字色」退回「划痕」</b>：v55 里关键词七个大字整块是朱红，红面积超过了全站 ≤5% 的调色纪律，也把字压成色块。现在字保持墨色，朱红只做一条 <code>.1em</code> 粗、贴住基线的划线，逐字 56ms 递进涂过去——整句只有一个地方是红的</div>
        <div class="vh-item"><b>动效加重而不是加快</b>：单字从 300ms 提到 <strong>420ms</strong>，16% 处先到满墨再继续描出（先有墨、后见笔锋，不是整字淡入）；引子行步进 22ms、主行 34ms，主行 <strong>420ms</strong> 起笔——两行是同一支笔同时在写，不是写完一行再写下一行</div>
        <div class="vh-item"><b>字距收敛</b>：引子行入场时 <code>letter-spacing</code> 从 <code>.34em</code> 收到 <code>.18em</code>，字像从远处聚拢到这一行；窄屏与平板各有一条对应关键帧，收的终值恰是各自的静态值，不会在动画结束那一下跳一格</div>
        <div class="vh-item"><b>文案漂移守卫</b>：字体子集只含这 16 个字，改了文案却没重取子集，屏幕上就会出现「一半思源、一半系统宋体」。断言里把标题字符集与子集字符集对齐比较，缺一个就红；另配 <code>scripts/fetch-title-font.js</code>，一条命令重取，<code>--check</code> 只核对不写盘</div>
        <div class="vh-item"><b>降级不变</b>：无 JS 时标题就是 HTML 里的完整两行；reduced-motion 下切片全部可见、划线直接铺满、角标与针不出现</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">42</div><div class="m-label">v56 新增断言</div></div>
        <div class="metric"><div class="m-val">2674</div><div class="m-label">前端断言总数（v56 当时口径）</div></div>
        <div class="metric"><div class="m-val">47</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">7KB</div><div class="m-label">内联字体子集</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v55 · 主标语焦点层：首屏只讲一句话
       ======================================================== -->
  <div class="version" id="v55">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v55）</span>
      <span class="v-title">落地页首屏只讲一句话：标题被一笔一笔写出来，其余元素等它写完</span>
      <span class="v-date">2026.11.01</span>
    </div>
    <div class="version-body">
      <div class="v-intro">
        v54 把「图纸绘制」铺到了整页，但首屏本身仍是一次性到位的：标题整行揭载、高亮整块铺满，
        放完就静止。这一版把入场预算全部压在<strong>主标语</strong>上——
        字一个一个写出来，写完才让正文、按钮、数据出现。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>逐字落笔</b>：16 个字拆成 15 个 <code>inline-block</code>（句号并进「长」，避免行首标点），每个字自左缘用 <code>clip-path</code> 描出，单字 300ms、步进 26ms——笔锋跨约 10 个字宽，读起来是墨在走，不是字在闪</div>
        <div class="vh-item"><b>四角取景</b>：标题四周四段 L 形 1px 发丝线，各自从角点用 <code>clip-path</code> 画开（0 / 70 / 140 / 210ms）；落定后每 8s 合焦呼吸一次（压到 44% → 两次短脉冲）。用 clip-path 而不是缩放，线条粗细全程保持 1px</div>
        <div class="vh-item"><b>关键词逐字涂红</b>：整块背景扫过换成 6 个字块依次 66ms 递进，跨行天然正确；末字下划线扣掉句号那 1em，不把批注拖出句尾</div>
        <div class="vh-item"><b>入场节奏重排</b>：抬头（图幅标注 / 标签 / 轮播 / eyebrow）先亮 → 主标语 0.26s 起笔 → 正文 1.18s、按钮 1.26s、数据 1.4s、规格卡 1.52s 依次落位；标题宽度收到字宽，角标贴字不贴格子</div>
        <div class="vh-item"><b>真缺陷：错帧其实没生效</b>：<code>animation</code> 简写会连同 delay 一起重置，v54 那批 <code>:nth-child</code> 延迟规则权重比简写低，全部被静默改回 0s——看着有「错帧设计」，实际所有元素同时出现。改写成带 <code>:nth-child</code> 的高权重选择器后才真正错开，断言里钉住「不许再出现裸 :nth-child 延迟规则」</div>
        <div class="vh-item"><b>真缺陷：窄屏劈词</b>：38px 下第二行「都成为可量化的成长。」要 380px，390 屏只有 342px，把「成长」劈成「成」+「长。」两行。窄屏字号收到 <code>8.4vw</code>（≤38px）并把关键词设为不拆行，375 / 390 / 768 复验均为两行且无横向溢出</div>
        <div class="vh-item"><b>持续动效</b>：图幅尺寸线上加一枚 1px 朱红绘图针，7.6s 沿尺寸线走一趟，与角标呼吸不同频；鼠标划过标题可立即重扫一次批注，另有 12s 自动重扫（标题出视口或标签页在后台时空转）</div>
        <div class="vh-item"><b>降级纪律不变</b>：所有初态挂在 <code>.landing-enter</code> 下，无 JS 或 reduced-motion 一律是完整完成态；拆字失败自动退回 v54 的整行揭载</div>
        <div class="vh-item"><b>口径未变</b>：仍是 Beta 1.1.2，不引入任何运行时依赖，动画全部落在 CSS 与既有动态层内</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">71</div><div class="m-label">v55 新增断言</div></div>
        <div class="metric"><div class="m-val">2632</div><div class="m-label">前端断言总数（v55 当时口径）</div></div>
        <div class="metric"><div class="m-val">46</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">2</div><div class="m-label">顺带修掉的真实缺陷</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v54 · 落地页动态层：把「图纸绘制」做成开场
       ======================================================== -->
  <div class="version" id="v54">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 体验增强（v54）</span>
      <span class="v-title">落地页不再是一张静态长图：尺寸线落笔、标题逐行揭载、右侧标尺走针</span>
      <span class="v-date">2026.11.01</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        之前落地页的动静都集中在中段——走马灯、实录播台、粒子层，首屏本身却是一张静态版面：
        标题直接出现，关键词高亮一开始就是满的，往下滚也没有位置感。
        这一版补的不是「更多动画」，而是把<strong>图纸绘制</strong>这件事本身做成开场：
        图幅尺寸线自左落笔、标题两行依次揭载、关键词底色扫过、右侧竖向标尺随滚动走针。
        所有新增都只加类，初态与终态写在 CSS 里——关掉脚本或 reduced-motion，页面仍是完整的完成态。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>图幅尺寸线</b>：标题上方一条 1px 尺寸线，两端各刻一度（右端朱红），中间一段等宽标注 <code>SHEET 01 · GRID 44 · 4 / 8 MIN</code>；入场自左向右落笔 0.95s</div>
        <div class="vh-item"><b>标题逐行揭载</b>：两行各自 <code>clip-path</code> 自上而下揭载（0 / 0.12s），与实录播台、页头揭载共用一套语言，不做位移上浮</div>
        <div class="vh-item"><b>高亮扫过</b>：关键词底色从 0% 扫到 100%（0.9s）。原来用 inset 内阴影，改由 <code>background-size</code> 承担——同一处视觉，多了一个「写上去」的动作</div>
        <div class="vh-item"><b>右侧区块标尺</b>：竖向刻度轨 + 4 格（功能 / 流程 / 数字 / 开始），朱红填充跟着滚动比例走，当前区块点亮并展开标签，点击直接走位。填充与点亮复用导航侦测的同一次滚动计算，不会出现「导航亮 02、标尺停在 01」</div>
        <div class="vh-item"><b>特性卡定位悬停</b>：顶缘朱红细线自左画出 + 编号方块反白成墨底纸字 + 标题下方划一道发丝线；坐标 chip 照旧</div>
        <div class="vh-item"><b>数据条刻度尺</b>：四个数字下方各落 12 格刻度（首格朱红），入视口逐格立起；数字滚动从 <code>setInterval</code> 步进改成 rAF 缓出，末位不再「跳一格」</div>
        <div class="vh-item"><b>真缺陷 ①：跨行被裁字</b>：<code>.ht-inner</code> 原是行内元素，跨行时 <code>clip-path</code> 只按首段行盒计算——390px 下标题折到第三行的「长。」整段消失。改为块级后复验通过，断言里也钉住了这一条</div>
        <div class="vh-item"><b>真缺陷 ②：窄屏报头竖排字</b>：390px 下报头五个元素挤到每个字占一行，「免费体验 / 登录 / 注册」被压成竖排。收掉版本章与主题色钮、锁住按钮不换行、logo 降到 14px，一行摆下且无横向溢出</div>
        <div class="vh-item"><b>口径未变</b>：仍是 Beta 1.1.2；不引入任何运行时依赖，动画全部落在 CSS 与既有模块内</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">55</div><div class="m-label">v54 新增断言</div></div>
        <div class="metric"><div class="m-val">2561</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">45</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">2</div><div class="m-label">顺带修掉的窄屏缺陷</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v52 · PDF 简历导入：把文本还原成行
       ======================================================== -->
  <div class="version" id="v52">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 可用性修复（v52）</span>
      <span class="v-title">PDF 简历导进来只剩一个「简历正文」板块</span>
      <span class="v-date">2026.11.01</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        为了演示，做了一份一页纸的 PDF 简历，导进去发现姓名、教育、技能全部为空，
        整份简历只拆出「简历正文」一个板块。查下去不是这份简历的问题，是一条链上的四道坎，
        每一道都踩在「按行」这件事上：<code>parsePdfText</code> 把所有文字用空格拼成一整段，
        丢掉了 pdf.js 给的 <code>hasEOL</code> 换行标记；而简历拆分完全靠「行」来认板块标题与姓名。
        一行到底之后，后面三件事必然一起失败。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>换行被丢掉</b>：<code>items.map(it =&gt; it.str).join(" ")</code> 把 384 个文本片段连成一行。改为按 <code>hasEOL</code> 还原 35 行，末行没有标记也不丢</div>
        <div class="vh-item"><b>字距把姓名拆散</b>：标题的字距让 pdf.js 逐字切分，拼出来是「林 砚 舟」。一行里≥2 处汉字空隙才判为字距、合并回去——单个空格可能是真的两栏分隔（「… 本科 上海」）</div>
        <div class="vh-item"><b>日期被当成列表符号</b>：<code>[0-9]+[.、]</code> 把「2026.03 — 2026.08 烛远科技」剥成「03 — 2026.08」，把「3.2s 降到」剥成「2s 降到」。有序标记限定 1–2 位数字且必须后跟空白</div>
        <div class="vh-item"><b>折行与条目边界</b>：一条经历的折行在下一行且不带符号时被整行丢弃；以年份开头的新条目反而被并进上一条，公司名与时间就这样没了。改为「符号 或 行首年份」开新条，其余并入上一条</div>
        <div class="vh-item"><b>技能匹配贪心</b>：<code>includes</code> 判定 JavaScript 命中 Java、MySQL 命中 SQL，一份前端简历的「已具备技能」里凭空多出一个 Java。改为词边界匹配（中文技能名不受限）</div>
        <div class="vh-item"><b>同源问题：报告两次分数</b>：同一场面试第二次进报告页会跳过同步请求、拿不到 payload，静默退化成本地引擎——服务端 66 分与本地 72 分同时存在，进步曲线还多一条记录。改为复用上一次的服务端结果</div>
        <div class="vh-item"><b>口径未变</b>：仍是 Beta 1.1.2；数据不出浏览器，PDF 解析仍在端侧完成</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">39</div><div class="m-label">v52 新增断言</div></div>
        <div class="metric"><div class="m-val">2471</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">43</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">0 → 13</div><div class="m-label">导入后条目数</div></div>
      </div>
    </div>
  </div>

  <div class="version" id="v51">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 布局修正（v51）</span>
      <span class="v-title">首屏那 76px 空白，是把顶栏高度数了两遍</span>
      <span class="v-date">2026.10.31</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        375px 下导航条下沿停在 100px，正文却从 176px 才开始，中间 76px 什么都没有。
        往上翻样式，答案是一行 <code>padding-top: calc(var(--hdr-h) + 50px)</code>——
        它假设「顶栏和导航条都浮在内容之上」。可顶栏是 <code>position: sticky</code>，
        本来就在文档流里占掉自己的高度，于是顶栏被算了两次。
        同一份错误假设还漏掉了另一半：641–900px 才出现的演示横幅，流内起点就在导航条底下，
        被压住 29px（顶栏算多了，横幅却没人管）。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>让位交给下层元素</b>：顶部留白统一由 header 之后的第一个流内块承担（<code>#view-app &gt; .wrap</code>），主内容区只保留常规内边距；横幅与正文谁在下面都不会被盖</div>
        <div class="vh-item"><b>导航条占用高度改成实测</b>：新增 <code>--navstrip-h</code>，由 <code>syncNavStrip()</code> 量出高度（桌面端写 0，让位自然退化为原来的 16px）——写死数值迟早和实际排版对不上</div>
        <div class="vh-item"><b>演示横幅不再被压</b>：641–900px 下横幅顶部 29px 此前藏在导航条背后，标题行整行看不见，现在完整可读</div>
        <div class="vh-item"><b><code>--hdr-h</code> 不再过期</b>：顶栏高度会随页面换行变化（320px 下从计划页切到面试页，81px → 55px），只在启动/切页量一次会留下旧值，导航条浮在顶栏下方 26px 的空中；改用 <code>ResizeObserver</code> 盯住顶栏与导航条</div>
        <div class="vh-item"><b>四个贴顶定位一并改为两级</b>：降级横幅、断网/慢网横幅、键盘态固定对话卡片此前只按「顶栏」算高度，窄屏会停在导航条背后或被它盖住</div>
        <div class="vh-item"><b>口径未变</b>：仍是 Beta 1.1.2；零投影 / 零圆角 / 零玻璃拟态 / 单一朱红，一条没破</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">38</div><div class="m-label">v51 新增断言</div></div>
        <div class="metric"><div class="m-val">2471</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">42</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">76 → 16</div><div class="m-label">首屏空白（px，375 宽）</div></div>
      </div>
    </div>
  </div>

  <div class="version" id="v50">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 检测修复（v50）</span>
      <span class="v-title">五处「界面说的和实际状态不一致」</span>
      <span class="v-date">2026.10.31</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        这一版不加功能，只做检测后的修复：把 12 个页面在 1280 / 375 两个宽度下走了一遍，
        逐页点过按钮，并把主流程真实跑通（5 轮面试 → 报告、MBTI 20 题、题库模考、投递看板、计划打卡、面经问答、命令面板）。
        发现的都不是「功能缺失」，而是<strong>同一件事有两种说法</strong>——
        计划页写着 0/21 项任务，工作台却说没有计划；面试界面写 0/5，存储里却是 1/5；
        策略卡标题说「已调整」，正文说「不启用」。逐条对齐，并补 41 项断言守住。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>计划只有一份真相</b>：基线计划首次读取即落盘，指挥台与计划页读同一份数据（不再出现「0/21 项任务」旁边的「--」）</div>
        <div class="vh-item"><b>重新面试真正作废上一轮</b>：轮次世代号 + 中止在途请求；真实通道与 Mock 通道同时生效，旧回复不再算进新会话</div>
        <div class="vh-item"><b>策略卡不再自相矛盾</b>：典型度不足时标题改为「本次按通用策略提问」，导语与按钮一并改口径</div>
        <div class="vh-item"><b>暗色主题仪表可辨</b>：空弧描边由 <code>--line</code> 换成 <code>--line-2</code>（#322D23 → #4B4433）</div>
        <div class="vh-item"><b>坏数据不炸整块</b>：<code>days</code> / <code>tasks</code> 逐层校验，坏项跳过、好项照常计数，指挥台不再只剩空壳</div>
        <div class="vh-item"><b>版本索引补齐</b>：v45–v50 六个版本此前未进「版本索引」，现已可点击跳转</div>
        <div class="vh-item"><b>口径未变</b>：仍是 Beta 1.1.2；零投影 / 零圆角 / 零玻璃拟态 / 单一朱红，一条没破</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">41</div><div class="m-label">v50 新增断言</div></div>
        <div class="metric"><div class="m-val">2471</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">41</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">5</div><div class="m-label">修复项</div></div>
      </div>
    </div>
  </div>

       Beta 1.1.2 · v49 · 视觉升级：工程规格书质感
       ======================================================== -->
  <div class="version" id="v49">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 视觉升级（v49）</span>
      <span class="v-title">从「后台模板」到「一张工程规格书」</span>
      <span class="v-date">2026.10.31</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        功能已经够用之后，界面反而更像通用后台：卡片各自浮动、强调色到处出现、数字与标签同一字号、
        空态只有一段灰字。这一版<strong>不加装饰</strong>——没有投影、没有圆角、没有玻璃拟态、没有渐变，
        而是把「高级感」放回版式与信息结构本身：等宽小标签对衬线大标题、表格数字竖排对齐、
        页头一条短墨规、零散卡片合并成有分区的规格表。
        工作台第一屏也从「把品牌口号再喊一遍」改成<strong>我的进度</strong>。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>指挥台（新）</b>：5 段仪表 + 4 格指标 + 下一步建议；无数据不写 0 分，单次记录不画趋势</div>
        <div class="vh-item"><b>仪表读数随状态切换</b>：面试中读本轮答题数，否则读已完成轮次，不会出现「有 3 次报告却显示 0」</div>
        <div class="vh-item"><b>页头成套</b>：短墨规 + 发丝线 + 30px 衬线标题，全部子页统一</div>
        <div class="vh-item"><b>侧栏与横幅收口</b>：分组等宽标签带分隔线；演示横幅从粉色告示牌收成图纸标题栏</div>
        <div class="vh-item"><b>入口卡编号化</b>：01–07 索引 + hover 角标，第 7 张补满整行不留半排空格</div>
        <div class="vh-item"><b>数据瓦片合并</b>：四个数字并成一张有分区的规格条，数字走表格对齐</div>
        <div class="vh-item"><b>空态有框法</b>：虚线图框 + 去色图标，不再是一段居中的灰字</div>
        <div class="vh-item"><b>纪律未破</b>：零投影 / 零圆角 / 零玻璃 / 单一朱红；新增 52 项断言守住这些</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">52</div><div class="m-label">v49 新增断言</div></div>
        <div class="metric"><div class="m-val">2471</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">40</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">新增运行时依赖</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v48 · 弹窗按钮不再被拖拽逻辑夺走点击
       ======================================================== -->
  <div class="version" id="v48">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 弹窗点击修复（v48）</span>
      <span class="v-title">密码输完了，点「进入」却没反应</span>
      <span class="v-date">2026.10.31</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        上一版把「慢网时按钮比程序先到」修好了，但反馈依旧是「进不去」。
        继续复现才发现是第二个、也是真正卡住的那一个：<strong>弹窗里的按钮收不到点击</strong>。
        弹窗支持拖动，抓手在没有 <code>.modal-head</code> 时会回退成<strong>整个弹窗</strong>；
        于是按下任何位置（包括「进入」按钮）都会触发指针捕获，后续的 <code>pointerup</code> / <code>mouseup</code> / <code>click</code>
        被整体重定向到弹窗本身，按钮上的 <code>onclick</code> 永远收不到事件。
        <strong>键盘回车提交反而正常</strong>——这正是它容易被误判成「网络慢」或「密码错」的原因。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>去掉指针捕获</b>：拖动改用 document 级监听，不再把弹窗内的事件「关在弹窗里」</div>
        <div class="vh-item"><b>可交互元素不拖</b>：在按钮、输入框、链接、标签上按下时直接不启动拖拽</div>
        <div class="vh-item"><b>拖拽本身保住</b>：在弹窗空白处按住仍可拖动，顺带修掉入场动画压住位移的老问题</div>
        <div class="vh-item"><b>影响面已核查</b>：开发者门禁与 Prompt 查看器两处弹窗，取消 / 进入 / 关闭均恢复鼠标可点</div>
        <div class="vh-item"><b>键盘兜底不变</b>：回车提交照旧，鼠标失效时仍有一条路进得去</div>
        <div class="vh-item"><b>回归有护栏</b>：新增 30 项断言，结构上禁止再引入指针捕获</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">30</div><div class="m-label">v48 新增断言</div></div>
        <div class="metric"><div class="m-val">2299</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">39</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">新增运行时依赖</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v47 · 启动守卫
       ======================================================== -->
  <div class="version" id="v47">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 启动守卫（v47）</span>
      <span class="v-title">「点了没反应」不是坏了，是按钮比程序先到</span>
      <span class="v-date">2026.10.31</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        反馈是「开发者模式进不去」。复现后发现问题不在开发者模式本身：
        演示页是单文件交付，约 0.9 MB 的样式与逻辑全部内联，主程序位于文档末尾；
        网络较慢时（GitHub Pages 冷启动实测约 20 秒）<strong>HTML 已经把按钮画出来了，主程序却还没执行</strong>，
        此时点击走的是内联 <code>onclick</code>，函数尚未定义——浏览器抛一条没人看得见的报错，界面纹丝不动。
        这一版加一层<strong>启动守卫</strong>：脚本未就绪时把状态写在 <code>html[data-boot]</code> 上，顶部给进度条、底部给一句实话；
        这段时间内的点击被拦下来并明确回一句「已记下」，主程序就绪后<strong>自动补发那一次点击</strong>，用户不必点第二遍。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>不再静默失败</b>：点下去要么生效，要么明确告诉你还在载入，不存在「点了像没点」</div>
        <div class="vh-item"><b>不用点第二遍</b>：被拦下的那一次点击会被记住，就绪后自动补发</div>
        <div class="vh-item"><b>慢网有话说</b>：20 秒仍未就绪则提示可刷新或改用国内镜像，而不是干等着</div>
        <div class="vh-item"><b>只拦该拦的</b>：仅拦截依赖主程序的 <code>onclick</code> 元素，普通链接与原生按钮照常</div>
        <div class="vh-item"><b>就绪即退场</b>：解除后摘掉监听、撤下提示，不参与任何后续交互</div>
        <div class="vh-item"><b>零依赖零体积</b>：守卫是 <code>&lt;head&gt;</code> 里一段内联逻辑，不新增文件、不新增请求</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">48</div><div class="m-label">v47 新增断言</div></div>
        <div class="metric"><div class="m-val">2269</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">38</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">新增运行时依赖</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v46 · 服务端语音转写
       ======================================================== -->
  <div class="version" id="v46">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 服务端语音转写（v46）</span>
      <span class="v-title">语音输入从「基本连不上」修成「真的能听见」</span>
      <span class="v-date">2026.10.30</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        浏览器自带的语音识别接口并不在本地跑，它把音频送到浏览器厂商的云端服务；在境内这段链路基本连不上，
        于是每次开麦都会以 <code>network</code> 报错收场，而提示语还写着「不支持语音识别」——把网络问题说成了能力问题。
        这一版不再依赖那条链路：<strong>点击麦克风后用浏览器录音，本地转成 16kHz 单声道 WAV，分段提交到本应用后端，由服务端调用同一条模型密钥完成转写</strong>。
        音频只在请求里存在一次，不落盘、不写库、不进日志；浏览器自带接口保留为后备，两者都不通时才降级为键盘输入。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>境内可用</b>：不再经过浏览器厂商的云端，走应用自己的后端，镜像站与 Pages 同一套</div>
        <div class="vh-item"><b>零新增依赖</b>：直接接收原始音频字节，不引入 multipart 解析库，线上镜像无需重装依赖</div>
        <div class="vh-item"><b>分段而不是整段</b>：6 秒一段、停顿 1.6 秒提前收尾，先说出来的话先落进输入框</div>
        <div class="vh-item"><b>不吞已输入内容</b>：开麦前打的字保留在原位，转写结果续在后面</div>
        <div class="vh-item"><b>不行就说不行</b>：后端未配置转写时直接告知「可直接键盘输入」，不做无谓重试</div>
        <div class="vh-item"><b>文案改实话</b>：删掉「浏览器内置识别」的说法，改为说明识别在哪里发生</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">67</div><div class="m-label">v46 新增断言</div></div>
        <div class="metric"><div class="m-val">2221</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">57</div><div class="m-label">后端单测</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">新增运行时依赖</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v45 · 交互确定性层
       ======================================================== -->
  <div class="version" id="v45">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 交互确定性层（v45）</span>
      <span class="v-title">从「设计得好看」到「在低端机上点得动」</span>
      <span class="v-date">2026.10.30</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        界面精致到一定程度之后，掉分的地方换了位置：不再是「有没有功能」，而是「点了之后多久有反应」。
        浏览器把这段等待量化为 <strong>INP</strong>，移动端的工程参考线是 200ms 以内。这一版不加功能，只把交互的确定性补齐：
        <strong>① 按压必须当帧可见</strong>——选项与评分卡的按下态绕开所有过渡，手指落下那一帧就变色，不依赖随后几十毫秒的 DOM 重建；
        <strong>② 评分理由与引用原话绑成一个折不断的证据单元</strong>——同一条朱红竖条贯通「原话 → 理由」，桌面展开态与手机半屏面板同一套；
        <strong>③ 面板先挂轻壳再填内容</strong>——遮罩、标题与占位行同步挂出（这一帧就能看到面板），原话与理由放到下一帧填，输入帧里不夹带 innerHTML 重活；
        <strong>④ 装饰动画按设备档位降级</strong>——窄屏、系统「减弱动效」、低端机（核心数 / 内存 / 省流量 / 慢网）三路判据，雷达描边与维度条生长一次性落位，功能性反馈（按下变色、展开态）全部保留；
        <strong>⑤ 现场读数</strong>——<code>window.__bpPerf</code> 记录交互事件时序与长任务，把「快不快」变成可量出来的数字，不上报任何内容。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>点了就有反应</b>：按下态<b>无过渡</b>，任何设备上都在同一帧到位，不会「点了没反应→再点一次」</div>
        <div class="vh-item"><b>证据折不断</b>：原话与理由共用一条左色条与同一底色，一眼看出「这句话导致了这个分」</div>
        <div class="vh-item"><b>面板不晚到</b>：轻壳同帧出现，内容下一任务填充；只推迟整块面板反而会让它晚一帧</div>
        <div class="vh-item"><b>动画会看设备</b>：窄屏 / 减弱动效 / 低端机自动停用装饰描边，功能反馈一个不减</div>
        <div class="vh-item"><b>可现场核验</b>：<code>__bpPerf.summary()</code> 给出 p50 / p98 / 最差 / 长任务计数</div>
        <div class="vh-item"><b>面板不拖着背景滚</b>：<code>overscroll-behavior: contain</code> 隔离面板与底层页面的滚动</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">73</div><div class="m-label">v45 新增断言</div></div>
        <div class="metric"><div class="m-val">2154</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">43</div><div class="m-label">前端模块</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">ESLint 错误</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v44 · 感知密度层
       ======================================================== -->
  <div class="version" id="v44">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 感知密度层（v44）</span>
      <span class="v-title">把已经存在的纵深，摆到三秒能被看见的位置</span>
      <span class="v-date">2026.10.30</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        前几轮把纵深堆出来了：可解释评分、实时锚点、Agent 分歧、人格参数、三级降级。问题换了一个——<strong>这些纵深需要点开三层才看得见</strong>。
        这一版不加功能，只做一件事：把已有信息按「先结论、后依据」重排，并修掉沿途发现的两处真实缺陷。
        报告页首屏从「五个数字」改成<strong>一句诊断 + 五维轮廓</strong>：诊断句由确定性规则拼装（取最强/最弱与分差三档），同一份报告刷新多少次都是同一句话；
        维度卡改为<strong>点阵 + 数字双轨</strong>（点阵是视觉冗余，数字保留给读屏与打印）；分歧标记只标显著（≥10 分）且<strong>同一轮只标一次</strong>——
        多个维度常常引用同一段原话，同一个事实不该被说四遍。雷达补一条<strong>目标线</strong>，并在图下写明它是「本产品的达标参考值，不是人群统计」。
        学习路径从一串条目改成纵向时间线。
        MBTI 结果页把「<strong>你的面试策略已调整</strong>」提到四维依据之前，先给结论再给依据；测评过程加四段维度进度条；选项按钮抬到 48px。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>一句诊断，可复现</b>：规则拼装（最强 / 最弱 / 分差三档），不调模型、不随机</div>
        <div class="vh-item"><b>分歧落到卡上</b>：≥10 分才标，同轮只标一次，点开看两个镜头的原话与理由</div>
        <div class="vh-item"><b>降级记账</b>：演练触发后写进报告「降级记录」（第几轮 / 演练触发 / 本地引擎接管），没触发就整块不渲染</div>
        <div class="vh-item"><b>证据分散</b>：五个维度按相关度各挑一轮（抗压优先压力轮），不再五条全指向同一段话</div>
        <div class="vh-item"><b>修缺陷一</b>：锚定标签此前先 insertBefore 后入 DOM，参考节点不在父节点 → 抛错被吞，标签从未出现（v42 遗留）</div>
        <div class="vh-item"><b>修缺陷二</b>：窄屏顶栏固定 56px + 允许换行 → 内容溢出压住底部导航；改为高度自适应并回写 --hdr-h</div>
      </div>
      <div class="cat" style="margin-top:18px">
        <div class="cat-title"><span class="cat-improve">v44.1</span> 语音输入链路：把「坏了」拆成「卡在哪一环」</div>
        <ul>
          <li><b>错误不再原样甩给访客</b>：此前任何异常都弹同一句「语音识别出错：xxx」，把浏览器错误码直接摆到脸上。现在按错误码分型——权限被拒给地址栏的具体操作路径，没有麦克风指向设备，网络不通说明这个接口走厂商云端识别并给出键盘输入替代；<b>「没开口」与「主动停止」属于正常状态</b>，不再弹红字。</li>
          <li><b>转写不再吞掉已经打好的字</b>：开麦前先记下输入框里的内容，转写接在后面；此前是直接赋值覆盖，先打字再补语音，原文会被整段清掉。</li>
          <li><b>浏览器自己结束识别时会自动续接</b>：静音或约 60 秒后浏览器会结束识别，此前麦克风就此熄灭、访客以为坏了。现在只要还在听、且未超过上限，就悄悄接上，并把「自动续接 n/3」写在状态条上。权限 / 设备 / 网络这类不可恢复的错误立即停止，不再做三次无意义重试。</li>
          <li><b>不再假成功</b>：收尾判断从「输入框有没有字」改成「本次是否真的转写出内容」。权限被拒时输入框里若还留着原文，此前会提示「语音转写完成」，是假成功。</li>
          <li><b>开发者模式新增「语音输入自检」</b>：一键列出安全上下文、识别引擎、麦克风接口、偏好开关、最近错误码，并给出「该修哪一环」的结论；状态徽标从笼统的「条件就绪」细分为引擎缺失 / 协议受限 / 权限被拒 / 网络受限 / 无可用设备。</li>
          <li><b>文案诚信修正</b>：不再把这条链路称作「本地 ASR」——Chrome / Edge 的该接口走厂商云端识别，音频虽不出浏览器内嵌的对话面板，但并非端侧推理，说成本地并不准确。</li>
        </ul>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">129</div><div class="m-label">v44 系列新增断言</div></div>
        <div class="metric"><div class="m-val">2154</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">35</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">375</div><div class="m-label">窄屏实测宽度（px）</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v43 · 人格参数化层（MBTI → 面试输入参数）
       ======================================================== -->
  <div class="version" id="v43">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 人格参数化 · MBTI 接入面试（v43）</span>
      <span class="v-title">把 MBTI 从「第 10 个功能」改成面试的输入参数</span>
      <span class="v-date">2026.10.30</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        MBTI 之前是一个孤岛：测完给四个字母和一段通用建议，和面试没有关系。这一轮把它接成两条线——<strong>面试的提问策略</strong>与<strong>报告的解释维度</strong>。
        做法不是把「用户是 INTJ」写进提示词，而是把四个维度折算成<strong>五个带方向与强度的行为参数</strong>（结构化追问 / 开放式施压 / 情绪适配 / 举证偏好 / 细节偏好），
        每个参数都保留来源维度与百分比，可逐条追溯。于是同一句回答，在不同参数下会问出不同的问题：偏 J 的人被追问「你的决策依据是什么」，偏 P 的人被问「条件突变你怎么调整」；
        偏 F 的人遇到的第一次施压会<strong>降一档强度</strong>，并在追问下方显性标注「本轮压力强度已按你的情绪偏好下调一档（偏 F 62%）」。
        报告页新增「人格 - 表现关联」：五维得分与参数逐条对照，判定分三种——一致 / 值得注意 / <strong>无显著关联</strong>。
        第三种是刻意保留的：承认「这一维跟你的人格没关系」比硬编一个故事更可信。<strong>人格参数从不参与打分</strong>，评分引擎里没有任何 MBTI 痕迹。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>面试里可感知</b>：Mock 通道奇数轮改出题、真实通道注入提示词后缀，两种通道都有痕迹</div>
        <div class="vh-item"><b>可审计</b>：参数→策略→影响三段可查，报告里能看到「哪一维导致了什么」</div>
        <div class="vh-item"><b>显性适配</b>：压力强度被调整时，在追问下方直接写出来，不藏在黑盒里</div>
        <div class="vh-item"><b>测评可溯源</b>：每个维度都能展开看「是哪 5 题导致的」，含题目 / 你的选择 / 贡献分</div>
        <div class="vh-item"><b>断点续答</b>：20 题分段（维度 x/4 · 第 y/5 题），每答一题落盘，中途退出可接着答</div>
        <div class="vh-item"><b>诚实降级</b>：无测评、或四维典型度都低于 20 时，不启用策略、不做关联推断、胶囊不显示</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">63</div><div class="m-label">v43 新增断言</div></div>
        <div class="metric"><div class="m-val">1952</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">33</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">5</div><div class="m-label">人格行为参数</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v42b · 降级演练（主动失效）
       ======================================================== -->
  <div class="version" id="v42b">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 降级演练 · 主动失效（v42b）</span>
      <span class="v-title">把「三级降级」从文档承诺变成可当场复现的动作</span>
      <span class="v-date">2026.10.29</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        三级降级此前一直写在文档里，但现场没有稳定的办法演示它——靠断网不可控，靠超时要等 60 秒。这一轮补上缺失的一环：<strong>一个显式的演练开关</strong>。开启后，<strong>下一次</strong>面试官提问必然失败一次，走的是与真实故障<strong>完全相同</strong>的兜底分支：顶部出现非阻塞横幅「<b>技术面</b> Agent 已降级至本地推理模式（演练触发 · 模拟网关无响应）· 面试不中断，评分口径与在线一致」，不弹窗、不锁输入，对话继续往下走。<strong>这不是伪造结果</strong>——失败是真的抛出，兜底内容出自与服务端同构的本地评分引擎，口径不变；横幅上如实标注「演练触发」，不假装发生了真实故障。若当前本就是本地模式，开关不会被悄悄挂着，而是直接提示「降级演练需在接入真实模型后触发」。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>可复现</b>：无需断网、无需等待超时，一键让下一次提问失效</div>
        <div class="vh-item"><b>用完即解</b>：触发后自动解除，不会污染后续提问</div>
        <div class="vh-item"><b>角色化文案</b>：HR 面试官 / 技术面试官 / 压力面试官 → HR 面 / 技术面 / 压力面</div>
        <div class="vh-item"><b>非阻塞</b>：<code>role="status" aria-live="polite"</code> + sticky 贴顶，实测输入框未被禁用、无弹窗</div>
        <div class="vh-item"><b>不留孤儿节点</b>：降级时同步清理未落题的锚定标签</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">35</div><div class="m-label">v42b 新增断言</div></div>
        <div class="metric"><div class="m-val">1887</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">32</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">652</div><div class="m-label">共享全局符号</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v42 · 移动端信息优先级裁剪
       ======================================================== -->
  <div class="version" id="v42">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 移动端信息优先级裁剪（v42）</span>
      <span class="v-title">首屏只留价值主张 + 一个主 CTA · 圆桌改角色 chips · 报告渐进披露 · 键盘可见</span>
      <span class="v-date">2026.10.29</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        上一轮把「不横向溢出」做完了，这一轮处理更前置的问题：<strong>信息密度</strong>。实测 iPhone 尺寸下落地页滚动高度 <strong>5735px ≈ 7 屏</strong>——功能矩阵一屏就 1926px，访客 10 秒内根本看不到「面试闭环」这条主线。做法是<strong>按优先级裁剪，而不是全量堆叠</strong>：<strong>① 首屏只留一句话价值主张 + 一个主 CTA</strong>（文案换成「上传简历，开始一场可溯源的模拟面试」），功能矩阵、四步流程、关键数字、运行规格、面试实录五个密集模块收成一行折叠条，默认收起、点击展开；⌘K 提示与数字条在手机上直接隐藏。<strong>② 圆桌去并排</strong>——五张 Agent 卡片在窄屏改为横向可滑的角色 chips（150–220px），「多 Agent 同屏」在桌面上是丰富度，在手机上只是噪音。<strong>③ 报告卡片渐进披露</strong>——每张卡默认只给「维度 + 分数 + 一句证据摘要」，点开才是底部半屏面板：顶部引用你的原话，下方评分理由与两位面试官的分歧判断，底部一个「定位到对话」按钮把它接回面试现场。<strong>④ 键盘是体验级细节</strong>——不依赖 100vh，一切以 visualViewport 为准：可视高度写进 <code>--app-vh</code>、遮挡量写进 <code>--kb-h</code>，输入栏 sticky 贴底且字号 16px（绕开 iOS 聚焦缩放）；键盘弹起时布局视口不会变，文档也滚不动，所以焦点在回答框时进入「输入态」，让上方辅助信息暂时让位，保证发送按钮与最近几条对话同屏。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>落地页从 7 屏压到 2.1 屏</b>：375px 宽下滚动高度 5735px → 1706px，首屏主 CTA 在 607px 处可见</div>
        <div class="vh-item"><b>折叠不是删除</b>：五个模块保留在原 DOM（打印、复制链接、测试断言全部照旧），仅窄屏用 CSS 收起</div>
        <div class="vh-item"><b>键盘实测三档</b>：375×812 / 414×896 / 360×640，模拟 336px 软键盘后输入栏底边均在可视区内</div>
        <div class="vh-item"><b>诚实降级仍在</b>：模型未复述原话时，锚定标签显示「未直接复述」，不伪造因果</div>
        <div class="vh-item"><b>桌面端零变化</b>：所有裁剪规则锁在 ≤640px，宽屏仍是一次性展开的完整版</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">38</div><div class="m-label">v42 新增断言</div></div>
        <div class="metric"><div class="m-val">1853</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">31</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">646</div><div class="m-label">共享全局符号</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v41 · 移动端适配层
       ======================================================== -->
  <div class="version" id="v41">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 移动端适配层（v41）</span>
      <span class="v-title">窄屏单栏任务流 + 导航收敛 + 对话区自适应 + 交互去 hover 化</span>
      <span class="v-date">2026.10.29</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        移动端不做「缩小版桌面」，而是把多栏布局<strong>收敛成单栏任务流</strong>。先用无头浏览器在 320 / 375 / 390 / 414 四个宽度下逐页实测（12 个页面 × 4 个宽度 = 48 组），把问题按「阻断闭环」与「体验损耗」分开处理：<strong>① 阻断类</strong>——RAG 页按钮在 320px 撑出 37px 横向滚动、面试对话区被上方 900px 面板顶到首屏之外、AI 悬浮球压住「发送」按钮、软键盘弹出时输入框被遮；<strong>② 损耗类</strong>——底部导航 10 项需横滑才能找齐、代码沙盒与模型面板占掉 700px、评分评语依赖 hover 导致触摸端完全不可达。<strong>③ 结构收敛</strong>——窄屏底栏收敛为 5 格（工作台 / 面试 / 计划 / 我的 / 更多），6 个次级页面收进「更多」（复用命令面板，全部入口一键可达且可搜索）；面试页把代码沙盒折叠为一行，页面头压到标题 + 两行说明；对话区高度改为按「实测顶部位置 → 视口底部」动态占满，软键盘起落时重算。<strong>④ 交互去 hover 化</strong>——评语直接可见，hover 气泡在触摸端隐藏；锚点 chip 扩展命中区；报告 6 个操作按钮改两列网格，不再各占一行。<strong>⑤ 滚动克制</strong>——流式输出不再每来一个 token 就滚到底，用户上翻回看历史时不会被拽回。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>四个宽度实测，不是拍脑袋改</b>：320/375/390/414 逐页扫描横向溢出，改完复测 48 组全部为 0</div>
        <div class="vh-item"><b>手机上没有「第 7 个 Tab」</b>：底栏 5 格每格 ≥44px，次级页面走「更多 → 可搜索面板」，不用横滑找入口</div>
        <div class="vh-item"><b>输入框永远在视口内</b>：对话区按实测剩余高度占满，键盘弹起时 visualViewport 变化触发重算，输入行不会被遮</div>
        <div class="vh-item"><b>顶栏变高也不遮挡</b>：顶栏实测高度写入 --hdr-h，导航条与内容区跟随，不再假设 header 恰好 56px</div>
        <div class="vh-item"><b>刘海屏与横屏都算过</b>：viewport-fit=cover + env(safe-area-inset-*)，横屏按视高收缩对话区</div>
        <div class="vh-item"><b>不动桌面端</b>：所有收敛规则都在 ≤640/≤900 断点内，桌面布局与交互零变化</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">47</div><div class="m-label">v41 新增断言</div></div>
        <div class="metric"><div class="m-val">1815</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">30</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">627</div><div class="m-label">共享全局符号</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v40 · 可解释性交互层
       ======================================================== -->
  <div class="version" id="v40">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 可解释性交互层（v40）</span>
      <span class="v-title">面试中实时锚点 + Agent 分歧视图 + 语音流式转写 + 表达节奏</span>
      <span class="v-date">2026.10.29</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        把「可解释」从报告里的一个特性，前移成面试过程中就能看见的交互。<strong>① 实时锚点</strong>——每段回答落屏即由 <code>anchorPhrases()</code> 抽出「技术点 / 量化 / 动作」三类可追问片段并原地高亮，气泡下方列出锚点 chip；面试官追问落地后，被引用的那句话在两侧同时点亮（追问气泡尾部回挂「⚓ 追问锚点」，时间线同步记录锚定关系）。<strong>② Agent 分歧视图</strong>——同一份回答由技术面与 HR 面<strong>两套镜头独立打分</strong>（<code>lensScore</code>：技术面看原理 / 量化 / 取舍，HR 面看结构 / 协作 / 动机），报告并排展示两位面试官的分数、理由与各自引用的原话，分歧 ≥8 分记为显著分歧，并给出平均 / 最大分歧度。<strong>③ 语音流式转写</strong>——语音输入由「说完填框」升级为 <code>interimResults</code> 流式：边说边出字、实时字幕条显示已转写字数与语速，停顿 1.6 秒自动提交，面试官基于流式文本继续追问。<strong>④ 表达节奏</strong>——把每段语音的字数与时长记为本地时间戳，报告新增「语速 / 平均停顿 / 2 秒以上停顿 / 口头禅密度」四项表达层指标与改进建议。<strong>⑤ 报告逐块呈现</strong>——报告 DOM 一次成型，区块按节奏依次入场（<code>prefers-reduced-motion</code> 下静态落位），维度评语与分歧理由逐行浮现。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>判断有锚点</b>：「你刚才提到用了 Redis 做缓存，但没说明缓存击穿的处理策略」——同时把你原话里的「Redis」高亮出来，每一步追问都能指回你的原句</div>
        <div class="vh-item"><b>多 Agent 不是轮流提问</b>：技术面 78 分 / HR 面 52 分，同一份回答两套理由并排，10 秒看懂分歧从哪来</div>
        <div class="vh-item"><b>AI 在听的时候就在想</b>：语音边说边转写，停顿即自动提交并触发追问，而不是「说完再等结果」</div>
        <div class="vh-item"><b>从内容评估到表达评估</b>：语速、2 秒以上停顿次数、口头禅密度——全部来自本机时间戳，音频不出浏览器</div>
        <div class="vh-item"><b>不伪造因果</b>：模型没复述原话时，锚点说明降为灰态「未直接复述原话片段」，不硬指一句</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">49</div><div class="m-label">v40 新增断言</div></div>
        <div class="metric"><div class="m-val">1768</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">29</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">618</div><div class="m-label">共享全局符号</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v39 · 反馈/容错/模式提示/空状态/无障碍/导出
       ======================================================== -->
  <div class="version" id="v39">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 反馈闭环层（v39）</span>
      <span class="v-title">免责声明 + 骨架屏 + 表单校验 + 移动端触控 + 离线降级提示 + 空状态 + 无障碍 + 导出补全</span>
      <span class="v-date">2026.10.29</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        依据一份覆盖产品逻辑 / UI / 移动端 / 工程 / 可访问性 / 边界容错 / 文案 / 部署 八个维度的改进检查报告，把「看起来能用」补成「边界上也稳」：<strong>① 免责与反馈</strong>——RAG 回答区加「AI 生成 · 仅供练习 · 不保证准确」声明，MBTI 结果加「非专业心理测评、仅供参考」提示；<code>askRag</code> / 简历改写 / 面试初始化 / 简历解析四处接入 <code>bpSkeleton</code> 骨架屏与内联错误。<strong>② 表单校验</strong>——新增 <code>store.guardField / clearFieldError</code>（内联错误 + <code>aria-invalid</code> + toast + 聚焦），简历 / 匹配 / 面经 / 面试接入必填与最小长度校验。<strong>③ 移动端与溢出</strong>——全局 <code>overflow-wrap</code> 防横向溢出，按钮 <code>min-height:44px</code> 满足触控尺寸。<strong>④ 模式提示与登录安全</strong>——新增 <code>initNetworkMonitor()</code>，断网 Toast 降级本地 Mock、恢复即提示，状态胶囊加 <code>.offline</code>；登录弹窗加「请勿使用真实密码 · 演示级系统」警告。<strong>⑤ 空状态</strong>——投递看板无记录时渲染引导卡。<strong>⑥ 无障碍</strong>——导航激活态加 <code>aria-current</code>、报告雷达旁加 <code>.sr-only</code> 维度数值表、顶栏加 ⌘K 命令面板入口。<strong>⑦ 导出补全</strong>——报告 CSV（UTF-8 BOM）、个人数据全量导出。<strong>⑧ 术语降噪与 SEO</strong>——去除「多 Agent 驱动的」字样，补 <code>og:url</code> / <code>canonical</code> / keywords。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>断网也说得清</b>：离线时提示「已降级本地 Mock」，恢复即提示，状态胶囊同步变灰</div>
        <div class="vh-item"><b>不再拿真实密码</b>：登录弹窗醒目提示「演示级系统，请勿使用真实密码」</div>
        <div class="vh-item"><b>空看板有出口</b>：投递看板无记录时给引导卡，直达真实岗位页</div>
        <div class="vh-item"><b>读屏能读数值</b>：雷达图旁补 <code>.sr-only</code> 维度数值表，色弱 / 读屏可访问</div>
        <div class="vh-item"><b>数据能带走</b>：报告 CSV + 个人数据全量导出，端侧生成零外传</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">18</div><div class="m-label">v39 新增断言</div></div>
        <div class="metric"><div class="m-val">1719</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">28</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">592</div><div class="m-label">共享全局符号</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">ESLint 错误</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v38 · 求职材料与岗位闭环增强
       ======================================================== -->
  <div class="version" id="v38">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 求职材料闭环（v38）</span>
      <span class="v-title">简历自定义板块 + 模板库 + PDF 自动拆分填入 + AI 建议分块可视化 + 真实岗位一键入看板 + MBTI 结果页重做</span>
      <span class="v-date">2026.10.28</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        把简历从「一个文本框」升级成「结构化求职材料」，并让岗位推荐真正通往投递：<strong>① 简历自定义板块</strong>——新增 <code>fm_jobseek.sections</code>（实习 / 志愿 / 证书 / 荣誉 / 技能 / 作品等预设），编辑器 <code>renderResumeSectionsEditor</code>，导出 PDF 时经 <code>resumeSectionsPdf</code> 带出。<strong>② 模板库</strong>——<code>RESUME_TEMPLATES</code> 四套（标准校招 / 实习导向 / 科研学术 / 社招进阶）。<strong>③ PDF 导入自动拆分</strong>——<code>RESUME_SPLIT_HEADERS</code> 正则映射 + <code>splitResumeText</code> / <code>splitSegmentItems</code>，LLM 兜底拆分，全程复用端侧 <code>parsePdfText</code>（原文不出浏览器）。<strong>④ AI 建议分块可视化</strong>——<code>resumeAdviceVisual</code>（donut + 六维 hbar）+ 关键词 chips + <code>chunkMarkdown</code>，把大段文字切成卡片。<strong>⑤ 今日推荐换真实岗位</strong>——<code>today.js</code> 改取 <code>REAL_JOBS</code>（日期种子稳定 + <code>rotateTodayPicks</code> 换一批），卡片带薪资 / 城市 / 标签 / 官网，一键「添加到看板」（去重写 <code>fm_apps</code> 并带 url）。<strong>⑥ MBTI 结果页重做</strong>——类型英雄卡 + 四维小卡 + 双极条 + 雷达 + 典型度条。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>简历能分块填</b>：自定义板块 + 四套模板，导出 PDF 自动带上</div>
        <div class="vh-item"><b>PDF 导入自动拆分</b>：上传即按板块拆分填入，端侧解析零外传</div>
        <div class="vh-item"><b>建议不再一大段</b>：AI 建议切成卡片 + 可视化图表</div>
        <div class="vh-item"><b>推荐真能投</b>：今日推荐换成真实岗位，带官网，一键进看板</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">1700</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">27</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">585</div><div class="m-label">共享全局符号</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">ESLint 错误</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v37 · 可视化基建
       ======================================================== -->
  <div class="version" id="v37">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 可视化基建（v37）</span>
      <span class="v-title">通用图表模块 · 七个组件零第三方依赖（纯 SVG 字符串）</span>
      <span class="v-date">2026.10.28</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        抽出统一的图表基建 <code>features/charts.js</code>（零第三方库、纯 SVG 字符串），七个组件：<code>donut</code> / <code>hbar</code> / <code>bipolar</code> / <code>radar4</code> / <code>trend</code> / <code>column</code> / <code>progressDots</code>，供简历建议 / MBTI / 报告 / 岗位等模块复用，不再各自手绘。三条硬约束：<strong>颜色只走 CSS 变量</strong>（随主题反转，禁硬编码色值）、<strong>悬停提示复用 <code>[data-tip]</code> 全局接管</strong>（勿自绑事件）、<strong>数值统一过 <code>chartNum / chartClamp</code></strong>，空数据返回 <code>.chart-empty</code> 空态。可点击图表用 <code>onclick</code> 回调（如岗位条形定位、报告维度条直达追问）。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>图表有统一底座</b>：七个纯 SVG 组件，零第三方库</div>
        <div class="vh-item"><b>主题能反转</b>：颜色只走 CSS 变量，跟随明暗主题</div>
        <div class="vh-item"><b>空数据不崩</b>：统一返回 <code>.chart-empty</code> 空态</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">7</div><div class="m-label">图表组件</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">第三方依赖</div></div>
        <div class="metric"><div class="m-val">0</div><div class="m-label">ESLint 错误</div></div>
      </div>
    </div>
  </div>

  <!-- ========================================================
       Beta 1.1.2 · v36 · 求职闭环增强
       ======================================================== -->
  <div class="version" id="v36">
    <div class="version-head">
      <span class="v-tag">Beta 1.1.2 · 求职闭环增强（v36）</span>
      <span class="v-title">求职信息档案 + 简历 A4 导出 + MBTI 测评页 + 真实岗位库 + 对话式匹配 + 报告追问</span>
      <span class="v-date">2026.10.27</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        把「训练」与「求职」真正接上：<strong>① 求职信息档案</strong>（<code>fm_jobseek</code>）+ <code>aiResumeAdvice</code>（LLM，规则兜底）+ 简历 A4 打印导出（<code>buildResumeHtml</code> / <code>exportResumePdf</code>，<code>window.print()</code> 零依赖，弹窗被拦降级隐藏 iframe）。<strong>② 新模块 / 新页面 MBTI</strong>——<code>features/mbti.js</code>，4 维 × 20 题，<code>computeMbtiResult</code> 确定性（全同意→ESTJ / 全反对→INFP），结果写回 <code>fm_profile.mbti</code> 并即时刷新个人中心。<strong>③ 真实岗位</strong>——<code>career.js</code> 加 <code>REAL_JOBS</code> 16 条真实岗位（每条直达企业招聘官网）+ <code>matchJobToResume</code>（简历匹配 + MBTI 契合 +5）+ <code>aiInterviewAdvice</code>。<strong>④ 对话式匹配</strong>——<code>match.js</code> 加 4 轮追问 <code>MATCH_QA_STEPS</code> / <code>applyQaEvidence</code>，按 JD 技能覆盖率实时重算。<strong>⑤ 报告追问</strong>——<code>report.js</code> 沉淀 <code>lastReportData</code>，小助手注入报告上下文；无模型时 <code>ruleReportAnswer</code> 基于真实数据作答。
      </div>
      <div class="v-highlights">
        <div class="vh-item"><b>求职有档案了</b>：求职信息集中管理，简历可导出打印 PDF</div>
        <div class="vh-item"><b>MBTI 能测能存</b>：4 维 20 题，结果写回个人中心</div>
        <div class="vh-item"><b>岗位是真链接</b>：16 条真实岗位直达企业官网，带 MBTI 契合加分</div>
        <div class="vh-item"><b>匹配会追问</b>：4 轮对话式追问，按 JD 覆盖率实时重算</div>
        <div class="vh-item"><b>报告能追问</b>：小助手基于真实报告数据回答</div>
      </div>
      <div class="v-metrics">
        <div class="metric"><div class="m-val">1625</div><div class="m-label">前端断言总数</div></div>
        <div class="metric"><div class="m-val">26</div><div class="m-label">jsdom 套件</div></div>
        <div class="metric"><div class="m-val">12</div><div class="m-label">功能页</div></div>
        <div class="metric"><div class="m-val">40</div><div class="m-label">前端模块</div></div>
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
        <div class="vh-item"><b>命令面板会记忆</b>：最近访问置顶、子序列模糊匹配、面试页专属指令，访客演示一秒直达</div>
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
        <div class="vh-item"><b>⌘K 直达一切</b>：17 项命令分组呈现，过滤 + 全键盘，访客演示时可一秒跳到任意功能页</div>
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
        Beta 版本收尾。工作台从"半成品拼接"升级为"干净的产品首页"：项目材料收进开发者模式，只服务访客；6 张快速入口卡片和 4 张数据看板卡全部可点击；新增"今日推荐岗位"制造每次打开的新鲜感。
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
        把"验证专区"正式升级为"开发者模式"。新增运行环境检测、性能指标、诊断日志、5 个开发者工具，让访客可以一站式验证技术能力，不再只是"看图"。
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
          <li>"验证专区"全站改名为"开发者模式"</li>
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
      <span class="v-title">验证专区（加密 + 一键进入）</span>
      <span class="v-date">2026.09</span>
    </div>
    <div class="version-body">
      <div class="v-summary">
        新增加密的"验证专区"，把技术验证内容（工程自检、MCP 运行时验证、技术架构、评分映射）从普通用户视野中隔离。提供三种进入方式：URL 一键、密码 <code>FM2026</code>、快捷键 <code>Ctrl+Shift+J</code>。
      </div>

      <div class="cat">
        <span class="cat-title cat-new">✨ 新增功能</span>
        <ul class="changelog">
          <li><b>验证专区视图</b>：<code>#/evaluator?key=FM2026</code> 独立视图</li>
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
          <li>普通 dashboard 的"MCP 工具清单"增加提示行，指向验证专区</li>
          <li>落地页 CTA 区域下方新增"复核入口"按钮</li>
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
        目标是让"AI Native"从口号变成可现场验证的运行时代码。新增 MCP 实时控制台、代码面试沙盒、本地 PII 脱敏预览、工程自检面板——每一项都能被访客当场点击验证。
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
        针对能力评估标准中的「AI 技术深度」与「用户体验」做细颗粒度补齐：实时能力追踪器、Prompt 查看器、进度指示器、报告分享导出、降级 UI、Agent 决策理由。
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
