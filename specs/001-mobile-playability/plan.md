# 001 — Plan

## Where the logic goes

Relative dragging is a policy, not browser plumbing: given a displacement and a
viewport it decides where the paddle should aim. It is therefore a pure module in
the application layer, next to `pointerIntent`, and the browser adapter only
feeds it events.

```
pointer events ──► browser-input (infrastructure)
                        │  displacement in CSS pixels
                        ▼
                   drag-steering (application, pure)
                        │  virtual cursor in [-1, 1]
                        ▼
                   pointerIntent (application, pure)
                        │  PaddleIntent
                        ▼
                   Match.step (domain)
```

The adapter keeps owning device arbitration; the cursor maths is testable in Node
with no DOM.

## Isotropy — the one decision worth stating

The paddle's usable travel is `maxX = 9 - paddleHalfWidth` by
`maxY = 5.5 - paddleHalfHeight`: the arena is roughly 1.6 times wider than it is
tall. Normalising each axis to `[-1, 1]` independently and applying the same
normalised delta to both would make a vertical flick cover 1.6 times more world
distance than the identical horizontal flick, which reads as a broken control.

So the drag converts pixels to **world units once**, at a single scale, and only
then normalises per axis:

```
world  = (pixels / reference) * (2 * maxX) * gain
cursor = { x: cx + world / maxX, y: cy + world / maxY }
```

`reference` is the shorter side of the viewport, so the same swipe covers the
same fraction of the arena on any screen, in either orientation, at any pixel
density. That is what makes the control scale.

## Gain

`gain = 1` means a drag across the shorter side of the viewport covers the full
lateral travel. On a 375 pt phone that is a 375 pt swipe to cross the arena and
~230 pt to cross it vertically. Ship `1.15` so a half-screen swipe reaches a
corner, and keep it a named constant so it can be tuned from one place.

## Pointer lifecycle

`pointerType` decides the mode per event, so a hybrid laptop works without a
setting:

| Type | Mode | Starts | Ends |
| --- | --- | --- | --- |
| `touch` | relative drag | `pointerdown` | `pointerup`, `pointercancel`, `lostpointercapture` |
| `mouse`, `pen` | absolute hover | `pointermove` | `pointerleave` |

The drag takes pointer capture, so a finger that slides over the HUD keeps
steering instead of dropping the rally.

## Camera

`CameraRig` gains an aspect-aware FOV. The profile FOV is read as the vertical
field at a 16:9 reference; below that aspect the vertical field grows so the
horizontal one holds, capped at 88° to keep the projection from stretching.
Above the reference aspect nothing changes, so no desktop view moves.

## Mobile cost

`main.ts` resolves `(pointer: coarse)` once at boot: quality starts at `medium`
instead of `high` and the pixel ratio cap drops from 2 to 1.5. The existing
adaptive step still climbs back to `high` after 12 s of headroom, so a fast phone
loses nothing permanently.

## Verification

- Unit tests in Node for every steering rule (seeding, isotropy, clamping, gesture
  end, viewport independence).
- A real match driven at a 375x812 viewport, then again in landscape, watching
  the console.
