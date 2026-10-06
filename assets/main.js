(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n, l = 2) => String(n).padStart(l, '0');
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};

/* ── dates ── */
const now = new Date();
const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
$('#year').textContent = now.getFullYear();
$('#tbDate').textContent = dateStr;
$('#woDate').textContent = dateStr;
$('#stampDate').textContent = dateStr;
$('#woNo').textContent = 'EH-' + pad(Math.floor(Math.random() * 9000) + 1000, 4);

/* ── toast ── */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ── theme: paper / blueprint ── */
if (store.get('bp') === '1') root.classList.add('bp');
const themeListeners = [];
$('#mode').addEventListener('click', e => {
  const apply = () => {
    root.classList.toggle('bp');
    store.set('bp', root.classList.contains('bp') ? '1' : '0');
    themeListeners.forEach(f => f());
  };
  if (!document.startViewTransition || reduced) return apply();
  const x = e.clientX || innerWidth - 60, y = e.clientY || 50;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => {
    root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 750, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
  });
});

/* ── crosshair cursor ── */
if (fine && !reduced) {
  const xx = $('.xh-x'), xy = $('.xh-y'), lbl = $('.xh-lbl');
  addEventListener('pointermove', e => {
    document.body.classList.add('xon');
    xx.style.transform = `translateY(${e.clientY}px)`;
    xy.style.transform = `translateX(${e.clientX}px)`;
    const flipX = e.clientX > innerWidth - 120, flipY = e.clientY > innerHeight - 40;
    lbl.style.transform = `translate(${e.clientX + (flipX ? -110 : 12)}px,${e.clientY + (flipY ? -26 : 12)}px)`;
    lbl.textContent = `X ${pad(Math.round(e.clientX), 4)}  Y ${pad(Math.round(e.clientY + scrollY), 4)}`;
  }, { passive: true });
  document.addEventListener('mouseleave', () => document.body.classList.remove('xon'));
}

/* ── top bar ── */
const top = $('.top'), navLinks = $$('.links a');
let lastY = scrollY;
function onScroll() {
  const y = scrollY;
  top.classList.toggle('hide', y > lastY && y > 300 && !$('#drawer').classList.contains('open'));
  lastY = y;
  let cur = null;
  navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = a; });
  navLinks.forEach(a => a.classList.toggle('on', a === cur));
}
addEventListener('scroll', onScroll, { passive: true });
const drawer = $('#drawer'), menuBtn = $('#menuBtn');
menuBtn.addEventListener('click', () => { const o = drawer.classList.toggle('open'); menuBtn.textContent = o ? 'KAPAT' : 'MENÜ'; });
$$('a', drawer).forEach(a => a.addEventListener('click', () => { drawer.classList.remove('open'); menuBtn.textContent = 'MENÜ'; }));

/* ── reveal ── */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target;
  el.classList.add('in');
  if (el.tagName === 'TABLE') $$('tbody td', el).forEach((td, i) => td.style.transitionDelay = (Math.floor(i / 3) * 70) + 'ms');
  if (el.classList.contains('sheet')) drawSvg(el);
  io.unobserve(el);
}), { threshold: .15, rootMargin: '0px 0px -30px 0px' });
$$('.rv').forEach(el => io.observe(el));
const tbIo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { $('.tb').classList.add('in'); tbIo.disconnect(); } }, { threshold: .4 });
tbIo.observe($('.tb'));

/* stagger siblings */
$$('.sheets .sheet, .direct .rv, .bom table').forEach(el => {
  const i = [...el.parentElement.children].indexOf(el);
  el.style.transitionDelay = (i % 3) * 90 + 'ms';
});

