(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};

/* ───────── TOAST ───────── */
const toastEl = $('#toast');
let toastT;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

/* ───────── FX CANVAS: confetti + matrix ───────── */
const fx = $('#fx'), fctx = fx.getContext('2d');
let confetti = [], matrixUntil = 0, matrixCols = [], fxRunning = false;
function sizeFx() {
  const d = Math.min(devicePixelRatio || 1, 2);
  fx.width = innerWidth * d; fx.height = innerHeight * d;
  fctx.setTransform(d, 0, 0, d, 0, 0);
}
sizeFx(); addEventListener('resize', sizeFx);
const CONF_COLORS = ['#c4ff4d', '#7c6cff', '#22d3ee', '#ff4f8b', '#ff9a3d', '#ffffff'];
function burst(x, y, n = 80, spread = 1) {
  if (reduced) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = (2 + Math.random() * 9) * spread;
    confetti.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4, r: 4 + Math.random() * 6,
      rot: Math.random() * 6, vr: (Math.random() - .5) * .4, c: CONF_COLORS[i % CONF_COLORS.length],
      life: 1, shape: Math.random() < .5 });
  }
  runFx();
}
function rain() {
  burst(innerWidth * .2, innerHeight * .35, 70, 1.2);
  burst(innerWidth * .8, innerHeight * .35, 70, 1.2);
  burst(innerWidth * .5, innerHeight * .25, 90, 1.4);
}
function startMatrix(sec = 7) {
  if (reduced) return;
  matrixUntil = performance.now() + sec * 1000;
  const cols = Math.ceil(innerWidth / 16);
  matrixCols = Array.from({ length: cols }, () => Math.random() * -50);
  document.body.classList.add('matrix');
  runFx();
}
const MCHARS = 'アイウエオカキクケコサシスセソ01ERAY<>/{}#$%ğüşıöç';
function runFx() {
  if (fxRunning) return;
  fxRunning = true;
  const loop = (t) => {
    const matrixOn = t < matrixUntil;
    if (matrixOn) {
      fctx.fillStyle = 'rgba(7,7,11,.12)';
      fctx.fillRect(0, 0, innerWidth, innerHeight);
      fctx.font = '15px JetBrains Mono, monospace';
      matrixCols.forEach((y, i) => {
        const ch = MCHARS[(Math.random() * MCHARS.length) | 0];
        fctx.fillStyle = Math.random() < .05 ? '#ffffff' : '#c4ff4d';
        fctx.fillText(ch, i * 16, y * 16);
        matrixCols[i] = y * 16 > innerHeight && Math.random() > .975 ? 0 : y + 1;
      });
    } else {
      fctx.clearRect(0, 0, innerWidth, innerHeight);
      if (document.body.classList.contains('matrix')) document.body.classList.remove('matrix');
    }
    confetti = confetti.filter(p => p.life > 0 && p.y < innerHeight + 40);
    for (const p of confetti) {
      p.vy += .22; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .006;
      fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
      fctx.globalAlpha = clamp(p.life * 1.5, 0, 1); fctx.fillStyle = p.c;
      if (p.shape) fctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      else { fctx.beginPath(); fctx.arc(0, 0, p.r / 2.4, 0, 7); fctx.fill(); }
      fctx.restore();
    }
    if (confetti.length || matrixOn) requestAnimationFrame(loop);
    else { fctx.clearRect(0, 0, innerWidth, innerHeight); fxRunning = false; }
  };
  requestAnimationFrame(loop);
}

/* ───────── BOOT ───────── */
const boot = $('#boot');
const bootSeen = (() => { try { return sessionStorage.getItem('booted'); } catch { return null; } })();
function finishBoot() {
  boot.classList.add('done');
  document.body.classList.remove('booting');
  setTimeout(() => boot.remove(), 1000);
  startHero();
  try { sessionStorage.setItem('booted', '1'); } catch {}
}
function initBoot() {
if (reduced || bootSeen) { boot.remove(); startHero(); }
else {
  document.body.classList.add('booting');
  const lines = ['> ERAY.OS v2.0 başlatılıyor...', '> çekirdek modüller yükleniyor <span class="ok">[OK]</span>',
    '> yapay zeka sinapsları bağlanıyor <span class="ok">[OK]</span>', '> kahve seviyesi: %100 <span class="ok">[OK]</span>',
    '> yaratıcılık motoru hazır <span class="ok">[OK]</span>'];
  const bl = $('#bootLines'), bar = $('#bootBar'), pct = $('#bootPct');
  let p = 0, li = 0;
  const step = () => {
    p = Math.min(100, p + 3 + Math.random() * 7);
    bar.style.width = p + '%'; pct.textContent = Math.floor(p) + '%';
    if (p / 20 > li && li < lines.length) { bl.innerHTML += lines[li++] + '<br>'; }
    if (p < 100) setTimeout(step, 45);
    else { while (li < lines.length) bl.innerHTML += lines[li++] + '<br>'; setTimeout(finishBoot, 260); }
  };
  step();
  boot.addEventListener('click', finishBoot, { once: true });
}
}

