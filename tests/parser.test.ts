import { describe, expect, it } from "vitest";
import { parseFretboardBlock } from "../src/parser/parse";
import { FretboardParseError } from "../src/parser/errors";
import type { FretboardBlockConfig } from "../src/types";

function parseSingle(source: string): FretboardBlockConfig {
	const parsed = parseFretboardBlock(source);
	if (parsed.kind !== "single") throw new Error("expected a single-diagram block");
	return parsed.config;
}

describe("parseFretboardBlock", () => {
	it("requires the notes property", () => {
		expect(() => parseFretboardBlock("title: Foo")).toThrow(FretboardParseError);
	});

	it("normalizes object-form notes", () => {
		const config = parseSingle(`
notes:
  - {s: 6, f: 5, label: root, shape: square}
  - {s: 5, f: 7, finger: 3, ghost: true}
`);
		expect(config.notes).toEqual([
			{ s: 6, f: 5, label: "root", shape: "square" },
			{ s: 5, f: 7, finger: 3, ghost: true },
		]);
	});

	it("normalizes array-shorthand notes", () => {
		const config = parseSingle(`
notes:
  - [6, 8]
  - [5, 5, "root"]
`);
		expect(config.notes).toEqual([
			{ s: 6, f: 8 },
			{ s: 5, f: 5, label: "root" },
		]);
	});

	it("accepts muted strings written as x", () => {
		const config = parseSingle(`
notes:
  - {s: 6, f: x}
`);
		expect(config.notes[0].f).toBe("x");
	});

	it("parses the full example from the spec", () => {
		const config = parseSingle(`
title: Am Pentatonic (Box 1)
visible: 1-6
startFret: 5
frets: 4
boxes:
  - {frets: "5-8", style: dashed}
paths:
  - [[6,5], [6,8], [5,5], [5,7]]
notes:
  - {s: 6, f: 5, label: root, shape: square}
  - [6, 8]
  - {s: 5, f: 5}
  - {s: 5, f: 7, finger: 3, ghost: true}
`);
		expect(config.title).toBe("Am Pentatonic (Box 1)");
		expect(config.visible).toBe("1-6");
		expect(config.startFret).toBe(5);
		expect(config.frets).toBe(4);
		expect(config.boxes).toEqual([{ frets: "5-8", style: "dashed" }]);
		expect(config.paths).toEqual([
			[
				[6, 5],
				[6, 8],
				[5, 5],
				[5, 7],
			],
		]);
		expect(config.notes).toHaveLength(4);
	});

	it("rejects an invalid fret value", () => {
		expect(() => parseFretboardBlock("notes:\n  - {s: 6, f: -1}")).toThrow(FretboardParseError);
	});

	it("rejects an invalid shape", () => {
		expect(() => parseFretboardBlock("notes:\n  - {s: 6, f: 5, shape: hexagon}")).toThrow(
			FretboardParseError
		);
	});

	it("rejects malformed YAML without throwing a raw error", () => {
		expect(() => parseFretboardBlock("notes: [")).toThrow(FretboardParseError);
	});

	it("parses local orientation, size, and spacing adjust overrides", () => {
		const config = parseSingle(`
orientation: vertical
size: 0.6
fretSpacingAdjust: -3
stringSpacingAdjust: 2
notes:
  - {s: 6, f: 0}
`);
		expect(config.orientation).toBe("vertical");
		expect(config.size).toBe(0.6);
		expect(config.fretSpacingAdjust).toBe(-3);
		expect(config.stringSpacingAdjust).toBe(2);
	});

	it("rejects an invalid orientation", () => {
		expect(() => parseFretboardBlock("orientation: diagonal\nnotes:\n  - {s: 6, f: 0}")).toThrow(
			FretboardParseError
		);
	});

	it("parses a local namingMode override", () => {
		const config = parseSingle("namingMode: scale\nnotes:\n  - {s: 6, f: 0}");
		expect(config.namingMode).toBe("scale");
	});

	it("rejects an invalid namingMode", () => {
		expect(() => parseFretboardBlock("namingMode: melody\nnotes:\n  - {s: 6, f: 0}")).toThrow(
			FretboardParseError
		);
	});

	it("parses a local chordSymbolStyle override", () => {
		const config = parseSingle("chordSymbolStyle: jazz\nnotes:\n  - {s: 6, f: 0}");
		expect(config.chordSymbolStyle).toBe("jazz");
	});

	it("rejects an invalid chordSymbolStyle", () => {
		expect(() => parseFretboardBlock("chordSymbolStyle: pop\nnotes:\n  - {s: 6, f: 0}")).toThrow(
			FretboardParseError
		);
	});

	it("rejects a spacing adjust value outside -5..5", () => {
		expect(() => parseFretboardBlock("fretSpacingAdjust: 6\nnotes:\n  - {s: 6, f: 0}")).toThrow(
			FretboardParseError
		);
	});

	it("rejects a non-integer spacing adjust value", () => {
		expect(() => parseFretboardBlock("stringSpacingAdjust: 1.5\nnotes:\n  - {s: 6, f: 0}")).toThrow(
			FretboardParseError
		);
	});

	it("parses per-note color, fillStyle, sizeAdjust, and labelSizeAdjust (object form only)", () => {
		const config = parseSingle(`
notes:
  - {s: 6, f: 0, color: red, fillStyle: outlined, sizeAdjust: -3, labelSizeAdjust: 2}
`);
		expect(config.notes[0].color).toBe("red");
		expect(config.notes[0].fillStyle).toBe("outlined");
		expect(config.notes[0].sizeAdjust).toBe(-3);
		expect(config.notes[0].labelSizeAdjust).toBe(2);
	});

	it("rejects an invalid per-note fillStyle", () => {
		expect(() => parseFretboardBlock("notes:\n  - {s: 6, f: 0, fillStyle: hollow}")).toThrow(
			FretboardParseError
		);
	});

	it("rejects a per-note sizeAdjust outside -5..5", () => {
		expect(() => parseFretboardBlock("notes:\n  - {s: 6, f: 0, sizeAdjust: 10}")).toThrow(
			FretboardParseError
		);
	});

	it("rejects an unknown top-level key (e.g. a typo like flets instead of frets)", () => {
		expect(() => parseFretboardBlock("flets: 3\nnotes:\n  - {s: 6, f: 0}")).toThrow(FretboardParseError);
	});

	it("rejects an unknown key inside a note", () => {
		expect(() => parseFretboardBlock("notes:\n  - {s: 6, f: 0, colour: red}")).toThrow(
			FretboardParseError
		);
	});

	it("rejects an unknown key inside a barre entry", () => {
		expect(() =>
			parseFretboardBlock("barre:\n  - {fret: 1, start: 6, end: 1, finger: 1}\nnotes:\n  - {s: 6, f: 0}")
		).toThrow(FretboardParseError);
	});

	it("rejects an unknown key inside a box entry", () => {
		expect(() =>
			parseFretboardBlock('boxes:\n  - {frets: "5-8", color: red}\nnotes:\n  - {s: 6, f: 0}')
		).toThrow(FretboardParseError);
	});

	describe("diagrams (multiple side-by-side diagrams in one block)", () => {
		it("parses a list of diagrams, each with the single-diagram schema", () => {
			const parsed = parseFretboardBlock(`
diagrams:
  - title: Cmaj7
    startFret: 0
    notes:
      - {s: 5, f: 3, label: root}
  - title: Dm7
    startFret: 0
    notes:
      - {s: 4, f: 0, label: root}
`);
			if (parsed.kind !== "multi") throw new Error("expected a multi-diagram block");
			expect(parsed.diagrams).toHaveLength(2);
			expect(parsed.diagrams[0].title).toBe("Cmaj7");
			expect(parsed.diagrams[1].title).toBe("Dm7");
		});

		it("rejects an empty diagrams list", () => {
			expect(() => parseFretboardBlock("diagrams: []")).toThrow(FretboardParseError);
		});

		it("rejects a diagram entry missing notes, with a context-prefixed error", () => {
			expect(() =>
				parseFretboardBlock("diagrams:\n  - {title: Foo}\n  - {notes: [{s: 6, f: 0}]}")
			).toThrow(/diagrams\[0\]\.notes/);
		});

		it("rejects an unknown key inside a diagram entry", () => {
			expect(() =>
				parseFretboardBlock("diagrams:\n  - {flets: 3, notes: [{s: 6, f: 0}]}")
			).toThrow(FretboardParseError);
		});

		it("rejects mixing diagrams with other top-level keys", () => {
			expect(() =>
				parseFretboardBlock("diagrams:\n  - {notes: [{s: 6, f: 0}]}\ntitle: Foo")
			).toThrow(FretboardParseError);
		});
	});
});
