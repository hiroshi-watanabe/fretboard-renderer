# Tech Stack

This document describes the toolchain and libraries used to build and test the Fretboard Renderer plugin, and why each one was chosen. This repo ships **two platform shells from one shared core**: an Obsidian plugin (repo root) and a VSCode extension (`vscode-extension/`). See "Shared core vs. platform shells" below for how they coexist, and "VSCode extension" for that shell's own toolchain.

## Requirements

| Tool | Version | How to get it | Notes |
| :--- | :--- | :--- | :--- |
| Node.js | 18 or later recommended | Installer for your OS: [nodejs.org](https://nodejs.org/) | Only needed for development (running `npm`, esbuild, vitest). Not a runtime requirement for the plugin itself — the built `main.js` runs inside Obsidian's own JS engine. Developed/verified with Node v24.11.1. |
| npm | Bundled with Node.js | Included with the Node.js installer above — no separate install | Used for dependency management and running scripts. |
| TypeScript | `^5.4.3` (devDependency, see `package.json`) | `npm install` in the repo root (or `vscode-extension/`) pulls it in automatically from `package.json`; no manual/global install needed. Package: [npmjs.com/package/typescript](https://www.npmjs.com/package/typescript) | Compiled to plain JavaScript by esbuild; `tsc` itself is only used for type-checking (`tsc -noEmit`), not for emitting output. |
| Obsidian | `minAppVersion: 1.4.0` (see `manifest.json`) | App download: [obsidian.md](https://obsidian.md/) | Minimum Obsidian version the plugin declares support for. Only needed to actually run/test the plugin, not to build it. |
| VSCode | `engines.vscode: ^1.74.0` (see `vscode-extension/package.json`) | App download: [code.visualstudio.com](https://code.visualstudio.com/) | Minimum VSCode version the extension declares support for. Only needed to actually run/test the extension, not to build it. |

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

- **[yaml](https://www.npmjs.com/package/yaml)** `^2.4.1` (regular dependency, not dev-only) — used for all YAML parsing (`src/parser/parse.ts`, `src/settings/vault-config.ts`), bundled directly into `main.js` by esbuild. Originally this used Obsidian's own `parseYaml` instead (no runtime deps at all), but that only exists inside Obsidian's module loader — switching to the standalone `yaml` package let the same parsing code run unchanged in the VSCode extension's plain Node.js host too (see "Shared core vs. platform shells" under Source layout, below).
- Everything else shipped in `main.js` is our own code or `tslib` helpers.

## Testing

- **[Vitest](https://vitest.dev/)** `^1.4.0` — unit test runner (`npm test` / `npm run test:watch`), configured in `vitest.config.ts`.
  - Runs in a plain Node environment (no DOM/jsdom), since the tested modules (`parser/`, `music/`, `model/`) are pure functions with no DOM dependency. The SVG renderer (`src/render/`) is intentionally not unit-tested this way — it's exercised manually by running the plugin inside Obsidian.
  - The `obsidian` import is aliased (`resolve.alias`) to `tests/mocks/obsidian.ts`, a minimal stand-in that implements `parseYaml` via the **`yaml`** package (`^2.4.1`, devDependency only — not part of the shipped plugin), since the real `obsidian` package has no runtime implementation outside the app.
- Test files live in `tests/`, one file per source module (`parser.test.ts`, `notes.test.ts`, `intervals.test.ts`, `model.test.ts`, `vault-config.test.ts`).

## Release automation

- `.github/workflows/release.yml` — on any tag push, installs dependencies, runs the test suite, builds a production `main.js`, generates a [build provenance attestation](https://github.com/actions/attest-build-provenance) for `main.js`/`manifest.json`/`styles.css` (so users can cryptographically verify the release assets were built from this repository, not tampered with), and creates the GitHub Release with those three files attached.

## Source layout

```text
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
    scales.ts                 SCALES table + best-fit scale-name inference
  model/
    fretboard-model.ts        Merges Local/Global/System into one render-ready model
  render/
    svg-builder.ts            Low-level SVG element helpers: a small VNode tree
                               (tag/attrs/children) with two serializers — toDom()
                               for a real Obsidian DOM, toSvgString() for a plain
                               XML string (no `document`, used by the VSCode extension)
    layout.ts                 Orientation-agnostic grid coordinate mapping
    render-fretboard.ts       buildFretboardSvg() builds the shared VNode tree (grid,
                               notes, barre, boxes, paths); renderFretboard()/
                               renderFretboardRow() (Obsidian-only) wrap it in toDom()
  settings/
    settings.ts               Default (System) settings
    settings-tab.ts           Settings UI (Obsidian-only)
    vault-config.ts           Global (vault-wide YAML file) config parsing
```

### Shared core vs. platform shells

Everything under `src/` is platform-agnostic and shared verbatim (by relative import, not a package/symlink) with the [`vscode-extension/`](../vscode-extension) folder at the repo root — it is **not** Obsidian-only despite living alongside Obsidian's own `main.ts`/`manifest.json`/`styles.css` at the top level. The only Obsidian-specific code is `src/main.ts` (plugin entry point) and `src/settings/settings-tab.ts` (settings UI) — everything else (`parser/`, `music/`, `model/`, `render/svg-builder.ts`'s `toSvgString()` path, `render/layout.ts`, `settings/vault-config.ts`) has no Obsidian dependency and is exercised by both platforms' test suites/builds. `src/render/render-fretboard.ts` sits in between: `buildFretboardSvg()` is shared, `renderFretboard()`/`renderFretboardRow()` are thin Obsidian-only wrappers around it.

`src/` stays at the repo root — rather than moving into a sibling `core/`/`obsidian/` split — because Obsidian plugins conventionally need `manifest.json`/`main.js`/`styles.css` at the repo root for direct-repo installs (e.g. BRAT); keeping the Obsidian plugin's own layout at root avoids disrupting that, at the cost of the shared code visually reading as "the Obsidian plugin's `src/`" unless you know this note exists. `vscode-extension/` imports it via relative paths (`../../src/...`) and bundles it into its own `dist/extension.js` with esbuild, so nothing outside `vscode-extension/` needs to ship for that side to work standalone.

## Why these choices

- **esbuild over Rollup/webpack**: it's what Obsidian's own sample plugin and most community plugins use; fast, minimal config, first-class TypeScript support without a separate transpile step.
- **No UI framework**: the plugin renders a handful of DOM/SVG elements per code block: a framework's overhead (bundle size, runtime) isn't justified, and Obsidian's own `Setting` API already covers the settings UI.
- **Vitest over Jest**: faster, native ESM/TypeScript support with no extra config, and pairs naturally with esbuild-based projects.

## VSCode extension

`vscode-extension/` is its own npm package (own `package.json`/`tsconfig.json`/`esbuild.config.mjs`), sharing the platform-agnostic modules under the repo-root `src/` (see "Shared core vs. platform shells" above) but otherwise independent — it is not a workspace/monorepo package, just relative imports (`../../src/...`) bundled at build time.

- **Entry point**: `src/extension.ts` — `activate()` registers a markdown-it plugin via VSCode's `extendMarkdownIt` contribution point (`markdown.markdownItPlugins: true` in `package.json`), overriding the ` ```fretboard ` fence renderer for the built-in Markdown preview. There's no editor/webview code beyond that — same "render-only" scope as the Obsidian plugin.
- **`src/render-fence.ts`**: parse → resolve → `buildFretboardSvg` (shared) → `toSvgString()` (shared, DOM-free serializer — see `render/svg-builder.ts` above). Has zero `vscode` import, so it's unit-testable independent of the extension host. Errors are escaped into a `<pre class="fretboard-error">` block rather than throwing, matching the Obsidian plugin's per-block error handling (CLAUDE.md §5).
- **`src/settings.ts`**: System settings are just `DEFAULT_SETTINGS` as-is, exposed to the user via VSCode's native settings UI instead of a custom panel — every System-layer key (CLAUDE.md §2.1) is declared under `contributes.configuration` in `package.json`, so VSCode auto-generates the GUI form (`Ctrl+,` → search "Fretboard Renderer"). Global config (`fretboard-renderer.yaml` at the workspace root) reuses the shared `parseVaultConfig` unchanged.
- **Styling**: `media/fretboard-vscode.css` mirrors the Obsidian plugin's `styles.css` class names, remapped to VSCode's webview theme variables (e.g. `--text-normal` → `--vscode-editor-foreground`). Loaded via `markdown.previewStyles` in `package.json`.
- **Build**: same esbuild approach as the Obsidian side (`esbuild.config.mjs`), but `platform: "node"`, `target: "node16"`, output `dist/extension.js`, with `vscode` (not `obsidian`) marked `external`. `tsconfig.json` needs `"types": ["obsidian", "node"]` — the shared `render-fretboard.ts` file still contains Obsidian-only code paths (`toDom()`) guarded off at runtime but present for type-checking, so the `obsidian` ambient types must be pulled in even though nothing in `vscode-extension/` imports the package directly; listing `types` explicitly then requires re-adding `"node"` too, since it disables TS's automatic `@types/*` inclusion.
- **Packaging tool**: **[@vscode/vsce](https://www.npmjs.com/package/@vscode/vsce)** `^2.24.0` (devDependency) — builds and/or uploads the `.vsix`. `npm run package` = `npm run build` (tsc type-check + esbuild production bundle) + `vsce package`.
- **What's excluded from the package** (`.vscodeignore`): `src/**` (TS source), `.vscode/**`, `node_modules/**`, `tsconfig.json`, `esbuild.config.mjs`, `.gitignore`, `**/*.map`.

### What's inside the `.vsix`

A `.vsix` is a zip; `vsce package`'s own output for this project lists exactly what ships:

```
extension.vsixmanifest      Marketplace metadata (from package.json)
[Content_Types].xml
extension/
  CHANGELOG.md
  LICENSE.txt
  README.md                 ← yes, the same README shown on the Marketplace listing page ships inside the package too
  package.json
  dist/
    extension.js             The one esbuild bundle — shared core + extension.ts + render-fence.ts + settings.ts, all in one file
  media/
    fretboard-vscode.css
    icon.png
```

No `node_modules/`, no TypeScript sources, no test files — `dist/extension.js` is fully self-contained (everything not marked `external` in `esbuild.config.mjs` is bundled in).

## Release: Obsidian vs. VSCode

The two shells release through unrelated mechanisms — there is no shared release pipeline, and a version bump has to be done separately in each `package.json`/`manifest.json`.

| | Obsidian plugin | VSCode extension |
| :--- | :--- | :--- |
| Trigger | `git tag <version>` push | Manual |
| Pipeline | `.github/workflows/release.yml` (GitHub Actions): `npm ci` → `npm run build` → `npm test` → attest build provenance → `gh release create` | None — no CI step publishes this side |
| Where it lands | A GitHub Release on this repo, with `main.js`/`manifest.json`/`styles.css` attached | A new version uploaded directly to the [Marketplace publisher page](https://marketplace.visualstudio.com/manage/publishers/hiroshi-watanabe) |
| Package format | **None** — no archive, no zip, no signing. The "release" is just three loose files (`main.js`, `manifest.json`, `styles.css`) attached individually to the GitHub Release. `main.js` is minified but still plain-text JS, not a compiled binary. | A single signed `.vsix` (a zip; see "What's inside the `.vsix`" above) containing the bundle plus README/CHANGELOG/LICENSE/media |
| How users install | Community Plugins browse (once/if submitted to `obsidianmd/obsidian-releases` — not done yet), BRAT, or manual copy into `.obsidian/plugins/` — in every case, the installer just fetches those 3 loose files straight from the GitHub Release and drops them in a folder | VSCode's built-in Extensions view / Marketplace search |
| Auth needed | None beyond a normal `git push` (GitHub Actions uses the repo's own token) | A Microsoft account sign-in to the Marketplace publisher page |

**Why the VSCode side is manual:** `vsce publish` (the command-line path) needs an Azure DevOps Personal Access Token, which requires an Azure DevOps *Organization* to exist first — and creating one led into an unrelated Azure Subscription signup flow that never completed (2026-08-13/14; see the `technical-notes` vault for the full trail: `memo/VscodeExtensionRelease.md`, `memo/ObsidianPluginRelease.md`). The working alternative — build a `.vsix` locally (`npm run package`) and drag-and-drop it into the Marketplace publisher page — needs no PAT, only the Microsoft account sign-in. Until that Azure DevOps org/PAT issue is resolved, releases on this side stay manual: bump `vscode-extension/package.json`'s `version`, run `npm run package`, upload the resulting `.vsix`.
