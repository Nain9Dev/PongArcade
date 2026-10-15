# 00 — Charter: Pong Arcade 3D

## Vision

Pong Arcade 3D re-architects the classic 2D game into a true 3D arena duel:
- The paddles navigate the 2D cross-section plane ($x, y$) while the ball travels down a 3D tunnel along the $z$-axis between opposite goals.
- Runs 100% in modern browsers without external asset downloads, heavy engines, or server runtimes.
- Built to demonstrate deterministic computational geometry, continuous collision detection (CCD), predictive vector AI, and sub-millisecond game loop execution.

## Core Tenets

1. **Deterministic Physics First:** The simulation domain is completely isolated from the browser and WebGL. It advances on a fixed 120 Hz clock and takes randomness exclusively through an injected seeded PRNG, guaranteeing 100% reproducible matches.
2. **Zero External Assets:** Audio is synthesized in real time via the Web Audio API; graphics are rendered procedurally with Three.js geometries and shaders. Zero MP3s, zero GLBs, zero textures over the network.
3. **Continuous Collision Detection (CCD):** Avoid discrete position sampling tunnelling. Fast-moving balls at 140+ units/sec accurately solve time-of-impact against moving paddle volumes and arena boundary planes.
4. **Humanized AI Opponents:** AI levels differ by human cognitive limits (reaction latency, gaze tracking delay, aiming noise, decision commitment) rather than superhuman motor speed.
5. **Universal Playability:** Fully responsive on mobile touchscreens via relative drag steering, gamepad controllers, and desktop keyboard/mouse.

## Constraints

- Zero cloud infrastructure cost: Deployed entirely as static assets to GitHub Pages via custom domain `pong.naindev.com`.
- No runtime frameworks for UI (no React, no Vue): The HUD and control menus use a minimal zero-overhead DOM shell to ensure maximum framerate budget for Three.js WebGL rendering.
