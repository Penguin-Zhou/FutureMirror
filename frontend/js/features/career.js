"use strict";
/* ============================================================
 * 13. 职业探索：岗位数据库 + 匹配引擎
 * ============================================================ */
const CAREER_DB = [
  {
    id: "frontend", name: "前端开发工程师", icon: "🖥️",
    majors: ["计算机/软件工程", "电子信息"],
    interests: ["写代码", "做设计"],
    skills: ["JavaScript", "TypeScript", "React", "Vue", "Node.js", "Git", "HTML", "CSS"],
    coreSkills: ["HTML/CSS/JavaScript", "TypeScript", "React 或 Vue", "前端工程化", "浏览器原理"],
    bonus: ["Next.js", "小程序开发", "性能优化经验", "组件库开发"],
    desc: "负责 Web/小程序/H5 界面的设计与实现，关注用户体验与交互性能。",
    path: ["HTML+CSS+JS 基础", "选一个框架深入学习（React/Vue）", "完成 1 个完整项目并上线", "学习工程化与性能优化", "刷面试题 + 积累项目"],
  },
  {
    id: "backend", name: "后端开发工程师", icon: "⚙️",
    majors: ["计算机/软件工程"],
    interests: ["写代码"],
    skills: ["Java", "Python", "Go", "MySQL", "Redis", "Docker", "Linux", "消息队列", "Kafka"],
    coreSkills: ["至少一门后端语言", "MySQL 索引与事务", "Redis 缓存设计", "分布式基础", "Linux 运维"],
    bonus: ["高并发经验", "微服务架构", "消息队列实践", "Kubernetes"],
    desc: "负责服务端架构设计与接口开发，关注性能、稳定性与可扩展性。",
    path: ["选一门语言深入（Java/Go/Python）", "掌握 MySQL + Redis 核心用法", "理解分布式基础概念", "做 1 个高并发项目", "学习系统设计与八股"],
  },
  {
    id: "pm", name: "产品经理", icon: "📱",
    majors: ["计算机/软件工程", "商科/管理", "设计/视觉", "其他"],
    interests: ["做产品", "带团队", "写文档"],
    skills: ["Figma", "Axure", "文案写作", "Excel"],
    coreSkills: ["需求分析与优先级判断", "原型设计（Figma/Axure）", "PRD 文档撰写", "数据驱动思维", "跨团队沟通"],
    bonus: ["用户调研经验", "AB 实验设计", "AI 产品认知", "项目管理工具"],
    desc: "负责产品从需求发现到上线的全流程，是用户、设计和开发的桥梁。",
    path: ["学习需求分析方法论", "掌握 Figma/Axure 原型工具", "写 2 份完整 PRD 作品集", "做 1 次真实用户调研", "准备产品面试案例"],
  },
  {
    id: "data", name: "数据分析师", icon: "📊",
    majors: ["数学/统计", "计算机/软件工程", "商科/管理"],
    interests: ["分析数据", "写文档"],
    skills: ["SQL", "Python", "Excel", "Tableau", "数据可视化"],
    coreSkills: ["SQL 熟练查询", "Excel 高级功能", "Python/R 数据分析", "至少一种 BI 工具", "统计学基础"],
    bonus: ["AB 实验经验", "用户画像分析", "营收预测模型", "因果推断"],
    desc: "通过数据挖掘业务洞察，为产品决策和运营策略提供量化支持。",
    path: ["SQL 多表关联 + 窗口函数", "Python pandas 数据处理", "Tableau/PowerBI 看板搭建", "做 1 个完整分析报告", "学习 AB 实验方法论"],
  },
  {
    id: "algo", name: "算法工程师", icon: "🧠",
    majors: ["计算机/软件工程", "数学/统计"],
    interests: ["训练模型", "写代码"],
    skills: ["Python", "机器学习", "深度学习", "PyTorch", "TensorFlow"],
    coreSkills: ["扎实的 ML/DL 基础", "PyTorch/TensorFlow", "Python 工程能力", "数据结构与算法", "论文阅读能力"],
    bonus: ["大模型微调经验", "获奖经历", "顶会论文", "部署优化经验"],
    desc: "负责机器学习/深度学习模型的设计、训练与部署，解决实际业务问题。",
    path: ["掌握 ML 基础（回归/分类/聚类）", "深入学习 PyTorch", "复现 1 篇经典论文", "参与 Kaggle/天池 项目实战", "准备算法岗八股 + 手撕代码"],
  },
  {
    id: "ui", name: "UI/UX 设计师", icon: "🎨",
    majors: ["设计/视觉", "计算机/软件工程"],
    interests: ["做设计", "做产品"],
    skills: ["Figma", "文案写作"],
    coreSkills: ["视觉设计基础", "交互设计方法论", "Figma/Sketch 熟练", "设计系统搭建", "用户研究方法"],
    bonus: ["动效设计", "前端实现能力", "品牌设计经验", "设计管理"],
    desc: "负责产品界面视觉与交互体验设计，将用户需求转化为直观的产品形态。",
    path: ["掌握设计原则（对齐/对比/留白）", "精通 Figma", "完成 2-3 个完整设计作品", "学习用户研究方法", "搭建个人作品集"],
  },
  {
    id: "ai_product", name: "AI 产品经理", icon: "🤖",
    majors: ["计算机/软件工程", "商科/管理", "数学/统计"],
    interests: ["做产品", "训练模型", "写代码"],
    skills: ["Python", "Figma", "文案写作", "Prompt"],
    coreSkills: ["AI 技术认知（LLM/RAG/Agent）", "产品设计能力", "Prompt 工程", "数据分析", "快速原型能力"],
    bonus: ["AI 应用落地经验", "模型评测经验", "技术博客输出", "开源项目贡献"],
    desc: "聚焦 AI 能力的产品化落地，需要既懂技术边界又能设计用户体验。",
    path: ["理解 LLM/RAG/Agent 基本原理", "练习 Prompt 工程", "用 AI 做一个完整产品原型", "学习 AI 产品评测方法", "积累行业认知"],
  },
  {
    id: "test", name: "测试开发工程师", icon: "🔍",
    majors: ["计算机/软件工程", "电子信息"],
    interests: ["写代码", "分析数据"],
    skills: ["Python", "Java", "SQL", "Linux", "Git"],
    coreSkills: ["编程基础（Python/Java）", "自动化测试框架", "接口测试", "性能测试", "CI/CD"],
    bonus: ["安全测试", "测试平台开发", "AI 测试", "混沌工程"],
    desc: "负责产品质量保障，通过自动化与工具化手段提升测试效率与覆盖率。",
    path: ["掌握 Python/Java 编程", "学习 Pytest/Selenium", "搭建 1 套自动化测试", "理解接口测试与性能测试", "学习 CI/CD 流程"],
  },
];

