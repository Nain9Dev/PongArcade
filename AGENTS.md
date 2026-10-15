# Pong Arcade 3D — Engineering & Agent Guidelines

## Architecture Principles

1. **Hexagonal Architecture:**
   - `app/src/domain/`: Pure deterministic simulation (continuous collision detection, predictive AI, vector math, seeded PRNG). **Never import Three.js, DOM, window, or document.**
   - `app/src/application/`: Ports, fixed 120 Hz timestep game loop, and session state machine.
   - `app/src/infrastructure/`: Three.js rendering adapter, Web Audio synthesizer, input adapters (keyboard, touch, gamepad, mouse).
   - `app/src/ui/`: Zero-framework DOM HUD and controls overlay.

2. **Deterministic Physics & Testability:**
   - Any random event must consume the injected PRNG (`Rng`).
   - The physics engine must remain 100% testable in Node.js without a canvas or WebGL context.

3. **Port & Local Host Allocation:**
   - Pinned port: `5320` (`http://pong.localhost:5320`).
   - Preview port: `5321` (`http://pong.localhost:5321`).
   - Defined in `D:/Development/Tools/dev-ports.json`.

## Verification Commands

Always run full verification before completing any task:

```bash
# Full gate: typecheck, unit and property tests, and production build
npm run check

# Unit and property tests alone (140 tests)
npm test

# Typecheck only
npm run typecheck
```

## Documentation

This project follows **Spec Driven Development**:
- Read `docs/README.md` and `docs/40-tasks.md` before making architectural changes.
- Architecture decisions are recorded in `docs/30-decisions/` (ADRs).
