const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
let vw = 0;
let vh = 0;
function resize() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  canvas.width = Math.floor(vw * dpr);
  canvas.height = Math.floor(vh * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

const input = { left: false, right: false, jump: false, jumpPressed: false };
const keys = new Set();
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowleft', 'a'].includes(k)) keys.add('left');
  if (['arrowright', 'd'].includes(k)) keys.add('right');
  if ([' ', 'spacebar', 'w', 'arrowup'].includes(k)) keys.add('jump');
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (['arrowleft', 'a'].includes(k)) keys.delete('left');
  if (['arrowright', 'd'].includes(k)) keys.delete('right');
  if ([' ', 'spacebar', 'w', 'arrowup'].includes(k)) keys.delete('jump');
});

let touches = {};
const touchInput = { left: false, right: false, jump: false };
function updateTouchState() {
  touchInput.left = false;
  touchInput.right = false;
  touchInput.jump = false;
  const ids = Object.keys(touches);
  for (let i = 0; i < ids.length; i++) {
    const t = touches[ids[i]];
    const x = t.x; const y = t.y;
    if (y < vh * 0.35) touchInput.jump = true; else if (x < vw * 0.5) touchInput.left = true; else touchInput.right = true;
  }
}
function handleTouch(e) {
  const rect = canvas.getBoundingClientRect();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const x = t.clientX - rect.left; const y = t.clientY - rect.top;
    touches[t.identifier] = { x, y };
  }
  updateTouchState();
}
function handleTouchEnd(e) {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    delete touches[t.identifier];
  }
  updateTouchState();
}
canvas.addEventListener('touchstart', e => { handleTouch(e); e.preventDefault(); });
canvas.addEventListener('touchmove', e => { handleTouch(e); e.preventDefault(); });
canvas.addEventListener('touchend', e => { handleTouchEnd(e); e.preventDefault(); });
canvas.addEventListener('touchcancel', e => { handleTouchEnd(e); e.preventDefault(); });

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rectsIntersect(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function pointInRect(px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }
function dist(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.hypot(dx, dy); }

const G = 2200;
const MOVE = 800;
const AIR_MOVE = 600;
const JUMP = 780;
const MAX_VX = 360;
const MAX_VY = 1400;
const FRICTION = 0.85;

function makePlayer(x, y) {
  return { x, y, w: 26, h: 26, vx: 0, vy: 0, onGround: false, dead: false };
}
function makeRed(x, y) { return { x, y, w: 32, h: 32, vx: 0, vy: 0, onGround: false, detect: 260 }; }
function makeTri(x, y, dir) { return { x, y, w: 16, h: 16, vx: 0, vy: 0, dir }; }
function makeCoin(x, y) { return { x, y, r: 8, collected: false }; }
function makeDoor(x, y) { return { x, y, w: 28, h: 40, open: false }; }

function resolveCollisions(entity, platforms) {
  const vxBefore = entity.vx;
  const vyBefore = entity.vy;
  entity.onGround = false;
  entity.touchFloor = false;
  entity.touchCeiling = false;
  entity.x += entity.vx * dt;
  let hit = null;
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (rectsIntersect(entity, p)) {
      if (entity.vx > 0) entity.x = p.x - entity.w; else entity.x = p.x + p.w;
      entity.vx = 0; hit = p;
      if (gravDir.x !== 0) {
        if ((vxBefore > 0 && gravDir.x > 0) || (vxBefore < 0 && gravDir.x < 0)) entity.onGround = true;
      }
    }
  }
  entity.y += entity.vy * dt;
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (rectsIntersect(entity, p)) {
      if (entity.vy > 0) { entity.y = p.y - entity.h; } else entity.y = p.y + p.h;
      entity.vy = 0;
      if (gravDir.y !== 0) {
        if ((vyBefore > 0 && gravDir.y > 0) || (vyBefore < 0 && gravDir.y < 0)) entity.onGround = true;
      }
      if (vyBefore > 0) entity.touchFloor = true;
      if (vyBefore < 0) entity.touchCeiling = true;
    }
  }
  if (!entity.ignoreWalls) {
    if (entity.x < 0) { entity.x = 0; entity.vx = 0; }
    if (entity.x + entity.w > vw) { entity.x = vw - entity.w; entity.vx = 0; }
    if (entity.y < 0) { entity.y = 0; entity.vy = 0; }
  }
  if (entity.y > vh + 200) entity.dead = true;
  return hit;
}

function drawRect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function drawRoundedRect(x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); }
function drawTriangle(x, y, w, h, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill(); }
function drawCoin(c) { ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffecb3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, c.r * 0.6, 0, Math.PI * 2); ctx.stroke(); }
function rand(a, b) { return a + Math.random() * (b - a); }
function horzOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x; }

