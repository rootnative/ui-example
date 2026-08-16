import {
  AppBar,
  Column,
  IconButton,
  Layout,
  Typography,
} from '@rootnative/components'
import { useTheme, useThemeMode } from '@rootnative/core'
import { Motion, Presence, Stagger, useScroll } from '@rootnative/inertia'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  applyFilter,
  FilterBar,
  NO_FILTER,
  type TrekFilter,
} from '../src/components/FilterBar'
import { SheetBackdrop } from '../src/components/Sheet'
import { useSheetContentStyle } from '../src/components/sheetLayout'
import { TrekCard } from '../src/components/TrekCard'
import { useTreks } from '../src/data/useTreks'

/**
 * The gallery: every surveyed route as a plate on the sheet.
 *
 * The header is an `AppBar variant="large"`, which collapses to the 64dp form
 * as the list scrolls under it. `scrollY` and `onScroll` come from one
 * `useScroll()` — the bar reads the offset on the UI thread, so the collapse
 * never waits on a JS frame.
 *
 * The contour texture sits *inside* the list rather than behind it. Wrapping
 * the scroller would pin the paper to the viewport and slide the cards over it;
 * measured from the content, the ink travels with the plates the way a printed
 * sheet does.
 *
 * **`Motion.ScrollView`, not `Motion.FlatList`.** The list virtualised happily
 * until the filter arrived, and virtualisation is the one thing `Presence`
 * cannot share a list with: an exiting card has to stay mounted until its exit
 * finishes, while a virtualising list unmounts rows on its own schedule. The
 * dataset is six treks and does not grow, so nothing is lost. This is also the
 * scroller the documented `AppBar` collapse recipe uses — which needs an
 * explicit `scrollEventThrottle`, where `FlatList` defaulted it to 1.
 */
export default function GalleryScreen() {
  const theme = useTheme()
  const { treks, loading } = useTreks()
  const { scheme, setMode } = useThemeMode()
  const { scrollY, onScroll } = useScroll()
  const contentStyle = useSheetContentStyle(24)
  const [content, setContent] = useState({ width: 0, height: 0 })
  const [filter, setFilter] = useState<TrekFilter>(NO_FILTER)
  const dark = scheme === 'dark'

  const visible = useMemo(() => applyFilter(treks, filter), [treks, filter])

  // `onContentSizeChange` is the only measurement that reports the *scrollable*
  // size rather than the visible box, which is exactly what the texture needs.
  function handleContentSize(width: number, height: number) {
    setContent((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    )
  }

  return (
    // Both insets. The top one keeps the AppBar clear of the notch; the bottom
    // one keeps the last plate clear of the home indicator, which a flat
    // content padding never accounted for. alpha.13 made `['bottom']` the
    // default for exactly this reason, but this screen owns its top inset too,
    // so it still states both rather than inheriting.
    <Layout
      edges={['top', 'bottom']}
      style={{ backgroundColor: theme.colors.surface, flex: 1 }}
    >
      <AppBar
        variant="large"
        title="Sahyadri Range"
        scrollOffset={scrollY}
        // `trailing` rather than `actions`: the toggle needs its own icon
        // state, and the two props are mutually exclusive by type.
        trailing={
          <IconButton
            icon={dark ? 'weather-night' : 'white-balance-sunny'}
            variant="outlined"
            accessibilityLabel={
              dark ? 'Switch to the day sheet' : 'Switch to the night sheet'
            }
            onPress={() => setMode(dark ? 'light' : 'dark')}
          />
        }
      />

      <Motion.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        contentContainerStyle={contentStyle}
        onContentSizeChange={handleContentSize}
      >
        {/*
          Absolutely positioned behind every row, at the full scrollable size,
          so the texture travels with the plates.

          `left`/`top` are negated by the container's padding so the texture
          reaches the edges rather than starting inside the margin.
        */}
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

        <Column gap="lg">
          <Typography variant="labelSmall" color={theme.colors.primary}>
            {loading
              ? 'SURVEY OF INDIA · SHEET 47 E · FETCHING PLATES…'
              : `SURVEY OF INDIA · SHEET 47 E · ${visible.length} OF ${treks.length} ROUTES SHOWN`}
          </Typography>

          <FilterBar filter={filter} onChange={setFilter} />
        </Column>

        {/*
          `Presence` keeps a filtered-out card mounted until its `exit` plays.
          Every child carries an explicit key, which is what pairs a card across
          renders and lets `layout` know it moved rather than remounted.

          `Stagger` owns the deal-out cascade. The cards used to take an `index`
          prop and compute `index * 70` themselves, which staggered from stale
          positions the moment the filter reordered the list — the exact failure
          the parent-owned form removes.

          **The two cannot wrap each other.** Both read only their *direct*
          children: `Presence` needs the keyed cards there to diff removals, and
          `Stagger` needs them there to number the cascade. `Presence` outside
          sees one keyless `<Stagger>` and skips it — the list renders nothing.
          `Stagger` outside sees one `<Presence>`, gives it delay 0, and every
          card lands together. So neither nests: `Presence` keeps the keyed list
          as its direct children, and one `Stagger` per card carries that card's
          own position.

          `delay` rather than `interval` here, because each `Stagger` holds a
          single card: the position term is always 0, and the base delay is the
          whole value. The 6-card cap that used to live in `plateDelay` is kept
          — past it the cascade would drag on a longer list.
        */}
        <Presence>
          {visible.map((trek, index) => (
            <Stagger key={trek.id} interval={0} delay={Math.min(index, 6) * 70}>
              <TrekCard
                trek={trek}
                loading={loading}
                onPress={() => router.push(`/trek/${trek.id}`)}
              />
            </Stagger>
          ))}
        </Presence>

        {visible.length === 0 ? (
          <Typography
            variant="bodyMedium"
            color={theme.colors.onSurfaceVariant}
          >
            No surveyed route matches this legend.
          </Typography>
        ) : null}
      </Motion.ScrollView>
    </Layout>
  )
}
