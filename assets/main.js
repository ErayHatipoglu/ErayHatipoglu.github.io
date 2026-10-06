(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n, l = 2) => String(n).padStart(l, '0');
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
const css = v => getComputedStyle(root).getPropertyValue(v).trim();
const upTR = s => s.toLocaleUpperCase('tr-TR');

$('#year').textContent = new Date().getFullYear();

/* ── toast ── */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── audio ── */
let actx = null;
const snd = { on: store.get('snd') !== '0' };
function ac() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function blip(f = 1700, d = .035, type = 'square', vol = .035) {
  if (!snd.on) return;
  try {
    const a = ac(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .6, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
  } catch {}
}
function note(f, dur = .55) {
  if (!snd.on) return;
  try {
    const a = ac(), t = a.currentTime, g = a.createGain();
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    g.connect(a.destination);
    [['triangle', 1, 1], ['sine', 2, .35], ['square', .5, .06]].forEach(([type, m, v]) => {
      const o = a.createOscillator(), og = a.createGain();
      o.type = type; o.frequency.value = f * m; og.gain.value = v;
      o.connect(og).connect(g); o.start(t); o.stop(t + dur + .05);
    });
  } catch {}
}
document.addEventListener('pointerdown', e => { if (e.target.closest('.key,.sw,.tog')) blip(); });

/* ── confetti ── */
const fx = $('#fx'), fctx = fx.getContext('2d');
let parts = [], fxOn = false;
function sizeFx() { const d = Math.min(devicePixelRatio || 1, 2); fx.width = innerWidth * d; fx.height = innerHeight * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
sizeFx(); addEventListener('resize', sizeFx);
function burst(x, y, n = 60, pow = 1) {
  if (reduced) return;
  const cols = [css('--acc'), css('--c2'), css('--c3'), css('--c4'), '#ffffff'];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = (2 + Math.random() * 8) * pow;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4, w: 5 + Math.random() * 7, h: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length], life: 1 });
  }
  if (!fxOn) { fxOn = true; requestAnimationFrame(fxLoop); }
}
function fxLoop() {
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 30);
  for (const p of parts) {
    p.vy += .25; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .008;
    fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.globalAlpha = clamp(p.life * 2, 0, 1);
    fctx.fillStyle = p.c; fctx.beginPath(); fctx.roundRect ? fctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 2) : fctx.rect(-p.w / 2, -p.h / 2, p.w, p.h); fctx.fill(); fctx.restore();
  }
  if (parts.length) requestAnimationFrame(fxLoop); else { fxOn = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
}
const centerOf = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

/* ── switches: sound + theme ── */
const soundSw = $('#soundSw'), themeSw = $('#themeSw');
const setSw = (el, v) => el.setAttribute('aria-checked', String(v));
setSw(soundSw, snd.on);
soundSw.addEventListener('click', () => { snd.on = !snd.on; setSw(soundSw, snd.on); store.set('snd', snd.on ? '1' : '0'); if (snd.on) blip(); toast(snd.on ? 'SES AÇIK' : 'SES KAPALI'); });

