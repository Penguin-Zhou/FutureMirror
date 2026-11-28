/* v85 · 封面银河：♾ 的粒子轨道（不升版，仍是 1.0.0）
 *
 * 路线 B：不用顶点缓冲，粒子位置在顶点着色器里由 gl_VertexID 推导——
 * 每个 id 哈希出稳定种子，沿 Gerono 双纽线行进，CPU 每帧只写 uniform。
 *
 * 断言分五组：
 * ① 结构：画布在首屏容器里、只做视觉（不接事件、不进阅读顺序）
 * ② 着色器：gl_VertexID / 双纽线 / 呼吸 / 斥力 / 脉冲 / 预乘输出
 * ③ 生命周期：进视口才跑、切后台停、reduced-motion 只画一帧
 * ④ 配色：跟强调色走，亮色点线、暗色叠加发光
 * ⑤ 降级：无 WebGL 退成 2D 点阵（且自己算尺寸，别停在 300×150）
 */
const fs = require("fs");
const path = require("path");

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

const indexHtml = rd("frontend/index.html");
const appfx = rd("frontend/js/features/appfx.js");
const css = rd("frontend/css/tech-layer.css").replace(/\/\*[\s\S]*?\*\//g, "");

function rule(cssText, selector) {
  const i = cssText.indexOf(selector + " {");
  if (i < 0) return "";
  const j = cssText.indexOf("}", i);
  return cssText.slice(i, j + 1);
}
function media(cssText, query) {
  let out = "";
  let i = cssText.indexOf(query);
  while (i >= 0) {
    const start = cssText.indexOf("{", i);
    let depth = 0;
    let end = -1;
    for (let k = start; k < cssText.length; k++) {
      if (cssText[k] === "{") depth++;
      else if (cssText[k] === "}") {
        depth--;
        if (depth === 0) {
          end = k;
          break;
        }
      }
    }
    if (end < 0) break;
    out += cssText.slice(start, end + 1) + "\n";
    i = cssText.indexOf(query, end);
  }
  return out;
}

/* ---------- ① 结构 ---------- */
const canvasAt = indexHtml.indexOf('class="lp-galaxy"');
ok(
  canvasAt > 0 && indexHtml.slice(canvasAt, canvasAt + 90).includes('aria-hidden="true"'),
  "画布是装饰层，不进阅读顺序"
);
ok(
  canvasAt > 0 && canvasAt > indexHtml.indexOf('class="lp-first"') && canvasAt < indexHtml.indexOf('class="bp-sheet"'),
  "画布在首屏容器里（正文之后、图幅之前，绝对定位不占位）"
);
const cvRule = rule(css, "#view-landing .lp-galaxy");
ok(/position:\s*absolute/.test(cvRule) && /inset:\s*0/.test(cvRule), "画布铺满首屏容器，不参与排版");
ok(/pointer-events:\s*none/.test(cvRule), "画布不接事件——交互挂在容器上，不挡按钮");
ok(/z-index:\s*0/.test(cvRule), "画布压在地平线网格之上、正文之下");
const textAt = css.indexOf("#view-landing .lp-first > .hero-title");
const textRule = textAt < 0 ? "" : css.slice(textAt, css.indexOf("}", textAt) + 1);
ok(/position:\s*relative/.test(textRule) && /z-index:\s*1/.test(textRule), "标题抬到画布之上");
ok(
  ["hero-sub", "hero-cta", "hero-kbd-hint"].every(
    (c) =>
      new RegExp("#view-landing \\.lp-first > \\." + c + ",\\n#view-landing \\.lp-first > ").test(css) ||
      /#view-landing \.lp-first > \.hero-sub,[\s\S]{0,200}hero-kbd-hint \{\s*position: relative;\s*z-index: 1;/.test(
        css
      )
  ),
  "副标题 / 按钮 / 快捷键提示同层抬升"
);
ok(
  /function initGalaxy\(\)/.test(appfx) && /try \{ initGalaxy\(\); \} catch/.test(appfx),
  "初始化在 boot 里，单点失败不影响其他交互"
);

