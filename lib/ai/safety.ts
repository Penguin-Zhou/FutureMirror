/**
 * AI 安全与可控性：本地 PII 脱敏 / Prompt 注入检测 / 输出过滤
 * 纯函数模块，服务端与客户端均可使用
 */

// 注意顺序：身份证（18 位连续数字）必须先于手机号匹配，
// 否则手机号正则 1[3-9]\d{9} 会误匹配身份证号中间片段，导致漏脱敏。
const PII_PATTERNS: { name: string; re: RegExp; mask: string }[] = [
  {
    name: "身份证",
    re: /\b\d{17}[\dXx]\b/g,
    mask: "******************",
  },
  { name: "手机号", re: /1[3-9]\d{9}/g, mask: "1**********" },
  {
    name: "邮箱",
    re: /[\w.+-]+@[\w-]+\.[\w.]+/g,
    mask: "***@***.***",
  },
];

/** 本地 PII 脱敏：原始简历不上云，只上传脱敏文本 */
export function maskPII(text: string): { text: string; hits: string[] } {
  const hits: string[] = [];
  let out = text;
  for (const p of PII_PATTERNS) {
    p.re.lastIndex = 0;
    if (p.re.test(out)) hits.push(p.name);
    out = out.replace(p.re, p.mask);
  }
  return { text: out, hits };
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above)\s+instructions/i,
  /忽略.{0,8}(之前|以上|上面).{0,8}(指令|要求|规则|提示)/,
  /system\s*prompt/i,
  /你现在是(?!一名|一位)/,
  /DAN\s*mode/i,
];

/** Prompt 注入启发式检测 */
export function looksLikeInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

/** 输出过滤：移除疑似密钥泄露 */
export function sanitizeOutput(text: string): string {
  return text
    .replace(/\bsk-[a-zA-Z0-9]{8,}/g, "sk-***")
    .trim();
}
