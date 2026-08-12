import * as vscode from "vscode";
import { renderFretboardFence } from "./render-fence";
import { loadEffectiveSettings } from "./settings";

// markdown-it has no first-party TS types bundled, and pulling in `@types/markdown-it`
// just for these loosely-shaped callback params isn't worth it for this MVP — `any` here
// is scoped tightly to the markdown-it plugin boundary, nothing else in this extension is
// untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fretboardMarkdownItPlugin(md: any): void {
	const defaultFenceRule = md.renderer.rules.fence?.bind(md.renderer.rules);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	md.renderer.rules.fence = (tokens: any[], idx: number, options: any, env: any, self: any) => {
		const token = tokens[idx];
		if (token.info.trim() !== "fretboard") {
			return defaultFenceRule
				? defaultFenceRule(tokens, idx, options, env, self)
				: self.renderToken(tokens, idx, options);
		}
		return renderFretboardFence(token.content, loadEffectiveSettings());
	};
}

export function activate(_context: vscode.ExtensionContext) {
	return {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		extendMarkdownIt(md: any) {
			return md.use(fretboardMarkdownItPlugin);
		},
	};
}