/* ───────── HERO NAME ───────── */
const heroName = $('#heroName');
heroName.innerHTML = heroName.textContent.split(' ').map(w =>
  `<span class="w">${[...w].map(c => `<span class="ch">${c}</span>`).join('')}</span>`).join(' ');
$$('.ch', heroName).forEach((c, i) => {
  c.style.transitionDelay = (i * 0.045) + 's';
  c.addEventListener('mouseenter', () => {
    c.style.transitionDelay = '0s';
    c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  });
});
let heroStarted = false;
function startHero() {
  if (heroStarted) return; heroStarted = true;
  requestAnimationFrame(() => heroName.classList.add('in'));
  $$('#hero .reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), 200 + i * 110));
  setTimeout(scrambleLoop, 1400);
  setTimeout(typeCode, 900);
}

/* ───────── SCRAMBLE ROLES ───────── */
const roles = ['Robotics Developer', 'AI Automation Engineer', 'Embedded Systems Developer', 'Full Stack Developer', 'Computer Vision Developer', 'Cyber Security Researcher'];
const scrEl = $('#scramble');
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01';
let roleI = 0;
function scrambleTo(text) {
  return new Promise(res => {
    const from = scrEl.textContent, len = Math.max(from.length, text.length);
    const q = [];
    for (let i = 0; i < len; i++) {
      const s = Math.floor(Math.random() * 18), e = s + Math.floor(Math.random() * 18);
      q.push({ from: from[i] || '', to: text[i] || '', s, e });
    }
    let f = 0;
    const tick = () => {
      let out = '', done = 0;
      for (const it of q) {
        if (f >= it.e) { done++; out += it.to; }
        else if (f >= it.s) out += `<span style="color:#7c6cff">${GLYPHS[(Math.random() * GLYPHS.length) | 0]}</span>`;
        else out += it.from;
      }
      scrEl.innerHTML = out;
      if (done === q.length) res(); else { f++; requestAnimationFrame(tick); }
    };
    tick();
  });
}
async function scrambleLoop() {
  if (reduced) return;
  for (;;) {
    await new Promise(r => setTimeout(r, 2200));
    roleI = (roleI + 1) % roles.length;
    await scrambleTo(roles[roleI]);
  }
}

/* ───────── CODE TYPING ───────── */
const CODE = [
  [['c', '# eray.py — kısaca ben\n']],
  [['k', 'class '], ['f', 'Eray'], ['', '(Developer):\n']],
  [['', '    location = '], ['s', '"İstanbul, TR"'], ['', '\n']],
  [['', '    born     = '], ['n', '2007'], ['', '\n']],
  [['', '    stack    = ['], ['s', '"Python"'], ['', ', '], ['s', '"C++"'], ['', ', '], ['s', '"C#"'], ['', ']\n']],
  [['', '    loves    = ['], ['s', '"AI"'], ['', ', '], ['s', '"Robotik"'], ['', ', '], ['s', '"Güvenlik"'], ['', ']\n\n']],
  [['k', '    def '], ['f', 'build'], ['', '(self, idea):\n']],
  [['', '        plan = self.'], ['f', 'think'], ['', '(idea)\n']],
  [['k', '        while not '], ['', 'plan.done:\n']],
  [['', '            plan.'], ['f', 'code'], ['', '(coffee='], ['n', 'True'], ['', ')  '], ['c', '# ☕\n']],
  [['k', '        return '], ['s', '"🚀 "'], ['', ' + plan.'], ['f', 'ship'], ['', '()\n\n']],
  [['', 'Eray().'], ['f', 'build'], ['', '('], ['s', '"senin projen"'], ['', ')']]
].flat();
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function typeCode() {
  const el = $('#codeType');
  if (!el || getComputedStyle($('#codeCard')).display === 'none') return;
  const total = CODE.reduce((a, [, t]) => a + [...t].length, 0);
  let n = reduced ? total : 0;
  const render = () => {
    let left = n, html = '';
    for (const [c, t] of CODE) {
      if (left <= 0) break;
      const chars = [...t], part = chars.slice(0, left).join('');
      left -= chars.length;
      html += c ? `<span class="${c}">${esc(part)}</span>` : esc(part);
    }
    el.innerHTML = html + '<span class="cur"></span>';
  };
  const tick = () => { n++; render(); if (n < total) setTimeout(tick, 18 + Math.random() * 40); };
  render(); if (n < total) tick();
}

/* ───────── HERO NETWORK CANVAS ───────── */
(() => {
  const cv = $('#net'), ctx = cv.getContext('2d'), hero = $('#hero');
  let w, h, pts = [], mouse = { x: -999, y: -999 }, visible = true, raf;
  const resize = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.min(110, Math.floor(w * h / 13000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .6 }));
  };
  resize(); addEventListener('resize', resize);
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  hero.addEventListener('click', e => { if (e.target.closest('a,button')) return; const r = hero.getBoundingClientRect(); burst(e.clientX, e.clientY, 30, .7);
    for (const p of pts) { const dx = p.x - (e.clientX - r.left), dy = p.y - (e.clientY - r.top), d = Math.hypot(dx, dy) || 1; if (d < 220) { p.vx += dx / d * 3; p.vy += dy / d * 3; } } });
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const LINK = 130;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const mdx = mouse.x - p.x, mdy = mouse.y - p.y, md = Math.hypot(mdx, mdy);
      if (md < 180) { p.vx += mdx / md * .02; p.vy += mdy / md * .02; }
      p.vx *= .985; p.vy *= .985;
      if (Math.hypot(p.vx, p.vy) < .15) { p.vx += (Math.random() - .5) * .05; p.vy += (Math.random() - .5) * .05; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
      p.x = clamp(p.x, 0, w); p.y = clamp(p.y, 0, h);
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < LINK) { ctx.strokeStyle = `rgba(160,150,255,${(1 - d / LINK) * .22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      }
      if (md < 200) { ctx.strokeStyle = `rgba(196,255,77,${(1 - md / 200) * .5})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      ctx.fillStyle = md < 200 ? '#c4ff4d' : 'rgba(220,220,255,.7)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    raf = visible ? requestAnimationFrame(draw) : null;
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); }).observe(hero);
  if (reduced) { visible = false; draw(); } else raf = requestAnimationFrame(draw);
})();

