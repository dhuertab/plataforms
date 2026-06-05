import { horzOverlap, rectsIntersect } from './math.js';

export function resolveCollisions(entity, platforms, ctx) {
  const vxBefore = entity.vx;
  const vyBefore = entity.vy;

  entity.onGround = false;
  entity.touchGround = false;
  entity.touchCeiling = false;
  entity.touchLeftWall = false;
  entity.touchRightWall = false;

  entity.x += entity.vx * ctx.dt;
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (rectsIntersect(entity, p)) {
      if (vxBefore > 0) entity.x = p.x - entity.w; else entity.x = p.x + p.w;
      entity.vx = 0;
      if (p.kind === 'leftWall') entity.touchLeftWall = true;
      if (p.kind === 'rightWall') entity.touchRightWall = true;
      if (ctx.gravDir.x === 1 && vxBefore > 0) entity.onGround = true;
      if (ctx.gravDir.x === -1 && vxBefore < 0) entity.onGround = true;
    }
  }

  entity.y += entity.vy * ctx.dt;
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (rectsIntersect(entity, p)) {
      if (vyBefore > 0) entity.y = p.y - entity.h; else entity.y = p.y + p.h;
      entity.vy = 0;
      if (p.kind === 'ground' && vyBefore > 0) entity.touchGround = true;
      if (p.kind === 'ceiling' && vyBefore < 0) entity.touchCeiling = true;
      if (ctx.gravDir.y === 1 && vyBefore > 0) entity.onGround = true;
      if (ctx.gravDir.y === -1 && vyBefore < 0) entity.onGround = true;
    }
  }

  if (entity.y > ctx.vh + 200) entity.dead = true;
}

export function applyGravity(entity, ctx, G) {
  entity.vx += ctx.gravDir.x * G * ctx.dt;
  entity.vy += ctx.gravDir.y * G * ctx.dt;
}

export function updatePlatforms(level, ctx) {
  for (let p of level.platforms) {
    if (p.type === 'moving') {
      p.prevY = p.y;
      p.y += p.speed * p.dir * ctx.dt;
      if (p.y > p.baseY + p.range) { p.y = p.baseY + p.range; p.dir = -1; }
      if (p.y < p.baseY - p.range) { p.y = p.baseY - p.range; p.dir = 1; }
      p.dy = p.y - p.prevY;
    }
  }
}

export function applyCarriers(player, platforms, ctx) {
  if (!player.onGround) return;
  if (ctx.gravDir.y === 0) return;
  for (let p of platforms) {
    if (p.type !== 'moving') continue;
    const eps = 1;
    if (ctx.gravDir.y === 1) {
      const contact = Math.abs(player.y + player.h - p.y) < eps && horzOverlap(player, p);
      if (contact) player.y += p.dy;
    } else if (ctx.gravDir.y === -1) {
      const contact = Math.abs(player.y - (p.y + p.h)) < eps && horzOverlap(player, p);
      if (contact) player.y += p.dy;
    }
  }
}

