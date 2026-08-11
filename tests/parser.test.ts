import { describe, expect, it } from "vitest";
import { parseFretboardBlock } from "../src/parser/parse";
import { FretboardParseError } from "../src/parser/errors";

describe("parseFretboardBlock", () => {
	it("requires the notes property", () => {
		expect(() => parseFretboardBlock("title: Foo")).toThrow(FretboardParseError);
	});

	it("normalizes object-form notes", () => {
		const config = parseFretboardBlock(`
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
		const config = parseFretboardBlock(`
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
		const config = parseFretboardBlock(`
notes:
  - {s: 6, f: x}
`);
		expect(config.notes[0].f).toBe("x");
	});

	it("parses the full example from the spec", () => {
		const config = parseFretboardBlock(`
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
		const config = parseFretboardBlock(`
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
		const config = parseFretboardBlock(`
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
});
