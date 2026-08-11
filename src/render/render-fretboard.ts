import type { ResolvedModel, ResolvedNote } from "../model/fretboard-model";
import type { Shape } from "../types";
import { parseRange } from "../parser/range";
import { createSvgRoot, svgEl } from "./svg-builder";
import { Layout, stringAxisIndex } from "./layout";

export function renderFretboard(container: HTMLElement, model: ResolvedModel): void {
	const rowsCount = model.visibleEnd - model.visibleStart + 1;
	const headerSize = model.fretSpacing * 0.6;
	const titleHeight = model.title ? 26 : 6;
	const layout = new Layout(
		model.orientation,
		model.stringSpacing,
		model.fretSpacing,
		rowsCount,
		model.fretsWidth,
		headerSize,
		titleHeight
	);
	// Baseline used only for scaffolding (barre thickness, muted-string cross) — each
	// note's own dot uses its resolved `radius` instead (see ResolvedNote).
	const baselineRadius = Math.min(model.stringSpacing, model.fretSpacing) * 0.32;

	const svg = createSvgRoot(layout.width, layout.height);

	if (model.title) {
		const t = svgEl(
			"text",
			{ x: layout.width / 2, y: 18, class: "fretboard-title", "text-anchor": "middle" },
			svg
		);
		t.textContent = model.title;
	}

	drawBoxes(svg, layout, model);
	drawGrid(svg, layout, model);
	drawBarre(svg, layout, model, baselineRadius);
	drawPaths(svg, layout, model);
	for (const note of model.notes) drawNote(svg, layout, model, note, baselineRadius);

	container.empty();
	container.appendChild(svg);
}

/**
 * Fret 0 (open) is never a grid cell — it's always drawn in the header lane — so cell
 * placement must never be computed against a raw `startFret` of 0, or the open marker
 * would appear to occupy the grid's first fret column. `model.startFret` itself stays
 * 0 (it also drives nut styling), so this clamp is applied only where cells are placed.
 */
function gridStartFret(model: ResolvedModel): number {
	return Math.max(model.startFret, 1);
}

/**
 * Standard guitar fretboard inlay marker positions: single dots at 3, 5, 7, 9 within
 * each octave, a marker at the 12-fret octave point (double dot in real life), then
 * the same pattern repeating an octave higher (15, 17, 19, 21, 24, ...).
 */
function isInlayFret(fret: number): boolean {
	const m = ((fret % 12) + 12) % 12;
	return m === 3 || m === 5 || m === 7 || m === 9 || m === 0;
}

function drawGrid(svg: SVGSVGElement, layout: Layout, model: ResolvedModel): void {
	const rowsCount = layout.rowsCount;

	for (let i = 0; i <= model.fretsWidth; i++) {
		const isNut = i === 0 && model.startFret === 0;

		if (isNut && model.nutStyle === "double") {
			for (const offset of [-0.08, 0.08]) {
				const a = layout.point(0, i + offset);
				const b = layout.point(rowsCount - 1, i + offset);
				svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "fretboard-fret-line is-nut" }, svg);
			}
		} else {
			const a = layout.point(0, i);
			const b = layout.point(rowsCount - 1, i);
			const cls = `fretboard-fret-line${isNut ? " is-nut is-nut-thick" : ""}`;
			svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: cls }, svg);
		}
	}

	for (let j = 0; j < rowsCount; j++) {
		const a = layout.point(j, 0);
		const b = layout.point(j, model.fretsWidth);
		svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "fretboard-string-line" }, svg);
	}

	if (!model.isRelative && model.startFret > 0) {
		const p = layout.point(-0.35, 0.15);
		const t = svgEl(
			"text",
			{ x: p.x, y: p.y, class: "fretboard-startfret", "text-anchor": "middle" },
			svg
		);
		t.textContent = `${model.startFret}fr`;
	}

	if (!model.isRelative && model.fretNumbering !== "none") {
		const start = gridStartFret(model);
		for (let c = 0; c < model.fretsWidth; c++) {
			const fret = start + c;
			const shouldShow =
				model.fretNumbering === "all" ||
				(model.fretNumbering === "dotted" &&
					model.notes.some((n) => typeof n.fret === "number" && n.fret === fret)) ||
				(model.fretNumbering === "inlay" && isInlayFret(fret));
			if (!shouldShow) continue;

			let pos: { x: number; y: number };
			if (model.orientation === "horizontal") {
				const base = layout.point(rowsCount - 1, c + 0.5);
				pos = { x: base.x, y: base.y + 18 };
			} else {
				const base = layout.point(0, c + 0.5);
				pos = { x: base.x - 18, y: base.y };
			}
			const t = svgEl(
				"text",
				{ x: pos.x, y: pos.y, class: "fretboard-fret-number", "text-anchor": "middle" },
				svg
			);
			t.textContent = String(fret);
		}
	}
}

function drawBoxes(svg: SVGSVGElement, layout: Layout, model: ResolvedModel): void {
	for (const box of model.boxes) {
		const fretRange = parseRange(box.frets, "boxes.frets");
		const stringRange = box.strings
			? parseRange(box.strings, "boxes.strings")
			: { start: model.visibleStart, end: model.visibleEnd };

		const idxA = stringAxisIndex(stringRange.start, model.visibleStart, model.visibleEnd, model.orientation);
		const idxB = stringAxisIndex(stringRange.end, model.visibleStart, model.visibleEnd, model.orientation);
		const sMin = Math.min(idxA, idxB) - 0.5;
		const sMax = Math.max(idxA, idxB) + 0.5;
		const start = gridStartFret(model);
		const fMin = fretRange.start - start;
		const fMax = fretRange.end - start + 1;

		const p1 = layout.point(sMin, fMin);
		const p2 = layout.point(sMax, fMax);
		const attrs: Record<string, string | number> = {
			x: Math.min(p1.x, p2.x),
			y: Math.min(p1.y, p2.y),
			width: Math.abs(p2.x - p1.x),
			height: Math.abs(p2.y - p1.y),
			class: `fretboard-box${box.style === "dashed" ? " is-dashed" : ""}`,
		};
		if (box.style === "dashed") attrs["stroke-dasharray"] = "5,3";
		svgEl("rect", attrs, svg);
	}
}

