import { useTheme, useThemeMode } from '@rootnative/core'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { View } from 'react-native'
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
  const { scheme } = useThemeMode()
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
        //
        // Deliberately not keyed on `size` or on the palette. The rings draw
        // themselves once, on the first mount that has a measured width; a
        // re-key would replay the whole 1.6s draw every time the content height
        // changed or the user hit the theme toggle.
        <ContourField
          width={size.width}
          height={size.height}
          opacity={scheme === 'dark' ? 0.14 : 0.2}
        />
      ) : null}
      {children}
    </View>
  )
}
