import type { Metadata } from "next";
import "./changelog.css";
import { changelogHtml } from "./content";

export const metadata: Metadata = {
  title: "版本更新日志 · 面镜 FutureMirror",
  description:
    "面镜 FutureMirror 自 v1 初始原型到 Beta 1.0.5 的 26 个已发布版本与 v23 规划；点击版本索引可锚点跳转。",
};

export default function ChangelogPage() {
  return (
    <div className="changelog-page">
      <div dangerouslySetInnerHTML={{ __html: changelogHtml }} />
    </div>
  );
}
