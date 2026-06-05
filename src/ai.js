import { clamp, dist, rectsIntersect } from './math.js';
import { applyGravity, resolveCollisions } from './physics.js';

export function updateReds(level, player, ctx, params) {
  for (let e of level.enemies.reds) {
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    const d = dist(px, py, ex, ey);
    if (d < e.detect) {
      if (ctx.gravDir.y !== 0) {
        if (px < ex) e.vx -= params.MOVE * 0.6 * ctx.dt; else e.vx += params.MOVE * 0.6 * ctx.dt;
      } else {
        if (py < ey) e.vy -= params.MOVE * 0.6 * ctx.dt; else e.vy += params.MOVE * 0.6 * ctx.dt;
      }
    } else {
      if (ctx.gravDir.y !== 0) e.vx *= 0.92; else e.vy *= 0.92;
    }

    applyGravity(e, ctx, params.G);
    e.vx = clamp(e.vx, -params.MAX_VX * 0.8, params.MAX_VX * 0.8);
    e.vy = clamp(e.vy, -params.MAX_VY * 0.8, params.MAX_VY * 0.8);
    resolveCollisions(e, level.platforms, ctx);
    if (rectsIntersect(player, e)) player.dead = true;
  }
}

export function updateTris(level, player, ctx, params) {
  for (let t of level.enemies.tris) {
    const s = params.SPEED;
    if (ctx.gravDir.y !== 0) {
      t.x += t.dir * s * ctx.dt;
      if (t.x < 0) { t.x = 0; t.dir = 1; }
      if (t.x + t.w > ctx.vw) { t.x = ctx.vw - t.w; t.dir = -1; }
    } else {
      t.y += t.dir * s * ctx.dt;
      if (t.y < 0) { t.y = 0; t.dir = 1; }
      if (t.y + t.h > ctx.vh) { t.y = ctx.vh - t.h; t.dir = -1; }
    }
    if (rectsIntersect(player, t)) player.dead = true;
  }
}

