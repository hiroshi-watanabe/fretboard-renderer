# Fretboard Renderer for VSCode

Render guitar fretboard diagrams — chord shapes, scale boxes, whatever — as SVG, directly in VSCode's built-in Markdown preview. Write a lightweight YAML shorthand in a ` ```fretboard ` fenced code block; the preview renders it as a diagram.

This is the VSCode counterpart to the [Fretboard Renderer Obsidian plugin](https://github.com/hiroshi-watanabe/fretboard-renderer) — same YAML syntax, same rendering engine, shared from the same repository. **This is an early MVP**: static Markdown Preview rendering only. No in-editor autocomplete yet.

## Example

````markdown
```fretboard
startFret: 0
notes:
  - {s: 6, f: 0, label: root}
  - [5, 2]
  - [4, 2]
  - [3, 1]
  - [2, 0]
  - [1, 0]
```
````

Open Markdown Preview (`Ctrl+Shift+V` / `Cmd+Shift+V`) to see it rendered.

## Syntax

Full YAML syntax reference — every field, absolute/relative mode, chord and scale naming, virtual notes, and so on — lives in the [main repository's README](https://github.com/hiroshi-watanabe/fretboard-renderer#readme). This extension implements the same syntax; nothing VSCode-specific about it.

## Configuration

Settings are layered the same way as the Obsidian plugin (System < Global < Local), with System and Global mapped onto VSCode's own mechanisms:

- **System** (installation-wide default): open VSCode's Settings (`Ctrl+,` / `Cmd+,`) and search for "Fretboard Renderer", or edit `settings.json` directly under the `fretboardRenderer.*` keys (e.g. `fretboardRenderer.orientation`, `fretboardRenderer.labelMode`). Every field from the Obsidian plugin's settings tab is available here.
- **Global** (workspace-wide override): add a `fretboard-renderer.yaml` file at the workspace root — same format as the Obsidian plugin's vault-wide config file:

  ```yaml
  orientation: vertical
  fretCount: 5
  labelMode: note
  ```

- **Local** (per-diagram override): any key inside a ` ```fretboard ` block itself, same as in Obsidian.

## Known limitations (MVP)

- No live in-editor autocomplete/IntelliSense while typing YAML.
- Global config (`fretboard-renderer.yaml`) is re-read on every preview render, not watched for changes independent of the note itself.

## License

MIT