const themeHooks = [];
if (store.get('dark') === '1') root.classList.add('dark');
setSw(themeSw, root.classList.contains('dark'));
themeSw.addEventListener('click', e => {
  const apply = () => {
    const d = root.classList.toggle('dark');
    setSw(themeSw, d); store.set('dark', d ? '1' : '0');
    themeHooks.forEach(f => f());
  };
  if (!document.startViewTransition || reduced) return apply();
  const [cx, cy] = e.clientX ? [e.clientX, e.clientY] : centerOf(themeSw);
  const r = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
  document.startViewTransition(apply).ready.then(() => root.animate(
    { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${r}px at ${cx}px ${cy}px)`] },
    { duration: 700, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' }));
});

/* ── bar + drawer ── */
const bar = $('.bar'), drawer = $('#drawer'), menuK = $('#menuK');
let lastY = scrollY;
addEventListener('scroll', () => {
  const y = scrollY;
  bar.classList.toggle('hide', y > lastY && y > 200 && !drawer.classList.contains('open'));
  lastY = y;
}, { passive: true });
menuK.addEventListener('click', () => { const o = drawer.classList.toggle('open'); menuK.textContent = o ? 'Kapat' : 'Menü'; });
$$('a', drawer).forEach(a => a.addEventListener('click', () => { drawer.classList.remove('open'); menuK.textContent = 'Menü'; }));

/* ── reveal ── */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -30px 0px' });
$$('.rv').forEach(el => {
  const sib = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
  el.style.transitionDelay = (sib.indexOf(el) % 4) * 80 + 'ms';
  io.observe(el);
});

/* ── LCD: roles + clock ── */
const roles = ['ROBOTICS DEVELOPER', 'AI AUTOMATION ENGINEER', 'EMBEDDED SYSTEMS DEV', 'FULL STACK DEVELOPER', 'COMPUTER VISION DEV', 'CYBER SECURITY RESEARCHER'];
const lcdRole = $('#lcdRole');
let ri = 0;
function typeRole(text) {
  let i = 0;
  const step = () => { lcdRole.textContent = text.slice(0, i++); if (i <= text.length) setTimeout(step, 35); };
  step();
}
if (!reduced) setInterval(() => { ri = (ri + 1) % roles.length; typeRole(roles[ri]); }, 2800);
function tick() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  $('#lcdClock').textContent = `İST ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
tick(); setInterval(tick, 1000);

/* ── KNOBS ── */
const knobs = {};
function makeKnob(el, onChange) {
  const min = +el.dataset.min, max = +el.dataset.max;
  let val = +el.dataset.val;
  const saved = store.get('k-' + el.id);
  if (saved !== null && !isNaN(+saved)) val = clamp(+saved, min, max);
  const render = () => {
    const k = (val - min) / (max - min);
    el.style.setProperty('--rot', (-135 + k * 270) + 'deg');
    el.setAttribute('aria-valuenow', Math.round(val));
  };
  const set = (v, silent) => {
    const nv = clamp(v, min, max);
    if (Math.round(nv) !== Math.round(val) && !silent) blip(900 + (nv - min) / (max - min) * 1400, .015, 'square', .02);
    val = nv; render(); onChange(val); store.set('k-' + el.id, val);
  };
  let sy = 0, sv = 0, drag = false;
  el.addEventListener('pointerdown', e => { drag = true; sy = e.clientY; sv = val; el.setPointerCapture(e.pointerId); e.preventDefault(); });
  el.addEventListener('pointermove', e => { if (drag) set(sv + (sy - e.clientY) / 160 * (max - min)); });
  el.addEventListener('pointerup', () => drag = false);
  el.addEventListener('pointercancel', () => drag = false);
  el.addEventListener('wheel', e => { e.preventDefault(); set(val - Math.sign(e.deltaY) * (max - min) / 36); }, { passive: false });
  el.addEventListener('keydown', e => {
    const st = (max - min) / 36;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); set(val + st); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); set(val - st); }
  });
  render(); onChange(val);
  return { get: () => val, set };
}
knobs.hue = makeKnob($('#kHue'), v => { root.style.setProperty('--hue', Math.round(v)); themeHooks.forEach(f => f()); });

/* ── ROBOT ARM ── */
const arm = (() => {
  const stage = $('#armStage'), cv = $('#arm'), ctx = cv.getContext('2d'), modeEl = $('#armMode'), lcdInfo = $('#lcdInfo');
  let W, H, base, L1, L2, col = {};
  let a1 = -Math.PI / 2, a2 = .8, pointer = null, lastMove = -1e9, pressed = false, grip = 1;
  let trail = [], strokes = [], cur = null, visible = true, raf = null, t0 = performance.now();
  let speed = .14, penW = 4, script = null;

  const colors = () => { col = { ink: css('--ink'), acc: css('--acc'), c2: css('--c2'), c3: css('--c3'), panel: css('--panel'), mut: css('--mut'), sh: css('--sh') }; };
  const resize = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    base = { x: W * .5, y: H - 34 };
    const s = Math.min(W * .27, H * .44);
    L1 = s; L2 = s * .92;
    colors();
  };
  resize(); addEventListener('resize', resize); themeHooks.push(colors);

  const local = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('pointermove', e => { pointer = local(e); lastMove = performance.now(); });
  cv.addEventListener('pointerleave', () => { pointer = null; endStroke(); });
  cv.addEventListener('pointerdown', e => {
    script = null; pointer = local(e); lastMove = performance.now(); pressed = true;
    cv.setPointerCapture(e.pointerId);
    cur = { pts: [], c: col.c2, w: penW }; strokes.push(cur); if (strokes.length > 60) strokes.shift();
    blip(500, .05, 'sine', .05);
  });
  const endStroke = () => { if (pressed) blip(380, .05, 'sine', .04); pressed = false; cur = null; };
  cv.addEventListener('pointerup', endStroke);
  cv.addEventListener('pointercancel', endStroke);

  const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  function solve(tx, ty) {
    let dx = tx - base.x, dy = ty - base.y, d = Math.hypot(dx, dy);
    const maxR = L1 + L2 - 2, minR = Math.abs(L1 - L2) + 16;
    if (d > maxR) { dx *= maxR / d; dy *= maxR / d; d = maxR; }
    if (d < minR) { dx *= minR / (d || 1); dy *= minR / (d || 1); d = minR; }
    if (dy > -8) dy = -8;
    const c2 = clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1);
    const t2 = -Math.acos(c2);
    return [Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2)), t2];
  }
  function bar(x1, y1, x2, y2, w, fill) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.arc(x1, y1, w, a + Math.PI / 2, a - Math.PI / 2);
    ctx.arc(x2, y2, w, a - Math.PI / 2, a + Math.PI / 2);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = col.ink; ctx.stroke();
  }
  function bolt(x, y, r) {
    ctx.fillStyle = col.ink; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = col.panel; ctx.beginPath(); ctx.arc(x, y, r * .38, 0, 7); ctx.fill();
  }

  // heart drawing script
  function heart() {
    const cx = base.x, cy = base.y - (L1 + L2) * .62, s = (L1 + L2) * .016;
    const pts = [];
    for (let t = 0; t <= Math.PI * 2 + .01; t += .05) pts.push({ x: cx + 16 * Math.pow(Math.sin(t), 3) * s, y: cy - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s });
    return pts;
  }
  function startHeart() {
    const pts = heart();
    script = { pts, i: 0, phase: 'move', wait: 0 };
    blip(1200, .06, 'triangle', .05);
  }

  let tip = { x: 0, y: 0 }, j1 = { x: 0, y: 0 };
  function frame(t) {
    let target, mode;
    if (script) {
      const p = script.pts[Math.min(script.i, script.pts.length - 1)];
      target = p; mode = 'çiziyor';
      if (script.phase === 'move') {
        if (Math.hypot(tip.x - p.x, tip.y - p.y) < 3 && ++script.wait > 10) { script.phase = 'draw'; pressed = true; cur = { pts: [], c: col.acc, w: penW + 1 }; strokes.push(cur); }
      } else if (Math.hypot(tip.x - p.x, tip.y - p.y) < 2.5) {
        script.i += 1;
        if (script.i >= script.pts.length + 8) { pressed = false; cur = null; script = null; const r = cv.getBoundingClientRect(); burst(r.left + tip.x, r.top + tip.y, 50, .8); }
      }
    } else if (!pointer || t - lastMove > 2500) {
      const k = (t - t0) / 1000;
      target = { x: base.x + Math.sin(k * .8) * L1 * .9, y: base.y - L1 * 1.15 + Math.sin(k * 1.6) * L1 * .35 };
      mode = 'otomatik';
    } else { target = pointer; mode = pressed ? 'çiziyor' : 'manuel'; }
    if (modeEl.textContent !== mode) modeEl.textContent = mode;

    const [t1, t2] = solve(target.x, target.y);
    const e = reduced ? 1 : (script ? .45 : speed);
    a1 += angDiff(t1, a1) * e; a2 += angDiff(t2, a2) * e;
    grip += ((pressed ? .2 : 1) - grip) * .25;
    j1 = { x: base.x + Math.cos(a1) * L1, y: base.y + Math.sin(a1) * L1 };
    const a12 = a1 + a2;
    tip = { x: j1.x + Math.cos(a12) * L2, y: j1.y + Math.sin(a12) * L2 };

    if (pressed && cur) cur.pts.push({ x: tip.x, y: tip.y });
    trail.push({ x: tip.x, y: tip.y, t });
    while (trail.length && t - trail[0].t > 900) trail.shift();

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    for (const s of strokes) {
      if (s.pts.length < 2) continue;
      ctx.strokeStyle = s.c; ctx.lineWidth = s.w;
      ctx.beginPath(); ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x, s.pts[i].y);
      ctx.stroke();
    }
    ctx.strokeStyle = col.mut;
    for (let i = 1; i < trail.length; i++) {
      ctx.globalAlpha = (1 - (t - trail[i].t) / 900) * .5; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // base
    const bw = L1 * .9;
    ctx.fillStyle = col.ink;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(base.x - bw / 2, base.y + 8, bw, 22, 8) : ctx.rect(base.x - bw / 2, base.y + 8, bw, 22); ctx.fill();
    ctx.fillStyle = col.c3; ctx.strokeStyle = col.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(base.x - bw * .32, base.y + 9); ctx.lineTo(base.x - bw * .2, base.y - 18); ctx.lineTo(base.x + bw * .2, base.y - 18); ctx.lineTo(base.x + bw * .32, base.y + 9); ctx.closePath(); ctx.fill(); ctx.stroke();

    const w1 = Math.max(13, L1 * .11), w2 = w1 * .8;
    bar(j1.x, j1.y, tip.x, tip.y, w2, col.c2);
    bar(base.x, base.y, j1.x, j1.y, w1, col.acc);
    bolt(base.x, base.y, w1 * .75);
    bolt(j1.x, j1.y, w1 * .65);

    // gripper
    const gc = Math.cos(a12), gs = Math.sin(a12), nx = -gs, ny = gc;
    const gw = w2 * (.35 + grip * .9), gl = w2 * 2.1;
    ctx.strokeStyle = col.ink; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(tip.x + nx * w2 * 1.5, tip.y + ny * w2 * 1.5); ctx.lineTo(tip.x - nx * w2 * 1.5, tip.y - ny * w2 * 1.5); ctx.stroke();
    ctx.lineWidth = 4;
    for (const sg of [1, -1]) {
      const sx = tip.x + nx * gw * sg, sy = tip.y + ny * gw * sg;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + gc * gl, sy + gs * gl); ctx.stroke();
    }
    ctx.fillStyle = pressed ? col.c2 : col.ink; ctx.beginPath(); ctx.arc(tip.x, tip.y, 4, 0, 7); ctx.fill();

    const d1 = -Math.atan2(Math.sin(a1), Math.cos(a1)) * 180 / Math.PI, d2 = -Math.atan2(Math.sin(a2), Math.cos(a2)) * 180 / Math.PI;
    lcdInfo.textContent = `θ1 ${d1.toFixed(1).padStart(6, '0')}° θ2 ${(d2 < 0 ? '-' : '+') + Math.abs(d2).toFixed(1).padStart(5, '0')}°`;
    raf = visible ? requestAnimationFrame(frame) : null;
  }
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(stage);
  raf = requestAnimationFrame(frame);

  return {
    clear() { strokes = []; script = null; pressed = false; cur = null; },
    heart: startHeart,
    setSpeed(v) { speed = v / 100; },
    setPen(v) { penW = v; }
  };
})();
knobs.speed = makeKnob($('#kSpeed'), v => arm.setSpeed(v));
knobs.pen = makeKnob($('#kPen'), v => arm.setPen(v));
$('#armClear').addEventListener('click', () => { arm.clear(); toast('KÂĞIT TEMİZLENDİ'); });
$('#armDance').addEventListener('click', () => arm.heart());

