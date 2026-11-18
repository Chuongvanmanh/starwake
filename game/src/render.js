import { W, H, COLORS, PLAYER } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStars(ctx, t) {
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const x = (i * 97 + t * (6 + (i % 5))) % W;
    const y = (i * 53 + Math.sin(t * 0.3 + i) * 8 + H) % H;
    ctx.globalAlpha = 0.2 + (i % 7) * 0.09;
    ctx.fillStyle = '#c9d4ff';
    const s = (i % 3) + 1;
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}

function drawWake(ctx, wake, now) {
  for (const w of wake) {
    const age = now - w.born;
    const life = 1 - age / 4200;
    if (life <= 0) continue;
    ctx.beginPath();
    ctx.arc(w.x, w.y, PLAYER.wakeHitRadius * (w.set ? 1 : 0.7), 0, Math.PI * 2);
    if (w.set) {
      ctx.fillStyle = `rgba(124,244,255,${0.55 * life})`;
      ctx.shadowColor = COLORS.accent;
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = `rgba(124,244,255,${0.18 * life})`;
      ctx.shadowBlur = 0;
    }
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawPlayer(ctx, p, t) {
  const blink = p.invuln > 0 && Math.floor(t * 20) % 2 === 0;
  if (blink) return;
  const ang = Math.atan2(p.vy, p.vx);
  const moving = Math.hypot(p.vx, p.vy) > 12;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (moving) ctx.rotate(ang);
  ctx.shadowColor = COLORS.accent;
  ctx.shadowBlur = 16;
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, 9);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, -9);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#041018';
  ctx.beginPath();
  ctx.arc(2, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  if (moving) {
    ctx.fillStyle = COLORS.accent2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-18 - Math.random() * 6, 4);
    ctx.lineTo(-18 - Math.random() * 6, -4);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawEnemy(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.spin);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = e.color;
  ctx.fillStyle = e.color + '33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (e.kind === 'boss') {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      const r = e.r * (i % 2 === 0 ? 1 : 0.62);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else if (e.kind === 'seeker') {
    ctx.moveTo(e.r, 0);
    ctx.lineTo(-e.r * 0.7, e.r * 0.75);
    ctx.lineTo(-e.r * 0.3, 0);
    ctx.lineTo(-e.r * 0.7, -e.r * 0.75);
    ctx.closePath();
  } else {
    ctx.arc(0, 0, e.r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
  if (e.kind === 'boss') {
    const pct = e.hp / e.maxHp;
    ctx.rotate(-e.spin);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0008';
    roundRect(ctx, -28, -e.r - 14, 56, 6, 3);
    ctx.fill();
    ctx.fillStyle = COLORS.accent2;
    roundRect(ctx, -28, -e.r - 14, 56 * pct, 6, 3);
    ctx.fill();
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}

function panel(ctx, textLines, subtitle) {
  ctx.fillStyle = 'rgba(7,6,15,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.font = '700 54px system-ui, sans-serif';
  ctx.fillText('STARWAKE', W / 2, H * 0.30);
  ctx.font = '500 18px system-ui, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(subtitle, W / 2, H * 0.38);
  let y = H * 0.48;
  ctx.font = '500 16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  for (const line of textLines) {
    ctx.fillText(line, W / 2, y);
    y += 26;
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = W;
    canvas.height = H;
  }

  function draw(world, particles) {
    const s = world.state;
    const sx = (Math.random() - 0.5) * s.shake;
    const sy = (Math.random() - 0.5) * s.shake;
    ctx.setTransform(1, 0, 0, 1, sx, sy);

    const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.5, 420);
    g.addColorStop(0, COLORS.bg1);
    g.addColorStop(1, COLORS.bg0);
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    drawStars(ctx, s.time);

    ctx.strokeStyle = 'rgba(124,244,255,0.15)';
    ctx.lineWidth = 2;
    roundRect(ctx, 12, 12, W - 24, H - 24, 18);
    ctx.stroke();

    drawWake(ctx, s.wake, s.time * 1000);

    for (const c of s.cores) {
      const bob = Math.sin(c.bob) * 3;
      ctx.shadowColor = COLORS.core;
      ctx.shadowBlur = 12;
      ctx.fillStyle = COLORS.core;
      ctx.beginPath();
      ctx.arc(c.x, c.y + bob, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const b of s.bullets) {
      ctx.fillStyle = COLORS.accent2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const e of s.enemies) drawEnemy(ctx, e);
    if (s.mode === 'playing' || s.mode === 'paused') drawPlayer(ctx, s.player, s.time);
    particles.draw(ctx);

    if (s.mode !== 'title') {
      ctx.textAlign = 'left';
      ctx.font = '600 16px system-ui, sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.fillText(`Score ${s.score}`, 28, 36);
      ctx.fillText(`Wave ${s.wave}`, 28, 58);
      ctx.textAlign = 'right';
      ctx.fillText(`Best ${s.best}`, W - 28, 36);
      for (let i = 0; i < 5; i++) {
        const hx = W - 28 - i * 20;
        const hy = 56;
        ctx.fillStyle = i < s.player.hp ? COLORS.danger : '#2a2438';
        ctx.beginPath();
        ctx.arc(hx, hy, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.muted;
      ctx.font = '500 13px system-ui, sans-serif';
      ctx.fillText('WASD move · wake sets then shreds foes · P pause · M mute', W / 2, H - 18);
    }

    if (s.messageT > 0 && s.message) {
      ctx.globalAlpha = Math.min(1, s.messageT * 2);
      ctx.fillStyle = COLORS.accent;
      ctx.font = '700 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.message, W / 2, H * 0.22);
      ctx.globalAlpha = 1;
    }

    if (s.mode === 'title') {
      panel(ctx, [
        'Steer with WASD or arrows. Your trail becomes a lethal wake.',
        'Dodge drifters and seekers. Block boss shots with set lace.',
        'Collect golden cores. Clear 12 waves to finish the constellation.',
        '',
        'Click or press Enter to begin',
      ], 'lace the void with light');
    } else if (s.mode === 'paused') {
      panel(ctx, ['Paused', 'Press P to resume'], 'take a breath');
    } else if (s.mode === 'lost') {
      panel(ctx, [
        `Score ${s.score} · Best ${s.best}`,
        'Your wake dissolved in the dark.',
        'Click or press R to try again',
      ], 'wake faded');
    } else if (s.mode === 'won') {
      panel(ctx, [
        `Score ${s.score} · Best ${s.best}`,
        'Twelve waves woven. The sky remembers your path.',
        'Click or press R to play again',
      ], 'constellation complete');
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return { resize, draw, ctx };
}
