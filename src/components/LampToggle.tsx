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
  const label = dark ? 'Switch to the day sheet' : 'Switch to the night sheet'
  const toggle = () => setMode(dark ? 'light' : 'dark')

  return (
    <View>
      <Face
        icon="white-balance-sunny"
        shown={!dark}
        rotate={dark ? 90 : 0}
        label={label}
        onPress={toggle}
      />
      {/* It starts at -90° so it arrives upright exactly as the sun leaves. */}
      <Face
        icon="weather-night"
        shown={dark}
        rotate={dark ? 0 : -90}
        label={label}
        onPress={toggle}
        overlay
      />
    </View>
  )
}

interface FaceProps {
  icon: string
  shown: boolean
  rotate: number
  label: string
  onPress: () => void
  /** Stacks this face over the other one. */
  overlay?: boolean
}

/**
 * One face of the switch. The shown face carries the press and the label.
 *
 * iOS does not deliver a touch to a view at opacity 0, so the press cannot
 * stay on one face: in night mode the day face is invisible and takes no
 * touch. The hidden face is also left out of the accessibility tree, or a
 * screen reader announces the toggle twice.
 */
function Face({ icon, shown, rotate, label, onPress, overlay }: FaceProps) {
  const pointerEvents = shown ? 'auto' : 'none'

  return (
    <Motion.View
      // The style key alone leaves a hidden overlay touchable on iOS, where it
      // swallows every press. The prop is native-only because react-native-web
      // warns that it is deprecated.
      {...Platform.select({ web: null, default: { pointerEvents } })}
      style={[overlay ? StyleSheet.absoluteFill : null, { pointerEvents }]}
      initial={false}
      animate={{ rotate, opacity: shown ? 1 : 0 }}
      transition="lamp"
      accessibilityElementsHidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
    >
      <IconButton
        icon={icon}
        variant="outlined"
        accessibilityLabel={label}
        onPress={onPress}
      />
    </Motion.View>
  )
}
