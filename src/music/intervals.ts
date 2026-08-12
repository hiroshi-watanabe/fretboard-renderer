import type { ChordSymbolStyle } from "../types";

// Degree labels indexed by semitone distance from the root (0-11).
export const DEGREE_LABELS = [
	"1",
	"b2",
	"2",
	"m3",
	"3",
	"4",
	"b5",
	"5",
	"m6",
	"6",
	"m7",
	"M7",
] as const;

// Roman-numeral degree labels, indexed the same way as DEGREE_LABELS. Used for a slash
// chord's bass note in relative/movable mode, where no absolute pitch is known — only
// the interval from the root — e.g. "□m7/bVII".
const ROMAN_DEGREE_LABELS = [
	"I",
	"bII",
	"II",
	"bIII",
	"III",
	"IV",
	"bV",
	"V",
	"bVI",
	"VI",
	"bVII",
	"VII",
] as const;

export function degreeForDelta(delta: number): string {
	return DEGREE_LABELS[((delta % 12) + 12) % 12];
}

export function romanForDelta(delta: number): string {
	return ROMAN_DEGREE_LABELS[((delta % 12) + 12) % 12];
}

/** Semitone distance of `pitchClass` above `rootPitchClass`, in [0, 11]. */
export function intervalDelta(rootPitchClass: number, pitchClass: number): number {
	return ((pitchClass - rootPitchClass) % 12 + 12) % 12;
}

/**
 * `inferChordSuffix` embeds these invisible marker characters around spans of its
 * output that the SVG renderer must treat specially — never shown to the user, always
 * stripped before the title is used as plain text (tests, accessibility, etc.) via
 * `stripTitleMarkers`. This exists because a title's typography can't be inferred from
 * its characters alone: the same digit means different things in different places (the
 * "9" in "C9" is the whole chord's defining digit; the "9" in "maj7(9)" is an added
 * tension) — only the code that built the string knows which is which.
 *
 * - RAISED wraps "added" content — a tension/alteration attached to an existing 7th
 *   quality (parenthesized for Standard/Berklee, bare for Jazz) — always superscript.
 * - NORMAL forces a span to stay full-size on the normal baseline regardless of what
 *   characters it contains — used for a slash chord's bass (e.g. "/E", "/bVII"), which
 *   is a distinct note/degree name, not a modifier on the chord quality.
 * - Anything outside both kinds of markers is the chord's own base quality text; the
 *   renderer classifies it by character (see `render-fretboard.ts`).
 */
export const TITLE_RAISED_START = "";
export const TITLE_RAISED_END = "";
export const TITLE_NORMAL_START = "";
export const TITLE_NORMAL_END = "";

/** Strips the invisible typography markers, leaving the plain, human-readable title. */
export function stripTitleMarkers(text: string): string {
	return text.replace(/[-]/g, "");
}

function raise(text: string): string {
	return `${TITLE_RAISED_START}${text}${TITLE_RAISED_END}`;
}

interface StyleTokens {
	/** Minor quality marker, e.g. "m" / "-" / "-". */
	minor: string;
	/** Major-7th base, kept intact even when tensions are added, e.g. "maj7" / "maj7" / "Δ7". */
	majorSeventh: string;
	/** Exact fully-diminished 7th (m3 + b5 + bb7), e.g. "dim7" / "dim7" / "°7". */
	diminishedSeventh: string;
	/** Augmented triad (major 3rd + #5, no 7th), e.g. "aug" / "+" / "+". */
	augmented: string;
}

const STYLE_TOKENS: Record<ChordSymbolStyle, StyleTokens> = {
	standard: { minor: "m", majorSeventh: "maj7", diminishedSeventh: "dim7", augmented: "aug" },
	berklee: { minor: "-", majorSeventh: "maj7", diminishedSeventh: "dim7", augmented: "+" },
	jazz: { minor: "-", majorSeventh: "Δ7", diminishedSeventh: "°7", augmented: "+" },
};

