import { describe, expect, it } from "vitest";
import { resolveFretboardModel } from "../src/model/fretboard-model";
import { DEFAULT_SETTINGS } from "../src/settings/settings";
import type { FretboardBlockConfig } from "../src/types";
import { buildFretboardSvg } from "../src/render/render-fretboard";
import { createSvgRoot, svgEl, toSvgString, VNode } from "../src/render/svg-builder";

// These run in vitest's plain "node" environment (see vitest.config.ts) — no `document`,
// no jsdom. That's the point: `toSvgString` must work without one, unlike `toDom` (which
// needs a real DOM and is only exercised manually in Obsidian — see the project's vault
// test note convention).
describe("svg-builder VNode / toSvgString", () => {
	it("serializes an attribute-only leaf as a self-closing tag", () => {
		const node = svgEl("circle", { cx: 5, cy: 10, r: 3 });
		expect(toSvgString(node)).toBe('<circle cx="5" cy="10" r="3"/>');
	});

	it("serializes nested children in append order", () => {
		const root = svgEl("svg", { width: 100 });
		svgEl("circle", { r: 1 }, root);
		svgEl("rect", { width: 2 }, root);
		expect(toSvgString(root)).toBe('<svg width="100"><circle r="1"/><rect width="2"/></svg>');
	});

	it("textContent setter replaces any existing children", () => {
		const node = new VNode("text");
		svgEl("tspan", {}, node);
		node.textContent = "hello";
		expect(node.children).toEqual(["hello"]);
		expect(toSvgString(node)).toBe("<text>hello</text>");
	});

	it("appendText preserves interleaving with element children (mixed text + tspan runs)", () => {
		const node = new VNode("text");
		node.appendText("C");
		svgEl("tspan", { "font-size": "75%" }, node).textContent = "9";
		node.appendText("(");
		expect(toSvgString(node)).toBe('<text>C<tspan font-size="75%">9</tspan>(</text>');
	});

	it("escapes XML-special characters in both attributes and text", () => {
		const node = svgEl("text", { style: 'fill:red;content:"<test>";' });
		node.textContent = "A & B < C";
		expect(toSvgString(node)).toBe(
			'<text style="fill:red;content:&quot;&lt;test&gt;&quot;;">A &amp; B &lt; C</text>'
		);
	});

	it("createSvgRoot sets width/height/viewBox/class", () => {
		const root = createSvgRoot(120, 80);
		expect(toSvgString(root)).toBe('<svg width="120" height="80" viewBox="0 0 120 80" class="fretboard-svg"/>');
	});
});

describe("buildFretboardSvg + toSvgString (platform-agnostic rendering path)", () => {
	it("produces a well-formed SVG string for a simple absolute-mode chord diagram", () => {
		const config: FretboardBlockConfig = {
			startFret: 0,
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: 2 },
				{ s: 4, f: 2 },
			],
		};
		const model = resolveFretboardModel(config, DEFAULT_SETTINGS);
		const svg = toSvgString(buildFretboardSvg(model));

		expect(svg).toMatch(/^<svg width="\d+(\.\d+)?" height="\d+(\.\d+)?" viewBox="0 0 [\d.]+ [\d.]+" class="fretboard-svg">/);
		expect(svg).toContain(model.title); // auto-generated chord title text is present
		expect(svg.match(/<circle/g)?.length).toBeGreaterThanOrEqual(3); // one shape per note, at least
		// Balanced tags: every opening tag with children has a matching close tag.
		const opens = svg.match(/<[a-z]+[^/>]*(?<!\/)>/g)?.length ?? 0;
		const closes = svg.match(/<\/[a-z]+>/g)?.length ?? 0;
		expect(opens).toBe(closes);
	});

	it("renders a multi-line scaleAnalyze title as separate <text> lines", () => {
		const settings = { ...DEFAULT_SETTINGS, namingMode: "scale" as const };
		const config: FretboardBlockConfig = {
			startFret: 0,
			scaleAnalyze: true,
			notes: [
				{ s: 6, f: 0, label: "root" },
				{ s: 5, f: 0 },
				{ s: 4, f: 0 },
				{ s: 3, f: 0 },
				{ s: 2, f: 0 },
				{ s: 1, f: 2 },
			],
		};
		const model = resolveFretboardModel(config, settings);
		const svg = toSvgString(buildFretboardSvg(model));
		const titleLines = model.title.split("\n");
		expect(titleLines.length).toBeGreaterThan(1);
		for (const line of titleLines) {
			expect(svg).toContain(`class="fretboard-title"`);
			expect(svg).toContain(line);
		}
		expect(svg.match(/class="fretboard-title"/g)?.length).toBe(titleLines.length);
	});
});
