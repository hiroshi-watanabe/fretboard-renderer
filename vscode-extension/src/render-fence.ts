import { parseFretboardBlock } from "../../src/parser/parse";
import { FretboardParseError } from "../../src/parser/errors";
import { resolveFretboardModel } from "../../src/model/fretboard-model";
import { buildFretboardSvg } from "../../src/render/render-fretboard";
import { toSvgString } from "../../src/render/svg-builder";
import type { FretboardPluginSettings } from "../../src/types";

/**
 * Renders a ```fretboard fence's raw YAML source to an HTML string — the VSCode
 * equivalent of Obsidian's `registerMarkdownCodeBlockProcessor` callback in `main.ts`,
 * built from the exact same shared parse -> resolve -> build pipeline. The only
 * platform-specific step is the very last one: Obsidian mutates a live container via
 * `toDom`, this returns a string via `toSvgString` for markdown-it to embed directly.
 */
export function renderFretboardFence(source: string, settings: FretboardPluginSettings): string {
	try {
		const parsed = parseFretboardBlock(source);
		if (parsed.kind === "single") {
			const model = resolveFretboardModel(parsed.config, settings);
			return `<div class="fretboard-block">${toSvgString(buildFretboardSvg(model))}</div>`;
		}
		// Mirrors renderFretboardRow in render-fretboard.ts: several diagrams side by side
		// inside one flex row, laid out entirely by this extension's own CSS rather than
		// relying on the Markdown preview's block wrapping.
		const svgs = parsed.diagrams
			.map((config) => toSvgString(buildFretboardSvg(resolveFretboardModel(config, settings))))
			.join("");
		return `<div class="fretboard-block"><div class="fretboard-row">${svgs}</div></div>`;
	} catch (e) {
		const message = e instanceof FretboardParseError ? e.message : String(e);
		return `<pre class="fretboard-error"><strong>Fretboard error: </strong><span>${escapeHtml(message)}</span></pre>`;
	}
}

function escapeHtml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
