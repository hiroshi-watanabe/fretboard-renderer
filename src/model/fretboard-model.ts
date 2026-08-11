import type {
	BarreEntry,
	BoxEntry,
	FillStyle,
	FretNumbering,
	FretValue,
	FretboardBlockConfig,
	FretboardPluginSettings,
	NoteEntry,
	NutStyle,
	Orientation,
	PathEntry,
	Shape,
} from "../types";
import { parseRange } from "../parser/range";
import { parseTuning, pitchClassToName, stringPitchClass } from "../music/notes";
import { degreeForDelta, inferChordSuffix, intervalDelta } from "../music/intervals";

export interface ResolvedNote {
	string: number;
	fret: FretValue;
	label: string;
	shape: Shape;
	finger?: number;
	ghost: boolean;
	className?: string;
	isRoot: boolean;
	/** Note-dot radius in px (System/Global `noteSize` + this note's `sizeAdjust`, times the block's `size`). */
	radius: number;
	/** Label font size in px (System/Global `labelFontSize` + this note's `labelSizeAdjust`, times the block's `size`). */
	labelFontSize: number;
	/** CSS color overriding this note's fill/stroke; undefined uses the theme default. */
	color?: string;
	fillStyle: FillStyle;
}

export interface ResolvedModel {
	orientation: Orientation;
	title: string;
	stringsTotal: number;
	visibleStart: number;
	visibleEnd: number;
	startFret: number;
	fretsWidth: number;
	isRelative: boolean;
	nutStyle: NutStyle;
	fretNumbering: FretNumbering;
	fillStyle: FillStyle;
	stringSpacing: number;
	fretSpacing: number;
	notes: ResolvedNote[];
	barre: BarreEntry[];
	boxes: BoxEntry[];
	paths: PathEntry[];
}

