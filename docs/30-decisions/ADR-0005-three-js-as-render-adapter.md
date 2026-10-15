# ADR-0005 — Three.js as an Infrastructure Render Adapter

- **Status:** Approved
- **Date:** 2026-02
- **Scope:** Graphics & rendering

## Context

We need high-performance 3D rendering in WebGL without coupling the game's business logic to any proprietary or framework-specific graphics API.

## Decision

Treat Three.js strictly as an infrastructure adapter implementing `IRenderer`:
- The domain entities expose pure geometric positions and orientations (`Vec3`).
- The Three.js adapter translates these coordinates into scene graph node matrices, neon wireframe materials, bloom passes, and particle emitters.
- Geometries are procedurally generated; no external 3D model files are requested.

## Consequences

- If WebGL fails or runs in Node.js headless testing, a null/mock renderer satisfies the application port with 0 runtime errors.
- Bundle size is optimized by isolating Three.js into a dedicated manual chunk.
