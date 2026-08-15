import { useWindowDimensions } from 'react-native'

/**
 * How wide the reading column is allowed to get.
 *
 * A survey sheet is a fixed size — it does not grow to the width of the desk.
 * On a wide browser window an unconstrained list stretches a card to 2000px and
 * the eye loses the line, so the content column stops here and centres in
 * whatever space is left.
 */
export const SHEET_MAX_WIDTH = 720

/** Below this the window is treated as a phone: one column, edge to edge. */
export const WIDE_BREAKPOINT = 600

/**
 * Padding and centring for a sheet's scroll content.
 *
 * Returns a `contentContainerStyle`, so the constraint lives on the content
 * rather than on the scroller — the scroll bar stays at the window edge where
 * it belongs, while the plates sit in a centred column.
 */
export function useSheetContentStyle(gap: number) {
  const { width } = useWindowDimensions()
  const wide = width >= WIDE_BREAKPOINT

  return {
    padding: wide ? 32 : 20,
    gap,
    // `alignSelf` centres the content box inside a wider scroller. `width:100%`
    // keeps it filling the column on a phone, where the max never bites.
    width: '100%' as const,
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center' as const,
  }
}