/** Merges a parsed block with plugin-wide defaults into a self-contained render model. */
export function resolveFretboardModel(
	config: FretboardBlockConfig,
	settings: FretboardPluginSettings
): ResolvedModel {
	const tuning = parseTuning(settings.defaultTuning);

	const explicitStrings = new Set(config.notes.map((n) => n.s));
	const maxNoteString = config.notes.reduce((max, n) => Math.max(max, n.s), 0);
	const stringsTotal = Math.max(settings.strings, maxNoteString);

	let visibleStart = 1;
	let visibleEnd = stringsTotal;
	if (config.visible) {
		const range = parseRange(config.visible, "visible");
		visibleStart = range.start;
		visibleEnd = Math.max(range.end, visibleStart);
	}

	// An explicit open string (fret 0) anchors the shape to the nut — it can't be a
	// movable pattern — so its absolute pitch is always known even without `startFret`.
	// Treat that the same as `startFret: 0` for both grid framing and chord naming.
	const hasExplicitOpenString = config.notes.some(
		(n) => n.f === 0 && n.s >= visibleStart && n.s <= visibleEnd
	);
	const isRelative = config.startFret === undefined && !hasExplicitOpenString;
	const frettedValues = config.notes
		.map((n) => n.f)
		.filter((f): f is number => typeof f === "number" && f > 0);
	const startFret = isRelative
		? frettedValues.length > 0
			? Math.min(...frettedValues)
			: 1
		: (config.startFret ?? 0);

	const fretsWidth = config.frets ?? settings.fretCount;

	// Fill in notes for strings the YAML omits entirely, per the omitted-string setting.
	const allNotes: NoteEntry[] = [...config.notes];
	if (settings.omittedStringBehavior !== "none") {
		for (let s = visibleStart; s <= visibleEnd; s++) {
			if (!explicitStrings.has(s)) {
				allNotes.push({ s, f: settings.omittedStringBehavior === "open" ? 0 : "x" });
			}
		}
	}

	const visibleNotes = allNotes.filter((n) => n.s >= visibleStart && n.s <= visibleEnd);

	const size = config.size ?? 1;
	const MIN_SPACING = 8;
	const MIN_RADIUS = 3;
	const MIN_LABEL_FONT_SIZE = 4;
	const stringSpacing = Math.max(
		(settings.stringSpacing + (config.stringSpacingAdjust ?? 0)) * size,
		MIN_SPACING
	);
	const fretSpacing = Math.max((settings.fretSpacing + (config.fretSpacingAdjust ?? 0)) * size, MIN_SPACING);

	const rootEntry = visibleNotes.find((n) => n.label === "root" && typeof n.f === "number");
	const rootPitchClass =
		rootEntry && typeof rootEntry.f === "number"
			? stringPitchClass(openStringPitchClass(tuning, rootEntry.s), rootEntry.f)
			: undefined;

	const presentDegrees = new Set<string>();
	const resolvedNotes: ResolvedNote[] = visibleNotes.map((n) => {
		const pitchClass =
			typeof n.f === "number" ? stringPitchClass(openStringPitchClass(tuning, n.s), n.f) : undefined;

		let isRoot = false;
		let autoLabel = "";
		if (pitchClass !== undefined) {
			if (rootPitchClass !== undefined) {
				const delta = intervalDelta(rootPitchClass, pitchClass);
				isRoot = delta === 0;
				presentDegrees.add(degreeForDelta(delta));
				if (settings.labelMode === "interval") {
					autoLabel = degreeForDelta(delta);
				}
			}
			if (settings.labelMode === "note") {
				autoLabel = pitchClassToName(pitchClass, settings.accidental);
			}
		}

		const hasCustomLabel = n.label !== undefined && n.label !== "root";
		const label = hasCustomLabel ? (n.label as string) : autoLabel;

		const shape: Shape =
			n.shape ?? (isRoot && settings.defaultShape === "circle" ? "square" : settings.defaultShape);

		const classNames: string[] = [];
		if (n.class) classNames.push(n.class);
		if (isRoot) classNames.push("fretboard-note--root");
		if (n.ghost) classNames.push("fretboard-note--ghost");

		const radius = Math.max((settings.noteSize + (n.sizeAdjust ?? 0)) * size, MIN_RADIUS);
		const labelFontSize = Math.max(
			(settings.labelFontSize + (n.labelSizeAdjust ?? 0)) * size,
			MIN_LABEL_FONT_SIZE
		);

		return {
			string: n.s,
			fret: n.f,
			label,
			shape,
			finger: n.finger,
			ghost: n.ghost ?? false,
			className: classNames.length > 0 ? classNames.join(" ") : undefined,
			isRoot,
			radius,
			labelFontSize,
			color: n.color,
			fillStyle: n.fillStyle ?? settings.fillStyle,
		};
	});

	const title = config.title ?? autoTitle(rootPitchClass, presentDegrees, isRelative, settings);

	return {
		orientation: config.orientation ?? settings.orientation,
		title,
		stringsTotal,
		visibleStart,
		visibleEnd,
		startFret,
		fretsWidth,
		isRelative,
		nutStyle: settings.nutStyle,
		fretNumbering: settings.fretNumbering,
		fillStyle: settings.fillStyle,
		stringSpacing,
		fretSpacing,
		notes: resolvedNotes,
		barre: config.barre ?? [],
		boxes: config.boxes ?? [],
		paths: config.paths ?? [],
	};
}

/**
 * Tuning is written low string first (e.g. "E,A,D,G,B,E"), but strings are numbered
 * high string first (string 1 = high e, string 6 = low E), so the mapping is reversed.
 */
function openStringPitchClass(tuning: number[], s: number): number {
	const n = tuning.length;
	const idx = (((n - s) % n) + n) % n;
	return tuning[idx];
}

function autoTitle(
	rootPitchClass: number | undefined,
	presentDegrees: ReadonlySet<string>,
	isRelative: boolean,
	settings: FretboardPluginSettings
): string {
	if (rootPitchClass === undefined) return "";
	const suffix = inferChordSuffix(presentDegrees);
	if (isRelative) {
		return `□${suffix}`;
	}
	return `${pitchClassToName(rootPitchClass, settings.accidental)}${suffix}`;
}
