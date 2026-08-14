import { describe, expect, it } from "vitest";
import { getFretboardCompletions } from "../src/completion/context";

/** Splits a `|`-marked template into (text, cursor offset), then wraps it in a fence. */
function fenced(inner: string): { fullText: string; offset: number } {
	const cursor = inner.indexOf("|");
	if (cursor === -1) throw new Error("template must contain a | cursor marker");
	const withoutMarker = inner.slice(0, cursor) + inner.slice(cursor + 1);
	const prefix = "intro text\n```fretboard\n";
	const fullText = prefix + withoutMarker + "\n```\nmore text";
	const offset = prefix.length + cursor;
	return { fullText, offset };
}

function values(fullText: string, offset: number): string[] {
	const result = getFretboardCompletions(fullText, offset);
	return result ? result.items.map((i) => i.value) : [];
}

describe("getFretboardCompletions — top-level keys", () => {
	it("suggests all block keys plus diagrams at the very start of a block", () => {
		const { fullText, offset } = fenced("|");
		const items = values(fullText, offset);
		expect(items).toContain("notes");
		expect(items).toContain("startFret");
		expect(items).toContain("diagrams");
	});

	it("filters block keys by the partially typed word", () => {
		const { fullText, offset } = fenced("fr|");
		expect(values(fullText, offset)).toEqual(expect.arrayContaining(["frets", "fretSpacingAdjust"]));
		expect(values(fullText, offset)).not.toContain("notes");
	});

	it("suggests keys on a later line, ignoring earlier complete lines", () => {
		const { fullText, offset } = fenced('title: Cmaj7\nstartF|');
		expect(values(fullText, offset)).toEqual(["startFret"]);
	});

	it("marks isKey true and includes a detail string for block keys", () => {
		const { fullText, offset } = fenced("orient|");
		const result = getFretboardCompletions(fullText, offset)!;
		expect(result.items).toEqual([
			expect.objectContaining({ value: "orientation", isKey: true, detail: expect.any(String) }),
		]);
	});

	it("replaces exactly the typed partial word", () => {
		const { fullText, offset } = fenced("  fr|");
		const result = getFretboardCompletions(fullText, offset)!;
		expect(fullText.slice(result.replaceStart, result.replaceEnd)).toBe("fr");
	});
});

describe("getFretboardCompletions — top-level values", () => {
	it.each([
		["orientation", "ho", ["horizontal"]],
		["namingMode", "sc", ["scale"]],
		["chordSymbolStyle", "j", ["jazz"]],
		["omitNotation", "tr", ["true"]],
		["showInversions", "", ["true", "false"]],
		["scaleAnalyze", "fa", ["false"]],
	])("suggests values for %s", (key, typed, expected) => {
		const { fullText, offset } = fenced(`${key}: ${typed}|`);
		expect(values(fullText, offset)).toEqual(expected);
	});

	it("offers no value suggestions for free-form keys like title", () => {
		const { fullText, offset } = fenced("title: Cm|");
		expect(getFretboardCompletions(fullText, offset)).toBeNull();
	});

	it("offers no value suggestions for numeric keys like frets", () => {
		const { fullText, offset } = fenced("frets: |");
		expect(getFretboardCompletions(fullText, offset)).toBeNull();
	});
});

describe("getFretboardCompletions — nested notes/boxes/barre entries", () => {
	it("suggests note keys inside a notes flow-mapping entry", () => {
		const { fullText, offset } = fenced("notes:\n  - {s: 6, f: 1, sh|");
		expect(values(fullText, offset)).toEqual(["shape"]);
	});

	it("suggests note key values scoped to the key just typed", () => {
		const { fullText, offset } = fenced("notes:\n  - {s: 6, f: 1, shape: ci|");
		expect(values(fullText, offset)).toEqual(["circle"]);
	});

	it("suggests fillStyle values inside a note entry", () => {
		const { fullText, offset } = fenced("notes:\n  - {s: 6, f: 1, fillStyle: fil|");
		expect(values(fullText, offset)).toEqual(["filled"]);
	});

	it("offers nothing right after the list-item dash, before the opening brace is typed — notes/boxes/barre are always written in flow style", () => {
		const { fullText, offset } = fenced("notes:\n  - {s: 6, f: 1}\n  - |");
		expect(getFretboardCompletions(fullText, offset)).toBeNull();
	});

	it("returns to block-level keys once indentation drops back after a notes array", () => {
		const { fullText, offset } = fenced("notes:\n  - {s: 6, f: 1}\ntitl|");
		expect(values(fullText, offset)).toEqual(["title"]);
	});

	it("suggests box keys inside a boxes flow-mapping entry", () => {
		const { fullText, offset } = fenced('notes:\n  - {s: 6, f: 1}\nboxes:\n  - {st|');
		expect(values(fullText, offset)).toEqual(["strings", "style"]);
	});

	it("suggests box style values", () => {
		const { fullText, offset } = fenced('notes:\n  - {s: 6, f: 1}\nboxes:\n  - {frets: "1-4", style: da|');
		expect(values(fullText, offset)).toEqual(["dashed"]);
	});

	it("suggests barre keys inside a barre flow-mapping entry, with no value suggestions", () => {
		const { fullText, offset } = fenced("notes:\n  - {s: 6, f: 1}\nbarre:\n  - {fr|");
		expect(values(fullText, offset)).toEqual(["fret"]);

		const valueCursor = fenced("notes:\n  - {s: 6, f: 1}\nbarre:\n  - {fret: |");
		expect(getFretboardCompletions(valueCursor.fullText, valueCursor.offset)).toBeNull();
	});

	it("scopes suggestions to the most recently opened array (boxes after notes)", () => {
		const { fullText, offset } = fenced("notes:\n  - {s: 6, f: 1}\nboxes:\n  - {fre|");
		expect(values(fullText, offset)).toEqual(["frets"]);
	});
});