/* ── coffee counter ── */
let coffee = 42 + (+store.get('coffee') || 0);
const cN = $('#coffeeN');
cN.textContent = pad(coffee, 3);
const coffeeMsg = ['TEŞEKKÜRLER!', 'ENERJİ +%10', 'BİR BUG DAHA ÖLDÜ', 'KOD HIZI ARTTI', 'EFSANESİN'];
$('#coffeeK').addEventListener('click', e => {
  coffee++; cN.textContent = pad(coffee, 3); store.set('coffee', coffee - 42);
  note(523.25 * Math.pow(2, (coffee % 5) * 2 / 12), .3);
  const [x, y] = centerOf(e.currentTarget); burst(x, y, 30, .7);
  toast(coffeeMsg[coffee % coffeeMsg.length]);
});

/* ── SKILL SYNTH ── */
const SKILLS = [
  ['Python', 'Programlama', 'İleri'], ['C / C++', 'Programlama', 'İleri'], ['C#', 'Programlama', 'İleri'], ['Dart', 'Programlama', 'İleri'], ['Java', 'Programlama', 'İleri'], ['HTML5 / CSS3', 'Programlama', 'İleri'],
  ['OpenCV', 'Framework & AI', 'Görüntü işleme'], ['Flutter', 'Framework & AI', 'Mobil'], ['ASP.NET / MVC', 'Framework & AI', 'Web'], ['.NET Framework', 'Framework & AI', 'Masaüstü'], ['AI Automation', 'Framework & AI', 'Yapay zeka'], ['Local AI Inference', 'Framework & AI', 'Yapay zeka'],
  ['Raspberry Pi', 'Robotik & Gömülü', 'Donanım'], ['Arduino', 'Robotik & Gömülü', 'Donanım'], ['Motor Drivers', 'Robotik & Gömülü', 'Kontrol'], ['Sensor Integration', 'Robotik & Gömülü', 'Kontrol'], ['Embedded Linux', 'Robotik & Gömülü', 'Sistem'], ['Real-Time Control', 'Robotik & Gömülü', 'Sistem'],
  ['OSINT Tools', 'Güvenlik & Diğer', 'Güvenlik'], ['Reverse Engineering', 'Güvenlik & Diğer', 'Güvenlik'], ['Web Automation', 'Güvenlik & Diğer', 'Otomasyon'], ['Linux Ecosystem', 'Güvenlik & Diğer', 'Sistem'], ['REST API', 'Güvenlik & Diğer', 'Web'], ['Unity', 'Güvenlik & Diğer', 'Oyun / 3B']
];
const KEYS = '123456qwertyasdfghzxcvbn';
const PENTA = [0, 2, 4, 7, 9];
const freqOf = i => 196 * Math.pow(2, (PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12);
const padsEl = $('#pads'), synLcd = $('#synLcd'), synSub = $('#synSub');
const pads = SKILLS.map(([name, cat, lvl], i) => {
  const b = document.createElement('button');
  b.className = 'pad'; b.type = 'button';
  b.style.setProperty('--pc', `var(--c${Math.floor(i / 6) + 1})`);
  b.innerHTML = `<b>${name}</b><kbd>${KEYS[i].toUpperCase()}</kbd>`;
  b.setAttribute('aria-label', `${name} — ${cat}`);
  padsEl.appendChild(b);
  return b;
});
function hit(i, fromDemo) {
  const b = pads[i], [name, cat, lvl] = SKILLS[i];
  note(freqOf(i));
  b.classList.add('down'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('down'), 160);
  synLcd.textContent = name.toUpperCase();
  synSub.textContent = upTR(`${cat} · ${lvl}`);
  if (!fromDemo && Math.random() < .12) { const [x, y] = centerOf(b); burst(x, y, 18, .5); }
}
pads.forEach((b, i) => b.addEventListener('pointerdown', e => { e.preventDefault(); hit(i); }));
pads.forEach((b, i) => b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(i); } }));
let synthVisible = false;
new IntersectionObserver(([e]) => synthVisible = e.isIntersecting, { threshold: .3 }).observe($('.synth'));
addEventListener('keydown', e => {
  if (!synthVisible || e.repeat || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const i = KEYS.indexOf(e.key.toLowerCase());
  if (i >= 0) { e.preventDefault(); hit(i); }
});
let demoT = [];
$('#synDemo').addEventListener('click', () => {
  demoT.forEach(clearTimeout); demoT = [];
  const seq = [0, 2, 4, 7, 6, 4, 2, 4, 9, 7, 6, 4, 12, 11, 9, 7, 6, 4, 2, 0, 5, 7, 9, 12, 14, 12, 9, 7, 16, 14, 12, 9];
  seq.forEach((n, k) => demoT.push(setTimeout(() => hit(n, true), k * 150)));
  demoT.push(setTimeout(() => { synLcd.textContent = '♪ TEŞEKKÜRLER ♪'; synSub.textContent = 'ŞİMDİ SEN ÇAL'; }, seq.length * 150 + 200));
});

/* ── cartridges: flip + tilt ── */
$$('.cart').forEach(c => {
  const flip = () => { c.classList.toggle('flip'); blip(c.classList.contains('flip') ? 1300 : 900, .05, 'triangle', .05); c.style.transform = ''; };
  c.addEventListener('click', flip);
  c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  if (reduced || !matchMedia('(hover:hover)').matches) return;
  c.addEventListener('pointermove', e => {
    if (c.classList.contains('flip')) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
  });
  c.addEventListener('pointerleave', () => c.style.transform = '');
});

/* ── interest switches ── */
const togs = $$('.tog'), swCount = $('#swCount');
let allOnce = false;
togs.forEach((t, i) => t.addEventListener('click', () => {
  const on = t.getAttribute('aria-pressed') !== 'true';
  t.setAttribute('aria-pressed', String(on));
  if (on) note(freqOf(i + 5), .35);
  const n = togs.filter(x => x.getAttribute('aria-pressed') === 'true').length;
  swCount.textContent = `${pad(n)}/10`;
  if (n === togs.length && !allOnce) {
    allOnce = true;
    [0, 4, 7, 9, 12].forEach((s, k) => setTimeout(() => note(freqOf(s + 5), .5), k * 90));
    const [x, y] = centerOf($('#swBank'));
    burst(x, y, 140, 1.4);
    toast('TÜM SİSTEMLER AKTİF ✓');
  }
  if (n < togs.length) allOnce = false;
}));

/* ── copy ── */
$$('.copy').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); toast('E-POSTA KOPYALANDI'); }
  catch { location.href = 'mailto:' + b.dataset.copy; }
}));

