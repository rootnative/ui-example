import {
  ThemeProvider,
  useTheme,
  useThemeMode,
  type ThemeMode,
} from '@rootnative/core'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { CONTOUR, surveyDark, surveyLight } from './survey'

/**
 * The mode the first client render must produce on web.
 *
 * The static export pre-renders `light`, and React 19 adopts the server's
 * inline styles on a hydration mismatch instead of patching them. A dark-mode
 * visitor would get a light page that the provider believes is dark. So the
 * first client render repeats `light`, and the real mode arrives one commit
 * later as an ordinary update, which does patch the DOM.
 */
const FIRST_MODE: ThemeMode = Platform.OS === 'web' ? 'light' : 'system'

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(FIRST_MODE)

  // This commit is the signal that hydration finished, so the provider may
  // now read the real OS scheme. It runs once, before any press, so a mode the
  // reader chose is kept.
  useEffect(() => {
    if (Platform.OS !== 'web') return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode((current) => (current === FIRST_MODE ? 'system' : current))
  }, [])

  return (
    <ThemeProvider
      theme={{ light: surveyLight, dark: surveyDark }}
      // Controlled, so the first render can be pinned to what the static
      // export wrote.
      mode={mode}
      onModeChange={setMode}
    >
      <DocumentPaper />
      {children}
    </ThemeProvider>
  )
}

/**
 * Paints the web document behind the app in the active surface colour. The
 * page is taller than the screen root, and overscroll shows past both ends, so
 * both gaps paint white without this. `html` rather than `body`, because the
 * browser takes the `html` background as the canvas colour.
 */
function DocumentPaper() {
  const theme = useTheme()
  const surface = theme.colors.surface

  useEffect(() => {
    if (Platform.OS !== 'web') return
    document.documentElement.style.backgroundColor = surface
  }, [surface])

  return null
}

/**
 * The SVG ramp for the active palette. These colours go straight onto SVG
 * elements, so they live outside the theme and follow `scheme` by hand.
 */
export function useContour() {
  const { scheme } = useThemeMode()
  return CONTOUR[scheme]
}
