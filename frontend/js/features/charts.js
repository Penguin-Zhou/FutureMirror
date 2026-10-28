"use strict";
/* ============================================================
 * v37 · 通用图表组件（蓝图编辑风 · 零第三方图表库）
 *   设计约束（与全站视觉纪律一致）：
 *     · 全部返回 SVG 字符串，颜色只走 CSS 变量 → 随主题自动反转
 *     · 零投影、全直角（stroke-linecap: butt）、发丝线
 *     · 朱红仅用于标记「主导 / 最高 / 最弱」等单一重点，面积 ≤5%
 *     · 悬停详情复用 viz.js 的 [data-tip] 全局接管，无需各自绑定事件
 *   组件：
 *     ① donutSVG        环形进度（简历完整度 / 达成率）
 *     ② hbarSVG         横向条形（匹配排行，支持点击回调）
 *     ③ bipolarBarsSVG  双极条（MBTI 四维倾向，中轴 50%）
 *     ④ radar4SVG       多维雷达（MBTI 人格轮廓 / 维度对比）
 *     ⑤ trendSVG        折线演进（对话式匹配逐轮变化）
 *     ⑥ columnSVG       竖向柱状（城市 / 技能分布）
 *     ⑦ progressDotsSVG 进度点阵（量表答题进度）
 * ============================================================ */

/* 图表色板：统一取 CSS 变量，避免在源码里硬编码任何色值 */
const CHART_C = {
  ink: "var(--ink)",
  line: "var(--line)",
  brand: "var(--brand)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  deep: "var(--bg-deep)",
};

/* 数值安全化：非数字一律按 0 处理，防止 NaN 写进 SVG 属性 */
function chartNum(v, dflt) {
  const n = Number(v);
  return isFinite(n) ? n : (dflt || 0);
}
function chartClamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, chartNum(v, lo)));
}
/* 空态：不画空图，直接给可读文案（避免"有图无数据"的假象） */
function chartEmpty(text) {
  return `<div class="chart-empty">${escHtml(text || "暂无数据")}</div>`;
}

/* ---------- ① 环形进度 ---------- */
function donutSVG(pct, o) {
  o = o || {};
  const p = Math.round(chartClamp(pct, 0, 100));
  const size = o.size || 132;
  const r = o.r || 48;
  const sw = o.sw || 12;
  const c = size / 2;
  const C = 2 * Math.PI * r;
  const off = (C * (1 - p / 100)).toFixed(2);
  const color = o.hot === false ? CHART_C.ink : CHART_C.brand;
  return `<svg viewBox="0 0 ${size} ${size}" class="chart-svg chart-donut" role="img" aria-label="${escHtml(o.aria || "完成度 " + p + "%")}">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${CHART_C.line}" stroke-width="${sw}"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"
      stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${off}"
      transform="rotate(-90 ${c} ${c})" stroke-linecap="butt"/>
    <text x="${c}" y="${c + 2}" text-anchor="middle" font-size="26" font-weight="700"
      font-family="var(--mono)" fill="${CHART_C.ink}">${p}%</text>
    <text x="${c}" y="${c + 20}" text-anchor="middle" font-size="10.5" fill="${CHART_C.faint}">${escHtml(o.label || "完整度")}</text>
  </svg>`;
}

/* ---------- ② 横向条形 ----------
 * items: [{ label, value, text, tip, onclick, hot }]
 *   text   条右侧显示文本（默认显示 value）
 *   hot    该行用朱红标记（最高 / 最弱 / 当前）
 *   onclick 点击回调（写进 onclick 属性，调用方注意引号） */
