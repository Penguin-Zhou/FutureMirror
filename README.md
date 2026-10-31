# 面镜 FutureMirror · 多 Agent 模拟面试与能力成长平台

> **AI辅助开发声明**  
> 本项目开发过程使用AI编程工具作为辅助手段，CSS主题样板、通用工具函数、测试用例骨架、部分页面文案由AI辅助生成，**所有AI产出内容均经过开发团队逐行审查、修改、调试与测试**，完整Git提交记录可查看开发演进过程，团队可完整解释全部代码逻辑。
>
> 项目核心业务架构：多‑Agent圆桌协作机制、证据驱动可解释评分引擎、版本化Prompt约束体系、三级降级容错方案、RAG检索引用机制（BM25 + 端侧向量混合检索，余弦与词面双路融合）、全套业务产品设计与自动化测试体系均为团队独立设计与实现。演示知识库全部为人工合成示例数据，无爬取真实网络数据。  
> 本作品为原型演示系统，仅用于原型演示，不直接作为生产系统使用。

**版本定位：Beta 1.1.2 · 原型演示版**（单文件演示版 / 模块版前端 / FastAPI 同源后端）· 开源许可：**MIT**（见 [`LICENSE`](LICENSE)）

**技术文档**：[在线阅读（HTML 版）](https://penguin-zhou.github.io/FutureMirror/docs/technical-doc.html) · [国内镜像](https://futuremirror-demo.app.workbuddy.host/docs/technical-doc.html) · 仓库内 [`docs/technical-doc.html`](docs/technical-doc.html) —— 9 章完整技术说明书（项目概述 / 需求分析 / 系统架构 / AI 技术方案 / 核心功能实现 / 测试与部署 / 创新点 / 总结展望 / 附录），约 29 页。**PDF 版由该文档 A4 打印导出，随项目材料以附件形式提交**（仓库 Release 亦提供下载）。

**在线演示（免安装，浏览器直接打开）：<https://penguin-zhou.github.io/FutureMirror/>**（GitHub Pages）· **国内直连镜像：<https://futuremirror-demo.app.workbuddy.host/>** · 演示账号 `demo@futuremirror.app / Demo123456`

上传简历与目标岗位 JD，由 HR / 技术 / 压力面 / 观察员 / 教练五个 Agent 协作完成模拟面试，生成**可解释**的评分报告、能力雷达图与个性化学习路径；内置题库小测、错题本、求职看板与 AI 小助手。

---

## 一、项目解决什么问题

### 1.1 真实痛点

| 痛点              | 现状                              | 本项目怎么解                                                  |
| --------------- | ------------------------------- | ------------------------------------------------------- |
| **练不了真面试**      | 找同学对练时间难约、真人模拟面试一次几百元，且对方不懂目标岗位 | 五个角色化 Agent 按岗位 JD 自动出题、按回答内容动态追问，随时可练、成本近零             |
| **只给分数，不知道为什么** | 市面工具给一个总分或一段泛泛点评，用户不知道哪句话被扣分    | 五维评分**每条都引用对话原话作为证据**，报告可逐条核对；最弱维度自动生成 Day 1–Day N 学习计划 |
| **简历与岗位对不上**    | 用户凭感觉投递，不知道 JD 里哪些技能自己缺失        | 简历 × JD 技能抽取 → 匹配分 + 已具备技能 + 能力缺口 + 补强建议，缺口直接作为面试提问方向   |
| **不知道练得有没有进步**  | 刷题/面试都是碎片化，缺少可回看的历史与趋势          | 面试记录与报告落库（SQLite），题库有成绩档案、正确率、掌握度、趋势看板                  |
| **演示/教学场景断网即废** | 依赖云 API 的产品在现场网络不稳定时直接白屏        | 三级降级：后端真实模型 → 浏览器直连 Key → 本地 Mock，无网也能完整走完流程            |

### 1.2 目标用户

- **求职者（主要）**：准备校招/社招的技术与非技术岗位候选人，需要低成本、高频次、有反馈的面试练习；
- **高校就业指导/训练营（次要）**：需要可批量、可留痕、可解释的模拟面试工具；
- **访客与开发者（演示态）**：需要在不装环境、无网络、无 Key 的情况下 3 分钟内看懂系统做了什么、怎么做的。

### 1.3 系统做什么 / 不做什么

**做**：岗位匹配分析、五 Agent 模拟面试（5 轮）、可解释评分报告与学习计划、RAG 面经问答（强制引用）、题库学习与限时小测、错题本/收藏/每日一练、简历改写、投递看板、求职日历、个人中心与数据管理、开发者模式自检。

**不做（当前版本明确边界）**：不做真实招聘投递对接、不做视频面试与语音评测（仅语音输入转文字）、不做多租户与生产级限流、不训练模型（仅集成开源模型与规则引擎）、向量库为浏览器单机索引而非分布式向量数据库。完整清单见「十、已知边界」。

---

## 二、主要功能

### 2.1 功能总览（与页面一一对应）

| #  | 模块            | 页面 / 路由                                      | 具体能力                                                                                                                          |
| -- | ------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1  | **工作台**       | `#/dashboard`                                | 今日推荐岗位随机抽取 + 一键开面、能力概览、最近报告、圆桌 Agent 卡片可点击跳转、进度环与待办                                                                           |
| 2  | **岗位匹配**      | `#/match`                                    | 粘贴简历 + 选择/手输 JD → 技能抽取 → 匹配分（环形图）、已具备技能、能力缺口、补强建议；结果写入本地并作为面试上下文                                                              |
| 3  | **模拟面试**      | `#/interview`                                | 五 Agent 圆桌（HR / 技术 / 压力面 / 观察员 / 教练），**5 轮**问答、`0/5` 进度、规划 Agent 决策时间线、观察员证据记录、90s 答题计时（≤15s 警示）、关键词触发连环追问、语音输入、代码沙盒、SSE 流式输出 |
| 4  | **评分报告**      | `#/report`                                   | 五维评分（内容深度 / 结构逻辑 / 语言表达 / 岗位匹配 / 抗压表现）+ 总分、每维证据原话与点评、最弱维度、Day 1–N 学习计划、句子级改写建议；后端在线时显示「服务端评分引擎 · 已落库」                         |
| 5  | **题库小测**      | `#/quiz`                                     | 五个子页：知识点学习（直接亮答案+解析）/ 限时小测（5 题 × 60s）/ 学习数据（成绩档案、正确率、掌握度、趋势）/ 错题本（VIP）/ 收藏夹；三种练习模式（限时模考、顺序练习、章节练习）+ 每日一练（连签）；VIP 解锁专属分类与不限次数  |
| 6  | **面经问答（RAG）** | `#/rag`                                      | **BM25 + 端侧向量混合检索**：40 条合成面经，词面 + 语义双路召回后加权融合；逐条显示 `bm25 / cos / 融合` 得分与引用来源；资料不足明确说「暂无相关资料」；向量索引状态条与「⚡ 加载端侧模型 MiniLM」按钮      |
| 7  | **简历工坊**      | `#/resume`                                   | 简历评分面板（完成度/量化/结构）+ 真实模型或 Mock 改写，输出可复制的优化版本                                                                                   |
| 8  | **岗位机会**      | `#/jobs`                                     | 岗位列表、关键词筛选、匹配度标注、一键带入模拟面试                                                                                                     |
| 9  | **求职看板**      | `#/career`                                   | 投递五列状态流转（待投/已投/笔试/面试/Offer）+ 转化率统计、面试复盘记录、求职日历                                                                                |
| 10 | **个人中心**      | `#/profile`                                  | 三态头像（表情 / 本地上传裁剪 / 首字母渐变）四处同步、求职信息表单与完成度、偏好开关按账号隔离、数据管理（存储可视化 / JSON 导出 / 一键清除）、VIP 权益展示                                      |
| 11 | **AI 小助手**    | 全局悬浮球                                        | 可拖动并贴边「冻结」（位置按账号记忆）、预设意图跳转、复用 RAG 检索与流式回答、移动端抽屉；未接模型时返回检索摘要兜底                                                                 |
| 12 | **开发者模式**     | `#/evaluator?key=FM2026`<br />`Ctrl+Shift+J` | 交付材料、运行环境检测、性能指标、工程自检、MCP 运行时证据、技术架构、评分维度映射、已知边界、诊断日志（可导出 JSON）                                                               |
| 13 | **后端服务**      | `backend/`                                   | JWT 鉴权（12h）、scrypt 密码哈希、SQLite 持久化（用户/会话/问答/报告）、GLM SSE 流式代理（**Key 只在服务端**）、评分引擎 Python 同构实现、`/docs` 交互式接口文档                  |

### 2.2 核心技术亮点

| 亮点         | 说明                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 多 Agent 圆桌 | 每个 Agent 独立人设与温度，按回答内容动态派发追问，非固定题库轮转                                                                                         |
| 可解释评分      | 5 个维度每一条评分都引用对话原话作为证据；规则引擎在前端、同算法引擎在后端（`scoring.py`，同一套维度/词典/评语）                                                             |
| RAG 混合检索   | BM25（`k1=1.5` / `b=0.75`，中文 bigram，标题加权 ×2）+ 端侧向量余弦（all-MiniLM-L6-v2，384 维）；两路 min-max 归一分后 `cos×0.6 + bm25×0.4` 融合，逐条展示两路得分 |
| 代码沙盒       | Web Worker 执行 + 2s 超时熔断，用例通过率并入「内容深度」维度                                                                                      |
| 三级降级       | 后端真实 → 浏览器直连 Key → 本地 Mock；后端 5xx/超时同样回退，演示不中断                                                                               |
| 密钥安全       | API Key 仅存后端环境变量，前端零接触；浏览器直连仅作逃生通道（sessionStorage）                                                                           |
| 题库闭环       | 学习 → 小测 → 错题自动收录 → 错题练习 → 收藏 → 每日一练 → 数据看板                                                                                   |

---

## 三、安装方法

### 3.1 环境要求

| 依赖      | 版本                  | 用途                                  |
| ------- | ------------------- | ----------------------------------- |
| Node.js | ≥ 18（开发验证用 22.22.2） | 跑测试脚本                   |
| Python  | ≥ 3.10（开发验证用 3.13）  | FastAPI 后端、静态文件服务                   |
| 浏览器     | Chrome / Edge 最新版   | 演示（需支持 SSE、Web Worker、localStorage） |
| 可选      | `sqlite3` 命令行       | 演示时验证数据真落库                          |

**两种安装形态，按需选择**（可只做 A，也可 A+B 全做）：

| 形态                    | 需要装什么                 | 适合场景                    |
| --------------------- | --------------------- | ----------------------- |
| A. 单文件演示版             | **零安装**，浏览器直接打开       | 现场断网、访客临时查看、快速演示        |
| B. 模块版前端 + FastAPI 后端 | Node（仅测试用）+ Python 依赖 | 正式演示（要展示真实落库与 Key 不进前端） |

### 3.2 安装 A：单文件演示版（零依赖）

**方式 1（推荐，零安装）**：直接打开在线演示，Chromium 系浏览器即可完整走完流程。

| 入口               | 地址                                              | 说明                                        |
| ---------------- | ----------------------------------------------- | ----------------------------------------- |
| 主站（GitHub Pages） | <https://penguin-zhou.github.io/FutureMirror/>  | 与仓库同源，随 `gh-pages` 分支更新；构建时注入后端地址，跨域连接真实 API       |
| 国内直连镜像           | <https://futuremirror-demo.app.workbuddy.host/> | 由 FastAPI 后端同源托管（页面 + API + 文档 + 模型同一域名），国内网络直连更快；github.io 打不开时用这个 |

**方式 2（本地离线）**：打开仓库内的 `public/futuremirror-demo.html`（约 1.1MB，所有 CSS/JS 内联，默认零外部请求）。

```bash
# 本地离线演示（自动走本地 Mock 降级）：直接双击 public/futuremirror-demo.html
# 需要连后端时改用 http 服务（见 3.3，file:// 会被 CORS 拒绝）
```

> 两个在线入口均已接通真实后端（Beta 1.0.1 起）：JWT 登录、面试会话持久化、服务端评分全部真实可用；未配置模型 Key 时聊天自动回退 Mock，演示不中断。
>
> - 主站由 GitHub Pages 托管 `gh-pages` 分支（`.nojekyll` 跳过 Jekyll 处理），重新发布：`FM_API_BASE=https://futuremirror-demo.app.workbuddy.host node scripts/deploy-pages.js --build`（构建时把后端地址写进演示页）；
> - 镜像由 FastAPI 后端同源托管，重新发布：`node scripts/build-backend-static.js` 组装 `backend/static/` 后发布 `backend/` 目录（一个域名同时提供页面与 `/api/*`，彻底免除 CORS）。`backend/static/` 为纯产物，已被 `.gitignore` 忽略，不参与版本管理；
> - 本地调试用的 `.mirror-site/` 静态装配脚本（`stage-mirror.js`）保留，但在线镜像已改由后端托管，不再需要单独发布静态目录。
>
> 技术文档（`docs/technical-doc.html`）随同一条发布链路上线，两个入口地址见本文件顶部；PDF 版由该文档打印导出，以附件形式随项目材料提交。

### 3.3 安装 B：模块版前端 + FastAPI 后端（推荐演示使用）

**第 1 步：启动后端**

```bash
cd backend

# 创建虚拟环境（二选一）
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env               # Windows: copy .env.example .env
# 编辑 .env，填入 LLM_API_KEY（不填也能启动，聊天自动走 Mock）
```

`.env` 关键项：

```ini
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4   # OpenAI 兼容协议，可换任意兼容服务
LLM_MODEL=glm-4-flash
LLM_API_KEY=                                        # 留空 = 后端在线但聊天走 Mock
SECRET_KEY=change-me-to-a-long-random-string        # JWT 签名密钥，生产必须替换
DATABASE_URL=sqlite:///./futuremirror.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

```bash
uvicorn app.main:app --reload --port 8000
# 接口文档：http://localhost:8000/docs
# 健康检查：http://localhost:8000/api/health
```

**第 2 步：启动前端静态服务**

```bash
cd frontend
python -m http.server 5173
# 浏览器打开 http://localhost:5173（不要双击 index.html）
```

> ⚠️ **必须用 http 服务打开页面**：`file://` 的 Origin 是 `null`，会被后端 CORS 直接拒绝，后端模式全部失效（Mock 不受影响）。前端端口不是 5173 时，改 `backend/.env` 的 `CORS_ORIGINS` 后重启 uvicorn。

**第 3 步：验证安装**

```bash
# 后端：健康检查应返回 llm_ready（配了 Key 为 true，没配为 false）
curl http://localhost:8000/api/health
# {"ok":true,"llm_ready":true,"model":"glm-4-flash"}

# 后端单测
cd backend && pytest -q            # 6 passed

# 前端静态校验 + 逻辑测试（仓库根目录）
npm run validate:demo
npm run test:demo
```

### 3.4 常见安装问题

| 现象                          | 原因                                            | 处理                                                                                          |
| --------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 页面显示「未连接」，报告无「已落库」          | 后端未启动 / 端口不对 / CORS 拒绝                        | 确认 `uvicorn` 在 8000；页面用 `http://localhost:5173` 打开；`CORS_ORIGINS` 与前端端口一致                   |
| 登录后提示「邮箱或密码不正确」             | 后端在线但该账号只在本地注册过，或未注册                          | 用演示账号一键登录，或先在后端注册（注册即写 SQLite）                                                              |
| 点了按钮没反应（如「开发者模式」） | ① 演示页为单文件全内联，主程序位于文档末尾，网络较慢时页面先画出来、程序尚未执行，此时点击因函数未定义而无效；② v48 之前弹窗的拖拽逻辑会夺走按钮点击，表现为密码输完点「进入」毫无反应（回车反而正常） | ① v47 起页面底部提示「载入中 · 交互稍后可用」，被拦下的点击就绪后自动补发；② v48 起弹窗内按钮可正常点击，旧版本可用回车提交 |
| 后端启动报 `ModuleNotFoundError` | 依赖未装到当前解释器                                    | 确认已激活 `.venv` 后重新 `pip install -r requirements.txt`                                         |
| 对话不走模型、只要 Mock              | `.env` 的 `LLM_API_KEY` 为空或 Key 无效             | 填 Key 后重启 uvicorn；`/api/health` 的 `llm_ready` 应为 `true`                                     |
| 「⚡ 加载端侧模型 MiniLM」一直转圈/失败    | 站点上缺 `models/` 目录（未随站点发布），回落到外网源后又被 CORS/网络挡住 | 线上两个站点已自托管权重，正常可直接加载；本地自建站点先跑 `npm run model:fetch` 再发布。失败时属预期降级：状态条会逐源列出失败原因并继续用离线 hash 向量 |

---

## 四、使用方法

### 4.1 登录

打开 <https://penguin-zhou.github.io/FutureMirror/>（国内网络可改用镜像 <https://futuremirror-demo.app.workbuddy.host/>，或本地 `public/futuremirror-demo.html`），使用演示账号：

- 账号：`demo@futuremirror.app`
- 密码：`Demo123456`
- 或直接点登录页「一键使用演示账号」（该账号自动获得 VIP，可体验错题本与不限次小测）

后端在线时登录走后端（scrypt 校验 + JWT，刷新不掉线）；后端不在线时走本地演示账号，功能一致。

### 4.2 主线演示流程（约 6 分钟）

| 步骤 | 操作                            | 预期结果                                                                 |
| -- | ----------------------------- | -------------------------------------------------------------------- |
| 1  | 登录 → 工作台                      | 显示今日推荐岗位、能力概览、圆桌 Agent 卡片                                            |
| 2  | 进「岗位匹配」→ 点「填入示例数据」→「生成匹配报告」   | 环形匹配分、已具备技能、能力缺口、补强建议                                                |
| 3  | 进「模拟面试」→「开始面试」                | 五个 Agent 依次提问，时间线出现「规划 Agent 决策 / 观察员记录证据」                           |
| 4  | 连续回答 5 轮（可用语音输入；技术关键词会触发连环追问） | 进度从 `0/5` 到 `5/5`，每轮有计时与证据记录                                         |
| 5  | 点「结束面试，生成报告」                  | 报告页显示五维评分、总分、每维证据原话、学习计划                                             |
| 6  | 看报告页顶部徽章                      | 后端在线：「服务端评分引擎 · 已落库」；离线：「本地评分引擎（Mock）」                               |
| 7  | 进「面经问答」→ 输入问题或点预设             | 返回带引用的回答，每条引用显示 `bm25 / cos / 融合` 分数                                 |
| 8  | 点「⚡ 加载端侧模型 MiniLM」            | 状态条从 `hash-ngram 256d` 变为 `MiniLM 384d（语义）`，检索升级为语义召回                |
| 9  | 终端查库                          | `sqlite3 backend/futuremirror.db "select count(*) from turns"` 应 ≥ 5 |

### 4.3 各页面速查

| 想做什么        | 去哪                                                          |
| ----------- | ----------------------------------------------------------- |
| 看整体进度与推荐岗位  | 工作台 `#/dashboard`                                           |
| 简历与 JD 匹配分析 | 岗位匹配 `#/match`                                              |
| 开始/继续模拟面试   | 模拟面试 `#/interview`                                          |
| 看评分报告与学习计划  | 评分报告 `#/report`                                             |
| 刷题、错题本、每日一练 | 题库小测 `#/quiz`（五个子页签）                                        |
| 问面经、看检索过程   | 面经问答 `#/rag`                                                |
| 简历打分与改写     | 简历工坊 `#/resume`                                             |
| 找岗位、投递跟进    | 岗位机会 `#/jobs`、求职看板 `#/career`                               |
| 换头像、改偏好、清数据 | 个人中心 `#/profile`                                            |
| 看工程自检与诊断    | 开发者模式 `#/evaluator?key=FM2026` 或 `Ctrl+Shift+J`，密码 `FM2026` |

页面也支持 URL 直达，例如 `http://localhost:5173/#/rag`。

### 4.4 三种运行模式与切换

| 模式          | 触发条件                                                    | 说明                            |
| ----------- | ------------------------------------------------------- | ----------------------------- |
| **后端真实**    | 后端配置 `LLM_API_KEY` 且 `/api/health` 返回 `llm_ready: true` | SSE 流式输出，Key 不出后端；报告由服务端评分并落库 |
| **后端 Mock** | 后端在线但未配 Key / 上游 503                                    | 后端可用、数据仍落库，文本由 Mock 生成        |
| **直连 Key**  | 后端不可达，但在「② 模拟面试」面板填了浏览器 Key                             | 逃生通道，Key 仅存 sessionStorage    |
| **本地 Mock** | 都不可用                                                    | 完全离线，全部功能可演示                  |

切换与自检：

| 场景       | 操作                                       | 页面表现                                  |
| -------- | ---------------------------------------- | ------------------------------------- |
| 切到后端模式   | 终端跑 `uvicorn … --port 8000`，刷新页面         | 面板徽章变「已连接 · 模型名」；报告页显示「服务端评分引擎 · 已落库」 |
| 验证后端真在工作 | `sqlite3 … "select count(*) from turns"` | 数字 ≥ 本轮问答数                            |
| 临时回 Mock | 关掉 uvicorn 后刷新                           | 徽章变「未连接」，对话/报告自动走本地引擎，功能不减            |
| 只清直连 Key | 面板点「清除直连 Key」                            | 后端在线时仍走后端（文案会明说）；离线时才真正回到 Mock        |

### 4.5 检索层（向量索引）状态

`#/rag` 页顶部状态条实时显示当前检索配置：

| 状态                      | 触发条件                    | 状态条表现                                                 | 检索能力       |
| ----------------------- | ----------------------- | ----------------------------------------------------- | ---------- |
| `MiniLM 384d`（语义）       | 点「⚡ 加载端侧模型 MiniLM」且下载成功 | 绿灯 · `向量索引 40 条 · MiniLM 384d（语义）· localStorage 缓存命中` | 词面 + 语义双路  |
| `hash-ngram 256d`（词面兜底） | 未点加载 / 无模型文件 / CDN 不可达  | 琥珀灯 · `hash-ngram 256d（词面）`                           | 词面 + 词面近似  |
| 加载失败                    | 断网、CDN 被拦               | 显示失败原因 + `继续使用离线 hash 向量`                             | 自动降级，检索不中断 |

清缓存后（开发者模式「清空数据」或手动删 `fm_kb_vec_v1`）下次进入页面会毫秒级重建 hashing 索引，不会白屏等模型。

### 4.6 验证「真落库」

完成一次 5 轮面试并进入报告页后：

```bash
sqlite3 backend/futuremirror.db "select count(*) from turns"        # 应 ≥ 5
sqlite3 backend/futuremirror.db "select id, mode, status from interviews"
sqlite3 backend/futuremirror.db "select interview_id, total from reports"
```

三条命令分别对应：问答轮次已入库、会话记录已建、服务端评分报告已落库——用来回应「是不是前端仿真」的质疑。

---

## 五、输入输出示例

以下示例全部来自项目真实实现（前端 `heuristicParse` / `scoreSession`、后端 `score_session` / 路由），数值为对应输入的实跑结果，可自行复现。

### 5.1 岗位匹配：简历 + JD → 匹配报告

**输入**（`#/match` 页两个文本框；点「填入示例数据」即为下列内容）

```text
【简历】
2026 届本科，计算机科学与技术。
实习：某电商后端开发，负责订单服务接口，用 Java + Spring Boot，
MySQL 慢查询优化把 P99 从 800ms 降到 220ms，QPS 提升到 3000。
技术栈：Java、Spring Boot、MySQL、Redis、Docker、Git、Linux。
项目：校园二手交易平台（Vue + Node.js），日活 500。

【JD】后端开发工程师
负责核心交易系统设计与开发；要求熟悉 Java / Spring Boot、
MySQL 索引与事务、Redis 缓存；了解分布式系统基本原理，
有高并发场景经验；熟悉 Docker 与 Linux；
加分项：了解消息队列（Kafka/RocketMQ）。
```

**输出**（页面渲染为环形匹配分 + 三组标签；同时写入 `localStorage.fm_match`）

```json
{
  "matchScore": 75,
  "skills": ["Vue", "Node.js", "Java", "SQL", "MySQL", "Redis", "Docker", "Git", "Linux"],
  "gaps": ["消息队列", "Kafka"],
  "suggestions": [
    "补强「消息队列」：建议通过课程 + 小项目实战，并在简历中补充可量化成果",
    "补强「Kafka」：建议通过课程 + 小项目实战，并在简历中补充可量化成果",
    "用 STAR 结构重写项目经历，每条至少包含一个量化结果"
  ]
}
```

> 匹配分算法：`round(100 × (JD 技能数 − 缺口数) / JD 技能数)`；技能词典 32 项（`SKILL_DICT`），JD 无命中时兜底 60 分。缺口会带入后续面试提问方向与报告「岗位匹配」维度。

### 5.2 模拟面试 → 可解释评分报告

**输入**（5 轮问答，结构化后同步给后端；实际对话由 Agent 生成，这里截取一轮示意）

```json
{
  "turns": [
    {
      "seq": 1,
      "agent": "HR 面试官",
      "question": "请用 2 分钟介绍一下你最有代表性的项目。",
      "answer": "我负责订单服务的重构，背景是大促期间接口超时率超过 8%。目标是把 P99 压到 300ms 以内。我主导把同步扣减改成 Redis 预扣 + 异步落库，最终 P99 从 800ms 降到 220ms，超时率降到 0.3%，QPS 从 1200 提升到 3000。",
      "notes": "含量化结果，结构清晰"
    }
  ]
}
```

**输出**（`POST /api/interviews/{id}/report` 返回体，前端报告页同结构渲染）

```json
{
  "total": 78,
  "dims": [
    {
      "key": "depth",
      "dimension": "内容深度",
      "score": 80,
      "comment": "回答包含量化数据，细节可信度较好",
      "pool": ["为最强项目补充 3 个可深挖技术点与量化结果", "复盘一个失败案例，讲清根因与改进"]
    },
    {
      "key": "logic",
      "dimension": "结构逻辑",
      "score": 84,
      "comment": "具备 STAR 结构意识，收尾可更明确",
      "pool": ["用 STAR 重写两个核心项目的 300 字介绍", "每天口述 1 遍项目介绍并录音回听"]
    },
    {
      "key": "expression",
      "dimension": "语言表达",
      "score": 88,
      "comment": "表达流畅度良好",
      "pool": ["录音练习，消除口头禅（然后/那个/就是）", "把长回答拆成「总-分-总」三段式"]
    },
    {
      "key": "fit",
      "dimension": "岗位匹配",
      "score": 80,
      "comment": "基于匹配报告：匹配分 75，缺口 消息队列、Kafka",
      "pool": ["针对匹配报告中的缺口技能制定 30 天补强计划", "把缺口技能写成课程项目并更新简历"]
    },
    {
      "key": "stress",
      "dimension": "抗压表现",
      "score": 60,
      "comment": "出现防御性表述，压力下需先承认再解释",
      "pool": ["完成 2 次压力面模拟，练习被打断后的恢复话术", "预演 5 个尖锐问题（方案缺陷/换人重做/deadline 提前）"]
    }
  ],
  "plan": [
    { "day": "Day 1", "task": "完成 2 次压力面模拟，练习被打断后的恢复话术", "tag": "抗压表现" },
    { "day": "Day 2", "task": "预演 5 个尖锐问题（方案缺陷/换人重做/deadline 提前）", "tag": "抗压表现" },
    { "day": "Day 3", "task": "为最强项目补充 3 个可深挖技术点与量化结果", "tag": "内容深度" },
    { "day": "Day 4", "task": "复盘一个失败案例，讲清根因与改进", "tag": "内容深度" },
    { "day": "Day 5", "task": "针对匹配报告中的缺口技能制定 30 天补强计划", "tag": "岗位匹配" },
    { "day": "Day 6", "task": "全流程综合模拟一次，对比历史报告看进步曲线", "tag": "综合" },
    { "day": "Day 7", "task": "把本次报告的证据清单过一遍，标记已改进项", "tag": "综合" }
  ],
  "evidence": [
    {
      "agent": "HR 面试官",
      "quote": "我负责订单服务的重构，背景是大促期间接口超时率超过 8%。目标是把 P99 压到 300ms 以内…",
      "note": "含量化结果，结构清晰"
    }
  ],
  "weakest": { "dimension": "抗压表现", "score": 60 }
}
```

> 规则要点：每维 30–96 分（`_clamp`），总分 = 五维算术平均；`match_score` 参与「岗位匹配」计算，`code_score` 以 20% 权重并入「内容深度」；学习计划按「最弱三维度优先分配 3/2/1 条任务」+ 2 条综合任务生成（上例最弱为抗压表现 60 → Day 1–2 先练压力面）。

### 5.3 RAG 面经问答：问题 → 带引用与双路分数的回答

**输入**（`#/rag` 输入框，或 `askRag("字节后端二面一般问什么？")`）

```text
字节后端二面一般问什么？
```

**输出**（Mock 模式渲染结构，真实模型模式下正文替换为流式生成内容，引用与分数行不变）

```text
（Mock 模式）检索到 3 条相关资料，最相关的是「合成面经·字节跳动后端（示例）」。

引用来源
[1] 合成面经·字节跳动后端（示例） — 字节后端二面通常围绕简历项目深挖：项目 QPS 与峰值…
    bm25 0.82 · cos 0.61 · 融合 0.74
[2] 合成题库·MySQL（示例） — B+ 树数据只在叶子节点、叶子间有链表，范围查询与排序友好…
    bm25 0.55 · cos 0.48 · 融合 0.51
[3] 合成题库·STAR（示例） — STAR：Situation 背景一句话交代业务与团队…
    bm25 0.31 · cos 0.22 · 融合 0.26

retriever=hybrid(bm25×0.4+cos×0.6) · vec=MiniLM 384d · hits=3
```

> 分数随查询词与向量提供者变化，上表为示意；页面逐条显示的是当次实算值（`bm25 / cos / 融合`），可点开核对。

检索不足时输出：`知识库中暂未检索到相关资料，请更换关键词，例如「STAR 法则」「MySQL 索引」「字节 二面」。`（对接模型后由 Prompt 约束为「暂无相关资料」，不编造。）

### 5.4 后端 API 示例（curl）

**注册（演示邮箱自动 VIP）**

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"演示","email":"demo@futuremirror.app","password":"Demo123456"}'
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "6f1c...", "name": "演示", "email": "demo@futuremirror.app", "is_vip": true }
}
```

**创建面试会话**

```bash
curl -X POST http://localhost:8000/api/interviews \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"mode":"general","job":"后端开发工程师"}'
# {"id":"0b9d..."}
```

> 以上示例面向本地后端（无边缘网关）。访问公网托管的演示后端时，边缘网关会用自己的 JWT 覆盖 `Authorization` 头，需改用自定义头：`-H "X-Auth-Token: $TOKEN"`（后端两种头都接受，`X-Auth-Token` 优先）。

**批量同步问答（按 seq 幂等，重复调用不会产生脏数据）**

```bash
curl -X POST http://localhost:8000/api/interviews/0b9d.../sync \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"turns":[{"seq":1,"agent":"HR 面试官","question":"介绍一下项目","answer":"我负责订单服务重构…","notes":"含量化"}]}'
# {"ok":true,"added":1,"total":1}   重复调用 → {"ok":true,"added":0,"total":1}
```

**流式对话（SSE，Key 只在服务端）**

```bash
curl -N -X POST http://localhost:8000/api/chat/stream \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"用一句话说明什么是 STAR 法则"}]}'
```

```text
data: {"id":"chatcmpl-...","choices":[{"delta":{"content":"STAR"}}]}
data: {"id":"chatcmpl-...","choices":[{"delta":{"content":" 法则是"}}]}
...
data: [DONE]
```

未配 Key 时该接口返回 `503 服务端未配置 LLM_API_KEY，请使用 Mock 模式`，前端会自动降级，不会报错弹窗。

**健康检查**

```bash
curl http://localhost:8000/api/health
# {"ok":true,"llm_ready":false,"model":null}     # 未配 Key 的后端 Mock 态
```

### 5.5 数据落库验证输出

```bash
$ sqlite3 backend/futuremirror.db "select count(*) from turns"
5

