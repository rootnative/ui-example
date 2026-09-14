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
 * `web.output` is `static`, so every page is pre-rendered on a server with no
 * OS colour scheme to read: `useColorScheme()` answers `light` there and the
 * light sheet is written into the HTML. A visitor whose device is in dark mode
 * then hydrates a dark tree over light markup, and **React 19 adopts the
 * server's inline `style` attributes on a mismatch instead of patching them**,
 * with no warning of any kind. The result is the failure this constant exists
 * to stop: the page paints light, the provider believes it is dark, and the
 * first press of the toggle — which sets `light` — changes nothing a reader
 * can see. The switch looks dead until it is pressed twice.
 *
 * So the first client render states `light`, the same value the server wrote,
 * and the real mode arrives one commit later as an ordinary update, which
 * *does* patch the DOM. Native pre-renders nothing and starts on `system`.
 *
 * This is the same rule `useBreakpointValue` follows inside the library, and
 * the same one the landing site's `use-color-scheme.web.ts` follows.
 */
const FIRST_MODE: ThemeMode = Platform.OS === 'web' ? 'light' : 'system'

/**
 * Hands both Survey palettes to the library and lets it own the mode.
 *
 * The whole swap is one prop. Every component re-themes with no per-component
 * work, which is the point the example is making.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(FIRST_MODE)

  // The one legitimate setState-in-effect: releasing a value that was held
  // only to reproduce the server's markup. The commit that runs this effect is
  // the signal that hydration finished, so from here the provider may read the
  // real OS scheme. `onModeChange` writes the same state, so a mode the reader
  // chose is kept — the effect runs once, on mount, before any press.
  useEffect(() => {
    if (Platform.OS !== 'web') return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode((current) => (current === FIRST_MODE ? 'system' : current))
  }, [])

  return (
    <ThemeProvider
      theme={{ light: surveyLight, dark: surveyDark }}
      // Controlled: the mode lives here so the first render can be pinned to
      // what the static export wrote. `onModeChange` is how `setMode()` from
      // `useThemeMode()` — the day/night toggle — reaches that state.
      mode={mode}
      onModeChange={setMode}
    >
      <DocumentPaper />
      {children}
    </ThemeProvider>
  )
}

/**
 * Paints the web document behind the app in the active surface colour.
 *
 * The page scrolls on web, so it is taller than the screen root that carries
 * the surface colour, and rubber-band overscroll shows past both ends. Both
 * gaps paint white without this, which reads as a broken page on a dark
 * theme. `html` rather than `body`, because the browser takes the background
 * of `html` as the canvas colour for the whole viewport.
 *
 * Renders nothing. It sits inside `ThemeProvider` only so it can read the
 * theme, and it must, since the colour follows the day/night toggle.
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
 * The SVG ramp matching the active palette — contours, hairlines, water.
 *
 * These colours are drawn straight onto SVG elements rather than read off a
 * component, so they live outside the theme and follow `scheme` by hand.
 */
export function useContour() {
  const { scheme } = useThemeMode()
  return CONTOUR[scheme]
}
