import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "面镜 FutureMirror · 多 Agent 模拟面试与能力成长平台",
  description:
    "上传简历与目标岗位 JD，由多 AI Agent 面试官团队完成模拟面试，生成可解释评分报告、能力雷达图与个性化学习路径。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
