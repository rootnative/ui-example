import { useThemeMode } from '@rootnative/core'
import { Motion, useInterpolatedStyle } from '@rootnative/inertia'
import type { SharedValue } from '@rootnative/inertia/reanimated'
import { useState } from 'react'
import {
  Platform,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native'
import { ContourField } from './ContourField'

/** True on web, where the document scrolls instead of a `ScrollView`. */
const DOCUMENT_SCROLL = Platform.OS === 'web'

/**
 * How far the ink runs past the content, in points, on native.
 *
 * The native field is sized from the scroll content, which starts below the
 * bar, so it needs to be told to carry on up behind it. Overshooting is free —
 * the extra is translated off the top of the screen — so this only has to be at
 * least as tall as the tallest bar on any screen. The `large` bar is 152.
 *
 * A constant rather than the bar's measured height, because that height is not
 * a constant: a `large` bar collapses from 152 to 64 as the page scrolls, and
 * an `onLayout` tracking it would re-render the whole field on every frame of
 * the collapse.
 */
const HEADER_OVERSHOOT = 160

/** The measured size of a screen's scroll content. */
export interface SheetContent {
  width: number
  height: number
}

interface SheetBackdropProps {
  /** From the screen's `onContentSize`. Only read on native. */
  content: SheetContent
  /** From `usePageScroll()`. Only read on native. */
  scrollY: SharedValue<number>
}

/**
 * The contour texture that turns a screen into a map sheet.
 *
 * Render it as the **first child of `Layout`**, before the `AppBar`. It
 * positions itself, it is painted behind everything, and it takes no space.
 *
 * **The ink covers the desk, and it runs behind the bar.** Two things sit
 * behind that sentence, and both were bugs worth writing down:
 *
 *  - It used to be sized from the reading column, which stops at
 *    `SHEET_MAX_WIDTH`. On a phone the cap never bites and the texture inked
 *    the whole screen, so it looked right on a device and became a 720pt strip
 *    on a bare desk in a browser. It takes the window width on both now.
 *  - It used to start where the bar ends. A transparent bar over bare ground
 *    is indistinguishable from an opaque one, so the header read as solid on
 *    both platforms however little it painted. The sheet now carries up under
 *    the bar and the fade in `useSheetHeaderSurface` has something to reveal.
 *
 * The two platforms reach that differently, because the bar sits in a
 * different place on each.
 *
 * **Web.** The document scrolls, so `Layout`'s own box *is* the page — bar
 * included. Filling it is therefore exact: no overshoot, no arithmetic, and a
 * bottom edge that lands on the bottom of the page rather than near it. The
 * size is measured rather than derived, because the page height is the bar
 * plus the content and the bar's height changes as it collapses.
 *
 * **Native.** The bar is a sibling *above* the scroller, so nothing inside the
 * scroller can be drawn behind it — which is where this used to live, and why
 * a transparent bar showed nothing there. It is lifted out to sit over the
 * whole screen instead, and translated by the scroll offset so the ink still
 * travels with the plates the way a printed sheet does.
 */
export function SheetBackdrop({ content, scrollY }: SheetBackdropProps) {
  const { scheme } = useThemeMode()
  const { width: windowWidth } = useWindowDimensions()

  // Web measures its own box; native is told the content size. Both hooks run
  // on both platforms — `Platform.OS` never changes inside a session, so the
  // unused one is idle state and the rules of hooks hold.
  const [page, setPage] = useState({ width: 0, height: 0 })

  // The field rises as the page falls, one point for one point.
  //
  // Declarative rather than a worklet, and that is not a style preference. The
  // obvious spelling here is `useTransform(() => -scrollY.value)`, but the
  // Reanimated Babel plugin does not lift an arbitrary callback into a worklet
  // — only functions in the positions it knows — so that arrow reaches the UI
  // thread as a plain function and an iOS build rejects it outright. Inertia
  // warns about it in development; a release build simply dies.
  //
  // This form has no closure to lift, so there is nothing to get wrong. It
  // needs `extrapolate: 'extend'` because the default is `'clamp'`, and a
  // clamped offset would pin the sheet after the first point of scroll.
  const travel = useInterpolatedStyle(
    scrollY,
    { translateY: [0, -1] },
    { inputRange: [0, 1], extrapolate: 'extend' },
  )

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout
    setPage((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    )
  }

  // Ink on paper reads at a lower opacity than lamplight on slate: the night
  // accent is brighter, so the same value would shout. `ContourField` animates
  // this rather than setting it, so the density crosses over with the ink
  // colour instead of stepping while the colour fades.
  //
  // Raised from 0.2 / 0.14 once the plates went translucent. Most of the sheet
  // is now read *through* a card rather than beside one, and a fifth of an ink
  // that is itself behind a 0.84 surface comes to nothing.
  const opacity = scheme === 'dark' ? 0.24 : 0.34

  if (DOCUMENT_SCROLL) {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
        onLayout={handleLayout}
      >
        {page.width > 0 ? (
          <ContourField
            width={page.width}
            height={page.height}
            opacity={opacity}
          />
        ) : null}
      </View>
    )
  }

  if (content.height <= 0) return null

  const height = content.height + HEADER_OVERSHOOT

  return (
    <Motion.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: windowWidth,
          height,
          pointerEvents: 'none',
        },
        travel,
      ]}
    >
      <ContourField width={windowWidth} height={height} opacity={opacity} />
    </Motion.View>
  )
}
