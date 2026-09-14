import {
  applyRoundness,
  darkTheme,
  defaultTopAppBarTokens,
  lightTheme,
} from '@rootnative/core'
import type { Theme, TypographyToken } from '@rootnative/core'
import { FACE } from './fonts'

/**
 * "Survey" — a Survey of India topographic sheet, rendered as an app.
 *
 * Every value below is a theme token. No component is forked or wrapped: the
 * same Card, Chip, AppBar and Typography that render Material Design 3 render
 * this. That is the point of the example.
 *
 * `surveyDark` is not an inversion of `surveyLight`. It is the same sheet read
 * under a head torch: the paper warmth stays, the ground drops to slate, and
 * the accent moves to the amber a torch casts.
 */

/** Sampled from a printed sheet, not picked from a colour wheel. */
const paper = '#EDE4D2' // aged sheet
const paperLow = '#E4D9C3' // fold shadow / recessed areas
const paperHigh = '#F5EEE0' // fresh card stock
const ink = '#3B3227' // iron-gall ink
const inkSoft = '#6B5D48' // secondary annotation
const sepia = '#9A4B22' // contour lines, the accent
const sepiaPale = '#D9BFA6' // contour tint
const graticule = '#C8B99C' // grid rules and hairlines
const water = '#5B7B8A' // rivers, cisterns
const errorInk = '#8C2F1F' // correction-stamp red

const lightColors: Theme['colors'] = {
  ...lightTheme.colors,

  primary: sepia,
  onPrimary: paperHigh,
  primaryContainer: sepiaPale,
  onPrimaryContainer: '#4A1F0B',

  secondary: water,
  onSecondary: paperHigh,
  // A sepia wash, not a tint of `secondary`: blue is reserved for water, so a
  // selected filter chip in river blue reads as a map feature. Deeper than
  // `sepiaPale` because a selected chip drops its border, which leaves the
  // fill alone to carry the state — 2.04:1 on the sheet, 5.45:1 for the label.
  secondaryContainer: '#C09A78',
  onSecondaryContainer: '#4A1F0B',

  tertiary: '#5E6B3A', // vegetation green
  onTertiary: paperHigh,
  tertiaryContainer: '#D2D6BA',
  onTertiaryContainer: '#2A3018',

  error: errorInk,
  onError: paperHigh,
  errorContainer: '#E8C9BF',
  onErrorContainer: '#4A130A',

  background: paper,
  onBackground: ink,

  // Higher containers are lighter, the opposite of the MD3 dark ramp: the
  // ramp reads as sheets of paper stacked on a desk.
  surface: paper,
  onSurface: ink,
  surfaceDim: '#DCCFB5',
  surfaceBright: '#F7F2E7',
  surfaceContainerLowest: '#FBF7EE',
  surfaceContainerLow: paperHigh,
  surfaceContainer: '#EFE7D6',
  surfaceContainerHigh: paperLow,
  surfaceContainerHighest: '#DACDB4',

  surfaceVariant: '#DFD3BB',
  onSurfaceVariant: inkSoft,

  outline: graticule,
  outlineVariant: '#DBCFB6',

  inverseSurface: ink,
  inverseOnSurface: paper,
  inversePrimary: '#E9A882',

  surfaceTint: sepia,
  shadow: '#2A2118',
  scrim: 'rgba(42, 33, 24, 0.55)',
}

const slate = '#1C1A17' // ground: warm, never pure black
const slateLow = '#161412' // recessed
const slateHigh = '#252220' // raised card stock
const slateHigher = '#2E2A26'
const lamp = '#E08A3C' // head-torch amber, the night accent
const chalk = '#E4DAC8' // text: bone, not white
const chalkSoft = '#A2988A' // secondary annotation
const graticuleNight = '#453F38' // grid rules in the dark

const darkColors: Theme['colors'] = {
  ...darkTheme.colors,

  primary: lamp,
  onPrimary: '#2A1704',
  primaryContainer: '#573014',
  onPrimaryContainer: '#F6D3B4',

  secondary: '#8FADB9', // moonlit water
  onSecondary: '#16262D',
  // Same reasoning as the light sheet: amber rather than moonlit water, and
  // deepened past `primaryContainer`. 2.29:1 on the slate, 5.39:1 for the label.
  secondaryContainer: '#7D461C',
  onSecondaryContainer: '#F6D3B4',

  tertiary: '#9DAA76', // vegetation, desaturated at night
  onTertiary: '#1F2610',
  tertiaryContainer: '#3D472A',
  onTertiaryContainer: '#DCE4C4',

  error: '#E2705C',
  onError: '#2D0A05',
  errorContainer: '#5C2318',
  onErrorContainer: '#F7CFC6',

  background: slate,
  onBackground: chalk,

  surface: slate,
  onSurface: chalk,
  surfaceDim: '#141210',
  surfaceBright: '#3A3531',
  surfaceContainerLowest: slateLow,
  surfaceContainerLow: slateHigh,
  surfaceContainer: '#221F1C',
  surfaceContainerHigh: slateHigher,
  surfaceContainerHighest: '#38332E',

  surfaceVariant: '#3A342D',
  onSurfaceVariant: chalkSoft,

  outline: graticuleNight,
  outlineVariant: '#332E29',

  inverseSurface: chalk,
  inverseOnSurface: slate,
  inversePrimary: sepia,

  surfaceTint: lamp,
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.66)',
}

