import { rand } from './math.js';
import { makeCoin, makeDoor, makeRed, makeTri } from './entities.js';

export function buildLevel(vw, vh, options = {}) {
  const levelNumber = Math.max(1, Math.floor(options.levelNumber || 1));
  const margin = 28;
  const groundY = vh - 60;
  const platformH = 18;
  const minVerticalClear = 120;
  const minHorizontalGapSameRow = 80;
  const looseXPad = 24;
  const minY = 20 + 70;
  const maxY = groundY - 90;

  const ground = { x: 0, y: groundY, w: vw, h: 60, kind: 'ground' };
  const ceiling = { x: 0, y: 0, w: vw, h: 20, kind: 'ceiling' };
  const leftW = { x: 0, y: 0, w: 20, h: vh, kind: 'leftWall' };
  const rightW = { x: vw - 20, y: 0, w: 20, h: vh, kind: 'rightWall' };

  function overlapsX(a, b, pad = 0) {
    return (a.x - pad) < (b.x + b.w + pad) && (a.x + a.w + pad) > (b.x - pad);
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function verticalClearance(a, b) {
    const aTop = a.y, aBottom = a.y + a.h;
    const bTop = b.y, bBottom = b.y + b.h;
    if (aTop <= bTop) return bTop - aBottom;
    return aTop - bBottom;
  }

  function validateAll(list) {
    const ps = list.filter(p => p.kind === 'platform');
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        if (rectsOverlap(a, b)) return false;
        if (overlapsX(a, b, looseXPad)) {
          if (verticalClearance(a, b) < minVerticalClear) return false;
        }
        if (Math.abs(a.y - b.y) < 60) {
          const leftGap = a.x - (b.x + b.w);
          const rightGap = b.x - (a.x + a.w);
          if (Math.max(leftGap, rightGap) < minHorizontalGapSameRow) return false;
        }
      }
    }
    return true;
  }

  function canPlace(candidate, list) {
    if (candidate.y < minY || candidate.y > maxY) return false;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p.kind !== 'platform') continue;
      if (rectsOverlap(candidate, p)) return false;
      if (overlapsX(candidate, p, looseXPad)) {
        if (verticalClearance(candidate, p) < minVerticalClear) return false;
      }
      if (Math.abs(candidate.y - p.y) < 60) {
        const leftGap = candidate.x - (p.x + p.w);
        const rightGap = p.x - (candidate.x + candidate.w);
        if (Math.max(leftGap, rightGap) < minHorizontalGapSameRow) return false;
      }
    }
    return true;
  }

  function tryBuild() {
    const platforms = [ground, ceiling, leftW, rightW];

    function placeStatic(yHint, wMin, wMax, attempts = 90) {
      for (let i = 0; i < attempts; i++) {
        const w = Math.floor(rand(wMin, wMax));
        const x = Math.floor(rand(margin, vw - margin - w));
        const yJitter = Math.floor(rand(-8, 8));
        const c = { x, y: Math.floor(yHint + yJitter), w, h: platformH, kind: 'platform' };
        if (canPlace(c, platforms)) { platforms.push(c); return true; }
      }
      return false;
    }

    function placeMoving(baseYHint, w, range, speed, attempts = 120) {
      for (let i = 0; i < attempts; i++) {
        const x = Math.floor(rand(margin, vw - margin - w));
        const baseY = Math.floor(baseYHint + rand(-10, 10));
        const topPos = { x, y: baseY - range, w, h: platformH, kind: 'platform' };
        const midPos = { x, y: baseY, w, h: platformH, kind: 'platform' };
        const botPos = { x, y: baseY + range, w, h: platformH, kind: 'platform' };
        if (canPlace(midPos, platforms) && canPlace(topPos, platforms) && canPlace(botPos, platforms)) {
          platforms.push({ x, y: baseY, w, h: platformH, kind: 'platform', type: 'moving', color: '#69f0ae', baseY, range, speed, dir: 1, dy: 0, prevY: baseY });
          return true;
        }
      }
      return false;
    }

    const basePlatforms = 4;
    const extraPlatforms = Math.min(10, Math.floor((levelNumber - 1) / 2));
    const targetPlatforms = basePlatforms + extraPlatforms;
    for (let i = 0; i < targetPlatforms; i++) {
      const yHint = Math.floor(rand(minY + 20, maxY - 40));
      placeStatic(yHint, 140, 280);
    }

    placeMoving(groundY - 165, 140, 80, 80);

    if (!validateAll(platforms)) return null;
    return platforms;
  }

  let platforms = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    platforms = tryBuild();
    if (platforms) break;
  }
  if (!platforms) platforms = [ground, ceiling, leftW, rightW];

  const coins = [];
  for (let i = 4; i < platforms.length; i++) {
    const p = platforms[i];
    coins.push(makeCoin(Math.floor(p.x + p.w / 2), Math.floor(p.y - 20)));
  }

  const detect = 240 + Math.min(180, levelNumber * 6);
  const redCount = Math.min(1 + Math.floor((levelNumber - 1) / 5), 6);
  const redSpawns = [
    { x: vw * 0.78, y: groundY - 32 },
    { x: vw * 0.18, y: groundY - 32 },
    { x: vw * 0.50, y: groundY - 32 },
    { x: vw * 0.78, y: Math.max(minY + 40, groundY - 260) },
    { x: vw * 0.18, y: Math.max(minY + 40, groundY - 260) },
    { x: vw * 0.50, y: Math.max(minY + 40, groundY - 320) }
  ];

  function clampSpawn(s) {
    const x = Math.max(24, Math.min(vw - 24 - 32, Math.floor(s.x)));
    const y = Math.max(minY + 10, Math.min(groundY - 32, Math.floor(s.y)));
    return { x, y };
  }

  const enemies = {
    reds: Array.from({ length: redCount }).map((_, i) => {
      const s = clampSpawn(redSpawns[i % redSpawns.length]);
      return makeRed(s.x, s.y, detect);
    }),
    tris: Array.from({ length: Math.min(1 + Math.floor((levelNumber - 1) / 4), 8) }).map(() => {
      const x = Math.floor(rand(40, vw - 60));
      const y = Math.floor(rand(minY + 30, maxY - 140));
      const dir = Math.random() < 0.5 ? -1 : 1;
      return makeTri(x, y, dir);
    })
  };

  return {
    platforms,
    coins,
    enemies,
    door: makeDoor(vw - 60, groundY - 40),
    start: { x: 24, y: groundY - 60 }
  };
}
