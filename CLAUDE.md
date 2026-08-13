# CLAUDE.md

This project uses [RootNative UI](https://rootnative.github.io/ui/) (`@rootnative/*`) — a design-system agnostic component library for React Native, with Material Design 3 out of the box — and [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation (screens live in `app/`).

## RootNative UI docs for AI agents

Read these before writing code that uses RootNative components:

- `node_modules/@rootnative/components/llms.txt` — all component props for the exact installed version (works offline)
- `node_modules/@rootnative/core/llms.txt` — theme system API (`ThemeProvider`, `useTheme`, `defineTheme`)
- `node_modules/@rootnative/inertia/llms.txt` — the animation layer: `Motion.*` primitives, `useScroll`, `Presence`, `MotionConfig`, and the value-layer hooks
- https://rootnative.github.io/ui/llms.txt — hosted overview (latest release)
- https://rootnative.github.io/ui/llms-full.txt — hosted complete API reference (latest release)

Prefer the `node_modules` copies — they match the installed version exactly.

### `@rootnative/inertia` is a separate package, and its docs are a separate file

`@rootnative/components` depends on `@rootnative/inertia` for motion, so a
component example can use a symbol that `components/llms.txt` never defines.
`AppBar`'s collapse-on-scroll recipe is the one that bites: it uses
`Motion.ScrollView` and `useScroll`, and **both come from `@rootnative/inertia`,
not from `@rootnative/components`**.

```tsx
import { Motion, useScroll } from '@rootnative/inertia'
```

**`Motion` is only exported from the package root.** The subpath exports are
real and numerous (`./view`, `./text`, `./scroll-view`, `./flat-list`,
`./pressable`, `./touch`, …), which makes `@rootnative/inertia/scroll-view` look
like the right guess for `Motion.ScrollView` — it is not. Those subpaths exist
for tree-shaking and export **differently named** symbols (`MotionScrollView`,
not `Motion.ScrollView`). There is no `@rootnative/inertia/motion`.
