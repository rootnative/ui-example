import { createMotionSvgComponent } from '@rootnative/inertia-svg'
import { StyleSheet, View } from 'react-native'
import Svg, { Ellipse, G } from 'react-native-svg'
import { useContour } from '../theme/mode'
import { ink, ringDelay, withDelay } from '../theme/motion'

/**
 * The contour texture that makes a surface read as a map sheet rather than a
 * flat panel.
 *
 * Contour lines on a real sheet are nested closed curves around a high point,
 * spaced by gradient — tight where the ground is steep, wide where it flattens.
 * These rings are drawn the same way: concentric ellipses whose spacing eases
 * outward, so the texture reads as terrain instead of as decoration.
 *
 * On mount each ring draws itself, summit outward, like a pen tracing the
 * sheet. That is a dashed-stroke trick: one dash as long as the whole outline,
 * offset out of view, then animated back to zero.
 *
 * It is purely presentational and sits behind content, so it is marked
 * non-interactive and hidden from screen readers.
 */

/**
 * `react-native-svg` ships no animatable Ellipse, and the prebuilt shapes cover
 * Path, Circle, Rect and Line only. The factory wraps one with the same
 * `animate` / `transition` surface; `strokeDashoffset` is the only key that has
 * to move, and `strokeDasharray` is declared so its length locks at mount.
 */
const MotionEllipse = createMotionSvgComponent(Ellipse, {
  animatableProps: ['strokeDashoffset'],
  colorProps: ['stroke'],
  arrayProps: ['strokeDasharray'],
})

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

/**
 * Ramanujan's approximation of an ellipse perimeter.
 *
 * The dash has to be at least the outline's length or the stroke shows a gap,
 * and an ellipse perimeter has no closed form. This is accurate to well under a
 * pixel at these radii, and the value is padded slightly at the call site.
 */
function perimeter(rx: number, ry: number) {
  const h = (rx - ry) ** 2 / (rx + ry) ** 2
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))
}

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
  const contour = useContour()

  return (
    <View
      // `pointerEvents` belongs in `style` — the prop form is deprecated in
      // React Native 0.81 and warns on every render.
      style={[StyleSheet.absoluteFill, { opacity, pointerEvents: 'none' }]}
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
                const ry = radius * peak.squash

                // Padded by a few units so rounding can never leave a nick in
                // the closed outline.
                const length = Math.ceil(perimeter(radius, ry)) + 4

                return (
                  <MotionEllipse
                    key={ringIndex}
                    cx={cx}
                    cy={cy}
                    rx={radius}
                    ry={ry}
                    stroke={contour.line}
                    strokeWidth={ringIndex === peak.rings - 1 ? 1.1 : 0.7}
                    fill="none"
                    strokeDasharray={[length]}
                    // Starts fully offset — the ring is drawn but out of view.
                    strokeDashoffset={length}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{
                      strokeDashoffset: withDelay(
                        ink,
                        ringDelay(ringIndex, peak.rings),
                      ),
                    }}
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
