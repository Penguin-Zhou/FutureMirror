"use strict";
/* ============================================================
 * Z1. 骨架屏 v30（Beta 1.1.0 · 完整性补全层）
 * 数据到位之前先渲染占位块，避免内容到达时布局抖动（CLS）。
 * 印刷风纪律：占位块用 --line 灰阶 + 纸底，脉冲是透明度呼吸（非位移、非投影）；
 * reduced-motion 下由 CSS 关闭动画（占位块本身仍保留，功能不缺失）。
 * 最小驻留（minDwell）：请求秒回时不闪一下骨架，避免视觉噪声。
 * ============================================================ */
(function () {
  const doc = document;
  const win = doc.defaultView || window;
  const DEFAULTS = { rows: 3, cols: 2, gap: 10, height: 12, minDwell: 260 };
  let pending = 0;

  function el(tag, cls) {
    const e = doc.createElement(tag);
    e.className = cls;
    return e;
  }

  /* 挂载骨架：同一容器幂等（重复调用返回已挂载实例） */
  function mount(host, o) {
    if (!host) return null;
    if (host.__bpSkel) return host.__bpSkel;
    o = o || {};
    const rows = Math.max(1, o.rows || DEFAULTS.rows);
    const cols = Math.max(1, o.cols || DEFAULTS.cols);
    const gap = o.gap == null ? DEFAULTS.gap : o.gap;
    const h = o.height || DEFAULTS.height;

    const box = el("div", "bp-skel");
    box.setAttribute("aria-hidden", "true");
    box.style.cssText = "display:flex;flex-direction:column;gap:" + gap + "px";
    for (let r = 0; r < rows; r++) {
      const row = el("div", "bp-skel-row");
      row.style.cssText = "display:flex;gap:" + gap + "px";
      for (let c = 0; c < cols; c++) {
        const b = el("div", "skeleton");
        b.style.height = h + "px";
        b.style.flex = (cols > 1 && c === cols - 1) ? "0 0 38%" : "1 1 auto";
        row.appendChild(b);
      }
      box.appendChild(row);
    }
    const t0 = Date.now();
    host.appendChild(box);
    pending++;

    const api = {
      host: host,
      mounted: true,
      blocks: rows * cols,
      clear: function (force) {
        if (!api.mounted) return false;
        const wait = force ? 0
          : Math.max(0, (o.minDwell == null ? DEFAULTS.minDwell : o.minDwell) - (Date.now() - t0));
        const drop = function () {
          if (!api.mounted) return;
          api.mounted = false;
          if (box.parentNode) box.parentNode.removeChild(box);
          host.__bpSkel = null;
          pending = Math.max(0, pending - 1);
        };
        if (wait) win.setTimeout(drop, wait);
        else drop();
        return true;
      },
    };
    host.__bpSkel = api;
    return api;
  }

  function clear(host, force) {
    if (!host) return false;
    const s = host.__bpSkel;
    return s ? s.clear(force) : false;
  }

  /* 包一段同步/异步任务：任务期间显示骨架，结束（或失败）后清除 */
  function during(host, o, fn) {
    const s = mount(host, o);
    let out;
    try {
      out = fn();
    } catch (e) {
      if (s) s.clear(true);
      throw e;
    }
    if (out && typeof out.then === "function") {
      return out.then(
        v => { if (s) s.clear(); return v; },
        e => { if (s) s.clear(true); throw e; }
      );
    }
    if (s) s.clear();
    return out;
  }

  window.bpSkeleton = mount;
  window.__bpSkeleton = {
    mount: mount,
    clear: clear,
    during: during,
    pending: () => pending,
  };
})();
