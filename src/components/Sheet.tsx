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
 * How far the ink runs past the content, in points, on native. The field is
 * sized from the scroll content, which starts below the bar, so it must carry
 * on up behind it. Overshooting is free, and the tallest bar is 152.
 *
 * A constant rather than the measured height: a `large` bar collapses from 152
 * to 64, so an `onLayout` would re-render the field on every frame.
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
 * Render it as the first child of `Layout`, before the `AppBar`. It positions
 * itself, it is painted behind everything, and it takes no space.
 *
 * The ink spans the window, not the reading column, and it runs behind the
 * bar. Without that second part a transparent bar over bare ground looks
 * solid, and the fade in `useSheetHeaderSurface` has nothing to reveal.
 *
 * The two platforms reach it differently, because the bar sits in a different
 * place on each. On web `Layout`'s box is the page, bar included, so the field
 * fills a measured box exactly. On native the bar is a sibling above the
 * scroller, so the field is lifted out of the scroller to cover the screen and
 * translated by the scroll offset instead.
 */
export function SheetBackdrop({ content, scrollY }: SheetBackdropProps) {
  const { scheme } = useThemeMode()
  const { width: windowWidth } = useWindowDimensions()

  // Web measures its own box; native is told the content size.
  const [page, setPage] = useState({ width: 0, height: 0 })

  // The field rises as the page falls, one point for one point.
  //
  // Declarative rather than `useTransform(() => -scrollY.value)`: the
  // Reanimated Babel plugin does not lift an arbitrary callback into a
  // worklet, so that arrow reaches the UI thread as a plain function and an
  // iOS release build dies on it. `extrapolate: 'extend'` because the default
  // `'clamp'` would pin the sheet after the first point of scroll.
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

  // The night accent is brighter than ink on paper, so the same value would
  // shout. `ContourField` animates this rather than setting it, so the density
  // crosses over with the ink colour instead of stepping.
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
