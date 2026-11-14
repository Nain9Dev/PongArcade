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

- [x] **T-204** `[A]` Discoverability baseline: canonical, social metadata, JSON-LD, `robots.txt`, `sitemap.xml`, `llms.txt`
      Implements: REQ-015 to REQ-019
      Verified: `tests/site/seo.spec.ts` written first and seen failing; `npm run check` green; the build leaves the bundle hashes unchanged and the root files are served by Pages as they sit in the repository root.

- [x] **T-205** `[A]` Install contract test for the manifest, the icons and the head tags (`tests/site/install.spec.ts`)
      Implements: REQ-020 to REQ-023
      Verified: written before the files it reads; its 9 tests failed on the tree without the manifest, the icons and the tags.

- [x] **T-206** `[A]` Installable site: web app manifest, install icons rendered from the favicon, home-screen head tags
      Implements: REQ-020 to REQ-023
      Verified: `npm run check` green; the build leaves the bundle hashes unchanged; Chrome reports no installability error (`Page.getInstallabilityErrors`) for a local copy of the files a commit publishes.

## Open

- [ ] **T-203** `[M]` GitHub Pages production deployment verification on `pong.naindev.com`
      Done when: `https://pong.naindev.com` is verified live and matches latest build.

- [ ] **T-207** `[M]` Install verification on the live site (Android Chrome and iOS Safari)
      Done when: the live manifest answers 200 with a manifest media type and the owner has installed the site on both phones (icon uncropped, label `Pong Arcade`, no browser bar).
