/* 评分双引擎对拍：把同一批样本同时喂给 backend/app/scoring.py 与
   vue-scoring-method/src/scoring.js，逐项比较五维分数、总分、双镜头与锚点。
   任何一侧改公式而忘记同步，这一步会直接失败。
   用法：node scripts/check-scoring-method.js  （exit 0 = 一致） */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

const CASES = [
  {
    name: "空回答",
    turns: [{ agent: "技术官", question: "介绍一下你的项目", answer: "" }],
  },
  {
    name: "只有结论，口头禅多",
    turns: [
      {
        agent: "技术官",
        question: "怎么优化的",
        answer: "我优化了性能，然后那个就是整体还不错，就是后面还会继续改。",
      },
      {
        agent: "HR",
        question: "团队角色",
        answer: "就是配合大家一起做的，然后也没啥特别的。",
      },
    ],
  },
  {
    name: "量化充分 + 技术名词密集",
    turns: [
      {
        agent: "技术官",
        question: "白板项目怎么做实时同步",
        answer:
          "我负责协同白板的实时同步，用 Redis 的 pub/sub 做广播，本地再做一次操作合并，解决了 50 人同时编辑的冲突。首屏从 3.2s 降到 1.1s，P95 延迟 120ms，Redis 单节点支撑 2000 qps。",
      },
      {
        agent: "技术官",
        question: "为什么不用全量广播",
        answer:
          "因为全量广播的代价是带宽随人数平方增长，我们对比了增量下发与全量下发，最终选了增量，靠版本号做一致性校验，异常时降级为全量重拉。",
      },
      {
        agent: "压力面",
        question: "如果流量涨 10 倍呢",
        answer:
          "先做压测定位瓶颈，Redis 那边可以按房间分片，消息队列削峰；但我不确定 10 倍时合并冲突率会不会上升，需要实测。",
      },
      {
        agent: "HR",
        question: "团队里你是什么角色",
        answer:
          "我负责同步模块的设计与实现，推动前后端对齐接口，配合测试同学做压测，最终按期上线，复盘时我把冲突率复盘进文档。",
      },
    ],
  },
  {
    name: "防御性表述 + 短答 + 压力面",
    turns: [
      { agent: "压力面", question: "这个方案有问题", answer: "不是我的问题，跟我说没关系。", mode: "pressure" },
      { agent: "压力面", question: "为什么延期", answer: "但是我没有拖延。", mode: "pressure" },
      { agent: "HR", question: "自我评价", answer: "还行。" },
    ],
  },
  {
    name: "带匹配分",
    match: 86,
    turns: [
      {
        agent: "技术官",
        question: "React 与 Vue 的差异",
        answer:
          "React 用 JSX 与函数组件，Vue 3 用 SFC 与响应式代理；我在项目里用 React 做过看板，也接过 Vue 的活动页，性能上差异主要在更新粒度。",
      },
      {
        agent: "HR",
        question: "为什么选前端",
        answer: "因为能看到东西立刻跑起来，成长反馈快；我规划是先做深工程化，再补产品视角。",
      },
    ],
  },
];

function runPython() {
  const py = `
import json, sys
sys.path.insert(0, "backend")
from app.scoring import score_session, anchor_phrases
cases = json.load(sys.stdin)
out = []
for c in cases:
    r = score_session(c["turns"], match_score=c.get("match"))
    out.append({
        "dims": [{"key": d["key"], "score": d["score"]} for d in r["dims"]],
        "total": r["total"],
        "weakest": r["weakest"],
        "views": [{"tech": it["tech"]["score"], "hr": it["hr"]["score"], "gap": it["gap"],
                   "diverged": it["diverged"]} for it in r["agent_views"]["items"]],
        "anchors": [[{"start": a["start"], "end": a["end"], "kind": a["kind"]}
                     for a in anchor_phrases(t.get("answer", ""))] for t in c["turns"]],
    })
print(json.dumps(out, ensure_ascii=False))
`;
  const r = spawnSync("python", ["-c", py], {
    cwd: ROOT,
    input: JSON.stringify(CASES),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.error("Python 侧执行失败：", r.stderr || r.error);
    process.exit(1);
  }
  return JSON.parse(r.stdout);
}

(async () => {
  const js = await import(require("node:url").pathToFileURL(path.join(ROOT, "vue-scoring-method/src/scoring.js")).href);
  const py = runPython();

  let checks = 0;
  const fails = [];

  CASES.forEach((c, i) => {
    const ref = py[i];
    const mine = js.scoreSession(c.turns, { matchScore: c.match ?? null });

    mine.dims.forEach((d, k) => {
      checks++;
      if (d.score !== ref.dims[k].score) {
        fails.push(`${c.name} · ${d.name}: JS ${d.score} ≠ PY ${ref.dims[k].score}`);
      } else if (d.key !== ref.dims[k].key) {
        fails.push(`${c.name} · 维度顺序不一致`);
      }
    });

    checks++;
    if (mine.total !== ref.total) fails.push(`${c.name} · 总分: JS ${mine.total} ≠ PY ${ref.total}`);

    checks++;
    if (mine.weakest.name !== ref.weakest.dimension || mine.weakest.score !== ref.weakest.score) {
      fails.push(
        `${c.name} · 最弱维度: JS ${mine.weakest.name}/${mine.weakest.score} ≠ PY ${ref.weakest.dimension}/${ref.weakest.score}`
      );
    }

    c.turns.forEach((t, k) => {
      const a = js.anchorPhrases(t.answer || "");
      const anchorsPy = ref.anchors[k];
      checks++;
      const A = JSON.stringify(a.map((x) => [x.start, x.end, x.kind]));
      const B = JSON.stringify(anchorsPy.map((x) => [x.start, x.end, x.kind]));
      if (A !== B) fails.push(`${c.name} · 第 ${k + 1} 轮锚点: JS ${A} ≠ PY ${B}`);

      checks += 2;
      const tech = js.lensScore(t.answer || "", "tech").score;
      const hr = js.lensScore(t.answer || "", "hr").score;
      const v = ref.views[k];
      if (tech !== v.tech || hr !== v.hr) {
        fails.push(`${c.name} · 第 ${k + 1} 轮双镜头: JS ${tech}/${hr} ≠ PY ${v.tech}/${v.hr}`);
      }
      if (Math.abs(tech - hr) !== v.gap || Math.abs(tech - hr) >= 8 !== v.diverged) {
        fails.push(`${c.name} · 第 ${k + 1} 轮分歧: gap ${Math.abs(tech - hr)} vs PY ${v.gap}`);
      }
    });
  });

  console.log(`样本 ${CASES.length} 组 · 比对 ${checks} 项`);
  if (fails.length) {
    console.error("❌ 双引擎不一致：");
    fails.slice(0, 12).forEach((f) => console.error("  · " + f));
    process.exit(1);
  }
  console.log("✅ 双引擎一致：五维分数 / 总分 / 最弱维度 / 双镜头 / 锚点位置逐项相同");
})();