/* ── SVG line drawing ── */
$$('.draw').forEach(svg => $$('path,circle,rect,line,polyline', svg).forEach(p => {
  let len = 300;
  try { len = Math.ceil(p.getTotalLength()) + 2; } catch {}
  p.style.strokeDasharray = len;
  p.style.strokeDashoffset = reduced ? 0 : len;
}));
function drawSvg(sheet) {
  $$('.draw path,.draw circle,.draw rect', sheet).forEach((p, i) => {
    p.style.transition = `stroke-dashoffset 1.3s cubic-bezier(.7,0,.2,1) ${200 + i * 45}ms`;
    p.style.strokeDashoffset = 0;
    p.addEventListener('transitionend', () => {
      if (!p.classList.contains('dash')) { p.style.strokeDasharray = ''; }
      p.style.transition = '';
    }, { once: true });
  });
}
$$('.draw .dash').forEach(p => p.classList.add('dash'));

/* ── roles ticker ── */
const roles = $$('#roles li');
let ri = 0;
roles[0].classList.add('on');
if (!reduced) setInterval(() => { roles[ri].classList.remove('on'); ri = (ri + 1) % roles.length; roles[ri].classList.add('on'); }, 1600);

/* ── clock ── */
function tick() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  $('#clock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
tick(); setInterval(tick, 1000);

/* ── copy ── */
$$('.copy').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); toast('E-posta panoya kopyalandı'); }
  catch { location.href = 'mailto:' + b.dataset.copy; }
}));

/* ── work order → WhatsApp ── */
$('#wo').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#waName').value.trim(), email = $('#waEmail').value.trim(), msg = $('#waMsg').value.trim();
  if (!name && !msg) {
    ['#waName', '#waMsg'].forEach(s => { const f = $(s).closest('.f'); f.classList.remove('err'); void f.offsetWidth; f.classList.add('err'); });
    toast('En az adını veya açıklamayı doldur');
    return;
  }
  let text = `*İş emri ${$('#woNo').textContent}*\n`;
  if (name) text += '*Ad:* ' + name + '\n';
  if (email) text += '*E-posta:* ' + email + '\n';
  if (msg) text += '\n*Mesaj:* ' + msg;
  const st = $('#stamp'); st.classList.remove('hit'); void st.offsetWidth; st.classList.add('hit');
  const url = 'https://wa.me/905550612409?text=' + encodeURIComponent(text.trim());
  setTimeout(() => window.open(url, '_blank'), reduced ? 0 : 650);
});
$$('.f input,.f textarea').forEach(i => i.addEventListener('input', () => i.closest('.f').classList.remove('err')));

