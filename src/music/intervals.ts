// Degree labels indexed by semitone distance from the root (0-11).
export const DEGREE_LABELS = [
	"1",
	"b2",
	"2",
	"m3",
	"3",
	"4",
	"b5",
	"5",
	"m6",
	"6",
	"m7",
	"M7",
] as const;

export function degreeForDelta(delta: number): string {
	return DEGREE_LABELS[((delta % 12) + 12) % 12];
}

/** Semitone distance of `pitchClass` above `rootPitchClass`, in [0, 11]. */
export function intervalDelta(rootPitchClass: number, pitchClass: number): number {
	return ((pitchClass - rootPitchClass) % 12 + 12) % 12;
}

/**
 * Infers a chord quality suffix (e.g. "maj7", "m7", "sus4", "dim") from the set of
 * degree labels present in a voicing. This is a practical heuristic, not a full
 * harmonic analyzer: degrees beyond an octave (9th/11th/13th) are indistinguishable
 * from 2nd/4th/b5 since fretboard positions are analyzed within one octave, so "2"
 * is read as add9/sus2 and "4" as add11/sus4 depending on whether a 3rd is present.
 */
export function inferChordSuffix(presentDegrees: ReadonlySet<string>): string {
	const hasMinor3 = presentDegrees.has("m3");
	const hasMajor3 = presentDegrees.has("3");
	const hasFlat5 = presentDegrees.has("b5") && !presentDegrees.has("5");
	const hasMinor7 = presentDegrees.has("m7");
	const hasMajor7 = presentDegrees.has("M7");
	const has6 = presentDegrees.has("6");
	const has2 = presentDegrees.has("2");
	const has4 = presentDegrees.has("4");

	let suffix = "";

	if (hasMinor3 && hasFlat5 && !hasMinor7 && !hasMajor7) {
		suffix = "dim";
	} else if (hasMinor3) {
		if (hasMajor7) suffix = "m(maj7)";
		else if (hasMinor7) suffix = "m7";
		else if (has6) suffix = "m6";
		else suffix = "m";
		if (hasFlat5 && suffix !== "dim") suffix += "b5";
	} else if (hasMajor3) {
		if (hasMajor7) suffix = "maj7";
		else if (hasMinor7) suffix = "7";
		else if (has6) suffix = "6";
		else suffix = "";
		if (hasFlat5) suffix += "b5";
	} else {
		// No third present: power chord, or sus2/sus4.
		if (has2 && has4) suffix = "sus2sus4";
		else if (has2) suffix = "sus2";
		else if (has4) suffix = "sus4";
		else suffix = "5";
	}

	if ((hasMinor3 || hasMajor3) && has2) suffix += "add9";
	if ((hasMinor3 || hasMajor3) && has4) suffix += "add11";

	return suffix;
}
