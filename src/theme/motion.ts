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
export const plate = {
  type: 'spring',
  tension: 180,
  friction: 26,
  mass: 1.4,
} satisfies TransitionConfig

/**
 * A pen stroke. Constant-speed easing with a slight ease-out at the end of the
 * line, which is how a nib lifts. Long enough to read as drawing, not wiping.
 */
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
 * A named transition, plus a delay.
 *
 * `transition` takes a `TransitionConfig` **or** a registered name, never a name
 * with overrides — so a staggered call site cannot write `transition="plate"`
 * and add its own delay. It has to pass a config. Passing the exported token
 * through this helper keeps that config the same object the registry holds,
 * instead of a second spring written out by hand that then drifts from it.
 *
 * `no-animation` is excluded because it carries no `delay` — postponing the
 * absence of an animation has no meaning, and the type says so.
 */
type DelayableTransition = Exclude<TransitionConfig, { type: 'no-animation' }>
export function withDelay<T extends DelayableTransition>(
  transition: T,
  delay: number,
): T {
  return { ...transition, delay }
}

/**
 * The plate cascade is no longer computed here. `<Stagger interval={70}>` in
 * the gallery owns it: the parent assigns each child `position * interval`, so
 * a filtered or reordered list re-derives its delays instead of reading a
 * stale `index` prop. `withDelay` stays for the contour rings below, which
 * stagger by ring rather than by list position.
 */

/**
 * Delay before contour ring `index` of `total` starts drawing.
 *
 * The summit ring draws first and the slope follows, so the eye reads the
 * terrain outward from the high point the way a surveyor plots it.
 */
export function ringDelay(index: number, total: number) {
  return (index / Math.max(total, 1)) * 700
}
