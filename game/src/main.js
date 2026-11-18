import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { createWorld } from './world.js';
import { createRenderer } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const input = createInput(canvas);
const audio = createAudio();
const particles = createParticles();
const world = createWorld(audio, particles);
const renderer = createRenderer(canvas);

renderer.resize();
window.addEventListener('resize', () => renderer.resize());

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(shot, world, particles);
  status.textContent = `shot:${shot}`;
}

let last = performance.now();
let pauseEdge = false;
let muteEdge = false;

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  if (!shot) {
    const pDown = input.pressed('p') || input.pressed('escape');
    if (pDown && !pauseEdge) world.togglePause();
    pauseEdge = pDown;

    const mDown = input.pressed('m');
    if (mDown && !muteEdge) {
      const muted = audio.toggleMute();
      status.textContent = muted ? 'Sound off' : 'Sound on';
    }
    muteEdge = mDown;

    world.update(dt, input);
  } else {
    // keep particles lively a bit in shot mode without advancing game logic
    particles.update(dt * 0.25);
  }

  renderer.draw(world, particles);

  const s = world.state;
  if (!shot && s.mode === 'playing') {
    status.textContent = `Wave ${s.wave}, score ${s.score}, lives ${s.player.hp}`;
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
