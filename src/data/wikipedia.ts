import type { TrekEnrichment } from './types'

const ENDPOINT = 'https://en.wikipedia.org/w/api.php'

/**
 * Wikimedia asks every client to identify itself. An anonymous or generic
 * agent is rate-limited harder, and is blocked outright — the API answers
 * **403**, not 429.
 *
 * It has to go in `User-Agent`. `Api-User-Agent` alone is not enough: it exists
 * for browsers, which forbid a page from setting `User-Agent` itself, so
 * Wikimedia reads it only as a fallback. A browser always sends its own real
 * `User-Agent` underneath. React Native sends none, so a request carrying only
 * `Api-User-Agent` looks anonymous and is refused.
 *
 * That is why this failed on device while working on web, and why it failed
 * silently: the 403 lands in the `!response.ok` branch, which returns an empty
 * map by design, so every card simply rendered without its photo.
 */
export const USER_AGENT =
  'rootnative-ui-example/1.0 (https://github.com/rootnative)'

/** Headers every Wikimedia request needs. */
export const WIKIMEDIA_HEADERS = { 'User-Agent': USER_AGENT }

/**
 * Fetch a Wikimedia image and return it as a `data:` URI.
 *
 * `upload.wikimedia.org` refuses anonymous clients exactly like the API does,
 * so a thumbnail needs the same `User-Agent`. Passing `headers` on an
 * `<Image source>` does **not** achieve that on Android: the native loader
 * builds its own request and prepends its client token, so the agent arrives as
 * `okhttp/4.x …`. Wikimedia blocks that prefix outright — measured, a UA of
 * `okhttp/4.9.2 <our agent>` answers 403 while `<our agent>` alone answers 200.
 * So the header is not ignored; it is overridden into a banned value, and no
 * amount of setting it on the Image can win.
 *
 * `fetch` does honour the header — the API call on the same host proves it — so
 * the bytes come through here and reach the Image as a `data:` URI, which needs
 * no network at all.
 *
 * The cost is real and accepted: the image is base64, so it sits in JS memory
 * at about 4/3 of its encoded size and misses the native disk cache. That is
 * affordable for six 960px thumbnails fetched once per session, and it is not
 * the pattern to copy for a long or unbounded list.
 */
export async function fetchImageAsDataUri(
  url: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  try {
    const response = await fetch(url, { signal, headers: WIKIMEDIA_HEADERS })
    if (!response.ok) return undefined

    const blob = await response.blob()

    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : undefined)
      reader.onerror = () => resolve(undefined)
      reader.readAsDataURL(blob)
    })
  } catch {
    return undefined
  }
}

/**
 * Width we ask for. The API snaps this to a rendition that actually exists and
 * returns that URL — 900 comes back as the real 960px file.
 *
 * Never build a thumbnail URL by substituting a width into the path. Wikimedia
 * only serves a fixed set of renditions per file, and an unavailable width
 * responds 400. Always use the `source` the API hands back.
 */
const THUMB_WIDTH = 900

interface ApiPage {
  title: string
  thumbnail?: { source: string; width: number; height: number }
  coordinates?: { lat: number; lon: number }[]
  extract?: string
}

/**
 * Fetch Wikipedia facts for several trek pages in one request.
 *
 * Returns a map keyed by the *requested* wiki title. The API returns pages in
 * arbitrary order and rewrites titles it redirects (`Torna_Fort` comes back as
 * `Torna Fort`), so results are matched through the `redirects` / `normalized`
 * tables rather than by position.
 *
 * Enrichment is decorative: the app renders from treks.json alone. A failure
 * here resolves to an empty map instead of rejecting.
 */
export async function fetchEnrichment(
  wikiTitles: string[],
  signal?: AbortSignal,
): Promise<Record<string, TrekEnrichment>> {
  if (wikiTitles.length === 0) return {}

  const params = new URLSearchParams({
    action: 'query',
    prop: 'pageimages|coordinates|extracts',
    titles: wikiTitles.join('|'),
    pithumbsize: String(THUMB_WIDTH),
    exintro: '1',
    explaintext: '1',
    redirects: '1',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })

  try {
    const response = await fetch(`${ENDPOINT}?${params}`, {
      signal,
      headers: {
        'User-Agent': USER_AGENT,
        // Kept for the web build, where the browser owns `User-Agent` and
        // strips the header above.
        'Api-User-Agent': USER_AGENT,
      },
    })

    // 429 is common when several screens mount at once. Treat it like any
    // other failure: the screen still renders from local data.
    if (!response.ok) return {}

    const body = await response.json()
    const pages: ApiPage[] = body?.query?.pages ?? []

    // Map the title the API answered with back to the title we asked for.
    const requestedFor = new Map<string, string>()
    for (const title of wikiTitles) requestedFor.set(title, title)
    for (const entry of body?.query?.normalized ?? []) {
      requestedFor.set(entry.to, requestedFor.get(entry.from) ?? entry.from)
    }
    for (const entry of body?.query?.redirects ?? []) {
      requestedFor.set(entry.to, requestedFor.get(entry.from) ?? entry.from)
    }

    // The thumbnails are fetched together rather than one after another: they
    // are independent requests to the same host, and six in sequence would make
    // the last card wait on the five before it.
    const entries = await Promise.all(
      pages.map(async (page) => {
        const key = requestedFor.get(page.title) ?? page.title
        const coordinates = page.coordinates?.[0]
        const source = page.thumbnail?.source

        const enrichment: TrekEnrichment = {
          // A `data:` URI, not the remote URL — see `fetchImageAsDataUri`.
          imageUrl: source
            ? await fetchImageAsDataUri(source, signal)
            : undefined,
          imageWidth: page.thumbnail?.width,
          imageHeight: page.thumbnail?.height,
          lat: coordinates?.lat,
          lon: coordinates?.lon,
          extract: page.extract,
        }

        return [key, enrichment] as const
      }),
    )

    return Object.fromEntries(entries)
  } catch {
    return {}
  }
}
