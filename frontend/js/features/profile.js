"use strict";
/* ============================================================
 * v16 · 个人中心 / 头像系统 / 偏好设置 / 数据管理
 * ============================================================ */
const AVATAR_EMOJIS = ["🧑‍💻", "👩‍💻", "🧑‍🎓", "👨‍🎓", "🦊", "🐱", "🐼", "🦄", "🐯", "🌟", "🚀", "🎯", "💼", "📚", "🎨", "⚡", "🍀", "🔮"];
const PROFILE_SKILLS = ["JavaScript", "TypeScript", "Python", "Java", "Go", "React", "Vue", "Node.js", "SQL", "Redis", "Docker", "K8s", "LLM 应用", "Prompt 工程", "Figma", "数据分析", "产品设计", "项目管理"];
const PROFILE_DEFAULTS = {
  avatar: { type: "auto", value: "" },
  city: "", degree: "", years: "", status: "在职看机会", target: "", bio: "", skills: [],
  prefs: { voice: true, autoSpeak: false, weekly: false },
  vip: false,
};

/* HTML 转义（资料字段均为用户输入，渲染前必须转义） */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function getProfile() {
  let p = null;
  try { p = store.get("fm_profile", null); } catch (e) { p = null; }
  p = p || {};
  return Object.assign({}, PROFILE_DEFAULTS, p, {
    avatar: Object.assign({}, PROFILE_DEFAULTS.avatar, p.avatar || {}),
    prefs: Object.assign({}, PROFILE_DEFAULTS.prefs, p.prefs || {}),
    skills: Array.isArray(p.skills) ? p.skills.slice(0, 8) : [],
  });
}

function saveProfile(patch) {
  const p = getProfile();
  const next = Object.assign({}, p, patch || {}, {
    avatar: Object.assign({}, p.avatar, (patch && patch.avatar) || {}),
    prefs: Object.assign({}, p.prefs, (patch && patch.prefs) || {}),
    skills: Array.isArray((patch && patch.skills)) ? patch.skills.slice(0, 8) : p.skills,
  });
  try { store.set("fm_profile", next, true); } catch (e) {}
  try { if (typeof logDev === "function") logDev("info", "个人资料已保存"); } catch (e) {}
  return next;
}

/* ---------- 三态头像：上传图片 / 表情 / 姓名首字母（自动） ---------- */
function paintAvatarEl(el) {
  if (!el) return;
  const p = getProfile();
  const name = currentUser ? currentUser.name : "?";
  el.textContent = "";
  el.style.background = "";
  if (p.avatar.type === "image" && p.avatar.value) {
    el.innerHTML = `<img class="avatar-img" src="${esc(p.avatar.value)}" alt="头像">`;
  } else if (p.avatar.type === "emoji" && p.avatar.value) {
    el.innerHTML = `<span class="avatar-emoji">${esc(p.avatar.value)}</span>`;
    el.setAttribute("style", avatarStyle(name));
  } else {
    el.textContent = initials(name);
    el.setAttribute("style", avatarStyle(name));
  }
}

function refreshAllAvatars() {
  ["profile-avatar", "nav-avatar", "dd-avatar"].forEach(id => paintAvatarEl($(id)));
}

function renderAvatarPicker() {
  const box = $("avatar-picker");
  if (!box) return;
  const p = getProfile();
  const opts = [{ v: "", t: "首字母" }].concat(AVATAR_EMOJIS.map(e => ({ v: e, t: e })));
  box.innerHTML = opts.map(o => {
    const active = (o.v === "" && p.avatar.type === "auto") ||
      (o.v && p.avatar.type === "emoji" && p.avatar.value === o.v);
    return `<button type="button" class="avatar-option${active ? " active" : ""}${o.v ? "" : " none"}" ` +
      `title="${o.v ? "使用表情头像" : "使用姓名首字母（自动）"}" ` +
      `onclick="setAvatarEmoji('${o.v.replace(/'/g, "\\'")}')">${esc(o.t)}</button>`;
  }).join("");
}

