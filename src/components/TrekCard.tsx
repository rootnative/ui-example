import {
  Card,
  Chip,
  Column,
  Row,
  Skeleton,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Motion } from '@rootnative/inertia'
import type { EnrichedTrek } from '../data/types'
import { elevationGain, gradient } from '../data/types'
import { SURFACE_ALPHA, withAlpha } from '../theme/color'
import { plate } from '../theme/motion'

/**
 * One trek, as a plate pasted onto the sheet.
 *
 * On mount the plate settles onto the desk, on press it sinks, and `layout`
 * and `exit` carry the filter — all on the same `plate` token, so a card
 * leaves the way it arrived. The stagger belongs to the `<Stagger>` in the
 * gallery, not here.
 *
 * Press feedback is not a Material state layer. The surface itself moves,
 * which is what a printed card would do.
 */

interface TrekCardProps {
  trek: EnrichedTrek
  /**
   * True until the Wikipedia fetch settles. The card cannot tell "still
   * loading" from "no photo" on its own: both are an absent `imageUrl`.
   */
  loading: boolean
  onPress: () => void
}

/** Resting lift of a plate above the sheet, in points. */
const LIFT = 3

/**
 * The photo height on the plate and on the detail hero. One height for both,
 * so the FLIP between them is a pure move. A 160pt photo grown into a 240pt
 * hero is a scale, and a scale stretches the image on the way.
 */
export const PHOTO_HEIGHT = 200

/**
 * The plate photo is a FLIP source, never a target. A plate that a filter
 * brings back within a second of its exit would otherwise take its own old
 * rect and fly in from where it left.
 */
const SOURCE_ONLY = { type: 'no-animation' } as const

export function TrekCard({ trek, loading, onPress }: TrekCardProps) {
  const theme = useTheme()

  // Survey of India convention: a peak takes italic, a fort stays roman.
  const isSummit = trek.features.includes('summit')

  const photo = trek.enrichment?.imageUrl

  return (
    <Motion.Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trek.name}, ${trek.subtitle}`}
      initial={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      // A filtered-out plate rises the same 12pt it settled through, so
      // removal reads as the reverse of the deal.
      exit={{ opacity: 0, translateY: -12 }}
      // No `delay`: the `<Stagger>` around the list adds it, so a reordering
      // filter re-derives every delay instead of reading a stale `index` prop.
      transition={{
        opacity: { type: 'timing', duration: 200 },
        translateY: plate,
      }}
      layout="plate"
      // Only the lift animates. The hard offset shadow belongs to the `<Card>`
      // below, so a `shadowOffset` key here would drive a shadow with no colour
      // to paint with, and react-native-web warns about it on every web start.
      gesture={{ pressed: { translateY: LIFT } }}
    >
      <Card
        variant="elevated"
        // The elevated variant's own colour, held just off solid so the sheet
        // reads through it.
        containerColor={withAlpha(
          theme.colors.surfaceContainerLow,
          SURFACE_ALPHA,
        )}
        // A hard offset shadow has almost no ground to fall on at night, so a
        // hairline keeps the card readable there.
        style={{
          borderWidth: 1,
          borderColor: theme.colors.outline,
        }}
      >
        {/*
          Three states, not two: without the skeleton every plate jumps 200pt
          taller the moment Wikipedia answers. `animated={false}` because up to
          six of these pulse at once, which reads as flicker.
        */}
        {photo ? (
          <Card.Media height={PHOTO_HEIGHT}>
            {/*
              The fade sits on a wrapper: the image's own transition is
              `SOURCE_ONLY`, and the FLIP reads that one.
            */}
            <Motion.View
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition="fold"
              style={{ width: '100%', height: '100%' }}
            >
              {/*
                `layoutId` pairs this with the detail hero: touching the plate
                FLIPs this exact image into the next screen.
              */}
              <Motion.Image
                layoutId={`trek-photo-${trek.id}`}
                source={{ uri: photo }}
                resizeMode="cover"
                transition={SOURCE_ONLY}
                style={{ width: '100%', height: '100%' }}
                accessibilityIgnoresInvertColors
              />
            </Motion.View>
          </Card.Media>
        ) : loading ? (
          <Card.Media height={PHOTO_HEIGHT}>
            <Skeleton
              width="100%"
              height="100%"
              shape="rectangle"
              animated={false}
            />
          </Card.Media>
        ) : null}

        <Card.Content>
          <Typography
            variant="labelSmall"
            color={theme.colors.onSurfaceVariant}
          >
            {trek.sheet.toUpperCase()} · {trek.district.toUpperCase()}
          </Typography>

          <Typography variant={isSummit ? 'headlineSmall' : 'titleLarge'}>
            {trek.name}
          </Typography>

          <Typography variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            {trek.subtitle}
          </Typography>

          <Row gap="md" py="sm">
            <Stat label="HEIGHT" value={`${trek.elevationM} m`} />
            <Stat label="GAIN" value={`${elevationGain(trek)} m`} />
            <Stat label="GRADIENT" value={`${gradient(trek).toFixed(1)}%`} />
          </Row>

          <Row gap="sm" wrap>
            <Tag>{trek.difficulty}</Tag>
            <Tag>{trek.baseVillage}</Tag>
          </Row>
        </Card.Content>
      </Card>
    </Motion.Pressable>
  )
}

/**
 * A static metadata pill. It must not take an `onPress`: a `Chip` with no
 * action is a label, but with one it is a `<button>` inside the plate's own
 * button on the web, which is a hydration error.
 */
function Tag({ children }: { children: string }) {
  const theme = useTheme()

  return (
    <Chip
      // Without a veil a contour line crosses the label, which reads as a
      // printing slip rather than as a pill lying on a sheet.
      containerColor={withAlpha(theme.colors.surface, SURFACE_ALPHA)}
      // `containerColor` also sets the border, so the veil erases the
      // outline. State it back.
      style={{ borderColor: theme.colors.outline }}
    >
      {children}
    </Chip>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme()

  return (
    <Column>
      <Typography variant="labelSmall" color={theme.colors.onSurfaceVariant}>
        {label}
      </Typography>
      <Typography variant="labelLarge">{value}</Typography>
    </Column>
  )
}