/* ───────── CURSOR + MAGNETIC ───────── */
if (finePointer && !reduced) {
  document.body.classList.add('has-cursor');
  const dot = $('.cursor-dot'), ring = $('.cursor-ring');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; });
  addEventListener('pointerdown', () => ring.classList.add('down'));
  addEventListener('pointerup', () => ring.classList.remove('down'));
  const follow = () => { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(follow); };
  follow();
  document.addEventListener('pointerover', e => ring.classList.toggle('hover', !!e.target.closest('a,button,.bub,.sphere span,.chips span,.ch')));
  document.addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = 0; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = ring.style.opacity = ''; });

  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 500); });
  });

  const card = $('#codeCard');
  if (card) addEventListener('pointermove', e => {
    if (scrollY > innerHeight) return;
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    card.style.transform = `perspective(1000px) rotateY(${-10 + x * 16}deg) rotateX(${6 - y * 12}deg)`;
  });
}

/* ───────── SPOTLIGHT CARDS ───────── */
document.addEventListener('pointermove', e => {
  const c = e.target.closest && e.target.closest('.spot');
  if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  c.style.setProperty('--my', (e.clientY - r.top) + 'px');
});

/* ───────── NAV ───────── */
const nav = $('.nav'), pill = $('.nav-pill'), links = $$('.nav-links a');
function movePill(a) {
  if (!a) { pill.style.opacity = 0; return; }
  pill.style.opacity = 1; pill.style.left = a.offsetLeft + 'px'; pill.style.width = a.offsetWidth + 'px';
}
let lastY = scrollY;
const progress = $('#progress');
function onScroll() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  nav.classList.toggle('hide', y > lastY && y > 400 && !$('#mobileMenu').classList.contains('open'));
  lastY = y;
  let cur = null;
  for (const a of links) { const s = $('#' + a.dataset.sec); if (s && s.getBoundingClientRect().top < innerHeight * .45) cur = a; }
  links.forEach(a => a.classList.toggle('active', a === cur));
  movePill(cur);
}
addEventListener('scroll', onScroll, { passive: true });
const burger = $('#burger'), mm = $('#mobileMenu');
burger.addEventListener('click', () => { burger.classList.toggle('open'); mm.classList.toggle('open'); });
$$('a', mm).forEach(a => a.addEventListener('click', () => { burger.classList.remove('open'); mm.classList.remove('open'); }));

/* ───────── REVEAL + COUNTERS ───────── */
const born = new Date(2007, 6, 27), now = new Date();
let age = now.getFullYear() - born.getFullYear();
if (now < new Date(now.getFullYear(), 6, 27)) age--;
$('#age').dataset.count = age;
$('#year').textContent = now.getFullYear();

function countUp(el) {
  const to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1600;
  const step = t => { const k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4);
    el.textContent = Math.round(to * e) + suf; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target;
  el.classList.add('in');
  $$('[data-count]', el).forEach(countUp);
  io.unobserve(el);
}), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach((el, i) => { if (!el.closest('#hero')) { el.style.transitionDelay = ((i % 4) * .08) + 's'; io.observe(el); } });

