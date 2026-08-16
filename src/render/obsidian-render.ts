import { toDom, buildFretboardSvg, type ResolvedModel } from "fretboard-renderer-core";

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
