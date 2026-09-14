// Per-weight subpaths, not the package root: the root barrel ships all 28
// faces (~6.7 MB) instead of the 7 this theme uses.
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular'
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium'
import { Spectral_400Regular } from '@expo-google-fonts/spectral/400Regular'
import { Spectral_400Regular_Italic } from '@expo-google-fonts/spectral/400Regular_Italic'
import { Spectral_500Medium } from '@expo-google-fonts/spectral/500Medium'
import { Spectral_500Medium_Italic } from '@expo-google-fonts/spectral/500Medium_Italic'
import { Spectral_600SemiBold } from '@expo-google-fonts/spectral/600SemiBold'

/**
 * Each weight and italic registers as its own family, because React Native
 * does not synthesise them reliably and `TypographyToken` has no `fontStyle`
 * field. The scale names an exact face instead of setting `fontWeight`.
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

export const FACE = {
  serif: 'Spectral_400Regular',
  serifMedium: 'Spectral_500Medium',
  serifSemiBold: 'Spectral_600SemiBold',
  // Survey of India convention: italic labels a natural feature, roman a
  // cultural one. The italic carries meaning here.
  serifItalic: 'Spectral_400Regular_Italic',
  serifMediumItalic: 'Spectral_500Medium_Italic',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const
