import type { ResolvedModel, ResolvedNote } from "../model/fretboard-model";
import type { Shape } from "../types";
import { TITLE_NORMAL_END, TITLE_NORMAL_START, TITLE_RAISED_END, TITLE_RAISED_START } from "../music/intervals";
import { parseRange } from "../parser/range";
import { createSvgRoot, svgEl, toDom, type VNode } from "./svg-builder";
import { Layout, stringAxisIndex } from "./layout";

/** Renders a single diagram, replacing the container's contents with its SVG. Obsidian-only
 *  entry point (uses Obsidian's `HTMLElement.empty()`) — a platform rendering straight to a
 *  string (e.g. VSCode's markdown-it integration) should call `buildFretboardSvg` + a
 *  `svg-builder.ts` serializer directly instead. */
export function renderFretboard(container: HTMLElement, model: ResolvedModel): void {
	container.empty();
	container.appendChild(toDom(buildFretboardSvg(model)));
}

/**
 * Renders several diagrams side by side inside one container. This lives entirely
 * inside `container` (which the plugin fully controls), so the layout doesn't depend
 * on how Obsidian happens to wrap separate code blocks — unlike relying on adjacent
 * ```fretboard blocks to sit next to each other via CSS, which isn't reliably
 * controllable from outside Obsidian's own rendering. Obsidian-only, same reasoning as
 * `renderFretboard` above.
 */
export function renderFretboardRow(container: HTMLElement, models: ResolvedModel[]): void {
	container.empty();
	const row = container.createDiv({ cls: "fretboard-row" });
	for (const model of models) {
		row.appendChild(toDom(buildFretboardSvg(model)));
	}
}

/** Vertical gap between stacked title lines (e.g. `scaleAnalyze`'s ranked list) — see
 *  `TITLE_FIRST_LINE_Y` below. */
const TITLE_LINE_HEIGHT = 15;
/** Baseline y of the first (or only) title line — matches the pre-multi-line layout's
 *  fixed `y: 18`. */
const TITLE_FIRST_LINE_Y = 18;

/** Builds the diagram as a platform-agnostic virtual SVG tree (see `svg-builder.ts`) — the
 *  shared core of both rendering entry points above and any other platform's own entry
 *  point (e.g. a VSCode extension calling `toSvgString` on the result directly). */
export function buildFretboardSvg(model: ResolvedModel): VNode {
	const rowsCount = model.visibleEnd - model.visibleStart + 1;
	const headerSize = model.fretSpacing * 0.6;
	// A title can be several stacked lines (`scaleAnalyze`'s ranked list, one candidate per
	// line, joined with "\n" — see `autoTitle`), so the grid has to make room for however
	// many lines there actually are, not just one.
	const titleLines = model.title ? model.title.split("\n") : [];
	const titleHeight = titleLines.length > 0 ? 26 + (titleLines.length - 1) * TITLE_LINE_HEIGHT : 6;
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

	titleLines.forEach((line, i) => {
		const t = svgEl(
			"text",
			{
				x: layout.width / 2,
				y: TITLE_FIRST_LINE_Y + i * TITLE_LINE_HEIGHT,
				class: "fretboard-title",
				"text-anchor": "middle",
			},
			svg
		);
		// A user-typed `title:` is arbitrary text, not necessarily a chord name — parsing it
		// for typography (treating a stray "b" or digit as a flat/tension) would misrender
		// ordinary words. A scale-mode title ("E Minor Pentatonic (+2)") is likewise plain
		// prose, not chord notation, even though it's auto-generated — the digits/"+"/"b" it
		// can contain aren't chord-typography roles. Only an auto-generated *chord* title
		// (always a single line) carries real markers for `renderTitleText` to interpret.
		if (model.titleIsChordTypography) {
			renderTitleText(t, model.titleMarkup);
		} else {
			t.textContent = line;
		}
	});

	drawBoxes(svg, layout, model);
	drawGrid(svg, layout, model);
	drawBarre(svg, layout, model, baselineRadius);
	drawPaths(svg, layout, model);
	for (const note of model.notes) drawNote(svg, layout, model, note, baselineRadius);

	return svg;
}

type TitleTier = "normal" | "raised" | "reduced";

/** Percentage font-size for the "reduced" tier — same baseline as normal text, just
 * smaller, since real `baseline-shift: sub` reads as visually unnatural for a single
 * digit (see `renderTitleText`'s doc comment). Chosen from the middle of the reasonable
 * 75–100% range: distinct enough from normal size to read as "quieter" without shrinking
 * a lone digit into illegibility. */
const REDUCED_TITLE_FONT_SIZE = "90%";

/**
 * Renders an auto-generated chord/scale title as professional chord-chart typography.
 * `markup` is `ResolvedModel.titleMarkup` — the plain title with invisible RAISED/NORMAL
 * spans embedded by `inferChordSuffix` (see `music/intervals.ts`) around content whose
 * typography can't be inferred from characters alone (e.g. the "9" in "C9" is the whole
 * chord's own digit, but the "9" in "maj7(9)" is an added tension — same character,
 * different role). Three tiers:
 * - **normal**: root/quality letters (`C`, `m`, `maj`, `sus`, `add`, `dim`, `Δ`, `-`),
 *   and a slash-chord bass in its entirety (`/E`, `/bVII`), forced via a NORMAL span.
 * - **raised** (superscript): a RAISED span's contents (an added tension/alteration, in
 *   parens for Standard/Berklee or bare for Jazz), plus — outside any span — the root's
 *   own accidental and the `°`/`ø`/`+` quality symbols, which are always raised.
 * - **reduced**: any digit outside a RAISED span — the chord's own defining digit(s)
 *   (bare "7"/"6" in "m7"/"dim7"/"6/9", a folded dominant tension like "C9"/"C11", a
 *   power chord's "5", or an "add9"/"add11" digit). Same baseline as normal text, just
 *   smaller — real `baseline-shift: sub` looked unnatural for a single digit in practice.
 */
