/**
 * The same colour at a new alpha. Takes the `#RRGGBB` and `#RGB` forms the
 * Survey palettes use, and returns any other form untouched.
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
 * How opaque a foreground surface sits over the contour sheet. Every plate,
 * chip and pill holds this one value, so the texture reads as one sheet under
 * all of them. 0.84 hides the ink; 0.55 lets the rings cut through the type.
 */
export const SURFACE_ALPHA = 0.5

/**
 * The header's veil once the page scrolls under it. Higher than
 * `SURFACE_ALPHA`, because the header covers plates and photographs at full
 * contrast, not the pale sheet.
 */
export const HEADER_ALPHA = 0.86
