"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Sparkles, Target } from "lucide-react";
import { useInterviewStore } from "@/stores/interviewStore";
import { RagQA } from "@/components/rag/RagQA";
import { Badge, Button, Card } from "@/components/ui";
import type { Profile } from "@/lib/ai/schema";

interface ChannelInfo {
  provider: string;
  label: string;
  mock: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, setProfile, reset } = useInterviewStore();
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setChannel)
      .catch(() => setChannel(null));
  }, []);

  const onFile = async (f: File) => {
    // MVP 支持 .txt/.md；PDF/DOCX 解析（mammoth/pdfjs）Week 2 上线
    const text = await f.text();
    setResume(text);
  };

  const analyze = async () => {
    if (!resume.trim() || !jd.trim()) {
      alert("请填写简历文本与目标岗位 JD");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resume, jdText: jd }),
      });
      const data = (await res.json()) as Profile & { mock?: boolean };
      setProfile(data);
    } catch {
      alert("解析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const startInterview = () => {
    reset();
    if (profile) setProfile(profile);
    router.push("/interview/demo");
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">面试准备台</h1>
          <p className="mt-1 text-sm text-slate-500">
            上传简历与目标岗位 JD，AI 将生成匹配报告并驱动模拟面试。
          </p>
        </div>
        {channel && (
          <Badge className={channel.mock ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>
            模型通道：{channel.label}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" />
            <h2 className="font-semibold">简历文本</h2>
          </div>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="粘贴简历内容，或上传 .txt / .md 文件（PDF/DOCX 解析 Week 2 上线）"
            rows={8}
            className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-500"
          />
          <input
            type="file"
            accept=".txt,.md"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            className="mt-2 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-600" />
            <h2 className="font-semibold">目标岗位 JD</h2>
          </div>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="粘贴目标岗位的职位描述（JD）全文"
            rows={8}
            className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-500"
          />
          <div className="mt-3 flex gap-3">
            <Button onClick={analyze} disabled={loading}>
              <Sparkles className="h-4 w-4" />
              {loading ? "分析中…" : "生成匹配报告"}
            </Button>
            <Button variant="outline" onClick={() => { setResume(DEMO_RESUME); setJd(DEMO_JD); }}>
              填入示例数据
            </Button>
          </div>
        </Card>
      </div>

      {profile && (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-brand-600">{profile.matchScore}</p>
              <p className="text-xs text-slate-400">匹配分 / 100</p>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="mb-1 text-sm font-medium">已具备技能</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <Badge key={s} className="bg-green-50 text-green-700">{s}</Badge>
                  ))}
                  {profile.skills.length === 0 && <span className="text-sm text-slate-400">未识别到</span>}
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">能力缺口</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.gaps.map((g) => (
                    <Badge key={g} className="bg-red-50 text-red-600">{g}</Badge>
                  ))}
                  {profile.gaps.length === 0 && <span className="text-sm text-slate-400">无明显缺口</span>}
                </div>
              </div>
              {profile.suggestions.length > 0 && (
                <ul className="space-y-1 text-sm text-slate-600">
                  {profile.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Button onClick={startInterview}>开始多 Agent 模拟面试 →</Button>
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold">RAG 面经问答</h2>
        <RagQA />
      </Card>
    </div>
  );
}

const DEMO_RESUME = `张三，2027 届本科，软件工程专业。
技能：熟悉 React、TypeScript、Node.js、MySQL；了解 Redis 与 Docker；
课程项目：电商秒杀系统（Node.js + Redis + MySQL），负责后端接口与缓存设计，QPS 从 200 提升到 1200；
校园经历：技术社团部长，组织过 3 场编程 workshop。`;

const DEMO_JD = `后端开发工程师（校招）
职责：参与高并发后端服务的设计与开发。
要求：熟练掌握 Java/Go 至少一门语言；熟悉 MySQL 索引与事务、Redis 缓存设计；
了解分布式系统基本原理，有高并发场景经验；熟悉 Docker 与 Linux；
加分项：了解消息队列（Kafka/RocketMQ）。`;
