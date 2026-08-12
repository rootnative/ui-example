import { useTheme } from '@rootnative/core'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { View } from 'react-native'
import { useThemeMode } from '../theme/mode'
import { ContourField } from './ContourField'

/**
 * A page ground that reads as a map sheet: the theme surface colour with the
 * contour texture printed on it.
 *
 * The texture is measured from the laid-out size rather than the window, so it
 * fills a scroll view's full content height instead of only the first screen.
 */
export function Sheet({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const { dark } = useThemeMode()
  const [size, setSize] = useState({ width: 0, height: 0 })

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout
    setSize((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    )
  }

  return (
    <View
      onLayout={handleLayout}
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
    >
      {size.width > 0 ? (
        // Ink on paper reads at a lower opacity than lamplight on slate: the
        // night accent is brighter, so the same value would shout.
        <ContourField
          width={size.width}
          height={size.height}
          opacity={dark ? 0.14 : 0.2}
        />
      ) : null}
      {children}
    </View>
  )
}
