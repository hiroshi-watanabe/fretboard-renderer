import { App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from "obsidian";
import { getFretboardCompletions, type CompletionCandidate } from "./context";

/**
 * Context-aware key/value autocomplete inside ```fretboard code blocks. `onTrigger` and
 * `getSuggestions` both need the same resolved completion result, so it's computed once
 * in `onTrigger` and cached here rather than recomputed — the standard `EditorSuggest`
 * pattern, and worth it since `onTrigger` runs on every keystroke (see the perf note on
 * the abstract method itself in obsidian.d.ts).
 */
export class FretboardEditorSuggest extends EditorSuggest<CompletionCandidate> {
	private cachedItems: CompletionCandidate[] = [];

	constructor(app: App) {
		super(app);
	}

	onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
		const offset = editor.posToOffset(cursor);
		const result = getFretboardCompletions(editor.getValue(), offset);
		if (!result) return null;

		this.cachedItems = result.items;
		return {
			start: editor.offsetToPos(result.replaceStart),
			end: editor.offsetToPos(result.replaceEnd),
			query: editor.getRange(editor.offsetToPos(result.replaceStart), editor.offsetToPos(result.replaceEnd)),
		};
	}

	getSuggestions(_context: EditorSuggestContext): CompletionCandidate[] {
		return this.cachedItems;
	}

	renderSuggestion(item: CompletionCandidate, el: HTMLElement): void {
		el.addClass("fretboard-suggest-item");
		el.createSpan({ text: item.value, cls: "fretboard-suggest-value" });
		if (item.detail) el.createEl("small", { text: item.detail, cls: "fretboard-suggest-detail" });
	}

	selectSuggestion(item: CompletionCandidate, _evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) return;
		const { editor, start, end } = this.context;
		editor.replaceRange(item.isKey ? `${item.value}: ` : item.value, start, end);
		const inserted = item.isKey ? `${item.value}: ` : item.value;
		editor.setCursor(editor.offsetToPos(editor.posToOffset(start) + inserted.length));
	}
}
