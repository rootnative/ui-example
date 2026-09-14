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
 * The header is an `AppBar variant="large"`, which collapses to the 64dp form
 * as the list scrolls under it. `scrollY` and `onScroll` come from one
 * `usePageScroll()`, which reads whichever thing scrolls: a `ScrollView` on
 * native, the document on web. `PageScroll` renders the matching body.
 *
 * The contour texture sits *inside* the list rather than behind it. Wrapping
 * the scroller would pin the paper to the viewport and slide the cards over it;
 * measured from the content, the ink travels with the plates the way a printed
 * sheet does. It spans the window rather than the column — see `SheetBackdrop`.
 *
 * **A plain scroller, not `Motion.FlatList`.** The list virtualised happily
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
  const scroll = usePageScroll()
  const contentStyle = useSheetContentStyle(24)
  const headerStyle = useSheetHeaderStyle()
  // The bar paints nothing until the page moves — see `useSheetHeaderSurface`.
  const headerSurface = useSheetHeaderSurface(scroll.scrollY)
  const [content, setContent] = useState({ width: 0, height: 0 })
  const [filter, setFilter] = useState<TrekFilter>(NO_FILTER)

  const visible = useMemo(() => applyFilter(treks, filter), [treks, filter])

  // `PageScroll` reports the *scrollable* size rather than the visible box,
  // which is exactly what the texture needs.
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
      edges={['top']}
      style={{ backgroundColor: theme.colors.surface, ...PAGE_FILL }}
    >
      {/*
        First child, before the bar: the texture is painted behind everything,
        including the header, which is what makes a transparent header read as
        transparent. It takes no space — see `SheetBackdrop`.
      */}
      <SheetBackdrop content={content} scrollY={scroll.scrollY} />

      <AppBar
        variant="large"
        title="Sahyadri Range"
        scrollOffset={scroll.scrollY}
        // The bar is a sibling of the content, so `contentStyle` never reaches
        // it. Without this it spanned the whole window while the plates sat in
        // a 720px column, which put the title and the toggle a thousand pixels
        // off the sheet on a desktop display. On web the same style also pins
        // the bar — see `useSheetHeaderStyle`.
        style={[headerStyle, headerSurface]}
        // The band is drawn by `headerSurface` above, which fades it in from
        // clear as the sheet moves. `AppBar` must not paint a container of its
        // own underneath that, or the fade has a solid colour behind it and
        // nothing appears to change.
        containerColor="transparent"
        // `trailing` rather than `actions`: the toggle owns its own motion and
        // renders two stacked faces, where `actions` builds only icon and text
        // buttons. The two props are mutually exclusive by type anyway.
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
      </PageScroll>
    </Layout>
  )
}
