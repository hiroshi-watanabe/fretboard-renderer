import type { Orientation } from "../types";

export interface Point {
	x: number;
	y: number;
}

/**
 * Maps logical (stringAxisIndex, fretAxisIndex) grid coordinates to pixel space.
 * stringAxisIndex runs along the strings (0 = first visible string drawn);
 * fretAxisIndex runs along the frets (0 = the grid's left/top edge, i.e. `startFret`).
 * In horizontal orientation the fret axis is X and the string axis is Y; in vertical
 * orientation it's the reverse. Keeping this swap in one place lets the rest of the
 * renderer stay orientation-agnostic.
 */
export class Layout {
	constructor(
		private orientation: Orientation,
		private stringSpacing: number,
		private fretSpacing: number,
		public readonly rowsCount: number,
		public readonly fretsWidth: number,
		private headerSize: number,
		private titleHeight: number
	) {}

	private get gridOrigin(): Point {
		if (this.orientation === "horizontal") {
			return { x: this.headerSize, y: this.titleHeight + 8 };
		}
		return { x: this.headerSize, y: this.titleHeight + this.headerSize };
	}

	point(stringAxisIndex: number, fretAxisIndex: number): Point {
		const origin = this.gridOrigin;
		if (this.orientation === "horizontal") {
			return {
				x: origin.x + fretAxisIndex * this.fretSpacing,
				y: origin.y + stringAxisIndex * this.stringSpacing,
			};
		}
		return {
			x: origin.x + stringAxisIndex * this.stringSpacing,
			y: origin.y + fretAxisIndex * this.fretSpacing,
		};
	}

	/** Position for the open/muted-string marker lane, just outside the grid's fret axis. */
	headerPoint(stringAxisIndex: number): Point {
		return this.point(stringAxisIndex, -this.headerSize / (2 * this.fretSpacing));
	}

	get width(): number {
		if (this.orientation === "horizontal") {
			return this.gridOrigin.x + this.fretsWidth * this.fretSpacing + 28;
		}
		return this.gridOrigin.x + (this.rowsCount - 1) * this.stringSpacing + 28;
	}

	get height(): number {
		if (this.orientation === "horizontal") {
			return this.gridOrigin.y + (this.rowsCount - 1) * this.stringSpacing + 28;
		}
		return this.gridOrigin.y + this.fretsWidth * this.fretSpacing + 28;
	}
}

export function stringAxisIndex(
	s: number,
	visibleStart: number,
	visibleEnd: number,
	orientation: Orientation
): number {
	return orientation === "vertical" ? visibleEnd - s : s - visibleStart;
}
