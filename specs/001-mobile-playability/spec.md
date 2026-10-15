# 001 — Mobile playability

Status: Proposed
Owner: naindev

## Problem

The game was built for a mouse and a keyboard. On a phone it loads and renders,
but it does not play:

- **Steering is absolute.** The pointer position maps straight onto the paddle,
  so the thumb sits exactly where the ball arrives and hides the impact point.
  Reaching a corner means sweeping the whole screen.
- **A gesture never ends.** The adapter listens for `pointerdown`, `pointermove`
  and `pointercancel`, but not for `pointerup`. Lifting the finger leaves
  `pointerActive` true and the paddle keeps chasing the last target for the rest
  of the match. The same leak happens on desktop when the mouse leaves the page.
- **A second touch hijacks the paddle.** Any pointer over the canvas steers, so
  tapping a HUD chip mid-rally yanks the paddle across the arena.
- **Portrait loses the arena.** The camera has a fixed vertical FOV, so a narrow
  viewport crops the horizontal field. The ball leaves the frame sideways.
- **The first seconds stutter.** Quality starts at `high` and the pixel ratio is
  capped at 2, so a phone renders four times the pixels it can afford until the
  adaptive step drops the level 2.5 s later.
- **The controls legend lists only keyboard, mouse and gamepad.** A touch player
  is told nothing.

## Scope

Touch steering, the pointer lifecycle, mobile framing, mobile first-frame cost,
and touch-sized hit targets. Match rules, AI difficulty and ball physics are out
of scope: the tuning in `docs/adr/0007` stays as it is.

## Requirements

### Steering

- **REQ-101** — When a touch pointer goes down on the arena, the system shall
  start a relative drag whose virtual cursor is seeded at the steered paddle's
  current normalised position.
- **REQ-102** — While a relative drag is active, the system shall move the
  virtual cursor by the pointer's displacement converted at a single world scale
  for both axes, so equal finger travel produces equal paddle travel regardless
  of axis, viewport size or pixel density.
- **REQ-103** — The system shall clamp the virtual cursor to `[-1, 1]` on each
  axis, and a drag that runs past a wall shall not accumulate hidden travel that
  has to be undone before the paddle moves back.
- **REQ-104** — When the steering pointer is released or cancelled, the system
  shall end the drag and report no pointer target.
- **REQ-105** — While a relative drag is active, the system shall ignore every
  other pointer until that drag ends.
- **REQ-106** — When the pointer is a mouse or a pen, the system shall keep the
  existing absolute mapping, and shall release steering when it leaves the arena.

### Framing and cost

- **REQ-107** — When the viewport is narrower than the reference aspect, the
  camera shall widen its vertical FOV so the horizontal field is preserved, up to
  a bounded maximum.
- **REQ-108** — When the primary pointer is coarse, the renderer shall start at
  `medium` quality and cap the device pixel ratio below the desktop cap.

### Interface

- **REQ-109** — When the primary pointer is coarse, the controls legend shall
  describe the touch controls first.
- **REQ-110** — When the primary pointer is coarse, every interactive control
  shall present a hit target of at least 44 CSS pixels on its shorter side.
- **REQ-111** — The system shall suppress the platform tap highlight, long-press
  callout and text selection over the arena and the HUD.

### Quality gate

- **REQ-112** — A full match played at a phone viewport shall produce no console
  output of any level.

## Out of scope

- Changing paddle speed, ball speed, rally gain or AI profiles.
- Portrait/landscape lock or an orientation prompt.
- Haptics, install prompt, offline support.
