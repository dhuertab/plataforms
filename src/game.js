import { clamp, dist, rectsIntersect } from './math.js';
import { makePlayer } from './entities.js';
import { createInput } from './input.js';
import { buildLevel } from './level.js';
import { createRenderer } from './render.js';
import { applyGravity, resolveCollisions, updatePlatforms } from './physics.js';
import { updateReds, updateTris } from './ai.js';
import { createProgression } from './progression.js';

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

const G = 2200;
const MOVE = 800;
const AIR_MOVE = 600;
const JUMP = 780;
const MAX_VX = 360;
const MAX_VY = 1400;
const FRICTION = 0.85;

const renderer = createRenderer(ctx);
const inputManager = createInput(canvas, () => ({ vw, vh }));
const input = inputManager.input;
const flipButton = document.getElementById('flip');
let flipRequested = false;
let prevFlip = false;
if (flipButton) {
  flipButton.addEventListener('pointerdown', e => {
    flipRequested = true;
    e.preventDefault();
  }, { passive: false });
}

let state = 'menu';
let dt = 0;
let last = performance.now();
let gravDir = { x: 0, y: 1 };

let levelIndex = 0;
let level = null;
let player = null;
const progression = createProgression();
let ridingPlatform = null;
let wasOnGround = false;

function flipGravityAndColor() {
  gravDir = { x: -gravDir.x, y: -gravDir.y };
  player.vx = 0;
  player.vy = 0;
  player.color = player.color === '#90caf9' ? '#69f0ae' : '#90caf9';
}

function resetLevel(i) {
  levelIndex = i;
  level = buildLevel(vw, vh, { levelNumber: progression.runLevel });
  player = makePlayer(level.start.x, level.start.y);
  progression.resetLevel(level);
  gravDir = { x: 0, y: 1 };
  player.color = '#90caf9';
  inputManager.reset();
}
resetLevel(0);

function updatePlayer(L) {
  const ctx = { dt, vw, vh, gravDir };
  if (ridingPlatform && wasOnGround && gravDir.y !== 0) {
    player.y += ridingPlatform.dy;
  }
  const acc = player.onGround ? MOVE : AIR_MOVE;
  if (gravDir.y !== 0) {
    if (input.left) player.vx -= acc * dt;
    if (input.right) player.vx += acc * dt;
  } else {
    const wallSpeed = MAX_VX;
    if (input.up && !input.down) player.vy = -wallSpeed;
    else if (input.down && !input.up) player.vy = wallSpeed;
    else player.vy = 0;
  }

  if (input.jump && !input.jumpPressed && player.onGround) {
    const jumpStrength = gravDir.y === 0 ? JUMP * 1.35 : JUMP;
    player.vx += -gravDir.x * jumpStrength;
    player.vy += -gravDir.y * jumpStrength;
    input.jumpPressed = true;
    ridingPlatform = null;
  }
  if (!input.jump) input.jumpPressed = false;

  applyGravity(player, ctx, G);
  player.vx = clamp(player.vx, -MAX_VX, MAX_VX);
  player.vy = clamp(player.vy, -MAX_VY, MAX_VY);
  if (player.onGround && !input.left && !input.right) {
    if (gravDir.y !== 0) player.vx *= FRICTION; else player.vy *= FRICTION;
  }

  resolveCollisions(player, L.platforms, ctx);
  wasOnGround = player.onGround;
  if (player.onGround && gravDir.y !== 0) {
    const eps = 1;
    ridingPlatform = null;
    for (let p of L.platforms) {
      if (p.type !== 'moving') continue;
      const over = player.x < p.x + p.w && player.x + player.w > p.x;
      if (!over) continue;
      if (gravDir.y === 1) {
        if (Math.abs(player.y + player.h - p.y) < eps) { ridingPlatform = p; break; }
      } else if (gravDir.y === -1) {
        if (Math.abs(player.y - (p.y + p.h)) < eps) { ridingPlatform = p; break; }
      }
    }
  } else {
    ridingPlatform = null;
  }

  if (gravDir.y === -1 && player.touchAnyFloor) gravDir = { x: 0, y: 1 };
  else if (gravDir.y === 1 && player.touchAnyCeiling) gravDir = { x: 0, y: -1 };
  else if (player.touchGround) gravDir = { x: 0, y: 1 };
  else if (player.touchLeftWall && input.left) gravDir = { x: -1, y: 0 };
  else if (player.touchRightWall && input.right) gravDir = { x: 1, y: 0 };
  else if (player.touchCeiling) gravDir = { x: 0, y: -1 };
}

function tick() {
  const now = performance.now();
  dt = clamp((now - last) / 1000, 0, 0.033);
  last = now;
  const ctx = { dt, vw, vh, gravDir };

  inputManager.update();
  renderer.clear(vw, vh);

  if (state === 'menu') {
    renderer.drawLevel(level);
    renderer.drawOverlay(vw, vh, 'Pulsa salto para empezar', 'Suelo/techo: ← →. Paredes: ↑ ↓. Salto: Espacio. Pantalla: izquierda/derecha/salto');
    if (input.jump) state = 'playing';
  } else if (state === 'playing') {
    const flipNow = !!(input.flip || flipRequested);
    if (flipNow && !prevFlip) flipGravityAndColor();
    prevFlip = flipNow;
    flipRequested = false;
    updatePlatforms(level, ctx);
    updatePlayer(level);
    updateReds(level, player, ctx, { MOVE, G, MAX_VX, MAX_VY });
    updateTris(level, player, ctx, { SPEED: 160 });
    const prog = progression.update(level, player);
    if (prog.gameOver) state = 'gameover';
    else if (prog.levelComplete) { progression.advanceLevel(); resetLevel(0); }
    if (player.dead) state = 'dead';
    renderer.drawLevel(level);
    renderer.drawPlayer(player);
    renderer.drawHUD(progression.score);
    renderer.drawRunLevel(vw, vh, progression.runLevel, progression.maxLevel);
  } else if (state === 'dead') {
    renderer.drawLevel(level);
    renderer.drawPlayer(player);
    renderer.drawOverlay(vw, vh, 'Has muerto', 'Puntos: ' + progression.score + ' — Pulsa salto para reiniciar');
    if (input.jump) { progression.resetRun(); resetLevel(0); state = 'playing'; }
  } else if (state === 'gameover') {
    renderer.drawLevel(level);
    renderer.drawPlayer(player);
    renderer.drawOverlay(vw, vh, 'GameOver: enhorabuena', 'Puntuación: ' + progression.score + ' — Pulsa salto para reiniciar');
    if (input.jump) { progression.resetRun(); resetLevel(0); state = 'playing'; }
  }

  requestAnimationFrame(tick);
}
tick();
