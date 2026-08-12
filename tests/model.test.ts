import { describe, expect, it } from "vitest";
import { resolveFretboardModel } from "../src/model/fretboard-model";
import { DEFAULT_SETTINGS } from "../src/settings/settings";
import type { FretboardBlockConfig } from "../src/types";

describe("resolveFretboardModel", () => {
	it("switches to relative mode when startFret is omitted, using the lowest fretted note (0 and x excluded)", () => {
		const config: FretboardBlockConfig = {
			notes: [
				{ s: 6, f: 5 },
				{ s: 5, f: "x" },
				{ s: 4, f: 7 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.isRelative).toBe(true);
		expect(model.startFret).toBe(5);
	});

	it("auto-expands fretsWidth so a fretted note is never clipped past the default width (the README quick-start example)", () => {
		// No `frets` given: settings.fretCount defaults to 4, but this shape reaches fret 5.
		const config: FretboardBlockConfig = {
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: 2 },
				{ s: 4, f: 5 },
				{ s: 3, f: 2 },
				{ s: 2, f: 0 },
				{ s: 1, f: 0 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.fretsWidth).toBeGreaterThanOrEqual(5);
	});

	it("does not shrink fretsWidth below the System/Global default when notes fit comfortably", () => {
		const config: FretboardBlockConfig = { startFret: 0, notes: [{ s: 6, f: 1 }] };
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.fretsWidth).toBe(DEFAULT_SETTINGS.fretCount);
	});

	it("respects an explicit `frets` even if it is narrower than the highest fretted note", () => {
		const config: FretboardBlockConfig = { startFret: 0, frets: 2, notes: [{ s: 6, f: 5 }] };
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.fretsWidth).toBe(2);
	});

	it("uses absolute mode and the given startFret when present", () => {
		const config: FretboardBlockConfig = { startFret: 5, notes: [{ s: 6, f: 5 }] };
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.isRelative).toBe(false);
		expect(model.startFret).toBe(5);
	});

	it("marks every note sharing the root's pitch class as root", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, label: "root" }, // E, root
				{ s: 4, f: 2 }, // D string + 2 = E, octave duplicate
				{ s: 5, f: 2 }, // A string + 2 = B, fifth
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		const byString = new Map(model.notes.map((n) => [n.string, n]));
		expect(byString.get(6)?.isRoot).toBe(true);
		expect(byString.get(4)?.isRoot).toBe(true);
		expect(byString.get(5)?.isRoot).toBe(false);
	});

	describe("shape: none", () => {
		it("resolves a per-note shape: none override regardless of the System default", () => {
			const config: FretboardBlockConfig = {
				startFret: 0,
				notes: [{ s: 6, f: 0, shape: "none" }],
			};
			const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
			expect(model.notes[0].shape).toBe("none");
		});

		it("falls back to a System/Global defaultShape of none when a note doesn't specify one", () => {
			const settings = { ...DEFAULT_SETTINGS, defaultShape: "none" as const };
			const config: FretboardBlockConfig = { startFret: 0, notes: [{ s: 6, f: 0 }] };
			const model = resolveFretboardModel(config, settings);
			expect(model.notes[0].shape).toBe("none");
		});

		it("does not upgrade a root note to square when defaultShape is none (the circle-only upgrade doesn't apply)", () => {
			const settings = { ...DEFAULT_SETTINGS, defaultShape: "none" as const };
			const config: FretboardBlockConfig = {
				startFret: 0,
				notes: [{ s: 6, f: 0, label: "root" }],
			};
			const model = resolveFretboardModel(config, settings);
			expect(model.notes[0].shape).toBe("none");
		});
	});

	it("labels notes with computed degrees in interval mode", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: 2 }, // fifth
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		const fifth = model.notes.find((n) => n.string === 5);
		expect(fifth?.label).toBe("5");
	});

	it("does not compute degrees when no note is marked root", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0 },
				{ s: 5, f: 2 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.notes.every((n) => n.label === "")).toBe(true);
	});

	it("shows note names in note-label mode when the diagram is absolute (startFret given)", () => {
		const settings = { ...DEFAULT_SETTINGS, labelMode: "note" as const };
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [{ s: 6, f: 1 }], // low E + 1 = F
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.notes[0].label).toBe("F");
	});

	it("shows note names in note-label mode when an explicit open string anchors the position", () => {
		const settings = { ...DEFAULT_SETTINGS, labelMode: "note" as const };
		const config: FretboardBlockConfig = {
			notes: [{ s: 6, f: 0 }], // open low E, no startFret
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.notes[0].label).toBe("E");
	});

	it("suppresses note names in note-label mode for a relative/movable shape (no startFret, no open string)", () => {
		const settings = { ...DEFAULT_SETTINGS, labelMode: "note" as const };
		const config: FretboardBlockConfig = {
			notes: [
				{ s: 6, f: 5 },
				{ s: 5, f: 7 },
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.notes.every((n) => n.label === "")).toBe(true);
	});

	it("keeps custom labels verbatim regardless of label mode", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [{ s: 6, f: 0, label: "maj7" }],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.notes[0].label).toBe("maj7");
	});

	it("fills omitted strings as open by default", () => {
		const config: FretboardBlockConfig = { startFret: 0, notes: [{ s: 6, f: 0 }] };
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		const strings = model.notes.map((n) => n.string).sort();
		expect(strings).toEqual([1, 2, 3, 4, 5, 6]);
		expect(model.notes.find((n) => n.string === 1)?.fret).toBe(0);
	});

	it("fills omitted strings as muted when configured", () => {
		const settings = { ...DEFAULT_SETTINGS, omittedStringBehavior: "muted" as const };
		const config: FretboardBlockConfig = { startFret: 0, notes: [{ s: 6, f: 0 }] };
		const model = resolveFretboardModel(config, settings);
		expect(model.notes.find((n) => n.string === 1)?.fret).toBe("x");
	});

	it("draws nothing extra for omitted strings when set to none", () => {
		const settings = { ...DEFAULT_SETTINGS, omittedStringBehavior: "none" as const };
		const config: FretboardBlockConfig = { startFret: 0, notes: [{ s: 6, f: 0 }] };
		const model = resolveFretboardModel(config, settings);
		expect(model.notes).toHaveLength(1);
	});

	it("respects an explicit visible string range", () => {
		const config: FretboardBlockConfig = { startFret: 0, visible: "1-3", notes: [{ s: 6, f: 0 }] };
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.visibleStart).toBe(1);
		expect(model.visibleEnd).toBe(3);
		expect(model.notes.every((n) => n.string >= 1 && n.string <= 3)).toBe(true);
	});

	it("auto-generates an absolute chord name from the root and present degrees", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, label: "root" }, // E
				{ s: 5, f: 2 }, // B, fifth
				{ s: 4, f: 5 }, // G, minor third
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.title).toBe("Em");
	});

	it("auto-generates a relative chord name (box symbol) when startFret is omitted", () => {
		const settings = { ...DEFAULT_SETTINGS, omittedStringBehavior: "none" as const };
		const config: FretboardBlockConfig = {
			visible: "5-6",
			notes: [
				{ s: 6, f: 5, label: "root" },
				{ s: 5, f: 7 },
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.title).toBe("□5");
	});

	it("names a slash chord when the lowest sounding string's note differs from the root", () => {
		const settings = { ...DEFAULT_SETTINGS, omittedStringBehavior: "none" as const };
		const config: FretboardBlockConfig = {
			startFret: 0,
			visible: "5-6",
			notes: [
				{ s: 6, f: 0 }, // open low E: the bass note, and the chord's 3rd (not the root)
				{ s: 5, f: 3, label: "root" }, // C
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.title).toBe("C/E");
	});

	it("does not drop an altered 13th (m6 with a plain 5th) from a sus4 chord", () => {
		const config: FretboardBlockConfig = {
			startFret: 1,
			frets: 4,
			barre: [{ fret: 1, start: 6, end: 1 }],
			notes: [
				{ s: 6, f: 1 },
				{ s: 5, f: 3, label: "root" },
				{ s: 4, f: 3 },
				{ s: 3, f: 1 },
				{ s: 2, f: 1 },
				{ s: 1, f: 3 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.title).toBe("Csus4(b13)/F");
	});

	it("names a slash chord's bass by Roman-numeral degree in relative mode (no absolute pitch is known)", () => {
		const settings = { ...DEFAULT_SETTINGS, omittedStringBehavior: "none" as const };
		const config: FretboardBlockConfig = {
			visible: "5-6",
			notes: [
				{ s: 5, f: 3, label: "root" },
				{ s: 6, f: 6 }, // a minor 7th above the root
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.isRelative).toBe(true);
		expect(model.title).toBe("□5/bVII");
	});

	it("applies a local chordSymbolStyle override to the auto-generated title", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			visible: "3-6",
			chordSymbolStyle: "jazz",
			notes: [
				{ s: 6, f: 0, label: "root" }, // E
				{ s: 5, f: 1 }, // Bb, b5
				{ s: 4, f: 5 }, // G, m3
				{ s: 3, f: 7 }, // D, m7
			],
		};
		const settings = { ...DEFAULT_SETTINGS, omittedStringBehavior: "none" as const };
		const model = resolveFretboardModel(config, settings);
		expect(model.title).toBe("Eø7");
	});

	it("uses the System/Global chordSymbolStyle for the auto-generated title", () => {
		const settings = { ...DEFAULT_SETTINGS, chordSymbolStyle: "berklee" as const };
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, label: "root" }, // E
				{ s: 5, f: 2 }, // B, fifth
				{ s: 4, f: 5 }, // G, minor third
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.title).toBe("E-");
	});

	it("respects an explicit title override", () => {
		const config: FretboardBlockConfig = {
			title: "Custom Title",
			startFret: 0,
			notes: [{ s: 6, f: 0 }],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.title).toBe("Custom Title");
	});

	it("marks a custom title as not auto-generated, with no typography markup applied", () => {
		// A hand-typed title is arbitrary text ("berklee", "Cmaj9", ...), not necessarily a
		// chord name — it must never be parsed for typography (a stray "b" or digit isn't
		// a flat/tension here), unlike an auto-generated title.
		const config: FretboardBlockConfig = {
			title: "berklee b5 9",
			startFret: 0,
			notes: [{ s: 6, f: 0 }],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.titleIsAutoGenerated).toBe(false);
		expect(model.titleMarkup).toBe(model.title);
	});

	it("embeds typography markers in titleMarkup but strips them from the clean title", () => {
		const settings = { ...DEFAULT_SETTINGS, omittedStringBehavior: "none" as const };
		const config: FretboardBlockConfig = {
			visible: "5-6",
			notes: [
				{ s: 6, f: 0 }, // E, the bass note (not the root)
				{ s: 5, f: 3, label: "root" }, // C
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.title).toBe("C/E");
		expect(model.titleMarkup).not.toBe(model.title);
		expect(model.titleMarkup.length).toBeGreaterThan(model.title.length);
	});

	it("marks an auto-generated title as auto-generated", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: 2 },
				{ s: 4, f: 5 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.titleIsAutoGenerated).toBe(true);
	});

	it("switches to absolute mode (real chord name, nut shown) when startFret is omitted but an explicit open string is present", () => {
		const settings = { ...DEFAULT_SETTINGS, omittedStringBehavior: "none" as const };
		const config: FretboardBlockConfig = {
			visible: "5-6",
			notes: [
				{ s: 6, f: 0, label: "root" }, // open low E
				{ s: 5, f: 2 }, // fifth
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.isRelative).toBe(false);
		expect(model.startFret).toBe(0);
		expect(model.title).toBe("E5");
	});

	it("still uses the box symbol when startFret is omitted and no note is open", () => {
		const settings = { ...DEFAULT_SETTINGS, omittedStringBehavior: "none" as const };
		const config: FretboardBlockConfig = {
			visible: "5-6",
			notes: [
				{ s: 6, f: 5, label: "root" },
				{ s: 5, f: 7 },
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.title).toBe("□5");
	});

	it("scales string/fret spacing per block via the size property", () => {
		const config: FretboardBlockConfig = { startFret: 0, size: 0.5, notes: [{ s: 6, f: 0 }] };
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.stringSpacing).toBe(DEFAULT_SETTINGS.stringSpacing * 0.5);
		expect(model.fretSpacing).toBe(DEFAULT_SETTINGS.fretSpacing * 0.5);
	});

	it("applies fretSpacingAdjust/stringSpacingAdjust as a pixel delta before size", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			fretSpacingAdjust: -5,
			stringSpacingAdjust: 3,
			notes: [{ s: 6, f: 0 }],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.fretSpacing).toBe(DEFAULT_SETTINGS.fretSpacing - 5);
		expect(model.stringSpacing).toBe(DEFAULT_SETTINGS.stringSpacing + 3);
	});

	it("floors spacing to a safe minimum instead of going to zero or negative", () => {
		const settings = { ...DEFAULT_SETTINGS, fretSpacing: 6, stringSpacing: 6 };
		const config: FretboardBlockConfig = {
			startFret: 0,
			fretSpacingAdjust: -5,
			stringSpacingAdjust: -5,
			notes: [{ s: 6, f: 0 }],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.fretSpacing).toBeGreaterThan(0);
		expect(model.stringSpacing).toBeGreaterThan(0);
	});

	it("overrides orientation locally", () => {
		const config: FretboardBlockConfig = { startFret: 0, orientation: "vertical", notes: [{ s: 6, f: 0 }] };
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.orientation).toBe("vertical");
		expect(DEFAULT_SETTINGS.orientation).toBe("horizontal");
	});

	it("resolves per-note color and fillStyle overrides independently of the diagram default", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, color: "red" },
				{ s: 5, f: 0, fillStyle: "outlined" },
				{ s: 4, f: 0 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		const byString = new Map(model.notes.map((n) => [n.string, n]));
		expect(byString.get(6)?.color).toBe("red");
		expect(byString.get(6)?.fillStyle).toBe(DEFAULT_SETTINGS.fillStyle);
		expect(byString.get(5)?.fillStyle).toBe("outlined");
		expect(byString.get(4)?.color).toBeUndefined();
		expect(byString.get(4)?.fillStyle).toBe(DEFAULT_SETTINGS.fillStyle);
	});

	it("resolves per-note radius/labelFontSize from System noteSize/labelFontSize plus per-note adjust", () => {
		const settings = { ...DEFAULT_SETTINGS, noteSize: 10, labelFontSize: 10 };
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, sizeAdjust: -3, labelSizeAdjust: 2 },
				{ s: 5, f: 0 },
			],
		};
		const model = resolveFretboardModel(config, settings);
		const byString = new Map(model.notes.map((n) => [n.string, n]));
		expect(byString.get(6)?.radius).toBe(7);
		expect(byString.get(6)?.labelFontSize).toBe(12);
		expect(byString.get(5)?.radius).toBe(10);
		expect(byString.get(5)?.labelFontSize).toBe(10);
	});

	it("uses non-default System noteSize/labelFontSize as-is for notes without a local adjust", () => {
		const settings = { ...DEFAULT_SETTINGS, noteSize: 20, labelFontSize: 16 };
		const config: FretboardBlockConfig = { startFret: 0, notes: [{ s: 6, f: 0 }] };
		const model = resolveFretboardModel(config, settings);
		expect(model.notes[0].radius).toBe(20);
		expect(model.notes[0].labelFontSize).toBe(16);
	});

	it("multiplies per-note radius/labelFontSize by the block's size along with the adjust", () => {
		const settings = { ...DEFAULT_SETTINGS, noteSize: 10, labelFontSize: 10 };
		const config: FretboardBlockConfig = {
			startFret: 0,
			size: 0.5,
			notes: [{ s: 6, f: 0, sizeAdjust: -4 }],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.notes[0].radius).toBe(3); // (10 - 4) * 0.5
	});
});

