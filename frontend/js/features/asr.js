"use strict";
/* ============================================================
 * v46 · 服务端语音转写（境内可用）
 *   浏览器自带的 SpeechRecognition 走厂商云端（Chrome→Google / Edge→微软），
 *   境内基本连不上，线上会稳定拿到 network 错误，等于语音功能失效。
 *   这里改成：麦克风录音 → 本地转 16k 单声道 WAV → 按段提交后端 → GLM-ASR 转写。
 *   音频只在请求里存在一次，不落盘、不参与任何统计。
 * ============================================================ */

const ASR_SEG_MS = 5000;        // 单段上限，远小于上游 30 秒限制
const ASR_QUIET_MS = 1500;      // 连续静音这么久就先收一段，让文字尽早出现
const ASR_RMS_FLOOR = 0.012;    // 静音判定：低于这个 RMS 视为没在说话
const ASR_MIN_BYTES = 2048;     // 太短的段（按一下就停）不上传，省一次计费

/** 后端是否具备转写能力（health 里带回 asr_ready） */
function asrServerReady() {
  try {
    if (!fmApi || !fmApi.backendReady || !fmApi.backendReady()) return false;
    return !!(fmApi.health && fmApi.health.asr_ready);
  } catch (e) {
    return false;
  }
}

/** 当前实际会走哪条链路，供自检面板与文案使用 */
function asrEngine() {
  if (asrServerReady()) return "服务端转写";
  if (window.SpeechRecognition || window.webkitSpeechRecognition) return "浏览器接口";
  return "不可用";
}

/* ---------- 音频编码：AudioBuffer → 16k 单声道 16bit WAV ---------- */
function encodeWav16k(buffer, targetRate) {
  const rate = targetRate || 16000;
  const src = buffer.getChannelData(0);
  const ratio = buffer.sampleRate / rate;
  const outLen = ratio > 1 ? Math.floor(src.length / ratio) : src.length;
  const bytes = 44 + outLen * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const str = (off, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);        // PCM 块大小
  view.setUint16(20, 1, true);         // PCM
  view.setUint16(22, 1, true);         // 单声道
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);  // 字节率
  view.setUint16(32, 2, true);         // 块对齐
  view.setUint16(34, 16, true);        // 位深
  str(36, "data");
  view.setUint32(40, outLen * 2, true);
  for (let i = 0; i < outLen; i++) {
    /* 降采样用区间均值，避免直接抽点带来的混叠噪声 */
    let v;
    if (ratio > 1) {
      const s = Math.floor(i * ratio);
      const e = Math.min(src.length, Math.floor((i + 1) * ratio));
      let sum = 0;
      for (let k = s; k < e; k++) sum += src[k];
      v = e > s ? sum / (e - s) : 0;
    } else {
      v = src[i] || 0;
    }
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true);
  }
  return new Blob([view.buffer], { type: "audio/wav" });
}

/** 把录音片段解码并转成 WAV；解码失败返回 null（交给上层提示） */
async function blobToWav16k(blob) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    return encodeWav16k(buf, 16000);
  } catch (e) {
    return null;
  } finally {
    try { ctx.close(); } catch (e) {}
  }
}

/** 上传一段 WAV，返回识别文本；失败抛错（上层据错误码降级） */
async function postAsr(wav) {
  const headers = { "Content-Type": "audio/wav" };
  if (fmApi && fmApi.token) {
    headers["X-Auth-Token"] = fmApi.token;
    headers["Authorization"] = "Bearer " + fmApi.token;
  }
  const res = await fetch(fmApi.base + "/api/asr", { method: "POST", headers, body: wav });
  if (res.status === 401) throw new Error("asr_unauthorized");
  if (!res.ok) throw new Error("asr_http_" + res.status);
  const j = await res.json();
  return (j && j.text) || "";
}

/* ---------- 录音控制 ----------
 * 段与段之间不留空档：先开新段，再停旧段、上传旧段，
 * 否则每 6 秒都会漏掉换段那一瞬的话。 */
