"use strict";
/* ============================================================
 * v10 · 尾部引导：所有「依赖后定义数据」的初始化集中在这里
 * （init() 位于 KB / CAREER_DB 之前，不能在那里读取它们——会 TDZ）
 * ============================================================ */
(function bootstrapV10() {
  const safe = fn => { try { fn(); } catch (e) {} };
  safe(bootApp);             // v11：从 init() 移出，避免 init 早于 CAREER_DB 定义时 syncCareerCounts 触发 TDZ（initLlmPanel/applyRoute 等随之完整执行）
  safe(syncCareerCounts);     // 岗位数量 -> 文案占位 + 数字滚动目标值
  safe(updateKbCount);        // 面经库容量
  safe(syncSidebarBadge);     // 侧栏面试进度
  safe(syncStatusPill);       // 顶栏状态胶囊
  safe(restoreBanner);        // 横幅关闭状态
  safe(initOnboarding);       // 首访引导

  /* v11：岗位选择器初始化 + 恢复上次选择 */
  safe(renderJdSelect);
  safe(restoreJdSelection);

  /* v12：MCP 实时控制台初始化（本地注册工具 + 渲染调用入口） */
  safe(initMcpConsole);

  // 计数目标值可能刚被更新，重置后重跑一次滚动动画
  safe(() => document.querySelectorAll(".landing-stat .val[data-count]").forEach(el => { el.dataset.done = ""; }));
  safe(() => document.querySelectorAll(".stat-num[data-count]").forEach(el => { el.dataset.done = ""; }));
  safe(animateLandingCounters);
  safe(animateCounters);
})();