$ sqlite3 backend/futuremirror.db "select id, mode, status from interviews"
0b9d4c1e8a2f4b7c9d3e5f6a7b8c9d0e|general|finished

$ sqlite3 backend/futuremirror.db "select interview_id, total from reports"
0b9d4c1e8a2f4b7c9d3e5f6a7b8c9d0e|78
```

---

## 六、架构与关键设计

```
浏览器（单文件演示版 / 模块版）
   │  HTTPS / SSE
FastAPI 后端（backend/）── JWT 鉴权 ── SQLite 持久化（面试会话 / 报告 / 账号）
   │  httpx 流式转发（Key 只在服务端环境变量）
智谱 GLM-4-Flash（OpenAI 兼容）

```

**三种交付形态**

| 形态              | 位置                              | 定位                                                                                |
| --------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| **FastAPI 后端**  | `backend/`                      | 演示版的后端适配层：JWT 鉴权、SQLite 持久化、GLM SSE 流式代理（API Key 只存服务端环境变量）、可解释评分引擎               |
| **模块版前端**       | `frontend/`                     | 由单文件演示版机械拆分而成（44 个 JS 模块 + 3 层 CSS），行为与单文件版逐字节等价                                  |
| **单文件演示版**      | `public/futuremirror-demo.html` | 零依赖、可离线运行的演示页（约 1.1MB，所有 CSS/JS 内联，默认零外部请求；仅主动点「加载端侧模型」时才从**同源 `models/`** 取一次权重） |

- **演示版与后端的关系**：演示版检测 `http://localhost:8000` 后端；在线则对话 / 登录 / 报告生成全部走后端（Key 零接触），离线则自动回退「浏览器直连 Key → 本地 Mock」，功能不减。
- **单文件版与模块版的关系**：`scripts/split-frontend.js` 从单文件版按「版本横幅」机械拆分出 `frontend/`；`scripts/build-demo.js` 反向合并回单文件（除一行 hashchange 监听注册随 handler 归位外**逐字节一致**）。`scripts/test-frontend-modules.js` 用 jsdom 真实加载模块版验证独立启动（28 项）。

### 检索层：BM25 + 端侧向量混合检索

RAG 检索不是关键词匹配，而是**词面 + 语义双路召回后归一融合**，全部在浏览器内完成（零后端、零 API、离线可跑）：

