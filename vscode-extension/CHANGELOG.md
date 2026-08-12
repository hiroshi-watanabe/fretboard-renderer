# Changelog

## 0.2.0

Added a VSCode Settings UI (`contributes.configuration`, namespaced `fretboardRenderer.*`) for the System settings layer — every field from the Obsidian plugin's settings tab is now configurable from VSCode's own Settings, no need to hand-edit `settings.json`. Workspace-wide `fretboard-renderer.yaml` still overrides it, same as before.

## 0.1.0 — MVP

Initial MVP: renders ```fretboard code blocks in VSCode's built-in Markdown preview, reusing the same parser/model/rendering core as the [Obsidian plugin](https://github.com/hiroshi-watanabe/fretboard-renderer). See the local `fretboard-renderer.yaml` (workspace root) for global config; no settings UI yet.
