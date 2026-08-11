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
const MULTI_KEYS: ReadonlySet<string> = new Set(["diagrams"]);
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

/** Result of parsing a ```fretboard block: either one diagram, or several to render side by side. */
export type ParsedFretboardBlock =
	| { kind: "single"; config: FretboardBlockConfig }
	| { kind: "multi"; diagrams: FretboardBlockConfig[] };

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

/** Prefixes a field name with its containing context, e.g. "diagrams[0].title", unless top-level. */
function pfx(prefix: string, name: string): string {
	return prefix ? `${prefix}.${name}` : name;
}

/**
 * Parses and normalizes the raw YAML text of a ```fretboard code block. A block is
 * either a single diagram (top-level `notes`) or several diagrams to render side by
 * side (top-level `diagrams`, each with the same schema as a single diagram) — the
 * latter exists because Obsidian's own block layout can't reliably be coerced into a
 * row from outside, so laying multiple diagrams out is handled entirely inside one
 * block/container that the renderer fully controls.
 */
export function parseFretboardBlock(source: string): ParsedFretboardBlock {
	let raw: unknown;
	try {
		raw = parseYaml(source);
	} catch (e) {
		throw new FretboardParseError(`YAML syntax error: ${(e as Error).message}`);
	}

	if (raw === null || raw === undefined) {
		throw new FretboardParseError('Empty fretboard block: "notes" (or "diagrams") is required.');
	}
	if (typeof raw !== "object" || Array.isArray(raw)) {
		throw new FretboardParseError("A fretboard block must be a YAML mapping (key: value pairs).");
	}

	const obj = raw as Record<string, unknown>;

	if (obj.diagrams !== undefined) {
		assertKnownKeys(obj, MULTI_KEYS, "fretboard block");
		if (!Array.isArray(obj.diagrams) || obj.diagrams.length === 0) {
			throw new FretboardParseError('"diagrams" must be a non-empty list.');
		}
		const diagrams = obj.diagrams.map((entry, i) => parseSingleDiagram(entry, `diagrams[${i}]`));
		return { kind: "multi", diagrams };
	}

	return { kind: "single", config: parseSingleDiagram(obj, "") };
}

function parseSingleDiagram(raw: unknown, prefix: string): FretboardBlockConfig {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		throw new FretboardParseError(`"${prefix || "fretboard block"}" must be a YAML mapping (key: value pairs).`);
	}
	assertKnownKeys(raw as Record<string, unknown>, BLOCK_KEYS, prefix || "fretboard block");
	const obj = raw as RawFretboardBlockConfig;

	if (obj.notes === undefined) {
		throw new FretboardParseError(`"${pfx(prefix, "notes")}" is required.`);
	}
	if (!Array.isArray(obj.notes)) {
		throw new FretboardParseError(`"${pfx(prefix, "notes")}" must be a list.`);
	}

	const notesBase = pfx(prefix, "notes");
	const config: FretboardBlockConfig = {
		notes: obj.notes.map((entry, i) => normalizeNote(entry, i, notesBase)),
	};

	if (obj.title !== undefined) {
		config.title = expectString(obj.title, pfx(prefix, "title"));
	}
	if (obj.visible !== undefined) {
		config.visible = expectString(obj.visible, pfx(prefix, "visible"));
		parseRange(config.visible, pfx(prefix, "visible")); // validate eagerly
	}
	if (obj.startFret !== undefined) {
		config.startFret = expectInt(obj.startFret, pfx(prefix, "startFret"));
	}
	if (obj.frets !== undefined) {
		config.frets = expectInt(obj.frets, pfx(prefix, "frets"));
	}
	if (obj.orientation !== undefined) {
		const orientation = expectString(obj.orientation, pfx(prefix, "orientation"));
		if (!ORIENTATIONS.has(orientation)) {
			throw new FretboardParseError(`"${pfx(prefix, "orientation")}" must be "horizontal" or "vertical".`);
		}
		config.orientation = orientation as Orientation;
	}
	if (obj.size !== undefined) {
		config.size = expectPositiveNumber(obj.size, pfx(prefix, "size"));
	}
	if (obj.fretSpacingAdjust !== undefined) {
		config.fretSpacingAdjust = expectRangedInt(obj.fretSpacingAdjust, pfx(prefix, "fretSpacingAdjust"));
	}
	if (obj.stringSpacingAdjust !== undefined) {
		config.stringSpacingAdjust = expectRangedInt(obj.stringSpacingAdjust, pfx(prefix, "stringSpacingAdjust"));
	}
	if (obj.barre !== undefined) {
		config.barre = normalizeBarre(obj.barre, pfx(prefix, "barre"));
	}
	if (obj.boxes !== undefined) {
		config.boxes = normalizeBoxes(obj.boxes, pfx(prefix, "boxes"));
	}
	if (obj.paths !== undefined) {
		config.paths = normalizePaths(obj.paths, pfx(prefix, "paths"));
	}

	return config;
}

