import { useEffect, useMemo, useState } from 'react'
import raw from './treks.json'
import type { EnrichedTrek, Trek, TrekEnrichment } from './types'
import { fetchEnrichment } from './wikipedia'

export const REGION: string = raw.region
export const TREKS = raw.treks as Trek[]

/**
 * Module-level cache. Wikimedia rate-limits (HTTP 429) when several screens
 * request the same pages in quick succession, so the result is fetched once
 * per app session and shared by every screen.
 */
let cache: Record<string, TrekEnrichment> | null = null
let inFlight: Promise<Record<string, TrekEnrichment>> | null = null

function loadEnrichment(signal?: AbortSignal) {
  if (cache) return Promise.resolve(cache)
  if (!inFlight) {
    inFlight = fetchEnrichment(
      TREKS.map((trek) => trek.wikiTitle),
      signal,
    ).then((result) => {
      cache = result
      inFlight = null
      return result
    })
  }
  return inFlight
}

interface TreksState {
  treks: EnrichedTrek[]
  /** True until the first enrichment attempt settles. */
  loading: boolean
}

/**
 * Every trek, merged with Wikipedia photos and coordinates once they arrive.
 *
 * The list renders immediately from the local dataset — enrichment only adds
 * imagery, so a slow or failed network never blocks the screen.
 */
export function useTreks(): TreksState {
  const [enrichment, setEnrichment] = useState<Record<
    string,
    TrekEnrichment
  > | null>(cache)

  useEffect(() => {
    if (cache) return
    const controller = new AbortController()
    let active = true

    loadEnrichment(controller.signal).then((result) => {
      if (active) setEnrichment(result)
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const treks = useMemo(
    () =>
      TREKS.map((trek) => ({
        ...trek,
        enrichment: enrichment?.[trek.wikiTitle],
      })),
    [enrichment],
  )

  return { treks, loading: enrichment === null }
}

/** One trek by id, with the same enrichment the list uses. */
export function useTrek(id: string | undefined) {
  const { treks, loading } = useTreks()
  return { trek: treks.find((trek) => trek.id === id), loading }
}
