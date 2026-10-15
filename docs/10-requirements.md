# 10 — Requirements: Pong Arcade 3D

Requirements defined using EARS (Easy Approach to Requirements Syntax).

## Core Simulation & Physics

- **REQ-001 (Deterministic Fixed Timestep):** The simulation engine shall advance game state in fixed increments of exactly $1/120$ seconds (8.33 ms), regardless of the browser display refresh rate.
- **REQ-002 (Render Interpolation):** When rendering between fixed physics ticks, the engine shall compute an alpha interpolation factor $\alpha \in [0, 1)$ to blend entity positions smoothly without visual jitter.
- **REQ-003 (Continuous Collision Detection):** When the ball moves between ticks, the physics solver shall compute the exact time-of-impact against tunnel boundary planes and paddle volumes in chronological order to prevent tunneling.
- **REQ-004 (Spin & Deflection Dynamics):** When the ball impacts a moving paddle, the solver shall deflect the trajectory based on impact offset and paddle tangential velocity.
- **REQ-005 (Seeded Reproducibility):** When supplied with an initial seed and an input trace, the match simulation shall produce identical numerical states across all platforms.

## Artificial Intelligence

- **REQ-006 (Predictive Trajectory AI):** The AI opponent shall calculate where the ball will intersect its goal plane, accounting for intermediate wall reflections.
- **REQ-007 (Difficulty Calibration):** When configured across difficulty tiers (Rookie, Pro, Master, Singularity), the AI shall modulate reaction latency, aiming error, and commitment horizons rather than raw paddle speed.

## Rendering & Audio

- **REQ-008 (Procedural Rendering Adapter):** The rendering engine shall generate the neon arena, paddles, and ball procedurally in Three.js without downloading external 3D asset files.
- **REQ-009 (Real-time Audio Synthesis):** When collision or goal events occur, the audio adapter shall synthesize sound waves dynamically via Web Audio API oscillators and gain envelopes with zero audio files.
- **REQ-010 (Multiple Perspective Cameras):** The system shall support switching between chase camera, cockpit view, and broadcast side view.

## Mobile & Cross-Platform Playability

- **REQ-011 (Relative Drag Steering):** When touch input is detected, the game shall convert relative pointer delta into paddle displacement independent of screen resolution.
- **REQ-012 (Aspect-Aware Field of View):** In portrait mode on mobile devices, the camera rig shall dynamically adjust vertical FOV to maintain arena walls within visible bounds.
- **REQ-013 (Touch-Accessible Controls):** On touch devices, all interactive elements shall provide a minimum hit target size of 44x44 CSS pixels.
- **REQ-014 (Local Records Persistence):** The system shall persist personal bests and audio preferences in localStorage without server dependencies.
