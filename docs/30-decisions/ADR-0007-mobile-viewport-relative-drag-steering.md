# ADR-0007 — Mobile Viewport-Relative Drag Steering

Status: Proposed
Date: 2026-10-15

## Context

While desktop players control paddles with high-precision keyboards (`WASD`/arrows), mice, or analog gamepads, mobile players on smartphones and tablets lack physical keys.
Direct virtual touch joysticks or absolute touch positioning introduce significant ergonomic problems:
1. Virtual joysticks drift, hide screen space, and feel unnatural for fast 2D plane deflections.
2. Absolute touch positioning places the player's thumb directly over their own paddle and incoming ball, obscuring critical visual reaction cues.

## Decision

Implement relative drag steering (`drag-steering.ts`) decoupled from absolute touch coordinates:
- The player drags anywhere on the screen; only the relative pixel delta $(\Delta x, \Delta y)$ is mapped to paddle velocity and target position.
- Gain calibration is isotropic and scaled to viewport dimensions.
- The active paddle continues steering from its live position when a new gesture begins.
- Touch targets for pause and view switching are expanded to >= 44x44 CSS pixels.
- The camera rig dynamically adjusts vertical FOV in portrait mode to keep arena boundary walls in view.

## Consequences

- Touch controls feel responsive and arcade-like without occluding the paddle or ball.
- Implemented as a pure application module (`drag-steering.ts`) tested with 13 isolated unit tests.
- Zero impact on desktop keyboard, mouse pointer lock, or gamepad input pipelines.
