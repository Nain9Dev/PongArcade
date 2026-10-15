# ADR-0001 — Hexagonal Architecture (Ports & Adapters)

- **Status:** Approved
- **Date:** 2026-02
- **Scope:** Project-wide structure

## Context

Version 1 of the game was a single 765-line HTML file (`legacy/pong-2d-legacy.html`) combining physics, 2D canvas drawing, Web Audio synthesis, AI heuristics, and DOM event listeners without separation.
Key drawbacks observed:
1. Untestable without browser DOM and `requestAnimationFrame`.
2. Geometry coupled to screen resolution (`canvas.width`).
3. Inability to replace the render engine without rewriting the simulation.

## Decision

Adopt Hexagonal Architecture with inward dependency flow:
- `app/src/domain/`: Pure simulation, CCD physics, arena geometry, predictive AI, and injected PRNG. Zero dependencies on Three.js, DOM, or window.
- `app/src/application/`: Game session state machine, fixed 120 Hz loop, and port definitions (`IRenderer`, `IAudio`, `IInput`, `IClock`, `IStorage`, `IUi`).
- `app/src/infrastructure/`: Adapters implementing ports via Three.js WebGL, Web Audio synthesis, DOM HUD, and browser inputs.
- `app/src/main.ts`: Composition root connecting adapters to ports.

## Consequences

- 100% of physics, AI, and math can be tested in Node.js.
- The simulation is resolution-independent.
- Three.js can be swapped or tested with mocks without touching game rules.
