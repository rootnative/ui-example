import {
  AppBar,
  Column,
  IconButton,
  Layout,
  Typography,
} from '@rootnative/components'
import { useTheme, useThemeMode } from '@rootnative/core'
import { Motion, useScroll } from '@rootnative/inertia'
import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
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
 */
export default function GalleryScreen() {
  const theme = useTheme()
  const { treks, loading } = useTreks()
  const { scheme, setMode } = useThemeMode()
  const { scrollY, onScroll } = useScroll()
  const contentStyle = useSheetContentStyle(24)
  const [content, setContent] = useState({ width: 0, height: 0 })
  const dark = scheme === 'dark'

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
    // `edges` takes the top inset only: without it the scroll content runs
    // under the notch, while the bottom already sits clear.
    <Layout
      edges={['top']}
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

      <Motion.FlatList
        data={treks}
        keyExtractor={(trek) => trek.id}
        // `Motion.FlatList` defaults scrollEventThrottle to 1, so the bar gets
        // every frame without the prop the ScrollView recipe needs.
        onScroll={onScroll}
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        contentContainerStyle={contentStyle}
        onContentSizeChange={handleContentSize}
        renderItem={({ item, index }) => (
          <TrekCard
            trek={item}
            index={index}
            onPress={() => router.push(`/trek/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <View>
            {/*
              Absolutely positioned behind every row, at the full scrollable
              size, so the texture travels with the plates. It rides in the
              header because FlatList has no background slot, and the header is
              the one child that is always mounted at the top of the content.

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

            <Column pb="lg">
              <Typography variant="labelSmall" color={theme.colors.primary}>
                {loading
                  ? 'SURVEY OF INDIA · SHEET 47 E · FETCHING PLATES…'
                  : `SURVEY OF INDIA · SHEET 47 E · ${treks.length} ROUTES SURVEYED`}
              </Typography>
            </Column>
          </View>
        }
      />
    </Layout>
  )
}
