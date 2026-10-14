import { AppBar, Column, Layout, Row, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { router } from 'expo-router'
import { LampToggle } from '../src/components/LampToggle'
import { PageScroll, usePageScroll } from '../src/components/pageScroll'
import { SheetIndex, StationSymbol } from '../src/components/SheetIndex'
import {
  PAGE_FILL,
  useSheetContentStyle,
  useSheetHeaderHeights,
  useSheetHeaderSurface,
} from '../src/components/sheetLayout'
import { position } from '../src/data/types'
import { useTreks } from '../src/data/useTreks'
import { FACE } from '../src/theme/fonts'

/**
 * Every route on one sheet index, so the reader sees where the routes lie
 * relative to each other, which the gallery cannot show.
 */
export default function IndexMapScreen() {
  const theme = useTheme()
  const { treks } = useTreks()
  const scroll = usePageScroll()
  const contentStyle = useSheetContentStyle(20)
  const headerHeights = useSheetHeaderHeights('small')
  const headerSurface = useSheetHeaderSurface(scroll.scrollY)

  const plotted = treks.filter((trek) => position(trek)).length

  return (
    <Layout edges={['top', 'bottom']} style={PAGE_FILL}>
      <PageScroll
        scroll={scroll}
        contentStyle={contentStyle}
        headerHeights={headerHeights}
        header={
          <AppBar
            title="Index to sheets"
            canGoBack
            onBackPress={router.back}
            style={headerSurface}
            containerColor="transparent"
            trailing={<LampToggle />}
          />
        }
      >
        <Column gap="xs">
          <Typography variant="labelSmall" color={theme.colors.primary}>
            SURVEY OF INDIA · 1:50,000 SERIES · {plotted} OF {treks.length}{' '}
            ROUTES PLOTTED
          </Typography>
          <Typography variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Each cell is one sheet, 15′ of latitude by 15′ of longitude. Touch a
            station to open its route.
          </Typography>
        </Column>

        <SheetIndex
          treks={treks}
          // `via` stops the detail from growing its photo out of the gallery
          // plate hidden under this screen — see `app/trek/[id].tsx`.
          onSelect={(trek) => router.push(`/trek/${trek.id}?via=map`)}
        />

        <Row gap="lg" align="center" wrap>
          <LegendEntry summit label="Summit" />
          <LegendEntry summit={false} label="Fort" />
        </Row>
      </PageScroll>
    </Layout>
  )
}

function LegendEntry({ summit, label }: { summit: boolean; label: string }) {
  return (
    <Row gap="xs" align="center">
      <StationSymbol summit={summit} />
      <Typography
        variant="titleSmall"
        style={summit ? { fontFamily: FACE.serifMediumItalic } : undefined}
      >
        {label}
      </Typography>
    </Row>
  )
}