/* ───────── CLOCK ───────── */
function doing(h) {
  if (h < 2) return 'Gece kuşu modunda kod yazıyor 🦉';
  if (h < 8) return 'Muhtemelen uyuyor… ya da bug avlıyor 😴';
  if (h < 10) return 'Kahvesini içip güne başlıyor ☕';
  if (h < 13) return 'Derin odak modunda kod yazıyor 💻';
  if (h < 14) return 'Öğle arası, enerji topluyor 🍽️';
  if (h < 18) return 'Robotlarla uğraşıyor 🤖';
  if (h < 21) return 'Yan projeler üzerinde çalışıyor 🚀';
  return 'Yapay zeka modelleri eğitiyor 🧠';
}
function tickClock() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  $('#clock').textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':');
  $('#doing').textContent = doing(d.getHours());
}
tickClock(); setInterval(tickClock, 1000);

/* ───────── COFFEE ───────── */
let coffee = +store.get('coffee', 0) + 42;
const cN = $('#coffeeN'); cN.textContent = coffee;
const coffeeLines = ['Teşekkürler! ☕', 'Enerji +%10 ⚡', 'Kod hızı arttı! 🚀', 'Bir bug daha öldü 🐛', 'Sen bir efsanesin 🙌'];
$('#coffeeBtn').addEventListener('click', e => {
  coffee++; cN.textContent = coffee; store.set('coffee', coffee - 42);
  const r = e.currentTarget.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 40, .8);
  toast(coffeeLines[coffee % coffeeLines.length]);
});

/* ───────── COPY ───────── */
$$('.copy').forEach(b => b.addEventListener('click', async () => {
  const t = b.dataset.copy;
  try { await navigator.clipboard.writeText(t); toast('E-posta kopyalandı! 📋'); }
  catch { location.href = 'mailto:' + t; }
}));

/* ───────── TAG SPHERE ───────── */
(() => {
  const wrap = $('#sphere');
  const tags = ['Python', 'C++', 'C#', 'Dart', 'Java', 'HTML5', 'CSS3', 'OpenCV', 'Flutter', 'ASP.NET', '.NET', 'MVC', 'Raspberry Pi', 'Arduino', 'Linux', 'Unity',
    'REST API', 'OSINT', 'Reverse Eng.', 'Local AI', 'Automation', 'Embedded', 'Sensors', 'Motor Drivers', 'Real-Time', 'Git', 'Computer Vision', 'Robotics'];
  const colors = ['#c4ff4d', '#7c6cff', '#22d3ee', '#ff4f8b', '#ff9a3d', '#ffffff'];
  const items = tags.map((t, i) => {
    const s = document.createElement('span'); s.textContent = t; s.style.color = colors[i % colors.length]; wrap.appendChild(s);
    const phi = Math.acos(1 - 2 * (i + .5) / tags.length), th = Math.PI * (1 + Math.sqrt(5)) * i;
    return { el: s, x: Math.cos(th) * Math.sin(phi), y: Math.sin(th) * Math.sin(phi), z: Math.cos(phi) };
  });
  let vx = .003, vy = .004, drag = false, px, py, visible = false, R = 200;
  const size = () => { R = wrap.clientWidth * .38; };
  size(); addEventListener('resize', size);
  const rotate = (ax, ay) => {
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
    for (const p of items) {
      const y1 = p.y * cx - p.z * sx, z1 = p.y * sx + p.z * cx;
      const x2 = p.x * cy + z1 * sy, z2 = -p.x * sy + z1 * cy;
      p.x = x2; p.y = y1; p.z = z2;
    }
  };
  const render = () => {
    for (const p of items) {
      const sc = .55 + (p.z + 1) / 2 * .5;
      p.el.style.transform = `translate(-50%,-50%) translate3d(${p.x * R}px,${p.y * R}px,0) scale(${sc})`;
      p.el.style.opacity = .25 + (p.z + 1) / 2 * .75;
      p.el.style.zIndex = Math.round((p.z + 1) * 50);
    }
  };
  const loop = () => {
    if (!drag) { vx += (.003 - vx) * .02; vy += (.004 - vy) * .02; }
    rotate(vx, vy); render();
    if (visible) requestAnimationFrame(loop);
  };
  render();
  wrap.addEventListener('pointerdown', e => { drag = true; px = e.clientX; py = e.clientY; wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', e => { if (!drag) return; vy = (e.clientX - px) * .004; vx = -(e.clientY - py) * .004; px = e.clientX; py = e.clientY; });
  const end = () => { drag = false; };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  if (!reduced) new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was) loop(); }).observe(wrap);
})();

