// Autocomplete schema for ```fretboard blocks, built directly on top of the parser's
// own accepted-key/enum sets (src/parser/parse.ts) so this can't silently drift out of
// sync with what parseFretboardBlock actually accepts.
import {
	BARRE_KEYS,
	BLOCK_KEYS,
	BOX_KEYS,
	BOX_STYLES,
	CHORD_SYMBOL_STYLES,
	FILL_STYLES,
	NAMING_MODES,
	NOTE_KEYS,
	ORIENTATIONS,
	SHAPES,
} from "../parser/parse";

export interface KeyInfo {
	key: string;
	detail: string;
}

/** Boolean-valued keys (parser enforces `true`/`false` for these, not an enum set). */
const BOOLEAN_KEYS: ReadonlySet<string> = new Set(["omitNotation", "showInversions", "scaleAnalyze", "ghost", "virtual"]);

const BLOCK_KEY_DETAILS: Record<string, string> = {
	title: "Title printed above the diagram. Auto-generated from the notes if omitted.",
	visible: 'String range of strings to draw, e.g. "1-4".',
	startFret: "Leftmost fret of the grid. Omit for a movable/relative-position diagram.",
	frets: "Fret width to draw. Auto-expands to fit the highest fretted note if omitted.",
	orientation: "horizontal or vertical — overrides System/Global for this diagram only.",
	namingMode: "chord (name a chord) or scale (best-fit scale name) for the auto-generated title.",
	chordSymbolStyle: "standard / berklee / jazz notation for the auto-generated chord title.",
	omitNotation: "true/false — mark missing expected tones, e.g. (omit5), in the auto-generated title.",
	showInversions: "true/false — show a slash bass note when it's just an inversion.",
	scaleAnalyze: "true/false — namingMode: scale only. Shows the top 5 best-fit scale candidates instead of one.",
	size: "Multiplies string/fret spacing for this diagram only, e.g. 0.6 to shrink it.",
	fretSpacingAdjust: "Pixel delta (-5..5) applied to the resolved fretSpacing before size.",
	stringSpacingAdjust: "Pixel delta (-5..5) applied to the resolved stringSpacing before size.",
	barre: "List of {fret, start, end} barre/capo markers.",
	boxes: 'List of {frets, strings?, style?} boxes outlining a region, e.g. a scale position.',
	paths: "List of polylines connecting note dots, each a list of [string, fret] pairs.",
	notes: "Required. List of note entries: {s, f, label?, shape?, ...} or the [s, f, label] shorthand.",
	diagrams: "List of diagrams (each with the same schema) to render side by side in one block.",
};

const NOTE_KEY_DETAILS: Record<string, string> = {
	s: "String number (1 = lowest-numbered string in the diagram).",
	f: 'Fret number, or 0 for open, or "x" for muted.',
	label: '"root" auto-computes the degree; any other string is shown as-is.',
	shape: "circle / square / triangle / none — overrides the default shape for this note only.",
	finger: "Fingering number (1-4) printed below/above the dot.",
	ghost: "true/false — draw this note with a dashed/translucent outline.",
	virtual: "true/false — reference pitch only: no shape drawn, just a parenthesized label, e.g. (R).",
	class: "Custom CSS class name for this note, for highlighting via a CSS snippet.",
	color: 'CSS color overriding this note\'s fill/stroke, e.g. "red" or "#ff0000".',
	fillStyle: "filled / outlined — overrides System/Global fill style for this note only.",
	sizeAdjust: "Pixel delta (-5..5) from the base note size for this note only.",
	labelSizeAdjust: "Pixel delta (-5..5) from the base label font size for this note only.",
};

const BOX_KEY_DETAILS: Record<string, string> = {
	frets: 'Fret range this box covers, e.g. "1-4".',
	strings: 'String range this box covers, e.g. "1-6". Defaults to all visible strings.',
	style: "solid / dashed outline style.",
};

const BARRE_KEY_DETAILS: Record<string, string> = {
	fret: "Fret number the barre is played at.",
	start: "Lowest-numbered string the barre covers.",
	end: "Highest-numbered string the barre covers.",
};

function toKeyInfo(keys: ReadonlySet<string>, details: Record<string, string>): KeyInfo[] {
	return [...keys].map((key) => ({ key, detail: details[key] ?? "" }));
}

/** Top-level diagram keys, plus `diagrams` (the alternate top-level "multiple diagrams" key). */
export const BLOCK_KEY_INFO: readonly KeyInfo[] = [
	...toKeyInfo(BLOCK_KEYS, BLOCK_KEY_DETAILS),
	{ key: "diagrams", detail: BLOCK_KEY_DETAILS.diagrams },
];

export const NOTE_KEY_INFO: readonly KeyInfo[] = toKeyInfo(NOTE_KEYS, NOTE_KEY_DETAILS);
export const BOX_KEY_INFO: readonly KeyInfo[] = toKeyInfo(BOX_KEYS, BOX_KEY_DETAILS);
export const BARRE_KEY_INFO: readonly KeyInfo[] = toKeyInfo(BARRE_KEYS, BARRE_KEY_DETAILS);

/**
 * Which key schema a `{...}` flow-mapping entry belongs to, keyed by the array's own
 * top-level key name. `diagrams` maps back to the block schema itself, since a diagram
 * entry can be written in flow style too, e.g. `diagrams: [{title: X, notes: [...]}]`.
 */
export const ARRAY_ENTRY_SCHEMAS: Readonly<Record<string, readonly KeyInfo[]>> = {
	notes: NOTE_KEY_INFO,
	boxes: BOX_KEY_INFO,
	barre: BARRE_KEY_INFO,
	diagrams: BLOCK_KEY_INFO,
};

const BOOLEAN_VALUES: readonly string[] = ["true", "false"];

/**
 * Flat key -> finite value list, for keys with a closed set of valid values. Safe to keep
 * flat (not scoped per-context like the KeyInfo tables above) because no key name here means
 * something different in a different context — verified against NOTE/BOX/BARRE/BLOCK keys.
 */
export const VALUE_ENUMS: Readonly<Record<string, readonly string[]>> = {
	orientation: [...ORIENTATIONS],
	namingMode: [...NAMING_MODES],
	chordSymbolStyle: [...CHORD_SYMBOL_STYLES],
	shape: [...SHAPES],
	fillStyle: [...FILL_STYLES],
	style: [...BOX_STYLES],
	...Object.fromEntries([...BOOLEAN_KEYS].map((key) => [key, BOOLEAN_VALUES])),
};
