/* v44.1 · 语音输入链路断言
 *
 * 语音识别不是我们写的模型，是浏览器给的接口，所以它「坏」的方式很杂：
 * 没接口、协议不安全、权限被拒、没有麦克风、连不上云端识别、只是没开口。
 * 之前这些情况被压成同一句「语音识别出错：xxx」，把错误码原样甩给访客，
 * 而且「没说话」也会弹红字——看起来就是功能坏了。
 *
 * 这一版只说三件事：
 * ① 错误要分型：能说清该修哪一环的给建议，正常的静音与主动停止静默；
 * ② 转写不能冲掉访客已经打好的字；
 * ③ 浏览器自己结束识别时要自动续接，而不是让麦克风悄悄熄灭。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) {
    pass++;
    console.log("  ✅ " + name);
  } else {
    fail++;
    console.log("  ❌ " + name);
  }
}

const interviewSrc = rd("frontend/js/features/interview.js");
const demoHtml = rd("public/futuremirror-demo.html");
const cssSrc = rd("frontend/css/pages.css");

const dom = new JSDOM(demoHtml, {
  url: "https://example.com/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: new (require("jsdom").VirtualConsole)(),
});
const w = dom.window;
const ev = (code) => w.eval(code);

/* ---------- ① 错误分型 ---------- */
console.log("\n① 错误码要分型，不能原样甩给访客");
ok(ev("typeof voiceErrorHint") === "function", "存在错误码→中文提示的映射函数");
ok(ev("voiceErrorHint")("no-speech") === "", "「没开口」不是错误，不提示");
ok(ev("voiceErrorHint")("aborted") === "", "「主动停止」不是错误，不提示");
ok(/权限/.test(ev("voiceErrorHint")("not-allowed")), "not-allowed → 指向权限");
ok(/麦克风/.test(ev("voiceErrorHint")("audio-capture")), "audio-capture → 指向设备");
ok(/网络|连不上/.test(ev("voiceErrorHint")("network")), "network → 指向网络并给替代方案");
ok(!/^not-allowed$/.test(ev("voiceErrorHint")("not-allowed")), "不再把原始错误码直接当文案");
{
  const unknown = ev("voiceErrorHint")("some-new-code");
  ok(unknown.length > 0 && /键盘/.test(unknown), "未知错误码也给出可行动的兜底话术");
}
ok(!/toast\("语音识别出错/.test(interviewSrc), "旧的一刀切报错已移除");
ok(/no-speech/.test(interviewSrc) && /没听到声音/.test(interviewSrc), "静音走温和提示，不弹错误");

/* ---------- ② 自检面板 ---------- */
console.log("\n② 自检：把「卡在哪一环」摊开");
const chk = ev("voiceSelfCheck")();
ok(chk && typeof chk === "object", "voiceSelfCheck 返回对象");
["secure", "protocol", "engine", "micApi", "pref", "lastError"].forEach((k) => {
  ok(Object.prototype.hasOwnProperty.call(chk, k), `自检项包含 ${k}`);
});
ok(chk.engine === "不支持" || /SpeechRecognition/.test(chk.engine), "engine 给出具体接口名或缺省为「不支持」");
ok(chk.lastError === "本次会话未触发", "未出错时明确说明「未触发」，而不是留空");
ok(
  /Firefox|Chrome/.test(ev("voiceCheckAdvice")({ engine: "不支持", secure: true, pref: true, lastError: "x" })),
  "无接口时告诉访客换哪个浏览器"
);
ok(
  /https|安全上下文/.test(ev("voiceCheckAdvice")({ engine: "web", secure: false, pref: true, lastError: "x" })),
  "非安全上下文时指出协议问题"
);
ok(
  /偏好设置/.test(ev("voiceCheckAdvice")({ engine: "web", secure: true, pref: false, lastError: "x" })),
  "偏好关闭时指向设置项"
);
ok(
  /锁形图标/.test(ev("voiceCheckAdvice")({ engine: "web", secure: true, pref: true, lastError: "not-allowed" })),
  "权限被拒时给出具体操作路径"
);
ok(
  /云|网络/.test(ev("voiceCheckAdvice")({ engine: "web", secure: true, pref: true, lastError: "network" })),
  "network 时说明识别走云端"
);
ok(
  /前置条件就绪/.test(ev("voiceCheckAdvice")({ engine: "web", secure: true, pref: true, lastError: "本次会话未触发" })),
  "一切正常时也给出下一步"
);
ok(!!ev("document.getElementById('voice-check-out')"), "自检结果容器存在");
ok(!!ev("document.getElementById('eval-voice')"), "开发者模式里有语音自检区块");
ev("renderVoiceSelfCheck()");
{
  const html = ev("document.getElementById('voice-check-out').innerHTML");
  ok(/vc-row/.test(html), "自检结果按行渲染");
  ok(/最近错误码/.test(html), "渲染出最近错误码一行");
  ok(ev("document.getElementById('voice-check-state').textContent").length > 0, "状态徽标给出结论而非空串");
}
/* 徽标必须跟着真实错误走：权限被拒时还说「条件就绪」就是自相矛盾。
 * jsdom 没有语音引擎，先补出引擎与安全上下文，才能测到「有引擎但用不了」的分支。 */
ev("Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });");
ev("window.SpeechRecognition = function () {};");
ok(ev("voiceSelfCheck()").engine === "SpeechRecognition", "补出引擎后自检识别到标准接口");
ev("lastVoiceError = { code: 'not-allowed', at: Date.now() }; renderVoiceSelfCheck();");
ok(ev("document.getElementById('voice-check-state').textContent") === "权限被拒", "权限被拒 → 徽标显示「权限被拒」");
ev("lastVoiceError = { code: 'network', at: Date.now() }; renderVoiceSelfCheck();");
ok(ev("document.getElementById('voice-check-state').textContent") === "网络受限", "网络受限 → 徽标对应");
ev("lastVoiceError = { code: 'audio-capture', at: Date.now() }; renderVoiceSelfCheck();");
ok(ev("document.getElementById('voice-check-state').textContent") === "无可用设备", "无设备 → 徽标对应");
ev("lastVoiceError = null; renderVoiceSelfCheck();");
ok(ev("document.getElementById('voice-check-state').textContent").length > 0, "重置后徽标仍给出结论");

/* ---------- ③ 不吞已输入的文字 ---------- */
console.log("\n③ 转写不能冲掉已经打好的字");
ev("voiceBase = '我先打的两句'; voiceCommitted = '语音补充'; voiceInterim = ''; voiceSyncInput();");
ok(ev("document.getElementById('chat-input').value") === "我先打的两句 语音补充", "已输入内容保留，转写接在后面");
ev("voiceBase = ''; voiceCommitted = '只有语音'; voiceInterim = ''; voiceSyncInput();");
ok(ev("document.getElementById('chat-input').value") === "只有语音", "没有预置内容时不产生多余空格");
ev("voiceBase = '有原文'; voiceCommitted = ''; voiceInterim = ''; voiceSyncInput();");
ok(ev("document.getElementById('chat-input').value") === "有原文", "只说了一半也不清空原文");

/* ---------- ④ 自动续接与启动保护 ---------- */
console.log("\n④ 浏览器自己结束识别时不能装死");
ok(/voiceRestarts < 3/.test(interviewSrc), "自动续接有上限，不会无限重启");
ok(/voiceRestarts\+\+/.test(interviewSrc), "续接时累计次数");
ok(/自动续接/.test(interviewSrc), "续接状态对访客可见");
ok(/try \{\s*recognition\.start\(\);/.test(interviewSrc), "start 用 try 包裹");
ok(/InvalidStateError/.test(interviewSrc), "麦克风忙时给出可理解的提示");
{
  const fatal = ev("VOICE_FATAL");
  ok(Array.isArray(fatal) && fatal.indexOf("not-allowed") >= 0, "不可恢复错误有清单，权限被拒在内");
  ok(fatal.indexOf("no-speech") < 0, "「没开口」不在不可恢复清单里（它应该继续听）");
  ok(fatal.indexOf("network") >= 0, "网络不通也立刻停，不做无意义重试");
}
ok(/VOICE_FATAL\.indexOf\(e\.error\) >= 0\) listening = false/.test(interviewSrc), "遇到不可恢复错误立即停止续接");
ok(/listening = false;[\s\S]{0,120}mic-btn/.test(interviewSrc), "启动失败会回滚按钮状态，不留在假录音态");
ok(
  /走厂商云端/.test(interviewSrc) && !/浏览器内置 ASR|浏览器本地 ASR/.test(interviewSrc),
  "文案不再把识别说成浏览器内完成"
);
ok(
  /const heard = \(voiceCommitted \+ voiceInterim\)\.trim\(\)/.test(interviewSrc),
  "收尾按「本次真的转写出内容」判断，而不是输入框有没有字"
);
ok(!/if \(left\) \{\s*setVoiceLive\(left\.slice/.test(interviewSrc), "不再因为残留原文就提示「转写完成」");

/* ---------- ⑤ 视觉不破 ---------- */
console.log("\n⑤ 视觉规范");
ok(/\.voice-check \.vc-row/.test(cssSrc), "自检清单有独立样式");
{
  const seg = cssSrc.slice(cssSrc.indexOf(".voice-check {"));
  const box = seg.slice(0, seg.indexOf("/* ---------- ④"));
  ok(!/box-shadow/.test(box), "自检区块零投影");
  ok(!/border-radius/.test(box), "自检区块零圆角");
}

w.close();

console.log(`\n${fail === 0 ? "✅ 通过" : "❌ 失败"}：${pass} 项断言，${fail} 项失败`);
process.exit(fail === 0 ? 0 : 1);
