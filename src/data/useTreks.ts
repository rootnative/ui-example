import { useEffect, useMemo, useState } from 'react'
import bundled from '../../public/api/v1/treks.json'
import type { EnrichedTrek, Trek, TrekEnrichment } from './types'
import { fetchEnrichment } from './wikipedia'

/** The GitHub Pages copy of `public/api/v1/treks.json`. */
const TREKS_URL = 'https://rootnative.github.io/ui-example/api/v1/treks.json'

const BUNDLED_TREKS = bundled.treks as Trek[]

interface TrekData {
  treks: Trek[]
  enrichment: Record<string, TrekEnrichment>
}

/**
 * The hosted file, so an edit pushed to `main` reaches a native build without
 * a new release. A failed or malformed answer resolves to the bundled copy.
 */
async function fetchTreks(signal?: AbortSignal): Promise<Trek[]> {
  try {
    const response = await fetch(TREKS_URL, { signal })
    if (!response.ok) return BUNDLED_TREKS

    const body = await response.json()
    return Array.isArray(body?.treks) ? (body.treks as Trek[]) : BUNDLED_TREKS
  } catch {
    return BUNDLED_TREKS
  }
}

/**
 * Module-level cache. Wikimedia answers 429 when several screens request the
 * same pages together, so the result is fetched once per app session.
 */
let cache: TrekData | null = null
let inFlight: Promise<TrekData> | null = null

function loadTrekData(signal?: AbortSignal) {
  if (cache) return Promise.resolve(cache)
  if (!inFlight) {
    inFlight = fetchTreks(signal)
      .then(async (treks) => ({
        treks,
        enrichment: await fetchEnrichment(
          treks.map((trek) => trek.wikiTitle),
          signal,
        ),
      }))
      .then((result) => {
        cache = result
        inFlight = null
        return result
      })
  }
  return inFlight
}

interface TreksState {
  treks: EnrichedTrek[]
  /** True until the first load of the hosted data and enrichment settles. */
  loading: boolean
}

/**
 * Every trek, merged with Wikipedia photos and coordinates once they arrive.
 * The list renders at once from the bundled dataset, so a slow or failed
 * network never blocks the screen.
 */
export function useTreks(): TreksState {
  const [data, setData] = useState<TrekData | null>(cache)

  useEffect(() => {
    if (cache) return
    const controller = new AbortController()
    let active = true

    loadTrekData(controller.signal).then((result) => {
      if (active) setData(result)
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const treks = useMemo(
    () =>
      (data?.treks ?? BUNDLED_TREKS).map((trek) => ({
        ...trek,
        enrichment: data?.enrichment[trek.wikiTitle],
      })),
    [data],
  )

  return { treks, loading: data === null }
}

/** One trek by id, with the same enrichment the list uses. */
export function useTrek(id: string | undefined) {
  const { treks, loading } = useTreks()
  return { trek: treks.find((trek) => trek.id === id), loading }
}
