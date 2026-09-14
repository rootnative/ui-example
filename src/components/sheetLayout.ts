import { useBreakpointValue, useTheme } from '@rootnative/core'
import { useColorTransition, useTransform } from '@rootnative/inertia'
import type { SharedValue } from '@rootnative/inertia/reanimated'
import { useMemo } from 'react'
import { HEADER_ALPHA, withAlpha } from '../theme/color'
import { Platform, type ViewStyle } from 'react-native'

/**
 * How wide the reading column is allowed to get.
 *
 * A survey sheet is a fixed size — it does not grow to the width of the desk.
 * On a wide browser window an unconstrained list stretches a card to 2000px and
 * the eye loses the line, so the content column stops here and centres in
 * whatever space is left.
 */
export const SHEET_MAX_WIDTH = 720

/**
 * Padding and centring for a sheet's scroll content.
 *
 * Returns a `contentContainerStyle`, so the constraint lives on the content
 * rather than on the scroller — the scroll bar stays at the window edge where
 * it belongs, while the plates sit in a centred column.
 *
 * **The margin comes from `useBreakpointValue`, not from a measured width.**
 * This used to read `useWindowDimensions()` and compare against a local
 * breakpoint of 600. On a static export that resolved on a server with no DOM,
 * where react-native-web pins `Dimensions` to `width: 0`, so the phone margin
 * of 20 was written into the exported HTML — and React 19 adopts a server
 * style on a hydration mismatch rather than repairing it, with no error of any
 * kind. The desk therefore kept the phone margin for good, 12pt tighter than
 * the gutter `AppBar` puts on its own title, which is what pulled the plates
 * out of line with the header.
 *
 * `useBreakpointValue` is hydration-safe by construction as of components
 * `0.0.0-alpha.16`: it reports `compact` while the client reproduces the
 * server's markup and switches to the measured class on the re-render React
 * schedules once hydration finishes — an ordinary update, which *does* patch
 * the DOM. MD3's `medium` class starts at 600, so this is the same rule the
 * local constant expressed, and the constant is gone.
 */
export function useSheetContentStyle(gap: number): SheetContentStyle {
  const padding = useBreakpointValue({ compact: 20, medium: 32 })

  return {
    padding,
    gap,
    // `alignSelf` centres the content box inside a wider scroller. `width:100%`
    // keeps it filling the column on a phone, where the max never bites.
    width: '100%' as const,
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center' as const,
  }
}

/** What `useSheetContentStyle` returns. `padding` is read back by callers. */
export type SheetContentStyle = {
  padding: number
  gap: number
  width: '100%'
  maxWidth: number
  alignSelf: 'center'
}

/**
 * The bar, exactly as a phone draws it: edge to edge, content included.
 *
 * The plates stop at `SHEET_MAX_WIDTH` because a survey sheet is a fixed size.
 * The bar does not. It is chrome, it spans the window on every phone, and it
 * now spans the window here, so the two platforms draw the same header.
 *
 * That means the title sits against the left of the window rather than above
 * the first plate, and the day/night toggle against the right. It is a
 * deliberate trade and it is the opposite of what this file used to do: the
 * bar was capped at the column so its title lined up with the plates, which
 * kept the pair aligned but left a 720pt band of header floating on a bare
 * desk. Alignment with the column is what was given up to get the full-width
 * bar; `AppBar`'s own internal gutter is all that insets the title now.
 *
 * Native needs no branch — a phone window is narrower than the column, so this
 * is what it already rendered.
 */
export function useSheetHeaderStyle(): ViewStyle {
  return { width: '100%', ...STICKY_HEADER }
}

/**
 * Pin the bar to the top of the window while the page scrolls under it.
 *
 * Web only, and the reason the bar keeps working now that the document
 * scrolls rather than a `ScrollView`: a sibling of the content would simply
 * scroll away with it. Native needs nothing — the bar is outside the scroller
 * there, so it never moves.
 *
 * `position: 'sticky'` is a real `react-native-web` value but not a React
 * Native one, so the type has to be widened by hand. `zIndex` puts the bar
 * over the plates that pass beneath it.
 *
 * Sticky is capped by the containing block, so every box between `#root` and
 * this one has to grow with the page — see the CSS in `app/+html.tsx`.
 */
const STICKY_HEADER: ViewStyle =
  Platform.OS === 'web'
    ? ({ position: 'sticky', top: 0, zIndex: 1 } as unknown as ViewStyle)
    : {}

/**
 * How a screen's root fills the window.
 *
 * `flex: 1` is right on native and wrong on web: it fixes the root at one
 * window, and the page has to be able to grow past that for the document to
 * scroll. `minHeight` sets the floor instead and leaves the ceiling open.
 *
 * **The three flex keys are the half that was missing.** `Layout` applies its
 * own `{ flex: 1 }` to the SafeAreaView *before* this style, so adding a
 * `minHeight` alone left `flex-grow: 1` and `flex-basis: 0%` in place and the
 * root still took its height from its parent rather than from its content.
 * The page then ran to one window while the plates overflowed past it, which
 * is what left the sheet ending short of the last plate: the contour field is
 * measured from the content box, and the content box was not the page.
 *
 * `flexBasis: 'auto'` with no grow and no shrink is the `flex: none` the web
 * branch wanted all along — size to content, and let `minHeight` hold the
 * floor on a page too short to fill the window.
 */
export const PAGE_FILL: ViewStyle =
  Platform.OS === 'web'
    ? ({
        minHeight: '100vh',
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
      } as unknown as ViewStyle)
    : { flex: 1 }

/**
 * How far the page scrolls before the bar reaches its settled veil, in points.
 *
 * Short on purpose. The bar has to be carrying its surface by the time the
 * first plate reaches it, or the plate reads through the title.
 */
const HEADER_SETTLED_AT = 56

/**
 * The bar's own surface: clear on the sheet, veiled once the page moves.
 *
 * `AppBar` paints nothing itself — the screens pass `containerColor="transparent"`
 * — and this fragment paints it instead, so the band appears as the reader
 * scrolls rather than sitting there from the first frame.
 *
 * **Both ends of the fade are the same colour.** The near end is that colour at
 * zero alpha rather than the keyword `transparent`, which resolves to
 * `rgba(0, 0, 0, 0)`: interpolating from it drags every frame of the fade
 * through black, so a header on a pale sheet would darken before it settled.
 * Matching the channels and moving only the alpha keeps the fade clean on both
 * palettes.
 *
 * `surfaceContainer` rather than `surface` is what makes the settled state
 * visible at all. The page is already `surface`, so fading to it would end on
 * a band that cannot be told apart from the sheet behind it.
 *
 * **The far end is not opaque either.** A solid band swallowed whatever was
 * passing under it: the sheet stopped dead at the bar, and a plate sliding
 * beneath simply disappeared instead of travelling under a header. Ending on
 * `HEADER_ALPHA` keeps the title readable over a photograph while the movement
 * underneath stays legible as movement — the bar reads as laid over the page
 * rather than cut out of it.
 */
export function useSheetHeaderSurface(scrollY: SharedValue<number>) {
  const theme = useTheme()
  const container = theme.colors.surfaceContainer
  const clear = useMemo(() => withAlpha(container, 0), [container])
  const settled = useMemo(() => withAlpha(container, HEADER_ALPHA), [container])

  const progress = useTransform(scrollY, [0, HEADER_SETTLED_AT], [0, 1])

  return useColorTransition(progress, [clear, settled])
}
