/** Tunable constants for Starwake. */
export const W = 960;
export const H = 540;

export const PLAYER = {
  radius: 12,
  speed: 260,
  accel: 1400,
  friction: 0.86,
  wakeSpacing: 10,
  wakeSetMs: 380,
  wakeLifeMs: 4200,
  wakeHitRadius: 9,
  invulnMs: 900,
  maxHp: 5,
};

export const WAVE = {
  baseEnemies: 4,
  perWave: 2,
  spawnPadding: 48,
  betweenMs: 1400,
  bossEvery: 5,
};

export const COLORS = {
  bg0: '#07060f',
  bg1: '#12102a',
  accent: '#7cf4ff',
  accent2: '#ffb86c',
  danger: '#ff5d8f',
  good: '#9effa8',
  text: '#eef4ff',
  muted: '#8b93b3',
  wakeFresh: 'rgba(124,244,255,0.25)',
  wakeSet: 'rgba(124,244,255,0.85)',
  core: '#ffd36a',
};
