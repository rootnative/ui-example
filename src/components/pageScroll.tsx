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
 * The scroll offset that drives an `AppBar` collapse, from whatever scrolls.
 *
 * On native that is a `ScrollView`, and `onScroll` is the worklet handler it
 * needs. On web nothing inside the app scrolls — the document does — so the
 * offset comes from a `window` listener and `onScroll` is `undefined`.
 *
 * The web offset is written from the JS thread rather than the UI thread. On
 * native that would cost a frame; on web there is one thread, so the collapse
 * still tracks the wheel exactly.
 *
 * Both hooks always run. `Platform.OS` never changes inside a session, so the
 * unused one is a shared value nobody reads, and the rules of hooks hold.
 *
 * `useMotionValue` is Inertia's own storage hook — a pass-through over
 * `useSharedValue` that returns the same bare `SharedValue`, so it drops
 * straight into `AppBar`'s `scrollOffset`. It replaces the direct
 * `react-native-reanimated` import this file used to carry, which was the only
 * one left in the app.
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

    // Read once on mount: a deep link restored mid-page must not start the
    // bar expanded and then jump.
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
 * The page body: a `ScrollView` on native, plain document flow on web.
 *
 * Native keeps the scroller it always had. Web renders the same children into
 * the page itself, so the browser scroll bar spans the window, the wheel works
 * anywhere including over the `AppBar`, and Find-in-page and the keyboard
 * `Home` / `End` / `PageDown` keys reach the whole page — none of which a
 * `ScrollView` gives you.
 *
 * `onContentSize` reports the same thing on both: the height of the scrollable
 * content, which is what `SheetBackdrop` draws to. Native has
 * `onContentSizeChange`; on web the content view *is* the content, so its own
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
      // `flexGrow` is what makes the measured box the whole page rather than
      // just the plates. On a page shorter than the window — a filter that
      // matches one route, the "off the sheet" screen — the leftover height
      // belongs to this box instead of to bare ground underneath it, so the
      // contour field that is measured from it runs to the bottom.
      <View style={[contentStyle, { flexGrow: 1 }]} onLayout={handleLayout}>
        {children}
      </View>
    )
  }

  return (
    <Motion.ScrollView
      onScroll={scroll.onScroll}
      scrollEventThrottle={16}
      // **No background.** The scroller used to paint `surface` here, which
      // was harmless while the contour field lived inside it — the field was a
      // child, so it covered this. The field now sits above the scroller as a
      // child of `Layout`, so any colour here is painted straight over it and
      // the sheet vanishes everywhere below the bar. That is the native-only
      // half of "the ink shows behind the header and nowhere else": web never
      // had it, because the web branch is a plain `View` in the page with no
      // colour of its own.
      //
      // `Layout` already paints the ground, and the field is drawn on top of
      // it, so a transparent scroller is both correct and one less surface.
      style={{ flex: 1 }}
      contentContainerStyle={[contentStyle, { flexGrow: 1 }]}
      onContentSizeChange={onContentSize}
    >
      {children}
    </Motion.ScrollView>
  )
}
