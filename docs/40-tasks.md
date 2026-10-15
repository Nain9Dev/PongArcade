# 40 — Tasks: Pong Arcade 3D

Status: Active
Phase: Maintenance & Governance

Labels: `[A]` agent alone · `[M]` mixed, needs a human action · `[H]` human only.

## Done

- [x] **T-001** `[A]` Hexagonal Architecture migration from legacy 2D HTML
      Implements: ADR-0001
      Verified: Decoupled into `domain/`, `application/`, `infrastructure/`, `ui/`.

- [x] **T-002** `[A]` Continuous Collision Detection (CCD)
      Implements: REQ-003 · ADR-0004
      Verified: 24 tests in `tests/domain/physics.spec.ts`. Zero tunneling at 140+ units/s.

- [x] **T-003** `[A]` Fixed 120 Hz timestep with render interpolation
      Implements: REQ-001, REQ-002 · ADR-0003
      Verified: 6 tests in `tests/application/game-loop.spec.ts`.

- [x] **T-004** `[A]` Deterministic predictive trajectory AI
      Implements: REQ-006, REQ-007 · ADR-0006
      Verified: 14 tests in `tests/domain/ai.spec.ts`. Difficulty hierarchy verified.

- [x] **T-005** `[A]` Injected PRNG & property-based tests
      Implements: REQ-005 · ADR-0002
      Verified: 10 tests in `tests/domain/rng.spec.ts` using `fast-check`.

- [x] **T-101** `[A]` Pure `drag-steering` module in application layer
      Implements: REQ-011 · ADR-0007
      Verified: 13 unit tests in `tests/application/drag-steering.spec.ts`.

- [x] **T-102** `[A]` Relative drag and pointer lifecycle in `browser-input`
      Implements: REQ-011 · ADR-0007
      Verified: 14 unit tests in `tests/infrastructure/input/browser-input.spec.ts`.

- [x] **T-103** `[A]` Aspect-aware FOV and mobile portrait framing
      Implements: REQ-012 · ADR-0007
      Verified: Camera rig dynamically adjusts vertical FOV to preserve arena walls in portrait view.

- [x] **T-104** `[A]` Touch-accessible controls and 44px hit targets
      Implements: REQ-013 · ADR-0007
      Verified: CSS controls provide >= 44x44 CSS px targets with gesture suppression.

- [x] **T-201** `[A]` Pin local development port to 5320
      Implements: `D:/Development/Tools/dev-ports.json`
      Verified: `vite.config.ts` pins `5320` (`strictPort: true`, `allowedHosts: ['pong.localhost']`).

- [x] **T-202** `[A]` Spec-Driven documentation suite (00 to 60)
      Implements: NainDev documentation standard
      Verified: Created `00-charter.md`, `10-requirements.md`, `11-open-questions.md`, `20-architecture.md`, `30-decisions/`, `40-tasks.md`, `50-traceability.md`, `60-runbook.md`.

## Open

- [ ] **T-203** `[M]` GitHub Pages production deployment verification on `pong.naindev.com`
      Done when: `https://pong.naindev.com` is verified live and matches latest build.
