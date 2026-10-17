"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Send, Square } from "lucide-react";
import { useInterviewStore } from "@/stores/interviewStore";
import { AGENTS, modeLabel, type InterviewMode } from "@/lib/ai/personas";
import type { ChatMessage } from "@/lib/ai/client";
import { AgentTimeline, type TimelineItem } from "./AgentTimeline";
import { Button } from "@/components/ui";

const MODES: InterviewMode[] = ["comprehensive", "tech", "pressure", "gentle"];

export function InterviewRoom() {
  const router = useRouter();
  const { profile, messages, setMessages, appendMessage, setReport } =
    useInterviewStore();
  const [mode, setMode] = useState<InterviewMode>("comprehensive");
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"idle" | "thinking" | "streaming">("idle");
  const [thinking, setThinking] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [streaming, setStreaming] = useState("");
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [listening, setListening] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (raw: string) => {
    const content = raw.trim();
    if (!content || phase !== "idle") return;
    const userMsg: ChatMessage = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPhase("thinking");
    setStreaming("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, mode, profile }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          const rawEvent = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = rawEvent.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          const event = eventLine ? eventLine.slice(6).trim() : "message";
          let data: any = {};
          try {
            data = JSON.parse(dataLine ? dataLine.slice(5).trim() : "{}");
          } catch {
            /* 忽略解析失败的事件 */
          }
          if (event === "agent") setCurrentAgent(data.id);
          else if (event === "thinking") setThinking(data.text);
          else if (event === "delta") {
            setPhase("streaming");
            setThinking(null);
            full += data.text;
            setStreaming(full);
          } else if (event === "observer") {
            setTimeline((t) => [
              ...t,
              {
                id: crypto.randomUUID(),
                agentId: "observer",
                kind: "note",
                text: data.note,
              },
            ]);
          } else if (event === "done") {
            appendMessage({ role: "assistant", content: full });
            setTimeline((t) => [
              ...t,
              {
                id: crypto.randomUUID(),
                agentId: currentAgent ?? "hr",
                kind: "question",
                text: full,
              },
            ]);
            setStreaming("");
          }
        }
      }
    } catch {
      setThinking("网络异常，请重试");
    } finally {
      setPhase("idle");
      setThinking(null);
    }
  };

  const toggleListening = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("当前浏览器不支持 Web Speech API，请使用 Chrome / Edge");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "zh-CN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput((p) => p + transcript);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const finish = async () => {
    if (messages.length < 2) {
      alert("请先完成至少一轮问答再生成报告");
      return;
    }
    setFinishing(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, profile }),
      });
      const report = await res.json();
      setReport(report);
      router.push("/report/demo");
    } catch {
      alert("报告生成失败，请重试");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="mx-auto grid h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 gap-6 px-6 py-4 lg:grid-cols-[1fr_20rem]">
      {/* 主对话区 */}
      <div className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
          <span className="text-sm font-medium text-slate-500">面试模式</span>
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                mode === m
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {modeLabel(m)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {currentAgent && (
              <span className="text-xs text-slate-400">
                当前发言：
                {AGENTS[currentAgent as keyof typeof AGENTS]?.name}
              </span>
            )}
            <Button variant="outline" onClick={finish} disabled={finishing}>
              {finishing ? "生成中…" : "结束面试并生成报告"}
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              面试尚未开始。在下方输入框发送第一条消息（例如“你好，我准备好开始了”），
              AI 面试官团队将依次向你提问。
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-slate-100 px-4 py-2.5 text-sm leading-relaxed text-slate-800">
                {streaming}
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-brand-500 align-middle" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="输入你的回答，Enter 发送，Shift+Enter 换行"
              rows={2}
              className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <Button
              variant="outline"
              onClick={toggleListening}
              title="语音输入（Web Speech API）"
              className={listening ? "border-red-300 text-red-500" : ""}
            >
              {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button onClick={() => send(input)} disabled={phase !== "idle"}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {phase === "thinking"
              ? "AI 面试官正在思考…"
              : phase === "streaming"
                ? "正在生成回答…"
                : "提示：语音输入需 Chrome / Edge 浏览器；回答尽量具体、带数据。"}
          </p>
        </div>
      </div>

      {/* Agent 圆桌时间线 */}
      <aside className="hidden min-h-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
        <AgentTimeline items={timeline} thinking={thinking} />
      </aside>
    </div>
  );
}
