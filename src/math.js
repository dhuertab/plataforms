export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function rectsIntersect(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
export function dist(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.hypot(dx, dy); }
export function rand(a, b) { return a + Math.random() * (b - a); }
export function horzOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x; }

