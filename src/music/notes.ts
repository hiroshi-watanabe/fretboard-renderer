import type { Accidental } from "../types";

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const LETTER_SEMITONES: Record<string, number> = {
	C: 0,
	D: 2,
	E: 4,
	F: 5,
	G: 7,
	A: 9,
	B: 11,
};

/**
 * Parses a note name such as "E", "C#", "Bb", "F##" into a pitch class 0-11.
 * Throws if the input isn't a recognizable note name.
 */
export function parseNoteName(raw: string): number {
	const trimmed = raw.trim();
	const match = /^([A-Ga-g])((?:#|b|s|x)*)$/.exec(trimmed);
	if (!match) {
		throw new Error(`Invalid note name: "${raw}"`);
	}
	const letter = match[1].toUpperCase();
	const accidentals = match[2];
	let semitone = LETTER_SEMITONES[letter];
	for (const ch of accidentals) {
		if (ch === "#" || ch === "s") semitone += 1;
		else if (ch === "b") semitone -= 1;
	}
	return ((semitone % 12) + 12) % 12;
}

/** Parses a comma separated tuning string (e.g. "E,A,D,G,B,E") into pitch classes. */
export function parseTuning(tuning: string): number[] {
	return tuning
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0)
		.map(parseNoteName);
}

export function pitchClassToName(pitchClass: number, accidental: Accidental): string {
	const table = accidental === "flat" ? FLAT_NAMES : SHARP_NAMES;
	return table[((pitchClass % 12) + 12) % 12];
}

/** Pitch class sounded by an open/fretted string; `fret` is semitone offset from the open string. */
export function stringPitchClass(openStringPitchClass: number, fret: number): number {
	return ((openStringPitchClass + fret) % 12 + 12) % 12;
}
