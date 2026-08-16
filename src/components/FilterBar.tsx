import { Chip, Column, Row, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import type { Difficulty, EnrichedTrek, Season } from '../data/types'

/**
 * The sheet legend: which plates are on the desk.
 *
 * A survey sheet carries a legend that says what is drawn on it, so the filter
 * reads as one — a labelled band above the plates, not a Material chip toolbar
 * floating over the content.
 *
 * Every chip is `variant="filter"`, which is the one variant that owns a
 * `selected` state. Nothing here is forked or wrapped: the Survey look comes
 * from the theme tokens the chip already reads.
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

  // Pressing the selected chip clears that axis, so the row needs no separate
  // "All" chip and no reset button.
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
  return (
    <Row gap="sm" wrap align="center">
      {/* `Typography` carries no spacing props, so the caption sits in the Row
          that owns the gap rather than setting its own margin. */}
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
        >
          {value}
        </Chip>
      ))}
    </Row>
  )
}
