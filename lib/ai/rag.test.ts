import { describe, expect, it } from "vitest";
import { retrieve, buildRagContext } from "./rag";

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

describe("buildRagContext", () => {
  it("返回引用来源与上下文", () => {
    const { context, citations } = buildRagContext("STAR 法则怎么讲项目");
    expect(citations.length).toBeGreaterThan(0);
    expect(citations[0]).toHaveProperty("source");
    expect(citations[0]).toHaveProperty("snippet");
    expect(context).toContain("资料1");
  });
});