describe("getFretboardCompletions — diagrams (multi-diagram blocks)", () => {
	it("suggests block-level keys for a diagrams list item", () => {
		const { fullText, offset } = fenced("diagrams:\n  - startF|");
		expect(values(fullText, offset)).toEqual(["startFret"]);
	});

	it("suggests note keys nested two levels deep under diagrams", () => {
		const { fullText, offset } = fenced("diagrams:\n  - title: Cmaj7\n    notes:\n      - {s: 5, fin|");
		expect(values(fullText, offset)).toEqual(["finger"]);
	});

	it("suggests block-level keys inside a flow-style diagrams entry", () => {
		const { fullText, offset } = fenced("diagrams:\n  - {star|");
		expect(values(fullText, offset)).toEqual(["startFret"]);
	});

	it("suggests note keys inside a notes array written inline (flow style) inside a flow-style diagrams entry", () => {
		const { fullText, offset } = fenced(
			"diagrams:\n  - {startFret: 4, size: 0.7, notes: [[1, 0], [2, 0], {s: 6, f: 2, gho|"
		);
		expect(values(fullText, offset)).toEqual(["ghost"]);
	});

	it("suggests note keys inside a fully single-line flow-style diagrams entry", () => {
		const { fullText, offset } = fenced("diagrams:\n  - {notes: [{s: 5, f: 3, virtual: true, gho|");
		expect(values(fullText, offset)).toEqual(["ghost"]);
	});

	it("suggests note key values scoped correctly inside a nested flow-style notes entry", () => {
		const { fullText, offset } = fenced("diagrams:\n  - {notes: [{s: 5, f: 3, shape: sq|");
		expect(values(fullText, offset)).toEqual(["square"]);
	});

	it("returns to the diagram's own keys after a nested flow-style notes array closes", () => {
		const { fullText, offset } = fenced("diagrams:\n  - {notes: [{s: 5, f: 3}], titl|");
		expect(values(fullText, offset)).toEqual(["title"]);
	});
});

describe("getFretboardCompletions — no suggestion cases", () => {
	it("returns null outside any fretboard block", () => {
		const fullText = "some notes\nstartFret: 5\nmore text";
		expect(getFretboardCompletions(fullText, 15)).toBeNull();
	});

	it("returns null inside a differently-labeled code fence", () => {
		const fullText = "```yaml\nstartFret: 5\n```";
		const offset = fullText.indexOf("5");
		expect(getFretboardCompletions(fullText, offset)).toBeNull();
	});

	it("returns null when no candidate matches the typed prefix", () => {
		const { fullText, offset } = fenced("zzz|");
		expect(getFretboardCompletions(fullText, offset)).toBeNull();
	});

	it("stays robust while the block is invalid mid-edit (unclosed brace)", () => {
		const { fullText, offset } = fenced("notes:\n  - {s: 6, f: 1, label: root, sha|");
		expect(values(fullText, offset)).toEqual(["shape"]);
	});

	it("treats an unclosed fence as extending to end of document", () => {
		const fullText = "```fretboard\nstartF";
		const offset = fullText.length;
		expect(values(fullText, offset)).toEqual(["startFret"]);
	});
});

describe("getFretboardCompletions — CRLF documents", () => {
	it("finds the fence and suggests block keys on a Windows-style (\\r\\n) file", () => {
		const { fullText: lfText, offset: lfOffset } = fenced("frets: 3\nnamingMode: scale\nstartFret: 12\n|");
		const fullText = lfText.replace(/\n/g, "\r\n");
		// Every "\n" before the cursor became "\r\n" (one extra char each), so the offset shifts too.
		const newlinesBeforeCursor = lfText.slice(0, lfOffset).split("\n").length - 1;
		const offset = lfOffset + newlinesBeforeCursor;
		expect(values(fullText, offset)).toEqual(expect.arrayContaining(["notes", "boxes", "title"]));
	});

	it("still scopes to note keys inside a flow-mapping entry on CRLF", () => {
		const { fullText: lfText, offset: lfOffset } = fenced("notes:\n  - {s: 6, f: 1}\n  - {sh|");
		const fullText = lfText.replace(/\n/g, "\r\n");
		const newlinesBeforeCursor = lfText.slice(0, lfOffset).split("\n").length - 1;
		const offset = lfOffset + newlinesBeforeCursor;
		expect(values(fullText, offset)).toEqual(["shape"]);
	});
});
