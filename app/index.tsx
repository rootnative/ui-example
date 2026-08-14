import {
  Column,
  Divider,
  IconButton,
  Layout,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme, useThemeMode } from '@rootnative/core'
import { Motion } from '@rootnative/inertia'
import { Sheet } from '../src/components/Sheet'
import { TrekCard } from '../src/components/TrekCard'
import { useTreks } from '../src/data/useTreks'

/**
 * Temporary proof screen: confirms the Survey theme renders — fonts loaded,
 * italic reserved for natural features, mono for grid data, sharp corners,
 * and the contour texture behind it all. The real list screen replaces this.
 */
export default function ProofScreen() {
  const theme = useTheme()
  const { treks, loading } = useTreks()
  const { scheme, setMode } = useThemeMode()
  const dark = scheme === 'dark'

  return (
    // `edges` takes the top inset only: without it the scroll content runs
    // under the notch, while the bottom already sits clear.
    <Layout
      edges={['top']}
      style={{ backgroundColor: theme.colors.surface, flex: 1 }}
    >
      <Sheet>
        <Motion.FlatList
          data={treks}
          keyExtractor={(trek) => trek.id}
          contentContainerStyle={{ padding: 24, gap: 24 }}
          renderItem={({ item, index }) => (
            <TrekCard trek={item} index={index} onPress={() => {}} />
          )}
          ListHeaderComponent={
            <Column gap="lg" pb="lg">
              <Row justify="space-between" align="flex-start" gap="md">
                <Column gap="xs" flex={1}>
                  <Typography variant="labelSmall" color={theme.colors.primary}>
                    SURVEY OF INDIA · SHEET 47 E
                  </Typography>
                  {/* headline* is italic — the sheet convention for natural features */}
                  <Typography variant="headlineMedium">
                    Sahyadri Range
                  </Typography>
                  <Typography
                    variant="bodyMedium"
                    color={theme.colors.onSurfaceVariant}
                  >
                    {loading
                      ? 'Fetching plates…'
                      : `${treks.length} routes surveyed`}
                  </Typography>
                </Column>

                <IconButton
                  icon={dark ? 'weather-night' : 'white-balance-sunny'}
                  variant="outlined"
                  accessibilityLabel={
                    dark
                      ? 'Switch to the day sheet'
                      : 'Switch to the night sheet'
                  }
                  onPress={() => setMode(dark ? 'light' : 'dark')}
                />
              </Row>

              <Divider />
            </Column>
          }
        />
      </Sheet>
    </Layout>
  )
}
