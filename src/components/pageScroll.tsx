import {
  Motion,
  useMotionValue,
  useScroll,
  type UseScrollResult,
} from '@rootnative/inertia'
import type { SharedValue } from '@rootnative/inertia/reanimated'
import { useIsFocused, useRoute } from 'expo-router'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Platform, View, type LayoutChangeEvent } from 'react-native'
import { SheetBackdrop, type SheetContent } from './Sheet'
import {
  sheetHeaderBoxStyle,
  type SheetContentStyle,
  type SheetHeaderHeights,
} from './sheetLayout'

/** True on web, where the document scrolls instead of a `ScrollView`. */
export const DOCUMENT_SCROLL = Platform.OS === 'web'

/** The first screen of a page load keeps the offset the browser restored. */
let pageLoad = true

/**
 * The route key of the screen that owns the document scroll: the one that
 * gained focus last. Taken in the focus effect, before the scroll, because the
 * blur of the previous screen arrives after the new screen's first scroll
 * event.
 */
let owner: string | null = null

/**
 * Each screen's own offset, by route key. Not a ref: browser back remounts the
 * gallery, and only the route key survives the remount.
 */
const offsets = new Map<string, number>()

/**
 * Chrome restores the offset of a history entry after `popstate`. That is
 * after the focus effect, so it overwrites the offset the screen put back. The
 * screens restore their own offsets instead.
 *
 * The setting stays on the history entry across a reload, so `pagehide` gives
 * it back to the browser, and the switch waits for `load`. A reload then still
 * keeps the offset the browser restored.
 */
function takeOverScrollRestoration() {
  const manual = () => {
    history.scrollRestoration = 'manual'
  }
  if (document.readyState === 'complete') manual()
  else window.addEventListener('load', manual, { once: true })
  window.addEventListener('pagehide', () => {
    history.scrollRestoration = 'auto'
  })
}

/**
 * The scroll offset that drives an `AppBar` collapse, from whatever scrolls: a
 * `ScrollView` on native, the document on web. `onScroll` is `undefined` on
 * web, where a `window` listener writes the offset from the JS thread instead.
 *
 * Both hooks always run. `Platform.OS` never changes inside a session, so the
 * unused one is a shared value nobody reads and the rules of hooks hold.
 *
 * Every screen in the stack shares the one document scroll. Without the focus
 * effect, a pushed detail opens at the gallery's offset, and the gallery comes
 * back at the detail's. So each screen records its own offset while it has
 * focus, and puts it back when it gains focus again.
 */
export function usePageScroll(): {
  scrollY: SharedValue<number>
  onScroll: UseScrollResult['onScroll'] | undefined
} {
  const native = useScroll()
  const documentY = useMotionValue(0)
  const focused = useIsFocused()
  const { key } = useRoute()

  useEffect(() => {
    if (!DOCUMENT_SCROLL || !focused) return
    owner = key

    // A deep link restored mid-page must not start the bar expanded.
    if (pageLoad) {
      pageLoad = false
      takeOverScrollRestoration()
    } else window.scrollTo(0, offsets.get(key) ?? 0)
    offsets.set(key, window.scrollY)
    documentY.value = window.scrollY
  }, [focused, documentY, key])

  useEffect(() => {
    if (!DOCUMENT_SCROLL) return

    function handleScroll() {
      // A hidden screen still hears the scroll event when the document
      // shrinks under it. That offset belongs to the owner.
      if (owner !== key) return
      offsets.set(key, window.scrollY)
      documentY.value = window.scrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [documentY, key])

  return DOCUMENT_SCROLL
    ? { scrollY: documentY, onScroll: undefined }
    : { scrollY: native.scrollY, onScroll: native.onScroll }
}

type PageScrollProps = {
  /** The result of `usePageScroll()` on the same screen. */
  scroll: ReturnType<typeof usePageScroll>
  /** The column, from `useSheetContentStyle()`. */
  contentStyle: SheetContentStyle
  /** The `AppBar`. It floats over the content — see `sheetHeaderBoxStyle`. */
  header: ReactNode
  /** From `useSheetHeaderHeights()` with the bar's variant. */
  headerHeights: SheetHeaderHeights
  /**
   * The least height of the scroll content. A filter that shortens the page
   * below the current offset makes the scroller jump to its new end. A screen
   * sets this to the offset plus one window before it changes the content, so
   * the scroller can stay where it is.
   */
  minHeight?: number
  children: ReactNode
}

/**
 * The page body: a `ScrollView` on native, plain document flow on web. Web
 * scrolls the document so the browser scroll bar spans the window, and
 * Find-in-page and the `Home` / `End` / `PageDown` keys reach the whole page.
 *
 * The bar floats over the content on both, and the column starts below the
 * expanded bar. The contour sheet is the first child of the content, so it
 * scrolls with the plates — see `SheetBackdrop`.
 */
export function PageScroll({
  scroll,
  contentStyle,
  header,
  headerHeights,
  minHeight,
  children,
}: PageScrollProps) {
  const [content, setContent] = useState<SheetContent>({ width: 0, height: 0 })

  function handleContentSize(width: number, height: number) {
    setContent((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    )
  }

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout
    handleContentSize(width, height)
  }

  const column = (
    <View
      style={[
        contentStyle,
        { paddingTop: contentStyle.padding + headerHeights.expanded },
      ]}
    >
      {children}
    </View>
  )

  const headerBox = (
    // `collapsable={false}`: the box paints nothing, so Fabric flattens it out
    // of the native tree, and its `zIndex` goes with it. The scroller then
    // takes every touch on the bar, the toggle included.
    <View collapsable={false} style={sheetHeaderBoxStyle(headerHeights)}>
      {header}
    </View>
  )

  if (DOCUMENT_SCROLL) {
    return (
      <>
        {headerBox}
        {/*
          `flexGrow` makes the measured box the whole page rather than the
          plates alone, so the contour field reaches the bottom of a page that
          is shorter than the window.
        */}
        <View style={{ flexGrow: 1, minHeight }} onLayout={handleLayout}>
          <SheetBackdrop content={content} />
          {column}
        </View>
      </>
    )
  }

  return (
    // The box that the header is absolute in. `Layout` pads its top by the
    // safe area, and an absolute child ignores that padding.
    <View style={{ flex: 1 }}>
      <Motion.ScrollView
        onScroll={scroll.onScroll}
        scrollEventThrottle={16}
        // No background. `Layout` already paints the ground, and the contour
        // field is inside the content.
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, minHeight }}
        // The track starts under the collapsed bar, which is where the content
        // shows once the page moves.
        scrollIndicatorInsets={{ top: headerHeights.collapsed }}
        onContentSizeChange={handleContentSize}
      >
        <SheetBackdrop content={content} />
        {column}
      </Motion.ScrollView>
      {headerBox}
    </View>
  )
}
