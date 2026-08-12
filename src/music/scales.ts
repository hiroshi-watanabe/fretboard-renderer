import { DEGREE_LABELS } from "./intervals";

// Named scales for "scale" naming mode's best-fit inference (see `findBestFitScale` and
// CLAUDE.md §4.4), as sets of degree labels (see intervals.ts). Scope: standard Western
// scale families plus the Japanese Hirajoshi and Ryukyu pentatonic families, each fully
// enumerated across every rotation/mode — pentatonic, the 7 diatonic modes, all 7
// melodic-minor modes, all 7 harmonic-minor modes, both augmented-scale modes, both
// diminished forms, and all 8 modes each of Bebop Dominant/Major. Other traditional Japanese
// scales (miyako-bushi, inaka-bushi, ritsu, min'yo, ...) are distinct modal systems,
// intentionally out of scope for now, and can be added the same way: as more entries here.
//
// Every rotation is listed (not just the traditionally-named ones) because the root here is
// always user-assigned (see CLAUDE.md §4.1) — the same collection of notes read from a
// different starting note is a different degree set, and thus a different row in this table.
// Array order is a last-resort tie-break for `findBestFitScale` (after score, then scale
// size), for the rare case of two same-size scales scoring identically.

export interface ScaleDefinition {
	name: string;
	/** Degree labels this scale contains, e.g. ["1","m3","4","5","m7"] for minor pentatonic. */
	degrees: readonly string[];
}

