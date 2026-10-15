# ADR-0004 — Continuous Collision Detection (CCD)

- **Status:** Approved
- **Date:** 2026-02
- **Scope:** Physics engine

## Context

In high-speed rallies, the ball velocity reaches 140 units/s. Given a paddle thickness of 0.35 units, at a 1/120 s timestep the ball advances 1.16 units in a single tick — over three times the paddle thickness. A discrete overlap check produces frequent tunneling.

## Decision

Implement analytical ray-plane sweep intersection:
- For each movement vector, solve the exact time-of-impact $t_i \in [0, \Delta t]$ against tunnel walls and moving paddle volumes.
- Resolve collisions in strict chronological order, update the velocity vector by reflection against the impact normal, and advance the remainder of the tick with the deflected trajectory.

## Consequences

- 0% tunneling even at maximum ball speeds.
- Predictable bounce behavior under high rally acceleration.
