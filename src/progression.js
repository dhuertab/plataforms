import { dist, rectsIntersect } from './math.js';

export function createProgression() {
  let score = 0;
  let coinsLeft = 0;
  let runLevel = 1;
  const maxLevel = 50;

  function resetRun() {
    score = 0;
    runLevel = 1;
  }

  function resetLevel(level) {
    coinsLeft = level.coins.length;
    for (let c of level.coins) c.collected = false;
    level.door.open = false;
  }

  function updateCoins(level, player) {
    for (let c of level.coins) {
      if (c.collected) continue;
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      if (dist(px, py, c.x, c.y) < c.r + Math.max(player.w, player.h) * 0.4) {
        c.collected = true;
        coinsLeft--;
        score += 10;
      }
    }
    if (coinsLeft <= 0) level.door.open = true;
  }

  function updateDoor(level, player) {
    if (level.door.open && rectsIntersect(player, level.door)) return true;
    return false;
  }

  function update(level, player) {
    updateCoins(level, player);
    const levelComplete = updateDoor(level, player);
    const gameOver = levelComplete && runLevel >= maxLevel;
    return { levelComplete, gameOver };
  }

  function advanceLevel() {
    runLevel = Math.min(maxLevel, runLevel + 1);
  }

  return {
    get score() { return score; },
    get coinsLeft() { return coinsLeft; },
    get runLevel() { return runLevel; },
    get maxLevel() { return maxLevel; },
    resetRun,
    resetLevel,
    update,
    advanceLevel
  };
}