export const SCALES: readonly ScaleDefinition[] = [
	// --- Pentatonic (Major Pentatonic family, all 5 rotations) --- Major/Minor Pentatonic
	// (the two overwhelmingly common ones) are placed first within the family — array order
	// is `findBestFitScale`'s last-resort tie-break (see note above), and these two should
	// win a tie over the much rarer in-between modes, not lose to them by rotation position.
	{ name: "Major Pentatonic", degrees: ["1", "2", "3", "5", "6"] },
	{ name: "Minor Pentatonic", degrees: ["1", "m3", "4", "5", "m7"] },
	{ name: "Suspended Pentatonic (Mode 2)", degrees: ["1", "2", "4", "5", "m7"] },
	{ name: "Phrygian Pentatonic (Mode 3)", degrees: ["1", "m3", "4", "m6", "m7"] },
	{ name: "Mixolydian Pentatonic (Mode 4)", degrees: ["1", "2", "4", "5", "6"] },

	// --- Dominant Pentatonic family, all 5 rotations --- Major Pentatonic with a b7 instead
	// of a 6th (not a rotation of the Major Pentatonic family above — a genuinely different
	// 5-note collection).
	{ name: "Dominant Pentatonic", degrees: ["1", "2", "3", "5", "m7"] },
	{ name: "Dominant Pentatonic (Mode 2)", degrees: ["1", "2", "4", "m6", "m7"] },
	{ name: "Dominant Pentatonic (Mode 3)", degrees: ["1", "m3", "b5", "m6", "m7"] },
	{ name: "Dominant Pentatonic (Mode 4)", degrees: ["1", "m3", "4", "5", "6"] },
	{ name: "Dominant Pentatonic (Mode 5)", degrees: ["1", "2", "3", "b5", "6"] },

	// --- Japanese Pentatonic — Hirajoshi family, all 5 rotations --- Mode 4 is the same
	// note collection as the "In Sen" (陰音階) scale under its own separate name/tradition —
	// folded into this one row rather than a duplicate entry, since two rows with identical
	// degree sets would make `findBestFitScale` matching ambiguous (see the uniqueness note
	// above).
	{ name: "Hirajoshi", degrees: ["1", "2", "m3", "5", "m6"] },
	{ name: "Iwato (Hirajoshi Mode 2)", degrees: ["1", "b2", "4", "b5", "m7"] },
	{ name: "Hon-Kumoi-joshi (Hirajoshi Mode 3)", degrees: ["1", "3", "4", "6", "M7"] },
	{ name: "In Sen / Kumoi / Miyakobushi (Hirajoshi Mode 4)", degrees: ["1", "b2", "4", "5", "m6"] },
	{ name: "Lydian Pentatonic / Chinese (Hirajoshi Mode 5)", degrees: ["1", "3", "b5", "5", "M7"] },

	// --- Japanese Pentatonic — Ryukyu family, all 5 rotations ---
	{ name: "Ryukyu", degrees: ["1", "3", "4", "5", "M7"] },
	{ name: "Ryukyu (Mode 2)", degrees: ["1", "b2", "m3", "5", "m6"] },
	{ name: "Ryukyu (Mode 3)", degrees: ["1", "2", "b5", "5", "M7"] },
	{ name: "Hindu Pentatonic (Ryukyu Mode 4)", degrees: ["1", "3", "4", "6", "m7"] },
	{ name: "Ryukyu (Mode 5)", degrees: ["1", "b2", "4", "b5", "m6"] },

	// --- Diatonic modes (Major scale, all 7 rotations) ---
	{ name: "Ionian (Major)", degrees: ["1", "2", "3", "4", "5", "6", "M7"] },
	{ name: "Dorian", degrees: ["1", "2", "m3", "4", "5", "6", "m7"] },
	{ name: "Phrygian", degrees: ["1", "b2", "m3", "4", "5", "m6", "m7"] },
	{ name: "Lydian", degrees: ["1", "2", "3", "b5", "5", "6", "M7"] },
	{ name: "Mixolydian", degrees: ["1", "2", "3", "4", "5", "6", "m7"] },
	{ name: "Aeolian (Natural Minor)", degrees: ["1", "2", "m3", "4", "5", "m6", "m7"] },
	{ name: "Locrian", degrees: ["1", "b2", "m3", "4", "b5", "m6", "m7"] },

	// --- Melodic minor, all 7 rotations --- the "famous three" derived modes (Lydian
	// Dominant, Altered, Half-Diminished) go right after the parent scale, ahead of the
	// much rarer Dorian b2/Lydian Augmented/Mixolydian b6, for the same tie-break reason.
	{ name: "Melodic Minor", degrees: ["1", "2", "m3", "4", "5", "6", "M7"] },
	{ name: "Lydian Dominant", degrees: ["1", "2", "3", "b5", "5", "6", "m7"] },
	{ name: "Altered (Super Locrian)", degrees: ["1", "b2", "m3", "3", "b5", "m6", "m7"] },
	{ name: "Half-Diminished (Locrian ♮2)", degrees: ["1", "2", "m3", "4", "b5", "m6", "m7"] },
	{ name: "Dorian b2", degrees: ["1", "b2", "m3", "4", "5", "6", "m7"] },
	{ name: "Lydian Augmented", degrees: ["1", "2", "3", "b5", "m6", "6", "M7"] },
	{ name: "Mixolydian b6", degrees: ["1", "2", "3", "4", "5", "m6", "m7"] },

	// --- Harmonic minor, all 7 rotations --- Phrygian Dominant (by far the most commonly
	// used derived mode) goes right after the parent scale, same reasoning as above.
	{ name: "Harmonic Minor", degrees: ["1", "2", "m3", "4", "5", "m6", "M7"] },
	{ name: "Phrygian Dominant", degrees: ["1", "b2", "3", "4", "5", "m6", "m7"] },
	{ name: "Locrian ♮6", degrees: ["1", "b2", "m3", "4", "b5", "6", "m7"] },
	{ name: "Ionian #5", degrees: ["1", "2", "3", "4", "m6", "6", "M7"] },
	{ name: "Dorian #4", degrees: ["1", "2", "m3", "b5", "5", "6", "m7"] },
	{ name: "Lydian #2", degrees: ["1", "m3", "3", "b5", "5", "6", "M7"] },
	{ name: "Ultralocrian (Altered Diminished)", degrees: ["1", "b2", "m3", "3", "b5", "m6", "6"] },

	// --- Harmonic Major, all 7 rotations --- Major scale with a b6. Confident, well-attested
	// alternate names for the individual derived modes vary a lot across sources, so (unlike
	// the melodic/harmonic minor families above) modes 2-7 are left as generic "(Mode N)"
	// rather than risk asserting a shaky/inconsistent name.
	{ name: "Harmonic Major", degrees: ["1", "2", "3", "4", "5", "m6", "M7"] },
	{ name: "Harmonic Major (Mode 2)", degrees: ["1", "2", "m3", "4", "b5", "6", "m7"] },
	{ name: "Harmonic Major (Mode 3)", degrees: ["1", "b2", "m3", "3", "5", "m6", "m7"] },
	{ name: "Harmonic Major (Mode 4)", degrees: ["1", "2", "m3", "b5", "5", "6", "M7"] },
	{ name: "Harmonic Major (Mode 5)", degrees: ["1", "b2", "3", "4", "5", "6", "m7"] },
	{ name: "Harmonic Major (Mode 6)", degrees: ["1", "m3", "3", "b5", "m6", "6", "M7"] },
	{ name: "Harmonic Major (Mode 7)", degrees: ["1", "b2", "m3", "4", "b5", "m6", "6"] },

	// --- Double Harmonic Major, all 7 rotations --- aka Byzantine/Arabic/Gypsy Major scale.
	// Same naming caution as Harmonic Major above: only the well-attested parent-scale name
	// is used, derived modes are generic "(Mode N)".
	{ name: "Double Harmonic Major", degrees: ["1", "b2", "3", "4", "5", "m6", "M7"] },
	{ name: "Double Harmonic Major (Mode 2)", degrees: ["1", "m3", "3", "b5", "5", "m7", "M7"] },
	{ name: "Double Harmonic Major (Mode 3)", degrees: ["1", "b2", "m3", "3", "5", "m6", "6"] },
	{ name: "Double Harmonic Major (Mode 4)", degrees: ["1", "2", "m3", "b5", "5", "m6", "M7"] },
	{ name: "Double Harmonic Major (Mode 5)", degrees: ["1", "b2", "3", "4", "b5", "6", "m7"] },
	{ name: "Double Harmonic Major (Mode 6)", degrees: ["1", "m3", "3", "4", "m6", "6", "M7"] },
	{ name: "Double Harmonic Major (Mode 7)", degrees: ["1", "b2", "2", "4", "b5", "m6", "6"] },

	// --- Neapolitan Major, all 7 rotations --- Major scale with a b2 and m3 (natural 6/7).
	{ name: "Neapolitan Major", degrees: ["1", "b2", "m3", "4", "5", "6", "M7"] },
	{ name: "Neapolitan Major (Mode 2)", degrees: ["1", "2", "3", "b5", "m6", "m7", "M7"] },
	{ name: "Neapolitan Major (Mode 3)", degrees: ["1", "2", "3", "b5", "m6", "6", "m7"] },
	{ name: "Neapolitan Major (Mode 4)", degrees: ["1", "2", "3", "b5", "5", "m6", "m7"] },
	{ name: "Neapolitan Major (Mode 5)", degrees: ["1", "2", "3", "4", "b5", "m6", "m7"] },
	{ name: "Neapolitan Major (Mode 6)", degrees: ["1", "2", "m3", "3", "b5", "m6", "m7"] },
	{ name: "Neapolitan Major (Mode 7)", degrees: ["1", "b2", "2", "3", "b5", "m6", "m7"] },

	// --- Blues (standalone hexatonics, not part of a rotation family) ---
	{ name: "Blues", degrees: ["1", "m3", "4", "b5", "5", "m7"] },
	{ name: "Major Blues", degrees: ["1", "2", "m3", "3", "5", "6"] },

	// --- Whole Tone (symmetrical, only 1 unique rotation) ---
	{ name: "Whole Tone", degrees: ["1", "2", "3", "b5", "m6", "m7"] },

	// --- Augmented (symmetrical, only 2 unique rotations) ---
	{ name: "Augmented (Symmetrical Mode 1)", degrees: ["1", "m3", "3", "5", "m6", "M7"] },
	{ name: "Augmented (Symmetrical Mode 2)", degrees: ["1", "b2", "3", "4", "m6", "6"] },

	// --- Diminished (symmetrical, only 2 unique rotations each) ---
	{ name: "Diminished (Whole-Half)", degrees: ["1", "2", "m3", "4", "b5", "m6", "6", "M7"] },
	{ name: "Diminished (Half-Whole)", degrees: ["1", "b2", "m3", "3", "b5", "5", "6", "m7"] },

	// --- Bebop Dominant, all 8 rotations ---
	{ name: "Bebop Dominant", degrees: ["1", "2", "3", "4", "5", "6", "m7", "M7"] },
	{ name: "Bebop Dominant (Mode 2)", degrees: ["1", "2", "m3", "4", "5", "m6", "6", "m7"] },
	{ name: "Bebop Dominant (Mode 3)", degrees: ["1", "b2", "m3", "4", "b5", "5", "m6", "m7"] },
	{ name: "Bebop Dominant (Mode 4)", degrees: ["1", "2", "3", "4", "b5", "5", "6", "M7"] },
	{ name: "Bebop Dominant (Mode 5)", degrees: ["1", "2", "m3", "3", "4", "5", "6", "m7"] },
	{ name: "Bebop Dominant (Mode 6)", degrees: ["1", "b2", "2", "m3", "4", "5", "m6", "m7"] },
	{ name: "Bebop Dominant (Mode 7)", degrees: ["1", "b2", "2", "3", "b5", "5", "6", "M7"] },
	{ name: "Bebop Dominant (Mode 8)", degrees: ["1", "b2", "m3", "4", "b5", "m6", "m7", "M7"] },

	// --- Bebop Major, all 8 rotations ---
	{ name: "Bebop Major", degrees: ["1", "2", "3", "4", "5", "m6", "6", "M7"] },
	{ name: "Bebop Major (Mode 2)", degrees: ["1", "2", "m3", "4", "b5", "5", "6", "m7"] },
	{ name: "Bebop Major (Mode 3)", degrees: ["1", "b2", "m3", "3", "4", "5", "m6", "m7"] },
	{ name: "Bebop Major (Mode 4)", degrees: ["1", "2", "m3", "3", "b5", "5", "6", "M7"] },
	{ name: "Bebop Major (Mode 5)", degrees: ["1", "b2", "2", "3", "4", "5", "6", "m7"] },
	{ name: "Bebop Major (Mode 6)", degrees: ["1", "b2", "m3", "3", "b5", "m6", "6", "M7"] },
	{ name: "Bebop Major (Mode 7)", degrees: ["1", "2", "m3", "4", "5", "m6", "m7", "M7"] },
	{ name: "Bebop Major (Mode 8)", degrees: ["1", "b2", "m3", "4", "b5", "m6", "6", "m7"] },
];

