import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBrowserInput } from '../../../app/src/infrastructure/input/browser-input';
import type { BrowserInput } from '../../../app/src/infrastructure/input/browser-input';

/**
 * The adapter touches a narrow, well-known slice of the DOM: a listener
 * registry, a bounding rect and pointer capture. Standing that up by hand keeps
 * the pointer lifecycle under test in plain Node, which is where the rules that
 * actually bite live — a gesture that never ends, a second finger stealing the
 * paddle, a tap on the HUD yanking it across the arena.
 */

type Listener = (event: unknown) => void;

const VIEWPORT = { width: 375, height: 812 };

class FakeNode {
  constructor(private readonly control: boolean) {}
  closest(_selector: string): FakeNode | null {
    return this.control ? this : null;
  }
}

class FakeElement {
  readonly listeners = new Map<string, Set<Listener>>();
  readonly captured = new Set<number>();

  addEventListener(type: string, listener: Listener): void {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  getBoundingClientRect(): DOMRect {
    return { left: 0, top: 0, ...VIEWPORT } as DOMRect;
  }

  setPointerCapture(id: number): void {
    this.captured.add(id);
  }

  hasPointerCapture(id: number): boolean {
    return this.captured.has(id);
  }

  releasePointerCapture(id: number): void {
    this.captured.delete(id);
  }

  dispatch(type: string, event: Record<string, unknown>): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }
}

interface PointerInit {
  readonly id?: number;
  readonly type?: 'touch' | 'mouse' | 'pen';
  readonly x?: number;
  readonly y?: number;
  /** Set for a pointer that landed on a HUD control rather than the arena. */
  readonly onControl?: boolean;
}

const pointer = (init: PointerInit = {}): Record<string, unknown> => ({
  pointerId: init.id ?? 1,
  pointerType: init.type ?? 'touch',
  clientX: init.x ?? 0,
  clientY: init.y ?? 0,
  target: new FakeNode(init.onControl === true),
});

/** Paddle half-travel, roughly the real arena minus the paddle's own size. */
const TRAVEL = { x: 7.4, y: 4.2 };