| 环节   | 实现                                                                | 关键参数 / 说明                                                                                                    |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 分词   | 英文/数字整词 + 中文 bigram（`tokenList`）                                  | 中文无空格也能召回                                                                           |
| 词面召回 | BM25（`bm25Score`）                                                 | `k1=1.5`、`b=0.75`，IDF 恒正（`log(1+…)` 防负权），标题字段重复计入 = 权重 ×2                                                    |
| 语义召回 | **Transformers.js · all-MiniLM-L6-v2**（`Xenova/all-MiniLM-L6-v2`） | 384 维，`pooling=mean` + L2 归一，浏览器内推理；**权重自托管在站点 `models/`，同源读取**（不依赖 huggingface，规避其国内不可达与 CORS 缺失），浏览器缓存二次秒开 |
| 向量库  | `localStorage["fm_kb_vec_v1"]`（40 条预计算向量 + 元信息）                   | 二次访问「缓存命中」零推理；条目数与知识库不符时**拒绝加载**，避免脏索引                                                                       |
| 离线兜底 | n-gram hashing 向量（`hashEmbed`，256 维，有符号特征哈希 + L2 归一）              | 无模型文件 / CDN 不可达时自动启用，检索链路不中断，状态条如实标注「非语义」                                                                    |
| 融合   | `score = 0.6 × cosine + 0.4 × bm25_normalized`                    | 两路各自 min-max 归一后加权；纯语义召回设余弦门槛（MiniLM 0.15 / hashing 0.32）防噪声                                                 |
| 可解释  | 每条引用显示 `bm25 0.82 · cos 0.61 · 融合 0.74`                           | 访客可当场核对分数，不是黑箱「相似度」                                                                                          |

核验口径：**检索层是 BM25 + 端侧向量混合检索**，向量由 Transformers.js 在浏览器内计算（零 API 成本、离线可跑），两路归一分后加权融合；后续版本规划升级为 **pgvector + RRF + Rerank**。

### 后端接口一览

| 方法   | 路径                            | 鉴权 | 说明                                                     |
| ---- | ----------------------------- | -- | ------------------------------------------------------ |
| POST | `/api/auth/register`          | 否  | 注册（scrypt 哈希；`demo@futuremirror.app` 自动 VIP）           |
| POST | `/api/auth/login`             | 否  | 登录，返回 JWT（12h）                                         |
| GET  | `/api/me`                     | 是  | 当前用户                                                   |
| GET  | `/api/health`                 | 否  | `{ok, llm_ready, model}`，前端据此显示模式                      |
| POST | `/api/chat/stream`            | 是  | SSE 代理，Key 仅在服务端；未配 Key 返回 503                         |
| POST | `/api/interviews`             | 是  | 创建面试会话                                                 |
| POST | `/api/interviews/{id}/sync`   | 是  | 批量同步问答（按 `seq` 幂等，单次 ≤ 30 轮）                           |
| POST | `/api/interviews/{id}/report` | 是  | 服务端评分并落库（body：`match_score / code_score / match_gaps`） |
| GET  | `/api/interviews`             | 是  | 最近 20 条会话及总分                                           |

完整交互式文档：`http://localhost:8000/docs`。

---

## 七、目录结构

```
futuremirror/
├── backend/                        # FastAPI 演示后端（AI 能力接入层）
│   ├── app/
│   │   ├── llm.py                  # GLM SSE 流式代理（Key 只在这一层）
│   │   ├── enrich.py               # LLM 评语增强（只补质性评语，不产出分数）
│   │   ├── scoring.py              # 可解释评分引擎（前端 scoreSession 的 Python 版）
│   │   ├── db.py                   # SQLAlchemy 模型与会话
│   │   └── main.py                 # FastAPI 装配 + 路由（JWT 鉴权/会话/报告/健康检查）
│   ├── tests/                      # pytest：冒烟 + 鉴权 + 评分引擎 + 评语增强（37 项）
│   ├── requirements.txt            # 后端依赖清单（版本固定）
│   └── .env.example                # 复制为 .env 填 Key；.env 永不进仓库
├── frontend/                       # 模块版前端（由单文件版拆分，行为逐字节等价）
│   ├── index.html                  # 骨架 + 3 张 link + 44 个 script（按依赖序）
│   ├── css/                        # tokens / theme / app 三层
│   ├── js/
│   │   ├── core/                   # store / auth / theme / router / api / boot / reveal …
│   │   ├── data/                   # config / kb（含 BM25 + 端侧向量检索层与缓存）
│   │   ├── features/               # match / interview / report / quiz / jobs / assistant …
│   │   └── dev/                    # runtime（MCP 三件套）/ devmode
│   ├── eslint-globals.json         # 共享全局符号表（生成后入库，保证 lint 可复现）
│   └── build-manifest.json         # 拆分清单（build-demo.js 依据）
├── public/
│   ├── futuremirror-demo.html      # 单文件演示版（build-demo.js 产物，1.1MB 自包含）
│   ├── changelog.html              # 更新日志页（build-changelog.js 产物）
│   └── models/                     # 端侧模型权重（fetch-model.js 下载，已 gitignore）
├── changelog/                      # 更新日志源（content.js + changelog.css）
├── scripts/                        # 构建与发布：split-frontend / build-demo / build-changelog /
│                                   #   build-print-doc / build-backend-static / gen-eslint-globals /
│                                   #   run-tests / validate-demo / deploy-pages / push-main-api …
├── docs/
│   ├── technical-doc.html          # 技术文档（10 章正式版，可在线阅读）
│   ├── FutureMirror.Beta.pdf       # 打印版技术文档（含封面，30 页）
│   ├── FutureMirror.Deck.pptx        # 项目演示文稿
│   └── archive/                    # 技术文档早期草稿（仅供演进追溯）
├── types/models.d.ts               # 前端数据模型类型声明（配合 JSDoc，无编译步骤）
├── eslint.config.js                # ESLint 10 扁平配置（npm run lint → 0 error）
├── .prettierrc / .prettierignore / .editorconfig
├── jsconfig.json                   # 编辑器类型提示（jsconfig + JSDoc，不引入 TS 编译链）
├── .env.example                    # 环境变量模板（根目录速查版）
├── package.json                    # 开发依赖与脚本入口（jsdom / eslint / prettier）
└── README.md
```

---

## 八、测试

```bash
# 后端
cd backend && pytest -q                 # 冒烟 + 鉴权 + 评分引擎 + LLM 评语增强（57 项）

# 前端（Node 直跑，无需浏览器；jsdom 测试需先执行 npm install，jsdom 已在 devDependencies）

# 一条命令跑完「规范 + 全部断言」的门禁（提交前必过）
npm run verify                          # globals 校验 → ESLint 0 error → Prettier 检查 → 2432 项断言
npm run validate:demo                   # 静态验证：JS 语法 / DOM id 引用 / onclick 处理器 / 标签配平
npm run test:demo                       # 无头逻辑测试（217 项）
node scripts/test-v15-jsdom.js          # 工作台互动（32 项）
node scripts/test-v16-jsdom.js          # 个人中心 / 头像 / 偏好 / 数据管理（45 项）
node scripts/test-v17-jsdom.js          # 蓝图编辑风视觉体系（61 项）
node scripts/test-v18-jsdom.js          # 求职闭环 / 答题计时 / 连环追问（67 项）
node scripts/test-v19-jsdom.js          # 题库小测 + VIP（97 项）
node scripts/test-v20-jsdom.js          # 题库增强 + AI 助手（107 项）
node scripts/test-v21-jsdom.js          # 悬浮球拖拽冻结 + 移动端美化（57 项）
node scripts/test-v22-jsdom.js          # 后端适配层 + 契约修复回归（73 项）
node scripts/test-v23-jsdom.js            # 体验层 UX Kit：揭载渐入/动效宪法/打字指示/空状态/进度线（44 项）
node scripts/test-v24-jsdom.js            # 动态层：粒子场/涟漪/视差/微交互/降级链（43 项）
node scripts/test-v25-jsdom.js            # 交互深化层：命令面板/滚动语言/实录播台（67 项）
node scripts/test-v26-jsdom.js            # 全站交互层：切页编舞/准线全站化/坐标读数（59 项）
node scripts/test-v27-jsdom.js            # 深度交互层：命令面板Pro/报告可视化/表单批注（44 项）
node scripts/test-v29-jsdom.js            # 专家能力层：主题三态/印刷质感/滚动驱动/数据可视化（103 项）
node scripts/test-v30-jsdom.js            # 完整性补全层：骨架屏/媒体三层/Excel/实时看板/图表详情（74 项）
node scripts/test-v31-jsdom.js            # 体验修复层：文档诚信守卫/学习计划/看板同源/图标系统（110 项）
node scripts/test-beta1-vector-jsdom.js # 端侧向量检索：分词/BM25/向量/缓存/融合/UI/权重源（99 项）
node scripts/test-frontend-modules.js   # 模块版独立启动验证（28 项）
node scripts/test-v32-jsdom.js … test-v44b-jsdom.js # v32–v44 增量批次（语音/可解释/人格/密度层）
node scripts/test-v45-jsdom.js … test-v49-jsdom.js # v45–v49 交互确定性 / 启动守卫 / 拖拽修复 / 视觉升级
node scripts/test-v50-jsdom.js          # 检测修复：计划同源 / 重开竞态 / 暗色仪表 / 坏数据 / 口径（41 项）
node scripts/test-v51-jsdom.js          # 窄屏顶部让位：一份高度只算一次（38 项）
```

合计 **2432 项前端断言 + 57 项后端单测**，全部通过。

前端浏览器内还内置「开发者模式 → 工程自检」断言（快捷键 `Ctrl+Shift+J`，密码 `FM2026`）。

---

## 九、项目局限性（主动说明）

把边界写清楚，是为了让能力可被核验——以下每一条都能在演示中现场验证，而不是靠说明文字补足。

| 局限 | 现状 | 我们的处理方式 |
|---|---|---|
| 打分不依赖 LLM 输出 | 分数由确定性规则引擎给出，LLM 只生成质性评语与总评 | **刻意设计**：同一份回答在任何环境、任何时间重放都得到同一分数；若让模型直接打分，则黑箱、不可复现，且会与「证据驱动」的自证要求冲突 |
| 语音识别依赖浏览器 | 使用 Web Speech API，Chrome / Edge 可用，Safari 部分版本不支持 | 不支持时按钮明确禁用并给出提示，用户可直接键盘输入，闭环不中断；语音时间戳只存本地，音频不出浏览器 |
| 端侧向量为演示级 | MiniLM 384 维在浏览器内计算；无模型文件时回退 hashing 向量 | 两路召回（BM25 + 向量）都保留可解释得分；规划升级为 pgvector + RRF + Rerank（见第七章「边界」） |
| 知识库为合成数据 | 面经 40 条、题库 24 条，全部人工合成并带 `source` 字段 | 明确标注「合成示例 · 非真实爬取」，避免把演示数据说成真实语料 |
| 摄像头识别为轻量模型 | `face-api.js` tiny 检测器，只判断在场 / 专注 | 只上报结构化结果（`face_present` / `attentive` / `label`），原始帧不出浏览器；无采样时报告显示中性说明而非编造指标 |
| 在线演示依赖托管环境 | 镜像 / Pages 为云托管，离线时自动降级本地 Mock | 三级降级（后端真实 → 浏览器直连 Key → 本地 Mock）在演示前自测，可现场断网复现 |

**为什么主动展示局限**：这套系统的核心价值是「可解释」。一份只讲优点的材料，与它自己主张的诚实原则相冲突。我们把边界、降级路径与验证方式一并给出，任何人都可以直接挑任意一条现场验证。

## 十、AI 辅助开发声明

本项目遵循透明声明原则：

- **AI 辅助编写**：CSS 主题变量体系、部分页面样板代码、正则表达式与工具函数、单测骨架、拆分/合并脚本；
- **本人设计与实现**：多 Agent 角色划分与派发策略、Prompt 版本化设计、五维评分规则与证据链结构、RAG 检索与引用策略（BM25 参数调优、向量维度与融合权重、召回门槛、缓存失效规则）、业务流程与信息架构、前后端接口契约、安全方案（JWT + 服务端 Key + scrypt）；
- 检索层使用的 `Transformers.js` 与 `all-MiniLM-L6-v2` 为开源库与开源模型，本项目只做集成与调参，未训练模型；
- 所有 AI 生成代码均经逐行审查、修改与调试，git 提交记录可见演进过程；
- 演示数据均为合成示例，非真实爬取。

## 十一、团队信息与成员分工

**面镜 FutureMirror 开发团队 · 福建农林大学桢队** · 技术文档 v1.11（对应产品 Beta 1.1.2）