export interface ScaleBestFitMatch {
	name: string;
	/** Present degrees not covered by the matched scale ("passing notes" — see CLAUDE.md
	 *  §4.4), sorted low-to-high by semitone distance from root (see DEGREE_LABELS). */
	outliers: readonly string[];
}

export interface RankedScaleMatch extends ScaleBestFitMatch {
	/** 1-based rank, best fit first. */
	rank: number;
	/** matched - missing - outliers.length, per `scoreAllScales`. Exposed mainly so
	 *  callers/tests can see *why* two ranked entries are ordered the way they are. */
	score: number;
}

interface ScoredScale {
	scale: ScaleDefinition;
	score: number;
	outliers: string[];
}

/**
 * Scores every SCALES entry against `presentDegrees`: +1 for each of the scale's own
 * degrees that IS present ("matched"), -1 for each that ISN'T ("missing"), and -1 for each
 * present degree the scale *doesn't* contain ("outliers" — reported separately afterward as
 * passing notes). Shared by both `findBestFitScale` (best match only) and
 * `rankBestFitScales` (top N), so the two can't drift apart on what "best fit" means.
 *
 * Outliers used to be free (no penalty) — matching only on matched/missing — but that let a
 * scale which fully explains the input with zero leftovers (e.g. Dorian, when the input is
 * minor pentatonic plus one extra note that happens to be Dorian's own 2nd) tie with, or
 * lose to, a smaller scale that leaves that same note unexplained (minor pentatonic itself,
 * with the extra note reported as a passing note) — an artifact of the size tie-break, not
 * a genuinely better fit. Penalizing outliers directly fixes this: a scale that leaves
 * nothing unexplained is now strictly preferred over one that does, at equal coverage.
 *
 * This still prefers an exact match over any larger scale that happens to be a strict
 * superset: for an exact match, missing = outliers = 0 and score = matched = |scale|, the
 * max any candidate of that size can reach; a strictly bigger superset has matched = |scale|
 * too (same intersection with the input) but missing > 0, so it scores strictly less. And a
 * smaller subset of the input scores less as well (its uncovered leftovers count as
 * outliers). So a big scale still can't trivially "win" just by containing everything, and a
 * smaller scale can't win just by staying silent about what it doesn't cover.
 */
