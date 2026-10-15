# ADR-0006 — Predictive Trajectory AI over Reactive Tracking

- **Status:** Approved
- **Date:** 2026-02
- **Scope:** Artificial intelligence

## Context

In classic Pong implementations, AI simply tracks the ball's current $y$-coordinate. In a 3D tunnel where the ball bounces off four walls before reaching the player's goal, tracking current position looks unnatural and makes the AI easily beaten by fast angle shots. Giving the AI superhuman paddle speed feels unfair.

## Decision

1. The AI solves the ball's terminal $(x, y)$ intersection on its goal plane, taking into account intermediate wall reflections.
2. Rather than giving the AI unfair speed, human-like constraints are applied:
   - **Reaction Latency:** Delay before computing prediction.
   - **Aiming Noise:** Injected Gaussian error in target coordinates.
   - **Commitment Horizon:** Threshold before which the AI locks its intended deflection position.

## Consequences

- AI opponents play like skilled humans: anticipating trajectory, preparing positioning, yet prone to edge errors under intense spin or multi-bounce deflections.
