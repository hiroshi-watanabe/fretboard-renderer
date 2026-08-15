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

	describe("sus4/sus2 with a 7th (never silently dropped, folded like the dominant branch)", () => {
		it("folds a dominant 7th + natural 9th into 9sus4 (the reported A9sus4 regression)", () => {
			expect(suffix(new Set(["1", "2", "4", "5", "m7"]))).toBe("9sus4");
		});

		it("folds a dominant 7th + natural 13th into 13sus4", () => {
			expect(suffix(new Set(["1", "4", "5", "6", "m7"]))).toBe("13sus4");
		});

		it("shows a bare 7sus4 when no natural 9th/13th is present", () => {
			expect(suffix(new Set(["1", "4", "5", "m7"]))).toBe("7sus4");
		});

		it("shows maj7sus4 without dropping the major 7th", () => {
			expect(suffix(new Set(["1", "4", "5", "M7"]))).toBe("maj7sus4");
		});

		it("shows a bare 7sus2 (no separate 9 fold, since sus2 already occupies that slot)", () => {
			expect(suffix(new Set(["1", "2", "5", "m7"]))).toBe("7sus2");
		});

		it("shows maj7sus2 without dropping the major 7th", () => {
			expect(suffix(new Set(["1", "2", "5", "M7"]))).toBe("maj7sus2");
		});
	});

	describe("a 6th with no 3rd and no 7th (never silently dropped, folded like sus4/sus2 above)", () => {
		it("folds a bare 6th + sus2 into 6sus2 (the reported Csus2 regression)", () => {
			expect(suffix(new Set(["1", "2", "5", "6"]))).toBe("6sus2");
		});

		it("folds a bare 6th + sus4 into 6sus4", () => {
			expect(suffix(new Set(["1", "4", "5", "6"]))).toBe("6sus4");
		});

		it("shows 5(add6) when no 3rd, no sus substitute, and no 7th is present with omitNotation off", () => {
			expect(suffix(new Set(["1", "5", "6"]))).toBe("5(add6)");
		});

		it("shows 6(omit3) instead of 5(add6) when omitNotation is on", () => {
			expect(suffix(new Set(["1", "5", "6"]), "standard", undefined, true)).toBe("6(omit3)");
		});
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

	describe("b13 (m6 alongside a plain 5th, not the augmented reading)", () => {
		it("appends b13 to a sus4 chord instead of silently dropping it", () => {
			expect(suffix(new Set(["1", "4", "5", "m6"]))).toBe("sus4(b13)");
		});

		it("appends b13 to a sus2 chord", () => {
			expect(suffix(new Set(["1", "2", "5", "m6"]))).toBe("sus2(b13)");
		});

		it("appends b13 to a power chord", () => {
			expect(suffix(new Set(["1", "5", "m6"]))).toBe("5(b13)");
		});

		it("appends a bare b13 with no parens in jazz style", () => {
			expect(suffix(new Set(["1", "4", "5", "m6"]), "jazz")).toBe("sus4b13");
		});

		it("appends b13 to a minor 7th chord", () => {
			expect(suffix(new Set(["1", "m3", "5", "m7", "m6"]))).toBe("m7(b13)");
		});

		it("appends b13 to a major 7th chord", () => {
			expect(suffix(new Set(["1", "3", "5", "M7", "m6"]))).toBe("maj7(b13)");
		});

		it("appends b13 to a dominant 7th with no other tension", () => {
			expect(suffix(new Set(["1", "3", "5", "m7", "m6"]))).toBe("7(b13)");
		});

		it("appends b13 alongside a folded dominant 9th", () => {
			expect(suffix(new Set(["1", "3", "5", "m7", "2", "m6"]))).toBe("9(b13)");
		});
	});

	describe("b9 (b2, no disambiguation needed against a natural 9)", () => {
		it("appends b9 to a dominant 7th", () => {
			expect(suffix(new Set(["1", "3", "5", "m7", "b2"]))).toBe("7(b9)");
		});

		it("appends b9 to a sus4 chord instead of silently dropping it", () => {
			expect(suffix(new Set(["1", "4", "5", "b2"]))).toBe("sus4(b9)");
		});

		it("appends a bare b9 with no parens in jazz style", () => {
			expect(suffix(new Set(["1", "3", "5", "m7", "b2"]), "jazz")).toBe("7b9");
		});
	});

	describe("#9 (m3 alongside a major 3rd, not a plain minor chord)", () => {
		it("does not read m3 as #9 unless a major 3rd is also present", () => {
			expect(suffix(new Set(["1", "m3", "5", "m7"]))).toBe("m7");
		});

		it("reads m3 as #9 on a dominant 7th when a major 3rd is also present", () => {
			expect(suffix(new Set(["1", "3", "m3", "5", "m7"]))).toBe("7(#9)");
		});

		it("combines #9 with b13 (the user's G7(#9, b13) case)", () => {
			expect(suffix(new Set(["1", "3", "m3", "5", "m7", "m6"]))).toBe("7(#9, b13)");
		});

		it("still reads m6 as b13 (not silently dropped) when the plain 5th is omitted but a 7th is present", () => {
			// Guitarists very commonly mute/omit the plain 5th on an altered dominant
			// voicing while keeping the altered tension — reported as a regression where
			// this exact shape (no "5" degree at all) came out "G7(#9)", dropping the b13.
			expect(suffix(new Set(["1", "3", "m3", "m7", "m6"]))).toBe("7(#9, b13)");
		});
	});

	describe("#11 (b5 alongside a plain 5th, not the flatted-5th reading)", () => {
		it("appends #11 to a dominant 7th", () => {
			expect(suffix(new Set(["1", "3", "5", "m7", "b5"]))).toBe("7(#11)");
		});

		it("appends #11 to a major 7th chord", () => {
			expect(suffix(new Set(["1", "3", "5", "M7", "b5"]))).toBe("maj7(#11)");
		});
	});

	describe("omit notation (off by default)", () => {
		it("does not mark anything when omitNotation is off, even with rootOmitted true", () => {
			expect(suffix(new Set(["1", "5"]), "standard", undefined, false, true)).toBe("5");
		});

		it("replaces a bare power chord's 5 with (omit3) when on", () => {
			expect(suffix(new Set(["1", "5"]), "standard", undefined, true)).toBe("(omit3)");
		});

		it("always shows a 7th with no 3rd, regardless of omitNotation", () => {
			expect(suffix(new Set(["1", "5", "m7"]))).toBe("7");
		});

		it("appends (omit3) alongside a 7th shown with no 3rd, when on", () => {
			expect(suffix(new Set(["1", "5", "m7"]), "standard", undefined, true)).toBe("7(omit3)");
		});

		it("does not mark omit3 on a sus4/sus2 chord (the 3rd's role is filled)", () => {
			expect(suffix(new Set(["1", "4", "5"]), "standard", undefined, true)).toBe("sus4");
		});

		it("appends (omit5) when no 5th-family degree is present at all", () => {
			expect(suffix(new Set(["1", "3", "m7"]), "standard", undefined, true)).toBe("7(omit5)");
		});

		it("does not mark omit5 when a plain 5th is present", () => {
			expect(suffix(new Set(["1", "3", "5", "m7"]), "standard", undefined, true)).toBe("7");
		});

		it("appends (omit1) when rootOmitted is true", () => {
			expect(suffix(new Set(["1", "3", "5", "m7"]), "standard", undefined, true, true)).toBe("7(omit1)");
		});

		it("combines #9/b13 tensions with (omit1) — the user's rootless G7(#9, b13) case", () => {
			expect(suffix(new Set(["1", "3", "m3", "m7", "m6"]), "standard", undefined, true, true)).toBe(
				"7(#9, b13)(omit1)"
			);
		});

		it("keeps omit markers parenthesized even in jazz style (unlike compact tension symbols)", () => {
			expect(suffix(new Set(["1", "5"]), "jazz", undefined, true)).toBe("(omit3)");
		});
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
