import {
	toDom,
	buildFretboardSvg,
	buildProgressionHeaderSvg,
	chunkColumnsToLines,
	normalizeLineWidths,
	type ResolvedModel,
	type ResolvedSheet,
} from "fretboard-renderer-core";

/** Fallback max width (px) for wrapping a chord progression sheet into multiple lines
 *  (CLAUDE.md §3.4) when the container isn't laid out yet and reports 0 — happens the
 *  first time a note renders, before Obsidian has given the pane its real width. Roughly a
 *  typical note pane's content width. */
const FALLBACK_SHEET_MAX_WIDTH = 700;

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

/**
 * Renders a chord progression sheet (CLAUDE.md §3.4, experimental): a shared progression
 * header line above one or more rows of fretboard diagrams. Obsidian-only, same reasoning
 * as `renderFretboard`/`renderFretboardRow` above — `fretboard-renderer-core` only
 * resolves the data (`ResolvedSheet`) and builds each individual diagram's SVG; the actual
 * column-aligned grid is DOM the plugin fully controls, so it doesn't depend on how
 * Obsidian happens to lay out a code block's container.
 */
export function renderFretboardSheet(container: HTMLElement, sheet: ResolvedSheet): void {
	container.empty();
	const wrap = container.createDiv({ cls: "fretboard-sheet" });

	// Build every diagram's SVG once up front so its rendered `width` attribute (set by
	// `buildFretboardSvg` via `createSvgRoot`) can drive column sizing below, without
	// building each one twice.
	const rowSvgs: SVGElement[][][] = sheet.rows.map((row) =>
		row.cells.map((cell) => cell.map((model) => toDom(buildFretboardSvg(model))))
	);
	// Each column's width is the widest cell (diagrams side by side, summed) that appears
	// in that column across every row — so the shared header and every row stay aligned
	// even when different rows use different-sized diagrams (e.g. more frets, or a bigger
	// `size`).
	const columnWidths = sheet.slots.map((_, i) =>
		Math.max(
			0,
			...rowSvgs.map((row) => row[i].reduce((sum, svg) => sum + (Number(svg.getAttribute("width")) || 0), 0))
		)
	);

	// A long progression can't fit one line — chunk it the same way `diagrams` (§3.3) wraps,
	// except here the header and every row must break at the *same* points, which plain CSS
	// flex-wrap can't guarantee across several independently-wrapping rows. So this computes
	// the break points once (`chunkColumnsToLines`) and renders each line's header + rows as
	// its own self-contained block instead, stacked vertically.
	const maxWidth = container.clientWidth > 0 ? container.clientWidth : FALLBACK_SHEET_MAX_WIDTH;
	const lines = chunkColumnsToLines(columnWidths, maxWidth);
	// A short trailing line (very commonly the last one) would otherwise end with a
	// visibly shorter rule than the lines above it — stretch every line's columns to match
	// the widest line's natural width instead, so every rule reads as the same length.
	const normalizedLineWidths = normalizeLineWidths(lines, columnWidths);

	lines.forEach((lineSlotIndices, lineIndex) => {
		const lineDiv = wrap.createDiv({ cls: "fretboard-sheet-line" });
		const lineSlots = lineSlotIndices.map((i) => sheet.slots[i]);
		const lineWidths = normalizedLineWidths[lineIndex];
		lineDiv.appendChild(
			toDom(buildProgressionHeaderSvg(lineSlots, lineWidths, { isFinalLine: lineIndex === lines.length - 1 }))
		);

		sheet.rows.forEach((row, ri) => {
			const rowDiv = lineDiv.createDiv({ cls: "fretboard-sheet-row" });
			lineSlotIndices.forEach((ci, colInLine) => {
				const cellDiv = rowDiv.createDiv({ cls: "fretboard-sheet-cell" });
				cellDiv.style.width = `${lineWidths[colInLine]}px`;
				for (const svg of rowSvgs[ri][ci]) cellDiv.appendChild(svg);
			});
		});
	});
}