function setAvatarEmoji(v) {
  saveProfile({ avatar: v ? { type: "emoji", value: v } : { type: "auto", value: "" } });
  renderAvatarPicker();
  refreshAllAvatars();
  toast(v ? "头像已更新" : "已恢复姓名首字母头像");
}

/* 本地上传：FileReader → canvas 中心裁剪压缩为 128px JPEG dataURL */
function uploadAvatar(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  if (!/^image\//.test(f.type)) { toast("请选择图片文件"); return; }
  if (f.size > 2 * 1024 * 1024) { toast("图片不能超过 2MB"); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = 128;
        const cv = document.createElement("canvas");
        cv.width = cv.height = size;
        const ctx = cv.getContext("2d");
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        saveProfile({ avatar: { type: "image", value: cv.toDataURL("image/jpeg", 0.82) } });
        renderAvatarPicker();
        refreshAllAvatars();
        toast("头像已上传并压缩为 128px");
        try { if (typeof logDev === "function") logDev("info", "头像已上传（128px 中心裁剪压缩）"); } catch (e) {}
      } catch (e) { toast("头像处理失败：" + e.message); }
    };
    img.onerror = () => toast("图片解析失败，请换一张");
    img.src = reader.result;
  };
  reader.onerror = () => toast("文件读取失败");
  reader.readAsDataURL(f);
  input.value = "";
}

/* ---------- 目标岗位下拉 / 技能标签 ---------- */
function renderProfileTargetOptions() {
  const sel = $("pf-target");
  if (!sel) return;
  if (typeof CAREER_DB === "undefined") { sel.innerHTML = `<option value="">暂不确定</option>`; return; }
  sel.innerHTML = `<option value="">暂不确定</option>` +
    CAREER_DB.map(c => `<option value="${esc(c.id)}">${esc(c.icon)} ${esc(c.name)}</option>`).join("");
}

function renderSkillPicker() {
  const box = $("pf-skills");
  if (!box) return;
  const p = getProfile();
  box.innerHTML = PROFILE_SKILLS.map(s =>
    `<button type="button" class="chip-btn${p.skills.includes(s) ? " active" : ""}" ` +
    `onclick="toggleSkill('${s.replace(/'/g, "\\'")}')">${esc(s)}</button>`).join("");
}

function toggleSkill(s) {
  const p = getProfile();
  const skills = p.skills.slice();
  const i = skills.indexOf(s);
  if (i >= 0) skills.splice(i, 1);
  else {
    if (skills.length >= 8) { toast("最多选择 8 个技能标签"); return; }
    skills.push(s);
  }
  saveProfile({ skills });
  renderSkillPicker();
  paintCompletion();
}

/* ---------- 完成度 ---------- */
function calcCompletion(p) {
  const checks = [
    [p.avatar.type !== "auto", 15],
    [!!(p.city || "").trim(), 10],
    [!!p.degree, 10],
    [!!p.years, 10],
    [!!p.target, 15],
    [(p.bio || "").trim().length >= 20, 20],
    [p.skills.length >= 3, 20],
  ];
  return Math.min(100, checks.reduce((s, c) => s + (c[0] ? c[1] : 0), 0));
}

/* 完成度条刷新（renderProfile / toggleSkill 共用） */
function paintCompletion() {
  const pct = calcCompletion(getProfile());
  const txt = $("profile-completion-text");
  const bar = $("profile-completion-bar");
  if (txt) txt.textContent = pct + "%";
  if (bar) bar.style.width = pct + "%";
}

