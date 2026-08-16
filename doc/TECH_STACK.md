# Tech Stack

This document describes the toolchain and libraries used to build and test the Fretboard Renderer **Obsidian plugin**. As of 2026-08-16 this repo contains only the Obsidian plugin shell — the platform-agnostic parsing/rendering/music-theory core it depends on lives in a separate published npm package, [fretboard-renderer-core](https://github.com/hiroshi-watanabe/fretboard-renderer-core), and the VSCode extension that used to live alongside this plugin in the same repo (`vscode-extension/`) has moved to its own repo, [fretboard-renderer-vscode](https://github.com/hiroshi-watanabe/fretboard-renderer-vscode) (its own `doc/TECH_STACK.md`). See "Why the split" below for the full story.

## Requirements

| Tool | Version | How to get it | Notes |
| :--- | :--- | :--- | :--- |
| Node.js | 18 or later recommended | Installer for your OS: [nodejs.org](https://nodejs.org/) | Only needed for development (running `npm`, esbuild). Not a runtime requirement for the plugin itself — the built `main.js` runs inside Obsidian's own JS engine. Developed/verified with Node v24.11.1. |
| npm | Bundled with Node.js | Included with the Node.js installer above — no separate install | Used for dependency management and running scripts. |
| TypeScript | `^5.4.3` (devDependency, see `package.json`) | `npm install` in the repo root pulls it in automatically from `package.json`; no manual/global install needed. Package: [npmjs.com/package/typescript](https://www.npmjs.com/package/typescript) | Compiled to plain JavaScript by esbuild; `tsc` itself is only used for type-checking (`tsc -noEmit`), not for emitting output. |
| Obsidian | `minAppVersion: 1.4.0` (see `manifest.json`) | App download: [obsidian.md](https://obsidian.md/) | Minimum Obsidian version the plugin declares support for. Only needed to actually run/test the plugin, not to build it. |

## Language & module system

- **TypeScript**, `strict: true` (see `tsconfig.json`). Compiles against `target: ES2020`, `module: ESNext`, `moduleResolution: Bundler`, with `lib: ["DOM", "ES2020"]` (DOM types are needed because the renderer builds raw SVG/HTML elements directly).
- No framework (no React/Vue/Svelte). UI is built with Obsidian's own `Setting`/`createEl`/`createDiv` DOM helpers. Diagram rendering itself (raw SVG construction) lives in `fretboard-renderer-core`, not in this repo.

## Build

- **[esbuild](https://esbuild.github.io/)** `^0.20.2` — bundles `src/main.ts` (and, transitively, `fretboard-renderer-core` + its own dependencies, e.g. `yaml`) into the single `main.js` Obsidian loads.
  - Config: `esbuild.config.mjs`. Output format `cjs`, target `es2018`, `obsidian`/`electron`/CodeMirror packages and Node builtins are marked `external` (provided by the Obsidian host at runtime, not bundled). `fretboard-renderer-core` is **not** external — it's bundled in, exactly like `yaml` always has been.
  - `npm run dev` — watch mode (inline sourcemaps, unminified).
  - `npm run build` — runs `tsc -noEmit` for type-checking first, then a minified production build (no sourcemap).
- Node's built-in `node:module` `builtinModules` export supplies the list of Node.js builtin module names to exclude from the bundle (no external package needed for this).
- **tslib** `2.6.2` — runtime helpers TypeScript emits for some down-level syntax; kept small by esbuild's tree-shaking.

## Runtime dependencies (inside Obsidian)

- **[fretboard-renderer-core](https://www.npmjs.com/package/fretboard-renderer-core)** `^0.1.0` — the platform-agnostic parser, diagram model resolver, SVG renderer, chord/scale-naming logic, autocomplete context resolver, and settings-parsing. Bundled directly into `main.js` by esbuild, same as any other regular dependency. See that package's own README/source for its internals; this repo only calls its public API (`parseFretboardBlock`, `resolveFretboardModel`, `buildFretboardSvg`, `toDom`, `DEFAULT_SETTINGS`, `GLOBAL_CONFIG_PATH`/`parseVaultConfig`, `getFretboardCompletions`, ...).
- **yaml** is no longer a direct dependency of this repo — it's a transitive dependency of `fretboard-renderer-core` (which uses it for `fretboard-renderer.yaml` parsing), still bundled into `main.js` by esbuild automatically since it lands in `node_modules` either way.
- Everything else shipped in `main.js` is our own code or `tslib` helpers.

## Testing

There is **no test suite in this repo**. The 8 test files that used to live in `tests/` here (`parser.test.ts`, `notes.test.ts`, `intervals.test.ts`, `model.test.ts`, `render.test.ts`, `scales.test.ts`, `completion.test.ts`, `vault-config.test.ts`) all exercised code that has since moved to `fretboard-renderer-core` — none of them ever tested this repo's own code (`main.ts`, `settings-tab.ts`, `obsidian-suggest.ts`, `obsidian-render.ts`). They moved with that code rather than being duplicated here; see [fretboard-renderer-core's own test suite](https://github.com/hiroshi-watanabe/fretboard-renderer-core) (Vitest, 289 tests as of `0.1.0`). Changes to this repo's own plugin-shell code are verified by building and manually exercising the plugin in a real Obsidian vault.

## Release automation

- `.github/workflows/release.yml` — on any tag push, installs dependencies, builds a production `main.js`, generates a [build provenance attestation](https://github.com/actions/attest-build-provenance) for `main.js`/`manifest.json`/`styles.css` (so users can cryptographically verify the release assets were built from this repository, not tampered with), and creates the GitHub Release with those three files attached. (No test step — see "Testing" above.)

## Source layout

```text
src/
  main.ts                       Plugin entry point (onload, code-block processor, Global config loading)
  settings/
    settings-tab.ts             Settings UI (Obsidian's Setting API)
  completion/
    obsidian-suggest.ts         EditorSuggest wiring for in-editor autocomplete
  render/
    obsidian-render.ts          renderFretboard()/renderFretboardRow() — thin wrappers
                                 around fretboard-renderer-core's buildFretboardSvg()/toDom(),
                                 using Obsidian's HTMLElement.empty()/.createDiv() extensions
```

That's the entire `src/` tree now — everything platform-agnostic (parsing, the diagram model, SVG construction, music theory, autocomplete resolution, settings-parsing) lives in `fretboard-renderer-core` instead. See that package's own docs for its internals.

## Why the split (2026-08-16)

Obsidian's automated plugin-review bot lints every `.ts` file in whatever GitHub Release/tag it evaluates with its own fixed ruleset — it does not read this repo's local `eslint.config.js`, and only ever evaluates git-tracked files, never `node_modules`. That made the old monorepo layout (Obsidian plugin + shared core + VSCode extension all under one `src/`/`vscode-extension/` tree) a poor fit: the bot repeatedly flagged `vscode-extension/*.ts` with false-positive findings that a local ignore rule could never suppress, since the bot doesn't use that config at all.

The fix: move everything that isn't literally an Obsidian API call into its own npm package (`fretboard-renderer-core`), and move `vscode-extension/` into its own repo (`fretboard-renderer-vscode`). Both now consume the core via a normal npm `dependencies` entry — which lands in gitignored `node_modules`, permanently outside the bot's reach, the same way the `yaml` dependency always was. As a secondary benefit, `fretboard-renderer-core` has zero Node-only or Obsidian-only APIs, so it's directly reusable from other environments (e.g. a browser-based renderer) without further extraction work.

## Why these choices

- **esbuild over Rollup/webpack**: it's what Obsidian's own sample plugin and most community plugins use; fast, minimal config, first-class TypeScript support without a separate transpile step.
- **No UI framework**: the plugin renders a handful of DOM elements per settings field; a framework's overhead (bundle size, runtime) isn't justified, and Obsidian's own `Setting` API already covers the settings UI.
- **A separate core package over a monorepo/workspace**: a real npm package boundary (published, versioned, installed into `node_modules`) is what actually keeps shared code outside the review bot's git-tracked scan — a workspace/monorepo tool (npm workspaces, Turborepo, etc.) would keep the shared source in the same git tree and wouldn't fix the underlying problem.

## Release: this repo only

See [fretboard-renderer-vscode's own `doc/TECH_STACK.md`](https://github.com/hiroshi-watanabe/fretboard-renderer-vscode/blob/main/doc/TECH_STACK.md) for that side's toolchain and release process — the two are unrelated pipelines now living in separate repos, not just separate sections of one doc.

1. Bump `version` in `manifest.json`, `package.json`, and `versions.json`.
2. `git tag <version> && git push origin <version>`.
3. `.github/workflows/release.yml` runs automatically: `npm ci` → `npm run build` → attest build provenance → `gh release create`, attaching `main.js`/`manifest.json`/`styles.css` to a new GitHub Release.
4. Users install via Community Plugins browse (this plugin is listed in `community-plugins.json`, pending Obsidian staff's manual review), BRAT, or by manually copying the three release files into `.obsidian/plugins/fretboard-renderer/`.

If a change touches `fretboard-renderer-core`, publish that package first (`npm publish` there — requires the maintainer's own npm login + 2FA, not automated), then bump this repo's `fretboard-renderer-core` dependency version before cutting this repo's own release.
