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
import { Motion, useInView, useInterpolatedStyle } from '@rootnative/inertia'
import { router, useLocalSearchParams } from 'expo-router'
import { useRef, useState, type ReactNode } from 'react'
import { View } from 'react-native'
import { PageScroll, usePageScroll } from '../../src/components/pageScroll'
import { SheetBackdrop } from '../../src/components/Sheet'
import {
  PAGE_FILL,
  useSheetContentStyle,
  useSheetHeaderStyle,
  useSheetHeaderSurface,
} from '../../src/components/sheetLayout'
import { elevationGain, gradient } from '../../src/data/types'
import { useTrek } from '../../src/data/useTreks'

/**
 * One route, opened out to the full sheet.
 *
 * The hero carries the same `layoutId` as the photo on the list card, so
 * Inertia FLIPs between the two. Two limits from that API decide the shape
 * here: the FLIP has a one-second TTL, so the hero must mount with the screen
 * rather than after a fetch, and a source and target in different coordinate
 * spaces skip the animation, so the hero sits in normal page flow.
 *
 * Everything under the hero arrives on `useInView` — see `Reveal`.
 */
export default function TrekDetailScreen() {
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { trek, loading } = useTrek(id)
  const contentStyle = useSheetContentStyle(20)
  const headerStyle = useSheetHeaderStyle()
  const [content, setContent] = useState({ width: 0, height: 0 })
  // This bar does not collapse, but the hook still owns which thing scrolls.
  const scroll = usePageScroll()
  const headerSurface = useSheetHeaderSurface(scroll.scrollY)

  // The scrollable size rather than the visible box, so the texture covers
  // the whole page instead of the first screen.
  function handleContentSize(width: number, height: number) {
    setContent((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    )
  }

  // The list is local data, so a miss means a bad id rather than a slow
  // network. Enrichment is still in flight on a cold deep link.
  if (!trek) {
    return (
      <Layout
        edges={['top']}
        style={{ backgroundColor: theme.colors.surface, ...PAGE_FILL }}
      >
        <AppBar
          title="Off the sheet"
          canGoBack
          onBackPress={router.back}
          style={[headerStyle, headerSurface]}
          containerColor="transparent"
        />
        {/* The same column as the page it replaces, so the margin matches. */}
        <Column style={contentStyle}>
          <Typography
            variant="bodyMedium"
            color={theme.colors.onSurfaceVariant}
          >
            {loading ? 'Locating the plate…' : 'No route carries this number.'}
          </Typography>
        </Column>
      </Layout>
    )
  }

  const photo = trek.enrichment?.imageUrl
  const { lat, lon, extract } = trek.enrichment ?? {}

  // `useInView` measures its element once, so a change in the height above one
  // leaves its trigger point stale, and the documented fix is to remount. The
  // hero is the only thing here that can change height: a trek with no photo
  // drops the whole 240pt box once the fetch settles.
  const heroState = photo ? 'photo' : loading ? 'pending' : 'none'

  return (
    <Layout
      edges={['top', 'bottom']}
      style={{ backgroundColor: theme.colors.surface, ...PAGE_FILL }}
    >
      <SheetBackdrop content={content} scrollY={scroll.scrollY} />

      <AppBar
        title={trek.name}
        canGoBack
        onBackPress={router.back}
        style={[headerStyle, headerSurface]}
        containerColor="transparent"
      />

      <PageScroll
        scroll={scroll}
        contentStyle={contentStyle}
        onContentSize={handleContentSize}
      >
        {/*
          The hero holds its 240pt box while the fetch is in flight, so the
          stat block does not jump down when the photo lands. The pulse stays
          on here: one skeleton cannot compete with itself.
        */}
        {photo ? (
          <Motion.Image
            layoutId={`trek-photo-${trek.id}`}
            source={{ uri: photo }}
            resizeMode="cover"
            style={{
              width: '100%',
              height: 240,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            }}
            accessibilityIgnoresInvertColors
          />
        ) : loading ? (
          <Skeleton width="100%" height={240} shape="rectangle" />
        ) : null}

        <Column gap="xs">
          <Typography variant="labelSmall" color={theme.colors.primary}>
            {trek.sheet.toUpperCase()} · {trek.district.toUpperCase()}
          </Typography>
          <Typography variant="bodyLarge">{trek.subtitle}</Typography>
        </Column>

        <Divider />

        <Reveal key={`stats-${heroState}`}>
          <Column gap="md">
            <Row gap="lg" wrap>
              <Field label="HEIGHT" value={`${trek.elevationM} m`} />
              <Field label="GAIN" value={`${elevationGain(trek)} m`} />
              <Field label="GRADIENT" value={`${gradient(trek).toFixed(1)}%`} />
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
        </Reveal>

        <Divider />

        {extract ? (
          <Reveal key={`extract-${heroState}`}>
            <Typography variant="bodyMedium">{extract}</Typography>
          </Reveal>
        ) : null}

        <Reveal key={`note-${heroState}`}>
          <Typography variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            {trek.note}
          </Typography>
        </Reveal>
      </PageScroll>
    </Layout>
  )
}

/**
 * Fades a block in when it scrolls onto the screen, not when the page mounts.
 * The hero is 240pt, so on a phone none of these blocks is on the first screen.
 *
 * `useInView` works on both halves of this app's split scrolling. Web uses
 * `IntersectionObserver` and needs only the ref; native needs the element
 * inside the `Motion.ScrollView` that `PageScroll` renders there.
 */
function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<View>(null)
  const inView = useInView(ref, { amount: 0.15, margin: -32 })

  const style = useInterpolatedStyle(inView, {
    opacity: [0, 1],
    translateY: [16, 0],
  })

  return (
    <Motion.View ref={ref} style={style}>
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
