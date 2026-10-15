import * as THREE from 'three';

import type { Arena, Side } from '../../domain/arena';
import { paddlePlaneZ, sideSign } from '../../domain/arena';
import type { CameraMode } from '../../application/ports';

export interface CameraFocus {
  /** Position of the paddle the camera belongs to. */
  readonly paddleX: number;
  readonly paddleY: number;
  readonly ball: THREE.Vector3;
  /** Ball speed normalised against the rules' maximum, in `[0, 1]`. */
  readonly speed01: number;
}

interface ModeProfile {
  readonly fov: number;
  /** Exponential easing rate for the eye position, per second. */
  readonly positionRate: number;
  readonly targetRate: number;
  /** Extra degrees of FOV at maximum ball speed. */
  readonly fovKick: number;
}

const PROFILES: Readonly<Record<CameraMode, ModeProfile>> = {
  chase: { fov: 62, positionRate: 7, targetRate: 9, fovKick: 9 },
  cockpit: { fov: 56, positionRate: 13, targetRate: 14, fovKick: 11 },
  broadcast: { fov: 52, positionRate: 2.4, targetRate: 3.2, fovKick: 3 },
};

/** Frame-rate independent exponential approach factor. */
const approach = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);

/** The aspect the profile FOVs above were tuned at. */
const REFERENCE_ASPECT = 16 / 9;

/** Past this the projection stretches the arena more than it reveals of it. */
const MAX_VERTICAL_FOV = 88;

/**
 * A perspective camera fixes its *vertical* field, so a narrow viewport crops the
 * horizontal one — and this arena is far wider than it is tall. On a phone held
 * upright that puts the side walls off screen and the ball leaves the frame
 * sideways with no warning.
 *
 * Below the reference aspect the vertical field is widened by exactly as much as
 * it takes to hold the horizontal field the profile was tuned for. At or above
 * it nothing changes, so no desktop view moves.
 */
const verticalFovFor = (baseFov: number, aspect: number): number => {
  if (!(aspect > 0) || aspect >= REFERENCE_ASPECT) return baseFov;
  const halfVertical = THREE.MathUtils.degToRad(baseFov) * 0.5;
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * REFERENCE_ASPECT);
  const widened = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(halfHorizontal) / aspect));
  return Math.min(widened, MAX_VERTICAL_FOV);
};

/**
 * Drives the camera for all three view modes, including damped shake and the
 * speed-driven FOV kick.
 *
 * Every mode is expressed in "own-side space": positions are computed for the
 * near end and multiplied by `sideSign(perspective)`, so mirroring the rig for
 * two-player and demo modes is a single sign flip rather than a second set of
 * hand-tuned numbers.
 */
export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;

  private mode: CameraMode = 'chase';
  private perspective: Side = 'near';
  private motionScale = 1;

  private readonly arena: Arena;
  private readonly paddleZ: number;
  private aspect: number;

  private readonly eye = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly desiredEye = new THREE.Vector3();
  private readonly desiredTarget = new THREE.Vector3();
  private readonly shakeOffset = new THREE.Vector3();

  private trauma = 0;
  private orbit = 0;
  private elapsed = 0;
  private fov: number;
  private initialised = false;

  constructor(arena: Arena, aspect: number) {
    this.arena = arena;
    this.paddleZ = paddlePlaneZ(arena);
    this.aspect = aspect;
    this.fov = verticalFovFor(PROFILES.chase.fov, aspect);
    this.camera = new THREE.PerspectiveCamera(this.fov, aspect, 0.1, arena.halfDepth * 12);
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  setPerspective(side: Side): void {
    this.perspective = side;
  }

  /** `0` damps shake and orbit to almost nothing for reduced-motion users. */
  setMotionScale(scale: number): void {
    this.motionScale = THREE.MathUtils.clamp(scale, 0, 1);
  }

  /** Adds trauma; the visible shake is quadratic in trauma, so hits punch. */
  shake(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount * this.motionScale);
  }

  setAspect(aspect: number): void {
    this.aspect = aspect;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, focus: CameraFocus): void {
    this.elapsed += dt;
    this.orbit += dt * 0.13 * (0.25 + 0.75 * this.motionScale);
    this.trauma = Math.max(0, this.trauma - dt * 1.7);

    const profile = PROFILES[this.mode];
    this.computeFraming(focus);

    const targetFov =
      verticalFovFor(profile.fov, this.aspect) +
      focus.speed01 * focus.speed01 * profile.fovKick * this.motionScale;

    if (!this.initialised) {
      this.eye.copy(this.desiredEye);
      this.target.copy(this.desiredTarget);
      // Opening on a phone must not zoom out over the first second.
      this.fov = targetFov;
      this.initialised = true;
    } else {
      this.eye.lerp(this.desiredEye, approach(profile.positionRate, dt));
      this.target.lerp(this.desiredTarget, approach(profile.targetRate, dt));
    }

    const amplitude = this.trauma * this.trauma * this.motionScale;
    const t = this.elapsed;
    this.shakeOffset.set(
      Math.sin(t * 47.3) * 0.9 + Math.sin(t * 23.1) * 0.5,
      Math.sin(t * 39.7 + 1.7) * 0.8 + Math.sin(t * 17.3) * 0.4,
      Math.sin(t * 31.1 + 3.1) * 0.45,
    );
    this.shakeOffset.multiplyScalar(amplitude * 0.6);

    this.camera.position.copy(this.eye).add(this.shakeOffset);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.target);
    this.camera.rotateZ(Math.sin(t * 29.4) * amplitude * 0.05);

    this.fov += (targetFov - this.fov) * approach(5, dt);
    if (Math.abs(this.camera.fov - this.fov) > 1e-3) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  private computeFraming(focus: CameraFocus): void {
    const sign = sideSign(this.perspective);
    const { halfWidth, halfHeight, halfDepth } = this.arena;
    const px = focus.paddleX;
    const py = focus.paddleY;
    const ball = focus.ball;

    switch (this.mode) {
      case 'chase': {
        this.desiredEye.set(
          px * 0.55,
          halfHeight * 0.62 + py * 0.45,
          sign * (halfDepth + halfWidth * 0.95),
        );
        this.desiredTarget.set(
          px * 0.18 + ball.x * 0.3,
          py * 0.2 + ball.y * 0.28,
          -sign * halfDepth * 0.35,
        );
        break;
      }
      case 'cockpit': {
        this.desiredEye.set(px, py + halfHeight * 0.08, sign * (this.paddleZ + 1.5));
        this.desiredTarget.set(
          px + (ball.x - px) * 0.55,
          py + (ball.y - py) * 0.5,
          -sign * halfDepth * 0.55,
        );
        break;
      }
      case 'broadcast': {
        const radius = halfDepth * 1.35;
        this.desiredEye.set(
          Math.cos(this.orbit) * radius,
          halfHeight * 2.4,
          Math.sin(this.orbit) * halfDepth * 0.35,
        );
        this.desiredTarget.set(ball.x * 0.12, ball.y * 0.12, ball.z * 0.15);
        break;
      }
    }
  }
}
