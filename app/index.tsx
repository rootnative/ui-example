import { AppBar, Column, Layout, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { Presence, Stagger } from '@rootnative/inertia'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  applyFilter,
  FilterBar,
  NO_FILTER,
  type TrekFilter,
} from '../src/components/FilterBar'
import { LampToggle } from '../src/components/LampToggle'
import { PageScroll, usePageScroll } from '../src/components/pageScroll'
import { SheetBackdrop } from '../src/components/Sheet'
import {
  PAGE_FILL,
  useSheetContentStyle,
  useSheetHeaderStyle,
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
  const headerStyle = useSheetHeaderStyle()
  // The bar paints nothing until the page moves — see `useSheetHeaderSurface`.
  const headerSurface = useSheetHeaderSurface(scroll.scrollY)
  const [content, setContent] = useState({ width: 0, height: 0 })
  const [filter, setFilter] = useState<TrekFilter>(NO_FILTER)

  const visible = useMemo(() => applyFilter(treks, filter), [treks, filter])

  // The scrollable size rather than the visible box, which is what the
  // texture needs.
  function handleContentSize(width: number, height: number) {
    setContent((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    )
  }

  return (
    <Layout
      edges={['top']}
      style={{ backgroundColor: theme.colors.surface, ...PAGE_FILL }}
    >
      {/*
        First child, before the bar, so the texture is painted behind the
        header too — which is what makes a transparent header read as
        transparent. It takes no space.
      */}
      <SheetBackdrop content={content} scrollY={scroll.scrollY} />

      <AppBar
        variant="large"
        title="Sahyadri Range"
        scrollOffset={scroll.scrollY}
        // The bar is a sibling of the content, so `contentStyle` never reaches
        // it. On web this style also pins the bar — see `useSheetHeaderStyle`.
        style={[headerStyle, headerSurface]}
        // `headerSurface` draws the band. A container of `AppBar`'s own
        // underneath it would put a solid colour behind the fade.
        containerColor="transparent"
        // `trailing` rather than `actions`: the toggle renders two stacked
        // faces, where `actions` builds only icon and text buttons.
        trailing={<LampToggle />}
      />

      <PageScroll
        scroll={scroll}
        contentStyle={contentStyle}
        onContentSize={handleContentSize}
      >
        <Column gap="lg">
          <Typography variant="labelSmall" color={theme.colors.primary}>
            {loading
              ? 'SURVEY OF INDIA · SHEET 47 E · FETCHING PLATES…'
              : `SURVEY OF INDIA · SHEET 47 E · ${visible.length} OF ${treks.length} ROUTES SHOWN`}
          </Typography>

          <FilterBar filter={filter} onChange={setFilter} />
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
      </PageScroll>
    </Layout>
  )
}