/* ============================================================
 * v10 · 岗位数据库扩充（8 → 24）
 * ============================================================ */
CAREER_DB.push(
  // ----- 技术方向 -----
  {
    id: "devops", name: "运维/SRE 工程师", icon: "🛠️", salary: "15-30K · 14 薪",
    majors: ["计算机/软件工程", "电子信息"],
    interests: ["写代码", "分析数据"],
    skills: ["Linux", "Docker", "Kubernetes", "Python", "Shell", "Git"],
    coreSkills: ["Linux 系统管理", "Docker/K8s 容器编排", "Shell/Python 脚本", "监控告警体系", "CI/CD 流水线"],
    bonus: ["Terraform IaC", "Prometheus/Grafana", "安全加固经验", "大规模集群运维"],
    desc: "负责线上服务的稳定性、自动化部署与容量规划，是研发效能与业务稳定的基石。",
    path: ["掌握 Linux 常用命令与排障", "学习 Docker 与 K8s 核心概念", "搭建 CI/CD 流水线", "掌握监控与日志体系", "做 1 个自动化运维项目"],
  },
  {
    id: "security", name: "安全工程师", icon: "🛡️", salary: "18-35K · 15 薪",
    majors: ["计算机/软件工程", "电子信息"],
    interests: ["写代码", "分析数据"],
    skills: ["Python", "Linux", "网络协议", "SQL"],
    coreSkills: ["Web 安全（OWASP Top 10）", "渗透测试基础", "密码学基础", "代码审计能力", "应急响应流程"],
    bonus: ["CTF 获奖", "漏洞挖掘经验", "等级保护合规", "云安全认证"],
    desc: "发现并修复系统安全漏洞，构建防御体系，保障业务与用户数据安全。",
    path: ["学习网络与操作系统基础", "掌握 OWASP Top 10 与常见漏洞原理", "练习靶场（DVWA / WebGoat）", "参加 CTF 或 SRC 项目", "学习等级保护与合规"],
  },
  {
    id: "bigdata", name: "大数据工程师", icon: "🗄️", salary: "20-40K · 14 薪",
    majors: ["计算机/软件工程", "数学/统计"],
    interests: ["写代码", "分析数据"],
    skills: ["Java", "Python", "SQL", "Linux", "Kafka"],
    coreSkills: ["Hadoop/Spark 生态", "SQL 与数仓建模", "Java/Scala 编程", "分布式计算原理", "数据质量管理"],
    bonus: ["Flink 实时计算", "ClickHouse/Doris", "数据治理经验", "云原生大数据"],
    desc: "构建海量数据的采集、存储、计算链路，为业务提供稳定、高效的数据底座。",
    path: ["掌握 SQL 与 Linux", "学习 Hadoop/Spark 基础", "理解数仓分层建模", "做 1 个离线数仓项目", "学习 Flink 实时计算"],
  },
  {
    id: "embedded", name: "嵌入式开发工程师", icon: "🔌", salary: "13-25K · 13 薪",
    majors: ["电子信息", "计算机/软件工程"],
    interests: ["写代码"],
    skills: ["C++", "Linux", "Git"],
    coreSkills: ["C/C++ 编程", "单片机/RTOS", "硬件原理图阅读", "通信协议（UART/I2C/SPI）", "驱动开发基础"],
    bonus: ["Linux 内核裁剪", "ROS 开发", "电源管理", "车规级认证"],
    desc: "面向硬件设备开发底层软件，是智能硬件、物联网、汽车电子等行业的核心岗位。",
    path: ["掌握 C 语言与数据结构", "学习 51/STM32 单片机", "理解 UART/I2C/SPI 协议", "做 1 个完整的嵌入式项目", "学习 Linux 驱动开发"],
  },
  {
    id: "blockchain", name: "区块链开发工程师", icon: "⛓️", salary: "25-50K · 13 薪",
    majors: ["计算机/软件工程", "数学/统计"],
    interests: ["写代码", "训练模型"],
    skills: ["Go", "C++", "Python", "Linux"],
    coreSkills: ["Go/Rust 编程", "密码学与共识算法", "智能合约开发", "分布式系统原理", "EVM/链上数据结构"],
    bonus: ["Solidity 实战", "DeFi 协议理解", "跨链技术", "审计经验"],
    desc: "开发底层公链或 DApp 应用，涉及密码学、分布式共识与智能合约。",
    path: ["掌握 Go 或 Rust", "理解区块链基本原理", "学习 Solidity 智能合约", "做 1 个 DApp 项目", "学习共识算法与跨链"],
  },

  // ----- 产品与运营 -----
  {
    id: "product_ops", name: "产品运营", icon: "🎯", salary: "10-20K · 13 薪",
    majors: ["商科/管理", "计算机/软件工程", "其他"],
    interests: ["做产品", "分析数据", "写文档"],
    skills: ["Excel", "文案写作", "SQL"],
    coreSkills: ["用户增长策略", "数据分析与 A/B 实验", "内容运营与活动策划", "用户调研方法", "跨部门协作"],
    bonus: ["社群运营经验", "爆款内容案例", "SEO/SEM 认知", "私域运营"],
    desc: "通过活动、内容、用户分层等运营手段，驱动产品的用户增长与活跃度提升。",
    path: ["掌握 Excel + 基础 SQL", "学习用户增长方法论", "做 1 次完整的活动策划", "练习数据分析与 A/B 实验", "沉淀运营方法论"],
  },
  {
    id: "game_plan", name: "游戏策划", icon: "🎮", salary: "12-25K · 14 薪",
    majors: ["计算机/软件工程", "商科/管理", "设计/视觉", "其他"],
    interests: ["做产品", "做设计", "写文档"],
    skills: ["Excel", "文案写作", "Axure"],
    coreSkills: ["游戏系统设计", "数值策划能力", "玩家心理洞察", "策划案撰写", "竞品分析"],
    bonus: ["Unity/UE 基础", "美术审美", "英文游戏阅历", "完整 Demo 作品"],
    desc: "负责游戏玩法、系统、数值的设计，是游戏世界的架构师。",
    path: ["玩 100 款经典游戏并拆解", "学习游戏设计理论", "用 Excel 做数值模型", "写 1 份完整策划案", "做 1 个游戏原型 Demo"],
  },
  {
    id: "ux_research", name: "用户研究员", icon: "🔬", salary: "14-28K · 14 薪",
    majors: ["设计/视觉", "商科/管理", "计算机/软件工程"],
    interests: ["做设计", "做产品", "写文档"],
    skills: ["Excel", "文案写作", "Figma"],
    coreSkills: ["定性/定量研究方法", "用户访谈技巧", "问卷设计与统计", "数据洞察能力", "研究报告撰写"],
    bonus: ["行为经济学认知", "眼动实验", "可用性测试经验", "英文文献阅读"],
    desc: "通过访谈、问卷、观察等方法，挖掘用户真实需求与痛点，为产品决策提供支撑。",
    path: ["学习社会学/心理学研究方法", "掌握用户访谈与问卷设计", "做 3 次真实用户访谈", "输出 1 份完整研究报告", "学习可用性测试方法"],
  },

  // ----- 设计与内容 -----
  {
    id: "visual", name: "视觉设计师", icon: "🖌️", salary: "10-22K · 13 薪",
    majors: ["设计/视觉", "其他"],
    interests: ["做设计", "做产品"],
    skills: ["Figma", "文案写作"],
    coreSkills: ["版式设计原则", "色彩与字体搭配", "品牌视觉系统", "Figma/PS/AI 熟练", "设计趋势敏感度"],
    bonus: ["动效设计", "插画能力", "3D 渲染", "印刷工艺知识"],
    desc: "负责品牌与营销物料的视觉设计，通过视觉语言传递信息与情感。",
    path: ["掌握设计三大构成", "精通 Figma + Photoshop", "临摹 20 张优秀作品", "做 3 套完整视觉方案", "搭建作品集网站"],
  },
  {
    id: "content_ops", name: "内容创作者/编辑", icon: "✒️", salary: "8-18K · 13 薪",
    majors: ["其他", "商科/管理"],
    interests: ["写文档", "做产品"],
    skills: ["文案写作", "Excel"],
    coreSkills: ["选题与内容策划", "深度写作能力", "排版与视觉审美", "平台规则理解", "数据复盘能力"],
    bonus: ["爆款内容案例", "视频剪辑", "SEO 优化", "垂直领域专业知识"],
    desc: "通过图文、视频等内容形式，为品牌或平台产出优质内容，驱动传播与增长。",
    path: ["找准 1 个垂直领域", "日更练习写作 30 天", "学习排版与视觉规范", "研究平台推荐机制", "产出 3 篇代表作"],
  },

  // ----- 商业与分析 -----
  {
    id: "business_analyst", name: "商业分析师", icon: "💼", salary: "15-30K · 14 薪",
    majors: ["商科/管理", "数学/统计", "计算机/软件工程"],
    interests: ["分析数据", "做产品", "写文档"],
    skills: ["Excel", "SQL", "Python", "Tableau"],
    coreSkills: ["行业研究方法", "财务分析基础", "Excel 建模能力", "逻辑表达与 PPT", "商业洞察力"],
    bonus: ["咨询实习经验", "案例项目获奖", "英文文献阅读", "投行/券商实习"],
    desc: "通过行业研究、财务建模、竞品分析，为企业战略与投资决策提供依据。",
    path: ["掌握 Excel 高级函数与建模", "学习财务三大报表", "做 3 个行业研究报告", "练 case interview", "学习咨询结构化思维"],
  },
  {
    id: "growth", name: "增长黑客", icon: "📈", salary: "18-35K · 14 薪",
    majors: ["计算机/软件工程", "商科/管理", "数学/统计"],
    interests: ["分析数据", "做产品", "写代码"],
    skills: ["SQL", "Python", "Excel"],
    coreSkills: ["AARRR 漏斗分析", "A/B 实验设计", "渠道投放与 ROI", "数据埋点与看板", "快速试错能力"],
    bonus: ["SEO/SEM 实战", "私域增长经验", "增长案例复盘", "增长工具开发"],
    desc: "通过数据驱动的实验与渠道运营，低成本高效率地驱动产品增长。",
    path: ["掌握 SQL 与漏斗分析", "学习 AARRR 与 ICE 模型", "设计并跑通 1 个 A/B 实验", "做 1 个渠道投放项目", "沉淀增长方法论"],
  },
  {
    id: "investment", name: "投资/量化研究员", icon: "💰", salary: "25-60K · 16 薪",
    majors: ["数学/统计", "计算机/软件工程", "商科/管理"],
    interests: ["分析数据", "训练模型", "写代码"],
    skills: ["Python", "SQL", "Excel", "机器学习"],
    coreSkills: ["财务与估值分析", "Python 数据处理", "统计学与概率论", "量化策略回测", "行业深度研究"],
    bonus: ["CFA/FRM 证书", "量化项目获奖", "卖方研究实习", "论文发表"],
    desc: "通过财务分析、行业研究或量化建模，挖掘投资机会、评估资产价值。",
    path: ["掌握财务分析与估值", "学习 Python 量化库（pandas/backtrader）", "做 1 份行业研究报告", "搭建 1 个量化策略", "练习 case interview"],
  },

  // ----- 新兴方向 -----
  {
    id: "aigc", name: "AIGC 内容工程师", icon: "🎨", salary: "15-35K · 13 薪",
    majors: ["计算机/软件工程", "设计/视觉", "其他"],
    interests: ["做设计", "训练模型", "写代码"],
    skills: ["Python", "Prompt", "Figma"],
    coreSkills: ["Stable Diffusion/Midjourney", "Prompt 工程", "ComfyUI 工作流", "LoRA 训练", "AIGC 内容策划"],
    bonus: ["视频生成（Sora/Runway）", "3D 生成", "商业变现经验", "作品集影响力"],
    desc: "用 AIGC 工具产出图像/视频/3D 内容，是内容产业的新兴热门方向。",
    path: ["掌握 SD/MJ 基础操作", "学习 Prompt 工程", "搭建 ComfyUI 工作流", "训练 1 个专属 LoRA", "产出 1 套商业级作品"],
  },
  {
    id: "ai_solution", name: "AI 解决方案工程师", icon: "🧩", salary: "25-50K · 14 薪",
    majors: ["计算机/软件工程", "电子信息", "商科/管理"],
    interests: ["写代码", "做产品", "写文档"],
    skills: ["Python", "LLM", "RAG", "Prompt"],
    coreSkills: ["大模型 API 集成", "RAG 系统搭建", "Agent 工作流设计", "客户需求沟通", "方案文档撰写"],
    bonus: ["开源项目贡献", "MCP 实践经验", "行业 Know-how", "交付项目管理"],
    desc: "面向企业客户，把大模型能力落地为可用的产品/解决方案，是 AI 商业化落地的关键角色。",
    path: ["掌握 LLM 与 RAG 基础", "做 1 个端到端 AI Demo", "学习 Agent 编排框架", "写 1 份完整解决方案", "参与真实项目交付"],
  },
  {
    id: "prompt_engineer", name: "Prompt 工程师", icon: "💬", salary: "20-45K · 13 薪",
    majors: ["计算机/软件工程", "其他"],
    interests: ["写代码", "写文档", "训练模型"],
    skills: ["Prompt", "Python", "LLM"],
    coreSkills: ["Prompt 设计与调优", "大模型能力边界认知", "评测体系设计", "结构化输出约束", "多轮对话编排"],
    bonus: ["公开 Prompt 库", "学术论文阅读", "跨模型对比经验", "Agent 项目经验"],
    desc: "专注大模型输入输出优化，让 AI 表现更稳定、更精准、更可控。",
    path: ["熟悉主流大模型能力差异", "系统学习 Prompt 工程方法论", "搭建评测集量化效果", "输出 1 套可复用 Prompt 库", "结合 Agent 做实战项目"],
  },
  {
    id: "mcp_dev", name: "MCP 生态开发者", icon: "🔧", salary: "25-50K · 14 薪",
    majors: ["计算机/软件工程"],
    interests: ["写代码", "做产品"],
    skills: ["TypeScript", "Python", "Node.js", "LLM"],
    coreSkills: ["MCP 协议理解", "Server 端开发", "工具封装设计", "OpenAI Function Calling", "Schema 设计"],
    bonus: ["开源 MCP Server", "MCP 生态贡献", "跨模型兼容经验", "开发者社区影响"],
    desc: "开发 MCP Server，把外部工具/数据源接入大模型，是 AI Agent 生态的基础设施建设者。",
    path: ["理解 MCP 协议规范", "用 TS/Python 写 1 个 MCP Server", "接入真实工具（日历/邮件/数据库）", "开源发布", "参与 MCP 社区讨论"],
  }
);

