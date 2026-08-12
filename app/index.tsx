import {
  Card,
  Chip,
  Column,
  Divider,
  IconButton,
  Layout,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { ScrollView } from 'react-native'
import { Sheet } from '../src/components/Sheet'
import { elevationGain, gradient } from '../src/data/types'
import { useTreks } from '../src/data/useTreks'
import { useThemeMode } from '../src/theme/mode'

/**
 * Temporary proof screen: confirms the Survey theme renders — fonts loaded,
 * italic reserved for natural features, mono for grid data, sharp corners,
 * and the contour texture behind it all. The real list screen replaces this.
 */
export default function ProofScreen() {
  const theme = useTheme()
  const { treks, loading } = useTreks()
  const { dark, toggle } = useThemeMode()

  return (
    // `edges` takes the top inset only: without it the scroll content runs
    // under the notch, while the bottom already sits clear.
    <Layout
      edges={['top']}
      style={{ backgroundColor: theme.colors.surface, flex: 1 }}
    >
      <Sheet>
        <ScrollView>
          <Column px="lg" py="lg" gap="lg">
            <Row justify="space-between" align="flex-start" gap="md">
              <Column gap="xs" flex={1}>
                <Typography variant="labelSmall" color={theme.colors.primary}>
                  SURVEY OF INDIA · SHEET 47 E
                </Typography>
                {/* headline* is italic — the sheet convention for natural features */}
                <Typography variant="headlineMedium">Sahyadri Range</Typography>
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
                  dark ? 'Switch to the day sheet' : 'Switch to the night sheet'
                }
                onPress={toggle}
              />
            </Row>

            <Divider />

            {treks.map((trek) => (
              <Card
                key={trek.id}
                variant="elevated"
                // A hairline keeps the card readable on the night sheet, where
                // a hard offset shadow has almost no ground to fall on. It also
                // reads as a pasted-on plate against the contour texture.
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }}
              >
                <Card.Content>
                  <Typography
                    variant="labelSmall"
                    color={theme.colors.onSurfaceVariant}
                  >
                    {trek.sheet.toUpperCase()} · {trek.district.toUpperCase()}
                  </Typography>

                  {/* Peaks italic, forts roman — per Survey of India convention */}
                  <Typography
                    variant={
                      trek.features.includes('summit')
                        ? 'headlineSmall'
                        : 'titleLarge'
                    }
                  >
                    {trek.name}
                  </Typography>

                  <Typography
                    variant="bodySmall"
                    color={theme.colors.onSurfaceVariant}
                  >
                    {trek.subtitle}
                  </Typography>

                  <Row gap="md" py="sm">
                    <Column>
                      <Typography
                        variant="labelSmall"
                        color={theme.colors.onSurfaceVariant}
                      >
                        HEIGHT
                      </Typography>
                      <Typography variant="labelLarge">
                        {trek.elevationM} m
                      </Typography>
                    </Column>
                    <Column>
                      <Typography
                        variant="labelSmall"
                        color={theme.colors.onSurfaceVariant}
                      >
                        GAIN
                      </Typography>
                      <Typography variant="labelLarge">
                        {elevationGain(trek)} m
                      </Typography>
                    </Column>
                    <Column>
                      <Typography
                        variant="labelSmall"
                        color={theme.colors.onSurfaceVariant}
                      >
                        GRADIENT
                      </Typography>
                      <Typography variant="labelLarge">
                        {gradient(trek).toFixed(1)}%
                      </Typography>
                    </Column>
                  </Row>

                  <Row gap="sm" wrap>
                    <Chip variant="assist">{trek.difficulty}</Chip>
                    <Chip variant="assist">{trek.baseVillage}</Chip>
                  </Row>
                </Card.Content>
              </Card>
            ))}
          </Column>
        </ScrollView>
      </Sheet>
    </Layout>
  )
}
