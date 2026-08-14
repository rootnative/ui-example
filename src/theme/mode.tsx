import { ThemeProvider, useThemeMode } from '@rootnative/core'
import type { ReactNode } from 'react'
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
      {children}
    </ThemeProvider>
  )
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
