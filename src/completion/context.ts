// Pure, editor-agnostic autocomplete engine for ```fretboard blocks: given the full
// document text and a cursor offset, decides whether a key or a value should be
// suggested and what the candidate list is. Kept string/offset-based (no dependency on
// Obsidian's Editor or VSCode's TextDocument) so it's directly unit-testable and shared
// verbatim by both platform adapters, the same way src/parser and src/render already are.
import { ARRAY_ENTRY_SCHEMAS, BLOCK_KEY_INFO, VALUE_ENUMS, type KeyInfo } from "./schema";

// Trailing `\r?` on the anchored patterns: `lines[i]`/the sliced line text below come from
// splitting on "\n" only, so a CRLF document leaves a trailing "\r" on every line — without
// this, a Windows-saved file's ```fretboard fence line would never match and every
// completion in that file would silently resolve to nothing.
const FENCE_OPEN = /^[ \t]*```fretboard[ \t]*\r?$/;
const FENCE_ANY = /^[ \t]*```/;
const ARRAY_KEY_LINE = /^([ \t]*)(notes|boxes|barre|diagrams):\s*\r?$/;
const TRAILING_WORD = /[A-Za-z0-9_]*$/;

export interface CompletionCandidate {
	value: string;
	detail?: string;
	isKey: boolean;
}

export interface FretboardCompletionResult {
	/** Full-document offsets of the text that should be replaced by the chosen candidate. */
	replaceStart: number;
	replaceEnd: number;
	items: CompletionCandidate[];
}

function lineStartOffsets(text: string): number[] {
	const offsets = [0];
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") offsets.push(i + 1);
	}
	return offsets;
}

/**
 * Finds the ```fretboard block containing `offset`, if any. Scans line-by-line rather
 * than parsing YAML because the content is frequently invalid mid-edit (that's the whole
 * point of autocomplete). An unclosed fence (no closing ``` yet) is treated as extending
 * to end of document, since that's the common case while a block is still being typed.
 */
export function findFretboardBlockAt(
	fullText: string,
	offset: number
): { blockText: string; blockStart: number } | null {
	const lines = fullText.split("\n");
	const starts = lineStartOffsets(fullText);

	let i = 0;
	while (i < lines.length) {
		if (!FENCE_OPEN.test(lines[i])) {
			i++;
			continue;
		}
		const contentStartLine = i + 1;
		let closeLine = lines.length;
		for (let j = contentStartLine; j < lines.length; j++) {
			if (FENCE_ANY.test(lines[j])) {
				closeLine = j;
				break;
			}
		}
		const contentStart = contentStartLine < starts.length ? starts[contentStartLine] : fullText.length;
		const contentEnd = closeLine < starts.length ? starts[closeLine] : fullText.length;
		if (offset >= contentStart && offset <= contentEnd) {
			return { blockText: fullText.slice(contentStart, contentEnd), blockStart: contentStart };
		}
		i = closeLine + 1;
	}
	return null;
}

type ResolvedContext =
	| { kind: "none" }
	| { kind: "key"; schema: readonly KeyInfo[]; typed: string; replaceStartInBlock: number }
	| { kind: "value"; options: readonly string[]; typed: string; replaceStartInBlock: number };

interface BracketFrame {
	bracket: "{" | "[";
	/** The notes/boxes/barre/diagrams key this bracket's contents belong to, if known. */
	arrayKey: string | null;
}

// Matches an identifier immediately followed by `:` (and optional trailing whitespace) at
// the end of the string — used to read off "what key is this bracket the value of", e.g.
// the "notes" in "...notes: [" right before a `[` is opened.
const KEY_BEFORE_BRACKET = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*$/;

/**
 * Walks `blockText` up to `offsetInBlock`, maintaining a stack of open `{`/`[` flow
 * brackets. Each frame carries the notes/boxes/barre/diagrams key its contents belong to,
 * inherited from an explicit `key: [`/`key: {` immediately before the bracket when present,
 * or from the enclosing frame (or the block-style scope below) otherwise — this is what
 * lets a flow-style `notes: [...]` nested inside a flow-style `diagrams` entry resolve to
 * the note schema instead of the diagram schema, at any nesting depth (e.g.
 * `diagrams: [{notes: [{s: 6, f: 2, ghost: true}]}]`).
 *
 * Outside any bracket (stack empty), falls back to indentation-based tracking of the most
 * recently opened `notes:`/`boxes:`/`barre:`/`diagrams:` block-style array, same as before.
 * YAML disallows block-style content inside a flow collection, so these two modes never
 * overlap in practice. Brackets inside quoted strings aren't special-cased — real
 * titles/labels containing a literal `{`/`[` are essentially unseen in practice, and the
 * worst case is just no suggestion rather than a wrong one.
 */