function startServerAsr(h) {
  const on = h || {};
  let stream = null, rec = null;
  let stopped = false, rotTimer = null, meterTimer = null, audioCtx = null;
  let quietSince = 0, spoke = false, pending = 0;

  const fire = (fn, arg) => {
    try { if (typeof fn === "function") fn(arg); } catch (e) {}
  };

  async function flush(chunks, type) {
    if (!chunks || !chunks.length) return;
    const blob = new Blob(chunks, { type: type || "audio/webm" });
    if (blob.size < ASR_MIN_BYTES) return;
    pending++;
    try {
      const wav = await blobToWav16k(blob);
      if (!wav) { fire(on.onError, new Error("asr_decode_failed")); return; }
      const text = await postAsr(wav);
      if (text) fire(on.onText, text);
    } catch (e) {
      fire(on.onError, e);
    } finally {
      pending--;
    }
  }

  /* 每段的音频块必须挂在这一段自己的 MediaRecorder 上。
   * 早先写法把块推进一个共享变量，换段时变量被重新赋值，
   * 上一段的 ondataavailable 就会把数据塞进下一段 —— 结果是首段永远为空、
   * 后面几段长短错位。只有真机跑起来才看得见，光读代码看不出来。 */
  function startSeg() {
    const chunks = [];
    const r = new window.MediaRecorder(stream, pickMime());
    r.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    r._chunks = chunks;
    r.start();
    rec = r;
    return r;
  }

  function rotate() {
    const old = rec;
    startSeg();                    // 先开新段，接住换段这一瞬
    if (old && old.state !== "inactive") {
      old.onstop = () => flush(old._chunks, old.mimeType || "audio/webm");
      try { old.stop(); } catch (e) {}
    }
  }

  function meter() {
    if (!audioCtx || !stream) return;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    const src = audioCtx.createMediaStreamSource(stream);
    src.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    meterTimer = setInterval(() => {
      if (stopped) return;
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      if (rms >= ASR_RMS_FLOOR) {
        quietSince = 0;
        if (!spoke) { spoke = true; fire(on.onVoice); }
      } else if (spoke && !quietSince) {
        quietSince = Date.now();
      } else if (spoke && quietSince && Date.now() - quietSince > ASR_QUIET_MS) {
        quietSince = 0;
        fire(on.onSilence);
      }
    }, 200);
  }

  return (async () => {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      audioCtx = new AC();
      /* 没有用户手势时 AudioContext 会停在 suspended，此时 analyser 只读到全零，
       * 静音检测等于没开。这里先尝试恢复；恢复不了就不装 —— 录音照旧，
       * 只是「停顿自动收尾」这项退化，不能假装它在工作。 */
      try {
        if (audioCtx.state === "suspended") await audioCtx.resume();
      } catch (e) {}
      if (audioCtx.state === "running") meter();
    }
    startSeg();
    rotTimer = setInterval(() => { if (!stopped) rotate(); }, ASR_SEG_MS);
    return {
      /** 收尾：停录、把最后一段传完，resolve 后上层再提交，避免丢最后半句 */
      async stop() {
        if (stopped) return;
        stopped = true;
        if (rotTimer) { clearInterval(rotTimer); rotTimer = null; }
        if (meterTimer) { clearInterval(meterTimer); meterTimer = null; }
        const last = rec;
        if (last && last.state !== "inactive") {
          await new Promise(res => {
            last.onstop = res;
            try { last.stop(); } catch (e) { res(); }
          });
        }
        await flush(last && last._chunks, (last && last.mimeType) || "audio/webm");
        /* 还有在飞的段，等它落地，最多等 3 秒 */
        const t0 = Date.now();
        while (pending > 0 && Date.now() - t0 < 3000) {
          await new Promise(r => setTimeout(r, 80));
        }
        try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
        try { if (audioCtx) audioCtx.close(); } catch (e) {}
      },
    };
  })();
}

function pickMime() {
  try {
    if (window.MediaRecorder && window.MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
      return { mimeType: "audio/webm;codecs=opus" };
  } catch (e) {}
  return undefined;
}

/** 语音失败的分型提示：只描述坏在哪一层，不复述原始错误码 */
const ASR_ERR_HINT = {
  asr_unauthorized: "登录状态失效，请重新登录后再用语音输入（也可以直接键盘输入）",
  asr_decode_failed: "这段录音没能解码，可能是浏览器不支持该编码，请改用键盘输入",
  asr_http_413: "单段录音过长，已自动分段；若仍失败请改用键盘输入",
  asr_http_502: "转写服务暂时不可用，请稍后重试，或直接用键盘输入",
  asr_http_503: "服务端未开启转写能力，请改用键盘输入",
};

function asrErrHint(err) {
  const code = (err && (err.message || err.code)) || "";
  return ASR_ERR_HINT[code] || "语音转写中断，可改用键盘输入";
}
