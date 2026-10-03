import { useThemeMode } from '@rootnative/core'
import { useState } from 'react'
import { Platform, View } from 'react-native'
import { ContourField } from './ContourField'

/**
 * How far the ink runs above the content, in points. iOS bounces the scroller
 * past its top edge, and bare ground there reads as a tear in the sheet. Web
 * and Android do not bounce.
 */
const OVERSCROLL_BLEED = Platform.OS === 'ios' ? 320 : 0

/** The measured size of a screen's scroll content. */
export interface SheetContent {
  width: number
  height: number
}

/**
 * The contour texture that turns a screen into a map sheet.
 *
 * `PageScroll` renders it as the first child of the scroll content, so it
 * moves with the plates on the scroll itself. Nothing drives it from a scroll
 * value, so it cannot lag a frame behind the content. The bar floats over the
 * content, so the ink runs behind the bar as well.
 *
 * The field only grows. A filter that shortens the page clips the ink at the
 * new bottom, and the rings above that line stay exactly where they were. A
 * field that shrank with the page would unmount its lower bands, and draw them
 * again when the page grew back.
 */
export function SheetBackdrop({ content }: { content: SheetContent }) {
  const { scheme } = useThemeMode()
  const fieldHeight = content.height + OVERSCROLL_BLEED
  const [drawnHeight, setDrawnHeight] = useState(fieldHeight)
  if (fieldHeight > drawnHeight) setDrawnHeight(fieldHeight)

  // The night accent is brighter than ink on paper, so the same value would
  // shout. `ContourField` animates this rather than setting it, so the density
  // crosses over with the ink colour instead of stepping.
  const opacity = scheme === 'dark' ? 0.24 : 0.34

  if (content.width <= 0 || content.height <= 0) return null

  return (
    <View
      style={{
        position: 'absolute',
        top: -OVERSCROLL_BLEED,
        left: 0,
        right: 0,
        bottom: 0,
        // The field can be taller than the page. On web an overflow would
        // lengthen the document.
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <ContourField
        width={content.width}
        height={drawnHeight}
        opacity={opacity}
      />
    </View>
  )
}
