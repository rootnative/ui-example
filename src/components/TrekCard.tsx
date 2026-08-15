import { Card, Chip, Column, Row, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Motion } from '@rootnative/inertia'
import type { EnrichedTrek } from '../data/types'
import { elevationGain, gradient } from '../data/types'
import { plate, plateDelay, withDelay } from '../theme/motion'

/**
 * One trek, as a plate pasted onto the sheet.
 *
 * Two motions carry the metaphor:
 *
 *  - On mount the plate settles onto the desk, staggered by its position, so
 *    the list deals itself out instead of appearing all at once.
 *  - On press it sinks: the lift drops to nothing and the hard offset shadow
 *    shortens with it, as if a thumb pushed the card into the paper.
 *
 * Press feedback is deliberately not a Material state layer. There is no ripple
 * and no halo — the surface itself moves, which is what a printed card would do.
 */

interface TrekCardProps {
  trek: EnrichedTrek
  /** Position in the list, which sets the settle delay. */
  index: number
  onPress: () => void
}

/** Resting lift of a plate above the sheet, in points. */
const LIFT = 3

export function TrekCard({ trek, index, onPress }: TrekCardProps) {
  const theme = useTheme()

  // Survey of India convention: a peak is a natural feature and takes italic,
  // a fort is a cultural one and stays roman.
  const isSummit = trek.features.includes('summit')

  // Undefined until the Wikipedia fetch settles, and stays undefined when it
  // fails — the card is complete without it.
  const photo = trek.enrichment?.imageUrl

  return (
    <Motion.Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trek.name}, ${trek.subtitle}`}
      initial={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        opacity: { type: 'timing', duration: 280, delay: plateDelay(index) },
        translateY: withDelay(plate, plateDelay(index)),
      }}
      // The plate sinks under the finger. `pressed` owns its own 0↔1 progress,
      // so releasing fades the layer out without disturbing anything else.
      gesture={{
        pressed: { translateY: LIFT, shadowOffset: { width: 1, height: 1 } },
      }}
    >
      <Card
        variant="elevated"
        // A hairline keeps the card readable on the night sheet, where a hard
        // offset shadow has almost no ground to fall on. It also reads as a
        // pasted-on plate against the contour texture.
        style={{
          borderWidth: 1,
          borderColor: theme.colors.outline,
        }}
      >
        {photo ? (
          <Card.Media height={160}>
            {/*
              The photo arrives well after the plate lands, so it fades in on
              its own rather than appearing hard. `layoutId` pairs it with the
              detail hero: touching the plate FLIPs this exact image into the
              next screen.
            */}
            <Motion.Image
              layoutId={`trek-photo-${trek.id}`}
              source={{ uri: photo }}
              resizeMode="cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition="fold"
              style={{ width: '100%', height: '100%' }}
              accessibilityIgnoresInvertColors
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
            <Chip variant="assist">{trek.difficulty}</Chip>
            <Chip variant="assist">{trek.baseVillage}</Chip>
          </Row>
        </Card.Content>
      </Card>
    </Motion.Pressable>
  )
}

/** One column of the mono grid-data row. */
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
