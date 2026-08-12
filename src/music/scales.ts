// Named scales for "scale" naming mode, as sets of degree labels (see intervals.ts).
// Scope: standard Western scales (pentatonic, the 7 diatonic modes, the harmonic/melodic
// minor families' most commonly named modes, blues, whole tone, both diminished forms,
// and the two most common bebop scales). Traditional Japanese scales (miyako-bushi,
// inaka-bushi, ritsu, Ryukyu, min'yo, ...) are intentionally out of scope for now and can
// be added the same way: as another entry in SCALES.

export interface ScaleDefinition {
	name: string;
	/** Degree labels this scale contains, e.g. ["1","m3","4","5","m7"] for minor pentatonic. */
	degrees: readonly string[];
}

export const SCALES: readonly ScaleDefinition[] = [
	{ name: "Major Pentatonic", degrees: ["1", "2", "3", "5", "6"] },
	{ name: "Minor Pentatonic", degrees: ["1", "m3", "4", "5", "m7"] },
	{ name: "Ionian (Major)", degrees: ["1", "2", "3", "4", "5", "6", "M7"] },
	{ name: "Dorian", degrees: ["1", "2", "m3", "4", "5", "6", "m7"] },
	{ name: "Phrygian", degrees: ["1", "b2", "m3", "4", "5", "m6", "m7"] },
	{ name: "Lydian", degrees: ["1", "2", "3", "b5", "5", "6", "M7"] },
	{ name: "Mixolydian", degrees: ["1", "2", "3", "4", "5", "6", "m7"] },
	{ name: "Aeolian (Natural Minor)", degrees: ["1", "2", "m3", "4", "5", "m6", "m7"] },
	{ name: "Locrian", degrees: ["1", "b2", "m3", "4", "b5", "m6", "m7"] },
	{ name: "Harmonic Minor", degrees: ["1", "2", "m3", "4", "5", "m6", "M7"] },
	{ name: "Phrygian Dominant", degrees: ["1", "b2", "3", "4", "5", "m6", "m7"] },
	{ name: "Melodic Minor", degrees: ["1", "2", "m3", "4", "5", "6", "M7"] },
	{ name: "Lydian Dominant", degrees: ["1", "2", "3", "b5", "5", "6", "m7"] },
	{ name: "Altered (Super Locrian)", degrees: ["1", "b2", "m3", "3", "b5", "m6", "m7"] },
	{ name: "Half-Diminished (Locrian ♮2)", degrees: ["1", "2", "m3", "4", "b5", "m6", "m7"] },
	{ name: "Blues", degrees: ["1", "m3", "4", "b5", "5", "m7"] },
	{ name: "Whole Tone", degrees: ["1", "2", "3", "b5", "m6", "m7"] },
	{ name: "Diminished (Whole-Half)", degrees: ["1", "2", "m3", "4", "b5", "m6", "6", "M7"] },
	{ name: "Diminished (Half-Whole)", degrees: ["1", "b2", "m3", "3", "b5", "5", "6", "m7"] },
	{ name: "Bebop Dominant", degrees: ["1", "2", "3", "4", "5", "6", "m7", "M7"] },
	{ name: "Bebop Major", degrees: ["1", "2", "3", "4", "5", "m6", "6", "M7"] },
];

/**
 * Finds a scale whose degree set exactly matches `presentDegrees` (same members, no more,
 * no fewer). Returns undefined if nothing matches exactly — callers typically fall back to
 * chord-suffix naming in that case, since a partial/non-standard degree set doesn't
 * unambiguously identify one named scale.
 */
export function findScaleName(presentDegrees: ReadonlySet<string>): string | undefined {
	for (const scale of SCALES) {
		if (scale.degrees.length === presentDegrees.size && scale.degrees.every((d) => presentDegrees.has(d))) {
			return scale.name;
		}
	}
	return undefined;
}
