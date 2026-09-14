/**
 * The same colour at a new alpha.
 *
 * Handles the `#RRGGBB` and `#RGB` forms the Survey palettes are written in,
 * and returns anything else untouched — a named colour or an `rgb()` string
 * would need a parser this does not have, and a wrong guess is worse than no
 * change.
 *
 * Two callers, for two different reasons. The header fades between one colour
 * at two alphas, because interpolating from the keyword `transparent` —
 * `rgba(0, 0, 0, 0)` — drags every frame of the fade through black. The plates
 * hold a single reduced alpha so the contour sheet reads through them.
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.trim()
  if (!hex.startsWith('#')) return color

  const body = hex.slice(1)
  const full =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body
  if (full.length !== 6) return color

  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value)) return color

  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * How opaque a foreground surface sits over the contour sheet.
 *
 * Every surface that covers the sheet — a plate, a legend chip, a metadata
 * pill — holds this one value, so the whole screen veils the ink by the same
 * amount and the texture reads as one sheet under everything rather than as a
 * patchwork of differently-transparent panels.
 *
 * The number is arithmetic. Ink that shifts the bare sheet by about 60 units on
 * the blue channel arrives through a surface at `(1 - alpha)` of that: 0.84
 * delivered ~10 and nobody could see it, 0.55 delivered ~27 and the rings cut
 * through the type. This lands near 17 — present, and clearly behind.
 */
export const SURFACE_ALPHA = 0.5

/**
 * The header's veil once the page has scrolled under it.
 *
 * Higher than `SURFACE_ALPHA`, and not for consistency's sake. Everything else
 * veils a sheet of pale ink; the header veils whatever plate is passing beneath
 * it, which may be a photograph at full contrast. This is the point where the
 * title still reads against that and the movement underneath is still legible
 * as movement.
 */
export const HEADER_ALPHA = 0.86
