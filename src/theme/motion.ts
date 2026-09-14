import { cubicBezier } from '@rootnative/inertia'
import type { TransitionConfig } from '@rootnative/inertia'

/**
 * Motion tokens for the Survey theme, registered once on
 * `<MotionConfig transitions>` and used by name everywhere else.
 *
 * Two rules decide the type:
 *
 *  - Anything a finger drives is a spring, because it must track the hand.
 *  - Anything that draws itself is timing, because a pen moves at one speed.
 *
 * Nothing bounces. Paper has weight, and an overshoot would read as Material.
 */

/** A plate settling onto the desk: it arrives and stops, it does not wobble. */
export const plate = {
  type: 'spring',
  tension: 180,
  friction: 26,
  mass: 1.4,
} satisfies TransitionConfig

/** A pen stroke. Long enough to read as drawing, not as wiping. */
export const ink = {
  type: 'timing',
  duration: 900,
  easing: cubicBezier(0.22, 1, 0.36, 1),
} satisfies TransitionConfig

/** A sheet sliding across the desk, or folding away. */
const fold: TransitionConfig = {
  type: 'timing',
  duration: 260,
  easing: cubicBezier(0.4, 0, 0.2, 1),
}

/** Touch feedback, with no travel the eye can follow. */
const press: TransitionConfig = {
  type: 'spring',
  tension: 420,
  friction: 30,
}

/**
 * The lamp coming on. Timing, because nothing moves — the sheet only changes
 * colour, and a spring would wobble a value that crosses between two colours.
 * Longer than `press`, so the button answers the finger before the sheet does.
 */
const lamp = {
  type: 'timing',
  duration: 520,
  easing: cubicBezier(0.4, 0, 0.2, 1),
} satisfies TransitionConfig

export const TRANSITIONS = { plate, ink, fold, press, lamp }

/** Narrows `transition="…"` to these five names, so a typo fails to compile. */
declare module '@rootnative/inertia' {
  interface RegisteredTransitions {
    plate: true
    ink: true
    fold: true
    press: true
    lamp: true
  }
}

/**
 * A named transition, plus a delay.
 *
 * `transition` takes a config or a registered name, never a name with
 * overrides, so a delayed call site must pass a config. This keeps that config
 * the same object the registry holds. `no-animation` carries no `delay`.
 */
type DelayableTransition = Exclude<TransitionConfig, { type: 'no-animation' }>
export function withDelay<T extends DelayableTransition>(
  transition: T,
  delay: number,
): T {
  return { ...transition, delay }
}

/**
 * Delay before contour ring `index` of `total` starts drawing. The summit ring
 * draws first, so the eye reads the terrain outward from the high point.
 */
export function ringDelay(index: number, total: number) {
  return (index / Math.max(total, 1)) * 700
}
