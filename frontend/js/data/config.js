"use strict";
/* ============================================================
 * 0. 项目材料配置 —— 部署后把真实地址填到这里（README 同址维护）
 * ============================================================ */
const CONFIG = {
  repoUrl: "https://github.com/Penguin-Zhou/FutureMirror",      // GitHub / Gitee Public 仓库
  liveUrl: "https://penguin-zhou.github.io/FutureMirror/",  // 在线演示（GitHub Pages，单文件演示版）
  videoUrl: "",       // 演示视频（5-8 分钟 MP4）
  docsUrl: "https://penguin-zhou.github.io/FutureMirror/docs/technical-doc.html",  // 技术文档（HTML 在线版，PDF 版以附件提交）
  fullAppUrl: "https://github.com/Penguin-Zhou/FutureMirror",   // 项目仓库地址（可与 repoUrl 相同）
  testAccount: "演示账号：demo@futuremirror.app / Demo123456（可在登录页一键登录，或点「一键使用演示账号」）",
  apiBase: "",       // 后端 API 地址：填完整 URL（如 https://xxx.app.workbuddy.host）走跨域连接；
                     // 填 "same-origin" 表示与 API 同源部署（构建时由 FM_API_BASE=same-origin 注入）；
                     // 留空 = 本地 localhost:8000，在线演示保持纯前端
};
/* v23 · 后端接线：把 CONFIG.apiBase 注入 window.FM_API_BASE（core/api.js 的 fmApi.init 读取）。
   "same-origin" 转换为当前站点 origin——演示页由 FastAPI 同源托管时使用，彻底免除跨域；
   留空时不设置——保持默认 localhost:8000 与「未部署（在线演示）」语义，既有测试断言不受影响。 */
if (CONFIG.apiBase === "same-origin") {
  try { window.FM_API_BASE = window.location.origin; } catch (e) {}
} else if (CONFIG.apiBase) {
  try { window.FM_API_BASE = String(CONFIG.apiBase).replace(/\/+$/, ""); } catch (e) {}
}
const MATERIAL_LABEL = { repo: "代码仓库", live: "在线演示", video: "演示视频", docs: "技术文档", full: "完整项目", account: "演示账号信息" };