function normalizeNote(raw: unknown, index: number, base: string): NoteEntry {
	if (Array.isArray(raw)) {
		const [s, f, label, shape, finger] = raw;
		return buildNote({ s, f, label, shape, finger }, index, base);
	}
	if (typeof raw === "object" && raw !== null) {
		const r = raw as Record<string, unknown>;
		assertKnownKeys(r, NOTE_KEYS, `${base}[${index}]`);
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
			index,
			base
		);
	}
	throw new FretboardParseError(`${base}[${index}] must be an object or an array.`);
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
	index: number,
	base: string
): NoteEntry {
	const noteCtx = `${base}[${index}]`;
	if (typeof fields.s !== "number" || !Number.isInteger(fields.s) || fields.s < 1) {
		throw new FretboardParseError(`${noteCtx}.s must be a positive integer (string number).`);
	}
	const f = parseFretValue(fields.f, noteCtx);

	const note: NoteEntry = { s: fields.s, f };

	if (fields.label !== undefined) {
		note.label = expectString(fields.label, `${noteCtx}.label`);
	}
	if (fields.shape !== undefined) {
		const shape = expectString(fields.shape, `${noteCtx}.shape`);
		if (!SHAPES.has(shape)) {
			throw new FretboardParseError(`${noteCtx}.shape must be one of circle, square, triangle.`);
		}
		note.shape = shape as Shape;
	}
	if (fields.finger !== undefined) {
		note.finger = expectInt(fields.finger, `${noteCtx}.finger`);
	}
	if (fields.ghost !== undefined) {
		if (typeof fields.ghost !== "boolean") {
			throw new FretboardParseError(`${noteCtx}.ghost must be true or false.`);
		}
		note.ghost = fields.ghost;
	}
	if (fields.class !== undefined) {
		note.class = expectString(fields.class, `${noteCtx}.class`);
	}
	if (fields.color !== undefined) {
		note.color = expectString(fields.color, `${noteCtx}.color`);
	}
	if (fields.fillStyle !== undefined) {
		const fillStyle = expectString(fields.fillStyle, `${noteCtx}.fillStyle`);
		if (!FILL_STYLES.has(fillStyle)) {
			throw new FretboardParseError(`${noteCtx}.fillStyle must be "filled" or "outlined".`);
		}
		note.fillStyle = fillStyle as FillStyle;
	}
	if (fields.sizeAdjust !== undefined) {
		note.sizeAdjust = expectRangedInt(fields.sizeAdjust, `${noteCtx}.sizeAdjust`);
	}
	if (fields.labelSizeAdjust !== undefined) {
		note.labelSizeAdjust = expectRangedInt(fields.labelSizeAdjust, `${noteCtx}.labelSizeAdjust`);
	}

	return note;
}

function parseFretValue(raw: unknown, noteCtx: string): FretValue {
	if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0) {
		return raw;
	}
	if (typeof raw === "string" && raw.trim().toLowerCase() === "x") {
		return "x";
	}
	throw new FretboardParseError(`${noteCtx}.f must be a non-negative fret number or "x" (muted).`);
}

function normalizeBarre(raw: unknown, base: string): BarreEntry[] {
	if (!Array.isArray(raw)) {
		throw new FretboardParseError(`"${base}" must be a list.`);
	}
	return raw.map((entry, i) => {
		if (typeof entry !== "object" || entry === null) {
			throw new FretboardParseError(`${base}[${i}] must be an object.`);
		}
		const r = entry as Record<string, unknown>;
		assertKnownKeys(r, BARRE_KEYS, `${base}[${i}]`);
		return {
			fret: expectInt(r.fret, `${base}[${i}].fret`),
			start: expectInt(r.start, `${base}[${i}].start`),
			end: expectInt(r.end, `${base}[${i}].end`),
		};
	});
}

function normalizeBoxes(raw: unknown, base: string): BoxEntry[] {
	if (!Array.isArray(raw)) {
		throw new FretboardParseError(`"${base}" must be a list.`);
	}
	return raw.map((entry, i) => {
		if (typeof entry !== "object" || entry === null) {
			throw new FretboardParseError(`${base}[${i}] must be an object.`);
		}
		const r = entry as Record<string, unknown>;
		assertKnownKeys(r, BOX_KEYS, `${base}[${i}]`);
		const frets = expectString(r.frets, `${base}[${i}].frets`);
		parseRange(frets, `${base}[${i}].frets`);
		const box: BoxEntry = { frets };
		if (r.strings !== undefined) {
			box.strings = expectString(r.strings, `${base}[${i}].strings`);
			parseRange(box.strings, `${base}[${i}].strings`);
		}
		if (r.style !== undefined) {
			const style = expectString(r.style, `${base}[${i}].style`);
			if (!BOX_STYLES.has(style)) {
				throw new FretboardParseError(`${base}[${i}].style must be "solid" or "dashed".`);
			}
			box.style = style as BoxStyle;
		}
		return box;
	});
}

function normalizePaths(raw: unknown, base: string): PathEntry[] {
	if (!Array.isArray(raw)) {
		throw new FretboardParseError(`"${base}" must be a list.`);
	}
	return raw.map((path, i) => {
		if (!Array.isArray(path)) {
			throw new FretboardParseError(`${base}[${i}] must be a list of [string, fret] pairs.`);
		}
		return path.map((pair, j) => {
			if (
				!Array.isArray(pair) ||
				pair.length !== 2 ||
				typeof pair[0] !== "number" ||
				typeof pair[1] !== "number"
			) {
				throw new FretboardParseError(`${base}[${i}][${j}] must be a [string, fret] pair of numbers.`);
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
	if (typeof value !== "number" || !Number.isInteger(value) || value < ADJUST_MIN || value > ADJUST_MAX) {
		throw new FretboardParseError(`"${field}" must be an integer between ${ADJUST_MIN} and ${ADJUST_MAX}.`);
	}
	return value;
}
