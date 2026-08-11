// Shared type definitions for the Fretboard Renderer plugin.
// These mirror the YAML syntax and global settings documented in CLAUDE.md.

export type Orientation = "horizontal" | "vertical";
export type LabelMode = "interval" | "note" | "none";
export type Accidental = "sharp" | "flat";
export type Shape = "circle" | "square" | "triangle";
export type FillStyle = "filled" | "outlined";
export type NutStyle = "thick" | "double";
export type FretNumbering = "all" | "dotted" | "inlay" | "none";
export type OmittedStringBehavior = "open" | "muted" | "none";
export type BoxStyle = "solid" | "dashed";

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
	size?: unknown;
	fretSpacingAdjust?: unknown;
	stringSpacingAdjust?: unknown;
	barre?: unknown;
	boxes?: unknown;
	paths?: unknown;
	notes?: unknown;
}
