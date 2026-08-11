import { parseYaml } from "obsidian";
import type {
	BarreEntry,
	BoxEntry,
	BoxStyle,
	FillStyle,
	FretValue,
	FretboardBlockConfig,
	NoteEntry,
	Orientation,
	PathEntry,
	RawFretboardBlockConfig,
	Shape,
} from "../types";
import { FretboardParseError } from "./errors";
import { parseRange } from "./range";

const SHAPES: ReadonlySet<string> = new Set(["circle", "square", "triangle"]);
const BOX_STYLES: ReadonlySet<string> = new Set(["solid", "dashed"]);
const ORIENTATIONS: ReadonlySet<string> = new Set(["horizontal", "vertical"]);
const FILL_STYLES: ReadonlySet<string> = new Set(["filled", "outlined"]);
const ADJUST_MIN = -5;
const ADJUST_MAX = 5;

const BLOCK_KEYS: ReadonlySet<string> = new Set([
	"title",
	"visible",
	"startFret",
	"frets",
	"orientation",
	"size",
	"fretSpacingAdjust",
	"stringSpacingAdjust",
	"barre",
	"boxes",
	"paths",
	"notes",
]);
const NOTE_KEYS: ReadonlySet<string> = new Set([
	"s",
	"f",
	"label",
	"shape",
	"finger",
	"ghost",
	"class",
	"color",
	"fillStyle",
	"sizeAdjust",
	"labelSizeAdjust",
]);
const BARRE_KEYS: ReadonlySet<string> = new Set(["fret", "start", "end"]);
const BOX_KEYS: ReadonlySet<string> = new Set(["frets", "strings", "style"]);

/**
 * Rejects unrecognized keys (typos like "flets" instead of "frets") instead of
 * silently ignoring them — a silently-ignored typo looks like the option was applied
 * and did nothing, which is much harder to debug than a clear parse error.
 */
function assertKnownKeys(obj: Record<string, unknown>, allowed: ReadonlySet<string>, context: string): void {
	const unknown = Object.keys(obj).filter((k) => !allowed.has(k));
	if (unknown.length > 0) {
		throw new FretboardParseError(`Unknown key(s) in ${context}: ${unknown.join(", ")}.`);
	}
}

/** Parses and normalizes the raw YAML text of a ```fretboard code block. */
export function parseFretboardBlock(source: string): FretboardBlockConfig {
	let raw: unknown;
	try {
		raw = parseYaml(source);
	} catch (e) {
		throw new FretboardParseError(`YAML syntax error: ${(e as Error).message}`);
	}

	if (raw === null || raw === undefined) {
		throw new FretboardParseError('Empty fretboard block: "notes" is required.');
	}
	if (typeof raw !== "object" || Array.isArray(raw)) {
		throw new FretboardParseError("A fretboard block must be a YAML mapping (key: value pairs).");
	}

	assertKnownKeys(raw as Record<string, unknown>, BLOCK_KEYS, "fretboard block");
	const obj = raw as RawFretboardBlockConfig;

	if (obj.notes === undefined) {
		throw new FretboardParseError('"notes" is required.');
	}
	if (!Array.isArray(obj.notes)) {
		throw new FretboardParseError('"notes" must be a list.');
	}

	const config: FretboardBlockConfig = {
		notes: obj.notes.map((entry, i) => normalizeNote(entry, i)),
	};

	if (obj.title !== undefined) {
		config.title = expectString(obj.title, "title");
	}
	if (obj.visible !== undefined) {
		config.visible = expectString(obj.visible, "visible");
		parseRange(config.visible, "visible"); // validate eagerly
	}
	if (obj.startFret !== undefined) {
		config.startFret = expectInt(obj.startFret, "startFret");
	}
	if (obj.frets !== undefined) {
		config.frets = expectInt(obj.frets, "frets");
	}
	if (obj.orientation !== undefined) {
		const orientation = expectString(obj.orientation, "orientation");
		if (!ORIENTATIONS.has(orientation)) {
			throw new FretboardParseError('"orientation" must be "horizontal" or "vertical".');
		}
		config.orientation = orientation as Orientation;
	}
	if (obj.size !== undefined) {
		config.size = expectPositiveNumber(obj.size, "size");
	}
	if (obj.fretSpacingAdjust !== undefined) {
		config.fretSpacingAdjust = expectRangedInt(obj.fretSpacingAdjust, "fretSpacingAdjust");
	}
	if (obj.stringSpacingAdjust !== undefined) {
		config.stringSpacingAdjust = expectRangedInt(obj.stringSpacingAdjust, "stringSpacingAdjust");
	}
	if (obj.barre !== undefined) {
		config.barre = normalizeBarre(obj.barre);
	}
	if (obj.boxes !== undefined) {
		config.boxes = normalizeBoxes(obj.boxes);
	}
	if (obj.paths !== undefined) {
		config.paths = normalizePaths(obj.paths);
	}

	return config;
}

