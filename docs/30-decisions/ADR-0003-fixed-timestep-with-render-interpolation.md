# ADR-0003 — Fixed Timestep with Render Interpolation

- **Status:** Approved
- **Date:** 2026-02
- **Scope:** Game loop & animation

## Context

Variable timestep (`dt = now - last`) leads to numerical instability in collision detection: a frame drop causes the ball to jump a large distance, resulting in collision glitches. Furthermore, running physics at whatever the monitor refresh rate is (60 Hz vs 144 Hz vs 240 Hz) gives competitive advantages to high-refresh displays.

## Decision

Decouple simulation frequency from rendering:
1. Physics advances in fixed increments of $1/120$ s (8.33 ms).
2. The game loop accumulates real elapsed time and consumes it in discrete ticks (clamped to max 5 ticks per frame to prevent spiral of death).
3. The remaining fraction $\alpha \in [0, 1)$ interpolates visual position between previous and current physics ticks for Three.js rendering.

## Consequences

- Identical physics behavior across 60 Hz, 120 Hz, 144 Hz, and 240 Hz monitors.
- Butter-smooth visuals without physics jitter.
