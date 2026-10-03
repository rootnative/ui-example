import { useTheme, useThemeMode } from '@rootnative/core'
import { MotionConfig } from '@rootnative/inertia'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform, View } from 'react-native'
import { FONTS } from '../src/theme/fonts'
import { ThemeModeProvider } from '../src/theme/mode'
import { TRANSITIONS } from '../src/theme/motion'
import { CONTOUR } from '../src/theme/survey'

/**
 * The detail mounts in place over the gallery on native. A native slide moves
 * the screen while the hero measures itself, and the photo FLIP is skipped.
 * A fade does not move the screen, so the FLIP still plays. The fade also
 * hides the first frame, where the hero sits at its own rect before the FLIP
 * moves it back onto the card, and it gives the back press an exit.
 *
 * Web keeps the default push. The document scrolls there, so a transparent
 * modal leaves the gallery in the page flow and the detail renders below it.
 */
const DETAIL_OPTIONS =
  Platform.OS === 'web'
    ? {}
    : ({
        presentation: 'transparentModal',
        animation: 'fade',
        animationDuration: 240,
      } as const)

// Reads the active theme, so it must sit below ThemeModeProvider.
function ThemedStack() {
  const theme = useTheme()
  const { scheme } = useThemeMode()

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.surface },
        }}
      >
        <Stack.Screen name="trek/[id]" options={DETAIL_OPTIONS} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONTS)

  // Hold the paper colour until the faces are ready, so the first frame never
  // flashes a system serif and then reflows.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: CONTOUR.light.paper }} />
  }

  return (
    <ThemeModeProvider>
      <MotionConfig transitions={TRANSITIONS}>
        <ThemedStack />
      </MotionConfig>
    </ThemeModeProvider>
  )
}
