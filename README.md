# RootNative UI Example

A Maharashtra trek discovery app built with [RootNative UI](https://github.com/rootnative/ui) and [Expo Router](https://docs.expo.dev/router/introduction/).

The app uses a "Survey" design language — a vintage topographic map sheet, with aged paper, sepia ink, italic serif display faces and contour texture. RootNative UI ships Material Design 3 as its default skin, so this example shows the opposite: how far you can move the look away from Material.

## Live demo

**https://rootnative.github.io/ui-example/**

Scan to open the demo on a phone:

<img src="assets/qr-web.svg" alt="QR code that links to https://rootnative.github.io/ui-example/" width="180" height="180">

This QR code opens the **web build** in the phone browser. It does not open Expo Go. To run the app in Expo Go, start the dev server as shown below — `expo start` prints its own QR code in the terminal.

## Run it locally

The package manager is **yarn** (`yarn.lock`).

```bash
yarn install
npx expo start
```

Then press `i` for iOS, `a` for Android, or `w` for web. To open the app on a phone, install [Expo Go](https://expo.dev/go) and scan the QR code that `expo start` prints.

## What's included

- Expo SDK 57 with Expo Router
- `@rootnative/core` — theme system with Material Design 3 tokens
- `@rootnative/components` — UI components (Button, Card, Typography, and more)
- `@rootnative/inertia` — the animation layer
- `ThemeProvider` already wired up in the root layout
- A custom "Survey" theme, with Spectral and IBM Plex Mono faces

## Data

The trek records are one JSON file in this repo, served by the same GitHub
Pages deployment as the web app:

```
public/api/v1/treks.json
https://rootnative.github.io/ui-example/api/v1/treks.json
```

Expo copies `public/` into the web export as is, so a push that edits the
file publishes it with the site. The app fetches the hosted file on start.
`src/data/useTreks.ts` also imports the same file at build time, so the list
renders at once and the app has a fallback when the fetch fails. There is one
copy. Photos, coordinates and extracts are not in the file. The app fetches
them from Wikipedia with each trek's `wikiTitle`.

GitHub Pages sends `cache-control: max-age=600`, so an edit can take 10
minutes to reach a device.

### The record shape

| Field            | Type                                       | Meaning                                                    |
| ---------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `id`             | string, lower case, `a-z 0-9 -`            | Stable key. The app routes to `/trek/<id>`.                |
| `name`           | string                                     | Display name.                                              |
| `subtitle`       | string                                     | One line under the name.                                   |
| `wikiTitle`      | string                                     | Wikipedia page title. The app fetches the photo with it.   |
| `sheet`          | string                                     | Survey of India sheet number.                              |
| `district`       | string                                     | District of Maharashtra.                                   |
| `elevationM`     | number                                     | Summit elevation, metres.                                  |
| `baseVillage`    | string                                     | Where the ascent starts.                                   |
| `baseElevationM` | number                                     | Elevation of the base village, metres. Below `elevationM`. |
| `distanceKm`     | number                                     | Ascent distance, one way.                                  |
| `ascentHours`    | number                                     | Time up, hours.                                            |
| `difficulty`     | `easy` \| `moderate` \| `hard`             | Grade. The app filters on it.                              |
| `season`         | array of `monsoon` \| `winter` \| `summer` | Best seasons. At least one. The app filters on it.         |
| `waterPoints`    | number                                     | Water sources on the route.                                |
| `features`       | array of string                            | Free tags. `summit` sets the name in italic.               |
| `note`           | string                                     | One or two sentences for the detail screen.                |
| `verify`         | array of field names, optional             | Fields that still wait for a local source.                 |

The TypeScript type is `Trek` in `src/data/types.ts`. A field added to the
JSON must be added there too.

### Edit a record

1. Edit `public/api/v1/treks.json`.
2. Keep the field names and types in the table. Nothing checks them.
3. Remove a field from `verify` only when a local source confirms the value.
4. Push to `main`. The deploy publishes the file with the site, and the app
   reads the new data on the next start. A native build needs no new release.

## Project structure

```
app/
├── _layout.tsx       # Root layout with ThemeProvider
└── index.tsx         # Trek list screen
src/
├── components/       # Sheet, ContourField
├── data/             # Trek types, the data fetch, the Wikipedia fetch
└── theme/            # Survey theme, fonts, colour mode
assets/               # App icons, splash screen, demo QR code
public/api/v1/        # treks.json, served with the web export
app.json              # Expo config
package.json
tsconfig.json
CLAUDE.md             # Points AI agents at the RootNative LLM docs
```

## Deployment

[.github/workflows/deploy-web.yml](.github/workflows/deploy-web.yml) deploys the web build to GitHub Pages. It runs on a push to `main` and on manual dispatch.

The workflow runs `yarn install --frozen-lockfile`, then `npx expo export --platform web`, then copies `dist/+not-found.html` to `dist/404.html`, because GitHub Pages serves `404.html` for an unknown path. It uploads `dist/` as the Pages artifact.

Two settings in [app.json](app.json) make this work:

- `web.output` is `static`, so the export writes pre-rendered HTML files.
- `experiments.baseUrl` is `/ui-example`, because Pages serves this site from a
  subpath, not from the domain root. Every bundled asset gets that prefix. If
  the repository is renamed, change this value to match.

To turn the deployment on, set **Settings → Pages → Source** to **GitHub Actions** in the repository.

`dist/` is in `.gitignore`. Never commit a build.

## Learn more

- [Quick Start Guide](https://rootnative.github.io/ui/quick-start)
- [RootNative Docs](https://rootnative.github.io/ui)
- [Component API Reference](https://rootnative.github.io/ui/llms-full.txt)
- [GitHub](https://github.com/rootnative/ui)
