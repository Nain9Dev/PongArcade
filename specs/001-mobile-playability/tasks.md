# 001 — Tasks

| ID | Task | Covers | Label | Done when |
| --- | --- | --- | --- | --- |
| T-101 | Pure `drag-steering` module in the application layer | REQ-101..103 | [A] | Unit tests cover seeding, isotropy, clamping and viewport independence |
| T-102 | Relative drag + pointer lifecycle in `browser-input` | REQ-101, 104, 105, 106 | [A] | Touch drags steer, release ends the gesture, extra pointers are ignored |
| T-103 | Wire the steered paddle origin and travel from `main.ts` | REQ-101 | [A] | A drag continues from the paddle's live position |
| T-104 | Aspect-aware FOV in `CameraRig` | REQ-107 | [A] | Portrait keeps the arena walls in frame; desktop framing unchanged |
| T-105 | Coarse-pointer quality and pixel ratio | REQ-108 | [A] | First frames on a phone render at `medium` and DPR <= 1.5 |
| T-106 | Touch entries in the controls legend | REQ-109 | [A] | Touch rows lead the legend on a coarse pointer |
| T-107 | Touch-sized hit targets and platform gesture suppression | REQ-110, 111 | [A] | Every control is >= 44 px; no tap highlight, callout or selection |
| T-108 | Play a full match at a phone viewport, both orientations | REQ-112 | [A] | No console output; rally playable end to end |

## Handoff

- Done: T-101..T-108.
- Verified: `npm run typecheck`, `npm test`, `npm run build`, and a match played
  at 375x812 and 812x375 with the console open.
- Next: none. Tune `DRAG_GAIN` if play testing asks for it.
- Blocked: nothing.