/* ---------- 个人中心渲染 ---------- */
function renderProfile() {
  const gate = $("profile-gate");
  const body = $("profile-body");
  if (!gate || !body) return;
  if (!currentUser) {
    body.hidden = true;
    gate.innerHTML = `<div class="empty-state fade-up">
      <div class="ic">🔒</div>
      <p>登录后即可自定义头像、完善求职信息与管理个人数据。</p>
      <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="showView('auth')">登录 / 注册</button>
        <button class="btn btn-outline btn-sm" onclick="quickDemoLogin()">一键演示账号</button>
      </div>
    </div>`;
    return;
  }
  gate.innerHTML = "";
  body.hidden = false;

  const p = getProfile();
  renderProfileTargetOptions();
  renderAvatarPicker();
  renderSkillPicker();

  paintAvatarEl($("profile-avatar"));
  $("profile-name").textContent = currentUser.name;
  $("profile-email").textContent = currentUser.email;

  const tags = [];
  if (p.target && typeof CAREER_DB !== "undefined") {
    const c = CAREER_DB.find(x => x.id === p.target);
    if (c) tags.push("🎯 " + c.name);
  }
  if (p.city) tags.push("📍 " + p.city);
  if (p.degree) tags.push("🎓 " + p.degree);
  if (p.years) tags.push("⏳ " + p.years);
  if (p.status) tags.push("💼 " + p.status);
  $("profile-tags").innerHTML = tags.length
    ? tags.map(t => `<span class="badge">${esc(t)}</span>`).join("")
    : `<span class="badge badge-amber">资料待完善</span>`;

  paintCompletion();

  $("pf-name").value = currentUser.name;
  $("pf-email").value = currentUser.email;
  $("pf-city").value = p.city || "";
  $("pf-degree").value = p.degree || "";
  $("pf-years").value = p.years || "";
  $("pf-status").value = p.status || "在职看机会";
  $("pf-target").value = p.target || "";
  $("pf-bio").value = p.bio || "";

  renderPrefSwitches();
  const vipSlot = $("vip-card-slot");
  if (vipSlot) vipSlot.innerHTML = renderVipCard();
  refreshStorage();
}

function saveProfileForm() {
  if (!currentUser) return;
  const name = $("pf-name").value.trim();
  if (!name) { toast("请填写姓名 / 昵称"); return; }
  if (name !== currentUser.name) {
    try {
      const users = loadUsers();
      const u = users.find(x => x.id === currentUser.id);
      if (u) { u.name = name; saveUsers(users); currentUser.name = name; }
    } catch (e) {}
  }
  saveProfile({
    city: $("pf-city").value.trim(),
    degree: $("pf-degree").value,
    years: $("pf-years").value,
    status: $("pf-status").value,
    target: $("pf-target").value,
    bio: $("pf-bio").value.trim(),
  });
  renderUserMenu();
  renderProfile();
  toast("资料已保存");
}

/* ---------- 偏好开关 ---------- */
function renderPrefSwitches() {
  const p = getProfile();
  const set = (id, on) => { const el = $(id); if (el) el.setAttribute("aria-checked", String(!!on)); };
  set("sw-dark", document.documentElement.dataset.theme === "dark");
  set("sw-voice", p.prefs.voice);
  set("sw-auto", p.prefs.autoSpeak);
  set("sw-weekly", p.prefs.weekly);
}

function togglePref(key) {
  const p = getProfile();
  const prefs = Object.assign({}, p.prefs);
  prefs[key] = !prefs[key];
  saveProfile({ prefs });
  renderPrefSwitches();
  const label = { voice: "语音输入", autoSpeak: "自动朗读", weekly: "每周学习提醒" }[key] || "偏好";
  toast(`已${prefs[key] ? "开启" : "关闭"}「${label}」`);
}

function togglePrefDark() {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  renderPrefSwitches();
}

/* 面试官新提问生成后，按偏好自动 TTS 朗读 */
function v16MaybeAutoSpeak() {
  try {
    if (!getProfile().prefs.autoSpeak) return;
    if (!("speechSynthesis" in window)) return;
    setTimeout(() => { try { speakLast(); } catch (e) {} }, 350);
  } catch (e) {}
}

