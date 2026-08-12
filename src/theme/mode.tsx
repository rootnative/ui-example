import { ThemeProvider } from '@rootnative/core'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'
import { CONTOUR, surveyDark, surveyLight } from './survey'

interface ThemeMode {
  dark: boolean
  toggle: () => void
  /** SVG ramp matching the active palette — contours, hairlines, water. */
  contour: (typeof CONTOUR)['light']
}

const ThemeModeContext = createContext<ThemeMode | null>(null)

/**
 * Swaps the two Survey palettes at runtime.
 *
 * The whole swap is one prop on ThemeProvider. Every component re-themes with
 * no per-component work, which is the point the example is making.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [dark, setDark] = useState(systemScheme === 'dark')

  const toggle = useCallback(() => setDark((current) => !current), [])

  const value = useMemo(
    () => ({ dark, toggle, contour: dark ? CONTOUR.dark : CONTOUR.light }),
    [dark, toggle],
  )

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={dark ? surveyDark : surveyLight}>
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode() {
  const mode = useContext(ThemeModeContext)
  if (!mode) {
    throw new Error('useThemeMode must be used inside a ThemeModeProvider')
  }
  return mode
}
