/* v46 · 服务端语音转写断言
 *
 * 起因：线上稳定出现「连不上浏览器内置的语音识别服务」。
 * 真相是 Chrome / Edge 的 SpeechRecognition 走厂商云端，境内基本连不上——
 * 既不是网络断了，也不是浏览器不支持，而是这条路在境内根本走不通。
 *
 * 这一版把主链路换成服务端转写（录音 → 16k 单声道 WAV → 分段上传 → 模型转写），
 * 这里守住四件事：链路怎么选、音频怎么编、失败怎么分型、收尾会不会丢最后半句。
 */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

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
function done() {
  console.log("\n结果：" + pass + " 通过，" + fail + " 失败");
  process.exit(fail ? 1 : 0);
}

const demoHtml = rd("public/futuremirror-demo.html");
const asrSrc = rd("frontend/js/features/asr.js");
const interviewSrc = rd("frontend/js/features/interview.js");
const apiSrc = rd("frontend/js/core/api.js");
const mainPy = rd("backend/app/main.py");
const asrPy = rd("backend/app/asr.py");
const indexSrc = rd("frontend/index.html");

const dom = new JSDOM(demoHtml, {
  url: "https://example.com/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: new VirtualConsole(),
});
const w = dom.window;
const ev = (code) => w.eval(code);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* jsdom 的 Blob 是否支持 arrayBuffer 视实现而定，统一走一个读字节的helper */
function readBytes(blob) {
  return new Promise((resolve, reject) => {
    if (typeof blob.arrayBuffer === "function") {
      blob.arrayBuffer().then((b) => resolve(Buffer.from(b)), reject);
      return;
    }
    const fr = new w.FileReader();
    fr.onload = () => resolve(Buffer.from(fr.result));
    fr.onerror = reject;
    fr.readAsArrayBuffer(blob);
  });
}

function fakeAudioBuffer(seconds, rate, amp) {
  const n = Math.floor(seconds * rate);
  const data = new Float32Array(n);
  for (let i = 0; i < n; i++) data[i] = (amp === undefined ? 0.5 : amp) * Math.sin((2 * Math.PI * 300 * i) / rate);
  return { sampleRate: rate, numberOfChannels: 1, length: n, getChannelData: () => data };
}