/* ───────── HORIZONTAL PROJECTS ───────── */
(() => {
  const sec = $('#projects'), track = $('#hsTrack');
  const mq = matchMedia('(min-width: 761px)');
  let dist = 0;
  const setup = () => {
    if (!mq.matches || reduced) { sec.style.height = ''; track.style.transform = ''; dist = 0; return; }
    dist = Math.max(0, track.scrollWidth - innerWidth);
    sec.style.height = (innerHeight + dist) + 'px';
    update();
  };
  const update = () => {
    if (!dist) return;
    const top = sec.getBoundingClientRect().top;
    const p = clamp(-top, 0, dist);
    track.style.transform = `translate3d(${-p}px,0,0)`;
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', setup);
  mq.addEventListener('change', setup);
  addEventListener('load', setup);
  setup();
})();

/* ───────── TILT ───────── */
if (finePointer && !reduced) $$('.tilt').forEach(c => {
  const g = document.createElement('span'); g.className = 'glare'; c.appendChild(g);
  c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.transform = `perspective(900px) rotateY(${(x - .5) * 14}deg) rotateX(${(.5 - y) * 12}deg) translateY(-6px)`;
    c.style.setProperty('--gx', x * 100 + '%'); c.style.setProperty('--gy', y * 100 + '%');
  });
  c.addEventListener('pointerleave', () => { c.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1),border-color .4s,box-shadow .4s'; c.style.transform = ''; setTimeout(() => c.style.transition = '', 600); });
});

/* ───────── TIMELINE ───────── */
(() => {
  const tl = $('#timeline'), fill = $('#tlFill'), items = $$('.tl-item', tl);
  const upd = () => {
    const r = tl.getBoundingClientRect(), mid = innerHeight * .6;
    fill.style.transform = `scaleY(${clamp((mid - r.top) / r.height, 0, 1)})`;
    items.forEach(it => it.classList.toggle('lit', it.querySelector('.tl-dot').getBoundingClientRect().top < mid));
  };
  addEventListener('scroll', upd, { passive: true }); upd();
})();

/* ───────── BUBBLE PLAYGROUND ───────── */
(() => {
  const pg = $('#playground'), els = $$('.bub', pg);
  const hues = [['#7c6cff', '#4b3cd6'], ['#c4ff4d', '#8fd41a'], ['#ff4f8b', '#d12a64'], ['#22d3ee', '#0f9cb8'], ['#ff9a3d', '#e06a10']];
  els.forEach((el, i) => { const [a, b] = hues[i % hues.length]; el.style.background = `radial-gradient(circle at 32% 28%, ${a}, ${b})`;
    el.style.color = i % hues.length === 1 ? '#0a0a0a' : '#fff'; });
  if (reduced) { pg.classList.add('static'); els.forEach(el => { const r = +el.dataset.r; el.style.width = el.style.height = r * 2 + 'px'; }); return; }
  let W, H, scale, bodies = [], started = false, running = false, dragB = null, ptr = { x: -999, y: -999, vx: 0, vy: 0 };
  const measure = () => { W = pg.clientWidth; H = pg.clientHeight; scale = clamp(W / 820, .62, 1); };
  measure();
  bodies = els.map((el, i) => {
    const r = +el.dataset.r * scale;
    el.style.width = el.style.height = r * 2 + 'px';
    el.style.fontSize = (r * .5) + 'px';
    el.querySelector('b').style.fontSize = clamp(r * .2, 9, 13) + 'px';
    return { el, r, x: r + Math.random() * (W - 2 * r), y: -r - i * 70 - Math.random() * 60, vx: (Math.random() - .5) * 4, vy: 0, a: 0 };
  });
  addEventListener('resize', () => {
    measure();
    bodies.forEach(b => { b.r = +b.el.dataset.r * scale; b.el.style.width = b.el.style.height = b.r * 2 + 'px'; b.el.style.fontSize = (b.r * .5) + 'px';
      b.el.querySelector('b').style.fontSize = clamp(b.r * .2, 9, 13) + 'px'; b.x = clamp(b.x, b.r, W - b.r); });
  });
  const pos = e => { const r = pg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  pg.addEventListener('pointerdown', e => {
    const p = pos(e);
    dragB = bodies.find(b => Math.hypot(b.x - p.x, b.y - p.y) < b.r) || null;
    if (dragB) { pg.setPointerCapture(e.pointerId); dragB.ox = p.x - dragB.x; dragB.oy = p.y - dragB.y; }
    ptr = { ...p, vx: 0, vy: 0 };
  });
  pg.addEventListener('pointermove', e => {
    const p = pos(e);
    ptr.vx = p.x - ptr.x; ptr.vy = p.y - ptr.y; ptr.x = p.x; ptr.y = p.y;
  });
  const release = () => { if (dragB) { dragB.vx = clamp(ptr.vx, -30, 30); dragB.vy = clamp(ptr.vy, -30, 30); } dragB = null; };
  pg.addEventListener('pointerup', release); pg.addEventListener('pointercancel', release);
  pg.addEventListener('pointerleave', () => { if (!dragB) ptr.x = ptr.y = -999; });
  pg.addEventListener('dblclick', e => { const p = pos(e); bodies.forEach(b => { const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy) || 1; b.vx += dx / d * 18; b.vy += dy / d * 18 - 6; }); });

  const step = () => {
    const G = .45;
    for (const b of bodies) {
      if (b === dragB) {
        const tx = ptr.x - b.ox, ty = ptr.y - b.oy;
        b.vx = tx - b.x; b.vy = ty - b.y; b.x = tx; b.y = ty;
      } else {
        b.vy += G; b.vx *= .995; b.vy *= .995;
        if (!dragB && ptr.x > -999) {
          const dx = b.x - ptr.x, dy = b.y - ptr.y, d = Math.hypot(dx, dy);
          if (d < b.r + 30 && d > 0) { const f = (b.r + 30 - d) * .06; b.vx += dx / d * f; b.vy += dy / d * f; }
        }
        b.x += b.vx; b.y += b.vy;
      }
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * .7; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * .7; }
      if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * .45; b.vx *= .96; if (Math.abs(b.vy) < .6) b.vy = 0; }
      if (b.y < b.r && b === dragB) b.y = b.r;
    }
    for (let k = 0; k < 3; k++) for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], c = bodies[j], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = a.r + c.r;
      if (d < min && d > 0) {
        const nx = dx / d, ny = dy / d, ov = (min - d);
        const wa = a === dragB ? 0 : c === dragB ? 1 : .5, wc = 1 - wa;
        a.x -= nx * ov * wa; a.y -= ny * ov * wa; c.x += nx * ov * wc; c.y += ny * ov * wc;
        if (k === 0) {
          const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rv < 0) { const imp = -rv * .85; if (a !== dragB) { a.vx -= nx * imp * wa * 2; a.vy -= ny * imp * wa * 2; } if (c !== dragB) { c.vx += nx * imp * wc * 2; c.vy += ny * imp * wc * 2; } }
        }
      }
    }
    for (const b of bodies) { b.a += b.vx / b.r; b.el.style.transform = `translate(${b.x - b.r}px,${b.y - b.r}px) rotate(${b.a}rad)`; }
    if (running) requestAnimationFrame(step);
  };
  bodies.forEach(b => b.el.style.transform = `translate(${b.x - b.r}px,${-200}px)`);
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; started = true; requestAnimationFrame(step); }
    else if (!e.isIntersecting) running = false;
  }, { threshold: .25 }).observe(pg);
})();

