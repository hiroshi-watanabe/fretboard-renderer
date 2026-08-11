import { describe, expect, it } from "vitest";
import { parseNoteName, parseTuning, pitchClassToName, stringPitchClass } from "../src/music/notes";

describe("parseNoteName", () => {
	it("parses natural note names", () => {
		expect(parseNoteName("C")).toBe(0);
		expect(parseNoteName("E")).toBe(4);
		expect(parseNoteName("G")).toBe(7);
	});

	it("parses sharps and flats", () => {
		expect(parseNoteName("C#")).toBe(1);
		expect(parseNoteName("Db")).toBe(1);
		expect(parseNoteName("Bb")).toBe(10);
	});

	it("throws on invalid input", () => {
		expect(() => parseNoteName("H")).toThrow();
		expect(() => parseNoteName("")).toThrow();
	});
});

describe("parseTuning", () => {
	it("parses standard tuning", () => {
		expect(parseTuning("E,A,D,G,B,E")).toEqual([4, 9, 2, 7, 11, 4]);
	});
});

describe("pitchClassToName", () => {
	it("respects accidental preference", () => {
		expect(pitchClassToName(1, "sharp")).toBe("C#");
		expect(pitchClassToName(1, "flat")).toBe("Db");
	});
});

describe("stringPitchClass", () => {
	it("wraps around the octave", () => {
		expect(stringPitchClass(4, 0)).toBe(4); // open E
		expect(stringPitchClass(4, 8)).toBe(0); // E + 8 semitones = C
		expect(stringPitchClass(9, 5)).toBe(2); // A + 5 semitones = D
	});
});
