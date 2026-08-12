import type { TrekEnrichment } from './types'

const ENDPOINT = 'https://en.wikipedia.org/w/api.php'

/**
 * Wikimedia asks every client to identify itself. An anonymous or generic
 * agent is rate-limited harder, and may be blocked outright.
 */
const USER_AGENT = 'rootnative-ui-example/1.0 (https://github.com/rootnative)'

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
      headers: { 'Api-User-Agent': USER_AGENT },
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

    const result: Record<string, TrekEnrichment> = {}
    for (const page of pages) {
      const key = requestedFor.get(page.title) ?? page.title
      const coordinates = page.coordinates?.[0]
      result[key] = {
        imageUrl: page.thumbnail?.source,
        imageWidth: page.thumbnail?.width,
        imageHeight: page.thumbnail?.height,
        lat: coordinates?.lat,
        lon: coordinates?.lon,
        extract: page.extract,
      }
    }
    return result
  } catch {
    return {}
  }
}
