# 11 — Open Questions & Trade-offs: Pong Arcade 3D

## Resolved Decisions & Trade-offs

### Q-001: Pure DOM HUD vs Modern SPA Framework (Vue 3 / React)
- **Status:** Resolved in favor of Pure DOM HUD.
- **Context:** The application lifecycle revolves around high-frequency requestAnimationFrame (60 to 144 Hz) and fixed 120 Hz simulation ticks.
- **Decision:** Keeping a lightweight, zero-dependency DOM shell ensures 0ms framework reconciliation overhead, minimal memory allocation during gameplay, and avoids virtual DOM diffing interfering with Three.js rendering loops.

### Q-002: Collision Model: Discrete vs Continuous Collision Detection
- **Status:** Resolved in favor of Chronological Continuous Collision Detection (CCD).
- **Context:** Ball speeds reach 140+ units/sec while paddles have a thickness of 0.35 units. At 1/120s step, the ball travels up to 1.16 units per tick, easily phasing through paddles in a discrete overlap check.
- **Decision:** Implemented ray-plane sweep intersection with exact time-of-impact resolution, testing impacts in strict chronological sequence.

### Q-003: Deterministic RNG for Match Replays
- **Status:** Resolved in favor of Mulberry32 / PCG PRNG injection.
- **Context:** Standard `Math.random()` cannot be seeded or serialized.
- **Decision:** Implemented an injectable `Rng` interface, making matches reproducible from `(seed, input trace)` for testing and potential replay sharing.

## Active / Open Questions

- **Q-004:** WebRTC Peer-to-Peer Multiplayer: Could deterministic lockstep or state synchronization allow low-latency p2p browser matches without dedicated game servers?
  - *Current Status:* Deferred; local 2-player and AI duel modes meet the portfolio scope.
