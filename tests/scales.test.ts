import { describe, expect, it } from "vitest";
import { findScaleName, SCALES } from "../src/music/scales";

describe("findScaleName", () => {
	it("matches every scale in the table by its own degree set", () => {
		for (const scale of SCALES) {
			expect(findScaleName(new Set(scale.degrees))).toBe(scale.name);
		}
	});

	it("returns undefined for a degree set matching no known scale", () => {
		expect(findScaleName(new Set(["1", "b2"]))).toBeUndefined();
	});

	it("requires an exact match, not a subset", () => {
		// Minor pentatonic minus one degree shouldn't match minor pentatonic or anything else.
		expect(findScaleName(new Set(["1", "m3", "4", "5"]))).toBeUndefined();
	});

	it("requires an exact match, not a superset", () => {
		// Minor pentatonic plus an extra degree shouldn't still match minor pentatonic.
		expect(findScaleName(new Set(["1", "m3", "4", "5", "m7", "2"]))).toBeUndefined();
	});

	it("has no duplicate scale names", () => {
		const names = SCALES.map((s) => s.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it("has no two scales sharing the exact same degree set", () => {
		const signatures = SCALES.map((s) => [...s.degrees].sort().join(","));
		expect(new Set(signatures).size).toBe(signatures.length);
	});
});