/* ───────── WHATSAPP FORM ───────── */
$('#waForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#waName').value.trim(), email = $('#waEmail').value.trim(), msg = $('#waMsg').value.trim();
  if (!name && !msg) {
    ['#waName', '#waMsg'].forEach(s => { const f = $(s).parentElement; f.classList.remove('err'); void f.offsetWidth; f.classList.add('err'); });
    toast('Lütfen en az adını veya mesajını yaz ✍️');
    return;
  }
  let text = '';
  if (name) text += '*Ad:* ' + name + '\n';
  if (email) text += '*E-posta:* ' + email + '\n';
  if (text) text += '\n';
  if (msg) text += '*Mesaj:* ' + msg;
  const r = e.submitter ? e.submitter.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  burst(r.left + r.width / 2, r.top + r.height / 2, 60);
  window.open('https://wa.me/905550612409?text=' + encodeURIComponent(text.trim()), '_blank');
});
$$('.field input, .field textarea').forEach(i => i.addEventListener('input', () => i.parentElement.classList.remove('err')));

/* ───────── TERMINAL ───────── */
const term = $('#term'), tOut = $('#termOut'), tIn = $('#termInput');
const hist = []; let hi = 0, termBooted = false;
const print = (html, cls = '') => { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; tOut.appendChild(d); tOut.scrollTop = tOut.scrollHeight; };
const typePrint = async (lines, delay = 35) => { for (const l of lines) { print(l); await new Promise(r => setTimeout(r, delay)); } };
function openTerm() {
  term.classList.add('open'); term.setAttribute('aria-hidden', 'false');
  setTimeout(() => tIn.focus(), 50);
  if (!termBooted) {
    termBooted = true;
    print(`<span class="p">ERAY.OS</span> terminal v2.0 — hoş geldin! 👋`);
    print(`Komutları görmek için <span class="acc">help</span> yaz. Kapatmak için <span class="acc">exit</span> veya <kbd>Esc</kbd>.\n`, 'dim');
  }
}
function closeTerm() { term.classList.remove('open'); term.setAttribute('aria-hidden', 'true'); tIn.blur(); }
$('#termOpen').addEventListener('click', openTerm);
$('#termClose').addEventListener('click', closeTerm);
term.addEventListener('click', e => { if (e.target === term) closeTerm(); });
$('.term-win').addEventListener('click', e => { if (!e.target.closest('a,i')) tIn.focus(); });

