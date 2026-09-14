import {
  Motion,
  useMotionValue,
  useScroll,
  type UseScrollResult,
} from '@rootnative/inertia'
import type { SharedValue } from '@rootnative/inertia/reanimated'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Platform, View, type LayoutChangeEvent } from 'react-native'
import type { SheetContentStyle } from './sheetLayout'

/** True on web, where the document scrolls instead of a `ScrollView`. */
export const DOCUMENT_SCROLL = Platform.OS === 'web'

/**
 * The scroll offset that drives an `AppBar` collapse, from whatever scrolls: a
 * `ScrollView` on native, the document on web. `onScroll` is `undefined` on
 * web, where a `window` listener writes the offset from the JS thread instead.
 *
 * Both hooks always run. `Platform.OS` never changes inside a session, so the
 * unused one is a shared value nobody reads and the rules of hooks hold.
 */
export function usePageScroll(): {
  scrollY: SharedValue<number>
  onScroll: UseScrollResult['onScroll'] | undefined
} {
  const native = useScroll()
  const documentY = useMotionValue(0)

  useEffect(() => {
    if (!DOCUMENT_SCROLL) return

    function handleScroll() {
      documentY.value = window.scrollY
    }

    // A deep link restored mid-page must not start the bar expanded.
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [documentY])

  return DOCUMENT_SCROLL
    ? { scrollY: documentY, onScroll: undefined }
    : { scrollY: native.scrollY, onScroll: native.onScroll }
}

type PageScrollProps = {
  /** The result of `usePageScroll()` on the same screen. */
  scroll: ReturnType<typeof usePageScroll>
  /** The column, from `useSheetContentStyle()`. */
  contentStyle: ReturnType<typeof import('./sheetLayout').useSheetContentStyle>
  /** Reports the **scrollable** size, for `SheetBackdrop`. */
  onContentSize: (width: number, height: number) => void
  children: ReactNode
}

/**
 * The page body: a `ScrollView` on native, plain document flow on web. Web
 * scrolls the document so the browser scroll bar spans the window, and
 * Find-in-page and the `Home` / `End` / `PageDown` keys reach the whole page.
 *
 * `onContentSize` reports the scrollable height on both, which is what
 * `SheetBackdrop` draws to. On web the content view is the content, so its own
 * `onLayout` measures it.
 */
export function PageScroll({
  scroll,
  contentStyle,
  onContentSize,
  children,
}: PageScrollProps) {
  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout
    onContentSize(width, height)
  }

  if (DOCUMENT_SCROLL) {
    return (
      // `flexGrow` makes the measured box the whole page rather than the
      // plates alone, so the contour field reaches the bottom of a page that
      // is shorter than the window.
      <View style={[contentStyle, { flexGrow: 1 }]} onLayout={handleLayout}>
        {children}
      </View>
    )
  }

  return (
    <Motion.ScrollView
      onScroll={scroll.onScroll}
      scrollEventThrottle={16}
      // No background. The contour field is a child of `Layout`, above this
      // scroller, so any colour here paints over it and the sheet vanishes
      // below the bar. `Layout` already paints the ground.
      style={{ flex: 1 }}
      contentContainerStyle={[contentStyle, { flexGrow: 1 }]}
      onContentSizeChange={onContentSize}
    >
      {children}
    </Motion.ScrollView>
  )
}
