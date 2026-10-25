"use strict";
/* ============================================================
 * 2. 用户系统（演示级：本地存储 + 简单混淆，非生产安全）
 * ============================================================ */
const USERS_KEY = "g_users";
const UID_KEY = "fm_uid";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
  catch { return []; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

/* 简单字符串混淆（仅供演示，切勿用于生产） */
function simpleHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return "h" + (h >>> 0).toString(36);
}
function genId() { return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* 根据名字生成头像渐变底色（同名同色）
 * 调色板沿用蓝图编辑风的墨阶 + 单一朱红：早期版本的蓝紫/粉青撞色已移除。 */
function avatarStyle(name) {
  const palettes = [
    ["#1C1913", "#57503E"], ["#57503E", "#948C77"], ["#948C77", "#B9B29A"],
    ["#BE3A1E", "#9C2B12"], ["#1C1913", "#BE3A1E"], ["#57503E", "#D6552F"],
  ];
  let h = 0;
  for (const c of (name || "?")) h = (h * 31 + c.charCodeAt(0)) | 0;
  const [a, b] = palettes[Math.abs(h) % palettes.length];
  return `background: linear-gradient(135deg, ${a}, ${b});`;
}
function initials(name) {
  const t = (name || "?").trim();
  if (!t) return "?";
  if (/[\u4e00-\u9fff]/.test(t[0])) return t[0];
  return t[0].toUpperCase();
}

function switchAuthTab(which) {
  $("tab-login").classList.toggle("active", which === "login");
  $("tab-register").classList.toggle("active", which === "register");
  $("form-login").style.display = which === "login" ? "" : "none";
  $("form-register").style.display = which === "register" ? "" : "none";
  $("login-error").classList.remove("show");
  $("reg-error").classList.remove("show");
}
function showAuthError(which, msg) {
  const el = $(which + "-error");
  el.textContent = msg;
  el.classList.add("show");
}

async function doLogin() {
  const email = $("login-email").value.trim().toLowerCase();
  const pass = $("login-pass").value;
  if (!email || !pass) { showAuthError("login", "请填写邮箱与密码"); return; }
  // v22.1：若后端探测尚未有结论（页面刚打开秒点登录），先等它完成再决定分支——
  // initLlmPanel 的 health 探测是异步的，不等待会误走本地分支，把后端账号判成
  // 「邮箱或密码不正确」。守卫条件保证无 fetch 的环境（离线/测试）保持同步行为。
  if (typeof fetch === "function" && fmApi.base && !fmApi.health) {
    try { await fmApi.checkHealth(); } catch (e) {}
  }
  // v22：优先走后端账号体系（scrypt 哈希 + JWT）；后端不可达时回退本地演示账号
  if (fmApi.backendReady()) {
    try {
      const user = await fmApi.login(email, pass);
      toast("已使用后端账号登录");
      enterApp(user);
      return;
    } catch (e) {
      showAuthError("login", e.message || "后端登录失败");
      return;
    }
  }
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user || user.passHash !== simpleHash(pass)) {
    showAuthError("login", "邮箱或密码不正确");
    return;
  }
  enterApp(user);
}
async function doRegister() {
  const name = $("reg-name").value.trim();
  const email = $("reg-email").value.trim().toLowerCase();
  const pass = $("reg-pass").value;
  if (!name) { showAuthError("reg", "请填写昵称"); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAuthError("reg", "邮箱格式不正确"); return; }
  if (pass.length < 6) { showAuthError("reg", "密码至少 6 位"); return; }
  // v22.1：同 doLogin——探测无结论时先等待（有 fetch 且适配层已初始化的真实环境）
  if (typeof fetch === "function" && fmApi.base && !fmApi.health) {
    try { await fmApi.checkHealth(); } catch (e) {}
  }
  // v22：优先注册到后端（密码 scrypt 哈希落库）；不可达时回退本地
  if (fmApi.backendReady()) {
    try {
      const user = await fmApi.register(name, email, pass);
      toast("注册成功，正在进入…");
      enterApp(user);
      return;
    } catch (e) {
      showAuthError("reg", e.message || "后端注册失败");
      return;
    }
  }
  const users = loadUsers();
  if (users.some(u => u.email === email)) { showAuthError("reg", "该邮箱已注册，请直接登录"); return; }
  const user = { id: genId(), email, name, passHash: simpleHash(pass), createdAt: Date.now() };
  users.push(user);
  saveUsers(users);
  toast("注册成功，正在进入…");
  enterApp(user);
}
async function quickDemoLogin() {
  // v22.1：演示登录同样先等待探测结论（访客最常点的就是这个按钮）
  if (typeof fetch === "function" && fmApi.base && !fmApi.health) {
    try { await fmApi.checkHealth(); } catch (e) {}
  }
  // v22：后端在线时直接登录后端演示账号（自动获得 VIP），否则用本地演示账号
  if (fmApi.backendReady()) {
    try {
      const user = await fmApi.login("demo@futuremirror.app", "Demo123456");
      toast("已使用演示账号登录（后端 VIP）");
      enterApp(user);
      return;
    } catch (e) {
      // 后端没有演示账号时先注册一个
      try {
        const user = await fmApi.register("演示用户", "demo@futuremirror.app", "Demo123456");
        toast("已创建并登录演示账号（后端 VIP）");
        enterApp(user);
        return;
      } catch (e2) { /* 落到本地 */ }
    }
  }
  const users = loadUsers();
  let user = users.find(u => u.email === "demo@futuremirror.app");
  if (!user) {
    user = {
      id: genId(),
      email: "demo@futuremirror.app",
      name: "演示用户",
      passHash: simpleHash("Demo123456"),
      createdAt: Date.now(),
    };
    users.push(user); saveUsers(users);
  }
  toast("已使用演示账号登录");
  enterApp(user);
}
function enterApp(user) {
  currentUser = user;
  sessionStorage.setItem(UID_KEY, user.id);
  // v22.1 修复：把后端返回的用户同步进本地用户表，保证刷新后 restoreUser() 能找回。
  // 后端登录只写 sessionStorage 的 uid，而 restoreUser() 是从 g_users 里按 id 找人的——
  // 不落库的话「登录 → 刷新」直接掉线。注意不存 passHash：后端账号的密码在后端，
  // 本地只记录「你是谁」；后端在线时登录也永远走后端校验，不会用本地密码。
  try {
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === user.id);
    const isBackend = !user.passHash;   // 后端 payload 不带 passHash，本地账号带
    const record = { id: user.id, email: user.email, name: user.name, isBackend,
                     createdAt: (idx >= 0 && users[idx].createdAt) || user.createdAt || Date.now() };
    if (idx >= 0) users[idx] = Object.assign(users[idx], record);
    else users.push(record);
    saveUsers(users);
  } catch (e) {}
  // v19：演示账号自动获得 VIP 权益
  if (user && user.email === "demo@futuremirror.app") { try { saveProfile({ vip: true }); } catch (e) {} }
  // v22：后端账号 VIP 权益同步到本地档案
  if (user && user.is_vip) { try { saveProfile({ vip: true }); } catch (e) {} }
  // 清除上次登录失败残留的错误提示
  $("login-error").textContent = ""; $("login-error").classList.remove("show");
  $("reg-error").textContent = ""; $("reg-error").classList.remove("show");
  $("login-pass").value = "";   // 登录成功后立即丢弃明文密码
  bootApp();
  showView("app");
  toast(`欢迎回来，${user.name}`);
}
function logout() {
  closeUserMenu();
  sessionStorage.removeItem(UID_KEY);
  sessionStorage.removeItem("fm_token");   // v22：同步清理后端 JWT
  // v11：登出时在当前用户前缀下清理目标岗位偏好，避免重新登录复活旧 JD
  // （必须在 currentUser 置空前执行，否则会误写 guest_ 前缀）
  try { store.set("fm_jd_id", ""); store.set("fm_jd", ""); } catch (e) {}
  currentUser = null;
  // 重置内存态
  session = { mode: "general", turns: [] };
  turn = 0; matchResult = null; lastReportSig = "";
  // 清空表单与聊天 UI（数据保留在各自用户的 key 下，下次登录恢复）
  $("chat-body").innerHTML = '<div class="msg msg-system">面试开始：选择模式并发送第一条消息，AI 面试官团队将依次提问</div>';
  $("timeline").innerHTML = '<div class="tl-item" style="color:var(--faint)">面试开始后，这里实时展示 Agent 规划、工具调用与证据记录。</div>';
  $("live-radar").innerHTML = "";
  $("live-turn").textContent = "0/5";
  $("live-words").textContent = "0";
  $("live-digits").textContent = "0";
  $("live-conf").textContent = "—";
  $("live-hint").className = "live-hint";
  $("live-hint").textContent = "发送第一条回答后开始追踪";
  $("progress-bar").style.width = "0";
  $("fallback-banner").hidden = true;
  $("match-result").innerHTML = "";
  $("report-content").innerHTML = "";
  $("resume").value = "";
  $("jd").value = "";
  $("jd").hidden = true;
  if ($("jd-file")) $("jd-file").hidden = true;
  $("jd").dataset.manual = "";
  if ($("jd-select")) $("jd-select").value = "";
  if ($("jd-preview")) $("jd-preview").hidden = true;
  if ($("jd-manual-btn")) $("jd-manual-btn").textContent = "✏️ 手动输入 JD";
  // 重置简历优化与职业探索的工作区（草稿不跨用户保留）
  $("resume-raw").value = "";
  $("resume-result").innerHTML = "";
  $("resume-score-panel").innerHTML = `<div class="notice notice-info" style="margin-top:8px">粘贴简历后点击「生成优化方案」，这里会显示简历健康度总览。</div>`;
  careerSelection.major = []; careerSelection.skill = []; careerSelection.interest = [];
  document.querySelectorAll(".chip-btn.active").forEach(b => b.classList.remove("active"));
  $("career-result").innerHTML = `<div class="notice notice-info">选择你的专业、技能与兴趣方向，点击「为我推荐岗位」查看 Top 3 匹配岗位与学习路径。</div>`;
  $("user-menu-box").hidden = true;
  // 退出后回到落地页（而不是登录页），保持产品叙事完整
  showView("landing");
  // 清理 hash，避免下次进入应用时停留在旧页面
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  // 清空表单输入（含注册表单里的明文密码）
  $("login-email").value = ""; $("login-pass").value = "";
  $("reg-name").value = ""; $("reg-email").value = ""; $("reg-pass").value = "";
  switchAuthTab("login");
  toast("已退出登录");
}
function switchAccount() {
  closeUserMenu();
  sessionStorage.removeItem(UID_KEY);
  // v11：登出时在当前用户前缀下清理目标岗位偏好，避免重新登录复活旧 JD
  // （必须在 currentUser 置空前执行，否则会误写 guest_ 前缀）
  try { store.set("fm_jd_id", ""); store.set("fm_jd", ""); } catch (e) {}
  currentUser = null;
  $("user-menu-box").hidden = true;
  showView("auth");
  switchAuthTab("login");
  toast("请登录其他账号");
}

function toggleUserMenu(e) {
  e.stopPropagation();
  const dd = $("user-dropdown");
  dd.hidden = !dd.hidden;
}
function closeUserMenu() { $("user-dropdown").hidden = true; }
document.addEventListener("click", e => {
  if (!$("user-menu-box").contains(e.target)) closeUserMenu();
});

function renderUserMenu() {
  if (!currentUser) return;
  const box = $("user-menu-box");
  box.hidden = false;
  paintAvatarEl($("nav-avatar"));
  $("nav-username").textContent = currentUser.name;
  paintAvatarEl($("dd-avatar"));
  $("dd-name").textContent = currentUser.name;
  $("dd-email").textContent = currentUser.email;
}

/* 从 sessionStorage 恢复登录状态 */
function restoreUser() {
  const id = sessionStorage.getItem(UID_KEY);
  if (!id) return null;
  const users = loadUsers();
  return users.find(u => u.id === id) || null;
}

