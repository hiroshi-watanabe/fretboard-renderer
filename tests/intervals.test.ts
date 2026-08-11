import { describe, expect, it } from "vitest";
import { degreeForDelta, inferChordSuffix, intervalDelta } from "../src/music/intervals";

describe("intervalDelta / degreeForDelta", () => {
	it("computes degree labels relative to a root", () => {
		const root = 0; // C
		expect(degreeForDelta(intervalDelta(root, 0))).toBe("1");
		expect(degreeForDelta(intervalDelta(root, 4))).toBe("3");
		expect(degreeForDelta(intervalDelta(root, 3))).toBe("m3");
		expect(degreeForDelta(intervalDelta(root, 7))).toBe("5");
		expect(degreeForDelta(intervalDelta(root, 11))).toBe("M7");
	});

	it("wraps around the octave for a non-zero root", () => {
		const root = 9; // A
		expect(degreeForDelta(intervalDelta(root, 9))).toBe("1");
		expect(degreeForDelta(intervalDelta(root, 0))).toBe("m3"); // A -> C is a minor third
	});
});

describe("inferChordSuffix", () => {
	it("names a major triad with no suffix", () => {
		expect(inferChordSuffix(new Set(["1", "3", "5"]))).toBe("");
	});

	it("names a minor triad", () => {
		expect(inferChordSuffix(new Set(["1", "m3", "5"]))).toBe("m");
	});

	it("names a dominant 7th", () => {
		expect(inferChordSuffix(new Set(["1", "3", "5", "m7"]))).toBe("7");
	});

	it("names a major 7th", () => {
		expect(inferChordSuffix(new Set(["1", "3", "5", "M7"]))).toBe("maj7");
	});

	it("names a minor 7th", () => {
		expect(inferChordSuffix(new Set(["1", "m3", "5", "m7"]))).toBe("m7");
	});

	it("names a diminished triad", () => {
		expect(inferChordSuffix(new Set(["1", "m3", "b5"]))).toBe("dim");
	});

	it("names sus4 when no third is present", () => {
		expect(inferChordSuffix(new Set(["1", "4", "5"]))).toBe("sus4");
	});

	it("names sus2 when no third is present", () => {
		expect(inferChordSuffix(new Set(["1", "2", "5"]))).toBe("sus2");
	});
});
