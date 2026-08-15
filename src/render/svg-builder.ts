// A minimal virtual SVG-node representation, so the rendering logic in render-fretboard.ts
// never touches `document` directly and can run anywhere — inside Obsidian/a browser (real
// DOM via `toDom`) or inside a plain Node.js process, e.g. a VSCode extension's markdown-it
// integration, which has no `document` at all (SVG string via `toSvgString`). Deliberately
// tiny: it only implements the slice of the DOM API render-fretboard.ts actually uses
// (`appendChild`, a settable `.textContent`, and attribute storage) — this is not a general
// virtual DOM, just enough structure to build up an SVG tree and serialize it one way or
// the other at the end.

const SVG_NS = "http://www.w3.org/2000/svg";

type VChild = VNode | string;

export class VNode {
	readonly children: VChild[] = [];

	constructor(
		readonly tag: string,
		readonly attrs: Record<string, string | number> = {}
	) {}

	appendChild(child: VNode): void {
		this.children.push(child);
	}

	/** Appends a text run without disturbing existing children — used where a single
	 *  element mixes plain text and `tspan` children in a specific order (see
	 *  `renderTitleText` in render-fretboard.ts). Setting `.textContent` instead replaces
	 *  all children, matching real DOM semantics. */
	appendText(text: string): void {
		this.children.push(text);
	}

	set textContent(value: string) {
		this.children.length = 0;
		if (value) this.children.push(value);
	}

	get textContent(): string {
		return this.children.filter((c): c is string => typeof c === "string").join("");
	}
}

export function createSvgRoot(width: number, height: number): VNode {
	return svgEl("svg", {
		width,
		height,
		viewBox: `0 0 ${width} ${height}`,
		class: "fretboard-svg",
	});
}

export function svgEl<K extends keyof SVGElementTagNameMap>(
	tag: K,
	attrs: Record<string, string | number> = {},
	parent?: VNode
): VNode {
	const node = new VNode(tag, attrs);
	if (parent) parent.appendChild(node);
	return node;
}

/** Serializes to a real, live SVG element (Obsidian/browser — needs a `document`). */
export function toDom(node: VNode): SVGElement {
	const el = document.createElementNS(SVG_NS, node.tag);
	for (const [key, value] of Object.entries(node.attrs)) {
		el.setAttribute(key, String(value));
	}
	for (const child of node.children) {
		el.appendChild(typeof child === "string" ? document.createTextNode(child) : toDom(child));
	}
	return el;
}

/** Serializes to a plain SVG XML string — no `document` required, so this works in a
 *  Node.js-only context (e.g. VSCode's markdown-it extension host). */
export function toSvgString(node: VNode): string {
	const attrStr = Object.entries(node.attrs)
		.map(([key, value]) => ` ${key}="${escapeXmlAttr(String(value))}"`)
		.join("");
	if (node.children.length === 0) {
		return `<${node.tag}${attrStr}/>`;
	}
	const inner = node.children.map((c) => (typeof c === "string" ? escapeXmlText(c) : toSvgString(c))).join("");
	return `<${node.tag}${attrStr}>${inner}</${node.tag}>`;
}

function escapeXmlText(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXmlAttr(text: string): string {
	return escapeXmlText(text).replace(/"/g, "&quot;");
}
