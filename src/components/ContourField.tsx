import { Motion } from '@rootnative/inertia'
import { createMotionSvgComponent } from '@rootnative/inertia-svg'
import { StyleSheet } from 'react-native'
import Svg, { Ellipse, G } from 'react-native-svg'
import { useContour } from '../theme/mode'
import { ink, ringDelay, withDelay } from '../theme/motion'

/**
 * The contour texture that makes a surface read as a map sheet.
 *
 * Contour lines are nested closed curves around a high point, spaced by
 * gradient, so these rings are concentric ellipses whose spacing eases outward.
 *
 * On mount each ring draws itself, summit outward, with a dashed stroke: one
 * dash as long as the outline, offset out of view, animated back to zero. The
 * ink colour animates too, on its own `lamp` transition. The two must stay on
 * separate per-property transitions: they run on different schedules, and only
 * the colour is allowed to replay.
 */

/**
 * `react-native-svg` ships no animatable Ellipse, and the prebuilt shapes
 * cover Path, Circle, Rect and Line only. `strokeDasharray` is declared so its
 * length locks at mount.
 */
const MotionEllipse = createMotionSvgComponent(Ellipse, {
  animatableProps: ['strokeDashoffset'],
  colorProps: ['stroke'],
  arrayProps: ['strokeDasharray'],
})

interface Peak {
  /** Centre. `x` is a fraction of the field's width, `y` of one band's height. */
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

/** Three high points. `y` is a fraction of one band, not of the whole field. */
const PEAKS: Peak[] = [
  { x: 0.22, y: 0.18, spread: 0.46, rings: 7, squash: 0.72, rotate: -18 },
  { x: 0.84, y: 0.52, spread: 0.38, rings: 6, squash: 0.86, rotate: 24 },
  { x: 0.46, y: 0.92, spread: 0.34, rings: 5, squash: 0.64, rotate: -8 },
]

/**
 * A band's height, as a multiple of the field's width.
 *
 * Every radius is a fraction of the width, so three peaks spread over the
 * whole height thin out as the page grows. The sheet is ruled into bands of
 * this pitch and the pattern repeats in each, so the density holds.
 */
const BAND_ASPECT = 1.35

/**
 * The most bands drawn, whatever the page length. Every ring is an animated
 * SVG node, so a band costs 18 of them. A phone needs about five to reach the
 * bottom of a six-plate gallery. Past the cap a long page carries no ink.
 */
const MAX_BANDS = 8

/**
 * Where the bands fall.
 *
 * A band's height comes from the width alone, never from the page height. N
 * equal bands would make every peak's position a fraction of the total, so
 * filtering the gallery would move all of the ink at once. With a fixed band
 * height the peaks sit at absolute offsets and the sheet stays still.
 */
function bandLayout(width: number, height: number) {
  if (width <= 0 || height <= 0) return { bandHeight: 0, bands: 0 }

  const bandHeight = width * BAND_ASPECT
  return {
    bandHeight,
    bands: Math.min(Math.ceil(height / bandHeight), MAX_BANDS),
  }
}

/**
 * Ramanujan's approximation of an ellipse perimeter. The dash must be at least
 * the outline's length or the stroke shows a gap, and the perimeter has no
 * closed form. This is accurate to well under a pixel at these radii.
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

  const { bandHeight, bands } = bandLayout(width, height)
  const bandIndices = Array.from({ length: bands }, (_, index) => index)

  return (
    // `Motion.View` only so the opacity can cross-fade with the stroke: both
    // carry the palette swap, so a cut here would show through the fade below.
    // `initial={false}` starts at the target, because the density belongs to
    // whichever palette is already up on the first frame.
    <Motion.View
      // `pointerEvents` belongs in `style`; the prop form warns on every render.
      style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
      initial={false}
      animate={{ opacity }}
      transition="lamp"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {bandIndices.map((band) =>
          PEAKS.map((peak, peakIndex) => {
            // Every other band is mirrored, so the repeat reads as terrain
            // rather than as a tiled pattern.
            const flip = band % 2 === 1
            const cx = (flip ? 1 - peak.x : peak.x) * width
            const cy = (band + peak.y) * bandHeight
            const rotate = flip ? -peak.rotate : peak.rotate

            return (
              // One SVG `transform` rather than `rotation` + `origin`: the
              // `origin` prop is emitted on web as a `transform-origin`
              // attribute, which React 19 rejects on every render.
              <G
                key={`${band}-${peakIndex}`}
                transform={`rotate(${rotate} ${cx} ${cy})`}
              >
                {Array.from({ length: peak.rings }, (_, ringIndex) => {
                  // Rings crowd near the summit and open out downslope, the
                  // way a real gradient reads.
                  const step = (ringIndex + 1) / peak.rings
                  const radius = peak.spread * width * step ** 1.35
                  const ry = radius * peak.squash

                  // Padded, so rounding cannot leave a nick in the outline.
                  const length = Math.ceil(perimeter(radius, ry)) + 4

                  return (
                    <MotionEllipse
                      key={ringIndex}
                      cx={cx}
                      cy={cy}
                      rx={radius}
                      ry={ry}
                      // The mount seed for the animated `stroke` below: a key
                      // only animates when it is present at mount.
                      stroke={contour.line}
                      strokeWidth={ringIndex === peak.rings - 1 ? 1.1 : 0.7}
                      fill="none"
                      strokeDasharray={[length]}
                      strokeDashoffset={length}
                      animate={{
                        strokeDashoffset: 0,
                        stroke: contour.line,
                      }}
                      transition={{
                        strokeDashoffset: withDelay(
                          ink,
                          ringDelay(ringIndex, peak.rings),
                        ),
                        // One lamp lights the whole sheet, so every ring
                        // changes colour at once. One pen draws them in order.
                        stroke: 'lamp',
                      }}
                    />
                  )
                })}
              </G>
            )
          }),
        )}
      </Svg>
    </Motion.View>
  )
}
