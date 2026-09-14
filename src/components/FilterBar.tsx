import { Chip, Column, Row, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import type { Difficulty, EnrichedTrek, Season } from '../data/types'
import { SURFACE_ALPHA, withAlpha } from '../theme/color'

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
  const theme = useTheme()

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
          // A filter chip paints nothing until it is selected, so the contour
          // ran straight through the unselected ones and their labels. Each
          // one now carries the same veil every other foreground surface does —
          // its own colour per state, so selection still reads at a glance.
          containerColor={withAlpha(
            selected === value
              ? theme.colors.secondaryContainer
              : theme.colors.surface,
            SURFACE_ALPHA,
          )}
          // `containerColor` sets the chip's border to the same colour as its
          // fill, so the veil erased the outline and the legend became three
          // floating words. The outline is the chip here — this theme gives it
          // no elevation and no fill of its own — so it is stated back.
          style={{ borderWidth: 1, borderColor: theme.colors.outline }}
        >
          {value}
        </Chip>
      ))}
    </Row>
  )
}