/* ── ROBOT ARM (2-link IK) ── */
(() => {
  const cv = $('#arm'), ctx = cv.getContext('2d'), hero = $('#hero');
  const readout = $('#readout'), clearBtn = $('#clearInk');
  let W, H, dpr, base, L1, L2, ink, ink2, acc, line;
  let a1 = -Math.PI / 2, a2 = .6, target = null, pointer = null, lastMove = -1e9, pressed = false, grip = 1;
  let trail = [], strokes = [], cur = null, visible = true, raf = null, t0 = performance.now();

  const colors = () => {
    const cs = getComputedStyle(root);
    ink = cs.getPropertyValue('--ink').trim(); ink2 = cs.getPropertyValue('--ink2').trim();
    acc = cs.getPropertyValue('--acc').trim(); line = cs.getPropertyValue('--line').trim();
  };
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mob = W < 900;
    base = mob ? { x: W * .72, y: H - 70 } : { x: W * .76, y: H - 80 };
    const s = mob ? Math.min(W * .34, H * .22) : Math.min(W * .2, H * .34);
    L1 = s; L2 = s * .9;
    colors();
  };
  resize(); addEventListener('resize', resize);
  themeListeners.push(colors);

  const local = e => { const r = hero.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  hero.addEventListener('pointermove', e => {
    pointer = local(e); lastMove = performance.now();
  });
  hero.addEventListener('pointerleave', () => { pointer = null; endStroke(); });
  hero.addEventListener('pointerdown', e => {
    if (e.target.closest('a,button')) return;
    pointer = local(e); lastMove = performance.now(); pressed = true;
    cur = []; strokes.push(cur);
    if (strokes.length > 40) strokes.shift();
  });
  const endStroke = () => { pressed = false; cur = null; clearBtn.classList.toggle('show', strokes.some(s => s.length > 2)); };
  addEventListener('pointerup', endStroke);
  clearBtn.addEventListener('click', () => { strokes = []; clearBtn.classList.remove('show'); });

  let tip = { x: 0, y: 0 }, j1 = { x: 0, y: 0 };
  const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

  function solve(tx, ty) {
    let dx = tx - base.x, dy = ty - base.y;
    let d = Math.hypot(dx, dy);
    const maxR = L1 + L2 - 2, minR = Math.abs(L1 - L2) + 10;
    if (d > maxR) { dx *= maxR / d; dy *= maxR / d; d = maxR; }
    if (d < minR) { dx *= minR / (d || 1); dy *= minR / (d || 1); d = minR; }
    if (base.y + dy > base.y - 10) dy = -10;
    const c2 = clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1);
    const t2 = -Math.acos(c2);
    const t1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2));
    return [t1, t2];
  }

  function stadium(x1, y1, x2, y2, r) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.arc(x1, y1, r, a + Math.PI / 2, a - Math.PI / 2);
    ctx.arc(x2, y2, r, a - Math.PI / 2, a + Math.PI / 2);
    ctx.closePath();
  }
  function joint(x, y, r) {
    ctx.fillStyle = getComputedStyle(root).getPropertyValue('--paper');
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * .35, 0, 7); ctx.stroke();
  }
  function centerLine(x1, y1, x2, y2, ext = 14) {
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a);
    ctx.save(); ctx.strokeStyle = ink2; ctx.lineWidth = .8; ctx.setLineDash([14, 4, 2, 4]);
    ctx.beginPath(); ctx.moveTo(x1 - c * ext, y1 - s * ext); ctx.lineTo(x2 + c * ext, y2 + s * ext); ctx.stroke(); ctx.restore();
  }
  function angleArc(x, y, from, to, r, label) {
    ctx.save(); ctx.strokeStyle = acc; ctx.fillStyle = acc; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, from, to, to < from); ctx.stroke();
    const mid = from + (to - from) / 2;
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillText(label, x + Math.cos(mid) * (r + 10) - (Math.cos(mid) < 0 ? ctx.measureText(label).width : 0), y + Math.sin(mid) * (r + 10) + 4);
    ctx.restore();
  }

  function frame(t) {
    const idle = !pointer || t - lastMove > 2600;
    if (idle) {
      const k = (t - t0) / 1000;
      target = { x: base.x - L1 * .55 + Math.sin(k * .9) * L1 * .6, y: base.y - L1 * 1.05 + Math.sin(k * 1.8) * L1 * .32 };
    } else target = pointer;

    const [t1, t2] = solve(target.x, target.y);
    const ease = reduced ? 1 : .14;
    a1 += angDiff(t1, a1) * ease; a2 += angDiff(t2, a2) * ease;
    grip += ((pressed ? .25 : 1) - grip) * .25;

    j1 = { x: base.x + Math.cos(a1) * L1, y: base.y + Math.sin(a1) * L1 };
    const a12 = a1 + a2;
    tip = { x: j1.x + Math.cos(a12) * L2, y: j1.y + Math.sin(a12) * L2 };

    trail.push({ x: tip.x, y: tip.y, t });
    while (trail.length && t - trail[0].t > 1400) trail.shift();
    if (pressed && cur) cur.push({ x: tip.x, y: tip.y });

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // persistent ink
    ctx.strokeStyle = acc; ctx.lineWidth = 2.4;
    for (const s of strokes) {
      if (s.length < 2) continue;
      ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    }
    // fading trail
    for (let i = 1; i < trail.length; i++) {
      const p = trail[i - 1], q = trail[i];
      ctx.globalAlpha = (1 - (t - q.t) / 1400) * .55;
      ctx.strokeStyle = acc; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // reach envelope
    ctx.save(); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.arc(base.x, base.y, L1 + L2, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.restore();

    // base plate with hatch
    const bw = L1 * .75, bh = 18;
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6;
    ctx.strokeRect(base.x - bw / 2, base.y + 6, bw, bh);
    ctx.save(); ctx.beginPath(); ctx.rect(base.x - bw / 2, base.y + 6, bw, bh); ctx.clip();
    ctx.lineWidth = .8; ctx.strokeStyle = ink2;
    for (let x = -bh; x < bw; x += 7) { ctx.beginPath(); ctx.moveTo(base.x - bw / 2 + x, base.y + 6 + bh); ctx.lineTo(base.x - bw / 2 + x + bh, base.y + 6); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(base.x - bw * .3, base.y + 6); ctx.lineTo(base.x - bw * .18, base.y - 16); ctx.lineTo(base.x + bw * .18, base.y - 16); ctx.lineTo(base.x + bw * .3, base.y + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, base.y + 6 + bh); ctx.lineTo(W, base.y + 6 + bh); ctx.strokeStyle = line; ctx.stroke();
    ctx.strokeStyle = ink;

    // horizontal reference for θ1
    ctx.save(); ctx.strokeStyle = ink2; ctx.lineWidth = .8; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(base.x + L1 * .7, base.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(j1.x, j1.y); ctx.lineTo(j1.x + Math.cos(a1) * L2 * .5, j1.y + Math.sin(a1) * L2 * .5); ctx.stroke();
    ctx.restore();

    const w1 = Math.max(12, L1 * .085), w2 = w1 * .75;
    centerLine(base.x, base.y, j1.x, j1.y);
    centerLine(j1.x, j1.y, tip.x, tip.y);

    const paper = getComputedStyle(root).getPropertyValue('--paper');
    ctx.lineWidth = 1.8;
    stadium(base.x, base.y, j1.x, j1.y, w1); ctx.fillStyle = paper; ctx.globalAlpha = .82; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    stadium(j1.x, j1.y, tip.x, tip.y, w2); ctx.globalAlpha = .82; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    joint(base.x, base.y, w1 * 1.25);
    joint(j1.x, j1.y, w1 * 1.05);

    // gripper
    const ga = a12, gc = Math.cos(ga), gs = Math.sin(ga), nx = -gs, ny = gc;
    const gw = w2 * 1.6 * (.45 + grip * .55), gl = w2 * 2.2;
    ctx.beginPath();
    ctx.moveTo(tip.x + nx * w2 * 1.7, tip.y + ny * w2 * 1.7); ctx.lineTo(tip.x - nx * w2 * 1.7, tip.y - ny * w2 * 1.7); ctx.stroke();
    for (const sgn of [1, -1]) {
      const sx = tip.x + nx * gw * sgn, sy = tip.y + ny * gw * sgn;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + gc * gl, sy + gs * gl); ctx.lineTo(sx + gc * gl - nx * sgn * 5, sy + gs * gl - ny * sgn * 5); ctx.stroke();
    }
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(tip.x, tip.y, 3, 0, 7); ctx.fill();

    // angle annotations
    const deg1 = -Math.atan2(Math.sin(a1), Math.cos(a1)) * 180 / Math.PI, deg2 = -Math.atan2(Math.sin(a2), Math.cos(a2)) * 180 / Math.PI;
    angleArc(base.x, base.y, 0, a1, L1 * .42, `θ₁ ${deg1.toFixed(1)}°`);
    angleArc(j1.x, j1.y, a1, a12, L2 * .32, `θ₂ ${deg2.toFixed(1)}°`);

    // tip leader + coords
    ctx.save(); ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = .8;
    const lx = tip.x + 26, ly = tip.y - 34;
    ctx.beginPath(); ctx.moveTo(tip.x + 4, tip.y - 4); ctx.lineTo(lx, ly); ctx.lineTo(lx + 92, ly); ctx.stroke();
    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.fillText(`P(${Math.round(tip.x - base.x)}, ${Math.round(base.y - tip.y)})`, lx + 2, ly - 5);
    ctx.restore();

    readout.textContent = `θ₁ ${deg1.toFixed(1)}° · θ₂ ${deg2.toFixed(1)}° · ${pressed ? 'KALEM AŞAĞI' : 'KALEM YUKARI'}`;
    raf = visible ? requestAnimationFrame(frame) : null;
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(hero);
  raf = requestAnimationFrame(frame);
})();

/* ── start ── */
onScroll();
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('loaded')));
})();
