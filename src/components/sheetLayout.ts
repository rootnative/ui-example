import { useBreakpointValue, useTheme } from '@rootnative/core'
import { useColorTransition, useTransform } from '@rootnative/inertia'
import type { SharedValue } from '@rootnative/inertia/reanimated'
import { useMemo } from 'react'
import { HEADER_ALPHA, withAlpha } from '../theme/color'
import { Platform, type ViewStyle } from 'react-native'

/**
 * How wide the reading column may get. A survey sheet is a fixed size: on a
 * wide window an unconstrained list stretches a card to 2000px.
 */
export const SHEET_MAX_WIDTH = 720

/**
 * Padding and centring for a sheet's scroll content. It is a
 * `contentContainerStyle`, so the scroll bar stays at the window edge while
 * the plates sit in a centred column.
 *
 * The margin must come from `useBreakpointValue`, which is hydration-safe.
 * `useWindowDimensions()` reads `width: 0` on the static export, and React 19
 * adopts a server style on a mismatch, so a wide window keeps the phone margin.
 */
export function useSheetContentStyle(gap: number): SheetContentStyle {
  const padding = useBreakpointValue({ compact: 20, medium: 32 })

  return {
    padding,
    gap,
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
 * The bar, exactly as a phone draws it: edge to edge.
 *
 * The plates stop at `SHEET_MAX_WIDTH`, the bar does not — it is chrome, so
 * both platforms draw the same header. The trade is deliberate: the title no
 * longer lines up with the first plate, but the header no longer floats as a
 * 720pt band on a bare desk.
 */
export function useSheetHeaderStyle(): ViewStyle {
  return { width: '100%', ...STICKY_HEADER }
}

/**
 * Pins the bar while the page scrolls under it. Web only: the document
 * scrolls there, so a sibling of the content would scroll away with it.
 *
 * `position: 'sticky'` is a react-native-web value, not a React Native one, so
 * the type needs the cast. Sticky is capped by the containing block, so every
 * box between `#root` and this one must grow with the page — see `app/+html.tsx`.
 */
const STICKY_HEADER: ViewStyle =
  Platform.OS === 'web'
    ? ({ position: 'sticky', top: 0, zIndex: 1 } as unknown as ViewStyle)
    : {}

/**
 * How a screen's root fills the window. `flex: 1` fixes the root at one window,
 * which is right on native and wrong on web, where the page must grow past it.
 *
 * The three flex keys are needed as well as `minHeight`: `Layout` applies its
 * own `{ flex: 1 }` before this style, so `minHeight` alone leaves
 * `flex-basis: 0%` and the root still sizes from its parent, not its content.
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
 * Short on purpose: the bar must carry its surface before the first plate
 * reaches it, or the plate reads through the title.
 */
const HEADER_SETTLED_AT = 56

/**
 * The bar's own surface: clear on the sheet, veiled once the page moves. The
 * screens pass `containerColor="transparent"`, so this paints the band instead.
 *
 * Three choices hold the fade together:
 *
 *  - Both ends are the same colour, the near one at zero alpha. The keyword
 *    `transparent` is `rgba(0, 0, 0, 0)`, which drags the fade through black.
 *  - `surfaceContainer`, not `surface`: the page is already `surface`, so the
 *    settled band would not be visible against it.
 *  - The far end stops at `HEADER_ALPHA`. A solid band swallows the plate
 *    passing under it.
 */
export function useSheetHeaderSurface(scrollY: SharedValue<number>) {
  const theme = useTheme()
  const container = theme.colors.surfaceContainer
  const clear = useMemo(() => withAlpha(container, 0), [container])
  const settled = useMemo(() => withAlpha(container, HEADER_ALPHA), [container])

  const progress = useTransform(scrollY, [0, HEADER_SETTLED_AT], [0, 1])

  return useColorTransition(progress, [clear, settled])
}