/* 原有 8 个岗位补齐薪资范围（避免直接改动原数组） */
const CAREER_SALARY_LEGACY = {
  frontend: "15-30K · 14 薪",
  backend: "18-35K · 14 薪",
  pm: "15-30K · 14 薪",
  data: "15-30K · 14 薪",
  algo: "25-50K · 15 薪",
  ui: "12-25K · 13 薪",
  ai_product: "20-40K · 14 薪",
  test: "13-26K · 13 薪",
};
CAREER_DB.forEach(c => { if (!c.salary) c.salary = CAREER_SALARY_LEGACY[c.id] || "面议"; });


/* 用户选择状态 */
const careerSelection = { major: [], skill: [], interest: [] };

function renderCareerSkillChips() {
  // v10：随岗位库扩充同步补齐可选技能（覆盖运维/安全/大数据/AI 等新方向）
  const skills = ["Python", "Java", "JavaScript", "TypeScript", "SQL", "React", "Vue", "Node.js", "Go", "Rust", "C++",
    "MySQL", "Redis", "Docker", "Kubernetes", "Linux", "Shell", "Git", "Kafka",
    "机器学习", "深度学习", "PyTorch", "Prompt", "LLM", "Excel", "Tableau", "Figma", "Axure", "文案写作", "数据可视化"];
  $("skill-chips").innerHTML = skills.map(s =>
    `<button class="chip-btn" onclick="toggleChip(this,'skill')">${s}</button>`).join("");
}
renderCareerSkillChips();

