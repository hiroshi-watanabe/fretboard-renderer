# Tech Stack

This document describes the toolchain and libraries used to build and test the Fretboard Renderer plugin, and why each one was chosen.

## Requirements

| Tool | Version | Notes |
| :--- | :--- | :--- |
| Node.js | 18 or later recommended | Only needed for development (running `npm`, esbuild, vitest). Not a runtime requirement for the plugin itself — the built `main.js` runs inside Obsidian's own JS engine. Developed/verified with Node v24.11.1. |
| npm | Bundled with Node.js | Used for dependency management and running scripts. |
| TypeScript | `^5.4.3` (devDependency, see `package.json`) | Compiled to plain JavaScript by esbuild; `tsc` itself is only used for type-checking (`tsc -noEmit`), not for emitting output. |
| Obsidian | `minAppVersion: 1.4.0` (see `manifest.json`) | Minimum Obsidian version the plugin declares support for. |

## Language & module system

- **TypeScript**, `strict: true` (see `tsconfig.json`). Compiles against `target: ES2020`, `module: ESNext`, `moduleResolution: Bundler`, with `lib: ["DOM", "ES2020"]` (DOM types are needed because the renderer builds raw SVG/HTML elements directly).
- No framework (no React/Vue/Svelte). UI is built with Obsidian's own `Setting`/`createEl`/`createDiv` DOM helpers, and diagrams are built as raw SVG via a small internal builder (`src/render/svg-builder.ts`) using `document.createElementNS` + `setAttribute` — deliberately avoiding `innerHTML`/`insertAdjacentHTML` for security reasons (per Obsidian's plugin guidelines).

## Build

- **[esbuild](https://esbuild.github.io/)** `^0.20.2` — bundles `src/main.ts` into the single `main.js` Obsidian loads.
  - Config: `esbuild.config.mjs`. Output format `cjs`, target `es2018`, `obsidian`/`electron`/CodeMirror packages and Node builtins are marked `external` (provided by the Obsidian host at runtime, not bundled).
  - `npm run dev` — watch mode (inline sourcemaps, unminified).
  - `npm run build` — runs `tsc -noEmit` for type-checking first, then a minified production build (no sourcemap).
- Node's built-in `node:module` `builtinModules` export supplies the list of Node.js builtin module names to exclude from the bundle (no external package needed for this).
- **tslib** `2.6.2` — runtime helpers TypeScript emits for some down-level syntax; kept small by esbuild's tree-shaking.

## Runtime dependencies (inside Obsidian)

The plugin has **no npm runtime dependencies** — everything shipped in `main.js` is either our own code or `tslib` helpers.

- **YAML parsing**: uses Obsidian's own `parseYaml` (imported from the `obsidian` package, which Obsidian's module loader resolves internally at runtime — the `obsidian` npm package itself ships only TypeScript type declarations, no implementation). We do not bundle a YAML library.

## Testing

- **[Vitest](https://vitest.dev/)** `^1.4.0` — unit test runner (`npm test` / `npm run test:watch`), configured in `vitest.config.ts`.
  - Runs in a plain Node environment (no DOM/jsdom), since the tested modules (`parser/`, `music/`, `model/`) are pure functions with no DOM dependency. The SVG renderer (`src/render/`) is intentionally not unit-tested this way — it's exercised manually by running the plugin inside Obsidian.
  - The `obsidian` import is aliased (`resolve.alias`) to `tests/mocks/obsidian.ts`, a minimal stand-in that implements `parseYaml` via the **`yaml`** package (`^2.4.1`, devDependency only — not part of the shipped plugin), since the real `obsidian` package has no runtime implementation outside the app.
- Test files live in `tests/`, one file per source module (`parser.test.ts`, `notes.test.ts`, `intervals.test.ts`, `model.test.ts`, `vault-config.test.ts`).

## Release automation

- `.github/workflows/release.yml` — on any tag push, installs dependencies, runs the test suite, builds a production `main.js`, generates a [build provenance attestation](https://github.com/actions/attest-build-provenance) for `main.js`/`manifest.json`/`styles.css` (so users can cryptographically verify the release assets were built from this repository, not tampered with), and creates the GitHub Release with those three files attached.

## Source layout

```
src/
  main.ts                    Plugin entry point (onload, code-block processor, Global config loading)
  types.ts                   Shared type definitions (YAML schema, plugin settings)
  parser/
    parse.ts                 YAML → normalized config (validation, error messages)
    range.ts                 "5-8" style range parsing, shared by fret/string ranges
    errors.ts                FretboardParseError
  music/
    notes.ts                 Note name ⇄ pitch class, tuning parsing
    intervals.ts              Interval degree calculation, chord-name suffix inference
  model/
    fretboard-model.ts        Merges Local/Global/System into one render-ready model
  render/
    svg-builder.ts            Low-level SVG element helpers
    layout.ts                 Orientation-agnostic grid coordinate mapping
    render-fretboard.ts       Draws the grid, notes, barre, boxes, paths
  settings/
    settings.ts               Default (System) settings
    settings-tab.ts           Settings UI
    vault-config.ts           Global (vault-wide YAML file) config parsing
```

## Why these choices

- **esbuild over Rollup/webpack**: it's what Obsidian's own sample plugin and most community plugins use; fast, minimal config, first-class TypeScript support without a separate transpile step.
- **No UI framework**: the plugin renders a handful of DOM/SVG elements per code block: a framework's overhead (bundle size, runtime) isn't justified, and Obsidian's own `Setting` API already covers the settings UI.
- **Vitest over Jest**: faster, native ESM/TypeScript support with no extra config, and pairs naturally with esbuild-based projects.
