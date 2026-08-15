import { useThemeMode } from '@rootnative/core'
import { ContourField } from './ContourField'

/**
 * The contour texture that turns a surface into a map sheet.
 *
 * It takes an explicit size rather than measuring itself, because the size that
 * matters is the **scrollable content height**, and only the scroller knows it.
 * A wrapper around a scroll view measures one viewport no matter how long the
 * content is, which pins the paper to the screen and slides the plates over it.
 * So each screen reads `onContentSizeChange` and passes the result here.
 *
 * Place it absolutely as the first child of the scroll content, offset by the
 * container padding so the ink reaches the edges.
 */
export function SheetBackdrop({
  width,
  height,
}: {
  width: number
  height: number
}) {
  const { scheme } = useThemeMode()

  // Ink on paper reads at a lower opacity than lamplight on slate: the night
  // accent is brighter, so the same value would shout.
  //
  // Deliberately not keyed on the size or the palette. The rings draw
  // themselves once, on the first mount that has a measured width; a re-key
  // would replay the whole 1.6s draw every time the content height changed or
  // the user hit the theme toggle.
  return (
    <ContourField
      width={width}
      height={height}
      opacity={scheme === 'dark' ? 0.14 : 0.2}
    />
  )
}