/* ---------- ② 着色器 ---------- */
ok(/#version 300 es/.test(appfx), "用 WebGL 2 的 GLSL ES 3.00");
ok(/float id = float\(gl_VertexID\)/.test(appfx), "粒子序号来自 gl_VertexID");
ok(!/gl\.bufferData|gl\.vertexAttribPointer/.test(appfx), "没有顶点缓冲：位置全在着色器里推导");
ok(/float sp = 0\.74 \+ 0\.52 \* r\.x;/.test(appfx), "沿曲线行进有速度差（内快外慢的简化）");
ok(/vec2 core = vec2\(cos\(t\), 0\.62 \* sin\(2\.0 \* t\)\);/.test(appfx), "轨道基准是 Gerono 双纽线");
ok(/float w = pow\(r\.z, 1\.7\) \* 0\.095 \* uSpread;/.test(appfx), "管状厚度带衰减（中心密、边缘疏）");
ok(/float breath = 1\.0 \+ 0\.022 \* sin\(uTime \* 0\.55 - u \* 4\.0\);/.test(appfx), "呼吸：整体缩放 + 两瓣相位错开");
ok(/pos = mix\(sc, pos, uForm\);/.test(appfx), "成形：从球壳散落聚到轨道");
ok(/smoothstep\(0\.0, 0\.30, mdist\)/.test(appfx), "鼠标斥力有半径、有衰减");
ok(/float head = fract\(uPulse \* 0\.36\);/.test(appfx), "点击脉冲沿曲线跑一圈");
ok(/oColor = vec4\(c \* alpha, alpha\);/.test(appfx), "输出预乘 alpha，叠加处不发灰");
ok(/if \(r > 0\.25\) discard;/.test(appfx), "圆点裁掉方形边角");
ok(
  /gl\.drawArrays\(gl\.POINTS, 0, Math\.round\(galaxy\.count \* ink\.share\)\)/.test(appfx),
  "一个 draw call 画完，没有逐粒子提交"
);
ok(!/<script[^>]*three/i.test(indexHtml) && !/new THREE|THREE\.\w/.test(appfx), "没引 Three.js（一个 shader 就够）");

/* ---------- ③ 生命周期与性能 ---------- */
ok(/Math\.min\(window\.devicePixelRatio \|\| 1, 2\)/.test(appfx), "DPR 封顶 2，高分屏不白烧像素");
ok(
  /n = 32000;[\s\S]{0,160}n = 20000;[\s\S]{0,80}n = 12000;[\s\S]{0,80}n = 7000;/.test(appfx),
  "粒子数按视口分四档（32k / 20k / 12k / 7k）"
);
ok(/if \(cores <= 4\) n = Math\.round\(n \* 0\.55\);/.test(appfx), "低核心设备再砍一半");
ok(
  /if \(window\.innerWidth < 720\) \{[\s\S]{0,90}cv\.style\.display = "none";/.test(appfx),
  "手机不画银河（一屏塞满字和面板，挤进去只剩噪点）"
);
ok(/if \(halfW > 0\.84\) s \*= 0\.84 \/ halfW;/.test(appfx), "宽度兜底：竖屏也不会把两瓣切掉");
ok(
  /"IntersectionObserver" in window/.test(appfx) && /threshold: 0\.01/.test(appfx),
  "用 IntersectionObserver 判断是否在视口"
);
ok(/if \(dead \|\| document\.hidden \|\| !visible\) return;/.test(appfx), "离开视口 / 切后台立刻停帧");
ok(/document\.addEventListener\("visibilitychange", onVis\)/.test(appfx), "切回来能续上");
ok(/if \(!reduced\) raf = requestAnimationFrame\(frame\);/.test(appfx), "reduced-motion 下不排下一帧");
ok(/galaxy\.mode = reduced \? "still" : "live";/.test(appfx), "状态对外可读：still / live");
ok(/render\(performance\.now\(\) \+ 2000\);/.test(appfx), "降级时画一帧成形图（不是空白）");
ok(/cv\.setAttribute\("data-galaxy", reduced \? "still" : "webgl"\)/.test(appfx), "画布上标记渲染方式，便于排查");

/* ---------- ④ 配色 ---------- */
ok(/getPropertyValue\("--fm-hue"\)/.test(appfx), "色相读强调色变量，不写死青");
/* 暗色那行同理解析：核心要够亮（>55%）但不烧成纯白，且开叠加 */
const darkInk = (appfx.match(/\? \{ core: galaxyHsl\([^\n]*\}/) || [""])[0];
const darkL = [...darkInk.matchAll(/galaxyHsl\(hue, \d+, (\d+)\)/g)].map((m) => Number(m[1]));
ok(
  darkL.length === 2 && darkL[0] > 55 && darkL[0] <= 85 && darkL[1] < darkL[0] && /add: true/.test(darkInk),
  "暗色是发光点：够亮但不烧成纯白（叠加混合）"
);
/* 亮色那一行的两个明度都必须比纸深（<= 40%），且不开叠加；
 * 解析取值而不是钉死数字，微调颜色时不会误判 */
const lightInk = (appfx.match(/: \{ core: galaxyHsl\([^\n]*\}/) || [""])[0];
const lightL = [...lightInk.matchAll(/galaxyHsl\(hue, \d+, (\d+)\)/g)].map((m) => Number(m[1]));
ok(
  lightL.length === 2 && lightL.every((v) => v <= 40) && /add: false/.test(lightInk),
  "亮色是墨青点线（比纸深，不做发光）"
);
ok(/if \(ink\.add\) gl\.blendFunc\(gl\.ONE, gl\.ONE\);/.test(appfx), "暗色叠加混合，粒子互相提亮");
ok(/gl\.blendFunc\(gl\.ONE, gl\.ONE_MINUS_SRC_ALPHA\)/.test(appfx), "亮色正常合成，不会把纸提亮");
ok(/attributeFilter: \["data-theme", "data-accent"\]/.test(appfx), "换主题 / 换强调色时重算颜色");
ok(
  /vec2 qd = \(ndc - uQuiet\.xy\) \/ max\(uQuiet\.zw/.test(appfx) &&
    /smoothstep\(0\.70, 1\.16, length\(qd\)\)/.test(appfx),
  "文字区是一块椭圆静水，粒子从边缘渐变让开"
);
ok(
  /rg\.selectNodeContents\(el\)/.test(appfx) &&
    /quiet\.rx = \(\(right - left\) \/ 2 \/ cr2\.width\) \* 2 \* 1\.1;/.test(appfx),
  "静水区按每一行文字的实际外框算（Range 贴着字，不是整块宽）"
);

/* ---------- ⑤ 交互与降级 ---------- */
ok(/const host = cv\.parentElement;/.test(appfx), "事件挂在首屏容器上（画布本身 pointer-events: none）");
ok(/mouse\.target = 1;/.test(appfx) && /mouse\.target = 0;/.test(appfx), "移入起斥力、移出撤力");
ok(/closest\("button, a, input, textarea, select, kbd, \.fm3d-tag"\)/.test(appfx), "点按钮不算点银河");
ok(/if \(pu > 3\.4\) pulseAt = -1;|pu = pulseAt < 0 \? -1 : Math\.min\(3\.4/.test(appfx), "脉冲有寿命，跑完自己消失");
ok(/const c2 = cv\.getContext\("2d"\)|c2 = cv\.getContext\("2d"\)/.test(appfx), "无 WebGL 时退到 2D 点阵");
ok(/galaxy\.mode = "off";/.test(appfx) && /cv\.style\.display = "none";/.test(appfx), "连 2D 都没有就不画，不报错");
ok(
  /cv\.width = Math\.max\(1, Math\.round\(box\.width \* dpr\)\);/.test(appfx),
  "降级也要自己算画布尺寸（否则停在 300×150 被拉伸）"
);
ok(/galaxy\.mode = "still";/.test(appfx), "2D 静帧对外报 still");
ok(
  !/@media \(max-width: 720px\)[\s\S]{0,80}#view-landing \.lp-galaxy/.test(css),
  "窄屏不再靠微调画布位置打补丁（手机上直接不画）"
);
ok(
  /const gap = Math\.max\(160, vb\.top - cb\.bottom\);/.test(appfx) &&
    /out\.halfH = Math\.min\(gap \* 1\.5, r\.height \* 0\.55\) \/ 2;/.test(appfx),
  "银河按「CTA 与面板之间的空档」定位定尺，空档是实测的"
);
ok(
  /const pos = place\(r\);/.test(appfx) && /const pos = place\(box\);/.test(appfx),
  "WebGL 与 2D 静帧共用同一处摆位，降级时位置不跳"
);
ok(
  /justify-content: flex-start;/.test(media(css, "@media (min-width: 901px)")) &&
    /clamp\(132px, 24vh, 250px\) auto 10px/.test(css),
  "桌面首屏改从上往下排、面板按视口高度下移，一屏装不下就往下溢"
);
const lightCv = rule(css, ':root:not([data-theme="dark"]) #view-landing .lp-galaxy');
ok(/filter:\s*none/.test(lightCv), "亮色不靠模糊，模糊会把点线变成噪点");

console.log("\n" + (fail === 0 ? "✅ 全部通过" : "❌ 有失败项") + "：" + pass + " 项通过，" + fail + " 项失败");
process.exit(fail === 0 ? 0 : 1);
