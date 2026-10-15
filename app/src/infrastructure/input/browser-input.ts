import type { ScreenPoint, SteerCursor, PaddleTravel } from '../../application/drag-steering';
import { createDragSteering } from '../../application/drag-steering';
import type { ActionId, InputFrame, InputPort } from '../../application/ports';
import type { PaddleIntent } from '../../domain/entities';

/**
 * Keyboard + pointer + touch + gamepad, merged into the single `InputFrame` the
 * application layer understands.
 *
 * Every device contributes additively and the sum is clamped, so a player can
 * switch between mouse and keyboard mid-rally without the adapter having to
 * arbitrate a "primary" device.
 *
 * Pointers are the exception, because a finger and a mouse want opposite things.
 * A mouse steers *absolutely*: the paddle goes where the cursor is, which is what
 * a player expects from a device that lives outside the screen. A finger steers
 * *relatively*: it lands anywhere and drags, so it never covers the ball. The
 * mode is chosen per event from `pointerType`, so a hybrid laptop needs no
 * setting.
 */

export type InputLayout = 'single' | 'versus';

/** Absolute pointer position over the arena, normalised to `[-1, 1]`. */
export interface PointerTarget {
  readonly x: number;
  readonly y: number;
}

export interface BrowserInput extends InputPort {
  readonly layout: InputLayout;
  /**
   * Decides who the arrow keys belong to. In `single` they mirror WASD onto the
   * near paddle; in `versus` they steer the far paddle instead.
   */
  setLayout(layout: InputLayout): void;
  /**
   * Where the pointer currently steers, for consumers that can do better than a
   * velocity intent because they also know the paddle's real position.
   * `null` whenever the pointer is not the active steering device.
   */
  readonly pointerTarget: PointerTarget | null;
}

export interface BrowserInputOptions {
  readonly target: HTMLElement;
  readonly layout?: InputLayout;
  /**
   * Pointer speed, in normalised half-spans per second, that maps to a
   * full-deflection intent. The default matches a paddle crossing its usable
   * travel at top speed, so a 1:1 hand movement saturates the paddle exactly.
   */
  readonly pointerSensitivity?: number;
  /**
   * Half-travel of the steered paddle on each axis, in world units. A relative
   * drag needs it to turn finger pixels into paddle travel at one scale for both
   * axes.
   */
  readonly travel: PaddleTravel;
  /** Lateral travel covered by a drag across the viewport's shorter side. */
  readonly dragGain?: number;
  /**
   * Where the steered paddle currently sits, normalised to its travel. A drag
   * anchors here so the paddle carries on from its own position instead of
   * teleporting under the finger.
   */
  readonly steeredPaddle: () => SteerCursor;
}

type AxisName = 'x' | 'y';

/** Which mapping the live pointer gesture is using, if any. */
type SteerMode = 'absolute' | 'relative';

interface AxisBinding {
  readonly axis: AxisName;
  readonly sign: number;
}

interface MutableIntent {
  x: number;
  y: number;
}

const NEAR_KEYS: ReadonlyMap<string, AxisBinding> = new Map([
  ['KeyW', { axis: 'y', sign: 1 }],
  ['KeyS', { axis: 'y', sign: -1 }],
  ['KeyA', { axis: 'x', sign: -1 }],
  ['KeyD', { axis: 'x', sign: 1 }],
]);

const FAR_KEYS: ReadonlyMap<string, AxisBinding> = new Map([
  ['KeyI', { axis: 'y', sign: 1 }],
  ['KeyK', { axis: 'y', sign: -1 }],
  ['KeyJ', { axis: 'x', sign: -1 }],
  ['KeyL', { axis: 'x', sign: 1 }],
]);

const ARROW_KEYS: ReadonlyMap<string, AxisBinding> = new Map([
  ['ArrowUp', { axis: 'y', sign: 1 }],
  ['ArrowDown', { axis: 'y', sign: -1 }],
  ['ArrowLeft', { axis: 'x', sign: -1 }],
  ['ArrowRight', { axis: 'x', sign: 1 }],
]);

/**
 * Escape deliberately raises both `pause` and `back`: the same physical key
 * means "pause" in play and "go back" in a menu, and only the presentation layer
 * knows which screen is up.
 */
