import { describe, expect, it } from 'vitest';

import { createDragSteering, DEFAULT_DRAG_GAIN } from '../../app/src/application/drag-steering';

/** Roughly the real arena: 9 x 5.5 half-spans minus the paddle's own half-size. */
const TRAVEL = { x: 7.4, y: 4.2 };
const PHONE = { width: 375, height: 812 };
const LANDSCAPE = { width: 812, height: 375 };

const steering = (gain = 1) => createDragSteering({ travel: TRAVEL, gain });

describe('createDragSteering', () => {
  it('is idle until a drag begins', () => {
    const drag = steering();
    expect(drag.active).toBe(false);
    expect(drag.cursor).toBeNull();
  });

  it('anchors the cursor on the paddle instead of on the finger', () => {
    const drag = steering();
    drag.begin({ x: -0.6, y: 0.25 }, { x: 300, y: 700 });
    // The finger landed bottom-right; the paddle has not moved.
    expect(drag.cursor).toEqual({ x: -0.6, y: 0.25 });
  });

  it('moves the paddle by the finger displacement, not to its position', () => {
    const drag = steering();
    drag.begin({ x: 0, y: 0 }, { x: 100, y: 400 });
    drag.move({ x: 200, y: 400 }, PHONE);

    // 100 px over a 375 px reference, at gain 1, is 100/375 of the full lateral
    // travel: 2 * 7.4 world units, normalised back over 7.4.
    const expected = ((100 / 375) * (2 * TRAVEL.x)) / TRAVEL.x;
    expect(drag.cursor?.x).toBeCloseTo(expected, 6);
    expect(drag.cursor?.y).toBe(0);
  });

  it('inverts the vertical axis, because screen y grows downwards', () => {
    const drag = steering();
    drag.begin({ x: 0, y: 0 }, { x: 100, y: 400 });
    drag.move({ x: 100, y: 300 }, PHONE);
    expect(drag.cursor?.y).toBeGreaterThan(0);
  });

  it('covers the same world distance for the same finger travel on both axes', () => {
    const horizontal = steering();
    horizontal.begin({ x: 0, y: 0 }, { x: 100, y: 400 });
    horizontal.move({ x: 180, y: 400 }, PHONE);

    const vertical = steering();
    vertical.begin({ x: 0, y: 0 }, { x: 100, y: 400 });
    vertical.move({ x: 100, y: 320 }, PHONE);

    // Equal pixel travel must mean equal world travel, which is the normalised
    // value scaled back by each axis' own half-span.
    const worldX = (horizontal.cursor?.x ?? 0) * TRAVEL.x;
    const worldY = (vertical.cursor?.y ?? 0) * TRAVEL.y;
    expect(worldY).toBeCloseTo(worldX, 6);
  });

  it('covers the same fraction of the arena in portrait and in landscape', () => {
    // The reference is the shorter side, so rotating the phone must not change
    // how far a given swipe carries the paddle.
    const portrait = steering();
    portrait.begin({ x: 0, y: 0 }, { x: 0, y: 0 });
    portrait.move({ x: 120, y: 0 }, PHONE);

    const landscape = steering();
    landscape.begin({ x: 0, y: 0 }, { x: 0, y: 0 });
    landscape.move({ x: 120, y: 0 }, LANDSCAPE);

    expect(landscape.cursor?.x).toBeCloseTo(portrait.cursor?.x ?? 0, 6);
  });

  it('scales the swing with the gain', () => {
    const slow = steering(1);
    slow.begin({ x: 0, y: 0 }, { x: 0, y: 0 });
    slow.move({ x: 60, y: 0 }, PHONE);

    const quick = steering(2);
    quick.begin({ x: 0, y: 0 }, { x: 0, y: 0 });
    quick.move({ x: 60, y: 0 }, PHONE);

    expect(quick.cursor?.x).toBeCloseTo((slow.cursor?.x ?? 0) * 2, 6);
  });

  it('clamps at the wall without banking travel that has to be undone', () => {
    const drag = steering();
    drag.begin({ x: 0.9, y: 0 }, { x: 0, y: 0 });
    // A long drag well past the right wall.
    drag.move({ x: 900, y: 0 }, PHONE);
    expect(drag.cursor?.x).toBe(1);

    // One reference span back must leave the wall immediately, not after
    // repaying the overshoot.
    drag.move({ x: 900 - 375, y: 0 }, PHONE);
    expect(drag.cursor?.x).toBeCloseTo(-1, 6);
  });

  it('clamps the seeded origin too', () => {
    const drag = steering();
    drag.begin({ x: -4, y: 9 }, { x: 0, y: 0 });
    expect(drag.cursor).toEqual({ x: -1, y: 1 });
  });

  it('ignores movement once the drag has ended', () => {
    const drag = steering();
    drag.begin({ x: 0, y: 0 }, { x: 0, y: 0 });
    drag.end();
    drag.move({ x: 300, y: 0 }, PHONE);

    expect(drag.active).toBe(false);
    expect(drag.cursor).toBeNull();
  });

  it('ignores movement before a drag has begun', () => {
    const drag = steering();
    drag.move({ x: 300, y: 0 }, PHONE);
    expect(drag.cursor).toBeNull();
  });

  it('survives a collapsed viewport instead of diverging', () => {
    const drag = steering();
    drag.begin({ x: 0.2, y: -0.1 }, { x: 0, y: 0 });
    drag.move({ x: 50, y: 50 }, { width: 0, height: 0 });
    expect(drag.cursor).toEqual({ x: 0.2, y: -0.1 });
  });

  it('ships a gain that crosses the arena in half a screen', () => {
    const drag = createDragSteering({ travel: TRAVEL });
    drag.begin({ x: -1, y: 0 }, { x: 0, y: 0 });
    drag.move({ x: PHONE.width / 2, y: 0 }, PHONE);
    // Half a swipe must carry the paddle from one wall past the middle.
    expect(drag.cursor?.x).toBeGreaterThan(0);
    expect(DEFAULT_DRAG_GAIN).toBeGreaterThan(1);
  });
});