function hbarSVG(items, o) {
  o = o || {};
  const list = (items || []).filter(Boolean);
  if (!list.length) return chartEmpty(o.empty || "暂无数据");
  const W = o.width || 420;
  const rowH = o.rowH || 30;
  const padL = o.padL || 92;
  const padR = o.padR || 46;
  const H = list.length * rowH + 6;
  let mx = 0;
  list.forEach((d) => { if (chartNum(d.value, 0) > mx) mx = chartNum(d.value, 0); });
  const max = o.max || mx || 1;
  const trackW = W - padL - padR;
  const rows = list.map((d, i) => {
    const v = chartClamp(d.value, 0, max);
    const w = (trackW * v / max).toFixed(1);
    const y = i * rowH + 4;
    const hot = !!(d.hot || o.hotIndex === i);
    const fill = d.color || (hot ? CHART_C.brand : CHART_C.ink);
    let label = String(d.label == null ? "" : d.label);
    const limit = o.labelLen || 9;
    if (label.length > limit) label = label.slice(0, limit - 1) + "…";
    const click = d.onclick ? ` style="cursor:pointer" onclick="${d.onclick}"` : "";
    const tip = d.tip ? ` data-tip="${escHtml(d.tip)}" tabindex="0"` : ` data-tip="${escHtml(label + " · " + v)}" tabindex="0"`;
    const vtext = String(d.text != null ? d.text : v);
    return `<g class="chart-row"${click}${tip}>
      <title>${escHtml(d.tip || (label + " · " + vtext))}</title>
      <text x="${padL - 8}" y="${y + 12}" text-anchor="end" font-size="11.5" fill="${CHART_C.muted}">${escHtml(label)}</text>
      <rect x="${padL}" y="${y + 3}" width="${trackW}" height="10" fill="none" stroke="${CHART_C.line}"/>
      <rect x="${padL}" y="${y + 3}" width="${w}" height="10" fill="${fill}"${hot ? "" : ' opacity="0.72"'}/>
      <text x="${W - padR + 8}" y="${y + 12}" font-size="11" font-family="var(--mono)"
        fill="${hot ? CHART_C.brand : CHART_C.faint}">${escHtml(vtext)}</text>
    </g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg chart-hbar" role="img" aria-label="${escHtml(o.aria || "条形图")}">${rows}</svg>`;
}

/* ---------- ③ 双极条（MBTI 四维倾向）----------
 * dims: [{ name, aName, bName, pctA, letter }]
 * 一条轨道被分界点切成两截：左截 = a 占比，右截 = b 占比，
 * 分界点越过中轴即代表该维度偏向 a（朱红标记主导侧）。 */
function bipolarBarsSVG(dims, o) {
  o = o || {};
  const list = (dims || []).filter(Boolean);
  if (!list.length) return chartEmpty(o.empty || "暂无数据");
  const W = o.width || 420;
  const rowH = o.rowH || 42;
  const H = list.length * rowH + 6;
  const padSide = o.padSide || 58;
  const trackX = padSide;
  const trackW = W - padSide * 2;
  const cx = W / 2;
  const rows = list.map((d, i) => {
    const pctA = Math.round(chartClamp(d.pctA, 0, 100));
    const pctB = 100 - pctA;
    const wA = (trackW * pctA / 100).toFixed(1);
    const wB = (trackW * pctB / 100).toFixed(1);
    const y = i * rowH + 4;
    const aWin = pctA >= 50;
    const name = String(d.name || "");
    const lead = String(d.letter || (aWin ? d.aName : d.bName) || "");
    const aTxt = `${String(d.aName || "A")} ${pctA}%`;
    const bTxt = `${pctB}% ${String(d.bName || "B")}`;
    return `<g class="chart-row" data-tip="${escHtml(name + "：" + aTxt + " / " + bTxt)}" tabindex="0">
      <title>${escHtml(name + "：" + aTxt + " / " + bTxt)}</title>
      <text x="2" y="${y + 11}" font-size="10.5" fill="${CHART_C.faint}">${escHtml(name)}</text>
      <text x="${W - 2}" y="${y + 11}" text-anchor="end" font-size="10.5" fill="${CHART_C.brand}">${escHtml(lead)} 主导</text>
      <text x="${padSide - 6}" y="${y + 27}" text-anchor="end" font-size="11"
        fill="${aWin ? CHART_C.brand : CHART_C.muted}">${escHtml(aTxt)}</text>
      <rect x="${trackX}" y="${y + 17}" width="${wA}" height="11" fill="${CHART_C.brand}" opacity="${aWin ? "0.9" : "0.35"}"/>
      <rect x="${trackX + Number(wA)}" y="${y + 17}" width="${wB}" height="11" fill="${CHART_C.ink}" opacity="${aWin ? "0.16" : "0.42"}"/>
      <rect x="${trackX}" y="${y + 17}" width="${trackW}" height="11" fill="none" stroke="${CHART_C.line}"/>
      <line x1="${cx}" y1="${y + 13}" x2="${cx}" y2="${y + 32}" stroke="${CHART_C.faint}" stroke-width="1" stroke-dasharray="2 3"/>
      <text x="${W - padSide + 6}" y="${y + 27}" font-size="11"
        fill="${aWin ? CHART_C.muted : CHART_C.brand}">${escHtml(bTxt)}</text>
    </g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg chart-bipolar" role="img" aria-label="${escHtml(o.aria || "维度倾向双极条")}">${rows}</svg>`;
}

/* ---------- ④ 多维雷达 ----------
 * dims: [{ name, value }]，value 为 0-100（MBTI 传 pctA / strength） */
function radar4SVG(dims, o) {
  o = o || {};
  const list = (dims || []).filter(Boolean);
  if (list.length < 3) return chartEmpty(o.empty || "维度不足，无法绘制雷达");
  const N = list.length;
  const size = o.size || 250;
  const c = size / 2;
  const R = o.r || 74;
  const ang = (i) => -Math.PI / 2 + (Math.PI * 2 * i) / N;
  const pt = (i, r) => [c + Math.cos(ang(i)) * r, c + Math.sin(ang(i)) * r];
  let rings = "";
  [0.25, 0.5, 0.75, 1].forEach((f) => {
    rings += `<polygon points="${list.map((_, i) => pt(i, R * f).map((n) => n.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${CHART_C.line}"/>`;
  });
  let axes = "";
  list.forEach((_, i) => {
    const p = pt(i, R);
    axes += `<line x1="${c}" y1="${c}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="${CHART_C.line}"/>`;
  });
  const vals = list.map((d) => chartClamp(d.value, 0, 100));
  const poly = list.map((d, i) => pt(i, R * vals[i] / 100).map((n) => n.toFixed(1)).join(",")).join(" ");
  const dots = list.map((d, i) => {
    const p = pt(i, R * vals[i] / 100);
    return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="${CHART_C.brand}"
      data-tip="${escHtml(String(d.name || "") + " " + Math.round(vals[i]))}" tabindex="0"/>`;
  }).join("");
  const labels = list.map((d, i) => {
    const p = pt(i, R + 20);
    const x = Number(p[0].toFixed(1));
    const y = Number(p[1].toFixed(1));
    const cosv = Math.cos(ang(i));
    const anchor = Math.abs(cosv) < 0.3 ? "middle" : cosv > 0 ? "start" : "end";
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-size="10.5" fill="${CHART_C.muted}">${escHtml(String(d.name || ""))}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${size} ${size}" class="chart-svg chart-radar" role="img" aria-label="${escHtml(o.aria || "维度雷达图")}">
    ${rings}${axes}
    <polygon points="${poly}" fill="${CHART_C.brand}" fill-opacity="0.14" stroke="${CHART_C.brand}" stroke-width="2"/>
    ${dots}${labels}
  </svg>`;
}

/* ---------- ⑤ 折线演进 ----------
 * points: [{ label, v }]，v 为 0-100；用于「对话越问越准」的匹配度变化 */
function trendSVG(points, o) {
  o = o || {};
  const list = (points || []).filter(Boolean);
  if (!list.length) return chartEmpty(o.empty || "暂无数据");
  const W = o.width || 420;
  const H = o.height || 150;
  const padX = o.padX || 34;
  const top = 16;
  const bottom = H - 26;
  const vs = list.map((d) => chartClamp(d.v, 0, 100));
  const loFixed = o.min != null ? chartNum(o.min, 0) : 0;
  const hiFixed = o.max != null ? chartNum(o.max, 100) : 100;
  const span = Math.max(1, hiFixed - loFixed);
  const x = (i) => (list.length === 1 ? (padX + (W - padX * 2) / 2) : padX + ((W - padX * 2) * i) / (list.length - 1));
  const y = (v) => bottom - ((bottom - top) * (v - loFixed)) / span;
  const line = vs.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const first = vs[0];
  const dots = list.map((d, i) => {
    const v = Math.round(vs[i]);
    const cx = x(i).toFixed(1);
    const cy = y(vs[i]).toFixed(1);
    const delta = i === 0 ? "" : (vs[i] - vs[i - 1] >= 0 ? "+" : "") + Math.round(vs[i] - vs[i - 1]);
    return `<g class="chart-row" data-tip="${escHtml(String(d.label || ("第 " + i + " 点")) + " · " + v + (delta ? "（" + delta + "）" : ""))}" tabindex="0">
      <title>${escHtml(String(d.label || "") + " · " + v)}</title>
      <circle cx="${cx}" cy="${cy}" r="4" fill="${i === list.length - 1 ? CHART_C.brand : CHART_C.ink}"/>
      <text x="${cx}" y="${(Number(cy) - 9).toFixed(1)}" text-anchor="middle" font-size="10"
        font-family="var(--mono)" fill="${i === list.length - 1 ? CHART_C.brand : CHART_C.faint}">${v}</text>
      <text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="9.5" fill="${CHART_C.faint}">${escHtml(String(d.label || ""))}</text>
    </g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg chart-trend" role="img" aria-label="${escHtml(o.aria || "变化折线")}">
    <line x1="${padX}" y1="${bottom}" x2="${W - padX}" y2="${bottom}" stroke="${CHART_C.line}"/>
    <line x1="${padX}" y1="${y(first).toFixed(1)}" x2="${W - padX}" y2="${y(first).toFixed(1)}"
      stroke="${CHART_C.faint}" stroke-dasharray="3 4"/>
    <polyline points="${line}" fill="none" stroke="${CHART_C.brand}" stroke-width="2"/>
    ${dots}
  </svg>`;
}

/* ---------- ⑥ 竖向柱状 ----------
 * items: [{ label, value }] */
function columnSVG(items, o) {
  o = o || {};
  const list = (items || []).filter(Boolean);
  if (!list.length) return chartEmpty(o.empty || "暂无数据");
  const W = o.width || 420;
  const H = o.height || 140;
  const padB = 30;
  const padT = 18;
  const n = list.length;
  const slot = (W - 16) / n;
  const bw = Math.min(o.barW || 34, slot * 0.56);
  let mx = 0;
  list.forEach((d) => { if (chartNum(d.value, 0) > mx) mx = chartNum(d.value, 0); });
  const max = o.max || mx || 1;
  const bars = list.map((d, i) => {
    const v = chartClamp(d.value, 0, max);
    const h = ((H - padB - padT) * v / max).toFixed(1);
    const x = (8 + slot * i + (slot - bw) / 2).toFixed(1);
    const y = (H - padB - Number(h)).toFixed(1);
    const hot = !!d.hot;
    let label = String(d.label == null ? "" : d.label);
    if (label.length > 5) label = label.slice(0, 4) + "…";
    return `<g class="chart-row" data-tip="${escHtml(label + " · " + Math.round(v))}" tabindex="0">
      <title>${escHtml(label + " · " + Math.round(v))}</title>
      <rect x="${x}" y="${y}" width="${bw.toFixed(1)}" height="${h}" fill="${hot ? CHART_C.brand : CHART_C.ink}" opacity="${hot ? "1" : "0.72"}"/>
      <text x="${(Number(x) + bw / 2).toFixed(1)}" y="${(Number(y) - 5).toFixed(1)}" text-anchor="middle"
        font-size="10" font-family="var(--mono)" fill="${CHART_C.faint}">${Math.round(v)}</text>
      <text x="${(Number(x) + bw / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="10" fill="${CHART_C.muted}">${escHtml(label)}</text>
    </g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg chart-column" role="img" aria-label="${escHtml(o.aria || "分布柱状图")}">
    <line x1="8" y1="${H - padB}" x2="${W - 8}" y2="${H - padB}" stroke="${CHART_C.line}"/>
    ${bars}
  </svg>`;
}

/* ---------- ⑦ 进度点阵 ----------
 * 直角小方块（不用圆点，保持全直角风格）：已完成实心、当前朱红、未开始线框 */
function progressDotsSVG(total, cur, o) {
  o = o || {};
  const n = Math.max(1, Math.round(chartNum(total, 1)));
  const c = chartClamp(cur, 0, n);
  const w = o.cell || 14;
  const gap = o.gap || 4;
  const W = n * w + (n - 1) * gap;
  const H = w + 4;
  let cells = "";
  for (let i = 0; i < n; i++) {
    const x = i * (w + gap);
    const done = i < c;
    const now = i === c;
    cells += `<rect x="${x}" y="2" width="${w}" height="${w}" data-tip="${escHtml("第 " + (i + 1) + " / " + n + " · " + (done ? "已完成" : now ? "当前" : "未开始"))}"
      fill="${done ? CHART_C.ink : now ? CHART_C.brand : "none"}"
      stroke="${done || now ? "none" : CHART_C.line}"
      opacity="${done ? "0.75" : "1"}"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg chart-dots" style="max-width:${W}px" role="img"
    aria-label="${escHtml("进度 " + c + " / " + n)}">${cells}</svg>`;
}
