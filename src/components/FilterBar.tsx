import { Chip, Column, Row, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import type { Difficulty, EnrichedTrek, Season } from '../data/types'
import { SURFACE_ALPHA, withAlpha } from '../theme/color'

/**
 * The sheet legend: which plates are on the desk. Every chip is
 * `variant="filter"`, the one variant that owns a `selected` state, and the
 * Survey look comes from the theme tokens the chip already reads.
 */

export interface TrekFilter {
  difficulty: Difficulty | null
  season: Season | null
}

export const NO_FILTER: TrekFilter = { difficulty: null, season: null }

const DIFFICULTIES: Difficulty[] = ['easy', 'moderate', 'hard']
const SEASONS: Season[] = ['monsoon', 'winter', 'summer']

/** Treks that match the filter. A null field means that axis is unfiltered. */
export function applyFilter(treks: EnrichedTrek[], filter: TrekFilter) {
  return treks.filter(
    (trek) =>
      (filter.difficulty === null || trek.difficulty === filter.difficulty) &&
      (filter.season === null || trek.season.includes(filter.season)),
  )
}

interface FilterBarProps {
  filter: TrekFilter
  onChange: (filter: TrekFilter) => void
}

export function FilterBar({ filter, onChange }: FilterBarProps) {
  const theme = useTheme()

  // Pressing the selected chip clears that axis, so the row needs no "All"
  // chip and no reset button.
  function toggle<K extends keyof TrekFilter>(key: K, value: TrekFilter[K]) {
    onChange({ ...filter, [key]: filter[key] === value ? null : value })
  }

  return (
    <Column gap="md">
      <Legend
        label="GRADE"
        color={theme.colors.onSurfaceVariant}
        values={DIFFICULTIES}
        selected={filter.difficulty}
        onToggle={(value) => toggle('difficulty', value)}
      />
      <Legend
        label="SEASON"
        color={theme.colors.onSurfaceVariant}
        values={SEASONS}
        selected={filter.season}
        onToggle={(value) => toggle('season', value)}
      />
    </Column>
  )
}

interface LegendProps<T extends string> {
  label: string
  color: string
  values: readonly T[]
  selected: T | null
  onToggle: (value: T) => void
}

/** One axis of the legend: its mono caption and its chips. */
function Legend<T extends string>({
  label,
  color,
  values,
  selected,
  onToggle,
}: LegendProps<T>) {
  const theme = useTheme()

  return (
    <Row gap="sm" wrap align="center">
      <Typography variant="labelSmall" color={color}>
        {label}
      </Typography>

      {values.map((value) => (
        <Chip
          key={value}
          variant="filter"
          selected={selected === value}
          onPress={() => onToggle(value)}
          accessibilityLabel={`${label.toLowerCase()} ${value}`}
          // A filter chip paints nothing until it is selected, so the contour
          // runs through an unselected one and its label. This gives it the
          // same veil every other foreground surface carries.
          containerColor={withAlpha(
            selected === value
              ? theme.colors.secondaryContainer
              : theme.colors.surface,
            SURFACE_ALPHA,
          )}
          // `containerColor` also sets the border, so the veil erases the
          // outline. The outline is the chip in this theme, so state it back.
          style={{ borderWidth: 1, borderColor: theme.colors.outline }}
        >
          {value}
        </Chip>
      ))}
    </Row>
  )
}
