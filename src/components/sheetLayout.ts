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

/**
 * The same column, for a sibling of the scroller rather than its content.
 *
 * `AppBar` is not inside the scroll view, so `useSheetContentStyle` never
 * reaches it: on a wide window the bar spanned the whole desk while the plates
 * sat in a 720px column, which put the title and the day/night toggle a
 * thousand pixels away from the sheet they belong to. Nothing was misaligned
 * *within* the bar — the bar was simply a different width from everything else.
 *
 * The cap goes on the bar's **root**, which is the only thing `AppBar` exposes
 * (`style`) and is where its own `style` prop lands last, so this wins. It is
 * safe to constrain there: the collapse animates `height` on an inner
 * container, so a horizontal cap cannot reach it.
 *
 * The bar's background therefore ends at the column edge rather than at the
 * window edge. That is deliberate and it is the same rule the plates follow —
 * a survey sheet is a fixed size, and its header is part of the sheet, not a
 * band of chrome laid across the desk behind it.
 *
 * `padding` is not repeated here. `AppBar` owns its own internal gutter, and
 * adding one would inset the title from a column edge the plates sit flush to.
 */
export function useSheetHeaderStyle() {
  return {
    width: '100%' as const,
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center' as const,
  }
}
