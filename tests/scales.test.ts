import { describe, expect, it } from "vitest";
import { DEGREE_LABELS } from "../src/music/intervals";
import { findBestFitScale, rankBestFitScales, SCALES } from "../src/music/scales";

describe("expanded scale table (spot checks on the most error-prone rotations)", () => {
	it.each([
		["Suspended Pentatonic (Mode 2)", ["1", "2", "4", "5", "m7"]],
		["Phrygian Pentatonic (Mode 3)", ["1", "m3", "4", "m6", "m7"]],
		["Hirajoshi", ["1", "2", "m3", "5", "m6"]],
		["Hon-Kumoi-joshi (Hirajoshi Mode 3)", ["1", "3", "4", "6", "M7"]],
		["Ryukyu", ["1", "3", "4", "5", "M7"]],
		["Hindu Pentatonic (Ryukyu Mode 4)", ["1", "3", "4", "6", "m7"]],
		["Dorian b2", ["1", "b2", "m3", "4", "5", "6", "m7"]],
		["Ultralocrian (Altered Diminished)", ["1", "b2", "m3", "3", "b5", "m6", "6"]],
		["Augmented (Symmetrical Mode 2)", ["1", "b2", "3", "4", "m6", "6"]],
		["Bebop Dominant (Mode 5)", ["1", "2", "m3", "3", "4", "5", "6", "m7"]],
		["Bebop Major (Mode 5)", ["1", "b2", "2", "3", "4", "5", "6", "m7"]],
		["Bebop Major (Mode 8)", ["1", "b2", "m3", "4", "b5", "m6", "6", "m7"]],
		["Dominant Pentatonic", ["1", "2", "3", "5", "m7"]],
		["Dominant Pentatonic (Mode 4)", ["1", "m3", "4", "5", "6"]],
		["Harmonic Major", ["1", "2", "3", "4", "5", "m6", "M7"]],
		["Harmonic Major (Mode 5)", ["1", "b2", "3", "4", "5", "6", "m7"]],
		["Double Harmonic Major", ["1", "b2", "3", "4", "5", "m6", "M7"]],
		["Double Harmonic Major (Mode 6)", ["1", "m3", "3", "4", "m6", "6", "M7"]],
		["Neapolitan Major", ["1", "b2", "m3", "4", "5", "6", "M7"]],
		["Neapolitan Major (Mode 4)", ["1", "2", "3", "b5", "5", "m6", "m7"]],
		["In Sen / Kumoi / Miyakobushi (Hirajoshi Mode 4)", ["1", "b2", "4", "5", "m6"]],
	])("%s has the expected degree set", (name, degrees) => {
		const scale = SCALES.find((s) => s.name === name);
		expect(scale?.degrees).toEqual(degrees);
	});

	it("has all 5 rotations of the Major Pentatonic family", () => {
		const names = SCALES.map((s) => s.name);
		expect(names).toEqual(
			expect.arrayContaining([
				"Major Pentatonic",
				"Suspended Pentatonic (Mode 2)",
				"Phrygian Pentatonic (Mode 3)",
				"Mixolydian Pentatonic (Mode 4)",
				"Minor Pentatonic",
			])
		);
	});

	it("has all 8 rotations each of Bebop Dominant and Bebop Major", () => {
		const names = new Set(SCALES.map((s) => s.name));
		for (const family of ["Bebop Dominant", "Bebop Major"]) {
			expect(names.has(family)).toBe(true);
			for (let mode = 2; mode <= 8; mode++) {
				expect(names.has(`${family} (Mode ${mode})`)).toBe(true);
			}
		}
	});

	it("has all 5/7 rotations of the 4 newly added families", () => {
		const names = new Set(SCALES.map((s) => s.name));
		for (const family of ["Harmonic Major", "Double Harmonic Major", "Neapolitan Major"]) {
			expect(names.has(family)).toBe(true);
			for (let mode = 2; mode <= 7; mode++) {
				expect(names.has(`${family} (Mode ${mode})`)).toBe(true);
			}
		}
		expect(names.has("Dominant Pentatonic")).toBe(true);
		for (let mode = 2; mode <= 5; mode++) {
			expect(names.has(`Dominant Pentatonic (Mode ${mode})`)).toBe(true);
		}
	});

	it("In Sen (陰音階) is the same degree set as an existing Hirajoshi rotation, not a duplicate row", () => {
		// In Sen's degrees {1, b2, 4, 5, m6} are identical to Hirajoshi Mode 4 — folded into
		// one named row (rather than two rows with the same degree set, which would violate
		// the uniqueness invariant below and make matching ambiguous).
		const scale = SCALES.find((s) => s.name.startsWith("In Sen"));
		expect(scale?.degrees).toEqual(["1", "b2", "4", "5", "m6"]);
		expect(SCALES.filter((s) => JSON.stringify([...s.degrees].sort()) === JSON.stringify(["1", "4", "5", "b2", "m6"].sort())).length).toBe(1);
	});
});

