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

- Expo SDK 54 with Expo Router
- `@rootnative/core` — theme system with Material Design 3 tokens
- `@rootnative/components` — UI components (Button, Card, Typography, and more)
- `@rootnative/inertia` — the animation layer
- `ThemeProvider` already wired up in the root layout
- A custom "Survey" theme, with Spectral and IBM Plex Mono faces

## Project structure

```
app/
├── _layout.tsx       # Root layout with ThemeProvider
└── index.tsx         # Trek list screen
src/
├── components/       # Sheet, ContourField
├── data/             # Trek data and the Wikipedia fetch
└── theme/            # Survey theme, fonts, colour mode
assets/               # App icons, splash screen, demo QR code
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
