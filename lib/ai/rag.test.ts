import { describe, expect, it } from "vitest";
import { retrieve, retrieveScored, buildRagContext } from "./rag";

describe("retrieve", () => {
  it("命中面经条目", () => {
    const hits = retrieve("字节 后端 二面 一般问什么");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].source).toContain("字节");
  });

  it("无关键词时返回空", () => {
    expect(retrieve("xyzzy")).toHaveLength(0);
  });

  it("支持无空格中文查询（bigram 切分）", () => {
    const hits = retrieve("字节后端二面一般问什么");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].source).toContain("字节");
  });
});

describe("混合检索 + 重排（retrieveScored）", () => {
  it("每条结果带三阶段分解：bm25 / cos / 融合 / 重排", () => {
    const hits = retrieveScored("Redis 缓存穿透", 3);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      expect(h.bm25).toBeGreaterThanOrEqual(0);
      expect(h.cos).toBeGreaterThanOrEqual(0);
      expect(h.feat).toBeDefined();
      expect(h.featScore).toBeGreaterThanOrEqual(0);
      expect(h.final).toBeGreaterThan(0);
    }
    // 重排后严格按 final 降序
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1].final).toBeGreaterThanOrEqual(hits[i].final);
    }
  });

  it("score 仍是融合分（余弦×0.6 + BM25归一分×0.4），不被重排覆盖", () => {
    const [top] = retrieveScored("MySQL 索引", 3);
    expect(Math.abs(top.score - (0.6 * top.cos + 0.4 * top.bm25Norm))).toBeLessThan(0.01);
  });

  it("五特征均在 [0,1]（可解释、可展示）", () => {
    const hits = retrieveScored("后端 开发 工程师", 3);
    for (const h of hits) {
      for (const v of Object.values(h.feat)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("标题全覆盖查询的词条被重排到 Top1", () => {
    const hits = retrieveScored("字节 后端 二面", 3);
    expect(hits[0].entry.title).toContain("字节");
    expect(hits[0].entry.title).toContain("二面");
    expect(hits[0].feat.title).toBe(1);
  });

  it("完整短语命中获得高 phrase 特征分", () => {
    const [top] = retrieveScored("Redis 缓存穿透", 3);
    expect(top.entry.title).toContain("穿透");
    expect(top.feat.phrase).toBeGreaterThanOrEqual(0.9);
  });

  it("空查询返回空（分词后无 token 时不检索）", () => {
    expect(retrieveScored("xyzzy", 3)).toHaveLength(0);
    expect(retrieveScored("", 3)).toHaveLength(0);
  });

  it("k 参数截断生效", () => {
    expect(retrieve("字节后端二面一般问什么", 1)).toHaveLength(1);
  });
});

describe("buildRagContext", () => {
  it("返回引用来源与上下文", () => {
    const { context, citations } = buildRagContext("STAR 法则怎么讲项目");
    expect(citations.length).toBeGreaterThan(0);
    expect(citations[0]).toHaveProperty("source");
    expect(citations[0]).toHaveProperty("snippet");
    expect(context).toContain("资料1");
  });
});
