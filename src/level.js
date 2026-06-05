import { rand } from './math.js';
import { makeCoin, makeDoor, makeRed, makeTri } from './entities.js';

export function buildLevel(vw, vh) {
  const margin = 28;
  const groundY = vh - 60;

  const ground = { x: 0, y: groundY, w: vw, h: 60, kind: 'ground' };
  const ceiling = { x: 0, y: 0, w: vw, h: 20, kind: 'ceiling' };
  const leftW = { x: 0, y: 0, w: 20, h: vh, kind: 'leftWall' };
  const rightW = { x: vw - 20, y: 0, w: 20, h: vh, kind: 'rightWall' };

  const platforms = [ground, ceiling, leftW, rightW];
  const rows = [vh - 200, vh - 280, vh - 340];
  for (let i = 0; i < rows.length; i++) {
    const w = Math.floor(rand(140, 260));
    const x = Math.floor(rand(margin, vw - margin - w));
    platforms.push({ x, y: rows[i], w, h: 18, kind: 'platform' });
  }

  const extraW = Math.floor(rand(160, 240));
  const extraX = Math.floor(rand(margin, vw - margin - extraW));
  platforms.push({ x: extraX, y: vh - 240, w: extraW, h: 18, kind: 'platform' });

  const mpW = 140;
  const mpX = Math.max(margin, Math.min(vw - margin - mpW, vw * 0.5 - mpW / 2));
  const mpY = vh - 180;
  platforms.push({ x: mpX, y: mpY, w: mpW, h: 18, kind: 'platform', type: 'moving', color: '#69f0ae', baseY: mpY, range: 80, speed: 80, dir: 1, dy: 0, prevY: mpY });

  const coins = [];
  for (let i = 4; i < platforms.length; i++) {
    const p = platforms[i];
    coins.push(makeCoin(Math.floor(p.x + p.w / 2), Math.floor(p.y - 20)));
  }

  const enemies = {
    reds: [makeRed(Math.floor(vw * 0.78), groundY - 32)],
    tris: [makeTri(Math.floor(rand(40, vw - 60)), Math.floor(vh * 0.3), Math.random() < 0.5 ? -1 : 1)]
  };

  return {
    platforms,
    coins,
    enemies,
    door: makeDoor(vw - 60, groundY - 40),
    start: { x: 24, y: groundY - 60 }
  };
}