const CMDS = {
  help: () => print(
`<span class="acc">Kullanılabilir komutlar:</span>
  <span class="p">whoami</span>     ben kimim?
  <span class="p">about</span>      kısa biyografi
  <span class="p">skills</span>     teknik yetenekler
  <span class="p">projects</span>   projeler
  <span class="p">education</span>  eğitim
  <span class="p">contact</span>    iletişim bilgileri
  <span class="p">github</span> / <span class="p">linkedin</span> / <span class="p">whatsapp</span>   bağlantıyı aç
  <span class="p">goto</span> &lt;bölüm&gt; sayfada bölüme git
  <span class="p">coffee</span>     ☕ ısmarla
  <span class="p">party</span>      🎉
  <span class="p">matrix</span>     takip et beyaz tavşanı
  <span class="p">hack</span>       ...denemeye değer
  <span class="p">joke</span>       yazılımcı esprisi
  <span class="p">date</span>, <span class="p">ls</span>, <span class="p">echo</span>, <span class="p">clear</span>, <span class="p">exit</span>`),
  whoami: () => print('<span class="p">eray</span> — Robotik, yapay zeka, gömülü sistemler & full stack geliştirici. İstanbul 🇹🇷'),
  about: () => print('Raspberry Pi, Arduino ve Linux tabanlı sistemlerde deneyimli; Python ile AI destekli otomasyon ve görüntü işleme uygulamaları geliştiriyorum. Web, masaüstü, mobil ve gerçek zamanlı sistemlerde aktif projeler üretiyorum.'),
  skills: () => print(
`<span class="acc">Diller:</span>      Python · C/C++ · C# · Dart · Java · HTML/CSS
<span class="acc">Framework:</span>  OpenCV · Flutter · ASP.NET/MVC · .NET · Local AI
<span class="acc">Donanım:</span>    Raspberry Pi · Arduino · Embedded Linux · Sensörler · Motor sürücüler
<span class="acc">Güvenlik:</span>   OSINT · Reverse Engineering · Linux · REST API · Unity`),
  projects: () => print(
`01  AI Sosyal Medya Otomasyonu    <span class="dim">Python, Local AI</span>
02  Bilgisayarlı Görü & OpenCV     <span class="dim">Python, OpenCV</span>
03  Windows & .NET Uygulamaları     <span class="dim">C#, ASP.NET</span>
04  Full Stack Web Projeleri        <span class="dim">ASP.NET MVC, JS</span>
05  Flutter Mobil Uygulama          <span class="dim">Flutter, Dart</span>
06  Raspberry Pi & Arduino          <span class="dim">Embedded</span>`),
  education: () => print(
`🎓 Doğuş Üniversitesi — Bilişim Güvenliği Teknolojisi <span class="dim">(2025 →)</span>
🏫 Handan Hayrettin Yelkikanat MTAL — Bilişim Teknolojileri <span class="dim">(Mezun)</span>`),
  contact: () => print(
`📞 <a href="tel:+905550612409">0555 061 24 09</a>
✉️  <a href="mailto:erayhatipoglu98@gmail.com">erayhatipoglu98@gmail.com</a>
🐙 <a href="https://github.com/ErayHatipoglu" target="_blank" rel="noopener">github.com/ErayHatipoglu</a>
📍 İstanbul, Türkiye`),
  github: () => { print('GitHub açılıyor... 🐙'); window.open('https://github.com/ErayHatipoglu', '_blank'); },
  linkedin: () => { print('LinkedIn açılıyor... 💼'); window.open('https://linkedin.com/in/eray-hatipoğlu-8ba690410', '_blank'); },
  whatsapp: () => { print('WhatsApp açılıyor... 💬'); window.open('https://wa.me/905550612409', '_blank'); },
  goto: a => {
    const map = { hakkimda: 'about', about: 'about', yetenekler: 'skills', skills: 'skills', projeler: 'projects', projects: 'projects', egitim: 'education', education: 'education', ilgi: 'interests', interests: 'interests', iletisim: 'contact', contact: 'contact' };
    const id = map[(a[0] || '').toLowerCase().replace('ğ', 'g').replace('ş', 's').replace('ı', 'i')];
    if (!id) return print('kullanım: goto [about|skills|projects|education|interests|contact]', 'warn');
    closeTerm(); $('#' + id).scrollIntoView({ behavior: 'smooth' });
  },
  coffee: () => { $('#coffeeBtn').click(); print('☕ Kahve ısmarlandı. Teşekkürler!'); },
  party: () => { closeTerm(); rain(); toast('🎉 Parti zamanı!'); },
  matrix: () => { closeTerm(); startMatrix(); toast('Wake up, Neo… 🐇'); },
  hack: async () => {
    tIn.disabled = true;
    await typePrint(['<span class="warn">[!] Ana sisteme bağlanılıyor...</span>', 'Firewall atlatılıyor ███░░░░░░░ 30%', 'Firewall atlatılıyor ███████░░░ 70%',
      'Firewall atlatılıyor ██████████ 100%', 'Şifreler çözülüyor...', '<span class="p">ERİŞİM SAĞLANDI ✓</span>',
      '<span class="dim">…şaka şaka 😄 Ben sadece etik hacking yaparım. Siber güvenlik okuyorum, unutma!</span>'], 380);
    tIn.disabled = false; tIn.focus();
  },
  joke: () => {
    const j = ['Neden programcılar doğayı sevmez? Çok fazla bug var. 🐛', 'Bir SQL sorgusu bara girer, iki masaya yaklaşır ve sorar: "JOIN olabilir miyim?"',
      'Benim kodumda bug yok, sadece belgelenmemiş özellikler var. ✨', '!false — komik çünkü true. 😄', 'Çalışıyor ama nedenini bilmiyorum. Çalışmıyor ama nedenini bilmiyorum. Yazılım bu.',
      'Arduino\'ya "nasılsın" dedim, LED\'ini yaktı. Bence iyi. 💡'];
    print(j[(Math.random() * j.length) | 0]);
  },
  date: () => print(new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'full', timeStyle: 'medium' })),
  ls: () => print('<span class="acc">projeler/</span>  <span class="acc">robotlar/</span>  <span class="acc">ai-modelleri/</span>  cv.pdf  kahve.txt  <span class="dim">.gizli_planlar</span>'),
  cat: a => {
    const f = { 'kahve.txt': 'Günlük tüketim: ∞ ☕', 'cv.pdf': 'Binary dosya. İletişime geç, sana göndereyim 😉', '.gizli_planlar': 'Dünyayı robotlarla ele geçir 🤖 …şaka, sadece güzel projeler yap.' }[a[0]];
    print(f || `cat: ${esc(a[0] || '')}: Böyle bir dosya yok`, f ? '' : 'err');
  },
  echo: a => print(esc(a.join(' '))),
  sudo: () => print('Güzel deneme 😏 ama burada root benim.', 'err'),
  rm: a => a.join(' ').includes('-rf') ? print('🚫 Hayır. Bu siteyi silemezsin. Çok emek verdim!', 'err') : print('rm: izin reddedildi', 'err'),
  hello: () => print('Merhaba! 👋 Tanıştığımıza memnun oldum.'), merhaba: () => print('Merhaba! 👋 Tanıştığımıza memnun oldum.'),
  clear: () => { tOut.innerHTML = ''; },
  exit: () => closeTerm()
};
async function run(line) {
  print(`<span class="p">eray@istanbul:~$</span> ${esc(line)}`);
  if (!line) return;
  const [cmd, ...args] = line.trim().split(/\s+/);
  const fn = CMDS[cmd.toLowerCase()];
  if (fn) await fn(args); else print(`komut bulunamadı: ${esc(cmd)} — <span class="acc">help</span> yazmayı dene`, 'err');
}
tIn.addEventListener('keydown', e => {
  if (e.key === 'Enter') { const v = tIn.value; if (v.trim()) hist.push(v); hi = hist.length; tIn.value = ''; run(v.trim()); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) tIn.value = hist[--hi]; }
  else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); tIn.value = hist[hi] || ''; }
  else if (e.key === 'Tab') { e.preventDefault(); const m = Object.keys(CMDS).filter(k => k.startsWith(tIn.value)); if (m.length === 1) tIn.value = m[0]; else if (m.length) print(m.join('  '), 'dim'); }
  else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); tOut.innerHTML = ''; }
});

/* ───────── KEYS: terminal + konami ───────── */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kpos = 0;
addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if (e.key === 'Escape' && term.classList.contains('open')) { closeTerm(); return; }
  if (!typing && (e.key === '`' || e.key === '"' && e.code === 'Backquote')) { e.preventDefault(); term.classList.contains('open') ? closeTerm() : openTerm(); return; }
  if (typing) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  kpos = k === KONAMI[kpos] ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
  if (kpos === KONAMI.length) { kpos = 0; startMatrix(8); rain(); toast('🕹️ Gizli mod açıldı! Sen gerçek bir oyuncusun.'); }
});

onScroll();
initBoot();
console.log('%c ERAY.OS %c Merhaba meraklı geliştirici! 👋 Sitede ` tuşuna basmayı dene.', 'background:#c4ff4d;color:#000;font-weight:bold;padding:4px 8px;border-radius:4px', 'color:#7c6cff');
})();