const ACTION_KEYS: ReadonlyMap<string, readonly ActionId[]> = new Map<string, readonly ActionId[]>([
  ['Space', ['pause']],
  ['Escape', ['pause', 'back']],
  ['Enter', ['confirm']],
  ['NumpadEnter', ['confirm']],
  ['KeyR', ['restart']],
  ['KeyC', ['cycle-camera']],
  ['KeyM', ['toggle-audio']],
]);

/** Keys the browser would otherwise use to scroll the page. */
const SCROLL_KEYS: ReadonlySet<string> = new Set([
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

const GAMEPAD_BUTTON_ACTIONS: ReadonlyMap<number, ActionId> = new Map<number, ActionId>([
  [0, 'confirm'],
  [1, 'back'],
  [9, 'pause'],
]);

/**
 * Elements that own their own gesture. A tap on the pause chip must not also
 * yank the paddle, and the shell sits inside the same pointer target.
 */
const UI_CONTROLS = 'button, a, input, select, textarea, [role="button"], [contenteditable]';

const GAMEPAD_DEAD_ZONE = 0.15;
const DEFAULT_POINTER_SENSITIVITY = 4;
/** How long a pointer intent survives without a new move event, in seconds. */
const POINTER_IDLE_TIMEOUT = 0.05;
/** Exponential smoothing on pointer velocity; tames per-event jitter. */
const POINTER_SMOOTHING = 0.4;

const clampUnit = (value: number): number => (value < -1 ? -1 : value > 1 ? 1 : value);

const isEditable = (node: EventTarget | null): boolean => {
  if (!(node instanceof HTMLElement)) return false;
  if (node.isContentEditable) return true;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

/** True when the event landed on a control that handles its own pointer. */
const isUiControl = (node: EventTarget | null): boolean =>
  node instanceof Element && node.closest(UI_CONTROLS) !== null;

const applyBindings = (
  held: ReadonlySet<string>,
  bindings: ReadonlyMap<string, AxisBinding>,
  out: MutableIntent,
): void => {
  for (const [code, binding] of bindings) {
    if (!held.has(code)) continue;
    if (binding.axis === 'x') out.x += binding.sign;
    else out.y += binding.sign;
  }
};

/** Radial dead zone: preserves stick direction instead of squaring off the axes. */
const applyDeadZone = (x: number, y: number): PaddleIntent => {
  const magnitude = Math.hypot(x, y);
  if (magnitude < GAMEPAD_DEAD_ZONE) return { x: 0, y: 0 };
  const rescaled = Math.min(1, (magnitude - GAMEPAD_DEAD_ZONE) / (1 - GAMEPAD_DEAD_ZONE));
  return { x: (x / magnitude) * rescaled, y: (y / magnitude) * rescaled };
};

const readAxis = (pad: Gamepad, index: number): number => pad.axes[index] ?? 0;

const connectedGamepads = (): readonly Gamepad[] => {
  const getter = navigator.getGamepads?.bind(navigator);
  if (getter === undefined) return [];
  const pads: Gamepad[] = [];
  for (const pad of getter()) {
    if (pad !== null && pad.connected) pads.push(pad);
  }
  return pads;
};

export const createBrowserInput = (options: BrowserInputOptions): BrowserInput => {
  const { target, steeredPaddle } = options;
  const sensitivity = options.pointerSensitivity ?? DEFAULT_POINTER_SENSITIVITY;
  const drag = createDragSteering({
    travel: options.travel,
    ...(options.dragGain !== undefined ? { gain: options.dragGain } : {}),
  });

  let layout: InputLayout = options.layout ?? 'single';
  let pointerActive = false;
  let pointerTarget: PointerTarget | null = null;
  let steerMode: SteerMode | null = null;
  let steerPointerId: number | null = null;
  let disposed = false;

  const held = new Set<string>();
  const pendingActions = new Set<ActionId>();
  /** Buttons already reported as pressed, per gamepad index, for edge detection. */
  const gamepadHeld = new Map<number, Set<number>>();

  let pointerVelocityX = 0;
  let pointerVelocityY = 0;
  let lastPointerAt = 0;

  const resetPointer = (): void => {
    drag.end();
    steerMode = null;
    steerPointerId = null;
    pointerActive = false;
    pointerTarget = null;
    pointerVelocityX = 0;
    pointerVelocityY = 0;
  };

  /**
   * Capture keeps a finger steering even once it slides over the HUD. It throws
   * if the pointer is already gone, which is a race, not a failure.
   */
  const capture = (pointerId: number): void => {
    try {
      target.setPointerCapture(pointerId);
    } catch {
      // The gesture ended before we could claim it; the up handler still fires.
    }
  };

  const releaseCapture = (pointerId: number): void => {
    try {
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    } catch {
      // Already released by the browser.
    }
  };

  /** `null` while the element has no layout, which makes every mapping degenerate. */
  const surface = (): DOMRect | null => {
    const rect = target.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : null;
  };

  const localPoint = (event: PointerEvent, rect: DOMRect): ScreenPoint => ({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    if (isEditable(event.target)) return;
    const code = event.code;
    const isBound =
      NEAR_KEYS.has(code) || FAR_KEYS.has(code) || ARROW_KEYS.has(code) || ACTION_KEYS.has(code);
    if (!isBound) return;

    if (SCROLL_KEYS.has(code)) event.preventDefault();

    // The keyboard takes over steering, so the stale pointer intent must go.
    if (pointerActive) resetPointer();

    // Auto-repeat is a single physical press and must not re-fire an action.
    if (!event.repeat) {
      const actions = ACTION_KEYS.get(code);
      if (actions !== undefined) for (const action of actions) pendingActions.add(action);
    }
    held.add(code);
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    held.delete(event.code);
  };

  /** A key held while the window loses focus never emits its keyup. */
  const onBlur = (): void => {
    held.clear();
    gamepadHeld.clear();
    resetPointer();
  };

  /** Absolute mapping: the paddle goes wherever the cursor is. */
  const trackPointer = (event: PointerEvent, rect: DOMRect): void => {
    const x = clampUnit(((event.clientX - rect.left) / rect.width) * 2 - 1);
    // Screen y grows downwards; the arena's y grows upwards.
    const y = clampUnit(1 - ((event.clientY - rect.top) / rect.height) * 2);

    const now = performance.now();
    const previous = pointerTarget;
    const dt = (now - lastPointerAt) / 1000;
    if (previous !== null && dt > 0 && dt < POINTER_IDLE_TIMEOUT * 4) {
      const vx = (x - previous.x) / dt / sensitivity;
      const vy = (y - previous.y) / dt / sensitivity;
      pointerVelocityX += (vx - pointerVelocityX) * POINTER_SMOOTHING;
      pointerVelocityY += (vy - pointerVelocityY) * POINTER_SMOOTHING;
    }

    lastPointerAt = now;
    pointerTarget = { x, y };
    pointerActive = true;
    steerMode = 'absolute';
    steerPointerId = event.pointerId;
  };

  const onPointerMove = (event: PointerEvent): void => {
    const rect = surface();
    if (rect === null) return;

    if (steerMode === 'relative') {
      if (event.pointerId !== steerPointerId) return;
      drag.move(localPoint(event, rect), { width: rect.width, height: rect.height });
      pointerTarget = drag.cursor;
      pointerActive = drag.active;
      return;
    }

    // A finger that never opened a drag (it started on a HUD control) must not
    // acquire steering halfway through its own gesture.
    if (event.pointerType === 'touch') return;
    trackPointer(event, rect);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (isUiControl(event.target)) return;
    const rect = surface();
    if (rect === null) return;

    if (event.pointerType === 'touch') {
      // One finger steers; every other touch belongs to the HUD.
      if (steerMode === 'relative') return;
      resetPointer();
      steerMode = 'relative';
      steerPointerId = event.pointerId;
      drag.begin(steeredPaddle(), localPoint(event, rect));
      pointerTarget = drag.cursor;
      pointerActive = drag.active;
      capture(event.pointerId);
      return;
    }

    // A click has no preceding move on a fresh pointer, so seed the target
    // without inventing a velocity for it.
    lastPointerAt = performance.now();
    pointerVelocityX = 0;
    pointerVelocityY = 0;
    pointerTarget = null;
    trackPointer(event, rect);
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (steerMode !== 'relative' || event.pointerId !== steerPointerId) return;
    releaseCapture(event.pointerId);
    resetPointer();
  };

  const onPointerCancel = (event: PointerEvent): void => {
    if (steerPointerId !== null && event.pointerId !== steerPointerId) return;
    releaseCapture(event.pointerId);
    resetPointer();
  };

  /** The browser can revoke capture on its own; the drag has to end with it. */
  const onLostPointerCapture = (event: PointerEvent): void => {
    if (steerMode === 'relative' && event.pointerId === steerPointerId) resetPointer();
  };

  /** A cursor that leaves the arena stops steering it. Touch ends via `up`. */
  const onPointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' || steerMode === 'relative') return;
    resetPointer();
  };

  /** Pointer events already carry the touch; this only stops the page scrolling. */
  const onTouchMove = (event: TouchEvent): void => {
    event.preventDefault();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  target.addEventListener('pointermove', onPointerMove);
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointerup', onPointerUp);
  target.addEventListener('pointercancel', onPointerCancel);
  target.addEventListener('lostpointercapture', onLostPointerCapture);
  target.addEventListener('pointerleave', onPointerLeave);
  target.addEventListener('touchmove', onTouchMove, { passive: false });

  const sampleGamepads = (near: MutableIntent, far: MutableIntent): void => {
    const pads = connectedGamepads();
    if (pads.length === 0) {
      if (gamepadHeld.size > 0) gamepadHeld.clear();
      return;
    }

    const primary = pads[0];
    const secondary = pads[1];

    if (primary !== undefined) {
      const left = applyDeadZone(readAxis(primary, 0), -readAxis(primary, 1));
      near.x += left.x;
      near.y += left.y;
      // Without a second pad, the right stick is the only way to play versus.
      if (secondary === undefined) {
        const right = applyDeadZone(readAxis(primary, 2), -readAxis(primary, 3));
        far.x += right.x;
        far.y += right.y;
      }
    }

    if (secondary !== undefined) {
      const left = applyDeadZone(readAxis(secondary, 0), -readAxis(secondary, 1));
      far.x += left.x;
      far.y += left.y;
    }

    const seen = new Set<number>();
    for (const pad of pads) {
      seen.add(pad.index);
      let previous = gamepadHeld.get(pad.index);
      if (previous === undefined) {
        previous = new Set<number>();
        gamepadHeld.set(pad.index, previous);
      }
      for (const [button, action] of GAMEPAD_BUTTON_ACTIONS) {
        const pressed = pad.buttons[button]?.pressed ?? false;
        if (pressed && !previous.has(button)) pendingActions.add(action);
        if (pressed) previous.add(button);
        else previous.delete(button);
      }
    }
    for (const index of gamepadHeld.keys()) {
      if (!seen.has(index)) gamepadHeld.delete(index);
    }
  };

  const sample = (): InputFrame => {
    const near: MutableIntent = { x: 0, y: 0 };
    const far: MutableIntent = { x: 0, y: 0 };

    applyBindings(held, NEAR_KEYS, near);
    applyBindings(held, FAR_KEYS, far);
    applyBindings(held, ARROW_KEYS, layout === 'versus' ? far : near);

    // A relative drag is purely positional: the consumer resolves the cursor
    // against the live paddle, so adding a velocity on top would double-count it.
    if (pointerActive && steerMode === 'absolute') {
      const idle = (performance.now() - lastPointerAt) / 1000;
      if (idle > POINTER_IDLE_TIMEOUT) {
        pointerVelocityX = 0;
        pointerVelocityY = 0;
      }
      near.x += pointerVelocityX;
      near.y += pointerVelocityY;
    }

    sampleGamepads(near, far);

    const actions = [...pendingActions];
    pendingActions.clear();

    return {
      near: { x: clampUnit(near.x), y: clampUnit(near.y) },
      far: { x: clampUnit(far.x), y: clampUnit(far.y) },
      actions,
    };
  };

  return {
    sample,
    get pointerActive(): boolean {
      return pointerActive;
    },
    get pointerTarget(): PointerTarget | null {
      return pointerActive ? pointerTarget : null;
    },
    get layout(): InputLayout {
      return layout;
    },
    setLayout(next: InputLayout): void {
      if (next === layout) return;
      layout = next;
      // Arrow keys change owner; anything still down would leak to the new one.
      for (const code of ARROW_KEYS.keys()) held.delete(code);
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerCancel);
      target.removeEventListener('lostpointercapture', onLostPointerCapture);
      target.removeEventListener('pointerleave', onPointerLeave);
      target.removeEventListener('touchmove', onTouchMove);
      held.clear();
      pendingActions.clear();
      gamepadHeld.clear();
      resetPointer();
    },
  };
};
