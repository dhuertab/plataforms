function drawRoundedRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawTriangle(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
}

function drawCoin(ctx, c) {
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffecb3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r * 0.6, 0, Math.PI * 2);
  ctx.stroke();
}

export function createRenderer(ctx) {
  function clear(vw, vh) {
    ctx.clearRect(0, 0, vw, vh);
  }

  function drawLevel(L) {
    for (let p of L.platforms) drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 6, p.color || '#3a3f5a');
    for (let c of L.coins) if (!c.collected) drawCoin(ctx, c);
    for (let e of L.enemies.reds) drawRoundedRect(ctx, e.x, e.y, e.w, e.h, 6, '#ff5252');
    for (let t of L.enemies.tris) drawTriangle(ctx, t.x, t.y, t.w, t.h, '#ffd740');
    const d = L.door;
    drawRoundedRect(ctx, d.x, d.y, d.w, d.h, 6, d.open ? '#69f0ae' : '#455a64');
  }

  function drawPlayer(player) {
    drawRoundedRect(ctx, player.x, player.y, player.w, player.h, 6, '#90caf9');
  }

  function drawHUD(score) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Plataforms', 12, 24);
    ctx.fillText('Puntos: ' + score, 12, 44);
  }

  function drawOverlay(vw, vh, text, sub) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText(text, vw / 2, vh / 2 - 10);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(sub, vw / 2, vh / 2 + 24);
  }

  return { clear, drawLevel, drawPlayer, drawHUD, drawOverlay };
}

