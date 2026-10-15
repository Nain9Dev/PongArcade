# ADR-0002 — Deterministic Domain & Injected PRNG

- **Status:** Approved
- **Date:** 2026-02
- **Scope:** Simulation and testing

## Context

Testing game physics and opponent AI requires deterministic reproduction. Unseeded calls to `Math.random()` or reading system wall clocks directly produces non-reproducible test failures and prevents match replays.

## Decision

1. The domain must never call `Math.random()` or `Date.now()`.
2. All random decisions (serve angle, AI aiming noise, particle trajectories) take an injected `Rng` interface.
3. The production engine uses a fast seeded 32-bit PRNG (Mulberry32).

## Consequences

- Any match is completely reproducible from `(seed, input_trace)`.
- Property-based tests (`fast-check`) can run thousands of matches in seconds with predictable regression testing.