describe('createBrowserInput pointer lifecycle', () => {
  let element: FakeElement;
  let input: BrowserInput;
  let paddle: { x: number; y: number };
  const windowListeners = new Map<string, Set<Listener>>();

  beforeEach(() => {
    element = new FakeElement();
    paddle = { x: 0, y: 0 };
    windowListeners.clear();

    // `navigator` is a read-only getter on modern Node, so these go through
    // vitest's stubbing rather than a plain assignment.
    vi.stubGlobal('window', {
      addEventListener: (type: string, listener: Listener) => {
        const set = windowListeners.get(type) ?? new Set<Listener>();
        set.add(listener);
        windowListeners.set(type, set);
      },
      removeEventListener: (type: string, listener: Listener) => {
        windowListeners.get(type)?.delete(listener);
      },
    });
    vi.stubGlobal('Element', FakeNode);
    vi.stubGlobal('HTMLElement', FakeNode);
    vi.stubGlobal('navigator', { getGamepads: () => [] });

    input = createBrowserInput({
      target: element as unknown as HTMLElement,
      travel: TRAVEL,
      dragGain: 1,
      steeredPaddle: () => paddle,
    });
  });

  afterEach(() => {
    input.dispose();
    vi.unstubAllGlobals();
  });

  const fireWindow = (type: string, event: Record<string, unknown>): void => {
    for (const listener of [...(windowListeners.get(type) ?? [])]) listener(event);
  };

  describe('touch', () => {
    it('steers relatively from the paddle, not to the finger', () => {
      paddle = { x: -0.5, y: 0 };
      element.dispatch('pointerdown', pointer({ x: 300, y: 700 }));

      // The finger landed far from the paddle; the paddle must not jump to it.
      expect(input.pointerTarget).toEqual({ x: -0.5, y: 0 });

      element.dispatch('pointermove', pointer({ x: 300 + VIEWPORT.width / 2, y: 700 }));
      // Half a reference span at gain 1 is half the full lateral travel.
      expect(input.pointerTarget?.x).toBeCloseTo(0.5, 6);
    });

    it('takes pointer capture so a finger over the HUD keeps steering', () => {
      element.dispatch('pointerdown', pointer({ id: 7 }));
      expect(element.captured.has(7)).toBe(true);
    });

    it('releases steering when the finger lifts', () => {
      element.dispatch('pointerdown', pointer({ x: 100, y: 100 }));
      element.dispatch('pointermove', pointer({ x: 160, y: 100 }));
      expect(input.pointerActive).toBe(true);

      element.dispatch('pointerup', pointer({ x: 160, y: 100 }));

      expect(input.pointerActive).toBe(false);
      expect(input.pointerTarget).toBeNull();
      expect(element.captured.size).toBe(0);
    });

    it('releases steering when the gesture is cancelled', () => {
      element.dispatch('pointerdown', pointer({}));
      element.dispatch('pointercancel', pointer({}));
      expect(input.pointerActive).toBe(false);
    });

    it('releases steering when the browser revokes capture', () => {
      element.dispatch('pointerdown', pointer({ id: 3 }));
      element.dispatch('lostpointercapture', pointer({ id: 3 }));
      expect(input.pointerActive).toBe(false);
    });

    it('ignores a second finger while a drag is running', () => {
      element.dispatch('pointerdown', pointer({ id: 1, x: 100, y: 100 }));
      element.dispatch('pointermove', pointer({ id: 1, x: 160, y: 100 }));
      const steered = input.pointerTarget;

      element.dispatch('pointerdown', pointer({ id: 2, x: 20, y: 780 }));
      element.dispatch('pointermove', pointer({ id: 2, x: 320, y: 780 }));

      expect(input.pointerTarget).toEqual(steered);
    });

    it('keeps steering after the second finger lifts', () => {
      element.dispatch('pointerdown', pointer({ id: 1, x: 100, y: 100 }));
      element.dispatch('pointerdown', pointer({ id: 2, x: 20, y: 780 }));
      element.dispatch('pointerup', pointer({ id: 2, x: 20, y: 780 }));

      expect(input.pointerActive).toBe(true);
    });

    it('does not steer when the touch starts on a HUD control', () => {
      element.dispatch('pointerdown', pointer({ onControl: true, x: 40, y: 40 }));
      expect(input.pointerActive).toBe(false);

      // Nor may the same gesture acquire steering halfway through.
      element.dispatch('pointermove', pointer({ x: 300, y: 40 }));
      expect(input.pointerActive).toBe(false);
    });

    it('reports no velocity, because the drag is resolved positionally', () => {
      element.dispatch('pointerdown', pointer({ x: 100, y: 400 }));
      element.dispatch('pointermove', pointer({ x: 340, y: 200 }));

      const frame = input.sample();
      expect(frame.near).toEqual({ x: 0, y: 0 });
      expect(input.pointerTarget).not.toBeNull();
    });

    it('hands steering to the keyboard when a key is pressed', () => {
      element.dispatch('pointerdown', pointer({}));
      fireWindow('keydown', { code: 'KeyA', repeat: false, target: null, preventDefault: () => {} });

      expect(input.pointerActive).toBe(false);
      expect(input.sample().near.x).toBe(-1);
    });

    it('drops the gesture when the window loses focus', () => {
      element.dispatch('pointerdown', pointer({}));
      fireWindow('blur', {});
      expect(input.pointerActive).toBe(false);
    });
  });

  describe('mouse', () => {
    it('keeps the absolute mapping', () => {
      element.dispatch('pointermove', pointer({ type: 'mouse', x: 375, y: 0 }));
      // Bottom-right of the rect maps to the top-right of the arena.
      expect(input.pointerTarget).toEqual({ x: 1, y: 1 });
    });

    it('releases steering when the cursor leaves the arena', () => {
      element.dispatch('pointermove', pointer({ type: 'mouse', x: 200, y: 400 }));
      expect(input.pointerActive).toBe(true);

      element.dispatch('pointerleave', pointer({ type: 'mouse', x: 200, y: 400 }));

      expect(input.pointerActive).toBe(false);
      expect(input.pointerTarget).toBeNull();
    });

    it('does not let a leaving cursor cancel a running touch drag', () => {
      element.dispatch('pointerdown', pointer({ id: 1, type: 'touch', x: 100, y: 100 }));
      element.dispatch('pointerleave', pointer({ id: 9, type: 'mouse', x: 0, y: 0 }));
      expect(input.pointerActive).toBe(true);
    });
  });
});
