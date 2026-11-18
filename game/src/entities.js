import { PLAYER, COLORS, W, H } from './config.js';

export function createPlayer() {
  return {
    x: W * 0.5,
    y: H * 0.5,
    vx: 0,
    vy: 0,
    hp: PLAYER.maxHp,
    invuln: 0,
    trailTimer: 0,
  };
}

export function createWakePoint(x, y, now) {
  return { x, y, born: now, set: false, dead: false };
}

export function makeEnemy(kind, x, y, wave) {
  const base = 40 + wave * 4;
  if (kind === 'drifter') {
    return {
      kind, x, y,
      vx: (Math.random() - 0.5) * (60 + wave * 6),
      vy: (Math.random() - 0.5) * (60 + wave * 6),
      r: 14,
      hp: 1,
      score: 100,
      color: COLORS.danger,
      spin: Math.random() * Math.PI * 2,
    };
  }
  if (kind === 'seeker') {
    return {
      kind, x, y,
      vx: 0, vy: 0,
      r: 12,
      hp: 1,
      score: 160,
      color: '#c084fc',
      speed: base,
      spin: 0,
    };
  }
  // boss
  return {
    kind: 'boss', x, y,
    vx: 0, vy: 0,
    r: 34,
    hp: 8 + Math.floor(wave / 2),
    maxHp: 8 + Math.floor(wave / 2),
    score: 1200,
    color: COLORS.accent2,
    speed: 55 + wave * 2,
    spin: 0,
    shootTimer: 1.2,
  };
}

export function spawnCore(x, y) {
  return { x, y, r: 8, life: 8, bob: Math.random() * Math.PI * 2 };
}

export function spawnEdge(padding) {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: padding + Math.random() * (W - padding * 2), y: -20 };
  if (side === 1) return { x: padding + Math.random() * (W - padding * 2), y: H + 20 };
  if (side === 2) return { x: -20, y: padding + Math.random() * (H - padding * 2) };
  return { x: W + 20, y: padding + Math.random() * (H - padding * 2) };
}
