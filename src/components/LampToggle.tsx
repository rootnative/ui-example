import { IconButton } from '@rootnative/components'
import { useThemeMode } from '@rootnative/core'
import { Motion } from '@rootnative/inertia'
import { StyleSheet, View } from 'react-native'

/**
 * The day / night switch: the lamp going on over the sheet.
 *
 * The palette swap itself is still one `setMode` call on one `ThemeProvider`
 * prop — nothing here helps the theme system do its job. This file only makes
 * the switch *read* as a switch, and it stays the whole of that job: the
 * gallery hands over a toggle, not a toggle plus a rotation plus a cross-fade.
 *
 * **Two icons, stacked, not one icon that swaps.** Rotating a single
 * `IconButton` whose `icon` prop flips mid-turn shows the sun becoming a moon
 * at whatever angle the spring happened to reach, which reads as a dropped
 * frame rather than as a movement. Both faces are mounted instead, one over the
 * other, and each turns through its own half of the same arc while the pair
 * cross-fades. The eye follows one continuous rotation.
 *
 * The sun turns clockwise into the night and the moon turns clockwise back out
 * of it, so the gesture is reversible: pressing again unwinds exactly the arc
 * the last press drew. Both faces share the `lamp` timing the sheet's ink uses,
 * which is what ties the button to the ground changing colour behind it.
 */
export function LampToggle() {
  const { scheme, setMode } = useThemeMode()
  const dark = scheme === 'dark'

  return (
    <View>
      {/*
        The day face carries the press. It sits on top, holds the real
        `IconButton` and the only `onPress` and label in the pair, and fades to
        nothing on the night sheet — where the moon below shows through.
      */}
      <Motion.View
        initial={false}
        animate={{ rotate: dark ? 90 : 0, opacity: dark ? 0 : 1 }}
        transition="lamp"
      >
        <IconButton
          icon="white-balance-sunny"
          variant="outlined"
          accessibilityLabel={
            dark ? 'Switch to the day sheet' : 'Switch to the night sheet'
          }
          onPress={() => setMode(dark ? 'light' : 'dark')}
        />
      </Motion.View>

      {/*
        The night face is decoration, and is marked as such. It is a second
        rendering of the same control, so leaving it in the accessibility tree
        would announce the toggle twice and offer a second, unlabelled target.
        `pointerEvents: 'none'` is what lets the press fall through to the day
        face above it, which owns the real handler.

        It starts at -90° so it arrives at 0° — upright — exactly as the sun
        leaves, and both faces travel through the same 90° arc in the same
        direction.
      */}
      <Motion.View
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        initial={false}
        animate={{ rotate: dark ? 0 : -90, opacity: dark ? 1 : 0 }}
        transition="lamp"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <IconButton
          icon="weather-night"
          variant="outlined"
          accessibilityLabel="Switch to the day sheet"
        />
      </Motion.View>
    </View>
  )
}
