import { parseYaml } from "obsidian";
import type { FretboardPluginSettings } from "../types";

/** Fixed vault-root path for the Global config layer (Local > Global > System). */
export const GLOBAL_CONFIG_PATH = "fretboard-renderer.yaml";

const ORIENTATIONS = new Set(["horizontal", "vertical"]);
const LABEL_MODES = new Set(["interval", "note", "none"]);
const ACCIDENTALS = new Set(["sharp", "flat"]);
const SHAPES = new Set(["circle", "square", "triangle"]);
const FILL_STYLES = new Set(["filled", "outlined"]);
const NUT_STYLES = new Set(["thick", "double"]);
const FRET_NUMBERINGS = new Set(["all", "dotted", "inlay", "none"]);
const OMITTED_BEHAVIORS = new Set(["open", "muted", "none"]);
const NAMING_MODES = new Set(["chord", "scale"]);
const KNOWN_KEYS: ReadonlySet<string> = new Set([
	"orientation",
	"strings",
	"fretCount",
	"stringSpacing",
	"fretSpacing",
	"labelMode",
	"accidental",
	"defaultShape",
	"fillStyle",
	"nutStyle",
	"fretNumbering",
	"defaultTuning",
	"omittedStringBehavior",
	"noteSize",
	"labelFontSize",
	"namingMode",
]);

function str(obj: Record<string, unknown>, key: string): string | undefined {
	if (obj[key] === undefined) return undefined;
	if (typeof obj[key] !== "string") throw new Error(`"${key}" must be a string.`);
	return obj[key];
}

function enumStr(obj: Record<string, unknown>, key: string, allowed: ReadonlySet<string>): string | undefined {
	const value = str(obj, key);
	if (value === undefined) return undefined;
	if (!allowed.has(value)) throw new Error(`"${key}" is invalid: "${value}".`);
	return value;
}

function positiveInt(obj: Record<string, unknown>, key: string): number | undefined {
	if (obj[key] === undefined) return undefined;
	if (typeof obj[key] !== "number" || !Number.isInteger(obj[key]) || obj[key] <= 0) {
		throw new Error(`"${key}" must be a positive integer.`);
	}
	return obj[key];
}

/**
 * Parses the Global config file (GLOBAL_CONFIG_PATH) into a partial settings override.
 * Sits between System (plugin Settings UI) and each diagram's Local YAML in the
 * override chain: Local > Global > System. A bad value, or a misspelled key (e.g.
 * "flets" instead of "frets"), throws so the caller can warn once and fall back to
 * System-only settings — silently ignoring a typo would look like the setting was
 * applied and simply did nothing, which is far harder to debug.
 */
export function parseVaultConfig(source: string): Partial<FretboardPluginSettings> {
	const raw: unknown = parseYaml(source);
	if (raw === null || raw === undefined) return {};
	if (typeof raw !== "object" || Array.isArray(raw)) {
		throw new Error("The Global config file must be a YAML mapping (key: value pairs).");
	}
	const obj = raw as Record<string, unknown>;
	const unknownKeys = Object.keys(obj).filter((k) => !KNOWN_KEYS.has(k));
	if (unknownKeys.length > 0) {
		throw new Error(`Unknown key(s): ${unknownKeys.join(", ")}.`);
	}
	const result: Partial<FretboardPluginSettings> = {};

	const orientation = enumStr(obj, "orientation", ORIENTATIONS);
	if (orientation) result.orientation = orientation as FretboardPluginSettings["orientation"];
	const strings = positiveInt(obj, "strings");
	if (strings) result.strings = strings;
	const fretCount = positiveInt(obj, "fretCount");
	if (fretCount) result.fretCount = fretCount;
	const stringSpacing = positiveInt(obj, "stringSpacing");
	if (stringSpacing) result.stringSpacing = stringSpacing;
	const fretSpacing = positiveInt(obj, "fretSpacing");
	if (fretSpacing) result.fretSpacing = fretSpacing;
	const labelMode = enumStr(obj, "labelMode", LABEL_MODES);
	if (labelMode) result.labelMode = labelMode as FretboardPluginSettings["labelMode"];
	const accidental = enumStr(obj, "accidental", ACCIDENTALS);
	if (accidental) result.accidental = accidental as FretboardPluginSettings["accidental"];
	const defaultShape = enumStr(obj, "defaultShape", SHAPES);
	if (defaultShape) result.defaultShape = defaultShape as FretboardPluginSettings["defaultShape"];
	const fillStyle = enumStr(obj, "fillStyle", FILL_STYLES);
	if (fillStyle) result.fillStyle = fillStyle as FretboardPluginSettings["fillStyle"];
	const nutStyle = enumStr(obj, "nutStyle", NUT_STYLES);
	if (nutStyle) result.nutStyle = nutStyle as FretboardPluginSettings["nutStyle"];
	const fretNumbering = enumStr(obj, "fretNumbering", FRET_NUMBERINGS);
	if (fretNumbering) result.fretNumbering = fretNumbering as FretboardPluginSettings["fretNumbering"];
	const defaultTuning = str(obj, "defaultTuning");
	if (defaultTuning) result.defaultTuning = defaultTuning;
	const omittedStringBehavior = enumStr(obj, "omittedStringBehavior", OMITTED_BEHAVIORS);
	if (omittedStringBehavior) {
		result.omittedStringBehavior = omittedStringBehavior as FretboardPluginSettings["omittedStringBehavior"];
	}
	const noteSize = positiveInt(obj, "noteSize");
	if (noteSize) result.noteSize = noteSize;
	const labelFontSize = positiveInt(obj, "labelFontSize");
	if (labelFontSize) result.labelFontSize = labelFontSize;
	const namingMode = enumStr(obj, "namingMode", NAMING_MODES);
	if (namingMode) result.namingMode = namingMode as FretboardPluginSettings["namingMode"];

	return result;
}
