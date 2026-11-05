<script setup>
import { computed, ref } from "vue";
import { anchorPhrases, lensScore, scoreSession, SAMPLE_ANSWERS } from "./scoring.js";

const text = ref(SAMPLE_ANSWERS[2].text);
const pressure = ref(false);
const active = ref("depth");

const turns = computed(() =>
  text.value
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((answer, i, arr) => ({
      answer,
      mode: pressure.value && i === arr.length - 1 ? "pressure" : "normal",
    }))
);

const result = computed(() => scoreSession(turns.value));
const anchors = computed(() => anchorPhrases(text.value));
const lens = computed(() => {
  const tech = lensScore(text.value, "tech").score;
  const hr = lensScore(text.value, "hr").score;
  return { tech, hr, gap: Math.abs(tech - hr) };
});
const current = computed(() => result.value.dims.find((d) => d.key === active.value) || result.value.dims[0]);

// 把原文按锚点切段，用于高亮渲染
const segments = computed(() => {
  const src = text.value;
  const out = [];
  let cursor = 0;
  for (const a of anchors.value) {
    if (a.start > cursor) out.push({ text: src.slice(cursor, a.start), hit: false });
    out.push({ text: src.slice(a.start, a.end), hit: true, kind: a.kind });
    cursor = a.end;
  }
  if (cursor < src.length) out.push({ text: src.slice(cursor), hit: false });
  return out;
});

const kindName = { skill: "技术名词", metric: "量化指标", action: "动作" };
const bar = (v) => Math.max(2, Math.min(100, ((v - 30) / 66) * 100));

function loadSample(s) {
  text.value = s.text;
  active.value = "depth";
}
</script>

<template>
  <div class="page">
    <header class="top">
      <div class="eyebrow">SCORING METHOD ／ 评分方法</div>
      <h1>五个分数，每一个都能被拆开看</h1>
      <p class="lede">
        这一页在浏览器里跑的是与 <code>backend/app/scoring.py</code> 同一套公式。改上面那段回答，
        下面的分数会变，但<strong>规则不会</strong>——同一份输入，任何时候、任何模型温度下都是同一组数字。
      </p>
      <div class="scope">
        <span class="scope-tag">边界</span>
        只服务训练与自评场景，不参与真实招聘录用决策；不做人群维度的偏见审计（不采集性别、年龄、院校等属性）。
        这里能保证的是：<strong>单次评价内部的证据可核查、结果可复现</strong>。
      </div>
    </header>

    <main class="grid">
      <section class="pane pane-input">
        <div class="pane-head">
          <span class="n">01</span>
          <h2>候选人的回答</h2>
        </div>
        <div class="samples">
          <button
            v-for="s in SAMPLE_ANSWERS"
            :key="s.id"
            class="sample"
            :class="{ on: text === s.text }"
            @click="loadSample(s)"
          >
            {{ s.tag }}
          </button>
        </div>
        <textarea v-model="text" spellcheck="false" aria-label="候选人回答文本"></textarea>
        <p class="hint">
          空行分隔多轮问答。当前 <b>{{ turns.length }}</b> 轮<template v-if="turns.length > 1">
            · 短答（不足 40 字）<b>{{ result.features.shortAnswers }}</b> 轮</template
          >
        </p>
        <label class="toggle">
          <input v-model="pressure" type="checkbox" />
          <span>最后一轮为压力面</span>
          <i>{{ pressure ? "压力面轮次 × 1" : "无压力面" }}</i>
        </label>
      </section>

      <section class="pane pane-score">
        <div class="pane-head">
          <span class="n">02</span>
          <h2>五维分数</h2>
          <span class="total">{{ result.total }}<i>总分</i></span>
        </div>
        <ul class="dims">
          <li
            v-for="d in result.dims"
            :key="d.key"
            class="dim"
            :class="{ on: active === d.key }"
            @click="active = d.key"
          >
            <div class="dim-top">
              <span class="dim-name">{{ d.name }}</span>
              <span class="dim-score">{{ d.score }}</span>
            </div>
            <div class="track"><div class="fill" :style="{ width: bar(d.score) + '%' }"></div></div>
          </li>
        </ul>
        <div class="dual">
          <div class="dual-head">同一段回答的双镜头</div>
          <div class="dual-body">
            <div>
              <b>{{ lens.tech }}</b
              ><span>技术面</span>
            </div>
            <div>
              <b>{{ lens.hr }}</b
              ><span>HR 面</span>
            </div>
            <div class="gap" :class="{ hot: lens.gap >= 8 }">
              <b>{{ lens.gap }}</b
              ><span>分歧{{ lens.gap >= 8 ? "（已标记）" : "" }}</span>
            </div>
          </div>
          <p class="dual-note">两路用不同权重独立打分，分歧本身就是「多个 Agent 各自判断」的证据，而不是取平均抹平。</p>
        </div>
      </section>

      <section class="pane pane-why">
        <div class="pane-head">
          <span class="n">03</span>
          <h2>这一分是怎么来的</h2>
          <code class="py">scoring.py:{{ current.py }}</code>
        </div>
        <div class="formula">{{ current.formula }}</div>
        <ul class="parts">
          <li v-for="(p, i) in current.parts" :key="i">
            <span class="pl">{{ p.label }}</span>
            <span class="pv" :class="{ neg: p.value < 0 }">
              {{ p.value > 0 ? "+" : "" }}{{ Number(p.value.toFixed(1)) }}
            </span>
          </li>
        </ul>
        <div class="clamp-note">
          结果被夹在 <b>30–96</b> 之间（<code>_clamp</code>：加 0.5 后向下取整，不是各语言自带的 round——Python
          的银行家舍入与 JS 的 <code>Math.round</code> 曾在 .5 边界上差 1 分）。
        </div>
      </section>

      <section class="pane pane-anchor">
        <div class="pane-head">
          <span class="n">04</span>
          <h2>证据锚点</h2>
          <code class="py">scoring.py:44–76</code>
        </div>
        <p class="anchor-text">
          <template v-for="(seg, i) in segments" :key="i">
            <mark v-if="seg.hit" :class="'k-' + seg.kind">{{ seg.text }}</mark>
            <span v-else>{{ seg.text }}</span>
          </template>
        </p>
        <div class="legend">
          <span><i class="sw k-skill"></i>技术名词 · 权重 3</span>
          <span><i class="sw k-metric"></i>量化指标 · 权重 2</span>
          <span><i class="sw k-action"></i>动作 · 权重 1</span>
        </div>
        <ul class="anchor-list">
          <li v-for="(a, i) in anchors" :key="i">
            <span class="ai">{{ i + 1 }}</span>
            <span class="at">「{{ a.text }}」</span>
            <span class="ak">{{ kindName[a.kind] }} · 字符 {{ a.start }}–{{ a.end }}</span>
          </li>
          <li v-if="!anchors.length" class="empty">
            这段回答里没有命中任何锚点——报告会退化为整段引用，并标注来源不是锚点。
          </li>
        </ul>
        <p class="hint">
          锚点在<strong>算分同一刻</strong>从原文提取并随报告落库，字符起止位置固定，可点回对话核对；
          不是先出分再让模型补一段引用。
        </p>
      </section>
    </main>

    <footer class="foot">
      <div class="foot-row">
        <span>面镜 FutureMirror · 评分方法展示层</span>
        <span>Vue 3.5 · 单文件构建 · 无后端请求</span>
      </div>
      <p>
        本页与产品内的评分引擎同源：公式、阈值、锚点权重逐条对应
        <code>backend/app/scoring.py</code>，并由 <code>scripts/check-scoring-method.js</code>
        用同一批样本对拍校验。页面上所有分数都是在你自己的浏览器里算出来的，不发往任何服务器。
      </p>
    </footer>
  </div>
