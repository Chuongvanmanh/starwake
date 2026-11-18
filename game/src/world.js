import { PLAYER, WAVE, W, H, COLORS } from './config.js';
import { createPlayer, createWakePoint, makeEnemy, spawnCore, spawnEdge } from './entities.js';

function dist2(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function createWorld(audio, particles) {
  const state = {
    mode: 'title', // title | playing | paused | won | lost
    player: createPlayer(),
    wake: [],
    enemies: [],
    cores: [],
    bullets: [],
    score: 0,
    best: Number(localStorage.getItem('starwake-best') || 0),
    wave: 1,
    remaining: 0,
    spawnQueue: [],
    spawnTimer: 0,
    message: '',
    messageT: 0,
    shake: 0,
    time: 0,
    cleared: 0,
  };

  function announce(text, t = 1.6) {
    state.message = text;
    state.messageT = t;
  }

  function resetRun() {
    state.player = createPlayer();
    state.wake = [];
    state.enemies = [];
    state.cores = [];
    state.bullets = [];
    state.score = 0;
    state.wave = 1;
    state.cleared = 0;
    state.shake = 0;
    state.time = 0;
    particles.clear();
    beginWave(1);
    state.mode = 'playing';
    announce(`Wave ${state.wave}`);
    audio.wave();
  }

  function beginWave(n) {
    state.wave = n;
    state.spawnQueue = [];
    const isBoss = n % WAVE.bossEvery === 0;
    if (isBoss) {
      const p = spawnEdge(WAVE.spawnPadding);
      state.spawnQueue.push(makeEnemy('boss', p.x, p.y, n));
      announce('Boss wake!');
    } else {
      const count = WAVE.baseEnemies + (n - 1) * WAVE.perWave;
      for (let i = 0; i < count; i++) {
        const p = spawnEdge(WAVE.spawnPadding);
        const kind = Math.random() < 0.45 + n * 0.02 ? 'seeker' : 'drifter';
        state.spawnQueue.push(makeEnemy(kind, p.x, p.y, n));
      }
    }
    state.remaining = state.spawnQueue.length;
    state.spawnTimer = 0.35;
  }

  function dropWake(now) {
    const p = state.player;
    const last = state.wake[state.wake.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < PLAYER.wakeSpacing) return;
    state.wake.push(createWakePoint(p.x, p.y, now));
  }

  function updatePlayer(dt, input) {
    const p = state.player;
    const axis = input.axis();
    p.vx += axis.x * PLAYER.accel * dt;
    p.vy += axis.y * PLAYER.accel * dt;
    const sp = Math.hypot(p.vx, p.vy);
    const max = PLAYER.speed;
    if (sp > max) { p.vx = (p.vx / sp) * max; p.vy = (p.vy / sp) * max; }
    p.vx *= Math.pow(PLAYER.friction, dt * 60);
    p.vy *= Math.pow(PLAYER.friction, dt * 60);
    p.x = Math.max(PLAYER.radius, Math.min(W - PLAYER.radius, p.x + p.vx * dt));
    p.y = Math.max(PLAYER.radius, Math.min(H - PLAYER.radius, p.y + p.vy * dt));
    if (p.invuln > 0) p.invuln -= dt;
    const moving = Math.hypot(p.vx, p.vy) > 18 || Math.hypot(axis.x, axis.y) > 0;
    if (moving) dropWake(state.time * 1000);
  }

  function updateWake(dt) {
    const now = state.time * 1000;
    for (const w of state.wake) {
      const age = now - w.born;
      if (!w.set && age >= PLAYER.wakeSetMs) {
        w.set = true;
        audio.wakeSet();
      }
      if (age >= PLAYER.wakeLifeMs) w.dead = true;
    }
    state.wake = state.wake.filter((w) => !w.dead);
  }

  function hurtPlayer(amount = 1) {
    const p = state.player;
    if (p.invuln > 0) return;
    p.hp -= amount;
    p.invuln = PLAYER.invulnMs / 1000;
    state.shake = 10;
    audio.hurt();
    particles.burst(p.x, p.y, COLORS.danger, 16, 160);
    if (p.hp <= 0) {
      state.mode = 'lost';
      if (state.score > state.best) {
        state.best = state.score;
        localStorage.setItem('starwake-best', String(state.best));
      }
      audio.lose();
      announce('Wake faded');
    }
  }

  function killEnemy(e, i) {
    state.score += e.score;
    state.remaining -= 1;
    particles.burst(e.x, e.y, e.color, e.kind === 'boss' ? 36 : 14, e.kind === 'boss' ? 220 : 140);
    audio.kill();
    if (Math.random() < (e.kind === 'boss' ? 1 : 0.35)) state.cores.push(spawnCore(e.x, e.y));
    state.enemies.splice(i, 1);
    if (state.remaining <= 0 && state.spawnQueue.length === 0 && state.enemies.length === 0) {
      state.cleared += 1;
      state.score += 250 * state.wave;
      if (state.wave >= 12) {
        state.mode = 'won';
        if (state.score > state.best) {
          state.best = state.score;
          localStorage.setItem('starwake-best', String(state.best));
        }
        audio.win();
        announce('Constellation complete!');
      } else {
        beginWave(state.wave + 1);
        audio.wave();
        announce(`Wave ${state.wave}`);
      }
    }
  }

  function updateEnemies(dt) {
    const p = state.player;
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      e.spin += dt * 2;
      if (e.kind === 'drifter') {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.x < -40 || e.x > W + 40) e.vx *= -1;
        if (e.y < -40 || e.y > H + 40) e.vy *= -1;
      } else {
        const dx = p.x - e.x, dy = p.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.vx = (dx / d) * e.speed;
        e.vy = (dy / d) * e.speed;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }
      if (e.kind === 'boss') {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 1.35;
          for (let k = 0; k < 8; k++) {
            const a = (Math.PI * 2 * k) / 8 + e.spin;
            state.bullets.push({
              x: e.x, y: e.y,
              vx: Math.cos(a) * 140,
              vy: Math.sin(a) * 140,
              r: 5,
              life: 3.5,
            });
          }
          audio.hit();
        }
      }

      // wake collision (set wake only)
      let hitWake = false;
      for (const w of state.wake) {
        if (!w.set) continue;
        if (dist2(e, w) <= (e.r + PLAYER.wakeHitRadius) ** 2) { hitWake = true; break; }
      }
      if (hitWake) {
        e.hp -= 1;
        state.shake = Math.max(state.shake, 4);
        audio.hit();
        particles.burst(e.x, e.y, COLORS.accent, 6, 80);
        if (e.hp <= 0) { killEnemy(e, i); continue; }
        // knock slightly away from player
        const dx = e.x - p.x, dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * 18;
        e.y += (dy / d) * 18;
      }

      if (dist2(e, p) <= (e.r + PLAYER.radius) ** 2) hurtPlayer(e.kind === 'boss' ? 2 : 1);
    }
  }

  function updateBullets(dt) {
    const p = state.player;
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      let blocked = false;
      for (const w of state.wake) {
        if (!w.set) continue;
        if (dist2(b, w) <= (b.r + PLAYER.wakeHitRadius) ** 2) { blocked = true; break; }
      }
      if (blocked || b.life <= 0 || b.x < -30 || b.x > W + 30 || b.y < -30 || b.y > H + 30) {
        if (blocked) particles.burst(b.x, b.y, COLORS.accent, 5, 70);
        state.bullets.splice(i, 1);
        continue;
      }
      if (dist2(b, p) <= (b.r + PLAYER.radius) ** 2) {
        state.bullets.splice(i, 1);
        hurtPlayer(1);
      }
    }
  }

  function updateCores(dt) {
    const p = state.player;
    for (let i = state.cores.length - 1; i >= 0; i--) {
      const c = state.cores[i];
      c.bob += dt * 4;
      c.life -= dt;
      if (c.life <= 0) { state.cores.splice(i, 1); continue; }
      if (dist2(c, p) <= (c.r + PLAYER.radius) ** 2) {
        state.score += 75;
        if (p.hp < PLAYER.maxHp && Math.random() < 0.25) p.hp += 1;
        particles.burst(c.x, c.y, COLORS.core, 10, 90);
        audio.core();
        state.cores.splice(i, 1);
      }
    }
  }

  function updateSpawns(dt) {
    if (state.spawnQueue.length === 0) return;
    state.spawnTimer -= dt;
    if (state.spawnTimer > 0) return;
    state.enemies.push(state.spawnQueue.shift());
    state.spawnTimer = Math.max(0.25, WAVE.betweenMs / 1000 - state.wave * 0.04);
  }

  function update(dt, input) {
    if (state.messageT > 0) state.messageT -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 28);

    if (state.mode === 'title') {
      if (input.consumeClick() || input.pressed('enter') || input.pressed(' ')) {
        audio.resume();
        audio.startAmbient();
        audio.start();
        resetRun();
      }
      return;
    }

    if (state.mode === 'paused') {
      if (input.pressed('p') || input.pressed('escape')) {
        // handled via edge in main with latch; fall through
      }
      return;
    }

    if (state.mode === 'won' || state.mode === 'lost') {
      if (input.consumeClick() || input.pressed('enter') || input.pressed('r') || input.pressed(' ')) {
        audio.start();
        resetRun();
      }
      return;
    }

    // playing
    state.time += dt;
    updatePlayer(dt, input);
    updateWake(dt);
    updateSpawns(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateCores(dt);
    particles.update(dt);
  }

  return {
    state,
    update,
    resetRun,
    announce,
    togglePause() {
      if (state.mode === 'playing') { state.mode = 'paused'; announce('Paused'); return; }
      if (state.mode === 'paused') { state.mode = 'playing'; announce(''); }
    },
  };
}
