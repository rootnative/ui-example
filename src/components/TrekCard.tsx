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
import { plate } from '../theme/motion'

/**
 * One trek, as a plate pasted onto the sheet.
 *
 * Two motions carry the metaphor:
 *
 *  - On mount the plate settles onto the desk. The delay that makes the list
 *    deal itself out belongs to the `<Stagger>` in the gallery, not here — see
 *    the note on the settle transition below.
 *  - On press it sinks: the lift drops to nothing and the hard offset shadow
 *    shortens with it, as if a thumb pushed the card into the paper.
 *
 * A third carries the filter. `layout` animates the position change a re-filtered
 * list forces on the surviving plates, and `exit` slides a filtered-out plate off
 * the sheet — both on the same `plate` token as the settle, so a card leaves the
 * way it arrived.
 *
 * Press feedback is deliberately not a Material state layer. There is no ripple
 * and no halo — the surface itself moves, which is what a printed card would do.
 */

interface TrekCardProps {
  trek: EnrichedTrek
  /**
   * True until the Wikipedia fetch settles. Drives the media skeleton — the
   * card cannot tell "still loading" from "this trek has no photo" on its own,
   * because both are an absent `enrichment.imageUrl`.
   */
  loading: boolean
  onPress: () => void
}

/** Resting lift of a plate above the sheet, in points. */
const LIFT = 3

export function TrekCard({ trek, loading, onPress }: TrekCardProps) {
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
      // A filtered-out plate is lifted off the sheet rather than blanked: it
      // rises the same 14pt it settled through, so removal reads as the reverse
      // of the deal. `Presence` keeps it mounted until this finishes.
      exit={{ opacity: 0, translateY: -14 }}
      // No `delay` on either key. The card no longer knows its own position:
      // the `<Stagger>` around the list adds `position * interval` to both of
      // these, so a filter that reorders the list re-derives every delay from
      // the new render order instead of from a stale `index` prop.
      transition={{
        opacity: { type: 'timing', duration: 280 },
        translateY: plate,
      }}
      // The surviving plates slide up into the gap the removed ones left. This
      // is the change that comes from outside `animate`, which is exactly what
      // `layout` is for.
      layout="plate"
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
        {/*
          Three states, not two. Before this the card rendered no media at all
          until the fetch settled, so every plate jumped 160pt taller the moment
          Wikipedia answered — and a trek that simply has no photo looked
          identical to one still loading.

          `rectangle` because `Card.Media` already clips the top corners, and
          `animated={false}` because up to six of these pulse at once: one
          shared pulse across the list would read as flicker, and the changelog
          calls out exactly this case.
        */}
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
        ) : loading ? (
          <Card.Media height={160}>
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
