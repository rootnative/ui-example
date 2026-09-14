import { IconButton } from '@rootnative/components'
import { useThemeMode } from '@rootnative/core'
import { Motion } from '@rootnative/inertia'
import { Platform, StyleSheet, View } from 'react-native'

/**
 * The day / night switch. The palette swap is one `setMode` call; this file
 * only makes the switch read as a switch.
 *
 * Two icons, stacked, not one icon that swaps: an `icon` prop that flips
 * mid-turn shows the sun becoming a moon at whatever angle the spring reached.
 * Both faces are mounted, each turns through its own half of the same arc, and
 * the pair cross-fades on the same `lamp` timing the sheet's ink uses.
 */
export function LampToggle() {
  const { scheme, setMode } = useThemeMode()
  const dark = scheme === 'dark'

  return (
    <View>
      {/* The day face carries the press, and the only label in the pair. */}
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
        The night face is decoration: a second rendering of the same control
        would announce the toggle twice and offer a second target. It starts at
        -90° so it arrives upright exactly as the sun leaves.
      */}
      <Motion.View
        // The style key alone leaves this overlay touchable on iOS, where it
        // swallows every press. The prop is native-only because react-native-web
        // warns that it is deprecated.
        {...Platform.select({ web: null, default: { pointerEvents: 'none' } })}
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
          // Required by the type, never announced: the face above is hidden.
          accessibilityLabel="Night sheet icon, decorative"
        />
      </Motion.View>
    </View>
  )
}
