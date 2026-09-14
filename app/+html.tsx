import {
  entranceGuardCss,
  entranceGuardNoscriptCss,
} from '@rootnative/inertia/static-export'
import type { PropsWithChildren } from 'react'

/**
 * The HTML shell for the web build.
 *
 * Expo ships a shell that pins the page: `body { overflow: hidden }` and
 * `height: 100%` all the way down to `#root`. That is right for an app whose
 * scrolling lives in a `ScrollView`, because a `ScrollView` becomes its own
 * `overflow: auto` box. It is wrong for this app, which scrolls the document
 * on web so the browser's own scroll bar runs the full height of the window.
 *
 * `ScrollViewStyleReset` from `expo-router/html` is deliberately absent — it
 * is the component that writes those rules. See `pageScroll` for the other
 * half of the change, and `PAGE_FILL` in `sheetLayout` for the third.
 *
 * Static rendering runs this file, so it shapes both the exported pages and
 * the dev server.
 *
 * It also carries the Inertia entrance guard. `app.json` sets `web.output` to
 * `static`, so every screen is pre-rendered: a `Motion.*` with `initial` is
 * written into the HTML at its pre-animation value, and the trek plates carry
 * `initial={{ opacity: 0 }}`. The page is therefore a blank sheet for any
 * visitor whose bundle never runs. Nothing reports it — the export succeeds,
 * the HTML is valid, and the page is perfect in development.
 */
export default function Html({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <style id="document-scroll" dangerouslySetInnerHTML={{ __html: CSS }} />

        {/*
          Reveal the pre-rendered content if the bundle has not taken over in
          four seconds. Nothing is added per element: `Motion.*` writes
          `data-entrance` itself on web whenever `initial` is set, and the
          first one to mount stamps `data-inertia-ready` on `<html>`, which
          stands the guard down. That ready signal is what separates "the
          JavaScript never arrived" from "the JavaScript decided this is
          hidden" — an exiting plate mid-filter, for one.
        */}
        <style dangerouslySetInnerHTML={{ __html: entranceGuardCss() }} />

        {/*
          With scripting off there is nothing to wait for, so this reveals at
          once rather than after the timeout.
        */}
        <noscript>
          <style
            dangerouslySetInnerHTML={{ __html: entranceGuardNoscriptCss }}
          />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  )
}

/**
 * Let the page grow instead of pinning it to the window.
 *
 * The depth selectors are the awkward part, and they are unavoidable. Between
 * `#root` and the screen sit five boxes that no prop reaches: two from
 * `react-native-web`'s `AppContainer`, one from `react-native-screens` (which
 * pins each screen with `position: absolute; inset: 0`), and two from the
 * navigator. Every one of them is `flex: 1`, which fixes its height at one
 * window.
 *
 * A `position: sticky` child cannot leave its containing block, so an AppBar
 * inside a one-window-tall box stops sticking after one window of scroll.
 * That is why the whole chain has to grow, not just the page under it.
 *
 * The `html` background colour is set from JS, because it follows the theme —
 * see `ThemeModeProvider`. Without it the area below the fold paints white
 * while the user reads a dark page.
 */
const CSS = `
html,body{height:auto;min-height:100%;margin:0}
body{overflow:visible}
#root{display:flex;flex-direction:column;min-height:100%}
#root>div,
#root>div>div,
#root>div>div>div,
#root>div>div>div>div,
#root>div>div>div>div>div{
position:relative;
flex:1 0 auto;
min-height:100vh;
}
`
