/**
 * Relative drag steering.
 *
 * A touch player cannot use the absolute mapping a mouse gets: the finger would
 * sit exactly where the ball arrives. Instead the paddle carries on from where
 * it already is and follows the finger's *displacement*, so the hand stays out
 * of the way and small corrections stay small.
 *
 * The module is pure. It knows about screen pixels and paddle travel, nothing
 * about the DOM, which is what lets every rule below be tested in Node.
 */

/** A point in CSS pixels, relative to whatever element captured the gesture. */
export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

/** The steering surface, in CSS pixels. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
}

/** A position normalised to the paddle's usable travel, `[-1, 1]` per axis. */
export interface SteerCursor {
  readonly x: number;
  readonly y: number;
}

/** Half-travel of the paddle on each axis, in world units. */
export interface PaddleTravel {
  readonly x: number;
  readonly y: number;
}

export interface DragSteeringOptions {
  readonly travel: PaddleTravel;
  /**
   * Lateral travel covered by a drag across the viewport's shorter side, as a
   * multiple of the full travel. `1` means one full swipe crosses the arena.
   */
  readonly gain?: number;
}

export interface DragSteering {
  /** The virtual cursor, or `null` while no drag is in progress. */
  readonly cursor: SteerCursor | null;
  readonly active: boolean;
  /** Anchors a new drag on the paddle's current normalised position. */
  begin(origin: SteerCursor, point: ScreenPoint): void;
  /** Advances the cursor by the displacement since the previous point. */
  move(point: ScreenPoint, viewport: Viewport): void;
  end(): void;
}

export const DEFAULT_DRAG_GAIN = 1.15;

const clampUnit = (value: number): number => (value < -1 ? -1 : value > 1 ? 1 : value);

/**
 * A degenerate viewport (a detached element, a collapsed pane) would divide by
 * zero and send the cursor to infinity, so it is treated as "no movement".
 */
const referenceSpan = (viewport: Viewport): number => {
  const shorter = Math.min(viewport.width, viewport.height);
  return shorter > 0 ? shorter : 0;
};

export const createDragSteering = (options: DragSteeringOptions): DragSteering => {
  const gain = options.gain ?? DEFAULT_DRAG_GAIN;
  const travelX = options.travel.x;
  const travelY = options.travel.y;

  let cursor: SteerCursor | null = null;
  let last: ScreenPoint | null = null;

  return {
    get cursor(): SteerCursor | null {
      return cursor;
    },
    get active(): boolean {
      return cursor !== null;
    },

    begin(origin: SteerCursor, point: ScreenPoint): void {
      cursor = { x: clampUnit(origin.x), y: clampUnit(origin.y) };
      last = point;
    },

    move(point: ScreenPoint, viewport: Viewport): void {
      const previous = last;
      const current = cursor;
      if (previous === null || current === null) return;

      const reference = referenceSpan(viewport);
      if (reference === 0 || travelX <= 0 || travelY <= 0) {
        last = point;
        return;
      }

      // Pixels become world units once, at a single scale, and only then are
      // normalised per axis. Doing it the other way round would make a vertical
      // flick cover more world distance than the identical horizontal one,
      // because the arena is wider than it is tall.
      const worldPerPixel = ((2 * travelX) / reference) * gain;
      const worldDx = (point.x - previous.x) * worldPerPixel;
      // Screen y grows downwards; the arena's y grows upwards.
      const worldDy = (previous.y - point.y) * worldPerPixel;

      cursor = {
        x: clampUnit(current.x + worldDx / travelX),
        y: clampUnit(current.y + worldDy / travelY),
      };
      last = point;
    },

    end(): void {
      cursor = null;
      last = null;
    },
  };
};
