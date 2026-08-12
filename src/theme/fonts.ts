// Imported through per-weight subpaths, not the package root. The root barrel
// requires every weight of the family, so importing from it ships all 28 faces
// (~6.7 MB) instead of the 7 this theme uses.
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular'
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium'
import { Spectral_400Regular } from '@expo-google-fonts/spectral/400Regular'
import { Spectral_400Regular_Italic } from '@expo-google-fonts/spectral/400Regular_Italic'
import { Spectral_500Medium } from '@expo-google-fonts/spectral/500Medium'
import { Spectral_500Medium_Italic } from '@expo-google-fonts/spectral/500Medium_Italic'
import { Spectral_600SemiBold } from '@expo-google-fonts/spectral/600SemiBold'

/**
 * Font registration for the Survey theme.
 *
 * The faces come from `@expo-google-fonts/*`, so the .ttf files are versioned
 * with the lockfile instead of being committed to the repository.
 *
 * Each weight and italic is registered separately on purpose. React Native
 * does not synthesise them reliably — Android fakes them badly or ignores
 * them — and `TypographyToken` has no `fontStyle` field, so italic can only be
 * selected through `fontFamily`. The typography scale therefore names an exact
 * face rather than relying on `fontWeight`.
 */
export const FONTS = {
  Spectral_400Regular,
  Spectral_400Regular_Italic,
  Spectral_500Medium,
  Spectral_500Medium_Italic,
  Spectral_600SemiBold,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
}

/** Named faces, so the typography scale never repeats a raw string. */
export const FACE = {
  serif: 'Spectral_400Regular',
  serifMedium: 'Spectral_500Medium',
  serifSemiBold: 'Spectral_600SemiBold',
  /**
   * Survey of India convention: italics label natural features (peaks,
   * rivers, ranges), roman labels cultural ones (forts, villages, roads).
   * The italic carries meaning here — it is not decoration.
   */
  serifItalic: 'Spectral_400Regular_Italic',
  serifMediumItalic: 'Spectral_500Medium_Italic',
  /** Grid references, coordinates, elevations — anything that must align. */
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const
