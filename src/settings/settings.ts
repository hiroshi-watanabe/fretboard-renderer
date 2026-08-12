import type { FretboardPluginSettings } from "../types";

export const DEFAULT_SETTINGS: FretboardPluginSettings = {
	orientation: "horizontal",
	strings: 6,
	fretCount: 4,
	stringSpacing: 30,
	fretSpacing: 50,
	labelMode: "interval",
	accidental: "sharp",
	defaultShape: "circle",
	fillStyle: "outlined",
	nutStyle: "thick",
	fretNumbering: "inlay",
	defaultTuning: "E,A,D,G,B,E",
	omittedStringBehavior: "open",
	noteSize: 10,
	labelFontSize: 10,
};
