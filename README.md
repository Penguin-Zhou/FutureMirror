# 面镜 FutureMirror · 多 Agent 模拟面试与能力成长平台

> **AI辅助开发声明**  
> 本项目开发过程使用AI编程工具作为辅助手段，CSS主题样板、通用工具函数、测试用例骨架、部分页面文案由AI辅助生成，**所有AI产出内容均经过参赛团队逐行审查、修改、调试与测试**，完整Git提交记录可查看开发演进过程，团队可完整解释全部代码逻辑。
>
> 项目核心业务架构：多‑Agent圆桌协作机制、证据驱动可解释评分引擎、版本化Prompt约束体系、三级降级容错方案、RAG检索引用机制（BM25 + 端侧向量混合检索，余弦与词面双路融合）、全套业务产品设计与自动化测试体系均为团队独立设计与实现。演示知识库全部为人工合成示例数据，无爬取真实网络数据。  
> 本作品为原型演示系统，仅用于竞赛演示，不直接作为生产系统使用。

**版本定位：Beta 1.0 · 原型演示版**（单文件演示版 / 模块版前端 / FastAPI 后端 / Next.js 完整版）· 开源许可：**MIT**（见 [`LICENSE`](LICENSE)）

**技术文档**：[在线阅读（HTML 版）](https://penguin-zhou.github.io/FutureMirror/docs/technical-doc.html) · [国内镜像](https://futuremirror-demo.app.workbuddy.host/docs/technical-doc.html) · 仓库内 [`docs/technical-doc.html`](docs/technical-doc.html) —— 9 章完整技术说明书（项目概述 / 需求分析 / 系统架构 / AI 技术方案 / 核心功能实现 / 测试与部署 / 创新点 / 总结展望 / 附录），约 29 页。**PDF 版由该文档 A4 打印导出，随赛事材料以附件形式提交。**

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
| **演示/教学场景断网即废** | 依赖云 API 的产品在赛场网络不稳定时直接白屏        | 三级降级：后端真实模型 → 浏览器直连 Key → 本地 Mock，无网也能完整走完流程            |

### 1.2 目标用户

- **求职者（主要）**：准备校招/社招的技术与非技术岗位候选人，需要低成本、高频次、有反馈的面试练习；
- **高校就业指导/训练营（次要）**：需要可批量、可留痕、可解释的模拟面试工具；
- **评委与开发者（演示态）**：需要在不装环境、无网络、无 Key 的情况下 3 分钟内看懂系统做了什么、怎么做的。

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
| Node.js | ≥ 18（开发验证用 22.22.2） | 跑测试脚本、Next.js 完整版                   |
| Python  | ≥ 3.10（开发验证用 3.13）  | FastAPI 后端、静态文件服务                   |
| 浏览器     | Chrome / Edge 最新版   | 演示（需支持 SSE、Web Worker、localStorage） |
| 可选      | `sqlite3` 命令行       | 答辩时验证数据真落库                          |

**三种安装形态，按需选择**（可只做 A，也可 A+B 全做）：

| 形态                    | 需要装什么                 | 适合场景                    |
| --------------------- | --------------------- | ----------------------- |
| A. 单文件演示版             | **零安装**，浏览器直接打开       | 赛场断网、评委临时查看、快速演示        |
| B. 模块版前端 + FastAPI 后端 | Node（仅测试用）+ Python 依赖 | 正式答辩（要展示真实落库与 Key 不进前端） |
| C. Next.js 完整版        | `npm install`         | 查看生产形态实现                |

### 3.2 安装 A：单文件演示版（零依赖）

**方式 1（推荐，零安装）**：直接打开在线演示，Chromium 系浏览器即可完整走完流程。

| 入口 | 地址 | 说明 |
| --- | --- | --- |
| 主站（GitHub Pages） | <https://penguin-zhou.github.io/FutureMirror/> | 与仓库同源，随 `gh-pages` 分支更新 |
| 国内直连镜像 | <https://futuremirror-demo.app.workbuddy.host/> | 同一份单文件产物的逐字节副本，国内网络直连更快；github.io 打不开时用这个 |

**方式 2（本地离线）**：打开仓库内的 `public/futuremirror-demo.html`（约 493KB，所有 CSS/JS 内联，默认零外部请求）。

```bash
# 纯离线 Mock 演示：直接双击 public/futuremirror-demo.html
# 需要连后端时改用 http 服务（见 3.3，file:// 会被 CORS 拒绝）
```

> 两个在线入口内容完全一致（均为 `public/futuremirror-demo.html` 的逐字节副本）：
> - 主站由 GitHub Pages 托管 `gh-pages` 分支（`.nojekyll` 跳过 Jekyll 处理），重新发布：`node scripts/deploy-pages.js --build`；
> - 镜像由静态托管服务托管 `.mirror-site/` 目录，重新发布：`node scripts/stage-mirror.js` 后对该目录执行一次「发布」。镜像目录为纯产物，已被 `.gitignore` 忽略，不参与版本管理。
>
> 技术文档（`docs/technical-doc.html`）随同一条发布链路上线，两个入口地址见本文件顶部；PDF 版由该文档打印导出，以附件形式随赛事材料提交。

### 3.3 安装 B：模块版前端 + FastAPI 后端（推荐答辩使用）

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

### 3.4 安装 C：Next.js 完整版

```bash
npm install
cp .env.example .env.local         # 可选：填模型 Key；不填自动 Mock
npm run dev                        # http://localhost:3000
```

### 3.5 常见安装问题

| 现象                          | 原因                                | 处理                                                                        |
| --------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| 页面显示「未连接」，报告无「已落库」          | 后端未启动 / 端口不对 / CORS 拒绝            | 确认 `uvicorn` 在 8000；页面用 `http://localhost:5173` 打开；`CORS_ORIGINS` 与前端端口一致 |
| 登录后提示「邮箱或密码不正确」             | 后端在线但该账号只在本地注册过，或未注册              | 用演示账号一键登录，或先在后端注册（注册即写 SQLite）                                            |
| 后端启动报 `ModuleNotFoundError` | 依赖未装到当前解释器                        | 确认已激活 `.venv` 后重新 `pip install -r requirements.txt`                       |
| 对话不走模型、只要 Mock              | `.env` 的 `LLM_API_KEY` 为空或 Key 无效 | 填 Key 后重启 uvicorn；`/api/health` 的 `llm_ready` 应为 `true`                   |
| 「⚡ 加载端侧模型 MiniLM」一直转圈/失败    | 首次需下载约 23MB 权重，断网或 CDN 不可达        | 属预期降级：状态条会提示失败原因并继续用离线 hash 向量                                            |

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
| 9  | （答辩加分）终端查库                          | `sqlite3 backend/futuremirror.db "select count(*) from turns"` 应 ≥ 5 |

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

Next.js 完整版（app/）── Route Handlers ── 多模型路由 / RAG / Zod 契约 / Mock 兜底
```

**四种交付形态**

| 形态              | 位置                              | 定位                                                                  |
| --------------- | ------------------------------- | ------------------------------------------------------------------- |
| **FastAPI 后端**  | `backend/`                      | 演示版的后端适配层：JWT 鉴权、SQLite 持久化、GLM SSE 流式代理（API Key 只存服务端环境变量）、可解释评分引擎 |
| **模块版前端**       | `frontend/`                     | 由单文件演示版机械拆分而成（27 个 JS 模块 + 3 层 CSS），行为与单文件版逐字节等价                    |
| **单文件演示版**      | `public/futuremirror-demo.html` | 零依赖、可离线运行的演示页（约 493KB，所有 CSS/JS 内联，默认零外部请求；仅主动点「加载端侧模型」时才拉一次模型权重）   |
| **Next.js 完整版** | `app/` `lib/` `components/`     | 生产形态的全栈应用（Route Handlers + 多模型路由 + RAG + Zod 契约）                    |

- **演示版与后端的关系**：演示版检测 `http://localhost:8000` 后端；在线则对话 / 登录 / 报告生成全部走后端（Key 零接触），离线则自动回退「浏览器直连 Key → 本地 Mock」，功能不减。
- **单文件版与模块版的关系**：`scripts/split-frontend.js` 从单文件版按「版本横幅」机械拆分出 `frontend/`；`scripts/build-demo.js` 反向合并回单文件（除一行 hashchange 监听注册随 handler 归位外**逐字节一致**）。`scripts/test-frontend-modules.js` 用 jsdom 真实加载模块版验证独立启动（28 项）。

### 检索层：BM25 + 端侧向量混合检索

RAG 检索不是关键词匹配，而是**词面 + 语义双路召回后归一融合**，全部在浏览器内完成（零后端、零 API、离线可跑）：

| 环节   | 实现                                                                | 关键参数 / 说明                                                    |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| 分词   | 英文/数字整词 + 中文 bigram（`tokenList`）                                  | 与完整版 `lib/ai/rag.ts` 同策略，中文无空格也能召回                           |
| 词面召回 | BM25（`bm25Score`）                                                 | `k1=1.5`、`b=0.75`，IDF 恒正（`log(1+…)` 防负权），标题字段重复计入 = 权重 ×2    |
| 语义召回 | **Transformers.js · all-MiniLM-L6-v2**（`Xenova/all-MiniLM-L6-v2`） | 384 维，`pooling=mean` + L2 归一，浏览器内推理；权重走浏览器缓存，二次访问秒开          |
| 向量库  | `localStorage["fm_kb_vec_v1"]`（40 条预计算向量 + 元信息）                   | 二次访问「缓存命中」零推理；条目数与知识库不符时**拒绝加载**，避免脏索引                       |
| 离线兜底 | n-gram hashing 向量（`hashEmbed`，256 维，有符号特征哈希 + L2 归一）              | 无模型文件 / CDN 不可达时自动启用，检索链路不中断，状态条如实标注「非语义」                    |
| 融合   | `score = 0.6 × cosine + 0.4 × bm25_normalized`                    | 两路各自 min-max 归一后加权；纯语义召回设余弦门槛（MiniLM 0.15 / hashing 0.32）防噪声 |
| 可解释  | 每条引用显示 `bm25 0.82 · cos 0.61 · 融合 0.74`                           | 评委可当场核对分数，不是黑箱「相似度」                                          |

答辩口径：**检索层是 BM25 + 端侧向量混合检索**，向量由 Transformers.js 在浏览器内计算（零 API 成本、离线可跑），两路归一分后加权融合；完整版升级为 **pgvector + RRF + Rerank**。

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
├── backend/                    # FastAPI 演示后端
│   ├── app/
│   │   ├── db.py               # SQLite + ORM 模型 + scrypt 密码哈希
│   │   ├── llm.py              # GLM SSE 流式代理（Key 只在这一层）
│   │   ├── scoring.py          # 可解释评分引擎（前端 scoreSession 的 Python 版）
│   │   └── main.py             # FastAPI 装配 + 路由（鉴权/会话/报告/健康检查）
│   ├── tests/                  # pytest 冒烟 + 评分引擎单测（6 项）
│   ├── requirements.txt
│   └── .env.example            # 复制为 .env 填 Key；.env 永不进仓库
├── frontend/                   # 模块版前端（由单文件版拆分，行为等价）
│   ├── index.html              # 骨架 + 3 张 link + 27 个 script（按依赖序）
│   ├── css/                    # tokens（基础令牌）/ theme（v17 重构）/ pages（v18+ 功能层）
│   ├── js/
│   │   ├── core/               # store / auth / theme / router / api / boot / reveal …
│   │   ├── data/               # config / kb（含 BM25 + 端侧向量检索层与向量缓存）
│   │   ├── features/           # match / interview / report / quiz / jobs / assistant …
│   │   └── dev/                # runtime（MCP 三件套）/ devmode
│   └── build-manifest.json     # 拆分清单（build-demo.js 依据）
├── public/futuremirror-demo.html   # 单文件演示版（build-demo.js 产物）
├── scripts/                    # split-frontend / build-demo / deploy-pages / stage-mirror / validate / test-* 工具与测试
├── docs/technical-doc.html         # 技术文档（9 章正式版，可直接在线阅读；PDF 附件由此打印导出）
├── docs/demo-video-storyboard.md   # 演示视频分镜脚本
├── docs/archive/                   # 技术文档早期 Markdown 草稿（仅供演进追溯，不对外）
├── app/ lib/ components/ …     # Next.js 完整版
└── README.md
```

---

## 八、测试

```bash
# 后端
cd backend && pytest -q                 # 冒烟 + 评分引擎（6 项）

# 前端（Node 直跑，无需浏览器）
npm run validate:demo                   # 静态验证：JS 语法 / DOM id 引用 / onclick 处理器 / 标签配平
npm run test:demo                       # 无头逻辑测试（217 项）
node scripts/test-v15-jsdom.js          # 工作台互动（32 项）
node scripts/test-v16-jsdom.js          # 个人中心 / 头像 / 偏好 / 数据管理（45 项）
node scripts/test-v17-jsdom.js          # Arkira 风格主题（57 项）
node scripts/test-v18-jsdom.js          # 求职闭环 / 答题计时 / 连环追问（67 项）
node scripts/test-v19-jsdom.js          # 题库小测 + VIP（97 项）
node scripts/test-v20-jsdom.js          # 题库增强 + AI 助手（107 项）
node scripts/test-v21-jsdom.js          # 悬浮球拖拽冻结 + 移动端美化（57 项）
node scripts/test-v22-jsdom.js          # 后端适配层 + 契约修复回归（71 项）
node scripts/test-beta1-vector-jsdom.js # 端侧向量检索：分词/BM25/向量/缓存/融合/UI（80 项）
node scripts/test-frontend-modules.js   # 模块版独立启动验证（28 项）
```

合计 **858 项前端断言 + 6 项后端单测**，全部通过。

前端浏览器内还内置「开发者模式 → 工程自检」断言（快捷键 `Ctrl+Shift+J`，密码 `FM2026`）。

---

## 九、AI 辅助开发声明

本项目遵循透明声明原则：

- **AI 辅助编写**：CSS 主题变量体系、部分页面样板代码、正则表达式与工具函数、单测骨架、拆分/合并脚本；
- **本人设计与实现**：多 Agent 角色划分与派发策略、Prompt 版本化设计、五维评分规则与证据链结构、RAG 检索与引用策略（BM25 参数调优、向量维度与融合权重、召回门槛、缓存失效规则）、业务流程与信息架构、前后端接口契约、安全方案（JWT + 服务端 Key + scrypt）；
- 检索层使用的 `Transformers.js` 与 `all-MiniLM-L6-v2` 为开源库与开源模型，本项目只做集成与调参，未训练模型；
- 所有 AI 生成代码均经逐行审查、修改与调试，git 提交记录可见演进过程；
- 演示数据均为合成示例，非真实爬取。


## 十、团队信息与成员分工

**面镜 FutureMirror 开发团队 · 福建农林大学桢队** · 技术文档 v1.0（对应产品 Beta 1.0）

| 角色 | 成员 | GitHub |
| --- | --- | --- |
| 项目负责人 / 前端开发 / 后端开发 | 周鹏辉（PenguinZhou） | [@Penguin-Zhou](https://github.com/Penguin-Zhou) |
| 文案与视觉美化 | 林宇豪（Vito） | — |

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

- 撰写 README 文档、AI 辅助开发声明、全套技术说明书与赛事申报材料；
- 撰写演示视频脚本，配合完成内容准备；
- 负责全部技术文档排版美化、图文规整，优化文档视觉观感。

> 与技术文档的一致说明：本 README 与 [`docs/technical-doc.html`](docs/technical-doc.html) 为同一套交付材料，技术文档含 9 章完整内容（附录 9.5 交付材料清单与本文档互相指向）。

---

## 十一、交付材料

| 材料                     | 状态 | 地址 / 说明                              |
| ---------------------- | -- | ------------------------------------ |
| 代码仓库（Public）           | ✅  | https://github.com/Penguin-Zhou/FutureMirror |
| README（问题/功能/安装/使用/示例） | ✅  | 本文件                                  |
| `.env.example`（无真实密钥）  | ✅  | `backend/.env.example` + 根目录         |
| Git 真实提交历史             | ✅  | 分阶段提交，非一次性推送                         |
| 单元测试 + 演示版测试体系         | ✅  | 后端 pytest 6 项 + 前端 858 项断言           |
| 单文件静态演示页               | ✅  | `public/futuremirror-demo.html`      |
| 演示视频 5-8 分钟 1080p MP4  | ⬜  | `<录制后填写链接>`                          |
| 技术文档（HTML 在线版）         | ✅  | https://penguin-zhou.github.io/FutureMirror/docs/technical-doc.html （国内镜像：https://futuremirror-demo.app.workbuddy.host/docs/technical-doc.html；仓库内 `docs/technical-doc.html`） |
| 技术文档 PDF（附件）           | ✅  | 由上述 HTML 文档 A4 打印导出，约 29 页，**随赛事材料以附件形式提交** |
| 在线演示（公网可访问）            | ✅  | https://penguin-zhou.github.io/FutureMirror/ |
| 在线演示镜像（国内直连）          | ✅  | https://futuremirror-demo.app.workbuddy.host/ |
| 演示测试账号                 | ✅  | `demo@futuremirror.app / Demo123456` |
| 开源许可证                  | ✅  | MIT，见仓库根目录 `LICENSE`                |

### 部署速查

```bash
# 方案 0：GitHub Pages（当前在线演示 + 在线技术文档所用，纯静态、零成本、随仓库更新）
node scripts/deploy-pages.js --build    # 重建单文件版 → 强推 gh-pages 分支
                                        # 产物：index.html / 404.html / .nojekyll / docs/technical-doc.html

# 方案 0b：国内直连镜像（同一份产物，托管 .mirror-site/ 静态目录）
node scripts/stage-mirror.js            # 生成 .mirror-site/index.html + 404.html + docs/technical-doc.html（纯产物，已 gitignore）
# 随后对该目录执行一次「发布为应用」（静态站点），链接即 https://futuremirror-demo.app.workbuddy.host/

# 方案 A：Vercel（完整版 Next.js）
npm i -g vercel && vercel --prod        # 环境变量在 Vercel 后台配置；不配 Key 自动 Mock

# 方案 B：Cloudflare Pages（仅静态演示页，零成本）
npx wrangler pages deploy public --project-name=futuremirror-demo

# 方案 C：后端 + 模块版（Render / Railway / 自有服务器）
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
# 前端构建后用任意静态服务托管 frontend/，并在 CONFIG 中填写后端地址
```

部署后把地址回填到 `frontend/js/data/config.js` 的 `CONFIG` 与本 README。当前 `repoUrl / fullAppUrl / liveUrl / docsUrl` 均已指向线上地址（`docsUrl` = Pages 上的 HTML 在线版）；`videoUrl` 待演示视频录制完成后再填。

> `gh-pages` 是**纯产物分支**：每次发布重建单个提交并强推，不保留历史；项目主历史始终在 `main`。首次启用 Pages 只需在仓库 Settings → Pages 选择 `gh-pages` 分支根目录一次（当前已启用，`https_enforced`）。

---

## 十二、开源许可证

本项目采用 **MIT License**，全文见仓库根目录 [`LICENSE`](LICENSE)。

```
MIT License
Copyright (c) 2026 FutureMirror Team (面镜 FutureMirror 团队)
```

即：允许自由使用、复制、修改、合并、发布、分发、再许可与销售，**唯一义务是保留版权声明与许可声明**；软件按「原样」提供，不含任何担保。

第三方组件遵循各自许可证，版权归原作者所有：

| 组件 | 许可证 | 用途 |
| --- | --- | --- |
| Next.js / React / Tailwind CSS | MIT | 完整版前端框架与样式 |
| `@xenova/transformers`（Transformers.js） | Apache-2.0 | 浏览器内向量推理运行时 |
| `Xenova/all-MiniLM-L6-v2` | Apache-2.0 | 端侧句向量模型（仅集成调用，未再训练） |
| FastAPI / SQLAlchemy / PyJWT / httpx | MIT / BSD | 后端服务、ORM、鉴权与流式转发 |

> 演示知识库（`frontend/js/data/kb.js`、`lib/data/kb.json`）与题库均为**人工合成示例数据**，随项目一同提供仅用于功能演示，不代表任何真实企业面试内容。

---
---

## 附：版本演进（演示版）

演示版从「单文件静态页」持续迭代至「训练 + 权益 + 工程化」平台，每代均可运行、可回归：

**运行时能力三件套（v12）**：MCP 实时控制台（页面内注册可执行工具，点击可见 `tool_call → input_schema → 真实执行 → JSON 返回`）、代码面试沙盒（Worker 执行 + 2s 熔断，通过率并入评分）、本地 PII 脱敏预览（正则脱敏 + 显式「0 网络请求」标注）。

**开发者模式（v13/v14）**：加密视图（密码 / URL key / `Ctrl+Shift+J` 三通道），集中呈现交付材料、运行环境检测、性能指标、工程自检、MCP 证据、技术架构、评分维度映射、已知边界与诊断日志；普通用户界面保持清爽。

**工作台与个人中心（v15/v16）**：今日推荐岗位随机抽取与一键开面、面试圆桌 Agent 卡片可点击跳转；个人中心三态头像（表情 / 本地上传中心裁剪 / 首字母渐变）四处同步、求职信息表单实时完成度、偏好开关按账号隔离、数据管理（存储可视化 / JSON 导出 / 一键清除）。

**Arkira 视觉重构（v17）**：深海蓝体系 + 玻璃拟态 + 衬线标题 + 滚动渐入（IntersectionObserver 渐进增强）+ 微交互全覆盖。

**求职闭环与面试拟真（v18）**：投递看板（五列状态流转 + 转化率统计）、面试复盘（6 轮对话 → 结构化结论）；答题计时器（90s / ≤15s 警示 / 超时追问）、连环追问（关键词触发 35% 概率连续深挖）、语音输入实时反馈；报告新增句子级改写建议，HR / 压力面试官人设题库分化。

**题库小测与 VIP 体系（v19）**：24 题 5 分类（SQL / 网络 / 操作系统 / 算法 / STAR），知识点学习直接亮答案 + 解析；限时小测每轮 5 题 ×60s；成绩档案四统计卡 + 逐轮历史；VIP 解锁专属分类与不限次数，测试账号自动 VIP，门控贯穿学习列表 / 小测入口 / 成绩引导。

**题库增强与 AI 小助手（v20）**：错题本（VIP，自动收录 + 分类筛选 + 练习 + 移除）、收藏夹（三处状态同步）、题目搜索（多字段匹配）、三种练习模式（限时模考 / 顺序练习 / 章节练习）、每日一练（连签累计）、学习数据看板（正确率 / 掌握度 / 趋势）；AI 小助手悬浮球 + 抽屉（预设意图跳转 / RAG 检索 / 流式回答 / Mock 兜底）；移动端导航顶部化。

**悬浮球冻结与移动端美化（v21）**：悬浮球可拖动并贴边「冻结」（位置按账号持久化、边界钳制、误触抑制、左侧镜像抽屉）；移动端卡片大圆角、触控高度、输入框 16px、底部弹层把手与安全区适配。

**后端适配与工程化（v22）**：FastAPI 后端落地——SQLite 数据模型 + scrypt 密码哈希 + JWT 鉴权、GLM SSE 流式代理（Key 只存服务端）、评分引擎 Python 同构移植、面试会话与报告落库；演示版改造为「后端优先 + 三级降级」（`fmApi` 适配层：健康检查 30s 缓存 / SSE 分片解析 / 登录注册走后端 / 报告服务端生成 + 本地兜底）；单文件版按版本横幅机械拆分为 `frontend/` 27 模块 + 3 CSS 层，`build-demo.js` 可逐字节重建。

**契约核对与体验修复（v22.1）**：对「前端调用 ↔ 后端路由」做全量核对（批量 `/sync` 与 body 版 `/report` 均在两端一致，`match_score / code_score / match_gaps` 全程参与服务端评分）；`/sync` 升级为按 seq 幂等（重复同步不产生脏数据，单次上限 30 轮）；修复「后端登录后刷新掉线」（后端用户写入本地用户表供 `restoreUser` 找回，不落 passHash）；修复 RAG / 简历改写 / AI 小助手的后端模式判断；报告页同会话只同步一次，「再来一次」重置 `interviewId` 保证每轮面试独立入库；登录 / 注册 / 演示登录在后端探测无结论时先等待探测。

**Beta 1.0 · 检索层升级与版本定位（当前版本）**：RAG 检索从「关键词匹配」升级为 **BM25 + 端侧向量混合检索**——BM25（`k1=1.5` / `b=0.75`、IDF 恒正、标题加权 ×2）负责词面召回，Transformers.js 在浏览器内运行 `all-MiniLM-L6-v2`（384 维，mean pooling + L2 归一）负责语义召回，40 条面经向量预计算后写入 `localStorage`（含条目数/维度校验）；无模型文件时自动降级为 n-gram hashing 向量（256 维），**离线也能检索**；两路 min-max 归一分后按 `cos×0.6 + bm25×0.4` 融合，纯语义召回设余弦门槛防噪声。RAG 页新增「向量索引状态条」与逐条 `bm25 · cos · 融合` 得分展示，`askRag` 改走异步混合检索。新增 `test-beta1-vector-jsdom.js` 80 项断言。版本号统一为 **beta1.0**，README 顶部与三处页脚补齐 AI 辅助开发声明。

## 数据合规说明

- `lib/data/kb.json` 与演示版内置题库均为 **合成示例数据**，仅用于演示，禁止对外宣称真实爬取；
- 隐私设计：原始简历不上云，发送模型前本地脱敏；`maskPII()` 已通过单元测试覆盖；
- `.env` 永不进仓库（`.gitignore` 已包含），密钥只存在于部署环境变量。