describe("resolveFretboardModel — startFret fret-offset (relative-to-position-1 numbering)", () => {
	it("offsets note frets by startFret-1 when startFret > 1, so f:1 lands on the given startFret", () => {
		const config: FretboardBlockConfig = {
			startFret: 5,
			notes: [
				{ s: 6, f: 1, label: "root" }, // -> absolute fret 5
				{ s: 6, f: 4 }, // -> absolute fret 8
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		const byString = model.notes.filter((n) => n.string === 6);
		expect(byString.map((n) => n.fret)).toEqual([5, 8]);
	});

	it("never offsets open (0) or muted (x) notes, even when startFret > 1", () => {
		const config: FretboardBlockConfig = {
			startFret: 5,
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: "x" },
				{ s: 4, f: 2 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.notes.find((n) => n.string === 6)?.fret).toBe(0);
		expect(model.notes.find((n) => n.string === 5)?.fret).toBe("x");
		expect(model.notes.find((n) => n.string === 4)?.fret).toBe(6); // 2 + (5-1)
	});

	it("offsets boxes.frets, paths, and barre.fret consistently with notes", () => {
		const config: FretboardBlockConfig = {
			startFret: 5,
			notes: [{ s: 6, f: 1, label: "root" }],
			boxes: [{ frets: "1-4" }],
			paths: [
				[
					[6, 1],
					[6, 4],
				],
			],
			barre: [{ fret: 1, start: 6, end: 5 }],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.boxes[0].frets).toBe("5-8");
		expect(model.paths[0]).toEqual([
			[6, 5],
			[6, 8],
		]);
		expect(model.barre[0].fret).toBe(5);
	});

	it("does not offset when startFret is 0 (open-position numbers stay literal)", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: 2 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.notes.find((n) => n.string === 5)?.fret).toBe(2);
	});

	it("does not offset when startFret is 1 (already position-1-based)", () => {
		const config: FretboardBlockConfig = {
			startFret: 1,
			notes: [{ s: 6, f: 3, label: "root" }],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.notes[0].fret).toBe(3);
	});

	it("does not offset when startFret is omitted, even if an open string forces absolute mode", () => {
		const config: FretboardBlockConfig = {
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: 2 },
				{ s: 4, f: 5 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.isRelative).toBe(false); // absolute mode (open string present)
		expect(model.notes.find((n) => n.string === 5)?.fret).toBe(2);
		expect(model.notes.find((n) => n.string === 4)?.fret).toBe(5);
	});

	it("does not offset in relative mode (no startFret, no open string)", () => {
		const config: FretboardBlockConfig = {
			notes: [
				{ s: 6, f: 5, label: "root" },
				{ s: 5, f: 7 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.isRelative).toBe(true);
		expect(model.notes.find((n) => n.string === 5)?.fret).toBe(7);
	});
});

describe("resolveFretboardModel — naming mode (chord vs scale)", () => {
	it("defaults to chord naming", () => {
		expect(DEFAULT_SETTINGS.namingMode).toBe("chord");
	});

	it("names a chord/arpeggio, unaffected by namingMode, when the degrees don't exactly match a known scale", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			namingMode: "scale",
			notes: [
				{ s: 6, f: 0, label: "root" }, // E
				{ s: 5, f: 2 }, // B, fifth
				{ s: 4, f: 5 }, // G, minor third
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		expect(model.title).toBe("Em"); // a plain minor triad isn't a listed scale
	});

	it("names the scale (absolute) when namingMode is scale and the degrees exactly match a known scale", () => {
		const settings = { ...DEFAULT_SETTINGS, namingMode: "scale" as const };
		// All-open E minor pentatonic (E,A,D,G,B open = 1,4,m7,m3,5 relative to E).
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: 0 },
				{ s: 4, f: 0 },
				{ s: 3, f: 0 },
				{ s: 2, f: 0 },
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.title).toBe("E Minor Pentatonic");
	});

	it("names the scale (relative, □ prefix) when namingMode is scale and no startFret/open string is given", () => {
		const settings = { ...DEFAULT_SETTINGS, namingMode: "scale" as const, omittedStringBehavior: "none" as const };
		const config: FretboardBlockConfig = {
			visible: "2-6",
			notes: [
				{ s: 6, f: 5, label: "root" }, // A
				{ s: 5, f: 3 }, // C, m3
				{ s: 3, f: 7 }, // D, 4
				{ s: 4, f: 2 }, // E, 5
				{ s: 2, f: 8 }, // G, m7
			],
		};
		const model = resolveFretboardModel(config, settings);
		expect(model.isRelative).toBe(true);
		expect(model.title).toBe("□ Minor Pentatonic");
	});

	it("a Local namingMode overrides the System/Global default", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			namingMode: "scale",
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: 0 },
				{ s: 4, f: 0 },
				{ s: 3, f: 0 },
				{ s: 2, f: 0 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS); // System default is "chord"
		expect(model.title).toBe("E Minor Pentatonic");
	});
});
