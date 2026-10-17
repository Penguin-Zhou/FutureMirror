"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui";

interface Citation {
  source: string;
  snippet: string;
}

/** RAG 面经问答：答案必须带引用来源 */
export function RagQA() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "（无回答）");
      setCitations(data.citations ?? []);
    } catch {
      setAnswer("网络异常，请重试");
      setCitations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="试试：字节后端二面一般问什么？"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <Button onClick={ask} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {answer && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
          {answer}
          {citations.length > 0 && (
            <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
              <p className="text-xs font-medium text-slate-400">引用来源</p>
              {citations.map((c, i) => (
                <p key={i} className="text-xs text-slate-500">
                  [{i + 1}] {c.source} — {c.snippet}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
