// Shared type definitions for the Fretboard Renderer plugin.
// These mirror the YAML syntax and global settings documented in CLAUDE.md.

export type Orientation = "horizontal" | "vertical";
export type LabelMode = "interval" | "note" | "none";
export type Accidental = "sharp" | "flat";
/** `none` draws no shape outline at all — just the label text on a borderless filled backdrop (see `drawShape` in `render-fretboard.ts`). */
export type Shape = "circle" | "square" | "triangle" | "none";
export type FillStyle = "filled" | "outlined";
export type NutStyle = "thick" | "double";
export type FretNumbering = "all" | "dotted" | "inlay" | "none";
export type OmittedStringBehavior = "open" | "muted" | "none";
export type BoxStyle = "solid" | "dashed";
/** `chord` names a specific chord (e.g. "Cmaj7"); `scale` names a scale pattern (e.g. "C Dorian") when the present degrees exactly match one. */
export type NamingMode = "chord" | "scale";
/** Notation convention for auto-generated chord suffixes, e.g. minor: "m" / "-" / "-"; major 7th: "maj7" / "maj7" / "Δ7". */
export type ChordSymbolStyle = "standard" | "berklee" | "jazz";

/** Plugin-wide default settings, configurable from the settings tab. */
export interface FretboardPluginSettings {
	orientation: Orientation;
	strings: number;
	fretCount: number;
	stringSpacing: number;
	fretSpacing: number;
	labelMode: LabelMode;
	accidental: Accidental;
	defaultShape: Shape;
	fillStyle: FillStyle;
	nutStyle: NutStyle;
	fretNumbering: FretNumbering;
	/** Comma separated absolute pitches, low string first, e.g. "E,A,D,G,B,E". */
	defaultTuning: string;
	omittedStringBehavior: OmittedStringBehavior;
	/** Base note-dot radius in px (per-note `sizeAdjust` nudges from this). */
	noteSize: number;
	/** Base note label font size in px (per-note `labelSizeAdjust` nudges from this). */
	labelFontSize: number;
	namingMode: NamingMode;
	chordSymbolStyle: ChordSymbolStyle;
	/** Off by default — guitarists very commonly omit the 5th, and marking every such chord would be noisy. */
	omitNotation: boolean;
	/** Whether the auto-generated title shows a slash bass when it's just an inversion
	 * (the chord's own 3rd/5th/7th in the bass) — see `isInversionBass`. A bass note that
	 * ISN'T one of the chord's own tones (a true slash chord) is always shown regardless.
	 * Off by default: real-world chord charts very often skip notating inversions. */
	showInversions: boolean;
}

/** A single fret position: 0 = open, positive = fretted, "x" = muted. */
export type FretValue = number | "x";

/** Fully normalized note entry, after shorthand arrays have been expanded. */
export interface NoteEntry {
	s: number;
	f: FretValue;
	label?: string;
	shape?: Shape;
	finger?: number;
	ghost?: boolean;
	/** True for a reference pitch that isn't physically fretted/sounding: no shape is drawn for
	 * it, only its label in parentheses (e.g. "(R)") at its fretboard position, and it's
	 * excluded from the "lowest sounding note" bass/slash-chord calculation. Its degree still
	 * counts toward chord identity/tension detection like any other note. */
	virtual?: boolean;
	class?: string;
	/** CSS color (e.g. "red", "#ff0000") overriding this note's fill/stroke color. */
	color?: string;
	/** Overrides System/Global `fillStyle` for this note only. */
	fillStyle?: FillStyle;
	/** Integer -5..5, pixel delta from System/Global `noteSize` for this note only. */
	sizeAdjust?: number;
	/** Integer -5..5, pixel delta from System/Global `labelFontSize` for this note only. */
	labelSizeAdjust?: number;
}

/** Raw note entry as written by the user: either an object or a shorthand array. */
export type RawNoteEntry =
	| Record<string, unknown>
	| [number, FretValue]
	| [number, FretValue, string]
	| [number, FretValue, string, Shape]
	| [number, FretValue, string, Shape, number];

export interface BarreEntry {
	fret: number;
	start: number;
	end: number;
}

export interface BoxEntry {
	frets: string;
	strings?: string;
	style?: BoxStyle;
}

/** One polyline connecting dots: a list of [string, fret] coordinate pairs. */
export type PathEntry = Array<[number, number]>;

/** The parsed and normalized content of a ```fretboard code block. */
export interface FretboardBlockConfig {
	title?: string;
	visible?: string;
	startFret?: number;
	frets?: number;
	orientation?: Orientation;
	/** Overrides System/Global naming mode for this diagram's auto-generated title only. */
	namingMode?: NamingMode;
	/** Overrides System/Global chord symbol notation for this diagram's auto-generated title only. */
	chordSymbolStyle?: ChordSymbolStyle;
	/** Overrides System/Global Omit Notation for this diagram's auto-generated title only. */
	omitNotation?: boolean;
	/** Overrides System/Global "show inversions" for this diagram's auto-generated title only. */
	showInversions?: boolean;
	/** Multiplies the resolved string/fret spacing for this block only, e.g. 0.6 to shrink it. */
	size?: number;
	/** Pixel delta applied to the resolved fretSpacing before `size`, range -5..5. */
	fretSpacingAdjust?: number;
	/** Pixel delta applied to the resolved stringSpacing before `size`, range -5..5. */
	stringSpacingAdjust?: number;
	barre?: BarreEntry[];
	boxes?: BoxEntry[];
	paths?: PathEntry[];
	notes: NoteEntry[];
}

/** Raw, pre-normalization shape of the parsed YAML object. */
export interface RawFretboardBlockConfig {
	title?: unknown;
	visible?: unknown;
	startFret?: unknown;
	frets?: unknown;
	orientation?: unknown;
	namingMode?: unknown;
	chordSymbolStyle?: unknown;
	omitNotation?: unknown;
	showInversions?: unknown;
	size?: unknown;
	fretSpacingAdjust?: unknown;
	stringSpacingAdjust?: unknown;
	barre?: unknown;
	boxes?: unknown;
	paths?: unknown;
	notes?: unknown;
}
