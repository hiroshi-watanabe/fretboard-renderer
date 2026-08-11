import { FretboardParseError } from "./errors";

export interface NumericRange {
	start: number;
	end: number;
}

/** Parses "5-8" or "5" into a normalized {start,end} range with start <= end. */
export function parseRange(raw: string, fieldName: string): NumericRange {
	const trimmed = raw.trim();
	const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(trimmed);
	if (rangeMatch) {
		const a = parseInt(rangeMatch[1], 10);
		const b = parseInt(rangeMatch[2], 10);
		return { start: Math.min(a, b), end: Math.max(a, b) };
	}
	const singleMatch = /^(\d+)$/.exec(trimmed);
	if (singleMatch) {
		const n = parseInt(singleMatch[1], 10);
		return { start: n, end: n };
	}
	throw new FretboardParseError(`Invalid range for "${fieldName}": "${raw}"`);
}