(async function run() {
  /* ---------- ① 链路选择 ---------- */
  console.log("\n① 先选链路：能连后端就别让访客先撞一次墙");
  ok(typeof ev("asrServerReady") === "function", "存在服务端可用性判断");
  ok(typeof ev("asrEngine") === "function", "存在链路选择函数");
  {
    const off = ev("asrServerReady")();
    ok(off === false, "没有后端时判定为不可用");
    ev("fmApi.ready = true; fmApi.health = { ok: true, asr_ready: true };");
    ok(ev("asrServerReady")() === true, "后端 health 报告 asr_ready 后判定为可用");
    ok(ev("asrEngine")() === "服务端转写", "可用时链路显示「服务端转写」");
    ev("fmApi.health = { ok: true, asr_ready: false };");
    ok(ev("asrEngine")() !== "服务端转写", "后端没开转写时不冒充服务端链路");
    ev("window.SpeechRecognition = function () {};");
    ok(ev("asrEngine")() === "浏览器接口", "退回到浏览器接口");
    delete w.SpeechRecognition;
    ok(ev("asrEngine")() === "不可用", "两条链路都没有时如实说不可用");
    ev("fmApi.ready = true; fmApi.health = { ok: true, asr_ready: true };");
  }
  ok(
    interviewSrc.indexOf("asrServerReady()") < interviewSrc.indexOf("new SR()"),
    "开麦时先判断服务端链路，再考虑浏览器接口"
  );
  ok(/startServerVoice/.test(interviewSrc), "存在服务端链路的开麦实现");
  ok(!/浏览器内置 ASR|浏览器本地 ASR/.test(interviewSrc), "不再把识别说成「浏览器内置 / 本地」——它是厂商云端");
  ok(/境内/.test(interviewSrc), "文案点明境内网络差异，而不是让人反复换网");

  /* ---------- ② 音频编码 ---------- */
  console.log("\n② 录音必须编成上游一定认的格式");
  {
    const blob = ev("encodeWav16k")(fakeAudioBuffer(1, 48000, 0.5), 16000);
    const buf = await readBytes(blob);
    ok(buf.slice(0, 4).toString() === "RIFF", "文件头是 RIFF");
    ok(buf.slice(8, 12).toString() === "WAVE", "格式是 WAVE");
    ok(buf.slice(12, 16).toString() === "fmt ", "有 fmt 块");
    ok(buf.slice(36, 40).toString() === "data", "有 data 块");
    ok(buf.readUInt16LE(20) === 1, "编码为 PCM");
    ok(buf.readUInt16LE(22) === 1, "单声道");
    ok(buf.readUInt32LE(24) === 16000, "采样率降到 16k");
    ok(buf.readUInt16LE(34) === 16, "位深 16bit");
    const dataLen = buf.readUInt32LE(40);
    ok(dataLen === buf.length - 44, "data 块长度与文件实际长度一致");
    ok(Math.abs(dataLen / 2 - 16000) <= 2, "1 秒音频 → 约 16000 个采样点");
    ok(buf.readUInt32LE(4) === buf.length - 8, "RIFF 块长度自洽");
  }
  {
    /* 降采样不能直接抽点：48k→16k 必须先在区间内取均值，否则语音会带混叠噪声 */
    ok(/for \(let k = s; k < e; k\+\+\) sum \+= src\[k\]/.test(asrSrc), "降采样用区间均值，不是抽点");
    const clipped = ev("encodeWav16k")(fakeAudioBuffer(0.05, 16000, 2.5), 16000);
    const buf = await readBytes(clipped);
    let maxAbs = 0;
    for (let i = 44; i < buf.length; i += 2) maxAbs = Math.max(maxAbs, Math.abs(buf.readInt16LE(i)));
    ok(maxAbs <= 32767, "超出 ±1 的采样被夹住，不会溢出成爆音");
  }
  ok(/new Blob\(\[view\.buffer\], \{ type: "audio\/wav" \}\)/.test(asrSrc), "产出物声明为 audio/wav");

  /* ---------- ③ 上传与鉴权 ---------- */
  console.log("\n③ 上传走现有鉴权，不另开一条口子");
  {
    const seen = [];
    w.fetch = async (url, opt) => {
      seen.push({ url, opt });
      return { ok: true, status: 200, json: async () => ({ text: "我在校园二手平台负责后端", model: "glm-asr-2512" }) };
    };
    ev("fmApi.base = 'https://api.test'; fmApi.token = 'tk';");
    const blob = ev("encodeWav16k")(fakeAudioBuffer(0.2, 16000, 0.4), 16000);
    const text = await ev("postAsr")(blob);
    ok(text.startsWith("我在校园"), "返回转写文本");
    ok(seen[0].url === "https://api.test/api/asr", "提交到 /api/asr");
    ok(seen[0].opt.method === "POST", "用 POST 提交");
    ok(seen[0].opt.headers["X-Auth-Token"] === "tk", "带 X-Auth-Token（网关会覆盖 Authorization）");
    ok(seen[0].opt.headers["Content-Type"] === "audio/wav", "声明音频类型");
    ok(seen[0].opt.body === blob, "请求体就是音频本身，不做 multipart 包装");
  }
  {
    w.fetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
    const blob = ev("encodeWav16k")(fakeAudioBuffer(0.2, 16000, 0.4), 16000);
    let err = null;
    try {
      await ev("postAsr")(blob);
    } catch (e) {
      err = e;
    }
    ok(err && err.message === "asr_unauthorized", "401 单列成 asr_unauthorized");
    w.fetch = async () => ({ ok: false, status: 502, json: async () => ({}) });
    err = null;
    try {
      await ev("postAsr")(blob);
    } catch (e) {
      err = e;
    }
    ok(err && err.message === "asr_http_502", "上游失败映射成 asr_http_502");
  }

  /* ---------- ④ 失败分型 ---------- */
  console.log("\n④ 失败要说清坏在哪一层，并且都给得出下一步");
  {
    const hint = ev("asrErrHint");
    ok(typeof hint === "function", "存在失败分型函数");
    const codes = ["asr_unauthorized", "asr_decode_failed", "asr_http_413", "asr_http_502", "asr_http_503"];
    ok(
      codes.every((c) => hint({ message: c }).length > 8),
      "五类失败都有各自的说明，而不是同一句话"
    );
    ok(
      codes.every((c) => /键盘|重新登录/.test(hint({ message: c }))),
      "每条都给得出替代做法"
    );
    ok(/键盘输入/.test(hint({ message: "asr_unknown_thing" })), "未分类的失败也给出替代做法");
    ok(new Set(codes.map((c) => hint({ message: c }))).size === codes.length, "五类说明互不重复（分型不是为了好看）");
  }

  /* ---------- ⑤ 交互状态 ---------- */
  console.log("\n⑤ 开麦 / 收麦的状态不能停在假录音态");
  {
    ev(
      "listening = true; document.getElementById('mic-btn').textContent = '🔴'; document.getElementById('mic-btn').classList.add('btn-primary');"
    );
    ev("micReset()");
    ok(ev("listening") === false, "复位后 listening 归零");
    ok(ev("document.getElementById('mic-btn').textContent") === "🎤", "按钮回到麦克风图标");
    ok(!ev("document.getElementById('mic-btn').classList.contains('btn-primary')"), "按钮撤掉录音态样式");
    ok(/已转写/.test(ev("serverVoiceMeta")("一二三四五")), "状态条给出已转写字数");
    {
      let err = null;
      try {
        await ev("finishServerVoice")(false);
      } catch (e) {
        err = e;
      }
      ok(!err, "没有在录时收尾不抛错（重复点按不该炸）");
    }
  }

  /* ---------- ⑥ 分段不丢话 ---------- */
  console.log("\n⑥ 换段那一瞬的话不能漏掉");
  {
    const rot = asrSrc.slice(asrSrc.indexOf("function rotate()"));
    const body = rot.slice(0, rot.indexOf("function meter()"));
    ok(body.indexOf("startSeg()") < body.indexOf("old.stop()"), "先开新段再停旧段，中间不留空档");
    ok(/ASR_SEG_MS\s*=\s*5000/.test(asrSrc), "单段 5 秒，远低于上游 30 秒上限");
    ok(/audioCtx\.resume\(\)/.test(asrSrc), "尝试恢复 AudioContext，否则 analyser 只读到全零");
    ok(/state === "running"\) meter\(\)/.test(asrSrc), "恢复不了就不开静音检测，不假装它在工作");
    ok(/ASR_MIN_BYTES/.test(asrSrc), "过短的段不上传（省一次计费）");
    ok(/while \(pending > 0/.test(asrSrc), "收麦时等在飞的段落地，不丢最后半句");
    ok(/ASR_QUIET_MS/.test(asrSrc) && /onSilence/.test(asrSrc), "静音后先收一段，让文字尽早出现");
    ok(/echoCancellation: true/.test(asrSrc), "开启回声消除与降噪，避免把扬声器声音收进去");
  }

  /* ---------- ⑦ 后端契约 ---------- */
  console.log("\n⑦ 后端：零新增依赖，音频不落盘");
  ok(/@app\.post\("\/api\/asr"\)/.test(mainPy), "存在 /api/asr 接口");
  ok(/async def asr\(request: Request, user: User = Depends\(current_user\)\)/.test(mainPy), "转写要求登录");
  ok(/await request\.body\(\)/.test(mainPy), "直接读原始字节，不走 multipart");
  ok(!/python-multipart/.test(rd("backend/requirements.txt")), "requirements 没引入 python-multipart");
  ok(/asr_ready": asr_ready\(\)/.test(mainPy), "health 回报 asr_ready");
  ok(/status_code == 401\)/.test(asrPy) || /in \(401, 403\)/.test(asrPy), "上游鉴权失败单独归类");
  ok(/httpx\.Timeout/.test(asrPy), "上游超时单独归类");
  ok(/ASR_MAX_BYTES/.test(asrPy), "有单段体积上限");
  ok(!/open\([^)]*["']wb["']/.test(asrPy), "转写模块不写文件（音频不落盘）");
  ok(!/logger|logging/.test(asrPy), "不记录音频相关内容");
  ok(/asr_ready: !!j\.asr_ready/.test(apiSrc), "前端把 asr_ready 读进 health 缓存");
  ok(/转写链路/.test(indexSrc) || /两条链路/.test(indexSrc), "开发者模式说明改成两条链路");

  /* ---------- ⑧ 收尾 ---------- */
  console.log("\n⑧ 回归：旧链路还在，不能因为加了新路就把旧路删掉");
  ok(
    /const SR = window\.SpeechRecognition \|\| window\.webkitSpeechRecognition/.test(interviewSrc),
    "浏览器接口仍作为兜底"
  );
  ok(/VOICE_FATAL/.test(interviewSrc), "浏览器接口的不可恢复错误处理仍在");
  ok(asrSrc.length > 3000, "新模块未被截断");

  await sleep(10);
  done();
})();
