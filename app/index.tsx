import {
  AppBar,
  Column,
  IconButton,
  Layout,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Presence, Stagger } from '@rootnative/inertia'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import {
  applyFilter,
  FilterBar,
  NO_FILTER,
  type TrekFilter,
} from '../src/components/FilterBar'
import { LampToggle } from '../src/components/LampToggle'
import { PageScroll, usePageScroll } from '../src/components/pageScroll'
import {
  PAGE_FILL,
  useSheetContentStyle,
  useSheetHeaderHeights,
  useSheetHeaderSurface,
} from '../src/components/sheetLayout'
import { TrekCard } from '../src/components/TrekCard'
import { useTreks } from '../src/data/useTreks'

/**
 * The gallery: every surveyed route as a plate on the sheet.
 *
 * The header is an `AppBar variant="large"`, which collapses as the list
 * scrolls under it. `usePageScroll()` reads whichever thing scrolls — a
 * `ScrollView` on native, the document on web — and `PageScroll` renders the
 * matching body.
 *
 * A plain scroller, not `Motion.FlatList`. `Presence` cannot share a list with
 * virtualisation: an exiting card must stay mounted until its exit finishes,
 * while a virtualising list unmounts rows on its own schedule. The dataset is
 * six treks and does not grow.
 */
export default function GalleryScreen() {
  const theme = useTheme()
  const { treks, loading } = useTreks()
  const scroll = usePageScroll()
  const contentStyle = useSheetContentStyle(24)
  const headerHeights = useSheetHeaderHeights('large')
  // The bar paints nothing until the page moves — see `useSheetHeaderSurface`.
  const headerSurface = useSheetHeaderSurface(scroll.scrollY)
  const { height: windowHeight } = useWindowDimensions()
  const [filter, setFilter] = useState<TrekFilter>(NO_FILTER)
  const [holdHeight, setHoldHeight] = useState(0)
  const [dealt, setDealt] = useState(false)

  const visible = useMemo(() => applyFilter(treks, filter), [treks, filter])

  // The cascade belongs to the first deal only. A plate that a filter brings
  // back arrives at once, or the last one waits 350ms behind the others.
  useEffect(() => {
    if (treks.length > 0) setDealt(true)
  }, [treks.length])

  // Read in the handler, not in render: the offset is a shared value.
  function handleFilter(next: TrekFilter) {
    setHoldHeight(scroll.scrollY.value + windowHeight)
    setFilter(next)
  }

  return (
    <Layout edges={['top']} style={PAGE_FILL}>
      <PageScroll
        scroll={scroll}
        contentStyle={contentStyle}
        headerHeights={headerHeights}
        minHeight={holdHeight}
        header={
          <AppBar
            variant="large"
            title="Sahyadri Range"
            scrollOffset={scroll.scrollY}
            style={headerSurface}
            // `headerSurface` draws the band. A container of `AppBar`'s own
            // underneath it would put a solid colour behind the fade.
            containerColor="transparent"
            // `trailing` rather than `actions`: the toggle renders two stacked
            // faces, where `actions` builds only icon and text buttons.
            trailing={
              <Row gap="xs" align="center">
                <IconButton
                  icon="map-outline"
                  variant="outlined"
                  accessibilityLabel="Open the index to sheets"
                  onPress={() => router.push('/map')}
                />
                <LampToggle />
              </Row>
            }
          />
        }
      >
        <Column gap="lg">
          <Typography variant="labelSmall" color={theme.colors.primary}>
            {loading
              ? 'SURVEY OF INDIA · SHEET 47 E · FETCHING PLATES…'
              : `SURVEY OF INDIA · SHEET 47 E · ${visible.length} OF ${treks.length} ROUTES SHOWN`}
          </Typography>

          <FilterBar filter={filter} onChange={handleFilter} />
        </Column>

        {/*
          `Presence` keeps a filtered-out card mounted until its `exit` plays,
          and every child carries a key so `layout` knows a card moved rather
          than remounted.

          The two cannot wrap each other: both read only their direct children.
          `Presence` outside sees one keyless `<Stagger>` and renders nothing;
          `Stagger` outside gives the whole `<Presence>` delay 0 and every card
          lands together. So one `Stagger` per card carries that card's own
          position, with `delay` rather than `interval` — its position term is
          always 0. The cap holds the cascade to six cards.
        */}
        <Presence>
          {visible.map((trek, index) => (
            <Stagger
              key={trek.id}
              interval={0}
              delay={dealt ? 0 : Math.min(index, 6) * 60}
            >
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
      </PageScroll>
    </Layout>
  )
}