/* ---------- 数据管理 ---------- */
function refreshStorage() {
  const box = $("storage-text");
  const fill = $("storage-bar-fill");
  if (!box || !fill) return;
  let bytes = 0, count = 0;
  try {
    const prefix = currentUser ? currentUser.id + "_" : "guest_";
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(prefix) === 0) {
        bytes += k.length + (localStorage.getItem(k) || "").length;
        count++;
      }
    }
  } catch (e) {}
  const quota = 5 * 1024 * 1024;
  fill.style.width = Math.min(100, (bytes / quota) * 100).toFixed(2) + "%";
  box.textContent = `当前账号已用约 ${(bytes / 1024).toFixed(1)} KB（${count} 项记录）· 浏览器 localStorage 上限约 5MB`;
}

function exportUserData() {
  if (!currentUser) { toast("请先登录"); return; }
  try {
    const data = {
      app: "面镜 FutureMirror · 在线演示版",
      exportedAt: new Date().toISOString(),
      user: { id: currentUser.id, email: currentUser.email, name: currentUser.name },
      profile: getProfile(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `futuremirror-${currentUser.email}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("数据已导出为 JSON");
    try { if (typeof logDev === "function") logDev("info", "已导出个人数据 JSON"); } catch (e) {}
  } catch (e) { toast("导出失败：" + e.message); }
}

function clearUserData() {
  if (!currentUser) { toast("请先登录"); return; }
  if (typeof confirm !== "function") return;
  if (!confirm("确定清除当前账号的全部数据？包含个人资料、面试会话与报告历史，且不可恢复。")) return;
  const prefix = currentUser.id + "_";
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(prefix) === 0) keys.push(k);
    }
  } catch (e) {}
  keys.forEach(k => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) {} });
  try { if (typeof session !== "undefined" && session) { session.turns = []; if (typeof persistSession === "function") persistSession(); } } catch (e) {}
  renderUserMenu();
  renderProfile();
  try { renderReport(); } catch (e) {}
  toast(`已清除 ${keys.length} 项数据`);
  try { if (typeof logDev === "function") logDev("warn", `已清除当前账号 ${keys.length} 项数据`); } catch (e) {}
}

function resetOnboardingFlag() {
  try { localStorage.removeItem("g_onboarding_done"); } catch (e) {}
  const ob = $("onboarding");
  if (ob) ob.hidden = false;
  toast("已重置首访引导，回到工作台将重新显示");
}

/* ---------- 报告封面（头像 + 姓名 + 求职信息 + 编号） ---------- */
function renderReportCover() {
  const p = getProfile();
  const name = currentUser ? currentUser.name : "匿名用户";
  const uid6 = currentUser ? String(currentUser.id).slice(-6).toUpperCase() : "GUEST";
  const d = new Date();
  const stamp = `FM-${uid6}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const avatarInner = (p.avatar.type === "image" && p.avatar.value)
    ? `<img class="avatar-img" src="${esc(p.avatar.value)}" alt="头像">`
    : (p.avatar.type === "emoji" && p.avatar.value)
      ? `<span class="avatar-emoji">${esc(p.avatar.value)}</span>`
      : esc(initials(name));
  const avatarBg = (p.avatar.type === "image" && p.avatar.value) ? "" : ` style="${avatarStyle(name)}"`;
  const meta = [];
  if (p.target && typeof CAREER_DB !== "undefined") {
    const c = CAREER_DB.find(x => x.id === p.target);
    if (c) meta.push("目标岗位：" + c.name);
  }
  if (p.city) meta.push(p.city);
  if (p.degree) meta.push(p.degree);
  if (typeof isVip === "function" && isVip()) meta.push("👑 VIP 会员");
  meta.push(new Date().toLocaleDateString("zh-CN"));
  return `<div class="report-cover">
    <div class="rc-avatar"${avatarBg}>${avatarInner}</div>
    <div>
      <div class="rc-name">${esc(name)} 的评估报告</div>
      <div class="rc-meta">${meta.map(esc).join(" · ")}</div>
    </div>
    <div class="rc-stamp">编号 ${stamp}<br>面镜 FutureMirror · 可解释评分</div>
  </div>`;
}