/* ── form → WhatsApp ── */
const sendLcd = $('#sendLcd'), formLed = $('#formLed');
$('#waForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#waName').value.trim(), email = $('#waEmail').value.trim(), msg = $('#waMsg').value.trim();
  if (!name && !msg) {
    ['#waName', '#waMsg'].forEach(s => { const f = $(s).closest('.fld'); f.classList.remove('err'); void f.offsetWidth; f.classList.add('err'); });
    sendLcd.textContent = 'HATA: AD/MESAJ YOK';
    blip(220, .15, 'square', .05);
    return;
  }
  let text = '';
  if (name) text += '*Ad:* ' + name + '\n';
  if (email) text += '*E-posta:* ' + email + '\n';
  if (text) text += '\n';
  if (msg) text += '*Mesaj:* ' + msg;
  const url = 'https://wa.me/905550612409?text=' + encodeURIComponent(text.trim());
  formLed.className = 'led led-g blink';
  let k = 0;
  const prog = setInterval(() => {
    k++; sendLcd.textContent = 'GÖNDERİLİYOR ' + '▮'.repeat(k) + '▯'.repeat(Math.max(0, 5 - k));
    blip(800 + k * 200, .03);
    if (k >= 5) {
      clearInterval(prog);
      sendLcd.textContent = 'TAMAM ✓ WHATSAPP';
      formLed.className = 'led led-g';
      const [x, y] = centerOf(e.submitter || $('.key-big')); burst(x, y, 60);
      window.open(url, '_blank');
      setTimeout(() => { sendLcd.textContent = 'HAZIR'; formLed.className = 'led led-o'; }, 3500);
    }
  }, reduced ? 1 : 110);
});
$$('.fld input,.fld textarea').forEach(i => i.addEventListener('input', () => { i.closest('.fld').classList.remove('err'); if (sendLcd.textContent.startsWith('HATA')) sendLcd.textContent = 'HAZIR'; }));

})();