function toggleChip(btn, group) {
  const val = btn.textContent.replace(/^✓\s*/, "");
  btn.classList.toggle("active");
  const arr = careerSelection[group];
  const i = arr.indexOf(val);
  if (i >= 0) arr.splice(i, 1); else arr.push(val);
}
function clearCareer() {
  careerSelection.major = [];
  careerSelection.skill = [];
  careerSelection.interest = [];
  document.querySelectorAll(".chip-btn.active").forEach(b => b.classList.remove("active"));
  $("career-result").innerHTML = `<div class="notice notice-info">选择你的专业、技能与兴趣方向，点击「为我推荐岗位」查看 Top 3 匹配岗位与学习路径。</div>`;
}

function skillCompareChart(career, haveSkills) {
  const all = [
    ...career.coreSkills.map(s => ({ name: s, have: haveSkills.some(h => s.includes(h) || h.includes(s)), core: true })),
    ...career.bonus.slice(0, 3).map(s => ({ name: s, have: false, core: false })),
  ];
  const rows = all.map(item => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="width:8px;height:8px;border-radius:50%;background:${item.have ? "var(--green)" : item.core ? "var(--red)" : "var(--faint)"};flex-shrink:0"></span>
      <span style="flex:1;font-size:12.5px;color:${item.have ? "var(--ink)" : "var(--muted)"}">${item.name}</span>
      <span style="font-size:11px;color:${item.have ? "var(--green)" : "var(--faint)"}">${item.have ? "已具备" : item.core ? "必补" : "加分"}</span>
    </div>`).join("");
  return `<div style="margin-top:10px;padding:12px;border-radius:10px;background:var(--chip-bg);border:1px solid var(--line)">${rows}</div>`;
}

function recommendCareer() {
  if (!requireLogin()) return;
  const { major, skill, interest } = careerSelection;
  if (!major.length && !skill.length && !interest.length) {
    toast("请至少选择一个专业、技能或兴趣方向");
    return;
  }

  const scored = CAREER_DB.map(career => {
    let score = 30;
    const matchedSkills = career.skills.filter(s => skill.includes(s));
    const missingSkills = career.coreSkills.filter(s => !skill.includes(s));
    // 技能命中
    score += matchedSkills.length * 10;
    // 兴趣命中
    const interestHits = career.interests.filter(i => interest.includes(i)).length;
    score += interestHits * 12;
    // 专业命中
    if (major.some(m => career.majors.includes(m))) score += 15;
    // 惩罚：核心技能缺太多
    score -= missingSkills.length * 3;
    score = Math.max(20, Math.min(98, Math.round(score)));

    return { ...career, score, matchedSkills, missingSkills };
  }).sort((a, b) => b.score - a.score);

  const top3 = scored.slice(0, 3);

  $("career-result").innerHTML = `
    <div class="pane-title" style="margin-bottom:12px">🎯 为你推荐 Top 3 岗位</div>
    ${top3.map((c, idx) => `
      <div class="career-card fade-up" style="animation-delay:${idx * 0.1}s">
        <div class="career-icon">${c.icon}</div>
        <div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <b style="font-size:16px">${c.name}</b>
            <span class="career-match-badge ${c.score >= 75 ? "career-match-high" : c.score >= 55 ? "career-match-mid" : "career-match-low"}">
              匹配度 ${c.score}%
            </span>
            ${idx === 0 ? '<span class="badge badge-brand">最推荐</span>' : ""}
            ${c.salary ? `<span class="career-match-badge" style="font-size:11px">💰 ${c.salary}</span>` : ""}
          </div>
          <p style="font-size:13px;color:var(--muted);margin-top:6px;line-height:1.65">${c.desc}</p>
          <div style="margin-top:10px;font-size:12.5px">
            <b style="color:var(--green)">✅ 你已具备：</b>
            <div class="career-skills">
              ${c.matchedSkills.length
                ? c.matchedSkills.map(s => `<span class="career-skill-tag have">${s}</span>`).join("")
                : '<span style="color:var(--faint);font-size:12px">暂未识别到匹配技能</span>'}
            </div>
          </div>
          <div style="margin-top:8px;font-size:12.5px">
            <b style="color:var(--red)">📌 建议补强：</b>
            <div class="career-skills">
              ${c.missingSkills.slice(0, 5).map(s => `<span class="career-skill-tag need">${s}</span>`).join("")}
            </div>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="toggleCareerDetail('${c.id}')" id="detail-btn-${c.id}">📖 查看学习路径</button>
            <button class="btn btn-primary btn-sm" onclick="startInterviewFor('${c.name}')">开始该岗位模拟面试 →</button>
          </div>
          <div id="career-detail-${c.id}" hidden style="margin-top:12px;border-top:1px dashed var(--line);padding-top:12px">
            <b style="font-size:13px">🎓 推荐学习路径：</b>
            <div style="margin-top:8px">
              ${c.path.map((step, i) => `<div class="plan-day"><b>Step ${i + 1}</b><span>${step}</span></div>`).join("")}
            </div>
            <b style="font-size:13px;display:block;margin-top:12px">⭐ 加分项：</b>
            <div class="career-skills">
              ${c.bonus.map(b => `<span class="career-skill-tag">${b}</span>`).join("")}
            </div>
            <b style="font-size:13px;display:block;margin-top:12px">🧩 技能对比（已具备 / 必补 / 加分）：</b>
            ${skillCompareChart(c, c.matchedSkills)}
          </div>
        </div>
      </div>`).join("")}

    <div class="pane-title" style="margin-top:20px;margin-bottom:4px">📊 全岗位匹配度对比</div>
    <p class="hint" style="margin-top:0;margin-bottom:10px">共 ${scored.length} 个岗位参与评分，此处展示前 12 名</p>
    <div class="card" style="padding:16px">
      ${scored.slice(0, 12).map(c => `
        <div class="dim-row" style="margin-bottom:10px">
          <div class="dim-head">
            <b style="font-size:12.5px">${c.icon} ${c.name}</b>
            <span style="color:var(--muted);font-size:12px">${c.score}%</span>
          </div>
          <div class="dim-bar" style="height:6px">
            <div style="width:${c.score}%;${c.score >= 75 ? "background:var(--green)" : c.score >= 55 ? "" : "background:var(--amber)"}"></div>
          </div>
        </div>`).join("")}
    </div>`;
}

function toggleCareerDetail(id) {
  const el = $("career-detail-" + id);
  const btn = $("detail-btn-" + id);
  if (!el) return;
  el.hidden = !el.hidden;
  btn.textContent = el.hidden ? "📖 查看学习路径" : "📕 收起学习路径";
}

function startInterviewFor(jobName) {
  switchTab("interview");
  // v11：若能从职业探索页跳转，同步设置 jd-select
  const career = (typeof CAREER_DB !== "undefined")
    ? CAREER_DB.find(c => c.name === jobName)
    : null;
  if (career) {
    const sel = $("jd-select");
    if (!sel) { toast("目标岗位选择器未加载"); return; }
    sel.value = career.id;
    onJdSelectChange(true);
    toast(`已切换到面试模式，目标岗位：${jobName}`);
  } else if (!$("jd").value.trim()) {
    toast("请先在「简历匹配」页选择目标岗位，再开始模拟面试");
  } else {
    toast("已切换到面试模式，当前 JD 保持不变");
  }
}

/* ============================================================
 * v11 · 目标岗位下拉选择器
 * ============================================================ */

/* 岗位分组（按逻辑归类，UI 更清爽） */
const JD_GROUPS = {
  "技术方向": ["frontend", "backend", "devops", "security", "bigdata", "embedded", "blockchain", "test"],
  "产品与运营": ["pm", "ai_product", "product_ops", "game_plan", "ux_research"],
  "设计与内容": ["ui", "visual", "content_ops"],
  "商业与分析": ["data", "business_analyst", "growth", "investment"],
  "新兴方向": ["algo", "aigc", "ai_solution", "prompt_engineer", "mcp_dev"],
};

/* 渲染下拉列表（分组 + 共 N 个） */
function renderJdSelect() {
  const sel = $("jd-select");
  if (!sel) return;
  if (typeof CAREER_DB === "undefined") return;   // 防御 TDZ

  const parts = [`<option value="">— 请选择目标岗位（共 ${CAREER_DB.length} 个）—</option>`];

  Object.entries(JD_GROUPS).forEach(([groupName, ids]) => {
    const items = ids.map(id => CAREER_DB.find(c => c.id === id)).filter(Boolean);
    if (!items.length) return;
    parts.push(`<optgroup label="${groupName}">`);
    items.forEach(c => {
      parts.push(`<option value="${c.id}">${c.icon} ${c.name}</option>`);
    });
    parts.push("</optgroup>");
  });

  // 兜底：不在分组里的岗位（未来新增岗位自动出现在此分组）
  const groupedIds = new Set(Object.values(JD_GROUPS).flat());
  const others = CAREER_DB.filter(c => !groupedIds.has(c.id));
  if (others.length) {
    parts.push(`<optgroup label="其他">`);
    others.forEach(c => parts.push(`<option value="${c.id}">${c.icon} ${c.name}</option>`));
    parts.push("</optgroup>");
  }

  sel.innerHTML = parts.join("");
}

/* 选择岗位后的联动（skipAutoAnalyze=true 时不自动生成匹配报告） */
function onJdSelectChange(skipAutoAnalyze) {
  const id = $("jd-select").value;
  const preview = $("jd-preview");
  const jdTa = $("jd");
  if (!preview || !jdTa) return;

  // v11：若已手动输入较长 JD，切岗位会覆盖，先确认（避免误删用户内容）
  if (id && jdTa.value.trim() && !jdTa.dataset.manual) {
    const isAutoGenerated = /^目标岗位：/.test(jdTa.value);
    if (!isAutoGenerated && jdTa.value.trim().length > 50) {
      if (typeof confirm === "function" && !confirm("切换岗位会覆盖你当前手动输入的 JD，是否继续？")) {
        $("jd-select").value = "";
        return;
      }
    }
  }

  // 清空选择：显示友好空态（不覆盖用户手动输入的 JD）
  if (!id) {
    if (jdTa.dataset.manual) {
      preview.hidden = true;
    } else {
      preview.innerHTML = `
        <div style="text-align:center;padding:24px 12px;color:var(--faint);font-size:13px">
          👆 请从上方选择一个目标岗位，系统会自动生成 JD 与匹配分析
        </div>`;
      preview.hidden = false;
      jdTa.value = "";
    }
    store.set("fm_jd_id", "", true);
    return;
  }

  const career = CAREER_DB.find(c => c.id === id);
  if (!career) return;

  // 1) 构造 JD 文本，写入底层 textarea（analyze() / buildMessages() 直接可用）
  jdTa.value = [
    `目标岗位：${career.name}`,
    `职位描述：${career.desc}`,
    "",
    "核心技能要求：",
    ...career.coreSkills.map(s => `- ${s}`),
    "",
    "加分项：",
    ...career.bonus.map(s => `- ${s}`),
  ].join("\n");
  jdTa.dataset.manual = "";

  // 2) 渲染预览卡片
  preview.innerHTML = `
    <div class="jd-preview-head">
      <div class="jd-icon">${career.icon}</div>
      <div style="flex:1;min-width:0">
        <b style="font-size:14.5px">${career.name}</b>
        ${career.salary ? `<span class="badge badge-green" style="font-size:11px;margin-left:8px">💰 ${career.salary}</span>` : ""}
      </div>
    </div>
    <p class="jd-desc">${career.desc}</p>
    <div class="jd-section">
      <b>📌 核心技能要求</b>
      <div class="career-skills">
        ${career.coreSkills.map(s => `<span class="career-skill-tag need">${s}</span>`).join("")}
      </div>
    </div>
    <div class="jd-section">
      <b>⭐ 加分项</b>
      <div class="career-skills">
        ${career.bonus.map(s => `<span class="career-skill-tag">${s}</span>`).join("")}
      </div>
    </div>
    <div class="jd-section">
      <b>🎓 学习路径</b>
      ${career.path.map((p, i) => `<div class="plan-day"><b>Step ${i + 1}</b><span>${p}</span></div>`).join("")}
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="analyze()">⚡ 生成匹配报告</button>
      <button class="btn btn-outline btn-sm" onclick="startInterviewFor('${career.name}')">🎙️ 开始模拟面试</button>
    </div>
  `;
  preview.hidden = false;

  // 3) 记忆选择（persist:true 长期记住岗位偏好，关闭标签页后仍在）
  store.set("fm_jd_id", id, true);

  // 4) 若简历已填，自动生成匹配报告（用户体感最佳）
  if (!skipAutoAnalyze && $("resume").value.trim()) {
    setTimeout(() => { try { analyze(); } catch (e) {} }, 80);
  }
}

/* 切换手动输入模式 */
function toggleManualJd() {
  const ta = $("jd");
  const btn = $("jd-manual-btn");
  const fileDrop = $("jd-file");
  if (!ta || !btn) return;

  const willOpen = ta.hidden;

  ta.hidden = !willOpen;
  if (fileDrop) fileDrop.hidden = !willOpen;

  if (willOpen) {
    // 打开手动输入：清空 select，标记为手动模式
    ta.dataset.manual = "1";
    btn.textContent = "🔽 收起手动输入";
    $("jd-select").value = "";
    $("jd-preview").hidden = true;
    store.set("fm_jd_id", "");
    ta.focus();
  } else {
    // 收起手动输入
    ta.dataset.manual = "";
    btn.textContent = "✏️ 手动输入 JD";
  }
}

/* 首屏恢复上次的岗位选择（必须在 CAREER_DB 之后调用） */
function restoreJdSelection() {
  if (typeof CAREER_DB === "undefined") return;
  const savedJdId = store.get("fm_jd_id", "");
  const savedJd = store.get("fm_jd", "");

  if (savedJdId && $("jd-select").querySelector(`option[value="${savedJdId}"]`)) {
    $("jd-select").value = savedJdId;
    onJdSelectChange(true);
  } else if (savedJd) {
    // 恢复手动输入的 JD
    $("jd").value = savedJd;
    $("jd").hidden = false;
    if ($("jd-file")) $("jd-file").hidden = false;
    $("jd").dataset.manual = "1";
    if ($("jd-manual-btn")) $("jd-manual-btn").textContent = "🔽 收起手动输入";
  }
}