function token(
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing = 0,
): TypographyToken {
  // The font file carries the weight, not this field — see `FACE`.
  return { fontFamily, fontSize, fontWeight: '400', lineHeight, letterSpacing }
}

/**
 * A printed sheet mixes three lettering styles, and so does this scale:
 *
 *  - display / headline — italic serif, for the land itself (peaks, ranges)
 *  - title / body       — roman serif, for description and cultural features
 *  - label              — mono, letterspaced, for grid data and legends
 */
const typography: Theme['typography'] = {
  displayLarge: token(FACE.serifItalic, 54, 60, -1),
  displayMedium: token(FACE.serifItalic, 44, 50, -0.6),
  displaySmall: token(FACE.serifItalic, 35, 42, -0.3),

  headlineLarge: token(FACE.serifItalic, 31, 38, -0.2),
  headlineMedium: token(FACE.serifItalic, 27, 34, -0.1),
  headlineSmall: token(FACE.serifItalic, 23, 30, 0),

  titleLarge: token(FACE.serifMedium, 21, 28, 0),
  titleMedium: token(FACE.serifMedium, 17, 24, 0.1),
  titleSmall: token(FACE.serifMedium, 15, 20, 0.1),

  bodyLarge: token(FACE.serif, 16, 25, 0.15),
  bodyMedium: token(FACE.serif, 14.5, 22, 0.2),
  bodySmall: token(FACE.serif, 13, 19, 0.2),

  labelLarge: token(FACE.monoMedium, 12.5, 17, 1.1),
  labelMedium: token(FACE.mono, 11, 15, 1.3),
  labelSmall: token(FACE.mono, 9.5, 13, 1.5),

  displayLargeEmphasized: token(FACE.serifMediumItalic, 54, 60, -1),
  displayMediumEmphasized: token(FACE.serifMediumItalic, 44, 50, -0.6),
  displaySmallEmphasized: token(FACE.serifMediumItalic, 35, 42, -0.3),
  headlineLargeEmphasized: token(FACE.serifMediumItalic, 31, 38, -0.2),
  headlineMediumEmphasized: token(FACE.serifMediumItalic, 27, 34, -0.1),
  headlineSmallEmphasized: token(FACE.serifMediumItalic, 23, 30, 0),
  titleLargeEmphasized: token(FACE.serifSemiBold, 21, 28, 0),
  titleMediumEmphasized: token(FACE.serifSemiBold, 17, 24, 0.1),
  titleSmallEmphasized: token(FACE.serifSemiBold, 15, 20, 0.1),
  bodyLargeEmphasized: token(FACE.serifMedium, 16, 25, 0.15),
  bodyMediumEmphasized: token(FACE.serifMedium, 14.5, 22, 0.2),
  bodySmallEmphasized: token(FACE.serifMedium, 13, 19, 0.2),
  labelLargeEmphasized: token(FACE.monoMedium, 12.5, 17, 1.1),
  labelMediumEmphasized: token(FACE.monoMedium, 11, 15, 1.3),
  labelSmallEmphasized: token(FACE.monoMedium, 9.5, 13, 1.5),
}

/** Paper has no rounded corners, and roundness is the strongest MD3 tell. */
const shape = applyRoundness(0)

/**
 * A printed card casts a hard offset shadow, not an ambient glow.
 * `shadowRadius: 0` with a positive offset gives that from tokens alone.
 */
function press(shadowColor: string) {
  return (offset: number, opacity: number) => ({
    shadowColor,
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: opacity,
    shadowRadius: 0,
    elevation: 0,
  })
}

function elevationSet(shadowColor: string, scale: number): Theme['elevation'] {
  const at = press(shadowColor)
  return {
    level0: at(0, 0),
    level1: at(2, 0.14 * scale),
    level2: at(3, 0.16 * scale),
    level3: at(4, 0.18 * scale),
    level4: at(5, 0.2 * scale),
    level5: at(6, 0.22 * scale),
  }
}

const shared = {
  typography,
  shape,
  // Tighter than MD3: a sheet packs its annotation close to the feature it
  // labels, and the contour texture already gives the eye somewhere to rest.
  spacing: { xs: 3, sm: 6, md: 10, lg: 16, xl: 24 },

  // 20 + 12 sums to the 32 the plates take from `useSheetContentStyle`, so the
  // title lands on the same vertical as the caption under it. The stock MD3 16
  // left it half a gutter to the left of every other line on the sheet. The
  // split keeps a gutter for the trailing icon's touch target.
  topAppBar: {
    ...defaultTopAppBarTokens,
    horizontalPadding: 20,
    titleStartInset: 12,
  },
}

export const surveyLight: Theme = {
  ...lightTheme,
  ...shared,
  colors: lightColors,
  elevation: elevationSet('#2A2118', 1),
}

export const surveyDark: Theme = {
  ...darkTheme,
  ...shared,
  colors: darkColors,
  // A hard shadow needs more weight to stay visible on a dark ground.
  elevation: elevationSet('#000000', 2.2),
}

export interface ContourRamp {
  line: string
  tint: string
  grid: string
  water: string
  ink: string
  paper: string
}

/** Ramp for contour lines and hairline rules drawn in SVG, per theme. */
export const CONTOUR: Record<'light' | 'dark', ContourRamp> = {
  light: {
    line: sepia,
    tint: sepiaPale,
    grid: graticule,
    water,
    ink,
    paper,
  },
  dark: {
    line: lamp,
    tint: '#573014',
    grid: graticuleNight,
    water: '#8FADB9',
    ink: chalk,
    paper: slate,
  },
}
