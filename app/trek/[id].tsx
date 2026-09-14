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
 * Inertia FLIPs between the two: the plate the finger touched grows into this
 * page rather than being replaced by it. That is one prop on each side — the
 * whole shared-element transition costs no layout code.
 *
 * Two limits from the API decide the shape here. The FLIP has a one-second
 * TTL, so the hero must mount with the screen rather than after a fetch; and a
 * source and target in different coordinate spaces skip the animation instead
 * of playing a wrong one, so the hero sits in normal page flow.
 *
 * Everything under the hero arrives on `useInView` rather than on mount — see
 * `Reveal`. The hero is 240pt tall, so on a phone the stat block and the prose
 * start below the fold, and a mount-time entrance would finish before the
 * reader ever scrolled to them.
 */
export default function TrekDetailScreen() {
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { trek, loading } = useTrek(id)
  const contentStyle = useSheetContentStyle(20)
  // The bar sits outside the content, so it needs the column stated on it —
  // see the gallery, and `useSheetHeaderStyle` for why.
  const headerStyle = useSheetHeaderStyle()
  const [content, setContent] = useState({ width: 0, height: 0 })
  // This bar does not collapse, so only the body half of the pair is used.
  // The hook still owns which thing scrolls on which platform.
  const scroll = usePageScroll()
  // Clear on the sheet, solid once the page moves — see the gallery.
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
  // network — but enrichment is still in flight on a cold deep link.
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
        {/*
          The same column as the page it replaces. `p="lg"` put this line on a
          different margin from every other screen, which reads as a broken
          page rather than an empty one.
        */}
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

  // `useInView` measures its element once, so a change in the height *above*
  // one leaves its trigger point stale — the documented fix is to remount.
  // The hero is the only thing here that can change height, and only in one
  // direction: a trek with no photo drops the whole 240pt box once the fetch
  // settles. The enrichment is cached per session, so arriving from the
  // gallery this never flips; only a cold deep link sees it, and then within
  // the first second, before anything has been scrolled to.
  const heroState = photo ? 'photo' : loading ? 'pending' : 'none'

  return (
    // Both insets — the page scrolls, so the last paragraph would otherwise
    // end under the home indicator. See the gallery for the same note.
    <Layout
      edges={['top', 'bottom']}
      style={{ backgroundColor: theme.colors.surface, ...PAGE_FILL }}
    >
      {/* Behind everything, header included — see the gallery. */}
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
          stat block below does not jump down when the photo lands. One
          skeleton on the page, so the pulse is left on here — unlike the
          gallery, where six would compete.
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

        {/* Mono type throughout: this block is grid data, not prose. */}
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
 *
 * `useInView` is the source the value layer was missing: it turns "the reader
 * can see this" into the 0↔1 shared value every interpolator already takes, so
 * the entrance is tied to arrival rather than to a delay counted from mount.
 * On this page that is the whole point — the hero is 240pt, so on a phone none
 * of these blocks is on the first screen.
 *
 * It works on both halves of this app's split scrolling. Web uses
 * `IntersectionObserver` and needs only the ref. Native needs the element
 * inside a `Motion.ScrollView`, which is exactly what `PageScroll` renders
 * there — and the hook reads the container's offset off its animated ref
 * rather than its `onScroll` prop, so `usePageScroll` keeps that prop.
 *
 * `amount: 0.15` fires once 15% of the block shows, and `margin: -32`
 * shrinks the detection box so it is properly on screen first rather than
 * animating against the bottom edge. `once` is left at its default: a survey
 * sheet does not un-print itself when you scroll past it.
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

/** One labelled cell of the stat block. */
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