/**
 * Highest available tension among a 9th/11th/13th (2nd/4th/6th degrees), or undefined
 * if none of them are present. Convention: naming a chord by its highest extension
 * (e.g. "13") implies the ones below it, so only one number is ever shown.
 */
function topTension(has2: boolean, has4: boolean, has6: boolean): "9" | "11" | "13" | undefined {
	if (has6) return "13";
	if (has4) return "11";
	if (has2) return "9";
	return undefined;
}

/**
 * Appends tension/altered extras (a 9th/11th/13th, or a b5) to a base quality that
 * already includes its own 7th (e.g. "m7", "maj7", "Δ7") — the base's own 7 is never
 * replaced by the tension digit. Standard/Berklee wrap extras in one comma-separated
 * parenthesized group (e.g. "m7(9)", "7(9, b5)"); Jazz never uses parentheses, so
 * extras are concatenated directly onto the base (e.g. "Δ79"). Either way, the extras
 * are marked RAISED — the base itself is left for the renderer's normal character rules.
 */
function appendExtras(base: string, extras: string[], style: ChordSymbolStyle): string {
	if (extras.length === 0) return base;
	if (style === "jazz") return base + raise(extras.join(""));
	return base + raise(`(${extras.join(", ")})`);
}

/**
 * Infers a chord quality suffix (e.g. "maj7", "m7(9)", "sus4", "dim7") from the set of
 * degree labels present in a voicing. This is a practical heuristic, not a full
 * harmonic analyzer: degrees beyond an octave (9th/11th/13th) are indistinguishable
 * from 2nd/4th/6th since fretboard positions are analyzed within one octave, and only
 * a flatted 5th is supported as an "altered" tension (a #9/b13 etc. would be enharmonic
 * with degrees this system already uses for something else).
 *
 * `style` picks the notation convention for quality markers and how tensions attach —
 * see `ChordSymbolStyle`. `bassName`, when given, is appended as a slash-chord bass
 * (e.g. "/E" in absolute mode, or a Roman-numeral degree like "/bVII" in relative mode,
 * where no absolute pitch is known); the caller decides when a bass is meaningful (only
 * when it differs from the root).
 *
 * The returned string embeds invisible typography markers (see `TITLE_RAISED_START` et
 * al.) — pass it through `stripTitleMarkers` before treating it as plain text.
 */
