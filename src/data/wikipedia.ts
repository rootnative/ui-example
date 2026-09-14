import type { TrekEnrichment } from './types'

const ENDPOINT = 'https://en.wikipedia.org/w/api.php'

/**
 * Wikimedia blocks an anonymous client outright: the API answers 403, not 429.
 *
 * It must go in `User-Agent`. `Api-User-Agent` is only a fallback for
 * browsers, which send their own `User-Agent` underneath. React Native sends
 * none, so a request with `Api-User-Agent` alone looks anonymous and is
 * refused — which is why this failed on device while it worked on web.
 */
export const USER_AGENT =
  'rootnative-ui-example/1.0 (https://github.com/rootnative)'

/** Headers every Wikimedia request needs. */
export const WIKIMEDIA_HEADERS = { 'User-Agent': USER_AGENT }

/**
 * Fetch a Wikimedia image and return it as a `data:` URI.
 *
 * `upload.wikimedia.org` refuses anonymous clients like the API does, and
 * `headers` on an `<Image source>` cannot satisfy it on Android: the native
 * loader prepends its own client token, so the agent arrives as
 * `okhttp/4.x <our agent>`, which Wikimedia answers 403 while `<our agent>`
 * alone answers 200. `fetch` does honour the header, so the bytes come through
 * here and reach the Image as a `data:` URI.
 *
 * The cost is accepted: base64 sits in JS memory at about 4/3 of its encoded
 * size and misses the native disk cache. Do not copy this for a long list.
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
 * Width we ask for. The API snaps this to a rendition that exists and returns
 * that URL — 900 comes back as the real 960px file.
 *
 * Never build a thumbnail URL by substituting a width into the path: Wikimedia
 * serves a fixed set of renditions and answers 400 for any other width.
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
 * Returns a map keyed by the requested wiki title. The API answers in
 * arbitrary order and rewrites titles it redirects, so results are matched
 * through the `redirects` / `normalized` tables rather than by position.
 *
 * Enrichment is decorative, so a failure resolves to an empty map.
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
        // For the web build, where the browser strips the header above.
        'Api-User-Agent': USER_AGENT,
      },
    })

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

    // Together rather than in sequence: six in a row would make the last card
    // wait on the five before it.
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