function normalizeNote(raw: unknown, index: number): NoteEntry {
	if (Array.isArray(raw)) {
		const [s, f, label, shape, finger] = raw;
		return buildNote(
			{ s, f, label, shape, finger },
			index
		);
	}
	if (typeof raw === "object" && raw !== null) {
		const r = raw as Record<string, unknown>;
		assertKnownKeys(r, NOTE_KEYS, `notes[${index}]`);
		return buildNote(
			{
				s: r.s,
				f: r.f,
				label: r.label,
				shape: r.shape,
				finger: r.finger,
				ghost: r.ghost,
				class: r.class,
				color: r.color,
				fillStyle: r.fillStyle,
				sizeAdjust: r.sizeAdjust,
				labelSizeAdjust: r.labelSizeAdjust,
			},
			index
		);
	}
	throw new FretboardParseError(`notes[${index}] must be an object or an array.`);
}

function buildNote(
	fields: {
		s: unknown;
		f: unknown;
		label?: unknown;
		shape?: unknown;
		finger?: unknown;
		ghost?: unknown;
		class?: unknown;
		color?: unknown;
		fillStyle?: unknown;
		sizeAdjust?: unknown;
		labelSizeAdjust?: unknown;
	},
	index: number
): NoteEntry {
	if (typeof fields.s !== "number" || !Number.isInteger(fields.s) || fields.s < 1) {
		throw new FretboardParseError(`notes[${index}].s must be a positive integer (string number).`);
	}
	const f = parseFretValue(fields.f, index);

	const note: NoteEntry = { s: fields.s, f };

	if (fields.label !== undefined) {
		note.label = expectString(fields.label, `notes[${index}].label`);
	}
	if (fields.shape !== undefined) {
		const shape = expectString(fields.shape, `notes[${index}].shape`);
		if (!SHAPES.has(shape)) {
			throw new FretboardParseError(`notes[${index}].shape must be one of circle, square, triangle.`);
		}
		note.shape = shape as Shape;
	}
	if (fields.finger !== undefined) {
		note.finger = expectInt(fields.finger, `notes[${index}].finger`);
	}
	if (fields.ghost !== undefined) {
		if (typeof fields.ghost !== "boolean") {
			throw new FretboardParseError(`notes[${index}].ghost must be true or false.`);
		}
		note.ghost = fields.ghost;
	}
	if (fields.class !== undefined) {
		note.class = expectString(fields.class, `notes[${index}].class`);
	}
	if (fields.color !== undefined) {
		note.color = expectString(fields.color, `notes[${index}].color`);
	}
	if (fields.fillStyle !== undefined) {
		const fillStyle = expectString(fields.fillStyle, `notes[${index}].fillStyle`);
		if (!FILL_STYLES.has(fillStyle)) {
			throw new FretboardParseError(`notes[${index}].fillStyle must be "filled" or "outlined".`);
		}
		note.fillStyle = fillStyle as FillStyle;
	}
	if (fields.sizeAdjust !== undefined) {
		note.sizeAdjust = expectRangedInt(fields.sizeAdjust, `notes[${index}].sizeAdjust`);
	}
	if (fields.labelSizeAdjust !== undefined) {
		note.labelSizeAdjust = expectRangedInt(fields.labelSizeAdjust, `notes[${index}].labelSizeAdjust`);
	}

	return note;
}

