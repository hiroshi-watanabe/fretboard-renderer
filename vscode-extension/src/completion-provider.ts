import * as vscode from "vscode";
import { getFretboardCompletions } from "../../src/completion/context";

/**
 * Context-aware key/value autocomplete inside ```fretboard code blocks, sharing the
 * same offset-based resolver as the Obsidian plugin's EditorSuggest (see
 * src/completion/context.ts and src/completion/obsidian-suggest.ts).
 */
export class FretboardCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.CompletionItem[] | undefined {
		const offset = document.offsetAt(position);
		const result = getFretboardCompletions(document.getText(), offset);
		if (!result) return undefined;

		let start = document.positionAt(result.replaceStart);
		const end = document.positionAt(result.replaceEnd);
		// CompletionItem.range must be single-line; degrade to the start of the end line in
		// the (unsupported-in-v1) case of a flow mapping split across lines.
		if (start.line !== end.line) start = new vscode.Position(end.line, 0);
		const range = new vscode.Range(start, end);

		return result.items.map((item) => {
			const completion = new vscode.CompletionItem(
				item.value,
				item.isKey ? vscode.CompletionItemKind.Property : vscode.CompletionItemKind.Value
			);
			completion.insertText = item.isKey ? `${item.value}: ` : item.value;
			completion.range = range;
			if (item.detail) completion.detail = item.detail;
			// Inserting "key: " via a completion doesn't count as the user having typed
			// ":" themselves, so VSCode's own trigger-character matching won't fire —
			// force a fresh suggest request so value candidates appear right away.
			if (item.isKey) completion.command = { command: "editor.action.triggerSuggest", title: "" };
			return completion;
		});
	}
}
