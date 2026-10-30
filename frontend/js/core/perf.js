"use strict";
/* ============================================================
 * v45 · 交互确定性层（设备分档 / 让帧 / 长任务记账）
 *
 * 为什么需要这一层：
 *   界面精致到一定程度后，拖后腿的不再是「有没有功能」，而是「点了之后
 *   多久有反应」。浏览器把这段等待量化为 INP（Interaction to Next Paint），
 *   移动端工程上的参考线是 200ms 以内。报告页的维度卡展开、MBTI 的选项
 *   切换都在事件处理函数里重建 DOM，低端机上可能把一次点击拖成 100ms+。
 *
 * 这一层只做三件事，不接管任何业务：
 *   ① 设备分档：核心数 / 内存 / 省流量 / 慢速网 → html.perf-low，
 *      让 CSS 关掉装饰性描边与过渡，功能反馈全部保留；
 *   ② 让帧：yieldToMain() 先把按下态画出来，再把重 DOM 装配推到下一帧；
 *   ③ 记账：长任务（>50ms）与交互事件时序各留一个环形缓冲，
 *      供现场核验（window.__bpPerf.summary()），不采集任何用户内容。
 * ============================================================ */

const PERF_RING = 40; // 交互事件保留最近 40 条，够看现场，不占内存
const PERF_LONG_RING = 60; // 长任务同样只留一段窗口
const perfEvents = []; // { name, dur, proc }
const perfLongTasks = []; // { start, dur }
let perfTierCache = "";

/** 设备分档：返回 "low" / "high"。判据全部来自浏览器自报，不做指纹识别 */
function perfTier() {
  if (perfTierCache) return perfTierCache;
  let tier = "high";
  try {
    const nav = navigator || {};
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection || null;
    const cores = Number(nav.hardwareConcurrency || 0);
    const mem = Number(nav.deviceMemory || 0);
    if (conn && conn.saveData) tier = "low";
    else if (cores && cores <= 4) tier = "low";
    else if (mem && mem <= 4) tier = "low";
    else if (conn && /(^|-)2g$/.test(String(conn.effectiveType || ""))) tier = "low";
  } catch (e) {
    tier = "high";
  }
  perfTierCache = tier;
  return tier;
}

/** 让出一帧：优先 scheduler.yield()（长任务可被抢占），否则回落到 setTimeout(0) */
function yieldToMain() {
  try {
    const sched = typeof window !== "undefined" ? window.scheduler : null;
    if (sched && typeof sched.yield === "function") return sched.yield();
  } catch (e) {
    /* 不支持就继续往下走 */
  }
  return new Promise(function (r) {
    setTimeout(r, 0);
  });
}

/** 分位数（0–100），空数组返回 0 —— 用于把「最差那几次」摊开看 */
function perfPct(list, p) {
  if (!list.length) return 0;
  const sorted = list.slice().sort(function (a, b) {
    return a - b;
  });
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[i];
}

/** 现场读数：p50 / p98 / 最差 / 长任务数量，全部整数毫秒 */
function perfSummary() {
  const durs = perfEvents.map(function (e) {
    return e.dur;
  });
  const longs = perfLongTasks.map(function (e) {
    return e.dur;
  });
  return {
    tier: perfTier(),
    events: perfEvents.length,
    p50: perfPct(durs, 50),
    p98: perfPct(durs, 98),
    worst: durs.length ? Math.max.apply(null, durs) : 0,
    longTasks: perfLongTasks.length,
    longWorst: longs.length ? Math.max.apply(null, longs) : 0,
  };
}

/** 复位（开发者模式与自动化核验用） */
function perfReset() {
  perfEvents.length = 0;
  perfLongTasks.length = 0;
}

/** 启动：挂设备档位类 + 两个观察器。缺失 API 时静默跳过，不影响任何功能 */
function perfBoot() {
  const tier = perfTier();
  try {
    if (tier === "low") document.documentElement.classList.add("perf-low");
  } catch (e) {
    /* 无 document 的环境直接跳过 */
  }
  /* 用户偏好减少动效：除了媒体查询本身，再挂一个类，便于样式与核验共用同一判据 */
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("perf-calm");
    }
  } catch (e) {
    /* 忽略 */
  }
  /* 走 window 取值：避免在无该构造器的环境里直接引用报错 */
  const PO = typeof window !== "undefined" ? window.PerformanceObserver : null;
  if (typeof PO !== "function") return tier;
  /* 长任务：INP 恶化的主因，单条 50ms 以上就记一笔 */
  try {
    new PO(function (list) {
      list.getEntries().forEach(function (e) {
        if (perfLongTasks.length >= PERF_LONG_RING) perfLongTasks.shift();
        perfLongTasks.push({ start: Math.round(e.startTime), dur: Math.round(e.duration) });
      });
    }).observe({ type: "longtask", buffered: true });
  } catch (e) {
    /* Safari 无 longtask，忽略 */
  }
  /* 交互事件时序：duration 即「输入 → 下一帧绘制」，直接对应 INP 口径 */
  try {
    new PO(function (list) {
      list.getEntries().forEach(function (e) {
        if (perfEvents.length >= PERF_RING) perfEvents.shift();
        perfEvents.push({
          name: e.name,
          dur: Math.round(e.duration),
          proc: Math.round((e.processingEnd || e.processingStart || 0) - e.startTime),
        });
      });
    }).observe({ type: "event", durationThreshold: 16, buffered: true });
  } catch (e) {
    /* 不支持 event 条目，忽略 */
  }
  return tier;
}

/* 测试与现场核验入口：只读快照，不暴露内部数组引用 */
try {
  window.__bpPerf = {
    tier: perfTier,
    summary: perfSummary,
    events: function () {
      return perfEvents.slice();
    },
    longTasks: function () {
      return perfLongTasks.slice();
    },
    reset: perfReset,
    boot: perfBoot,
    yieldToMain: yieldToMain,
  };
} catch (e) {
  /* 无 window（纯 Node 上下文）时跳过 */
}

try {
  perfBoot();
} catch (e) {
  /* 启动失败不能影响首屏 */
}
