import {
  AppBar,
  Column,
  Divider,
  Layout,
  Row,
  Skeleton,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Motion, Stagger } from '@rootnative/inertia'
import { router, useLocalSearchParams } from 'expo-router'
import type { ReactNode } from 'react'
import { PageScroll, usePageScroll } from '../../src/components/pageScroll'
import {
  PAGE_FILL,
  useSheetContentStyle,
  useSheetHeaderHeights,
  useSheetHeaderSurface,
} from '../../src/components/sheetLayout'
import { PHOTO_HEIGHT } from '../../src/components/TrekCard'
import { elevationGain, gradient } from '../../src/data/types'
import { useTrek } from '../../src/data/useTreks'
import { plate } from '../../src/theme/motion'

/**
 * One route, opened out to the full sheet.
 *
 * The hero carries the same `layoutId` as the photo on the list card, so
 * Inertia FLIPs between the two. The gallery stays mounted under this screen,
 * so the card stays a valid source for as long as the detail is open. A source
 * and target in different coordinate spaces skip the animation, so the hero
 * sits in normal page flow.
 *
 * Everything under the hero rises in after it, in reading order — see `Rise`.
 */
export default function TrekDetailScreen() {
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { trek, loading } = useTrek(id)
  const contentStyle = useSheetContentStyle(20)
  const headerHeights = useSheetHeaderHeights('small')
  // This bar does not collapse, but the hook still owns which thing scrolls.
  const scroll = usePageScroll()
  const headerSurface = useSheetHeaderSurface(scroll.scrollY)

  // The list is local data, so a miss means a bad id rather than a slow
  // network. Enrichment is still in flight on a cold deep link.
  if (!trek) {
    return (
      <Layout
        edges={['top']}
        style={{ backgroundColor: theme.colors.surface, ...PAGE_FILL }}
      >
        <PageScroll
          scroll={scroll}
          contentStyle={contentStyle}
          headerHeights={headerHeights}
          header={
            <AppBar
              title="Off the sheet"
              canGoBack
              onBackPress={router.back}
              style={headerSurface}
              containerColor="transparent"
            />
          }
        >
          <Typography
            variant="bodyMedium"
            color={theme.colors.onSurfaceVariant}
          >
            {loading ? 'Locating the plate…' : 'No route carries this number.'}
          </Typography>
        </PageScroll>
      </Layout>
    )
  }

  const photo = trek.enrichment?.imageUrl
  const { lat, lon, extract } = trek.enrichment ?? {}

  return (
    <Layout
      edges={['top', 'bottom']}
      style={{ backgroundColor: theme.colors.surface, ...PAGE_FILL }}
    >
      <PageScroll
        scroll={scroll}
        contentStyle={contentStyle}
        headerHeights={headerHeights}
        header={
          <AppBar
            title={trek.name}
            canGoBack
            onBackPress={router.back}
            style={headerSurface}
            containerColor="transparent"
          />
        }
      >
        {/*
          The hero holds its box while the fetch is in flight, so the stat
          block does not jump down when the photo lands. The pulse stays on
          here: one skeleton cannot compete with itself.
        */}
        {photo ? (
          <Motion.Image
            layoutId={`trek-photo-${trek.id}`}
            source={{ uri: photo }}
            resizeMode="cover"
            transition="hero"
            style={{
              width: '100%',
              height: PHOTO_HEIGHT,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            }}
            accessibilityIgnoresInvertColors
          />
        ) : loading ? (
          <Skeleton width="100%" height={PHOTO_HEIGHT} shape="rectangle" />
        ) : null}

        {/*
          `Stagger` gives each block its own delay, in reading order. The first
          block waits for the hero to cover most of its flight.
        */}
        <Stagger interval={RISE_INTERVAL} delay={RISE_DELAY}>
          <Rise>
            <Column gap="xs">
              <Typography variant="labelSmall" color={theme.colors.primary}>
                {trek.sheet.toUpperCase()} · {trek.district.toUpperCase()}
              </Typography>
              <Typography variant="bodyLarge">{trek.subtitle}</Typography>
            </Column>
          </Rise>

          <Rise>
            <Divider />
          </Rise>

          <Rise>
            <Column gap="md">
              <Row gap="lg" wrap>
                <Field label="HEIGHT" value={`${trek.elevationM} m`} />
                <Field label="GAIN" value={`${elevationGain(trek)} m`} />
                <Field
                  label="GRADIENT"
                  value={`${gradient(trek).toFixed(1)}%`}
                />
              </Row>
              <Row gap="lg" wrap>
                <Field label="DISTANCE" value={`${trek.distanceKm} km`} />
                <Field label="ASCENT" value={`${trek.ascentHours} h`} />
                <Field label="WATER" value={`${trek.waterPoints} points`} />
              </Row>
              <Row gap="lg" wrap>
                <Field label="BASE" value={trek.baseVillage} />
                <Field label="GRADE" value={trek.difficulty} />
                <Field label="SEASON" value={trek.season.join(', ')} />
              </Row>

              {lat !== undefined && lon !== undefined ? (
                <Field
                  label="GRID REFERENCE"
                  value={`${lat.toFixed(4)}° N  ${lon.toFixed(4)}° E`}
                />
              ) : null}
            </Column>
          </Rise>

          <Rise>
            <Divider />
          </Rise>

          {extract ? (
            <Rise>
              <Typography variant="bodyMedium">{extract}</Typography>
            </Rise>
          ) : null}

          <Rise>
            <Typography
              variant="bodySmall"
              color={theme.colors.onSurfaceVariant}
            >
              {trek.note}
            </Typography>
          </Rise>
        </Stagger>
      </PageScroll>
    </Layout>
  )
}

/** Delay before the first block rises, in ms. */
const RISE_DELAY = 160

/** Gap between two blocks, in ms. Short, so the page reads as one movement. */
const RISE_INTERVAL = 40

/**
 * One block of the page, rising into place on mount on the `plate` spring.
 *
 * On mount, not on scroll: a block that waits for the viewport arrives at a
 * time the reader cannot predict, and a block that is half on screen fades in
 * late behind the ones above it.
 */
function Rise({ children }: { children: ReactNode }) {
  return (
    <Motion.View
      initial={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        opacity: { type: 'timing', duration: 220 },
        translateY: plate,
      }}
    >
      {children}
    </Motion.View>
  )
}

function Field({ label, value }: { label: string; value: string }) {
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
