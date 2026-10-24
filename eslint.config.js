/**
 * ESLint 扁平配置（ESLint 10）
 *
 * 项目形态：原生 JS，无构建步骤。`frontend/js/**` 的 38 个模块由
 * `scripts/split-frontend.js` 反合并进单文件演示版，**共享同一全局作用域**
 * （函数/常量跨文件直接引用）。因此这里不能按 ES Module 的模块边界做
 * `no-undef` 判定，而是显式声明浏览器环境、Node 脚本环境，以及跨模块共用的
 * 全局符号（见下方 projectGlobals）。
 *
 * 运行：npm run lint    自动修复：npm run lint:fix
 */
const js = require("@eslint/js");

/* 跨模块共享的顶层符号由 scripts/gen-eslint-globals.js 从源码自动提取，
 * 保证白名单与真实声明同步；真正的拼写错误不在此表中，仍会被 no-undef 报出。 */
const projectGlobals = require("./frontend/eslint-globals.json");

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  location: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  console: "readonly",
  fetch: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  MutationObserver: "readonly",
  IntersectionObserver: "readonly",
  ResizeObserver: "readonly",
  CustomEvent: "readonly",
  Event: "readonly",
  Blob: "readonly",
  File: "readonly",
  FileReader: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  AbortController: "readonly",
  Headers: "readonly",
  Request: "readonly",
  Response: "readonly",
  WebSocket: "readonly",
  Worker: "readonly",
  Image: "readonly",
  Audio: "readonly",
  performance: "readonly",
  history: "readonly",
  getComputedStyle: "readonly",
  matchMedia: "readonly",
  alert: "readonly",
  confirm: "readonly",
  prompt: "readonly",
  TextEncoder: "readonly",
  TextDecoder: "readonly",
  btoa: "readonly",
  atob: "readonly",
  CSS: "readonly",
  DOMParser: "readonly",
  Node: "readonly",
  Element: "readonly",
  innerWidth: "readonly",
  innerHeight: "readonly",
  devicePixelRatio: "readonly",
  scrollX: "readonly",
  scrollY: "readonly",
  scrollTo: "readonly",
  addEventListener: "readonly",
  removeEventListener: "readonly",
  speechSynthesis: "readonly",
  SpeechSynthesisUtterance: "readonly",
  AbortSignal: "readonly",
  DOMRect: "readonly",
  HTMLElement: "readonly",
};

module.exports = [
  { ignores: ["node_modules/**", "public/**", "backend/static/**", "dist/**"] },

  js.configs.recommended,

  /* 浏览器端：38 个前端模块 */
  {
    files: ["frontend/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: Object.assign({}, browserGlobals, projectGlobals),
    },
    rules: {
      // 反合并后共享作用域：跨模块引用是合法的，拼写错误仍会被 no-undef 抓出
      "no-undef": "error",
      // 共享符号表里的名字由各模块自己声明，不视为「重复定义」
      "no-redeclare": ["error", { builtinGlobals: false }],
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      eqeqeq: ["error", "smart"],
      "no-var": "error",
      "prefer-const": "off",
      "no-prototype-builtins": "off",
      // 中文排版里全角空格（U+3000）是刻意用作分隔符，只放行模板字符串与注释内
      "no-irregular-whitespace": ["error", { skipTemplates: true, skipComments: true }],
    },
  },

  /* Node 脚本与测试 */
  {
    files: ["scripts/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        exports: "writable",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        TextDecoder: "readonly",
        TextEncoder: "readonly",
        structuredClone: "readonly",
        AbortSignal: "readonly",
        AbortController: "readonly",
        URLSearchParams: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      eqeqeq: ["error", "smart"],
    },
  },
];
