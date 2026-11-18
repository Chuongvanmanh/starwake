/** Deterministic screenshot scenes via ?shot=start|play|end|win */
import { W, H, PLAYER } from './config.js';
import { makeEnemy, spawnCore } from './entities.js';

export function applyShot(name, world, particles) {
  const s = world.state;
  s.wake = [];
  s.enemies = [];
  s.cores = [];
  s.bullets = [];
  s.score = 0;
  s.best = 1840;
  s.wave = 1;
  s.shake = 0;
  s.message = '';
  s.messageT = 0;
  particles.clear();

  const p = s.player;
  p.x = W * 0.5;
  p.y = H * 0.62;
  p.vx = 120;
  p.vy = -40;
  p.hp = 5;
  p.invuln = 0;

  if (name === 'start' || name === 'title') {
    s.mode = 'title';
    return;
  }

  // build a nice wake arc
  const now = 5000;
  s.time = now / 1000;
  for (let i = 0; i < 48; i++) {
    const t = i / 48;
    const x = 180 + t * 520;
    const y = 380 - Math.sin(t * Math.PI) * 160;
    s.wake.push({ x, y, born: now - 3000 + i * 40, set: i < 40, dead: false });
  }

  if (name === 'win') {
    s.mode = 'won';
    s.score = 9860;
    s.wave = 12;
    s.best = 9860;
    return;
  }

  if (name === 'end' || name === 'lost') {
    s.mode = 'lost';
    s.score = 2140;
    s.wave = 4;
    p.hp = 0;
    return;
  }

  // play
  s.mode = 'playing';
  s.score = 1280;
  s.wave = 3;
  s.remaining = 3;
  s.message = 'Wave 3';
  s.messageT = 1.2;
  s.enemies.push(makeEnemy('drifter', 220, 140, 3));
  s.enemies.push(makeEnemy('seeker', 720, 200, 3));
  s.enemies.push(makeEnemy('drifter', 500, 90, 3));
  s.cores.push(spawnCore(400, 260));
  s.cores.push(spawnCore(610, 300));
  particles.burst(400, 200, '#7cf4ff', 10, 80);
}