| 角色                  | 成员               | GitHub                                           |
| ------------------- | ---------------- | ------------------------------------------------ |
| 项目负责人 / 前端开发 / 后端开发 | 周鹏辉（PenguinZhou） | [@Penguin-Zhou](https://github.com/Penguin-Zhou) |
| 文案与视觉美化             | 林宇豪（Vito）        | —                                                |

### 10.1 项目负责人｜周鹏辉（PenguinZhou）

- 整体产品需求梳理、系统架构设计；完成多 Agent 角色划分、任务调度逻辑设计；
- 负责 Prompt 工程、打分评估规则、可解释评价体系、系统降级与容错方案设计；
- 统筹 Git 仓库搭建、规范代码提交，拆分细粒度 commit，保证开发历史完整可追溯；
- 承担前后端整体联调、功能测试，设计数据隐私安全与合规方案。

### 10.2 前端开发｜周鹏辉（PenguinZhou）

- 完成页面布局、组件开发（HTML/CSS/JS）；实现明暗双主题、流式对话输出、雷达图可视化、报告导出打印、弹窗交互；
- 开发本地存储、语音识别与语音朗读、开发者调试面板；完成离线 Mock 模式开发，对接后端接口并完成全流程调试。

> 备注：基础 UI 代码由 AI 编程工具辅助生成，本人独立完成业务逻辑编写、代码审核、逻辑纠错与 BUG 修复。

### 10.3 后端开发｜周鹏辉（PenguinZhou）

- 使用 FastAPI 搭建代理服务，实现 LLM 流式 SSE 消息转发，解决浏览器跨域问题；
- 完成 API 密钥安全托管、请求超时捕获、异常信息处理；搭建 SQLite 数据持久化、简易 RAG 检索模块；
- 编写项目部署脚本、依赖环境清单，验证 10 分钟本地一键复现流程。

### 10.4 文案与视觉美化｜林宇豪（Vito）

- 撰写 README 文档、AI 辅助开发声明、全套技术说明书与项目材料；
- 负责演示视频的内容设计与讲解准备；
- 负责全部技术文档排版美化、图文规整，优化文档视觉观感。

> 与技术文档的一致说明：本 README 与 [`docs/technical-doc.html`](docs/technical-doc.html) 为同一套交付材料，技术文档含 10 章完整内容（附录 9.5 交付材料清单与本文档互相指向）。

---

## 十二、交付材料

| 材料                     | 状态 | 地址 / 说明                                                                                                                                                                           |
| ---------------------- | -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 代码仓库（Public）           | ✅  | <https://github.com/Penguin-Zhou/FutureMirror>                                                                                                                                    |
| README（问题/功能/安装/使用/示例） | ✅  | 本文件                                                                                                                                                                               |
| `.env.example`（无真实密钥）  | ✅  | `backend/.env.example` + 根目录                                                                                                                                                      |
| Git 真实提交历史             | ✅  | 分阶段提交，非一次性推送                                                                                                                                                                      |
| 单元测试 + 演示版测试体系         | ✅  | 后端 pytest 57 项 + 前端 2432 项断言                                                                                                                                                        |
| 单文件静态演示页               | ✅  | `public/futuremirror-demo.html`                                                                                                                                                   |
| 演示视频 1080p MP4  | ⬜  | `<录制后填写链接>`                                                                                                                                                                       |
| 技术文档（HTML 在线版）         | ✅  | <https://penguin-zhou.github.io/FutureMirror/docs/technical-doc.html> （国内镜像：<https://futuremirror-demo.app.workbuddy.host/docs/technical-doc.html；仓库内> `docs/technical-doc.html`） |
| 技术文档 PDF（附件）           | ✅  | 由上述 HTML 文档 A4 打印导出，约 29 页，**随项目材料以附件形式提交**；仓库 Release 同附（修复版 v1.0.0-beta.1）：<https://github.com/Penguin-Zhou/FutureMirror/releases/download/v1.0.0-beta.1/FutureMirror.Beta.pdf> |
| 在线演示（公网可访问）            | ✅  | <https://penguin-zhou.github.io/FutureMirror/>                                                                                                                                    |
| 在线演示镜像（国内直连）           | ✅  | <https://futuremirror-demo.app.workbuddy.host/>                                                                                                                                   |
| 演示测试账号                 | ✅  | `demo@futuremirror.app / Demo123456`                                                                                                                                              |
| 开源许可证                  | ✅  | MIT，见仓库根目录 `LICENSE`                                                                                                                                                              |

### 部署速查

```bash
# 方案 0：GitHub Pages（当前在线演示 + 在线技术文档所用，纯静态、零成本、随仓库更新）
node scripts/fetch-model.js             # 首次：拉端侧模型权重到 public/models/（约 23MB，已 gitignore）
node scripts/deploy-pages.js --build    # 重建单文件版 → 强推 gh-pages 分支
                                        # 产物：index.html / 404.html / .nojekyll / docs/technical-doc.html / models/

# 方案 0b：国内直连镜像（同一份产物 + 同源后端，托管 backend/ 目录，Python 服务）
node scripts/build-backend-static.js   # 把演示页 / 文档 / 日志 / 端侧模型装配进 backend/static/（已 gitignore）
# 随后对 backend/ 目录执行一次「发布为应用」（Python），启动命令：
#   python3 -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}
# 该形态同源提供 /api/* 接口，演示页无需跨域即连到真实后端

# 方案 B：Cloudflare Pages（仅静态演示页，零成本）
npx wrangler pages deploy public --project-name=futuremirror-demo

# 方案 C：后端 + 模块版（Render / Railway / 自有服务器）
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
# 前端构建后用任意静态服务托管 frontend/，并在 CONFIG 中填写后端地址
```

部署后把地址回填到 `frontend/js/data/config.js` 的 `CONFIG` 与本 README。当前 `repoUrl / fullAppUrl / liveUrl / docsUrl` 均已指向线上地址（`docsUrl` = Pages 上的 HTML 在线版）；`videoUrl` 待演示视频录制完成后再填。

> `gh-pages` 是**纯产物分支**：每次发布重建单个提交并强推，不保留历史；项目主历史始终在 `main`。首次启用 Pages 只需在仓库 Settings → Pages 选择 `gh-pages` 分支根目录一次（当前已启用，`https_enforced`）。

---

## 十三、开源许可证

本项目采用 **MIT License**，全文见仓库根目录 [`LICENSE`](LICENSE)。

```
MIT License
Copyright (c) 2026 FutureMirror Team (面镜 FutureMirror 团队)
```

即：允许自由使用、复制、修改、合并、发布、分发、再许可与销售，**唯一义务是保留版权声明与许可声明**；软件按「原样」提供，不含任何担保。

第三方组件遵循各自许可证，版权归原作者所有：

| 组件                                      | 许可证        | 用途                  |
| --------------------------------------- | ---------- | ------------------- |
| `@xenova/transformers`（Transformers.js） | Apache-2.0 | 浏览器内向量推理运行时         |
| `Xenova/all-MiniLM-L6-v2`               | Apache-2.0 | 端侧句向量模型（仅集成调用，未再训练） |
| FastAPI / SQLAlchemy / PyJWT / httpx    | MIT / BSD  | 后端服务、ORM、鉴权与流式转发    |

> 演示知识库（`frontend/js/data/kb.js`）与题库均为**人工合成示例数据**，随项目一同提供仅用于功能演示，不代表任何真实企业面试内容。

---

---

## Beta 1.1.2 · 体验修复与学习计划层（2026.10.24 当前版本）

收集一轮真实使用反馈，修掉 **3 个影响主流程的缺陷**，新增「学习计划」板块，并把全站模板化 emoji 换成自制图标：

- **模拟面试无法重新面试**：重面入口此前只藏在 ⌘K 面板与报告页 → 面试页 chat-head 新增「🔄 重新面试」按钮（带撤销 toast 的重置快照），补 `requireLogin()` 守卫
- **题库页滚动粘滞**：滚动吸附 `.bp-snap-y` 此前常驻挂在 `documentElement` 上，应用内滚动全被分段吸附阻滞 → 收窄为仅落地页视图生效（`setSnap(on)` 随 `showView` 挂载 / 拆除）；题库子页签切换平滑回顶
- **能力分布看板数据冻结**：看板只在开机装配一次，面试后仍显示「基线数据」→ 新增 `refreshReportPanel()`（停旧 live → 摘旧面板 → 按最新会话重挂），`renderReport()` 渲染末尾调用，空态路径撤下面板
- **新增「学习计划」板块**：7 天路径 + 每日时间分配规划；一键「同步评估报告」按最弱维度动态生成（无报告回落通用基线）；三档时间预算（45 / 60 / 90 分钟）切换自动重算；逐任务打卡 + 进度条 + 印章完成态；支持复制 Markdown / 打印
- **偏好设置新增「十字鼠标追踪」开关**：默认开启，关闭 / 开启即时生效
- **全站图标替换**：36 枚自制蓝图风线性 SVG（24×24、`currentColor`、方头直角、单一朱红 accent）替换 63 处模板化 emoji；favicon 升级为取景器标识；保留 emoji 作无 JS 兜底
- **全栈收口与工程规范**：移除未部署的 Next.js 平行实验层，统一到已验证的单栈（原生 JS + FastAPI）；接入 LLM 混合评分增强（分数仍由确定性引擎给出，LLM 只补逐维度质性评语与教练总评，异常自动回落）；补齐 ESLint 10 + Prettier 3 + `jsconfig`/JSDoc 类型层，并新增 `npm run verify` 单命令门禁（globals 校验 → lint → format → test）

测试基线：**1522** 项前端断言（23 套 jsdom，v31 套件 110 项）+ **37** 项后端 pytest；ESLint 10 `0 error` / Prettier 3 全绿；技术文档 PDF **30 页**。

## Beta 1.1.1 · 审计加固层（2026.10.23）

对「网站 + 代码仓库 + 全部交付文件」做了一次逐项复核，把发现的 **12 类问题**全部修掉并各自补齐回归断言。本轮不新增功能，只做**正确性 / 安全性 / 一致性 / 工程化**四个方向的收口：

- **文档一致性**：技术文档 `<title>` 长期停在 v1.2（正文已是 v1.9）→ 修正并随版本联动；补 viewport 与 720px 断点（技术文档在手机上不再溢出）；补 description / theme-color / OG 元信息。README 附录版本日志此前仍标「当前版本 Beta 1.0.9 / 共 29 个版本」，与正文矛盾 → 统一
- **环境变量模板**：根 `.env.example` 列的是早期 Next 原型的 GEMINI / OpenRouter / 智谱 / DeepSeek / Supabase 变量，后端一个都不读，照抄必然失败 → 重写为「后端变量 + 构建期 `FM_API_BASE` + 早期原型变量」三段
- **安全**：`SECRET_KEY` 未配置时不再回退硬编码常量（改为启动时随机生成）；演示口令支持 env 覆盖；`/api/chat/stream` 增加单条 4000 字 / 整段 24000 字上限；`/ws/live` 增加 50 连接上限与计数回收
- **XSS 收口**：新增统一 `escHtml()`，接入简历改写、面试时间线、报告证据链（引用原话）、岗位匹配结果；打字机改 `textContent`；消除两份转义实现
- **内存泄漏**：报告页每次重渲染都会遗留一条实时看板定时器 / WebSocket → 加单实例守卫；健康检测与流式超时的 `setTimeout` 改为请求结束后清理
- **视觉纪律**：Hero 光晕的 indigo 渐变 + `blur(30px)`、落地页三色蓝紫渐变、雷达填充与头像调色板的撞色 → 全部改单色品牌晕染与墨阶调色板，并补 3 条按色值兜底的断言（旧断言只查 `linear-gradient` + hex，抓不到 `radial-gradient` 的 rgba 写法）
- **工程化**：新增 `scripts/run-tests.js` 全量测试入口（一次跑完 18 套 1317 断言）与 `test:all` / `test:jsdom`；`package.json` 版本对齐；演示页补内联 SVG favicon / theme-color / OG

测试基线：**1317** 项前端断言（18 套 jsdom）+ **21** 项后端 pytest + 16 项 vitest + tsc 0 错误；技术文档 PDF **29 页**。

## Beta 1.1.0 · 完整性补全层（2026.10.23）

对高级网页能力清单做第二轮逐项复核，把「只具备样式或雏形」的 6 处补齐为可运行、可测试、可降级：

- **骨架屏**（`frontend/js/core/skeleton.js`）：占位块幂等挂载 + 最小驻留防闪烁 + `during()` 包裹异步；真实接入报告页等待服务端评分期间
- **媒体三层**（`frontend/js/core/media.js`）：`[data-src]` 懒加载（IntersectionObserver，无则立即加载）+ `data-src-sm` 渐进 blur-up + `[data-preview]` 悬停/键盘预览，Esc 收起
- **导出 Excel**（`viz.js` `toExcelHtml()`）：UTF-8 BOM + `application/vnd.ms-excel`，与 CSV 并存
- **WebSocket 实时看板**：后端 `/ws/live` 每 3 秒推送聚合指标，前端按 apiBase 推导 ws/wss，失败降级 `/api/live/stats` 轮询
- **图表悬停详情**（`initChartTips()`）：`[data-tip]` 统一接管，鼠标 hover 与键盘 focus 双通道
- **键盘可达性**：`initSkipLink()` 跳到主内容 + `trapFocus()` 弹窗焦点陷阱（`role=dialog` + `aria-modal`）

测试基线：**1314** 项前端断言（18 套 jsdom）+ **18** 项后端 pytest + 16 项 vitest + tsc 0 错误；技术文档 PDF **29 页**。

## 附：版本更新日志（v1 → Beta 1.1.2）

本日志为**团队真实开发进程**的版本记录，覆盖 2026.08（v1 初始原型）→ 2026.10（Beta 1.1.2 当前版本），共 35 个已发布版本。每个版本均可独立运行、可回归。

**关于 Git 提交记录（重要说明）：** 本仓库的 Git 提交历史自 **Beta 版本**（首次以 `v1.0.0-beta` 提交包上传）时建立，**仅包含 BETA 1.0 及之后的更新**；BETA 1.0 之前的 v1–v22 演进历程以本更新日志形式完整留存，未在 Git 提交记录中逐条提交。日志中所载为团队真实的版本演进，而非事后补造。提交统一以团队身份 `FutureMirror Team` 署名，成员与分工见「十、团队信息与成员分工」。

> 阅读指引：本日志按版本倒序排列。带「当前版本」标记的是 Beta 1.1.2，为当前正式发布版本（体验修复层：重新面试入口 + 滚动吸附收窄 + 看板实时刷新 + 学习计划板块 + 全站图标替换）；带「规划中」标记的版本为下一步迭代计划，尚未进入代码库。所有数据指标均来自对应版本代码库的实际统计；仅记录团队自研功能演进，不含任何第三方内容。

### v23 · 规划中 · 生产能力对齐 · 生产级 RAG · 多模态扩展（待排期）

> 下一阶段目标：把演示层的关键能力向生产级对齐，同时补齐多模态与部署工程化的空白。以下为规划项，尚未进入代码库。

**📋 RAG 升级**

- **pgvector 持久化**：向量库从浏览器 localStorage 迁到 PostgreSQL + pgvector，支持跨设备与多用户共享知识库
- **RRF 融合**：用 Reciprocal Rank Fusion 替代当前的 min-max 归一加权，减少人工调参
- **Cross-Encoder Rerank**：对 Top-K 结果做二阶段重排序，提升相关条目的排序稳定性

**🤖 Agent 升级**

- **真实 MCP Server**：从"本地模拟 Server"升级为跨进程真实 MCP，支持跨 Agent 工具发现
- **多轮规划**：引入有限状态机式的 Agent 编排，支持复杂面试场景的长链路决策

**📊 评分增强**

- **确定性引擎 + LLM 质性增强（已在 Beta 1.1.2 落地）**：分数由确定性规则引擎给出（可复现、可解释），LLM 仅负责逐维度质性评语与教练总评的生成与兜底；后续引入人工专家复核样本量化分维度偏差

**🎤 多模态扩展**

- **Whisper ASR**：用 Whisper 替代 Web Speech API，提升噪声环境下的识别准确度
- **语速 / 停顿分析**：从语音输入中提取语速、停顿、填充词密度，作为"语言表达"维度的新信号
- **白板代码识别**：支持从面试白板截图或手写板中识别代码并结构化入沙盒

**🚀 部署工程化**

- **多租户隔离**：后端从 SQLite 迁到 PostgreSQL，支持多租户数据隔离
- **限流与配额**：按用户 / IP 限流，防止滥用
- **对象存储**：简历文件、报告 PDF、代码沙盒产物的独立存储层

**📊 规划指标（预估）**

| 3       | 2         | 2     | 3      |
| ------- | --------- | ----- | ------ |
| RAG 升级项 | Agent 升级项 | 评分升级项 | 多模态升级项 |

### Beta 1.0 · 检索层升级与版本定位（2026.10）

> RAG 检索从"关键词匹配"升级为 **BM25 + 端侧向量混合检索**——BM25 负责词面召回，Transformers.js 在浏览器内运行 `all-MiniLM-L6-v2`（384 维）负责语义召回，40 条面经向量预计算后写入 `localStorage`；无模型文件时自动降级为 n-gram hashing 向量（256 维）；两路 min-max 归一分后按 `cos×0.6 + bm25×0.4` 融合。同时统一版本号为 **beta1.0**，README 顶部与三处页脚补齐 AI 辅助开发声明。

**✨ 新增功能**

- **BM25 词面召回**：`k1=1.5`、`b=0.75`，IDF 用 `log(1+…)` 保证恒正，标题字段重复计入 = 权重 ×2；中文 bigram 分词支持无空格召回
- **端侧向量语义召回**：Transformers.js + `all-MiniLM-L6-v2`（384 维，mean pooling + L2 归一），浏览器内推理，零后端零 API
- **向量索引缓存**：`localStorage["fm_kb_vec_v1"]`，存 40 条向量 + 元信息（provider / dim / n / builtAt）；`n` 与知识库不符时**拒绝加载**防脏索引
- **离线兜底**：n-gram hashing 向量（256 维，有符号特征哈希 + L2 归一），CDN 不可达时自动启用，检索链路不中断
- **融合公式**：`score = 0.6 × cosine + 0.4 × bm25_normalized`；纯语义召回设余弦门槛（MiniLM 0.15 / hashing 0.32）防噪声
- **向量索引状态条**：RAG 页顶部实时显示 provider / 维度 / 条数 / 缓存命中 / 融合公式，三种状态（MiniLM 绿 / hashing 琥珀 / 加载中蓝）
- **逐条展示两路得分**：每条引用显示 `bm25 0.82 · cos 0.61 · 融合 0.74`，可当场核对
- **80 项新断言**：`test-beta1-vector-jsdom.js` 覆盖分词 / BM25 / 向量归一与确定性 / 缓存命中与失效 / 融合排序 / UI / CDN 降级

**🔧 优化改进**

- **`askRag()` 改走异步混合检索**：MiniLM 就绪时用模型编码 query，否则用词面向量；缓存命中但模型未加载时后台热加载，本次先走 BM25
- **README 与三处页脚统一 AI 辅助开发声明**：明确区分 AI 辅助项（CSS / 工具函数 / 文案）与团队独立实现项（多 Agent / 评分引擎 / RAG 策略 / 架构 / 测试体系）
- **版本号统一**：侧栏、标题、演示横幅、诊断导出、开发者日志全部为 `beta1.0`

**📊 数据指标**

| 384d        | 256d         | 0.6/0.4 | 80   |
| ----------- | ------------ | ------- | ---- |
| MiniLM 语义维度 | hashing 兜底维度 | 融合权重    | 新增断言 |

### Beta 1.0.1 · 后端上线 · 全渠道接通真实服务（2026.10.20）

> FastAPI 后端正式上线：国内镜像域名从纯静态托管切换为 **「演示页 + API 同源托管」**——同一个域名同时提供页面与 `/api/*` 接口，彻底免除跨域配置；GitHub Pages 演示页则在构建时注入后端地址（跨域访问，CORS 已默认放行）。两个在线入口从「纯前端 Mock」升级为 **真实后端模式**：JWT 登录、面试会话持久化、服务端评分报告全部真实可用；未配置模型 Key 时聊天自动回退 Mock，演示不中断。本版本为 Beta 1.0 的部署补丁，功能集与版本号展示不变。

**✨ 新增功能**

- **后端同源托管**：`backend/static/`（演示页 + 技术文档 + 更新日志 + 端侧模型）由 FastAPI 挂载到站点根路径，镜像站一个域名同时提供页面与 API
- **演示账号自动种子**：后端启动时自动创建 `demo@futuremirror.app`（VIP），全新数据库开箱即可一键登录
- **Pages 跨域接通**：`FM_API_BASE=<后端地址> node scripts/deploy-pages.js --build` 构建时把后端地址写入演示页，CORS 默认放行两个演示域名

**🔧 优化改进**

- **构建脚本升级**：`build-demo.js` 支持 `--out` 输出路径与环境变量 `FM_API_BASE`；新增 `build-backend-static.js` 组装同源托管目录
- **健康检查超时 4s → 8s**：跨境网络下更稳；**CORS 默认放开演示域名**，部署零配置
- **修复公网鉴权头被网关覆盖**：托管平台边缘网关会用自己的 JWT 覆盖请求的 `Authorization` 头，导致线上鉴权接口全部 401；令牌主通道改用自定义头 `X-Auth-Token`（网关原样透传），线上全链路实测可用

### Beta 1.1.2 · 增量 v51：窄屏顶部让位——一份高度只算一次（2026.10.31）

> 375px 下导航条下沿停在 100px，正文却从 176px 才开始，中间 76px 什么都没有。
> 往上翻样式，答案是一行 `padding-top: calc(var(--hdr-h) + 50px)`：它假设「顶栏和导航条都浮在内容之上」。
> 可顶栏是 `position: sticky`，本来就在文档流里占掉 55px，于是**顶栏高度被算了两次**。
> 同一份错误假设还漏掉了另一半——641–900px 才出现的演示横幅，流内起点就在导航条底下，被压住 29px。

- **让位交给下层元素**：顶部留白统一由 header 之后的第一个流内块承担（`#view-app > .wrap`），`.app-main` 只保留常规内边距；`104px` / `108px` / `calc(--hdr-h + 50px)` 三处旧口径全部清除（v20 / v21 两套断言同步改为新契约）
- **导航条占用高度改为实测**：新增 `--navstrip-h` 与 `syncNavStrip()`，按 `offsetHeight` 写入；桌面端导航条不显示时写 `0px`，让位自然退化为原来的 16px。CSS 兜底 45px，保证脚本执行前不漏让位
- **`--hdr-h` 不再过期**：顶栏高度随页面换行变化（320px 下由计划页切到面试页，81px → 55px），只在启动 / 切页 / resize 时量一次会留下旧值，导航条浮在顶栏下方 26px 的空中；改用 `ResizeObserver` 盯住顶栏与导航条，写值前先比对、值相同不重写
- **四个贴顶定位改为两级**：降级横幅、断网 / 慢网横幅、键盘态固定对话卡片此前只按「顶栏」算高度，窄屏会停在导航条背后或被它盖住
- **实测**：9 个宽度（320–1280）× 11 个页面 = 99 组，导航条下沿到首个内容块一律 16px，无一元素落入导航条所在的那一条；641–900px 演示横幅标题行恢复可见
- **指标**：前端断言 2393 → **2432**（新增 v51 套件 38 项）｜jsdom 套件 41 → **42 套**｜前端模块 44（不变）｜共享全局符号 738 → **740**｜PDF **29 页**

### Beta 1.1.2 · 增量 v50：全面检测，修复五处「界面说的和实际状态不一致」（2026.10.31）

> 这一版不加功能。把 12 个页面在 1280 / 375 两个宽度下巡检了一遍（横向溢出、console 异常），逐页点过按钮，
> 并把主流程真实跑通（5 轮面试 → 报告、MBTI 20 题、题库模考、投递看板、计划打卡、面经问答、命令面板）。
> 找出来的问题都不是「功能缺失」，而是**同一件事有两种说法**——计划页与工作台、界面与存储、标题与正文互相对不上。

- **计划只有一份真相**：基线计划原本只在内存里生成、从不落盘，计划页写「0/21 项任务」而工作台「学习任务」显示 `--`；改为首次读取即落盘，指挥台经 `lpGet()` 取计划（取不到才回落 `fm_plan`）
- **重新面试真正作废上一轮**：模型回复是异步流式（最长 60s），等待期间点重开只清了轮次、没作废请求，旧回复仍会写进新会话（界面 0/5、存储 1/5，报告还会给一条没显示过的回答打分）；加轮次世代号 `roundGen` + 中止在途请求，真实与 Mock 两个通道都校验
- **策略卡不再自相矛盾**：MBTI 结果页标题写死「你的面试策略已调整」，典型度不足时正文又说「不启用个性化策略」；改为按 `significant` 分两套标题 / 导语 / 按钮
- **暗色主题仪表可辨**：空弧描边 `--line` 在暗色下几乎不可见，换 `--line-2`（#322D23 → #4B4433）
- **坏数据不炸整块**：`days` / `tasks` 逐层做类型校验，坏项跳过、好项照常计数
- **更新日志版本索引补齐**：v45–v50 六个版本此前未进「版本索引」，现在可点击跳转
- **指标**：前端断言 2352 → **2393**（新增 v50 套件 41 项）｜jsdom 套件 40 → **41 套**｜前端模块 44（不变）｜共享全局符号 736 → **738**｜PDF **29 页**

### Beta 1.1.2 · 增量 v49：视觉升级，从「后台模板」到「一张工程规格书」（2026.10.31）

> 功能已经够用之后，界面反而更像通用后台：卡片各自浮动、强调色到处出现、数字与标签同一字号、空态只有一段灰字，**没有一个地方回答「我现在到哪一步」**。这一版不加装饰——不引入投影、圆角、玻璃拟态、渐变（这四类都有断言守着），只把「高级感」放回版式与信息结构：等宽小标签对衬线大标题、数字统一表格对齐、页头一条短墨规、零散卡片合并成有分区的规格表。

- **新增**：工作台首位「指挥台」——5 段仪表（对应 5 轮画像）+ 4 格指标（最近总分 / 学习任务 / 简历状态 / 人格类型）+ 下一步建议｜历史分数迷你趋势条｜学习任务完成率进度条
- **口径**：无数据一律显示 `--` 而非 0 分｜趋势条仅 ≥2 次记录才画（一个点不是趋势）｜仪表读数随状态切换（面试中读本轮答题数，否则读已完成轮次），杜绝「有 3 次报告却显示 0」
- **版式**：页头换成 56px 短墨规 + 贯通发丝线 + 30px 衬线标题｜面包屑与侧栏分组标签等宽化｜字号/间距收敛为 `--fs-*` / `--sp-*` 令牌
- **结构**：四个数字瓦片并成一张有分区的规格条｜7 张入口卡编号 01–07、hover 出左上角标、第 7 张补满整行｜演示横幅从粉色告示牌收成图纸标题栏｜空态改虚线图框 + 去色图标
- **指标**：前端断言 2299 → **2352**（新增 v49 套件 52 项）｜jsdom 套件 39 → **40 套**｜前端模块 44（不变）｜共享全局符号 736（不变）｜PDF **29 页**

### Beta 1.1.2 · 增量 v48：弹窗按钮不再被拖拽逻辑夺走点击（2026.10.31）

> v47 修好了「慢网时按钮比程序先到」，但反馈仍是「进不去」。继续复现发现第二个、也是真正卡住的原因：**弹窗里的按钮收不到点击**。弹窗支持拖动，抓手在没有 `.modal-head` 时会回退成整个弹窗，于是按下任何位置（包括「进入」按钮）都会触发指针捕获，后续 `pointerup` / `mouseup` / `click` 被整体重定向到弹窗本身，按钮的 `onclick` 永远收不到事件。**键盘回车提交反而正常**——这正是它容易被误判成「网络慢」或「密码错」的原因。

- **修复**：拖拽不再使用指针捕获，改用 document 级 `pointermove` / `pointerup` 监听｜在按钮、输入框、链接、label 等可交互元素上按下时不启动拖拽｜拖动前解除入场动画，避免 `fill:both` 压住内联 `transform`
- **影响面**：开发者门禁（进入 / 取消）与 Prompt 查看器（关闭）两处弹窗，鼠标点击全部恢复；键盘回车路径不变
- **指标**：前端断言 2269 → **2299**（新增 v48 套件 30 项）｜jsdom 套件 38 → **39 套**｜前端模块 44（不变）｜共享全局符号 736（不变）

### Beta 1.1.2 · 增量 v47：启动守卫（2026.10.31）

> 反馈是「开发者模式进不去」。复现后确认功能没坏：演示页是单文件交付，约 0.9 MB 的样式与逻辑全内联、主程序在文档末尾；网络较慢时（GitHub Pages 冷启动实测约 20 秒）HTML 已经把按钮画出来、主程序还没执行，此时点击走内联 `onclick`，函数未定义即抛错——用户看到的就是「点了毫无反应」。这一版加一层启动守卫：未就绪时把状态写到 `html[data-boot]`，顶部给进度条、底部给一句实话；这期间的点击被拦下并明确回「已记下」，就绪后自动补发那一次点击。

- **新增**：`frontend/index.html` 内联启动守卫（零依赖、零请求、零新增 DOM 与 id）｜`html[data-boot]` 四态（loading / wait / slow / ready）与对应提示样式
- **修复**：慢网下点击内联 `onclick` 静默失败（函数未定义，界面无反馈）｜用户误判「功能坏了」而非「还在载入」
- **行为**：只拦依赖主程序的 `[onclick]` 元素，纯链接照常｜就绪后摘监听、撤提示、补发被拦点击一次（元素已离 DOM 则跳过）｜20 秒未就绪提示刷新或改用国内镜像｜`prefers-reduced-motion` 与窄屏下进度条不呼吸
- **指标**：前端断言 2221 → **2269**｜jsdom 套件 37 → **38 套**｜前端模块 44（不变）｜共享全局符号 **736**（不变）｜PDF **29 页**

### Beta 1.1.2 · 增量 v46：服务端语音转写（2026.10.30）

> 浏览器自带的语音识别把音频送到浏览器厂商的云端，境内基本连不上，开麦必然 `network` 失败。这一版改成应用自己转写：浏览器录音 → 本地转 16kHz WAV → 分段提交后端 → 服务端调用同一条模型密钥出文本；音频不落盘、不写库、不进日志。

- **新增**：`backend/app/asr.py` + `POST /api/asr`（原始字节直读，零新增依赖）｜`features/asr.js`（`MediaRecorder` 录音 / `OfflineAudioContext` 解码重采样 / 6 秒分段 / 静音 1.6 秒提前收尾 / 失败分型）
- **修复**：语音输入在境内完全不可用｜`ondataavailable` 闭包引用共享数组导致首段恒空、后续错段｜「浏览器内置识别」「连不上浏览器内置的语音识别服务」两处失实表述｜开麦吞掉已键入文字
- **降级**：服务端未配置转写 → 直接提示可键盘输入且不重试；上游失败只透出通用原因，不复述原始报文
- **指标**：前端断言 2154 → **2221**｜jsdom 套件 36 → **37 套**｜前端模块 43 → **44**｜后端单测 44 → **57**｜共享全局符号 **736**｜PDF **29 页**

### Beta 1.1.2 · 增量 v45：交互确定性层（2026.10.30）

> 界面精致到一定程度之后，风险换了位置：不再是「有没有功能」，而是「点了之后多久有反应」。这一版不加功能，只把交互的确定性补齐——按下当帧可见、证据折不断、动画会看设备，并用可复现的测量替代手感判断。

- **新增**：`core/perf.js`（设备分档 / `yieldToMain()` 让帧 / 长任务与交互时序记账，`window.__bpPerf.summary()` 可现场读数）｜`mountDimSheetShell()` + `fillDimSheet()`（面板轻壳同帧出现，内容下一个任务填充）｜`.ev-unit` 证据单元（引用原话与评分理由共用一条朱红左色条与同一底色）
- **修复**：按下态被 `transition` 拖住，低端机上「点了没反应」→ 再点一次｜面板装配挤在输入帧里（10 倍 CPU 降速实测：处理器耗时 **60.2ms → 32.2ms**，首帧可见 **102.5ms → 74.1ms**）｜面板滚动传染底层页面（`overscroll-behavior: contain`）
- **降级**：窄屏 / `prefers-reduced-motion` / 低端机（核心数 · 内存 · 省流量 · 慢网）三路判据，关闭雷达描边与维度条生长等装饰动画，**功能反馈一律保留**
- **指标**：前端断言 2081 → **2154**｜jsdom 套件 35 → **36 套**｜前端模块 42 → **43**｜共享全局符号 **718**｜PDF **29 页**

### Beta 1.1.2 · 体验修复层：三个主流程缺陷修复 + 学习计划板块 + 全站图标（2026.10.24 当前版本）

> 收集一轮真实使用反馈后的修复与增强：面试页补「重新面试」入口、滚动吸附收窄到落地页视图、能力分布看板改为随报告刷新；新增「学习计划」板块（7 天路径 + 每日时间分配 + 报告同步 + 打卡）与「十字鼠标追踪」偏好开关；36 枚自制蓝图风 SVG 图标替换全站 63 处模板化 emoji。

- **修复**：面试 chat-head 新增「🔄 重新面试」按钮（撤销可回滚）｜`.bp-snap-y` 不再常驻 `documentElement`（题库等应用内页滚动恢复）｜`refreshReportPanel()` 让看板按最新会话重画（不再冻结在基线数据）
- **新增**：学习计划板块（`plan.js`，`data-page="plan"`）｜`prefs.crosshair` 偏好开关｜图标系统 `icons.js`（36 枚）+ 取景器 favicon
- **全栈收口与文档诚实化**：移除未部署的 Next.js 平行实验（统一到已验证的单栈）、接入 LLM 混合评分增强（确定性分数 + LLM 质性评语）、技术文档去除未落地的 Kappa / Zod / 三阶段校准表述
- **指标**：前端断言 1317 → **1427**｜jsdom 套件 18 → **19 套**｜功能页 10 → **11**｜自制 SVG 图标 **36 枚**｜技术文档 v1.10 → **v1.11**｜PDF **29 页**

### Beta 1.1.1 · 审计加固层：全站与仓库逐项复核后的收口（2026.10.23）

> 不新增功能，只做正确性 / 安全性 / 一致性 / 工程化四个方向的收口：文档一致性（技术文档标题版本、移动端视口、README 附录口径）、根 `.env.example` 与实际变量对齐、JWT 密钥不再回退硬编码常量、用户输入统一转义、报告重渲染的实时看板定时器与 WebSocket 泄漏、Hero 光晕与头像调色板的蓝紫撞色残留、全量测试入口与页面元信息。

- **新增**：`scripts/run-tests.js`（18 套 1317 断言一次跑完）｜`escHtml()` 统一转义｜`npm run test:all` / `test:jsdom`
- **指标**：前端断言 1314 → **1317**｜后端测试 18 → **21**｜技术文档 v1.9 → **v1.10**｜PDF **29 页**
### Beta 1.1.0 · 完整性补全层：把能力清单的缺口逐项封死（2026.10.23）

> 对「高级网页能力清单」做第二轮逐项复核，把上一轮只有样式雏形、尚未真正接线的 6 处补齐为**可运行、可测试、可降级**：骨架屏（此前只有 CSS 定义，页面从未真正渲染占位）、图片懒加载 / 渐进加载 / 悬停预览（此前站内无媒体通道）、表格导出 Excel（此前仅 CSV）、实时看板 WebSocket（此前仅本地轮询）、图表悬停详情（折线与柱状此前无 tooltip）、键盘可达性（此前无 skip link 与焦点陷阱）。新增 `skeleton.js` / `media.js` 两个模块与 test-v30-jsdom.js 测试套件（74 项断言）。

- **新增**：骨架屏（最小驻留防闪烁）｜媒体三层（懒加载 + 渐进 blur-up + 悬停/键盘预览）｜导出 Excel（BOM + `vnd.ms-excel`）｜WebSocket 实时看板（后端 `/ws/live`，失败降级 REST 轮询）｜图表悬停详情（`[data-tip]` 统一接管）｜键盘可达性（跳到主内容 + 弹窗焦点陷阱）
- **指标**：前端断言 1240 → **1314**｜后端测试 17 → **18**｜jsdom 套件 17 → **18 套**｜技术文档 PDF **29 页**

### Beta 1.0.9 · 专家能力层：把高级网页能力清单逐项补齐（2026.10.22）

> 在 1.0.8 深度交互层之后，本轮按「高级网页能力清单」逐项补齐 30 项能力，全部沿用**印刷风等价表达**而非照搬玻璃拟态：毛玻璃改为半透明纸底 + 纸纹 + 发丝线（全站仍不使用 backdrop 滤镜）；卡片上浮改为 `scale(1.004)` 微放 + 墨色描边；多层阴影改为墨阶叠层 + 顶部高光发丝线；渐变改为 `feTurbulence` 单色纸纹噪点。v29 测试套件 103 项断言锁定全部行为（含 reduced-motion、精细指针、系统暗色三条路径）。

**✨ 新增功能**

- **主题三态**（`theme.js` + `index.html` 首屏预置）：`themeMode()` / `setThemeMode(m)` / `cycleThemeMode()`，默认 `auto` 用 `matchMedia("(prefers-color-scheme: dark)")` 跟随系统明暗，`initThemeFollow()` 监听系统变更实时切换；命令面板新增「主题：跟随系统（自动明暗）」
- **印刷风质感层**（`tokens.css` + `theme.css` v29 区）：`--grain` 为 `feTurbulence` 经 `feColorMatrix` 去色的单色噪点，由 `body::after` 固定层承载；墨阶景深 `.bp-z1/.bp-z2/.bp-z3` 用顶部高光发丝线替代投影；`.bp-glow` 用 `outline` 外扩；流体字号 `clamp()` 三档
- **微交互四件套**（`motion.js`）：准线十字光标 `.bp-cursor` + 朱红中心点（仅 `(pointer: fine)` 且非减弱动效，输入框保留文本光标）；磁铁按钮向光标吸附 ±6px；卡片触感 `.bp-tactile` 用 scale 微放；`toast(msg, undo)` 第二参为撤销回调，「重置面试」可完整回滚会话
- **滚动驱动增强**（`motion.js`）：导航吸顶 `header.scrolled` 收缩 56→48；落地页分段 `scroll-snap-type: y proximity` 吸附；窄屏统计卡组转 `.bp-gallery` 横向画廊；`[data-speed]` 按滚动位差速视差
- **数据可视化**（`viz.js`）：热力图 4×6 墨阶色阶（峰值朱红标记）、散点图百分比定位，均带 `.bp-tip` 悬浮详情；`enhanceTable()` 支持表头排序、关键字筛选、分页、导出 CSV（带 UTF-8 BOM）；图表卡片 HTML5 拖拽换位并持久化顺序；`startLive()` 轮询读取真实会话状态刷新 4 条指标
- **高级组件**（`motion.js` + `viz.js`）：弹窗可拖拽（transform 平移不破坏居中）且右下角可缩放；分步向导 `.bp-stepper`、时间轴 `.bp-tl`、可折叠侧栏 `.bp-aside`；`withVT()` 用 View Transition API 包装 `showView`，无 API 时直接执行

**🔧 优化改进**

- **印刷风纪律守恒**：毛玻璃 / 卡片上浮 / 多层阴影 / 渐变四项改用等价表达——半透明纸底、墨阶叠层、outline 外扩、纸纹噪点；v17 断言「全站无 backdrop 滤镜」仍为绿色
- **无障碍与降级**：自定义光标仅桌面精细指针启用；reduced-motion 下光标 / 磁铁 / 视差 / 实时流全部停用；无 View Transition API 环境直接执行不丢行为

**📊 数据指标**

| 前端断言 | 后端测试 | 单元测试 | v29 新增 | jsdom 套件 |
|---|---|---|---|---|
| 1240 | 17 | 16（vitest） | 103 | 17 套 |

### Beta 1.0.8 · 深度交互层：让每个动作都有回音（2026.10.22）

> 在 1.0.7 把「图纸动作」铺满全站之后，本轮把交互做深：命令面板升级为 Pro——记录最近访问（`sessionStorage` 落 `RECENT_KEY`），过滤改用标签前缀 > 子串 > 子序列三级评分，面试页自动注入「清空对话 / 切换模式 / 查看评分」三条上下文指令；报告页把雷达图与维度表联动——雷达顶点自绘 `stroke-dashoffset` 描边动画，维度行 hover 与对应顶点互相反向点亮，悬浮提示显示维度评分与点评；表单聚焦时墨色发丝线自左画出；面试 AI 气泡支持实时批注，批注文本落到 `session.turns[i].notes` 并随会话持久化（零新增存储）。全部遵循蓝图编辑风与动效宪法（含 reduced-motion 静态落位）。v27 测试套件 44 项断言锁定全部行为。

**✨ 新增功能**

- **命令面板 Pro**（`command.js`）：最近访问分组（`loadRecent`/`saveRecent`/`recordRecent`，经 `window.navTo` 包装记录并保持原跳转行为）；`scoreAction(a,q)` 三级评分；面试页 `dynamicActions()` 动态注入 3 条上下文指令；`cycleMode()` 切换面试模式
- **报告可视化联动**（`report.js` + `appfx.js`）：雷达 `radar-pop` 多边形自绘描边动画，顶点 `<circle id="radar-dot-${i}">`；维度行 `data-dim` 与顶点双向 hover 点亮；`.dim-tip` 悬浮提示显示 `dimension · score` 与 `comment`
- **表单焦点发丝线**（`appfx.js` `initFormFx`）：`.auth-field` 注入 `.bp-field-line`，聚焦时 `scaleX(1)` 自左画出
- **面试实时批注**（`appfx.js` `initAnnotation` + `interview.js` 锚点）：`MutationObserver` 装饰 `.msg-ai` 加「批注」按钮，textarea 值落到 `session.turns[idx].notes` 并 `persistSession()`

**🔧 优化改进**

- **动效宪法落地**：雷达描边、发丝线、悬浮提示在 reduced-motion 下全部 `animation:none`/`transition:none` 静态落位
- **蓝图编辑风**：描边动画沿用墨/朱红色板，无渐变、无投影、零上浮

**📊 数据指标**

| 1137       | 17        | 16（vitest） | 44         | 16 套       |
| ---------- | --------- | ------------ | ---------- | ----------- |
| 前端断言 | 后端测试 | 单元测试 | v27 新增 | jsdom 套件 |

### Beta 1.0.7 · 全站交互层：把图纸动作铺到每一个页面（2026.10.22）

> 上一轮的交互深化层只铺在落地页。本轮新增 `appfx.js`（v27 全站交互层），把同一套「图纸动作」语言推广到**应用内 10 个功能页 / 登录页 / 开发者页**：切页编舞（标题区与卡片自上而下 clip-path 揭载 + 面包屑等宽光标 + 侧栏规尺扫光）、登录页动态（密码强度四段计 + CapsLock 提示 + 分栏入场）、面试 LIVE 脉冲（MutationObserver 观察面试官轮转，零侵入打 `.speaking`）、报告与小测数字滚动（`#report-total` / `score-num` 计到终值 + 维度条自左生长）、十字准线全站化（由 landingfx 迁出，聚焦输入框时自动隐身）、坐标读数扩展（功能页卡 `PG-xx` / 开发者节 `SEC-xx`）、开发者页绘制线（12 节 stagger 展开）。同步把 `tokens.css` 里遗留的 `pageIn` 上浮位移统一为 clip-path 揭载——全站不再有任何上浮。v26 测试套件 59 项断言锁定全部行为（含 reduced-motion 双实例降级链）。

**✨ 新增功能**

- **切页编舞**：`showView` / `applyRoute` 挂钩 `choreograph()`——标题区、卡片按 `--bp-i` 索引 stagger 揭载；面包屑末级跟一枚等宽方块光标（1.2s 自消，图纸重定位）；侧栏当前项扫过一道朱红规尺光
- **登录页动态**：密码强度四段计（长度 / 数字 / 大小写 / 符号，满格朱红）、CapsLock 大写锁定提示、分栏与卡片入场；全部纯增强，不影响原有校验
- **面试 LIVE 脉冲**：`MutationObserver` 监听聊天流，面试官轮转时为徽章打 `.speaking`（朱红 tint 呼吸），替代直接改业务代码
- **数字滚动 + 维度条生长**：报告总分、小测得分计到终值；能力维度条先记录目标宽度再回填触发 .8s 生长；已计数元素打标，重复扫描不重跑
- **十字准线全站化**：从 `landingfx.js` 迁到 `appfx.js`，应用视图下同样跟随光标，聚焦输入框 / 光标出窗即隐身（不干扰录入）
- **坐标读数扩展**：14 张功能页卡挂 `PG-01…` 编号、12 个开发者节挂 `SEC-01…` 编号，hover 显示 X/Y 测绘读数；落地页 9 张特性卡 `BLK-xx` 保持
- **开发者绘制线**：每个 `eval-section` 顶部注入 2px 墨线，入视口自左画出，按索引 120ms stagger

**🔧 优化改进**

- **揭载语言统一**：`tokens.css` 中与 `theme.css` 同名的 `@keyframes pageIn` 去掉 `translateY(8px)`，统一为 `clip-path: inset(18px 0 0 0)` 自上而下裁切，消除重复定义与唯一一处上浮位移
- **模块职责收敛**：`landingfx.js` 交出十字准线 / 坐标读数，专注落地页轮播与实录播台；`appfx.js` 统一承载全站测绘语言
- **渐进增强**：无 JS 时所有内容完整可见；reduced-motion 下编舞、脉冲、扫光、光标、绘制线全部静态落位，功能不缺失

**📊 数据指标**

| 1093       | 17        | 16（vitest） | 59         | 15 套       |
| ---------- | --------- | ------------ | ---------- | ----------- |
| 前端断言 | 后端测试 | 单元测试 | v26 新增 | jsdom 套件 |

### Beta 1.0.6 · 交互深化层：命令面板与滚动语言（2026.10.22）

> 在动态层之上增加**交互深化层**：命令面板（Ctrl/⌘+K 呼出，17 项命令覆盖区块跳转 / 10 个功能页 / 主题切换 / 开发者模式 / 回顶，分组 + 过滤 + 全键盘导航，面试页保留聚焦输入框原行为）；滚动驱动三件套——返回顶部（直角墨框 + SVG 朱红进度环，600px 阈值）、落地页导航滚动侦测（当前区块点亮朱红下划线）、工作流蓝图绘制线（入视口自左画出，120ms stagger）；落地页动态四件套——Hero 等宽打字机轮播（5 条价值点 + 方块硬切光标）、面试实录气泡依序揭载 + 流式光标、蓝图十字准线（落地页光标测绘线，触屏 / reduced-motion 不注入）、特性卡坐标读数（BLK 编号 + X/Y 测绘 chip）。新增 `scrollfx.js` / `landingfx.js` / `command.js` 三个模块，v25 测试套件 64 项断言锁定全部行为。

**✨ 新增功能**

- **命令面板**（`command.js`）：⌘K 懒建注入，分组渲染（导航 4 / 页面 10 / 动作 3）、子串过滤、↑↓ / Enter / Esc 全键盘、遮罩点击关闭、`aria-selected` 无障碍态；面板延续直角墨框 + 朱红选中条语言
- **返回顶部 + 进度环**（`scrollfx.js`）：SVG 圆环 `stroke-dashoffset` 映射滚动比例，rAF 节流 + passive 监听，点击平滑回顶（reduced-motion 瞬时）
- **滚动侦测 + 蓝图绘制线**：导航当前区块点亮（与 hover 扫入共用 underline 语言）；工作流步骤顶部 2px 墨线入视口自左画出，按索引 stagger
- **Hero 打字机轮播**（`landingfx.js`）：等宽逐字敲出 + 删除循环，页面隐藏时暂停定时器；reduced-motion 静态落位首句
- **面试实录播台**：Mock 气泡入视口依序 clip-path 揭载，末气泡跟朱红流式光标预告 SSE 逐字体验；切回落地页自动重播
- **十字准线 + 坐标读数**：落地页 1px 墨色十字线跟随光标（opacity .16）；特性卡 hover 显示 BLK 编号 + X/Y 测绘 chip

**🔧 优化改进**

- **构建链扩展**：`split-frontend.js` 与 `build-manifest.json` 注册三个 v26 模块（横幅标题自动探测），round-trip 保持逐字节重建
- **视图切换联动**：`showView` 离开落地页时收起准线、清除导航点亮，回到落地页重播实录播台
- **渐进增强**：无 JS 时实录完整可见、轮播为空；reduced-motion 下全部静态落位、功能不缺失

**📊 数据指标**

| 1031       | 17        | 16（vitest） | 64         | 14 套       |
| ---------- | --------- | ------------ | ---------- | ----------- |
| 前端断言 | 后端测试 | 单元测试 | v25 新增 | jsdom 套件 |

### Beta 1.0.5 · 动态层：粒子场与微交互（2026.10.22）

> 在体验层之上增加**动态层**：全站 Canvas 粒子场——方形墨点 + 发丝线连线 + 稀疏朱红标记的「图纸测绘点」气质（严禁圆点/发光/渐变，密度刻意压低），光标附近粒子受轻微斥力、落地页点击产生朱红方形涟漪；Hero 双栏鼠标视差（规格面板与预览窗反向微移 ±7px，空间深度而非上浮）。微交互批次：按钮方形涟漪、消息气泡左淡入、雷达扫描线旋转、导航下划线扫入、取景角标 hover 延展、文档顶规 hover 点亮朱红。粒子层带完整降级链：无 canvas → 无 2d context → reduced-motion 静态帧 → document.hidden 暂停，全部服从动效宪法。

**✨ 新增功能**

- **蓝图粒子场**（`particles.js`）：DPR 适配（上限 2x）、粒子数按视口面积封顶（30–90）、rAF 驱动 + 被动监听、主题切换周期重读色板、`aria-hidden` 对辅助技术隐藏
- **鼠标交互**：110px 半径斥力（「吹散」效果）、落地页视图点击方形涟漪（应用内不误触）、Hero 双栏反向视差 + mouseout 回弹
- **微交互六件套**：按钮涟漪（currentColor 方形扩散）/ 气泡进入（msgIn 左淡入）/ 雷达扫描（4s 一圈）/ 导航下划线扫入 / 角标延展（13→20px）/ 顶规点亮（hover 朱红）

**🔧 优化改进**

- **构建链扩展**：`split-frontend.js` 与 `build-manifest.json` 注册 particles 模块（横幅「v25 · 蓝图粒子层」自动探测），round-trip 保持可逐字节重建
- **降级链完备**：无 2d context 时画布移除、reduced-motion 静态渲染一帧后停笔、页面隐藏时暂停 rAF——任何环境不白屏不报错

**📊 数据指标**

| 967        | 17        | 16（vitest） | 43         | 13 套       |
| ---------- | --------- | ------------ | ---------- | ----------- |
| 前端断言 | 后端测试 | 单元测试 | v24 新增 | jsdom 套件 |

### Beta 1.0.4 · 体验层增强 · 交互反馈与可访问性（2026.10.22）

> 视觉体系确立后的**体验层深化**：新增「蓝图 UX Kit」——打字指示器（三点墨点 stagger 脉冲，LLM 流式首字到达前的等待反馈）、面试初始空状态（虚线发丝框 + 等宽眉标 + 可点击建议 chip + 快捷键提示）、滚动进度线（fixed 顶部朱红 2px，rAF 节流）、Toast 划入动画（左侧朱红竖线 + 墨板右滑）。交互语言全面校准：渐入动画由 Arkira 时代残留的 translateY 上浮改为**印刷揭载**（clip-path 自上而下揭开，与「零上浮」设计语言统一），视图切换退化为纯淡入，按钮新增按压反馈（1px 位移）与键盘焦点双圈。工程侧新增**动效宪法**：prefers-reduced-motion 全局覆盖、平滑滚动、触屏去蓝闪。

**✨ 新增功能**

- **打字指示器**：`.typing-dots` 三点墨点脉冲 + 等宽标签，真实 LLM 流式与 Mock 打字机双通道均已接线（首字到达即接管），失败降级路径同步清理
- **面试空状态引导**：新用户第一眼看到三条可点击建议 chip（Java 后端 / 前端进阶 / 转行交叉）与快捷键提示，而非空白或一行系统文字；有历史会话时由 restoreSession 独占渲染，不出现空态残留
- **滚动进度线**：fixed 顶部 2px 朱红，rAF 节流 + passive 监听，`aria-hidden` 对辅助技术隐藏，reduced-motion 下隐藏
- **Toast 划入**：左侧朱红竖线 + 墨板右滑 0.28s，与既有墨板 toast 样式合并升级

**🔧 优化改进**

- **渐入气质修复**：tokens.css 的 `.reveal` 从 Arkira 残留 `translateY(24px)` 上浮改为 `clip-path: inset(14px→0)` 印刷揭载——与 hover「零上浮」语言统一，且彻底消除动画 transform 与 hover transform 的互相覆盖
- **视图切换纯淡入**：`viewIn` keyframes 去掉 translateY(14px)，页面切换更克制
- **动效宪法**：`@media (prefers-reduced-motion: reduce)` 全局覆盖（一切动画/过渡 .01ms 瞬时化 + 关闭平滑滚动），`html { scroll-behavior: smooth }` 服务锚点跳转，`-webkit-tap-highlight-color: transparent` 去触屏蓝闪
- **按钮反馈分层**：`:active` 按压 1px（按下反馈，非悬浮）、`:focus-visible` 键盘焦点双圈（朱红外圈 + 品牌底光环）、`:disabled` 态明确

**📊 数据指标**

| 924        | 17        | 16（vitest） | 44         | 12 套       |
| ---------- | --------- | ------------ | ---------- | ----------- |
| 前端断言 | 后端测试 | 单元测试 | v23 新增 | jsdom 套件 |

### Beta 1.0.3 · 蓝图编辑风视觉重构（2026.10.21）

> 针对「AI 默认模板」风险的视觉体系整体重构：彻底摆脱蓝紫渐变、玻璃拟态圆角卡、径向光晕与 hover 上浮的模板三件套，确立**「蓝图编辑风（Blueprint Editorial）」**设计语言——暖纸底面 + 淡蓝图网格（工程图纸感）、墨色正文 + 衬线大标题 + 等宽字体标注（编辑排版三件套）、全直角 + 发丝线分隔 + 零投影（层次靠线条而非阴影）、单一朱红强调色（红笔批注 / 印章，全局占比 ≤5%）。功能 DOM / ID / class 全保留，视觉断言随新体系同步重写。

**✨ 新增功能**

- **蓝图编辑风设计系统**：`theme.css` 全量重写——纸 / 墨 / 线 / 朱红四组令牌、暗色主题同构、衬线 + 等宽 + 无衬线三字体栈；`body` 四层蓝图网格（36px 细线 + 180px 主线，fixed 附着不随滚动）
- **签名装置**：眉标（编号 + 等宽标签 + 通栏发丝线）、取景器角标（左上 + 右下朱红 L 括线，非对称）、斜置双线印章、能力走马灯（无缝循环）、规格表面板（点线引导键值行）
- **Hero 非对称重构**：1.4fr / 0.6fr 双栏——左栏衬线大标题 + 真实指标行（真实后端 / 5 Agent / 880 / 37 页），右栏 `RUNTIME SPEC` 规格表面板（GLM-4-Flash / 5 席 / 880 + 17 / Live 印章）；等宽窗栏替代 mac 圆点
- **changelog 与技术文档同风格重塑**：更新日志页、技术文档从 indigo 蓝紫系切换为纸墨 + 朱红，文档式结构不变

**🔧 优化改进**

- **扁平化 33 处渐变**：渐变按钮 / Hero 渐变文字 / CTA 通栏 / VIP 深金卡 / 骨架屏等全部改为平色或墨板反白；28 处 `backdrop-filter` 玻璃拟态三层清零
- **去圆角 / 投影 / 上浮**：250+ 圆角与 107 处阴影全局归零（保留 50% 圆形头像），hover 语言从 `translateY` 上浮改为描边变化
- **图标系统去 emoji**：9 个特性卡 emoji → 等宽编号 `01`–`09`，徽章改方形等宽，主题色 tooltip「紫」→「朱红」
- **测试基线 879 → 880**：v17 视觉断言随设计语言换代重写（57 → 58 项），11 套 jsdom 全绿；`split-frontend.js` / `build-manifest.json` 分区定位针同步更新，round-trip 保持可逐字节重建

**📊 数据指标**

| 924        | 17        | 16（vitest） | 33         | 28          |
| ---------- | --------- | ------------ | ---------- | ----------- |
| 前端断言 | 后端测试 | 单元测试 | 渐变扁平化 | 玻璃拟态清除 |

### Beta 1.0.2 · 原创性论证与真实度提升（2026.10.21）

> 面向使用者的**原创性论证与真实完成度**专项加强：技术文档新增第 7 章「核心算法详解与原创性论证」，把多 Agent 协作调度、RAG 混合检索与重排、评分引擎的设计与校准过程写成可当场复现的章节；线上两个入口接通**真实大模型**（智谱 GLM-4-Flash，SSE 流式逐字生成、服务端评分落库）；演示页「仅为 Mock」的过时标注全面修正为双形态口径。本版本功能集延续 Beta 1.0.1，聚焦证据链与材料质量。

**✨ 新增功能**

- **第 7 章「核心算法详解与原创性论证」**：三大算法逐一展开——多 Agent 圆桌协作的派发调度、RAG 混合检索 + 五特征重排（`final = 0.55 × hybridNorm + 0.45 × featScore`，特征权重 title 0.34 / phrase 0.24 / tag 0.22 / type 0.12 / len 0.08）、评分引擎的双引擎对拍与确定性校准（标准样本 C1–C5 总分 55 → 82 单调可分，Python/JS 舍入规则统一）；每个设计选择绑定具体工程问题并给出可当场验证的证据
- **评分校准体系成文**：校准总分演进表、舍入缺陷修复（90.5 → 91 的统一舍入规则）、双引擎对拍与 11 条校准断言常驻回归
- **真实模型上线**：`backend/.env` 配置 GLM-4-Flash Key，`/api/health` 返回 `llm_ready: true`；线上 SSE 流式、JWT 登录、面试会话持久化、服务端评分报告全链路实测可用
- **演示文稿**（`FutureMirror.Deck.pptx`，16 页）：三大核心算法论证 + 真实完成度 + 现场验证入口，与技术文档第 7 章配套

**🔧 优化改进**

- **演示页标注口径修正**：6 处页面级声明从「仅为 Mock」改为双形态表述（在线连接真实后端 / 离线自动降级本地 Mock）；版本号统一为 Beta 1.0.2（标题 / 横幅 / 页脚 / 开发者模式 / 诊断导出）
- **测试基线 870 + 6 → 879 + 17**：9 个 jsdom 文件 634 项 + 217 项无头逻辑 + 28 项模块启动 = 879；后端 pytest 17 项；技术文档同步升版 v1.1
- **摘除过时「开发中」标注**：架构图中「pgvector 混合检索 + Rerank（开发中）」的「（开发中）」移除——混合检索与五特征重排均已完成

**📊 数据指标**

| 967        | 17        | 16（vitest） | 37      | 16 页    |
| ---------- | --------- | ------------ | ------- | -------- |
| 前端断言 | 后端测试 | 单元测试 | 文档页数 | 演示文稿 |

### v22 · 后端适配与工程化（2026.10）

> FastAPI 后端落地——SQLite 数据模型 + scrypt 密码哈希 + JWT 鉴权、GLM SSE 流式代理（**Key 只存服务端环境变量**）、评分引擎 Python 同构移植、面试会话与报告落库；演示版改造为"后端优先 + 三级降级"（`fmApi` 适配层：健康检查 30s 缓存 / SSE 分片解析 / 登录注册走后端 / 报告服务端生成 + 本地兜底）；单文件版按版本横幅机械拆分为 `frontend/` 29 模块 + 3 CSS 层，`build-demo.js` 可逐字节重建。

**✨ 新增功能**

- **FastAPI 后端**：`backend/` 目录，含 `db.py` / `llm.py` / `scoring.py` / `main.py`，附 `.env.example` 与 pytest 冒烟 + 评分引擎单测（6 项）
- **鉴权体系**：JWT（HS256，12h TTL）+ scrypt 密码哈希；`demo@futuremirror.app` 注册即自动 VIP
- **SQLite 持久化**：`users` / `interviews` / `turns` / `reports` 四张表；`/sync` 按 `seq` 幂等去重
- **SSE 流式代理**：`/api/chat/stream` 通过 `httpx` 流式转发到 GLM 的 OpenAI 兼容端点，Key 不出后端
- **前端 `fmApi` 适配层**：健康检查 30s 缓存 / SSE 分片解析 / 登录注册走后端 / 报告服务端生成 + 本地兜底
- **三级降级**：后端真实 → 浏览器直连 Key → 本地 Mock；后端 5xx / 超时同样回退，演示不中断
- **报告页徽章**：「服务端评分引擎 · 已落库」/「启发式引擎演示」两态自动切换
- **单文件版拆分**：`scripts/split-frontend.js` 按版本横幅机械拆出 `frontend/` 27 模块；`scripts/build-demo.js` 反向合并（除 hashchange 监听归位外逐字节一致）
- **契约核对（v22.1）**：批量 `/sync` 与 body 版 `/report` 前后端一致，`match_score / code_score / match_gaps` 全程参与服务端评分

**🔧 优化改进**

- **登录 / 注册优先走后端**：后端在线时走 scrypt + JWT；不可达时回退本地演示账号，功能一致
- **报告页同会话只同步一次**：签名 `interviewId:轮数:匹配分:代码分` 命中即跳过，切页不重复请求
- **直连 Key 模式保留**：后端离线时的逃生通道，Key 仅存 sessionStorage，关闭即清除

**🐛 缺陷修复（v22.1）**

- **「后端登录后刷新掉线」**：后端用户写入本地用户表供 `restoreUser` 找回；**不落 passHash**，后端在线时登录永远走后端校验
- **「RAG / 简历改写 / AI 小助手退化为关键词检索」**：后端在线时同样走模型（Key 在服务端），不再误判为无 Key 状态
- **「再来一次」不重置 interviewId**：导致新一轮问答被 `/sync` 判重为"已入库"，报告读到上一轮旧数据；现重置 `session.interviewId`
- **「秒点登录误走本地分支」**：后端探测无结论时先等待探测（`await fmApi.checkHealth()`），避免竞态
- **「`llmLabel()` 在 llm 为空时报 TypeError」**：返回「Mock 模式」而非抛异常

**📊 数据指标**

| 6         | 3    | 27   | 4    |
| --------- | ---- | ---- | ---- |
| 后端 pytest | 降级层级 | 前端模块 | 数据库表 |

### v21 · 悬浮球拖拽冻结 + 移动端美化（2026.10）

> AI 悬浮球从"固定右下角"升级为"可拖动并贴边冻结"——位置按账号持久化，边界钳制不越界，误触抑制不误开抽屉；移动端做一轮系统性的体验优化：大圆角卡片、触控 ≥42px、输入框 16px 防 iOS 缩放、底部弹层把手与安全区适配。

**✨ 新增功能**

- **悬浮球拖拽**：pointer 事件接管拖动（`touch-action: none`），位移阈值 6px 抑制误触；拖动中按实时位置判定贴边
- **贴边冻结**：松开后以 style 实时位置判定 left / right，贴边留白 16px；`pos = { side, y }` 持久化到 `fm_ai_fab`
- **左侧镜像抽屉**：冻结在左侧时抽屉从左侧滑出（`body.ai-fab-left`），符合视线与操作习惯
- **首次进入提示光环**：`.ai-fab.hint::after` 脉冲 2 次，提示"可拖动"
- **视口变化重新钳制**：resize 时 120ms 防抖重算位置，避免越界
- **抽屉打开时收起悬浮球**：`body.ai-open .ai-fab` 淡出缩放，不遮挡对话
- **移动端页面美化**：卡片 18px 大圆角 + 柔和投影、按钮 ≥42px、`input` 16px 防自动放大、底部弹层把手、`env(safe-area-inset-bottom)` 适配
- **触控反馈**：tabbar / quick-entry / quiz-opt 等 `:active` 缩放 0.94–0.99

**🔧 优化改进**

- 顶部导航栏采用 momentum 滚动 + 轻投影
- Toast 贴边留白（`bottom: calc(20px + env(safe-area-inset-bottom))`）
- 移动端 AI 悬浮球默认位置避开顶部导航栏与底部安全区

**📊 数据指标**

| 6px  | 16px | 42px   | 100%    |
| ---- | ---- | ------ | ------- |
| 拖动阈值 | 贴边留白 | 触控最小高度 | 位置按账号记忆 |

### v20 · 题库增强 + AI 小助手 + 移动端导航顶部化（2026.10）

> 把题库从"做一轮小测"升级为"持续刷题训练"：错题本、收藏夹、题目搜索、三种练习模式、每日一练、学习数据看板；同时用 AI 小助手把分散的功能入口收拢成对话式引导，并把移动端导航从底部 Tab 移到顶部，解决底部栏与 iOS 手势区冲突的问题。

**✨ 新增功能**

- **错题本（VIP）**：自动收录答错与超时的题目，支持按分类筛选、重复练习、移除已掌握；持久化到 `fm_wrong`
- **收藏夹**：每道题增加星标按钮，收藏状态持久化到 `fm_fav`，支持单独练习收藏夹；三处状态同步
- **题目搜索**：按题目文本 / 选项文本 / 分类名称关键词匹配，返回匹配列表并支持直接跳转练习
- **顺序练习 / 章节练习**：在原有"随机抽 5 题限时小测"之外，新增不限时的顺序模式与章节模式，`quizState.mode` 扩展为 `exam` / `practice` / `chapter`
- **每日一练 + 连续打卡**：每天从题库随机抽 3 题，完成即算打卡，记录连续打卡天数；持久化到 `fm_daily`
- **学习数据看板增强**：在"成绩档案"基础上新增正确率趋势、各分类掌握度、累计刷题数
- **AI 小助手**：桌面端右下角圆形悬浮球，移动端固定顶部导航下方；点击展开抽屉式对话面板，支持预设意图跳转、RAG 检索、流式回答、Mock 兜底
- **移动端导航顶部化**：`.app-tabbar` 从 `bottom: 0` 改为 `top: 58px`，紧贴顶栏下方，横向滚动不遮挡内容

**🔧 优化改进**

- **刷题模式选择条**：小测页新增 `.quiz-mode-bar` 三态切换（限时模考 / 顺序练习 / 章节练习）
- **学习面板搜索**：`.quiz-search-box` + 命中列表，一键练习命中题目
- **入口卡**：收藏夹 / 错题本作为学习面板顶部的双卡片入口
- **主内容区适配**：`.app-main` 顶部 padding 增加到"顶栏 58px + 导航栏约 44px"，底部不再需要为 Tab 栏留空间
- **AI 悬浮球避开顶部导航**：移动端 `.ai-fab` 的 `top: 112px`

**📊 数据指标**

| +4   | +1     | 5       | 3    |
| ---- | ------ | ------- | ---- |
| 刷题模块 | AI 小助手 | 移动端核心入口 | 刷题模式 |

### v19 · 题库小测模块 + VIP 会员体系（2026.10）

> 把"刷题"从模拟面试的附属功能升级为独立模块。新增 5 个知识分类共 24 道选择题，支持"知识点学习 + 限时小测 + 成绩档案"三态切换；同时引入 VIP 会员体系，把 VIP 专属分类、无限次小测、成绩档案归档与免费用户区分开，形成可持续的商业化钩子。

**✨ 新增功能**

- **题库页（quiz）**：新增第 10 个功能页，含 3 个子页签（知识点学习 / 限时小测 / 成绩档案）
- **5 个知识分类**：SQL 数据库（6 题，免费）/ 计算机网络（6 题，免费）/ 操作系统（4 题，VIP）/ 算法与数据结构（4 题，VIP）/ STAR 行为面（4 题，VIP），共 **24 题**
- **学习模式**：每题 4 个选项 + 正确答案标记 + 详细解析，先建立知识框架再做题
- **限时小测**：每轮 5 题，每题 60 秒倒计时，答错或超时立即展示解析，自动判分
- **成绩档案**：累计次数 / 平均分 / 最高分 / 累计答对 / 历史记录列表，持久化到 `fm_quiz`
- **VIP 会员体系**：<demo@futuremirror.app> 登录自动获得 VIP；顶栏新增 VIP 徽章；个人中心新增 VIP 权益卡；侧栏新增 VIP 徽章
- **免费 / VIP 分级**：免费用户每日 1 次小测、解锁 2 个分类；VIP 用户不限次数、解锁全部 5 个分类

**🔧 优化改进**

- **工程自检扩展到 9 项**：新增"题库结构完整性""VIP 判定逻辑""题库计分正确性"三项内联断言
- **底部 Tab 扩到 9 格**：新增题库入口，移动端底部栏承载 9 个功能入口
- **侧栏新增题库入口**：桌面端左侧栏"训练与评估"分组下新增「📝 题库小测」
- **报告封面加入 VIP 徽章**：VIP 用户的评估报告封面显示「👑 VIP 会员」
- **顶栏状态胶囊联动**：VIP 徽章与用户登录态、Mock/真实模式并列展示

**📊 数据指标**

| 5    | 24   | 3      | 9    |
| ---- | ---- | ------ | ---- |
| 题库分类 | 题库题目 | VIP 分类 | 自检断言 |

### v18 · 产品闭环深化 · 求职管理 + 面试真实感（2026.10）

> 补齐从"训练"到"实战"的最后一环：新增求职管理页（投递看板 + 面试复盘），让模拟面试的表现数据与真实面试的复盘结论形成对流；同时通过答题计时器、连环追问、HR 与压力面专属题库，把面试的真实感从"概念"落到可感知的交互。

**✨ 新增功能**

- **求职管理页（jobs）**：新增第 9 个功能页，含 2 个子页签
- **投递看板**：5 阶段（已投递 / 笔试中 / 面试中 / 已拿 Offer / 已拒绝），支持上下移动与删除，实时统计总投递 / 进行中 / Offer / 转化率
- **面试复盘**：6 轮对话补全（公司 / 轮次 / 最难问题 / 当时回答+自评 / 结果 / 改进点），自动生成可回查的复盘结论，持久化到 `fm_reviews`
- **答题计时器**：每题 90 秒倒计时，≤15 秒警示，超时自动写入「抗压表现」维度证据
- **连环追问机制**：识别技术关键词后，35% 概率触发连续 2 轮深挖同一点，呈现"Agent 决策"而非固定轮转
- **HR / 压力面专属题库**：HR 面试官使用动机 / 稳定性专属题库，压力面试官引入"打断-否定-要求举证"三段式话术
- **语音输入实时反馈**：纯本地规则计算语速与填充词密度，零网络请求
- **句子级改写建议**：规则引擎自动识别无量化动词句，按维度给出改写模板，无需 LLM

**🔧 优化改进**

- **玻璃拟态可读性修正**：亮色下更明确的玻璃边界 + 更深层级阴影；暗色辅助文字 `--faint` 提升到 `#8A90B8`，满足 WCAG AA
- **Bento Grid**：快速入口的核心卡片（简历匹配 / 模拟面试）跨列放大，形成视觉优先级
- **底部 Tab 扩到 8 格**：新增「📋 求职」入口
- **报告页新增复盘入口卡**：从报告可直接跳转到面试复盘

**📊 数据指标**

| 5 | 6 | 90s | 35% |
|---|---|---|---|
| 投递阶段 | 复盘对话轮次 | 答题时限 | 连环追问概率 |

### v17 · 深海蓝 AI Native 视觉重构（2026.10）

> 从"高信息密度工具风"转向"AI Native 产品的设计语言"：深海蓝 + 电光蓝的品牌基调、玻璃拟态卡片、衬线标题与无衬线正文的对比、滚动渐入的入场节奏。视觉上从"工具感"提升到"产品感"，同时保留所有功能不变。

**✨ 新增功能**

- **深海蓝主题**：暖白背景 `#FAFBFF` + 深海军蓝文字 `#10163A` + 电光蓝品牌色 `#2E3FE8`
- **午夜蓝暗色模式**：`#070B1F` 基底 + 奶油白文字 `#F0EEE9`，替代原刺眼纯白
- **玻璃拟态**：卡片、顶栏、侧栏使用 `backdrop-filter: blur(16px)` + 半透明背景 + 玻璃边框 + 内高光
- **衬线标题**：h1 / h2 使用 Georgia / Songti SC 衬线字体，与无衬线正文形成对比
- **滚动渐入**：`IntersectionObserver` + `transitionend` 清理，避免与 hover 的 transform 冲突

**🔧 优化改进**

- 顶栏从纯色改为玻璃效果（`saturate(180%) blur(18px)`）
- 主按钮从纯色改为品牌色渐变 + 微光阴影
- 卡片 hover 从 `translateY(-3px)` 改为带缓动曲线的上浮
- 登录页左右分栏的品牌色渐变重绘
- 落地页 Hero 区域使用网格背景 + 多层径向渐变

**📊 数据指标**

| 2 | 3 | 16px | 0 |
|---|---|---|---|
| 主题（亮/暗） | 品牌色变体 | 玻璃模糊半径 | 功能变更 |

### v16 · 个人中心 · 头像系统 · 偏好与数据管理（2026.10）

> 首次引入"用户画像"概念：个人中心不只是头像和昵称，而是把求职信息、技能标签、偏好设置与数据管理集中在一个页面，让简历匹配、职业探索、模拟面试、评估报告都能读取同一份用户档案，形成"资料越完整、推荐越准确"的正向循环。

**✨ 新增功能**

- **个人中心页（profile）**：新增第 8 个功能页
- **三态头像**：上传图片（自动压缩为 128px）/ 18 种 emoji / 姓名首字母（自动生成渐变底色）
- **求职信息表单**：姓名 / 城市 / 目标岗位 / 学历 / 年限 / 状态 / 简介 / 技能标签（最多 8 个）
- **资料完成度**：7 项检查加权 100 分，顶部进度条实时反映
- **偏好设置**：暗色模式 / 语音输入 / 面试官自动朗读 / 每周学习提醒
- **数据管理**：本地存储占用条 / 导出个人数据 JSON / 清除全部数据
- **报告封面**：头像 + 姓名 + 目标岗位 + 日期 + 编号（`FM-UID-YYYYMMDD`）

**🔧 优化改进**

- 用户下拉菜单新增「👤 个人中心」入口
- 头像在顶栏、下拉菜单、个人中心、报告封面四处同步
- 所有个人资料持久化到 `fm_profile`，按用户 ID 前缀隔离

**📊 数据指标**

| 3 | 7 | 8 | 4 |
|---|---|---|---|
| 头像形态 | 完成度检查项 | 技能标签上限 | 偏好开关 |

### v15 · Beta · 工作台精简与互动升级（2026.10）

> Beta 版本收尾。工作台从"半成品拼接"升级为"干净的产品首页"：项目材料收进开发者模式，只服务访客；6 张快速入口卡片和 4 张数据看板卡全部可点击；新增"今日推荐岗位"制造每次打开的新鲜感。

**✨ 新增功能**

- **今日推荐岗位**：从 24 个岗位中随机抽取 4 个，点击直达模拟面试，支持"🔄 换一批"
- **快速入口升级为 6 张互动卡片**：hover 时渐变光晕 + 图标放大旋转 + 箭头滑入 + 描述展开
- **数据看板可点击跳转**：4 张 stat-card 全部绑定对应功能页，hover 显示 → 箭头

**🔧 优化改进**

- **工作台去材料化**：删除 dashboard 里的"项目材料"区块（4 个跳转按钮），仅开发者模式可见
- **Hero 区域放大**：h1 从 46px 提升到 48px，padding 从 48px 提升到 56px，视觉更大气
- **Agent 圆桌可点击**：HR / 技术 / 压力面 / 教练 4 个 Agent 点击跳转对应页面
- **首访引导增强**：新增右上角光晕装饰 + 层级调整
- **MCP 提示行美化**：从纯文本提示升级为虚线框提示卡

**📊 数据指标**

| 6 | 4 | 100% | 0 |
|---|---|---|---|
| 快速入口 | 今日推荐 | 卡片可点击 | 材料暴露 |

### v14 · 开发者模式升级（2026.10）

> 把"验证专区"正式升级为"开发者模式"。新增运行环境检测、性能指标、诊断日志、5 个开发者工具，让访客可以一站式验证技术能力，不再只是"看图"。

**✨ 新增功能**

- **运行环境检测**：自动识别浏览器 / OS / 语言 / 网络 / 屏幕 / 视口 / DPR / CPU 核心 / 设备内存
- **技术能力矩阵**：9 项能力检测（WebGL / WebGPU / Web Speech ASR / TTS / Worker / IndexedDB / Clipboard / Web Share / File API）
- **性能指标面板**：页面加载耗时 / DOM 节点数 / JS 堆内存 / 知识库条目 / 岗位数 / MCP 工具数
- **诊断日志终端**：终端风格，记录最近 100 条关键操作事件（时间 + 类型 + 消息）
- **5 个开发者工具**：导出诊断 JSON / 复制测试账号 / 切换 LLM 模式 / 重置引导 / 清空本地数据

**🔧 优化改进**

- "验证专区"全站改名为"开发者模式"
- 顶栏"代码仓库"按钮替换为「🎛 开发者模式」
- 落地页底部入口同步改名为「🎛 开发者模式」
- 密码弹窗文案全面更新

**📊 数据指标**

| 9 | 6 | 5 | 100 |
|---|---|---|---|
| 环境检测项 | 性能指标 | 开发者工具 | 日志上限 |

### v13 · 验证专区（加密 + 一键进入）（2026.09）

> 新增加密的"验证专区"，把技术验证内容（工程自检、MCP 运行时验证、技术架构、评分映射）从普通用户视野中隔离。提供三种进入方式：URL 一键、密码 `FM2026`、快捷键 `Ctrl+Shift+J`。

**✨ 新增功能**

- **验证专区视图**：`#/evaluator?key=FM2026` 独立视图
- **交付材料清单**：5 个材料（仓库 / 视频 / 文档 / 在线演示 / 测试账号）状态与跳转
- **工程自检面板**：5 项内联断言可视化运行
- **MCP 运行时验证**：3 个工具的 tool_call → 执行 → JSON 返回完整链路
- **评分维度映射表**：6 大评分维度 → 具体实现 → 快速跳转
- **已知边界清单**：6 条诚实声明
- **密码 modal**：`FM2026` 解锁，`sessionStorage` 持久化

**🔧 优化改进**

- 普通 dashboard 的"MCP 工具清单"增加提示行，指向验证专区
- 落地页 CTA 区域下方新增"复核入口"按钮

**📊 数据指标**

| 5 | 5 | 3 | 3 |
|---|---|---|---|
| 材料清单 | 自检断言 | MCP 工具 | 进入方式 |

### v12 · 可验证运行时能力三件套（2026.09）

> 目标是让"AI Native"从口号变成可现场验证的运行时代码。新增 MCP 实时控制台、代码面试沙盒、本地 PII 脱敏预览、工程自检面板——每一项都能被访客当场点击验证。

**✨ 新增功能**

- **MCP 实时控制台**：3 个工具（search_job_db / fetch_interview_experience / schedule_mock）注册 + 一键调用 + JSON 返回
- **代码面试沙盒**：Worker 隔离 + 2s 超时熔断，twoSum 3 个用例，通过率入评估报告
- **本地 PII 脱敏预览**：正则脱敏手机号 / 邮箱 / 身份证，0 网络请求，显示绿色徽章
- **工程自检面板**：5 项断言（简历匹配 / RAG / 评分引擎 / MCP 注册 / 岗位库完整性）

**🔧 优化改进**

- **评分引擎联动**：`session.codeScore` 并入评估报告"内容深度"维度（权重 20%）
- **简历匹配页**：新增"本地脱敏预览"按钮 + "✓ 浏览器内完成 · 0 网络请求"徽章

**📊 数据指标**

| 3 | 3 | 5 | 2s |
|---|---|---|---|
| MCP 工具 | 代码用例 | 工程断言 | 超时熔断 |

### v11 · 目标岗位下拉选择器（2026.09）

> 把"复制粘贴 JD"的原始体验升级为"选岗位即得信息卡"。24 个岗位分组呈现，选择后自动带出描述 / 薪资 / 技能 / 加分项 / 学习路径，同时自动生成匹配报告。

**✨ 新增功能**

- **岗位下拉选择器**：5 个分组（技术 / 产品 / 设计 / 商业 / 新兴）共 24 个岗位
- **岗位信息预览卡**：图标 + 薪资 + 描述 + 核心技能 + 加分项 + 5 步学习路径
- **手动输入模式**：保留 textarea 作为备选，可随时切换
- **岗位偏好持久化**：`fm_jd_id` 使用 localStorage，关闭标签页后仍记住

**🔧 优化改进**

- **自动生成 JD 文本**：选择岗位后自动构造 JD 写入底层 textarea，`analyze()` 零改动
- **自动生成匹配报告**：若简历已填，选择岗位后自动触发 `analyze()`
- **职业探索跳转联动**：`startInterviewFor()` 自动同步 `jd-select` 选中项

**🐛 缺陷修复**

- **退出后旧 JD 复活**：`logout()` 未清理 `fm_jd` 存储，修复为在 `currentUser` 置空前清理
- **手动 JD 被覆盖无提示**：切换岗位前增加 `confirm` 确认，避免误删

**📊 数据指标**

| 24 | 5 | 5 | 4 |
|---|---|---|---|
| 岗位 | 分组 | 学习步骤 | 岗位字段 |

### v10 · 导航重构与数据扩充（2026.09）

> 从"三段式导航"重构为"左侧栏 + 底部 Tab 双导航"，同时把岗位数据库从 8 个扩充到 24 个，面经知识库从 8 条扩充到 40 条，新增 3 套面试题库。

**✨ 新增功能**

- **左侧栏导航（桌面）**：240px 固定宽度，2 个分组 + 7 项 + 面试进度徽章
- **底部 Tab 栏（移动端）**：6 项（工作台 / 面试 / 匹配 / 简历 / 职业 / 面经）
- **顶栏状态胶囊**：游客 / Mock / 真实三态，替代原 7 元素顶栏
- **面包屑导航**：每页顶部显示当前页面名
- **24 个岗位数据库**：原 8 个 + 新增 16 个（运维 / 安全 / 大数据 / 嵌入式 / 区块链 / 产品运营 / 游戏策划 / 用户研究 / 视觉 / 内容 / 商业分析 / 增长 / 投资 / AIGC / AI 方案 / Prompt / MCP）
- **40 条面经知识库**：原 8 条 + 新增 32 条（公司面经 8 + 八股 9 + 手撕 4 + 行为 4 + 行业 7）
- **3 套面试题库**：general / tech / pressure 各 6 题
- **首访引导卡**：localStorage 记忆，可关闭
- **横幅可关闭**：sessionStorage 记忆
- **快捷键帮助**：⌨️ 按钮显示 Ctrl+Enter / Ctrl+K / Esc

**🔧 优化改进**

- 顶栏从 7 元素精简为 4 元素（状态胶囊 + 主题 + 主题色 + 用户菜单）
- 删除"功能导航"下拉（与子导航冗余）
- `modeLabelWithCount()` 显示题库数量
- `pickQuestion()` 优先发未问过的题库原题

**🐛 缺陷修复**

- **`init()` 早于 `CAREER_DB` 定义触发 TDZ**：`bootApp()` 移至 `bootstrapV10` 末尾
- **简历上传后数据丢失**：编程式赋值不触发 `input` 事件，手动 `store.set`
- **宽屏布局松散**：`.app-shell` 限宽 1320px
- **移动端 Tab 缺入口**：从 5 项扩展为 6 项
- **重复定义 `switchTab`**：删除重复定义

**📊 数据指标**

| 24 | 40 | 18 | 7 |
|---|---|---|---|
| 岗位 | 面经 | 题库 | 功能页 |

### v9 · 修复 HTML 结构 + 细节完善（2026.08）

> 修复 v8 引入 hash 路由后出现的严重 HTML 结构错乱：所有非 dashboard 的 app-page 被嵌套在 dashboard 内部，导致切换到任何非工作台页面时显示空白。

**🐛 缺陷修复**

- **app-page 嵌套错乱**：把 6 个非 dashboard 的 app-page 从 dashboard 中移出，做成平级兄弟元素
- **打印样式遗漏**：补充 `.app-subnav` / `.nav-dropdown-wrap` / `.guest-banner` 打印隐藏
- **`applyTabIcons()` 空转**：注释掉调用（v8 移除 `.tabs` 后已失效）

**🔧 优化改进**

- dashboard 快速入口从 4 卡扩展为 6 卡（含简历匹配 / 面经问答）
- 报告页未登录空状态增加登录引导
- 子导航左右边缘渐隐（`mask-image`）
- 切页滚动从 `smooth` 改为 `instant`
- `Esc` 键同步关闭"功能导航"下拉
- 极窄屏功能导航按钮隐藏文字，只留图标

### v8 · 多页面路由 + 导航系统（2026.08）

> 把"单页塞满所有功能"重构为"7 个独立页面的应用"。新增 hash 路由、顶部子导航栏、用户头像旁的"功能导航"下拉，刷新后保持当前页。

**✨ 新增功能**

- **hash 路由系统**：7 个页面 `#/dashboard` / `#/match` / `#/interview` / `#/rag` / `#/resume` / `#/career` / `#/report`
- **顶部子导航栏**：横向胶囊导航，激活态高亮
- **功能导航下拉**：用户头像旁新增 `☰ 功能导航` 按钮
- **多页面路由容器**：每个功能页独立 `.app-page` 容器

**🔧 优化改进**

- `switchTab()` 兼容旧 API，等价于 `navTo()`
- 子导航键盘左右切换（ArrowLeft / ArrowRight）
- `document.title` 随路由更新
- `meta description` 随路由更新

**📊 数据指标**

| 7 | 2 | 100% |
|---|---|---|
| 页面路由 | 导航入口 | 刷新保持 |

### v7 · 首页落地页 + 游客模式（2026.08）

> 从"打开就是功能页"升级为"先看落地页，再决定是否进入"。未登录用户可完整体验产品叙事与视觉，触达 AI 功能时自然引导登录。

**✨ 新增功能**

- **首页落地页**：Hero + 产品预览 Mock + 功能网格 + 工作流 + 数据条 + CTA
- **多视图路由**：landing / app / auth 三视图
- **游客只读模式**：未登录可浏览 UI，AI 功能点击触发登录
- **游客横幅**：未登录访问 app 时显示
- **`requireLogin()` 拦截**：7 个 AI 功能按钮全部拦截

**🔧 优化改进**

- 落地页滚动进场动画（IntersectionObserver）
- 特性卡片鼠标光晕跟随
- 落地页数字滚动动画

### v6 · 真实模型修复 + 新板块 + UI 重构（2026.08）

> 修复真实模型调用失败问题（CORS / Base URL / 超时 / 流式解析兼容），新增简历优化工作台与职业探索板块，参考高信息密度工具风格做 UI 重构。

**✨ 新增功能**

- **简历优化工作台**：6 维诊断（量化 / STAR / 动词 / 匹配 / 精炼 / 技能）+ 逐条改写建议 + LLM 深度改写
- **职业探索板块**：专业 + 技能 + 兴趣 → Top 3 岗位推荐 + 技能对比 + 学习路径
- **数据看板**：4 张 stat-card（协作 Agent / 评估维度 / 推荐岗位 / 简历维度）
- **快速入口**：4 张卡片跳转核心功能
- **主题色变体**：紫 / 绿 / 蓝三色切换

**🐛 缺陷修复**

- **CORS 跨域失败**：详细错误提示 + 推荐智谱 / OpenRouter
- **Base URL 路径拼接**：去除尾部斜杠
- **30s 超时太短**：改为 60s
- **流式解析兼容性**：兼容 `content` / `reasoning_content` / `text` 三种字段

**🔧 优化改进**

- UI 整体美化：高信息密度 + 卡片化
- Tab 图标胶囊化
- Hero 光晕增强

### v5 · 登录系统 + UI 全面升级（2026.08）

> 从"单用户静态页"升级为"多用户应用"。新增登录 / 注册 / 一键演示账号，所有数据按用户前缀隔离，顶栏加入用户头像菜单。

**✨ 新增功能**

- **登录 / 注册页**：左右分栏布局，左侧品牌 + 特性，右侧表单
- **一键演示账号**：`demo@futuremirror.app` / `Demo123456`
- **数据隔离**：`u_${userId}_` 前缀，多用户切换不串数据
- **用户菜单**：顶栏头像 + 下拉（演示账号 / 切换账号 / 退出登录）
- **退出登录**：清理 sessionStorage，回到落地页

**🔧 优化改进**

- 玻璃顶栏（`backdrop-filter: saturate(180%) blur(14px)`）
- Hero 光晕增强
- 登录页左侧品牌渐变 + 圆形装饰
- 卡片 hover 微动效

**📊 数据指标**

| 3 | 100% | 1 |
|---|---|---|
| 登录方式 | 数据隔离 | 演示账号 |

### v4 · 深度完善版（2026.08）

> 针对能力评估标准中的「AI 技术深度」与「用户体验」做细颗粒度补齐：实时能力追踪器、Prompt 查看器、进度指示器、报告分享导出、降级 UI、Agent 决策理由。

**✨ 新增功能**

- **实时能力追踪器**：面试过程中动态更新雷达图，显示进度 / 字数 / 量化 / 置信度
- **Prompt 查看器**：查看当前面试模式的 System Prompt
- **面试进度条**：5 轮进度可视化
- **快捷键**：Ctrl+Enter 发送 / Ctrl+K 聚焦 / Esc 关闭
- **报告分享**：复制 Markdown / 导出 PDF / 分享报告
- **降级 UI**：真实模型失败时显示红色横幅
- **Agent 决策理由**：规划 Agent 输出派发逻辑
- **置信度**：观察员证据附带置信度百分比

**🔧 优化改进**

- 面试官人设徽章：图标 + 温度可视化
- 报告页加入"较上次"分数变化
- 打印样式补全

### v3 · 深度完善 · 修复模型调用（2026.08）

> 修复真实模型调用失败的阻塞性问题，新增简历优化与职业探索两大板块，为后续产品完整闭环打基础。

**✨ 新增功能**

- **简历优化工作台**：6 维诊断 + 逐条改写建议
- **职业探索**：专业 + 技能 + 兴趣匹配 8 个岗位
- **面试题库**：general / tech / pressure 各 6 题
- **实时能力追踪器**：初版
- **工程自检面板**：初版

**🐛 缺陷修复**

- **真实模型调用失败**：修复 CORS / Base URL / 超时 / 流式解析兼容
- **降级机制缺失**：三级降级（真实 → 降级流式 → Mock）

### v2 · 体验完善版（2026.08）

> 补齐 v1 原型缺失的体验细节：暗色模式、语音输入、TTS、动态报告、历史曲线、MCP 清单、无障碍属性。

**✨ 新增功能**

- **暗色模式**：`data-theme="dark"`，`localStorage` 持久化
- **语音输入**：Web Speech API（Chrome / Edge）
- **TTS 朗读**：speechSynthesis 朗读面试官问题
- **动态评估报告**：基于真实回答动态生成
- **历史进步曲线**：localStorage 最近 8 次记录
- **MCP 工具清单**：6 个工具的静态展示
- **无障碍属性**：`aria-label` / `role` / `focus-visible`

**🔧 优化改进**

- 评估报告从静态 Mock 升级为动态生成
- 加载状态动画（骨架屏 / 打字机）

### v1 · 初始原型（2026.08）

> 面镜 FutureMirror 的起点。一个单文件静态 HTML 演示页，包含 4 个 Tab：简历匹配、模拟面试、RAG 面经问答、评估报告。确立了"多 Agent 模拟面试 + 可解释评分 + RAG 引用"的差异化定位。

**✨ 新增功能**

- **简历匹配**：粘贴简历 + JD，启发式匹配度计算
- **模拟面试**：单 Agent 流式追问，3 种模式
- **RAG 面经问答**：BM25 风格关键词检索 + 强制引用
- **评估报告**：5 维雷达 + 评分证据 + 学习路径
- **项目材料入口**：代码仓库 / 视频 / 文档 / 在线演示 / 测试账号

**📊 数据指标**

| 4 | 8 | 5 |
|---|---|---|
| 功能 Tab | 面经条目 | 评估维度 |

## 数据合规说明

- `frontend/js/data/kb.js` 与演示版内置题库均为 **合成示例数据**，仅用于演示，禁止对外宣称真实爬取；
- 隐私设计：原始简历不上云，发送模型前本地脱敏；`maskPII()` 已通过单元测试覆盖；
- `.env` 永不进仓库（`.gitignore` 已包含），密钥只存在于部署环境变量。