let levels = [];
function buildLevels() {
  const margin = 28;
  const ground = { x: 0, y: vh - 60, w: vw, h: 60 };
  const top = { x: 0, y: 0, w: vw, h: 20 };
  const leftW = { x: 0, y: 0, w: 20, h: vh };
  const rightW = { x: vw - 20, y: 0, w: 20, h: vh };
  const P = [];
  P.push(ground, top, leftW, rightW);
  const rows = [vh - 200, vh - 280, vh - 340];
  for (let i = 0; i < rows.length; i++) {
    const w = Math.floor(rand(140, 260));
    const x = Math.floor(rand(margin, vw - margin - w));
    P.push({ x, y: rows[i], w, h: 18 });
  }
  const extraW = Math.floor(rand(140, 220));
  const extraX = Math.floor(rand(margin, vw - margin - extraW));
  P.push({ x: extraX, y: vh - 240, w: extraW, h: 18 });
  const mpW = 140;
  const mpX = Math.max(margin, Math.min(vw - margin - mpW, vw * 0.5 - mpW / 2));
  const mpY = vh - 180;
  const moving = { x: mpX, y: mpY, w: mpW, h: 18, type: 'moving', color: '#69f0ae', baseY: mpY, range: 80, speed: 80, dir: 1, dy: 0, prevY: mpY };
  P.push(moving);
  const coins = [];
  for (let i = 4; i < P.length; i++) {
    const c = P[i];
    coins.push(makeCoin(Math.floor(c.x + c.w / 2), Math.floor(c.y - 20)));
  }
  const reds = [ makeRed(Math.floor(vw * 0.78), vh - 92) ];
  const tris = [ makeTri(Math.floor(rand(40, vw - 60)), Math.floor(vh * 0.3), Math.random() < 0.5 ? -1 : 1) ];
  const L = { platforms: P, coins, enemies: { reds, tris }, door: makeDoor(vw - 60, vh - 100), start: { x: 24, y: vh - 120 } };
  levels = [L];
}
buildLevels();

let state = 'menu';
let levelIndex = 0;
let player = makePlayer(0, 0);
let coinsLeft = 0;
let score = 0;
let dt = 0;
let last = performance.now();
let gravDir = { x: 0, y: 1 };

function resetLevel(i) {
  levelIndex = i;
  buildLevels();
  const L = levels[levelIndex];
  player = makePlayer(L.start.x, L.start.y);
  coinsLeft = L.coins.length;
  for (let c of L.coins) c.collected = false;
  L.door.open = false;
  gravDir = { x: 0, y: 1 };
  keys.clear();
  touches = {};
  touchInput.left = false; touchInput.right = false; touchInput.jump = false;
}
resetLevel(0);

function applyInput() {
  input.left = !!(keys.has('left') || touchInput.left);
  input.right = !!(keys.has('right') || touchInput.right);
  input.jump = !!(keys.has('jump') || touchInput.jump);
}

function updatePlayer(L) {
  const acc = player.onGround ? MOVE : AIR_MOVE;
  if (gravDir.y !== 0) {
    if (input.left) player.vx -= acc * dt;
    if (input.right) player.vx += acc * dt;
    player.vx = clamp(player.vx, -MAX_VX, MAX_VX);
  } else {
    if (input.left) player.vy -= acc * dt;
    if (input.right) player.vy += acc * dt;
    player.vy = clamp(player.vy, -MAX_VY, MAX_VY);
  }
  if (input.jump && !input.jumpPressed && player.onGround) { 
    player.vx += -gravDir.x * JUMP; 
    player.vy += -gravDir.y * JUMP; 
    input.jumpPressed = true; 
  }
  if (!input.jump) input.jumpPressed = false;
  player.vx += gravDir.x * G * dt;
  player.vy += gravDir.y * G * dt;
  player.vx = clamp(player.vx, -MAX_VX, MAX_VX);
  player.vy = clamp(player.vy, -MAX_VY, MAX_VY);
  if (player.onGround && !input.left && !input.right) {
    if (gravDir.y !== 0) player.vx *= FRICTION; else player.vy *= FRICTION;
  }
  resolveCollisions(player, L.platforms);
  if (player.touchFloor) gravDir = { x: 0, y: 1 };
  if (player.touchCeiling) gravDir = { x: 0, y: -1 };
}

function updateReds(L) {
  for (let e of L.enemies.reds) {
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    if (gravDir.y !== 0) {
      if (px < ex) e.vx -= MOVE * 0.6 * dt; else e.vx += MOVE * 0.6 * dt;
      e.vx = clamp(e.vx, -MAX_VX * 0.8, MAX_VX * 0.8);
    } else {
      if (py < ey) e.vy -= MOVE * 0.6 * dt; else e.vy += MOVE * 0.6 * dt;
      e.vy = clamp(e.vy, -MAX_VY * 0.8, MAX_VY * 0.8);
    }
    e.vx += gravDir.x * G * dt;
    e.vy += gravDir.y * G * dt;
    resolveCollisions(e, L.platforms);
    if (rectsIntersect(player, e)) player.dead = true;
  }
}

