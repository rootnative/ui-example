import {
  entranceGuardCss,
  entranceGuardNoscriptCss,
} from '@rootnative/inertia/static-export'
import type { PropsWithChildren } from 'react'

/**
 * The HTML shell for the web build.
 *
 * `ScrollViewStyleReset` from `expo-router/html` is deliberately absent: it
 * pins the page with `body { overflow: hidden }`, which is right for a
 * `ScrollView` app and wrong for this one, which scrolls the document. See
 * `pageScroll` for the second half of that change and `PAGE_FILL` for the third.
 *
 * It also carries the Inertia entrance guard. The export is static, so a
 * `Motion.*` with `initial` is written into the HTML at its pre-animation
 * value: without the guard the page is a blank sheet for any visitor whose
 * bundle never runs, and nothing reports it.
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
          Reveals the pre-rendered content if the bundle has not taken over in
          four seconds. The first `Motion.*` to mount stamps
          `data-inertia-ready` on `<html>`, which stands the guard down.
        */}
        <style dangerouslySetInnerHTML={{ __html: entranceGuardCss() }} />

        {/* With scripting off there is nothing to wait for. */}
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
 * Lets the page grow instead of pinning it to the window.
 *
 * The depth selectors are unavoidable. Between `#root` and the screen sit five
 * `flex: 1` boxes that no prop reaches — two from `AppContainer`, one from
 * `react-native-screens`, two from the navigator — and each fixes its height
 * at one window. A `position: sticky` child cannot leave its containing block,
 * so the whole chain must grow or the AppBar stops sticking.
 *
 * `ThemeModeProvider` sets the `html` background colour, because it follows
 * the theme.
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
