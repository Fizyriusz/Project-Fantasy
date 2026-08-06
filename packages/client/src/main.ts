import { Color, Scene, WebGLRenderer } from 'three';

import { createIsometricCamera, fitCameraToViewport } from './render/isometricCamera';
import { createPlaceholderWorld, createTemporaryLighting } from './render/placeholderWorld';
import { connectToSimulation } from './sim/simConnection';

const canvas = document.querySelector<HTMLCanvasElement>('#viewport');
if (canvas === null) {
  throw new Error('Missing #viewport canvas in index.html');
}

const status = document.querySelector<HTMLElement>('#status');
if (status === null) {
  throw new Error('Missing #status element in index.html');
}

const renderer = new WebGLRenderer({ canvas, antialias: true });

const scene = new Scene();
scene.background = new Color(0x1b1f1d);
scene.add(createPlaceholderWorld());
scene.add(createTemporaryLighting());

const camera = createIsometricCamera(window.innerWidth / window.innerHeight);

function resizeToWindow(): void {
  // Capped because a high-DPI display would otherwise render several times the
  // pixels for a difference nobody can see at this camera distance.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  fitCameraToViewport(camera, window.innerWidth / window.innerHeight);
}

resizeToWindow();
window.addEventListener('resize', resizeToWindow);

// Stays this way unless the simulation answers, so silence is visible.
status.textContent = 'sim: brak połączenia';

const simulation = connectToSimulation((message) => {
  switch (message.type) {
    case 'ready':
      status.textContent = 'sim: połączony';
      break;
  }
});

simulation.send({ type: 'hello' });

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
