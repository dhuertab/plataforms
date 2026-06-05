export function makePlayer(x, y) {
  return { x, y, w: 26, h: 26, vx: 0, vy: 0, onGround: false, dead: false, color: '#90caf9' };
}

export function makeRed(x, y, detect = 260) {
  return { x, y, w: 32, h: 32, vx: 0, vy: 0, onGround: false, detect };
}

export function makeTri(x, y, dir) {
  return { x, y, w: 16, h: 16, vx: 0, vy: 0, dir };
}

export function makeCoin(x, y) {
  return { x, y, r: 8, collected: false };
}

export function makeDoor(x, y) {
  return { x, y, w: 28, h: 40, open: false };
}
