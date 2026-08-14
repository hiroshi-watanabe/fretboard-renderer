import * as vscode from "vscode";
import { renderFretboardFence } from "./render-fence";
import { loadEffectiveSettings } from "./settings";
import { FretboardCompletionProvider } from "./completion-provider";

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

// VSCode ignores alphanumeric trigger characters for the on-type invocation path (confirmed
// empirically: registering a-z as trigger characters never fires the provider on a bare
// letter, with or without `editor.quickSuggestions` enabled for markdown). Only non-word
// trigger characters work automatically; anywhere else the user falls back to Ctrl+Space.
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			{ language: "markdown" },
			new FretboardCompletionProvider(),
			":",
			" "
		)
	);

	return {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		extendMarkdownIt(md: any) {
			return md.use(fretboardMarkdownItPlugin);
		},
	};
}
