"use strict";
/* ============================================================
 * 模块索引（单文件工程 · 按依赖顺序排列；行号随版本漂移，请用函数名检索）
 *   ① 数据层 ………… store / kk / esc / getProfile / saveProfile / fm_apps / fm_reviews
 *   ② 路由层 ………… APP_PAGES / navTo / applyRoute / switchTab / showView / handleHashChange
 *   ③ 用户系统 ……… simpleHash / doLogin / doRegister / quickDemoLogin / renderUserMenu
 *   ④ 简历匹配与优化 … heuristicParse / analyzeResumeText / localPiiMask
 *   ⑤ 面试引擎 ……… SPEAKERS / QUESTION_BANK / pickQuestion / sendMsgMock / sendMsgReal
 *                     / toggleVoice / analyzeVoiceInput / 答题计时器 / 连环追问 deepDive
 *   ⑥ 报告引擎 ……… scoreSession / buildEvidence / buildPlan / buildSentenceRewrites / renderReport
 *   ⑦ 个人中心 ……… paintAvatarEl / renderProfile / calcCompletion / uploadAvatar
 *   ⑧ 求职管理(v18) … renderBoard / addApplication / moveApplication / startReview / finishReview
 *   ⑨ RAG / MCP / 沙盒 … retrieve / MCP_TOOLS / runCodeSandbox
 *   ⑩ 开发者工具 …… runSelfCheck / runSelfCheckPanel / logDev / toggleTheme / cycleAccent
 *   ⑪ 题库与 VIP(v19) … QUIZ_BANK / isVip / renderQuizPage / startQuiz / renderVipCard
 *   ⑫ 题库增强与 AI 助手(v20) … QUIZ_MODES / beginQuiz / fm_wrong / fm_fav / fm_daily
 *                     / runQuizSearch / recordAnswer / toggleAiAssistant / sendAiAssistant
 *   ⑬ 悬浮球拖拽冻结(v21) … applyAiFabPos / initAiFabDrag / fm_ai_fab / 移动端美化
 *   ⑭ 后端适配层(v22) … fmApi / checkHealth / syncAndReport / llmLabel / testApiBase
 *   ⑮ 体验层(v23–v24) … 打字指示器 / 空状态 / 滚动进度线 / 粒子场 / 视差 / 涟漪
 *   ⑯ 滚动驱动层(v26) … 返回顶部进度环 / 滚动侦测 / 蓝图绘制线
 *   ⑰ 落地页动态层(v26) … 文案轮播 / 实录播台 / 十字准线 / 坐标读数
 *   ⑱ 命令面板(v26) …… Ctrl/⌘+K 直达功能页与动作
 * ============================================================ */

