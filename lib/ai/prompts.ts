import fs from "node:fs";
import path from "node:path";

const cache = new Map<string, string>();

/**
 * 加载 prompts/ 下版本化管理的 Prompt 模板
 * 模板内变量使用 {{var_name}} 占位
 */
export function loadPrompt(name: string): string {
  const cached = cache.get(name);
  if (cached) return cached;
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "prompts", `${name}.md`),
      "utf-8",
    );
    cache.set(name, raw);
    return raw;
  } catch {
    return `（未找到 prompts/${name}.md，已降级为内置兜底指令）`;
  }
}

export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