function parseFretValue(raw: unknown, index: number): FretValue {
	if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0) {
		return raw;
	}
	if (typeof raw === "string" && raw.trim().toLowerCase() === "x") {
		return "x";
	}
	throw new FretboardParseError(
		`notes[${index}].f must be a non-negative fret number or "x" (muted).`
	);
}

function normalizeBarre(raw: unknown): BarreEntry[] {
	if (!Array.isArray(raw)) {
		throw new FretboardParseError('"barre" must be a list.');
	}
	return raw.map((entry, i) => {
		if (typeof entry !== "object" || entry === null) {
			throw new FretboardParseError(`barre[${i}] must be an object.`);
		}
		const r = entry as Record<string, unknown>;
		assertKnownKeys(r, BARRE_KEYS, `barre[${i}]`);
		return {
			fret: expectInt(r.fret, `barre[${i}].fret`),
			start: expectInt(r.start, `barre[${i}].start`),
			end: expectInt(r.end, `barre[${i}].end`),
		};
	});
}

function normalizeBoxes(raw: unknown): BoxEntry[] {
	if (!Array.isArray(raw)) {
		throw new FretboardParseError('"boxes" must be a list.');
	}
	return raw.map((entry, i) => {
		if (typeof entry !== "object" || entry === null) {
			throw new FretboardParseError(`boxes[${i}] must be an object.`);
		}
		const r = entry as Record<string, unknown>;
		assertKnownKeys(r, BOX_KEYS, `boxes[${i}]`);
		const frets = expectString(r.frets, `boxes[${i}].frets`);
		parseRange(frets, `boxes[${i}].frets`);
		const box: BoxEntry = { frets };
		if (r.strings !== undefined) {
			box.strings = expectString(r.strings, `boxes[${i}].strings`);
			parseRange(box.strings, `boxes[${i}].strings`);
		}
		if (r.style !== undefined) {
			const style = expectString(r.style, `boxes[${i}].style`);
			if (!BOX_STYLES.has(style)) {
				throw new FretboardParseError(`boxes[${i}].style must be "solid" or "dashed".`);
			}
			box.style = style as BoxStyle;
		}
		return box;
	});
}

function normalizePaths(raw: unknown): PathEntry[] {
	if (!Array.isArray(raw)) {
		throw new FretboardParseError('"paths" must be a list.');
	}
	return raw.map((path, i) => {
		if (!Array.isArray(path)) {
			throw new FretboardParseError(`paths[${i}] must be a list of [string, fret] pairs.`);
		}
		return path.map((pair, j) => {
			if (
				!Array.isArray(pair) ||
				pair.length !== 2 ||
				typeof pair[0] !== "number" ||
				typeof pair[1] !== "number"
			) {
				throw new FretboardParseError(`paths[${i}][${j}] must be a [string, fret] pair of numbers.`);
			}
			return [pair[0], pair[1]] as [number, number];
		});
	});
}

function expectString(value: unknown, field: string): string {
	if (typeof value !== "string") {
		throw new FretboardParseError(`"${field}" must be a string.`);
	}
	return value;
}

function expectInt(value: unknown, field: string): number {
	if (typeof value !== "number" || !Number.isInteger(value)) {
		throw new FretboardParseError(`"${field}" must be an integer.`);
	}
	return value;
}

function expectPositiveNumber(value: unknown, field: string): number {
	if (typeof value !== "number" || !(value > 0)) {
		throw new FretboardParseError(`"${field}" must be a positive number.`);
	}
	return value;
}

function expectRangedInt(value: unknown, field: string): number {
	if (
		typeof value !== "number" ||
		!Number.isInteger(value) ||
		value < ADJUST_MIN ||
		value > ADJUST_MAX
	) {
		throw new FretboardParseError(
			`"${field}" must be an integer between ${ADJUST_MIN} and ${ADJUST_MAX}.`
		);
	}
	return value;
}
