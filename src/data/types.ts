export type Difficulty = 'easy' | 'moderate' | 'hard'
export type Season = 'monsoon' | 'winter' | 'summer'

/** A trek as authored in treks.json. Editorial data we own. */
export interface Trek {
  id: string
  name: string
  subtitle: string
  /** Wikipedia page title used to enrich this entry. */
  wikiTitle: string
  /** Survey of India sheet number. */
  sheet: string
  district: string
  elevationM: number
  baseVillage: string
  baseElevationM: number
  distanceKm: number
  ascentHours: number
  difficulty: Difficulty
  season: Season[]
  waterPoints: number
  features: string[]
  note: string
  /** Field names still awaiting verification against a local source. */
  verify?: string[]
}

/** Facts fetched from Wikipedia for one trek. */
export interface TrekEnrichment {
  imageUrl?: string
  imageWidth?: number
  imageHeight?: number
  lat?: number
  lon?: number
  extract?: string
}

/** A trek merged with whatever enrichment succeeded. */
export interface EnrichedTrek extends Trek {
  enrichment?: TrekEnrichment
}

/** Total climb from the base village to the summit, in metres. */
export function elevationGain(trek: Trek) {
  return trek.elevationM - trek.baseElevationM
}

/** Average gradient of the ascent, as a percentage. */
export function gradient(trek: Trek) {
  return (elevationGain(trek) / (trek.distanceKm * 1000)) * 100
}
