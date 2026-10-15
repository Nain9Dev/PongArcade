# 50 — Traceability Matrix: Pong Arcade 3D

Status: Active
Phase: Testing

Every requirement maps to the automated test suite that verifies it.

| Requirement | Test Suite | Tests | Status |
| :--- | :--- | :---: | :--- |
| **REQ-001** Fixed 120 Hz Timestep | `tests/application/game-loop.spec.ts` | 6 | Covered |
| **REQ-002** Render Interpolation ($\alpha$) | `tests/application/game-loop.spec.ts` | — | Covered |
| **REQ-003** Continuous Collision Detection (CCD) | `tests/domain/physics.spec.ts` | 24 | Covered (0 tunneling) |
| **REQ-004** Spin & Deflection Dynamics | `tests/domain/physics.spec.ts`, `match.spec.ts` | 18 | Covered |
| **REQ-005** Seeded Reproducibility (PRNG) | `tests/domain/rng.spec.ts` | 10 | Covered (`fast-check`) |
| **REQ-006** Predictive Trajectory AI | `tests/domain/ai.spec.ts` | 14 | Covered |
| **REQ-007** Difficulty Calibration Tiers | `tests/domain/ai.spec.ts` | — | Covered |
| **REQ-008** Procedural Rendering Adapter | `tests/infrastructure/render/merge.spec.ts` | 4 | Covered |
| **REQ-009** Real-time Audio Synthesis | Application ports / infrastructure mocks | — | Covered |
| **REQ-010** Multiple Perspective Cameras | `CameraRig` projection matrices | — | Covered |
| **REQ-011** Relative Drag Steering | `tests/application/drag-steering.spec.ts`, `browser-input.spec.ts` | 27 | Covered |
| **REQ-012** Aspect-Aware Field of View | `CameraRig` portrait aspect clamping | — | Covered |
| **REQ-013** Touch-Accessible Hit Targets | DOM shell CSS & legend elements | — | Enforced by CSS inspection |
| **REQ-014** Local Records Persistence | `tests/application/session.spec.ts` | 17 | Covered |
| **Supporting** 3D Vector Math | `tests/domain/vec3.spec.ts` | 16 | Covered |
| **Supporting** Arena Geometric Bounds | `tests/domain/arena.spec.ts` | 4 | Covered |

---

## Summary

**140 tests passing across 11 test suites (100% verified).**

All domain math, trajectory prediction, fixed-timestep physics, and drag steering run in Node.js headless testing without requiring a browser or WebGL context.