function drawBarre(svg: SVGSVGElement, layout: Layout, model: ResolvedModel, dotRadius: number): void {
	for (const b of model.barre) {
		const idxStart = stringAxisIndex(b.start, model.visibleStart, model.visibleEnd, model.orientation);
		const idxEnd = stringAxisIndex(b.end, model.visibleStart, model.visibleEnd, model.orientation);
		const cell = b.fret - gridStartFret(model) + 0.5;
		const p1 = layout.point(idxStart, cell);
		const p2 = layout.point(idxEnd, cell);
		svgEl(
			"line",
			{
				x1: p1.x,
				y1: p1.y,
				x2: p2.x,
				y2: p2.y,
				class: "fretboard-barre",
				"stroke-width": dotRadius * 1.6,
				"stroke-linecap": "round",
			},
			svg
		);
	}
}

function drawPaths(svg: SVGSVGElement, layout: Layout, model: ResolvedModel): void {
	const start = gridStartFret(model);
	for (const path of model.paths) {
		if (path.length < 2) continue;
		const points = path
			.map(([s, f]) => {
				const idx = stringAxisIndex(s, model.visibleStart, model.visibleEnd, model.orientation);
				const cell = f - start + 0.5;
				const p = layout.point(idx, cell);
				return `${p.x},${p.y}`;
			})
			.join(" ");
		svgEl("polyline", { points, class: "fretboard-path" }, svg);
	}
}

function drawNote(
	svg: SVGSVGElement,
	layout: Layout,
	model: ResolvedModel,
	note: ResolvedNote,
	baselineRadius: number
): void {
	const idx = stringAxisIndex(note.string, model.visibleStart, model.visibleEnd, model.orientation);

	if (note.fret === "x") {
		const p = layout.headerPoint(idx);
		drawMutedCross(svg, p.x, p.y, baselineRadius);
		return;
	}

	const p =
		note.fret === 0
			? layout.headerPoint(idx)
			: layout.point(idx, note.fret - gridStartFret(model) + 0.5);

	const filled = note.fillStyle === "filled";
	drawShape(svg, note.shape, p.x, p.y, note.radius, filled, note.ghost, note.className, note.color);
	drawLabel(svg, note.label, p.x, p.y, filled, note.labelFontSize);
	drawFinger(svg, note.finger, p.x, p.y, note.radius);
}

function drawShape(
	svg: SVGSVGElement,
	shape: Shape,
	cx: number,
	cy: number,
	r: number,
	filled: boolean,
	dashed: boolean,
	className: string | undefined,
	color: string | undefined
): void {
	const cls = [
		"fretboard-shape",
		filled ? "is-filled" : "is-outlined",
		dashed ? "is-ghost" : "",
		className ?? "",
	]
		.filter(Boolean)
		.join(" ");
	const attrs: Record<string, string | number> = { class: cls };
	if (dashed) attrs["stroke-dasharray"] = "3,2";
	// Inline style (not a presentation attribute) so it wins over the CSS classes above.
	if (color) attrs.style = filled ? `fill:${color};stroke:${color};` : `stroke:${color};`;

	switch (shape) {
		case "square": {
			const s = r * 1.7;
			svgEl("rect", { ...attrs, x: cx - s / 2, y: cy - s / 2, width: s, height: s }, svg);
			break;
		}
		case "triangle": {
			const s = r * 2.1;
			const h = s * 0.87;
			const points = `${cx},${cy - h * 0.6} ${cx - s / 2},${cy + h * 0.4} ${cx + s / 2},${cy + h * 0.4}`;
			svgEl("polygon", { ...attrs, points }, svg);
			break;
		}
		default:
			svgEl("circle", { ...attrs, cx, cy, r }, svg);
	}
}

function drawLabel(
	svg: SVGSVGElement,
	text: string,
	cx: number,
	cy: number,
	filled: boolean,
	fontSize: number
): void {
	if (!text) return;
	const t = svgEl(
		"text",
		{
			x: cx,
			y: cy,
			class: `fretboard-label ${filled ? "is-on-filled" : "is-on-outlined"}`,
			"text-anchor": "middle",
			"dominant-baseline": "central",
			style: `font-size:${fontSize}px;`,
		},
		svg
	);
	t.textContent = text;
}

function drawFinger(svg: SVGSVGElement, finger: number | undefined, cx: number, cy: number, r: number): void {
	if (finger === undefined) return;
	const t = svgEl(
		"text",
		{ x: cx, y: cy + r + 11, class: "fretboard-finger", "text-anchor": "middle" },
		svg
	);
	t.textContent = String(finger);
}

function drawMutedCross(svg: SVGSVGElement, cx: number, cy: number, r: number): void {
	const d = r * 0.7;
	svgEl("line", { x1: cx - d, y1: cy - d, x2: cx + d, y2: cy + d, class: "fretboard-mute" }, svg);
	svgEl("line", { x1: cx - d, y1: cy + d, x2: cx + d, y2: cy - d, class: "fretboard-mute" }, svg);
}
