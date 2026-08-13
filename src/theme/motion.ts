import { cubicBezier } from '@rootnative/inertia'
import type { TransitionConfig } from '@rootnative/inertia'

/**
 * Motion tokens for the Survey theme.
 *
 * These are registered once on `<MotionConfig transitions>` and referred to by
 * name everywhere else (`transition="plate"`). Motion is a theme token here,
 * exactly like a colour or a type face — no screen writes a raw spring.
 *
 * The vocabulary comes from what a survey sheet physically does. A sheet is
 * drawn with a pen, its plates are stacked on a desk, and it folds. Nothing
 * here bounces: paper has weight, and an elastic overshoot would read as a
 * Material app wearing a paper skin.
 *
 * Two rules decide the type:
 *
 *  - Anything a finger drives is a spring, because it must track the hand.
 *  - Anything that draws itself is timing, because a pen moves at one speed.
 */

/**
 * A plate settling onto the desk. Heavier mass and high friction than a
 * Material default, so it arrives and stops rather than wobbling.
 */
const plate: TransitionConfig = {
  type: 'spring',
  tension: 180,
  friction: 26,
  mass: 1.4,
}

/**
 * A pen stroke. Constant-speed easing with a slight ease-out at the end of the
 * line, which is how a nib lifts. Long enough to read as drawing, not wiping.
 */
const ink: TransitionConfig = {
  type: 'timing',
  duration: 900,
  easing: cubicBezier(0.22, 1, 0.36, 1),
}

/** A sheet sliding across the desk, or folding away. */
const fold: TransitionConfig = {
  type: 'timing',
  duration: 260,
  easing: cubicBezier(0.4, 0, 0.2, 1),
}

/**
 * Touch feedback. Fast and tight — the plate must feel pressed under the
 * finger, with no travel the eye can follow.
 */
const press: TransitionConfig = {
  type: 'spring',
  tension: 420,
  friction: 30,
}

export const TRANSITIONS = { plate, ink, fold, press }

/**
 * Narrows `transition="…"` to the four names above, so a typo is a compile
 * error instead of a dev-time warning and a silent fallback spring.
 */
declare module '@rootnative/inertia' {
  interface RegisteredTransitions {
    plate: true
    ink: true
    fold: true
    press: true
  }
}

/* ------------------------------------------------------------------ staging */

/**
 * Delay before plate `index` lands, in milliseconds.
 *
 * Capped on purpose: past the cap every later card shares one delay, so a long
 * list still finishes settling at a predictable moment instead of dealing
 * itself out for several seconds.
 */
export function plateDelay(index: number) {
  return Math.min(index, 6) * 70
}

/**
 * Delay before contour ring `index` of `total` starts drawing.
 *
 * The summit ring draws first and the slope follows, so the eye reads the
 * terrain outward from the high point the way a surveyor plots it.
 */
export function ringDelay(index: number, total: number) {
  return (index / Math.max(total, 1)) * 700
}