describe("SCALES table invariants", () => {
	it("has no duplicate scale names", () => {
		const names = SCALES.map((s) => s.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it("has no two scales sharing the exact same degree set", () => {
		const signatures = SCALES.map((s) => [...s.degrees].sort().join(","));
		expect(new Set(signatures).size).toBe(signatures.length);
	});
});

// Scoring rule: for each SCALES entry, +1 per its own degree that IS in the input
// ("matched"), -1 per its own degree that ISN'T ("missing"), -1 per input degree the scale
// doesn't contain ("outliers" — reported separately afterward as passing notes). Highest
// score wins; ties favor the smaller scale.
describe("findBestFitScale", () => {
	it("matches every scale in the table by its own degree set exactly, with no outliers", () => {
		// score = matched - missing - outliers = |scale| - 0 - 0 = |scale|, the max any
		// candidate of that size can reach, and no strictly bigger scale can match or exceed
		// it (see the `scoreAllScales` doc comment) — so every scale uniquely wins against
		// its own exact degree set, regardless of what else is in the table.
		for (const scale of SCALES) {
			expect(findBestFitScale(new Set(scale.degrees))).toEqual({ name: scale.name, outliers: [] });
		}
	});

	it("prefers a scale that fully covers the input over a smaller one that leaves a passing note", () => {
		// Minor Pentatonic + a natural 2nd: Minor Pentatonic itself scores 5 - 0 - 1 = 4 (the
		// extra 2nd is an outlier); Dorian (a superset containing everything, including that
		// 2nd, just missing its own 6th) scores 6 - 1 - 0 = 5 — Dorian wins outright, since
		// leaving nothing unexplained beats a smaller scale that does, even though Dorian has
		// more notes overall.
		const result = findBestFitScale(new Set(["1", "m3", "4", "5", "m7", "2"]));
		expect(result).toEqual({ name: "Dorian", outliers: [] });
	});

	it("breaks a same-score tie toward the smaller scale", () => {
		// {1, 3, 4, 6, m3, m7}: Hindu Pentatonic (5 notes: 1,3,4,6,m7) covers everything but
		// leaves the m3 as an outlier — score 5 - 0 - 1 = 4. Bebop Dominant (Mode 5) (8 notes,
		// a superset containing all 6 input degrees plus 2 unplayed ones) has 0 outliers but
		// 2 missing — score 6 - 2 - 0 = 4, an exact tie. The smaller scale wins.
		const result = findBestFitScale(new Set(["1", "3", "4", "6", "m3", "m7"]));
		expect(result).toEqual({ name: "Hindu Pentatonic (Ryukyu Mode 4)", outliers: ["m3"] });
	});

	it("reports leftover notes as outliers when no table entry can cover them all", () => {
		// 9 distinct degrees can never fully fit inside any single table entry (the largest
		// scales are 8 notes), so whichever scale wins, at least one degree is guaranteed to
		// be left over as a passing note — independent of the table's exact contents.
		const result = findBestFitScale(new Set(["1", "b2", "2", "m3", "3", "4", "5", "6", "m7"]));
		expect(result.outliers.length).toBeGreaterThanOrEqual(1);
	});

	it("sorts outliers low-to-high by semitone distance from the root, regardless of input order", () => {
		const bySemitone = (a: string, b: string) => DEGREE_LABELS.indexOf(a as never) - DEGREE_LABELS.indexOf(b as never);
		const forward = findBestFitScale(new Set(["1", "b2", "2", "m3", "3", "4", "b5", "5", "m6", "6", "m7", "M7"]));
		const reversed = findBestFitScale(new Set(["M7", "m7", "6", "m6", "5", "b5", "4", "3", "m3", "2", "b2", "1"]));
		expect(forward.outliers).toEqual([...forward.outliers].sort(bySemitone));
		expect(forward.outliers).toEqual(reversed.outliers);
	});

	it("always returns a result, even for a minimal single-degree input", () => {
		const result = findBestFitScale(new Set(["1"]));
		expect(result.outliers).toEqual([]);
		expect(typeof result.name).toBe("string");
	});
});

describe("rankBestFitScales", () => {
	it("ranks candidates by the same scoring rule as findBestFitScale, #1 matching it exactly", () => {
		const degrees = new Set(["1", "m3", "4", "5", "m7", "2"]);
		const best = findBestFitScale(degrees);
		const ranked = rankBestFitScales(degrees, 5);
		expect(ranked[0]).toEqual({ rank: 1, name: best.name, outliers: best.outliers, score: 5 });
		// Dorian and Aeolian both fully cover the input (0 outliers, only their own unplayed
		// 6th/m6th missing) and tie at the top with score 5; Minor Pentatonic and Suspended
		// Pentatonic (Mode 2) each leave one note as an outlier and trail at score 4, tied
		// with each other; Bebop Dominant (Mode 2) — a superset with 0 outliers but more
		// unplayed notes — rounds out the top 5, also at score 4.
		expect(ranked.map((r) => r.name)).toEqual([
			"Dorian",
			"Aeolian (Natural Minor)",
			"Minor Pentatonic",
			"Suspended Pentatonic (Mode 2)",
			"Bebop Dominant (Mode 2)",
		]);
		expect(ranked.map((r) => r.score)).toEqual([5, 5, 4, 4, 4]);
		expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5]);
	});

	it("scores are non-increasing down the ranked list", () => {
		const ranked = rankBestFitScales(new Set(["1", "b2", "3", "5", "6"]), 5);
		for (let i = 1; i < ranked.length; i++) {
			expect(ranked[i].score).toBeLessThanOrEqual(ranked[i - 1].score);
		}
	});

	it("returns at most topN entries, and at most SCALES.length when topN is larger", () => {
		expect(rankBestFitScales(new Set(["1"]), 5)).toHaveLength(5);
		expect(rankBestFitScales(new Set(["1"]), 1000)).toHaveLength(SCALES.length);
	});
});