function renderTitleText(textEl: VNode, markup: string): void {
	const runs: { tier: TitleTier; text: string }[] = [];
	let current: { tier: TitleTier; text: string } | undefined;
	const push = (tier: TitleTier, chunk: string): void => {
		if (current && current.tier === tier) {
			current.text += chunk;
		} else {
			if (current) runs.push(current);
			current = { tier, text: chunk };
		}
	};

	let i = 0;
	let forcedTier: "raised" | "normal" | undefined;
	while (i < markup.length) {
		const ch = markup[i];
		if (ch === TITLE_RAISED_START) {
			forcedTier = "raised";
			i += 1;
			continue;
		}
		if (ch === TITLE_NORMAL_START) {
			forcedTier = "normal";
			i += 1;
			continue;
		}
		if (ch === TITLE_RAISED_END || ch === TITLE_NORMAL_END) {
			forcedTier = undefined;
			i += 1;
			continue;
		}

		if (forcedTier) {
			push(forcedTier, ch);
			i += 1;
			continue;
		}

		// Outside any marked span: this is the chord's own base quality text.
		if (markup.startsWith("dim", i)) {
			push("normal", "dim");
			i += 3;
			continue;
		}
		if (ch >= "0" && ch <= "9") {
			push("reduced", ch);
		} else if (ch === "°" || ch === "ø" || ch === "+" || ch === "b" || ch === "#") {
			push("raised", ch);
		} else {
			push("normal", ch);
		}
		i += 1;
	}
	if (current) runs.push(current);

	for (const r of runs) {
		if (r.tier === "normal") {
			textEl.appendText(r.text);
			continue;
		}
		const attrs: Record<string, string> =
			r.tier === "raised" ? { "baseline-shift": "super", "font-size": "75%" } : { "font-size": REDUCED_TITLE_FONT_SIZE };
		const tspan = svgEl("tspan", attrs, textEl);
		tspan.textContent = r.text;
	}
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

function drawGrid(svg: VNode, layout: Layout, model: ResolvedModel): void {
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

function drawBoxes(svg: VNode, layout: Layout, model: ResolvedModel): void {
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

function drawBarre(svg: VNode, layout: Layout, model: ResolvedModel, dotRadius: number): void {
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

function drawPaths(svg: VNode, layout: Layout, model: ResolvedModel): void {
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
	svg: VNode,
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

	if (note.virtual) {
		// A reference pitch, not an actually-fretted/sounding note: no shape, no finger
		// number — just its label in parentheses, so it can't be mistaken for a played note.
		drawVirtualLabel(svg, note.label, p.x, p.y, note.labelFontSize);
		return;
	}

	const filled = note.fillStyle === "filled";
	drawShape(svg, note.shape, p.x, p.y, note.radius, filled, note.ghost, note.className, note.color);
	drawLabel(svg, note.label, p.x, p.y, filled, note.labelFontSize);
	drawFinger(svg, note.finger, p.x, p.y, note.radius);
}

function drawShape(
	svg: VNode,
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
		shape === "none" ? "is-borderless" : "",
		dashed ? "is-ghost" : "",
		className ?? "",
	]
		.filter(Boolean)
		.join(" ");
	const attrs: Record<string, string | number> = { class: cls };
	if (dashed) attrs["stroke-dasharray"] = "3,2";
	// Inline style (not a presentation attribute) so it wins over the CSS classes above.
	// `shape: "none"` always suppresses the stroke via the `is-borderless` CSS class —
	// a custom `color` only ever tints the fill for a borderless note (there's no
	// border left to tint), so its stroke half is skipped here.
	if (color) {
		if (shape === "none") {
			if (filled) attrs.style = `fill:${color};`;
		} else {
			attrs.style = filled ? `fill:${color};stroke:${color};` : `stroke:${color};`;
		}
	}

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
			// "none" also lands here — always a borderless circle, never a borderless
			// square/triangle, so it reads consistently as "just text" everywhere.
			svgEl("circle", { ...attrs, cx, cy, r }, svg);
	}
}

function drawLabel(
	svg: VNode,
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

/** A virtual note's label, parenthesized and muted-colored — never a shape/dot, so it
 * can't be mistaken for a physically fretted/sounding note (e.g. "(R)", "(5)"). */
function drawVirtualLabel(svg: VNode, label: string, cx: number, cy: number, fontSize: number): void {
	if (!label) return;
	const t = svgEl(
		"text",
		{
			x: cx,
			y: cy,
			class: "fretboard-label is-virtual",
			"text-anchor": "middle",
			"dominant-baseline": "central",
			style: `font-size:${fontSize}px;`,
		},
		svg
	);
	t.textContent = `(${label})`;
}

function drawFinger(svg: VNode, finger: number | undefined, cx: number, cy: number, r: number): void {
	if (finger === undefined) return;
	const t = svgEl(
		"text",
		{ x: cx, y: cy + r + 11, class: "fretboard-finger", "text-anchor": "middle" },
		svg
	);
	t.textContent = String(finger);
}

function drawMutedCross(svg: VNode, cx: number, cy: number, r: number): void {
	const d = r * 0.7;
	svgEl("line", { x1: cx - d, y1: cy - d, x2: cx + d, y2: cy + d, class: "fretboard-mute" }, svg);
	svgEl("line", { x1: cx - d, y1: cy + d, x2: cx + d, y2: cy - d, class: "fretboard-mute" }, svg);
}