export function resolveCompletionContext(blockText: string, offsetInBlock: number): ResolvedContext {
	const stack: BracketFrame[] = [];
	let segmentStart = 0;
	let lastLineStart = 0;
	let lastArrayKey: string | null = null;
	let lastArrayIndent = -1;

	for (let idx = 0; idx < offsetInBlock; idx++) {
		const ch = blockText[idx];
		if (ch === "\n") {
			if (stack.length === 0) {
				const arrayKeyMatch = ARRAY_KEY_LINE.exec(blockText.slice(lastLineStart, idx));
				if (arrayKeyMatch) {
					lastArrayKey = arrayKeyMatch[2];
					lastArrayIndent = arrayKeyMatch[1].length;
				}
			}
			lastLineStart = idx + 1;
			if (stack.length === 0) segmentStart = lastLineStart;
			continue;
		}
		if (ch === "{" || ch === "[") {
			const before = blockText.slice(segmentStart, idx);
			const explicitKey = KEY_BEFORE_BRACKET.exec(before)?.[1] ?? null;
			let arrayKey: string | null = null;
			if (explicitKey !== null && Object.prototype.hasOwnProperty.call(ARRAY_ENTRY_SCHEMAS, explicitKey)) {
				arrayKey = explicitKey;
			} else if (stack.length > 0) {
				arrayKey = stack[stack.length - 1].arrayKey;
			} else {
				// First bracket opened from block-style scope (e.g. `- {` right under a
				// block-style `notes:`/`diagrams:` line) — inherit from that scope, the same
				// indentation rule used below for the no-bracket-at-all case.
				const lineIndent = (/^[ \t]*/.exec(blockText.slice(lastLineStart, idx)) as RegExpExecArray)[0]
					.length;
				arrayKey = lastArrayKey !== null && lineIndent > lastArrayIndent ? lastArrayKey : null;
			}
			stack.push({ bracket: ch, arrayKey });
			segmentStart = idx + 1;
			continue;
		}
		if (ch === "}" || ch === "]") {
			stack.pop();
			segmentStart = idx + 1;
			continue;
		}
		if (ch === "," && stack.length > 0) {
			segmentStart = idx + 1;
		}
	}

	// Outside any bracket, a line still counts as belonging to the last-opened block-style
	// array (e.g. `notes:`) as long as it's indented further than that array's own key
	// line. Once indentation returns to that level or less, we're back in the block's own
	// mapping.
	const currentLineIndent = (/^[ \t]*/.exec(blockText.slice(lastLineStart, offsetInBlock)) as RegExpExecArray)[0]
		.length;
	const inArrayScope = stack.length === 0 && lastArrayKey !== null && currentLineIndent > lastArrayIndent;

	let schema: readonly KeyInfo[] | undefined;
	if (stack.length > 0) {
		const top = stack[stack.length - 1];
		if (top.bracket === "{") {
			schema = top.arrayKey ? ARRAY_ENTRY_SCHEMAS[top.arrayKey] : undefined;
		} else {
			// Directly inside `[`, no `{` opened yet for this element — notes/boxes/barre
			// entries are always written in `{...}` flow style by convention, so offering
			// their keys before `{` has even been typed is more distracting than useful.
			schema = top.arrayKey === "diagrams" ? BLOCK_KEY_INFO : undefined;
		}
	} else if (inArrayScope) {
		// notes/boxes/barre entries are always written in `{...}` flow style by convention,
		// so offering their keys before `{` has even been typed is more distracting than
		// useful — wait until the user actually opens the flow mapping. `diagrams` entries,
		// by contrast, are written as plain block mappings, so their keys are still useful here.
		schema = lastArrayKey === "diagrams" ? BLOCK_KEY_INFO : undefined;
	} else {
		schema = BLOCK_KEY_INFO;
	}
	if (!schema) return { kind: "none" };

	const segment = blockText.slice(segmentStart, offsetInBlock);
	const colonIdx = segment.lastIndexOf(":");

	if (colonIdx === -1) {
		const typed = TRAILING_WORD.exec(segment)?.[0] ?? "";
		return { kind: "key", schema, typed, replaceStartInBlock: offsetInBlock - typed.length };
	}

	const key = segment
		.slice(0, colonIdx)
		.trim()
		.replace(/^-\s*/, "")
		.trim();
	const options = VALUE_ENUMS[key];
	if (!options) return { kind: "none" };

	const afterColon = segment.slice(colonIdx + 1);
	const typed = TRAILING_WORD.exec(afterColon)?.[0] ?? "";
	return { kind: "value", options, typed, replaceStartInBlock: offsetInBlock - typed.length };
}

export function getFretboardCompletions(fullText: string, offset: number): FretboardCompletionResult | null {
	const block = findFretboardBlockAt(fullText, offset);
	if (!block) return null;

	const offsetInBlock = offset - block.blockStart;
	const resolved = resolveCompletionContext(block.blockText, offsetInBlock);
	if (resolved.kind === "none") return null;

	const replaceStart = block.blockStart + resolved.replaceStartInBlock;
	if (resolved.kind === "key") {
		const items = resolved.schema
			.filter((info) => info.key.startsWith(resolved.typed))
			.map((info) => ({ value: info.key, detail: info.detail || undefined, isKey: true }));
		if (items.length === 0) return null;
		return { replaceStart, replaceEnd: offset, items };
	}

	const items = resolved.options
		.filter((value) => value.startsWith(resolved.typed))
		.map((value) => ({ value, isKey: false }));
	if (items.length === 0) return null;
	return { replaceStart, replaceEnd: offset, items };
}
