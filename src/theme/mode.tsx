import { ThemeProvider, useTheme, useThemeMode } from '@rootnative/core'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { CONTOUR, surveyDark, surveyLight } from './survey'

/**
 * Hands both Survey palettes to the library and lets it own the mode.
 *
 * The whole swap is one prop. Every component re-themes with no per-component
 * work, which is the point the example is making.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={{ light: surveyLight, dark: surveyDark }}>
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
