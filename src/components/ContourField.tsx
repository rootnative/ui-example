import { StyleSheet, View } from 'react-native'
import Svg, { Ellipse, G } from 'react-native-svg'
import { useThemeMode } from '../theme/mode'

/**
 * The contour texture that makes a surface read as a map sheet rather than a
 * flat panel.
 *
 * Contour lines on a real sheet are nested closed curves around a high point,
 * spaced by gradient — tight where the ground is steep, wide where it flattens.
 * These rings are drawn the same way: concentric ellipses whose spacing eases
 * outward, so the texture reads as terrain instead of as decoration.
 *
 * It is purely presentational and sits behind content, so it is marked
 * non-interactive and hidden from screen readers.
 */

interface Peak {
  /** Centre, as a fraction of the field's width and height. */
  x: number
  y: number
  /** Radius of the outermost ring, as a fraction of the width. */
  spread: number
  /** Rings drawn for this peak. */
  rings: number
  /** Slight squash, so the rings do not read as perfect circles. */
  squash: number
  rotate: number
}

/** Three high points, offset so the pattern never looks like a target. */
const PEAKS: Peak[] = [
  { x: 0.22, y: 0.18, spread: 0.46, rings: 7, squash: 0.72, rotate: -18 },
  { x: 0.84, y: 0.52, spread: 0.38, rings: 6, squash: 0.86, rotate: 24 },
  { x: 0.46, y: 0.92, spread: 0.34, rings: 5, squash: 0.64, rotate: -8 },
]

interface ContourFieldProps {
  width: number
  height: number
  /** 0–1. The pattern should sit well below the content it backs. */
  opacity?: number
}

export function ContourField({
  width,
  height,
  opacity = 1,
}: ContourFieldProps) {
  const { contour } = useThemeMode()

  return (
    <View
      style={[StyleSheet.absoluteFill, { opacity }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {PEAKS.map((peak, peakIndex) => {
          const cx = peak.x * width
          const cy = peak.y * height

          return (
            <G key={peakIndex} rotation={peak.rotate} origin={`${cx}, ${cy}`}>
              {Array.from({ length: peak.rings }, (_, ringIndex) => {
                // Ease the spacing outward: rings crowd near the summit and
                // open out downslope, the way a real gradient reads.
                const step = (ringIndex + 1) / peak.rings
                const radius = peak.spread * width * step ** 1.35

                return (
                  <Ellipse
                    key={ringIndex}
                    cx={cx}
                    cy={cy}
                    rx={radius}
                    ry={radius * peak.squash}
                    stroke={contour.line}
                    strokeWidth={ringIndex === peak.rings - 1 ? 1.1 : 0.7}
                    fill="none"
                  />
                )
              })}
            </G>
          )
        })}
      </Svg>
    </View>
  )
}
