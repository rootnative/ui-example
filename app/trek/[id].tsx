import {
  AppBar,
  Column,
  Divider,
  Layout,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Motion } from '@rootnative/inertia'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { SheetBackdrop } from '../../src/components/Sheet'
import { useSheetContentStyle } from '../../src/components/sheetLayout'
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
 */
export default function TrekDetailScreen() {
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { trek, loading } = useTrek(id)
  const contentStyle = useSheetContentStyle(20)
  const [content, setContent] = useState({ width: 0, height: 0 })

  // Reports the scrollable size rather than the visible box, so the texture
  // covers the whole page instead of the first screen.
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
        style={{ backgroundColor: theme.colors.surface, flex: 1 }}
      >
        <AppBar title="Off the sheet" canGoBack onBackPress={router.back} />
        <Column p="lg">
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

  return (
    <Layout
      edges={['top']}
      style={{ backgroundColor: theme.colors.surface, flex: 1 }}
    >
      <AppBar title={trek.name} canGoBack onBackPress={router.back} />

      <Motion.ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        contentContainerStyle={contentStyle}
        onContentSizeChange={handleContentSize}
      >
        {/* Behind the page, at the full scroll height — see the gallery. */}
        {content.width > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -contentStyle.padding,
              left: -contentStyle.padding,
              width: content.width,
              height: content.height,
              pointerEvents: 'none',
            }}
          >
            <SheetBackdrop width={content.width} height={content.height} />
          </View>
        ) : null}

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
        ) : null}

        <Column gap="xs">
          <Typography variant="labelSmall" color={theme.colors.primary}>
            {trek.sheet.toUpperCase()} · {trek.district.toUpperCase()}
          </Typography>
          <Typography variant="bodyLarge">{trek.subtitle}</Typography>
        </Column>

        <Divider />

        {/* Mono type throughout: this block is grid data, not prose. */}
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

        <Divider />

        {extract ? (
          <Typography variant="bodyMedium">{extract}</Typography>
        ) : null}

        <Typography variant="bodySmall" color={theme.colors.onSurfaceVariant}>
          {trek.note}
        </Typography>
      </Motion.ScrollView>
    </Layout>
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