function scoreAllScales(presentDegrees: ReadonlySet<string>): ScoredScale[] {
	return SCALES.map((scale) => {
		let matched = 0;
		for (const d of scale.degrees) {
			if (presentDegrees.has(d)) matched++;
		}
		const missing = scale.degrees.length - matched;
		const scaleDegrees = new Set(scale.degrees);
		const outliers = [...presentDegrees].filter((d) => !scaleDegrees.has(d));
		return { scale, score: matched - missing - outliers.length, outliers };
	});
}

/** Highest score first; ties broken by preferring the smaller (simpler) scale; any
 *  remaining tie keeps SCALES's own array order (Array#sort is stable), which places
 *  common/small scales before exotic ones (see the ordering note at the top of this file). */
function compareScored(a: ScoredScale, b: ScoredScale): number {
	if (b.score !== a.score) return b.score - a.score;
	return a.scale.degrees.length - b.scale.degrees.length;
}

/**
 * Reverse-engineers which scale a played phrase (or any degree set) most likely came from
 * — the single best match. SCALES is never empty, so this always returns a result. See
 * `scoreAllScales` for the scoring rule.
 */
export function findBestFitScale(presentDegrees: ReadonlySet<string>): ScaleBestFitMatch {
	const [best] = scoreAllScales(presentDegrees).sort(compareScored);
	return { name: best.scale.name, outliers: sortDegrees(best.outliers) };
}

/**
 * Like `findBestFitScale`, but returns the top `topN` candidates ranked by the same
 * scoring rule instead of just the winner — for "Analyze" mode (CLAUDE.md §4.4), where
 * several plausible scales are worth showing side by side rather than committing to just
 * the #1 pick.
 */
export function rankBestFitScales(presentDegrees: ReadonlySet<string>, topN: number): RankedScaleMatch[] {
	return scoreAllScales(presentDegrees)
		.sort(compareScored)
		.slice(0, topN)
		.map((s, i) => ({ rank: i + 1, name: s.scale.name, score: s.score, outliers: sortDegrees(s.outliers) }));
}

function sortDegrees(degrees: readonly string[]): string[] {
	return [...degrees].sort(
		(a, b) => DEGREE_LABELS.indexOf(a as (typeof DEGREE_LABELS)[number]) - DEGREE_LABELS.indexOf(b as (typeof DEGREE_LABELS)[number])
	);
}