export function inferChordSuffix(
	presentDegrees: ReadonlySet<string>,
	style: ChordSymbolStyle = "standard",
	bassName?: string
): string {
	const tokens = STYLE_TOKENS[style];

	const hasMinor3 = presentDegrees.has("m3");
	const hasMajor3 = presentDegrees.has("3");
	const hasFlat5 = presentDegrees.has("b5") && !presentDegrees.has("5");
	// "#5" is enharmonic with our "m6" degree label (8 semitones) — the only way this
	// one-octave degree system can represent it, distinct from a 6th chord's "6" (9 semitones).
	const hasSharp5 = !hasFlat5 && !presentDegrees.has("5") && presentDegrees.has("m6") && !presentDegrees.has("6");
	// When a plain 5th is also present, "m6" can't be the augmented reading above (that
	// requires the 5th to be absent) — it's an altered 13th instead, and must be shown,
	// not silently dropped just because it falls outside the augmented-triad check.
	const hasFlatThirteen = presentDegrees.has("m6") && presentDegrees.has("5");
	const hasMinor7 = presentDegrees.has("m7");
	const hasMajor7 = presentDegrees.has("M7");
	const has7th = hasMinor7 || hasMajor7;
	const has6 = presentDegrees.has("6");
	const has2 = presentDegrees.has("2");
	const has4 = presentDegrees.has("4");
	// A diminished 7th's "bb7" is also enharmonic with our "6" degree.
	const hasDiminished7 = has6;
	const tension = has7th ? topTension(has2, has4, has6) : undefined;

	let suffix: string;

	if (hasMinor3 && hasFlat5 && !has7th && hasDiminished7) {
		suffix = tokens.diminishedSeventh;
	} else if (hasMinor3 && hasFlat5 && !has7th) {
		suffix = "dim";
	} else if (hasMinor3 && hasFlat5 && hasMinor7 && style === "jazz" && !tension) {
		// Jazz's half-diminished symbol replaces "m7" + "(b5)" outright; Standard/Berklee
		// instead fall through to the generic minor-7th branch below, where the b5
		// naturally becomes part of the parenthesized extras (e.g. "m7(b5)").
		suffix = "ø7";
	} else if (hasMinor3) {
		const extras: string[] = [];
		if (tension) extras.push(tension);
		if (hasFlatThirteen) extras.push("b13");
		if (hasFlat5) extras.push("b5");

		if (hasMajor7) {
			const base = style === "jazz" ? `${tokens.minor}${tokens.majorSeventh}` : `${tokens.minor}(${tokens.majorSeventh})`;
			suffix = appendExtras(base, extras, style);
		} else if (hasMinor7) {
			suffix = appendExtras(`${tokens.minor}7`, extras, style);
		} else if (has6) {
			suffix = `${tokens.minor}6${hasFlatThirteen ? raise("b13") : ""}${hasFlat5 ? raise("b5") : ""}`;
		} else {
			suffix = tokens.minor;
			if (has2) suffix += "add9";
			if (has4) suffix += "add11";
			if (hasFlatThirteen) suffix += raise("b13");
			if (hasFlat5) suffix += raise("b5");
		}
	} else if (hasMajor3) {
		const extras: string[] = [];
		if (tension) extras.push(tension);
		if (hasFlatThirteen) extras.push("b13");
		if (hasFlat5) extras.push("b5");

		if (hasSharp5 && !has7th) {
			suffix = tokens.augmented;
		} else if (hasMajor7) {
			suffix = appendExtras(tokens.majorSeventh, extras, style);
		} else if (hasMinor7) {
			// Dominant (major 3rd + m7): a plain tension digit is a complete, self-
			// sufficient chord symbol on its own (e.g. "C9" needs no quality marker or
			// parens to read as dominant 9th) — unlike the m7/maj7 branches above, where
			// the tension needs to stay visually distinct from the quality marker. But
			// that shorthand only works when the 9th is actually present (a "C11" implies
			// the 9th is available too); an 11th or 13th present without the 9th can't be
			// folded into the base digit, so it's parenthesized onto "7" instead, same as
			// the m7/maj7 branches (e.g. "C7(11)", "C7(13)").
			if (has2) {
				const base = has6 ? "13" : has4 ? "11" : "9";
				const extras3: string[] = [];
				if (hasFlatThirteen && !has6) extras3.push("b13");
				if (hasFlat5) extras3.push("b5");
				suffix = appendExtras(base, extras3, style);
			} else {
				const extras2: string[] = [];
				if (has4) extras2.push("11");
				if (has6) extras2.push("13");
				if (hasFlatThirteen && !has6) extras2.push("b13");
				if (hasFlat5) extras2.push("b5");
				suffix = appendExtras("7", extras2, style);
			}
		} else if (has6) {
			suffix = `${has2 ? "6/9" : "6"}${hasFlatThirteen ? raise("b13") : ""}${hasFlat5 ? raise("b5") : ""}`;
		} else {
			suffix = "";
			if (has2) suffix += "add9";
			if (has4) suffix += "add11";
			if (hasFlatThirteen) suffix += raise("b13");
			if (hasFlat5) suffix += raise("b5");
		}
	} else {
		const base = has4 ? "sus4" : has2 ? "sus2" : "5";
		const extras: string[] = [];
		if (hasFlatThirteen) extras.push("b13");
		if (hasFlat5) extras.push("b5");
		suffix = appendExtras(base, extras, style);
	}

	if (bassName) suffix += `${TITLE_NORMAL_START}/${bassName}${TITLE_NORMAL_END}`;

	return suffix;
}
