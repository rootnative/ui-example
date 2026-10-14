import { Column, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Motion, Stagger } from '@rootnative/inertia'
import { MotionLine } from '@rootnative/inertia-svg'
import { useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import Svg, { Circle, Polygon, Rect } from 'react-native-svg'
import { position, type EnrichedTrek } from '../data/types'
import { SURFACE_ALPHA, withAlpha } from '../theme/color'
import { FACE } from '../theme/fonts'
import { useContour } from '../theme/mode'
import { ink, plate, withDelay } from '../theme/motion'

/**
 * The index to sheets: every route plotted on the graticule of the Survey of
 * India 1:50,000 series, one cell per sheet.
 *
 * The frame draws itself line by line on `ink`, and the stations settle onto it
 * on `plate` once the pen is done, north to south. A station is a real control,
 * so it is a `Motion.Pressable` laid over the SVG rather than an SVG shape: it
 * gets a 44pt target, a role and a label on every platform.
 */

/** One 1:50,000 sheet covers 15′ of latitude by 15′ of longitude. */
const CELL = 0.25

/** Room for the latitude figures on the left and the longitude row on top. */
const GUTTER_LEFT = 52
const GUTTER_TOP = 20
/** Half a longitude figure, so the last one does not leave the frame. */
const GUTTER_RIGHT = 24

/**
 * The widest the frame gets. The area is tall and narrow, so a full-column
 * frame on a wide window runs to about four screens of height.
 */
const MAX_FRAME_WIDTH = 440

/** Gap between two lines of the graticule starting to draw, in ms. */
const LINE_INTERVAL = 50

/** Gap between two stations settling, in ms. */
const STATION_INTERVAL = 70

/** The touch target of a station, in points. */
const STATION = 44

/** How far a label reaches past its symbol, near enough, in points. */
const LABEL_ROOM = 120

/**
 * How opaque the frame and the station names sit over the sheet. Denser than
 * `SURFACE_ALPHA`: the contour texture behind a plate is decoration, but
 * inside the frame it reads as real terrain, and under a name it hides the
 * sheet number the name crosses.
 */
const INDEX_ALPHA = 0.86

interface Bounds {
  north: number
  south: number
  west: number
  east: number
}

/**
 * The smallest block of whole sheets that holds every point. A point on a
 * sheet edge still gets a cell on both sides of it.
 */
function sheetBounds(points: { lat: number; lon: number }[]): Bounds | null {
  if (points.length === 0) return null

  const lats = points.map((point) => point.lat)
  const lons = points.map((point) => point.lon)
  return {
    north: Math.floor(Math.max(...lats) / CELL) * CELL + CELL,
    south: Math.floor(Math.min(...lats) / CELL) * CELL,
    west: Math.floor(Math.min(...lons) / CELL) * CELL,
    east: Math.floor(Math.max(...lons) / CELL) * CELL + CELL,
  }
}

/** Every sheet edge from `from` to `to`, both ends included. */
function edges(from: number, to: number) {
  const count = Math.round(Math.abs(to - from) / CELL)
  const step = to > from ? CELL : -CELL
  return Array.from({ length: count + 1 }, (_, index) => from + index * step)
}

/**
 * The Survey of India number of the 1:50,000 sheet that holds a point, as
 * `E/10`. A 4° sheet splits into sixteen 1° sheets, lettered A–P down each
 * column from the north-west corner. Each 1° sheet splits the same way into
 * sheets numbered 1–16.
 */
export function sheetNumber(lat: number, lon: number) {
  const letter = String.fromCharCode(
    65 + (Math.floor(lon) % 4) * 4 + (3 - (Math.floor(lat) % 4)),
  )
  const column = Math.floor((lon - Math.floor(lon)) / CELL)
  const row = 3 - Math.floor((lat - Math.floor(lat)) / CELL)
  return `${letter}/${column * 4 + row + 1}`
}

/** `73.25` as `73°15′`. */
function degrees(value: number) {
  const whole = Math.floor(value)
  const minutes = Math.round((value - whole) * 60)
  return `${whole}°${String(minutes).padStart(2, '0')}′`
}

interface SheetIndexProps {
  treks: EnrichedTrek[]
  onSelect: (trek: EnrichedTrek) => void
}

export function SheetIndex({ treks, onSelect }: SheetIndexProps) {
  const theme = useTheme()
  const contour = useContour()
  const [frameWidth, setFrameWidth] = useState(0)

  function handleLayout(event: LayoutChangeEvent) {
    setFrameWidth(Math.min(event.nativeEvent.layout.width, MAX_FRAME_WIDTH))
  }

  const plotted = treks.flatMap((trek) => {
    const at = position(trek)
    return at ? [{ trek, ...at }] : []
  })
  const bounds = sheetBounds(plotted)

  if (!bounds || frameWidth <= 0) {
    return <View style={{ width: '100%' }} onLayout={handleLayout} />
  }

  const { north, south, west, east } = bounds
  const mapWidth = frameWidth - GUTTER_LEFT - GUTTER_RIGHT
  // A degree of longitude is shorter than a degree of latitude away from the
  // equator, so the frame is taller than the plain ratio of the two spans.
  const middle = (((north + south) / 2) * Math.PI) / 180
  const mapHeight =
    (mapWidth * (north - south)) / ((east - west) * Math.cos(middle))

  const x = (lon: number) => ((lon - west) / (east - west)) * mapWidth
  const y = (lat: number) => ((north - lat) / (north - south)) * mapHeight

  const meridians = edges(west, east)
  const parallels = edges(north, south)
  // The neatline and the 1° lines carry ink; the sheet edges inside them are
  // the lighter graticule.
  const major = (value: number, ends: number[]) =>
    ends.includes(value) || Number.isInteger(value)

  const lines = [
    ...meridians.map((lon) => ({
      key: `m${lon}`,
      x1: x(lon),
      y1: 0,
      x2: x(lon),
      y2: mapHeight,
      major: major(lon, [west, east]),
    })),
    ...parallels.map((lat) => ({
      key: `p${lat}`,
      x1: 0,
      y1: y(lat),
      x2: mapWidth,
      y2: y(lat),
      major: major(lat, [north, south]),
    })),
  ]
  const drawn = lines.length * LINE_INTERVAL + ink.duration * 0.5

  const cells = meridians.slice(0, -1).flatMap((lon) =>
    parallels.slice(0, -1).map((lat) => ({
      key: `${lat}:${lon}`,
      left: x(lon),
      top: y(lat),
      number: sheetNumber(lat - CELL / 2, lon + CELL / 2),
    })),
  )

  const stations = plotted
    .map((point) => ({ ...point, px: x(point.lon), py: y(point.lat) }))
    .sort((a, b) => b.lat - a.lat)

  return (
    <View
      style={{ width: '100%', alignItems: 'center' }}
      onLayout={handleLayout}
    >
      <View
        style={{ width: frameWidth, height: GUTTER_TOP + mapHeight }}
        accessibilityLabel={`Index to sheets, ${degrees(south)} to ${degrees(north)} north, ${degrees(west)} to ${degrees(east)} east`}
      >
        <View
          style={{
            position: 'absolute',
            left: GUTTER_LEFT,
            top: GUTTER_TOP,
            width: mapWidth,
            height: mapHeight,
            backgroundColor: withAlpha(theme.colors.surface, INDEX_ALPHA),
          }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Svg width={mapWidth} height={mapHeight}>
            {lines.map((line, index) => {
              const length = Math.ceil(
                Math.hypot(line.x2 - line.x1, line.y2 - line.y1),
              )
              const stroke = line.major ? contour.ink : contour.grid

              return (
                <MotionLine
                  // The dash length locks at mount, so a new frame size is a
                  // new line.
                  key={`${line.key}:${length}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={stroke}
                  strokeWidth={line.major ? 1.4 : 0.8}
                  strokeDasharray={[length]}
                  strokeDashoffset={length}
                  animate={{ strokeDashoffset: 0, stroke }}
                  transition={{
                    strokeDashoffset: withDelay(ink, index * LINE_INTERVAL),
                    stroke: 'lamp',
                  }}
                />
              )
            })}
          </Svg>

          <Motion.View
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400, delay: drawn }}
          >
            {cells.map((cell) => (
              <Typography
                key={cell.key}
                variant="labelSmall"
                color={theme.colors.onSurfaceVariant}
                style={{
                  position: 'absolute',
                  left: cell.left + 4,
                  top: cell.top + 3,
                }}
              >
                {cell.number}
              </Typography>
            ))}
          </Motion.View>
        </View>

        <View
          style={{ position: 'absolute', inset: 0 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {meridians.map((lon) => (
            <Typography
              key={lon}
              variant="labelSmall"
              color={theme.colors.onSurfaceVariant}
              style={{
                position: 'absolute',
                top: 0,
                left: GUTTER_LEFT + x(lon) - 30,
                width: 60,
                textAlign: 'center',
              }}
            >
              {degrees(lon)}
            </Typography>
          ))}
          {parallels.map((lat) => (
            <Typography
              key={lat}
              variant="labelSmall"
              color={theme.colors.onSurfaceVariant}
              style={{
                position: 'absolute',
                left: 0,
                top: GUTTER_TOP + y(lat) - 7,
                width: GUTTER_LEFT - 6,
                textAlign: 'right',
              }}
            >
              {degrees(lat)}
            </Typography>
          ))}
        </View>

        <Stagger interval={STATION_INTERVAL} delay={drawn}>
          {stations.map((station) => {
            const crowded = stations.some(
              (other) =>
                other.px > station.px &&
                other.px - station.px < LABEL_ROOM &&
                Math.abs(other.py - station.py) < STATION,
            )
            const side =
              station.px > mapWidth * 0.6 || crowded ? 'left' : 'right'

            return (
              <Station
                key={station.trek.id}
                trek={station.trek}
                side={side}
                anchor={{
                  top: GUTTER_TOP + station.py - STATION / 2,
                  ...(side === 'right'
                    ? { left: GUTTER_LEFT + station.px - STATION / 2 }
                    : {
                        right:
                          frameWidth - GUTTER_LEFT - station.px - STATION / 2,
                      }),
                }}
                onPress={() => onSelect(station.trek)}
              />
            )
          })}
        </Stagger>
      </View>
    </View>
  )
}

interface StationProps {
  trek: EnrichedTrek
  /** Which side of the symbol the name sits on. */
  side: 'left' | 'right'
  /** Places the symbol's centre on the station. */
  anchor: { top: number; left?: number; right?: number }
  onPress: () => void
}

/**
 * One plotted route: the symbol, the name and the spot height. The name
 * follows the sheet's lettering rule — italic for a peak, roman for a fort.
 */
function Station({ trek, side, anchor, onPress }: StationProps) {
  const theme = useTheme()
  const isSummit = trek.features.includes('summit')

  return (
    <Motion.Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trek.name}, ${trek.elevationM} metres`}
      style={{
        position: 'absolute',
        ...anchor,
        height: STATION,
        flexDirection: side === 'right' ? 'row' : 'row-reverse',
        alignItems: 'center',
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ opacity: { type: 'timing', duration: 200 }, scale: plate }}
      gesture={{ pressed: { scale: 0.94 } }}
    >
      <View
        style={{
          width: STATION,
          height: STATION,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StationSymbol summit={isSummit} />
      </View>
      <Column
        style={{
          paddingHorizontal: 4,
          backgroundColor: withAlpha(theme.colors.surface, INDEX_ALPHA),
        }}
      >
        <Typography
          variant="titleSmall"
          style={isSummit ? { fontFamily: FACE.serifMediumItalic } : undefined}
        >
          {trek.name}
        </Typography>
        <Typography variant="labelSmall" color={theme.colors.onSurfaceVariant}>
          {trek.elevationM} M
        </Typography>
      </Column>
    </Motion.Pressable>
  )
}

/**
 * The map symbol for a station: a triangulation triangle for a summit, a
 * walled square for a fort.
 */
export function StationSymbol({ summit }: { summit: boolean }) {
  const theme = useTheme()
  const contour = useContour()
  const paper = withAlpha(theme.colors.surface, SURFACE_ALPHA)

  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      {summit ? (
        <>
          <Polygon
            points="9,2 16.5,15.5 1.5,15.5"
            stroke={contour.line}
            strokeWidth={1.5}
            fill={paper}
          />
          <Circle cx={9} cy={11} r={1.8} fill={contour.line} />
        </>
      ) : (
        <>
          <Rect
            x={2.5}
            y={2.5}
            width={13}
            height={13}
            stroke={contour.line}
            strokeWidth={1.5}
            fill={paper}
          />
          <Rect x={6.5} y={6.5} width={5} height={5} fill={contour.line} />
        </>
      )}
    </Svg>
  )
}
