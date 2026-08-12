import { describe, expect, it } from "vitest";
import {
	TITLE_NORMAL_END,
	TITLE_NORMAL_START,
	TITLE_RAISED_END,
	TITLE_RAISED_START,
	degreeForDelta,
	inferChordSuffix,
	intervalDelta,
	romanForDelta,
	stripTitleMarkers,
} from "../src/music/intervals";

/** Plain, human-readable suffix — strips the invisible typography markers `inferChordSuffix` embeds. */
function suffix(...args: Parameters<typeof inferChordSuffix>): string {
	return stripTitleMarkers(inferChordSuffix(...args));
}

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
		expect(suffix(new Set(["1", "3", "5"]))).toBe("");
	});

	it("names a minor triad", () => {
		expect(suffix(new Set(["1", "m3", "5"]))).toBe("m");
	});

	it("names a dominant 7th", () => {
		expect(suffix(new Set(["1", "3", "5", "m7"]))).toBe("7");
	});

	it("names a major 7th", () => {
		expect(suffix(new Set(["1", "3", "5", "M7"]))).toBe("maj7");
	});

	it("names a minor 7th", () => {
		expect(suffix(new Set(["1", "m3", "5", "m7"]))).toBe("m7");
	});

	it("names a diminished triad", () => {
		expect(suffix(new Set(["1", "m3", "b5"]))).toBe("dim");
	});

	it("names sus4 when no third is present", () => {
		expect(suffix(new Set(["1", "4", "5"]))).toBe("sus4");
	});

	it("names sus2 when no third is present", () => {
		expect(suffix(new Set(["1", "2", "5"]))).toBe("sus2");
	});

	it("prefers sus4 over sus2 when both a 2nd and a 4th are present with no 3rd", () => {
		expect(suffix(new Set(["1", "2", "4", "5"]))).toBe("sus4");
	});

	it("names a power chord when only the root and 5th are present", () => {
		expect(suffix(new Set(["1", "5"]))).toBe("5");
	});

	it("names a fully diminished 7th (b5 + the enharmonic bb7)", () => {
		expect(suffix(new Set(["1", "m3", "b5", "6"]))).toBe("dim7");
	});

	it("names a half-diminished 7th (m7(b5)) distinctly from a bare diminished triad", () => {
		expect(suffix(new Set(["1", "m3", "b5", "m7"]))).toBe("m7(b5)");
	});

	it("names an augmented triad (major 3rd + #5)", () => {
		expect(suffix(new Set(["1", "3", "m6"]))).toBe("aug");
	});

	it("names a 6th chord", () => {
		expect(suffix(new Set(["1", "3", "5", "6"]))).toBe("6");
	});

	it("names a 6/9 chord", () => {
		expect(suffix(new Set(["1", "3", "5", "6", "2"]))).toBe("6/9");
	});

	it("names add9 when a 9th is present with no 7th", () => {
		expect(suffix(new Set(["1", "3", "5", "2"]))).toBe("add9");
	});

	it("names add11 when a 4th is present with a 3rd and no 7th", () => {
		expect(suffix(new Set(["1", "3", "5", "4"]))).toBe("add11");
	});

	it("merges a dominant 7th + 9th into a bare 9 chord, not 7add9", () => {
		expect(suffix(new Set(["1", "3", "5", "m7", "2"]))).toBe("9");
	});

	it("keeps maj7 and parenthesizes an added 9th (standard/berklee)", () => {
		expect(suffix(new Set(["1", "3", "5", "M7", "2"]), "standard")).toBe("maj7(9)");
	});

	it("keeps m7 and parenthesizes an added 9th (standard/berklee)", () => {
		expect(suffix(new Set(["1", "m3", "5", "m7", "2"]), "standard")).toBe("m7(9)");
	});

	it("concatenates a maj7/m7 tension bare with no parens (jazz)", () => {
		expect(suffix(new Set(["1", "3", "5", "M7", "2"]), "jazz")).toBe("Δ79");
		expect(suffix(new Set(["1", "m3", "5", "m7", "2"]), "jazz")).toBe("-79");
	});

	it("uses the highest tension (13 over 11 over 9) when several are present, since the 9th is present", () => {
		expect(suffix(new Set(["1", "3", "5", "m7", "2", "4", "6"]))).toBe("13");
	});

	it("does not fold an 11th into the dominant base digit when the 9th is absent", () => {
		expect(suffix(new Set(["1", "3", "5", "m7", "4"]), "standard")).toBe("7(11)");
	});

	it("does not fold a 13th into the dominant base digit when the 9th is absent", () => {
		expect(suffix(new Set(["1", "3", "5", "m7", "6"]), "standard")).toBe("7(13)");
	});

	it("lists both an 11th and 13th together when the 9th is absent", () => {
		expect(suffix(new Set(["1", "3", "5", "m7", "4", "6"]), "standard")).toBe("7(11, 13)");
	});

	it("still folds a 13th into the dominant base digit when the 9th is present, even without the 11th", () => {
		expect(suffix(new Set(["1", "3", "5", "m7", "2", "6"]))).toBe("13");
	});

	it("parenthesizes a b5 on top of a bare dominant tension (standard/berklee)", () => {
		expect(suffix(new Set(["1", "3", "b5", "m7", "2"]), "standard")).toBe("9(b5)");
	});

	it("appends a bare b5 on top of a dominant tension with no parens (jazz)", () => {
		expect(suffix(new Set(["1", "3", "b5", "m7", "2"]), "jazz")).toBe("9b5");
	});

	it("appends a slash bass note when given", () => {
		expect(suffix(new Set(["1", "3", "5"]), "standard", "E")).toBe("/E");
	});

	it("omits the slash when no bass name is given", () => {
		expect(suffix(new Set(["1", "3", "5"]), "standard", undefined)).toBe("");
	});

	describe("chord symbol style", () => {
		it("standard: m, maj7, m7(b5), dim7, aug", () => {
			expect(suffix(new Set(["1", "m3", "5"]), "standard")).toBe("m");
			expect(suffix(new Set(["1", "3", "5", "M7"]), "standard")).toBe("maj7");
			expect(suffix(new Set(["1", "m3", "b5", "m7"]), "standard")).toBe("m7(b5)");
			expect(suffix(new Set(["1", "m3", "b5", "6"]), "standard")).toBe("dim7");
			expect(suffix(new Set(["1", "3", "m6"]), "standard")).toBe("aug");
		});

		it("berklee: -, maj7, -7(b5), dim7, +", () => {
			expect(suffix(new Set(["1", "m3", "5"]), "berklee")).toBe("-");
			expect(suffix(new Set(["1", "3", "5", "M7"]), "berklee")).toBe("maj7");
			expect(suffix(new Set(["1", "m3", "b5", "m7"]), "berklee")).toBe("-7(b5)");
			expect(suffix(new Set(["1", "m3", "b5", "6"]), "berklee")).toBe("dim7");
			expect(suffix(new Set(["1", "3", "m6"]), "berklee")).toBe("+");
		});

		it("jazz: -, Δ7, ø7, °7, +", () => {
			expect(suffix(new Set(["1", "m3", "5"]), "jazz")).toBe("-");
			expect(suffix(new Set(["1", "3", "5", "M7"]), "jazz")).toBe("Δ7");
			expect(suffix(new Set(["1", "m3", "b5", "m7"]), "jazz")).toBe("ø7");
			expect(suffix(new Set(["1", "m3", "b5", "6"]), "jazz")).toBe("°7");
			expect(suffix(new Set(["1", "3", "m6"]), "jazz")).toBe("+");
		});
	});

	describe("typography markers", () => {
		it("wraps an added tension in RAISED markers, leaving the kept base digit unwrapped", () => {
			const raw = inferChordSuffix(new Set(["1", "m3", "5", "m7", "2"]), "standard");
			expect(raw).toBe(`m7${TITLE_RAISED_START}(9)${TITLE_RAISED_END}`);
		});

		it("does not wrap a folded dominant tension digit (it's the chord's own base digit)", () => {
			const raw = inferChordSuffix(new Set(["1", "3", "5", "m7", "2"]), "standard");
			expect(raw).toBe("9");
			expect(raw).not.toContain(TITLE_RAISED_START);
		});

		it("wraps a slash-chord bass in NORMAL markers", () => {
			const raw = inferChordSuffix(new Set(["1", "3", "5"]), "standard", "E");
			expect(raw).toBe(`${TITLE_NORMAL_START}/E${TITLE_NORMAL_END}`);
		});

		it("stripTitleMarkers removes all markers, leaving plain text", () => {
			const raw = `Foo${TITLE_RAISED_START}(bar)${TITLE_RAISED_END}${TITLE_NORMAL_START}/baz${TITLE_NORMAL_END}`;
			expect(stripTitleMarkers(raw)).toBe("Foo(bar)/baz");
		});
	});
});

describe("romanForDelta", () => {
	it("maps semitone deltas to Roman-numeral degree labels", () => {
		expect(romanForDelta(0)).toBe("I");
		expect(romanForDelta(3)).toBe("bIII");
		expect(romanForDelta(4)).toBe("III");
		expect(romanForDelta(7)).toBe("V");
		expect(romanForDelta(10)).toBe("bVII");
		expect(romanForDelta(11)).toBe("VII");
	});
});