</template>

<style>
:root {
  --paper: #f4f1e8;
  --ink: #1c1913;
  --muted: #57503e;
  --faint: #8c8471;
  --line: #d8d2bf;
  --line2: #b9b29a;
  --brand: #be3a1e;
  --serif: Georgia, "Songti SC", "SimSun", serif;
  --mono: ui-monospace, "Cascadia Code", Consolas, monospace;
  --sans: -apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(to right, rgba(28, 25, 19, 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(28, 25, 19, 0.045) 1px, transparent 1px),
    linear-gradient(to right, rgba(28, 25, 19, 0.028) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(28, 25, 19, 0.028) 1px, transparent 1px);
  background-size:
    96px 96px,
    96px 96px,
    24px 24px,
    24px 24px;
}
.page {
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin: 0 auto;
  padding: 46px 22px 60px;
}
.eyebrow {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--brand);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 18px;
}
h1 {
  font-family: var(--serif);
  font-size: clamp(26px, 3.4vw, 38px);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
}
.lede {
  max-width: 720px;
  margin-top: 12px;
  font-size: 14.5px;
  color: var(--muted);
}
.lede code,
.foot code,
.clamp-note code,
.py {
  font-family: var(--mono);
  font-size: 12px;
}
.lede code {
  background: rgba(28, 25, 19, 0.06);
  padding: 1px 4px;
}
.scope {
  margin-top: 16px;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--brand);
  background: rgba(255, 255, 255, 0.5);
  font-size: 12.5px;
  color: var(--muted);
}
.scope-tag {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--brand);
  margin-right: 8px;
}
.grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 16px;
  margin-top: 26px;
}
.pane {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.62);
  padding: 16px 16px 18px;
}
.pane-head {
  display: flex;
  align-items: baseline;
  gap: 9px;
  padding-bottom: 10px;
  margin-bottom: 13px;
  border-bottom: 1px solid var(--line);
}
.pane-head .n {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--brand);
  border: 1px solid var(--brand);
  padding: 0 4px;
}
.pane-head h2 {
  font-family: var(--serif);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.pane-head .total {
  margin-left: auto;
  font-family: var(--serif);
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  color: var(--brand);
}
.pane-head .total i {
  font-style: normal;
  font-family: var(--sans);
  font-size: 10px;
  color: var(--faint);
  margin-left: 4px;
}
.pane-head .py {
  margin-left: auto;
  color: var(--faint);
}
.pane-input {
  display: flex;
  flex-direction: column;
}
.pane-input textarea {
  flex: 1 1 auto;
}
.samples {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  flex: 0 0 auto;
}
.sample {
  font-family: var(--sans);
  font-size: 11.5px;
  color: var(--muted);
  background: transparent;
  border: 1px solid var(--line2);
  padding: 4px 9px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}
.sample:hover {
  border-color: var(--ink);
  color: var(--ink);
}
.sample.on {
  border-color: var(--brand);
  color: var(--brand);
  background: rgba(190, 58, 30, 0.05);
}
textarea {
  width: 100%;
  min-height: 176px;
  resize: vertical;
  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.75;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--line2);
  padding: 11px 12px;
}
textarea:focus {
  outline: none;
  border-color: var(--ink);
}
.hint {
  margin-top: 9px;
  font-size: 11.5px;
  color: var(--faint);
  line-height: 1.7;
}
.hint b {
  color: var(--muted);
  font-weight: 600;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
  user-select: none;
}
.toggle input {
  accent-color: var(--brand);
}
.toggle i {
  font-style: normal;
  font-family: var(--mono);
  font-size: 10.5px;
  color: var(--faint);
  margin-left: auto;
}
.dims {
  list-style: none;
  display: grid;
  gap: 7px;
}
.dim {
  border: 1px solid transparent;
  padding: 7px 8px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.dim:hover {
  border-color: var(--line2);
}
.dim.on {
  border-color: var(--ink);
  background: rgba(255, 255, 255, 0.85);
}
.dim-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.dim-name {
  font-size: 12.5px;
  color: var(--muted);
}
.dim-score {
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 700;
}
.track {
  height: 3px;
  background: var(--line);
  margin-top: 5px;
}
.fill {
  height: 100%;
  background: var(--ink);
  transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.dim.on .fill {
  background: var(--brand);
}
.dual {
  margin-top: 18px;
  border-top: 1px solid var(--line);
  padding-top: 13px;
}
.dual-head {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: var(--faint);
}
.dual-body {
  display: flex;
  gap: 22px;
  margin-top: 8px;
}
.dual-body b {
  font-family: var(--serif);
  font-size: 21px;
  font-weight: 700;
}
.dual-body span {
  display: block;
  font-size: 10.5px;
  color: var(--faint);
}
.dual-body .gap b {
  color: var(--faint);
}
.dual-body .gap.hot b {
  color: var(--brand);
}
.dual-note {
  margin-top: 7px;
  font-size: 11.5px;
  color: var(--faint);
  line-height: 1.65;
}
.formula {
  font-family: var(--mono);
  font-size: 11.5px;
  line-height: 1.85;
  color: var(--ink);
  background: rgba(28, 25, 19, 0.04);
  padding: 10px 11px;
  border-left: 2px solid var(--ink);
  word-break: break-word;
}
.parts {
  list-style: none;
  margin-top: 12px;
  display: grid;
  gap: 6px;
}
.parts li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}
.pl {
  color: var(--muted);
}
.pv {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.pv.neg {
  color: var(--brand);
}
.clamp-note {
  margin-top: 13px;
  padding-top: 11px;
  border-top: 1px dashed var(--line2);
  font-size: 11.5px;
  color: var(--faint);
  line-height: 1.7;
}
.anchor-text {
  font-size: 13px;
  line-height: 1.95;
  color: var(--muted);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.6);
  padding: 11px 12px;
  max-height: 168px;
  overflow-y: auto;
}
.anchor-text mark {
  color: var(--ink);
  background: transparent;
  border-bottom: 2px solid var(--brand);
  padding-bottom: 1px;
}
.anchor-text mark.k-skill {
  border-bottom-color: var(--brand);
}
.anchor-text mark.k-metric {
  border-bottom-color: #96690f;
}
.anchor-text mark.k-action {
  border-bottom-color: var(--line2);
}
.legend {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 9px;
  font-size: 10.5px;
  color: var(--faint);
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.sw {
  width: 12px;
  height: 2px;
  display: inline-block;
}
.sw.k-skill {
  background: var(--brand);
}
.sw.k-metric {
  background: #96690f;
}
.sw.k-action {
  background: var(--line2);
}
.anchor-list {
  list-style: none;
  margin-top: 12px;
  display: grid;
  gap: 6px;
}
.anchor-list li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}
.ai {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--brand);
}
.at {
  color: var(--ink);
}
.ak {
  margin-left: auto;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--faint);
  white-space: nowrap;
}
.anchor-list .empty {
  color: var(--faint);
  font-size: 11.5px;
  line-height: 1.7;
}
.foot {
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.foot-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--faint);
}
.foot p {
  margin-top: 9px;
  font-size: 11.5px;
  color: var(--faint);
  line-height: 1.75;
  max-width: 860px;
}
@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .page {
    padding: 30px 15px 44px;
  }
  .pane-head .total {
    font-size: 22px;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
