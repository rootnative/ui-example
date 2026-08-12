import { useTheme } from '@rootnative/core'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { FONTS } from '../src/theme/fonts'
import { ThemeModeProvider, useThemeMode } from '../src/theme/mode'
import { CONTOUR } from '../src/theme/survey'

// Reads the active theme, so it must sit below ThemeModeProvider.
function ThemedStack() {
  const theme = useTheme()
  const { dark } = useThemeMode()

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.surface },
        }}
      />
      {/* Dark ground needs light status-bar glyphs, and the reverse. */}
      <StatusBar style={dark ? 'light' : 'dark'} />
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONTS)

  // Hold on the paper colour until the faces are ready, so the first frame
  // never flashes a system serif and then reflows.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: CONTOUR.light.paper }} />
  }

  return (
    <ThemeModeProvider>
      <ThemedStack />
    </ThemeModeProvider>
  )
}
