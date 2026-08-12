# Fretboard Renderer

*[日本語 README](README.ja.md)*

Render guitar fretboard diagrams as SVG in your Obsidian notes, from a lightweight YAML syntax inside fenced code blocks. From analyzing chord progressions to checking pentatonic/mode positions, the goal is clean-looking diagrams with minimal typing.

![Several chord diagrams rendered side by side](images/hero.png)

## Getting started

### Install

Open Settings → Community plugins → Browse, search for **"Fretboard Renderer"**, and install it. (Or see [Development](#development) below to run it from source.)

### Your first diagram

Add a fenced code block with the language set to `fretboard`, and list the notes you want to show — that's the only required part:

````markdown
```fretboard
notes:
  - {s: 6, f: 0, label: root}
  - [5, 2]
  - [4, 5]
  - [3, 2]
  - [2, 0]
  - [1, 0]
```
````

![The Em chord diagram rendered from the example above](images/basic-example.png)

`s` is the string number (1 = highest-pitched string) and `f` is the fret (`0` = open, `x` = muted). Marking one note `label: root` is enough for the plugin to work out the chord name and highlight every note that shares that root, automatically.

## Feature highlights

### Automatic root highlighting & degree labels
Mark any note `label: root` and the plugin computes each note's interval (1, b2, 2, m3, 3, ...) relative to it, and highlights notes sharing the root's pitch (including other octaves) with a different shape/color — no manual styling needed.

### Absolute or relative (movable) diagrams
Give a `startFret` (or use an open string) for a real, fixed-position chord name like `Cmaj7`. Omit it for a movable pattern — the plugin infers the position and labels it generically (`□...`) instead, since the same shape means a different chord depending on where you play it. `boxes` and `paths` pair well with relative mode, for outlining a scale position and tracing a run through it:

![A movable pentatonic scale-box pattern, with a dashed box outline and connecting paths between the notes](images/relative-scale-box.png)

### Multiple diagrams side by side
Use `diagrams:` to lay out several charts in one block — handy for a progression like Cmaj7 → Dm7 → G7 — without fighting Obsidian's block layout:

````markdown
```fretboard
diagrams:
  - {title: Cmaj7, startFret: 0, size: 0.6, notes: [{s: 5, f: 3, label: root}, [4, 2], [3, 0], [2, 0]]}
  - {title: Dm7, startFret: 0, size: 0.6, notes: [{s: 4, f: 0, label: root}, [3, 2], [2, 1], [1, 1]]}
  - {title: G7, startFret: 0, size: 0.6, notes: [{s: 6, f: 3, label: root}, [5, 2], [4, 0], [3, 0], [2, 0], [1, 1]]}
```
````

### Horizontal or vertical orientation
Switch the whole vault (Settings, or a vault-wide `fretboard-renderer.yaml`), or just one diagram with `orientation: vertical`.

![The same shape drawn horizontally and vertically](images/orientation.png)

### Fine control when you need it
Per-note `color`, `fillStyle`, `sizeAdjust`; barres, boxed scale positions, dot-to-dot paths, custom tuning, note-name vs. degree labels, and more — see [Reference](#reference) below.

## Configuration, in brief

Settings are layered in three tiers, each overriding the last: **Local** (this block's YAML) > **Global** (a `fretboard-renderer.yaml` file at the vault root, for vault-wide defaults) > **System** (the plugin's Settings tab, for install-wide defaults). Most people only ever need Local (in the code block) and the Settings tab — Global is there for when you want one vault-wide look without repeating YAML in every note. Full details in [Reference](#reference).

---

## Reference

Everything below is the complete option reference — skip to whatever you need.

### Configuration layers (System / Global / Local)

Configuration is layered in three tiers, **each one overriding the last**:

```
Local (YAML inside a single ```fretboard block)
  ↑ overrides
Global (fretboard-renderer.yaml at the vault root)
  ↑ overrides
System (the plugin's Settings tab)
```

| Layer | Defined in | Scope |
| :--- | :--- | :--- |
| **System** | Obsidian's Settings tab for this plugin | Fallback for every ```fretboard block in the vault |
| **Global** | `fretboard-renderer.yaml` at the vault root | Every ```fretboard block in that vault |
| **Local** | YAML inside each ```fretboard code block | That one block only |

#### System (Settings tab)

Change these under Settings → Fretboard Renderer. They're the defaults for every diagram in the vault. The settings tab is organized into four sections: "Layout & dimensions", "Display & style", "Note appearance", and "Tuning & fallback".

| Setting | Values | Default |
| :--- | :--- | :--- |
| Orientation | `horizontal` / `vertical` | `horizontal` |
| Strings | Number of strings | `6` |
| Fret count | Fret width to draw | `4` |
| String spacing | Spacing between strings (px) | `30` |
| Fret spacing | Spacing between frets (px) | `50` |
| Label mode | `interval` (degree) / `note` (note name) / `none` | `interval` |
| Accidental | `sharp` (#) / `flat` (b) | `sharp` |
| Default shape | `circle` / `square` / `triangle` | `circle` |
| Fill style | `filled` / `outlined` | `filled` |
| Nut style | `thick` / `double` | `thick` |
| Fret numbering | `all` / `dotted` (only fretted columns) / `inlay` (standard inlay positions: 3,5,7,9,12,15,17,19,21,24,...) / `none` | `dotted` |
| Default tuning | Comma separated, lowest string first | `E,A,D,G,B,E` |
| Omitted string behavior | `open` (treat as f:0) / `muted` (treat as f:x) / `none` (draw nothing) | `open` |
| Note size (px) | Base radius of each note dot; a note's `sizeAdjust` (-5..5) is added to this | `10` |
| Label font size (px) | Base font size for note labels; a note's `labelSizeAdjust` (-5..5) is added to this | `10` |

`Label mode: note` only shows note names in **absolute mode** (`startFret` given, or an explicit open string `f: 0` present). In relative/movable mode (`startFret` omitted and no open string), the actual notes depend on where the shape is played, so `note` mode shows no automatic label either (interval labels are unaffected, since the same relationship holds wherever the shape is played).

#### Global (vault-wide YAML config file)

Create a file named **`fretboard-renderer.yaml`** at the vault's **root** (not inside `.obsidian/`) to override System values for the whole vault. It accepts the same keys as the System table above.

```yaml
# <vault root>/fretboard-renderer.yaml
orientation: vertical
fretCount: 5
labelMode: note
```

- Any key that's absent, or if the file doesn't exist, falls back to the System value.
- Saving the file takes effect on the next render — no need to reload the plugin.
- A syntax error shows a one-time Obsidian notice and falls back to System settings (it won't break every diagram in the vault).

#### Local (YAML inside each ```fretboard block)

Write this directly inside each note's ```fretboard code block. It has the highest priority, overriding both System and Global. Only `notes` is required.

```fretboard
title: Am Pentatonic (Box 1)
visible: 1-6
startFret: 5
frets: 4
boxes:
  - {frets: "5-8", style: dashed}
paths:
  - [[6,5], [6,8], [5,5], [5,7]]
notes:
  - {s: 6, f: 5, label: root, shape: square}
  - [6, 8]
  - {s: 5, f: 5}
  - {s: 5, f: 7, finger: 3, ghost: true}
```

##### `notes` (required)

An array of note placements. Both object form and a positional shorthand array are accepted.

```yaml
notes:
  - {s: 6, f: 5, label: root, shape: square, finger: 1, ghost: false, class: "highlight"}
  - [6, 8]              # [s, f]
  - [5, 5, "root"]       # [s, f, label]
  - [5, 7, "3", "square", 3]  # [s, f, label, shape, finger]
  - {s: 4, f: 7, color: red, fillStyle: outlined, sizeAdjust: -3, labelSizeAdjust: 2}
```

| Key | Required | Description |
| :--- | :--- | :--- |
| `s` | Yes | String number (1..N, 1 is the highest-pitched string) |
| `f` | Yes | Fret number. `0` = open, `1`+ = fretted, `x` = muted. **`0` and `x` are not grid columns** — they're always drawn in a special header lane outside the grid, and are never counted as fret-number labels |
| `label` | – | `root` auto-computes the interval degree. Any other string (e.g. `"maj7"`, `"9"`) is shown verbatim, bypassing auto-calculation |
| `shape` | – | `circle` / `square` / `triangle` |
| `finger` | – | Finger number, printed small just outside the dot |
| `ghost` | – | `true` draws a dashed/translucent outline |
| `class` | – | Arbitrary CSS class name, for highlighting via a CSS snippet |
| `color` | – | CSS color for just this note (`red`, `#ff0000`, `var(--color-red)`, ...). Overrides System/Global fill style and the root-highlight color |
| `fillStyle` | – | `filled` / `outlined`. Overrides System/Global `Fill style` for just this note |
| `sizeAdjust` | – | Integer -5..5. Nudges just this note's dot size (px) from `Note size` |
| `labelSizeAdjust` | – | Integer -5..5. Nudges just this note's label font size (px) from `Label font size` |

`color`, `fillStyle`, `sizeAdjust`, and `labelSizeAdjust` are only available in object form (`{s: ..., f: ...}`) — not in the `[s, f, label, shape, finger]` shorthand array.

Notes highlighted as the root (same pitch class as the `label: root` note, including octaves) use the System accent color by default (Obsidian's `--interactive-accent` theme variable, typically purple/blue) — this is intentional default behavior. Use `color` above to override the color of any specific note, e.g. to make it red.

##### Other Local options (all optional)

| Key | Type | Description |
| :--- | :--- | :--- |
| `title` | String | Title printed above the diagram. Auto-generated if omitted (see below) |
| `startFret` | Number | Leftmost fret number of the grid. Omitting it switches to relative mode (see below) |
| `frets` | Number | Fret width to draw (overrides System `Fret count` for this diagram only) |
| `orientation` | `horizontal` / `vertical` | Overrides orientation for this diagram only |
| `size` | Number | Overall scale for this diagram (e.g. `0.6` = 60% size). Useful for fitting several small diagrams together |
| `fretSpacingAdjust` | Integer -5..5 | Pixel nudge to fret spacing, applied before `size` |
| `stringSpacingAdjust` | Integer -5..5 | Pixel nudge to string spacing, applied before `size` |
| `visible` | String | Range of strings to draw, e.g. `"1-4"` |
| `barre` | Array | `{fret, start, end}` — draws a barre marker |
| `boxes` | Array | `{frets: "5-8", strings: "1-6", style: "dashed"}` — outlines a scale position or similar |
| `paths` | Array | `[[6,5],[6,8],[5,5]]` — connects dots with a line |

`size` / `fretSpacingAdjust` / `stringSpacingAdjust` (whole diagram) and each note's `sizeAdjust` / `labelSizeAdjust` exist so you can fine-tune appearance from a note's YAML instead of editing the plugin's own `styles.css` — that file isn't meant to be edited by users. Fine-grained color is likewise handled per-note via `color`, not CSS.

### Absolute mode vs. relative mode

- **Absolute mode:** `startFret` is given, or — even without it — `notes` contains an explicit open string (`f: 0`), since a shape with an open string can't physically be moved up the neck. Generates a real chord name (e.g. `Cmaj7`), and only draws the nut (thick/double line) when the left edge is truly fret 0.
- **Relative mode:** `startFret` is omitted and no open string is present. Treated as a movable pattern: the leftmost fret is set automatically to the lowest fretted note (excluding 0 and x), no fret numbers are printed, and a relative chord name is generated (e.g. `□maj7`).

### Interval auto-calculation and root highlighting

Marking any note with `label: root` auto-computes each note's interval degree (`1, b2, 2, m3, 3, 4, b5, 5, m6, 6, m7, M7`) relative to the tuning, and shows it when label mode is `interval`. Notes matching the root's pitch class (including other octaves) are automatically highlighted (different shape and/or color).

This calculation can't distinguish tensions beyond one octave — e.g. a 9th looks the same as a 2nd, an 11th the same as a 4th. To show them correctly, override a note's `label` (e.g. `label: "9"`) or the diagram's `title` (e.g. `title: Cmaj9`) explicitly.

### Multiple diagrams side by side (`diagrams`)

Writing separate ```fretboard blocks back to back doesn't reliably place them side by side — that depends on how Obsidian itself wraps markdown blocks, which a CSS snippet can't always override (Obsidian sometimes wraps each code block in an outer element the plugin has no access to).

To make this reliable, use the **`diagrams` syntax**: several diagrams in one ```fretboard block. The plugin builds its own flexbox layout entirely inside that one block's container, so it doesn't depend on how Obsidian wraps blocks at all.

```fretboard
diagrams:
  - title: Cmaj7
    startFret: 0
    size: 0.6
    notes:
      - {s: 5, f: 3, label: root}
      - [4, 2]
      - [3, 0]
      - [2, 0]
  - title: Dm7
    startFret: 0
    size: 0.6
    notes:
      - {s: 4, f: 0, label: root}
      - [3, 2]
      - [2, 1]
      - [1, 1]
  - title: G7
    startFret: 0
    size: 0.6
    notes:
      - {s: 6, f: 3, label: root}
      - [5, 2]
      - [4, 0]
      - [3, 0]
      - [2, 0]
      - [1, 1]
```

- A block using `diagrams` (a list) can't mix in other top-level keys like `notes` — it's treated purely as a multi-diagram block.
- Each entry in `diagrams` accepts exactly the same keys as a single diagram (`title`, `startFret`, `notes`, `size`, `orientation`, ...).
- Wrapping happens automatically based on the available width.
- Errors are reported with the diagram's index, e.g. `diagrams[0].notes`.

### Error handling

- **Local (a block's YAML):** A syntax error or invalid value doesn't crash the plugin — it shows a red error message inside that code block.
- **Global (vault-wide file):** A syntax error in `fretboard-renderer.yaml` doesn't break every diagram in the vault — it shows a one-time Obsidian notice and falls back to System settings.
- **Unknown keys (typo detection):** Both Local and Global reject unrecognized keys (e.g. `flets` instead of `frets`) with an explicit error, rather than silently ignoring them — a silently-ignored typo looks like nothing happened, which is much harder to debug. This also applies to keys inside `notes` / `barre` / `boxes` entries.

## Development

```bash
npm install    # install dependencies
npm run dev    # esbuild watch build (keep this running while developing)
npm run build  # type-check + production build (produces main.js)
npm test       # unit tests via vitest
```

See [doc/TECH_STACK.md](doc/TECH_STACK.md) for the toolchain, dependencies, and source layout.

## License

[MIT](LICENSE)