function updateTris(L) {
  for (let t of L.enemies.tris) {
    const s = 160;
    if (gravDir.y !== 0) {
      t.x += t.dir * s * dt;
      if (t.x < 0) { t.x = 0; t.dir = 1; }
      if (t.x + t.w > vw) { t.x = vw - t.w; t.dir = -1; }
    } else {
      t.y += t.dir * s * dt;
      if (t.y < 0) { t.y = 0; t.dir = 1; }
      if (t.y + t.h > vh) { t.y = vh - t.h; t.dir = -1; }
    }
    if (rectsIntersect(player, t)) player.dead = true;
  }
}

function updateCoins(L) {
  for (let c of L.coins) {
    if (!c.collected) {
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      if (dist(px, py, c.x, c.y) < c.r + Math.max(player.w, player.h) * 0.4) {
        c.collected = true; coinsLeft--; score += 10;
      }
    }
  }
  if (coinsLeft <= 0) L.door.open = true;
}

function updateDoor(L) {
  if (L.door.open && rectsIntersect(player, L.door)) {
    const next = levelIndex + 1;
    resetLevel(next < levels.length ? next : 0);
  }
}

function drawLevel(L) {
  for (let p of L.platforms) drawRoundedRect(p.x, p.y, p.w, p.h, 6, p.color || '#3a3f5a');
  for (let c of L.coins) if (!c.collected) drawCoin(c);
  for (let e of L.enemies.reds) drawRoundedRect(e.x, e.y, e.w, e.h, 6, '#ff5252');
  for (let t of L.enemies.tris) drawTriangle(t.x, t.y, t.w, t.h, '#ffd740');
  const d = L.door; drawRoundedRect(d.x, d.y, d.w, d.h, 6, d.open ? '#69f0ae' : '#455a64');
}

function drawPlayer() { drawRoundedRect(player.x, player.y, player.w, player.h, 6, '#90caf9'); }

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Plataforms', 12, 24);
  ctx.fillText('Puntos: ' + score, 12, 44);
}

function drawOverlay(text, sub) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, vw, vh);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText(text, vw / 2, vh / 2 - 10);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(sub, vw / 2, vh / 2 + 24);
}

function tick() {
  const now = performance.now();
  dt = clamp((now - last) / 1000, 0, 0.033);
  last = now;
  ctx.clearRect(0, 0, vw, vh);
  applyInput();
  if (state === 'menu') {
    drawLevel(levels[levelIndex]);
    drawOverlay('Pulsa salto para empezar', 'Teclas: ← → y Espacio. Pantalla: izquierda/derecha/salto');
    if (input.jump) { state = 'playing'; }
  } else if (state === 'playing') {
    const L = levels[levelIndex];
    updatePlatforms(L);
    updatePlayer(L);
    if (player.x <= 22 && input.left) gravDir = { x: -1, y: 0 };
    else if (player.x + player.w >= vw - 22 && input.right) gravDir = { x: 1, y: 0 };
    else if (player.y <= 22) gravDir = { x: 0, y: -1 };
    updateCarriers(L);
    updateReds(L);
    updateTris(L);
    updateCoins(L);
    updateDoor(L);
    if (player.dead) state = 'dead';
    drawLevel(L);
    drawPlayer();
    drawHUD();
  } else if (state === 'dead') {
    drawLevel(levels[levelIndex]);
    drawPlayer();
    drawOverlay('Has muerto', 'Puntos: ' + score + ' — Pulsa salto para reiniciar');
    if (input.jump) { score = 0; resetLevel(0); state = 'playing'; }
  }
  requestAnimationFrame(tick);
}

function updatePlatforms(L) {
  for (let p of L.platforms) {
    if (p.type === 'moving') {
      p.prevY = p.y;
      p.y += p.speed * p.dir * dt;
      if (p.y > p.baseY + p.range) { p.y = p.baseY + p.range; p.dir = -1; }
      if (p.y < p.baseY - p.range) { p.y = p.baseY - p.range; p.dir = 1; }
      p.dy = p.y - p.prevY;
    }
  }
}

function updateCarriers(L) {
  if (gravDir.y !== 0 && player.onGround) {
    for (let p of L.platforms) {
      if (p.type === 'moving') {
        const contact = Math.abs(player.y + player.h - p.y) < 1 && horzOverlap(player, p);
        if (contact) player.y += p.dy;
      }
    }
  }
}
tick();