import { App, PluginSettingTab, Setting, type SettingDefinitionGroup } from "obsidian";
import type { FretboardPluginSettings } from "../types";
import type FretboardRendererPlugin from "../main";

type SettingKey = keyof FretboardPluginSettings;

const positiveNumber = (v: number): string | undefined => (v > 0 ? undefined : "Must be a positive number.");

export class FretboardSettingTab extends PluginSettingTab {
	plugin: FretboardRendererPlugin;

	constructor(app: App, plugin: FretboardRendererPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Declarative settings API (Obsidian 1.13.0+) — makes these settings appear in
	 * the app's global settings search. `getControlValue`/`setControlValue` aren't
	 * overridden here because `PluginSettingTab`'s defaults already read/write
	 * `this.plugin.settings` for a plugin's conventional settings storage.
	 * `display()` below is kept as a fallback for Obsidian versions older than
	 * 1.13.0, which don't call this method at all.
	 */
	getSettingDefinitions(): SettingDefinitionGroup<SettingKey>[] {
		return [
			{
				type: "group",
				heading: "Layout & dimensions",
				items: [
					{
						name: "Orientation",
						desc: "Direction the fretboard is drawn in.",
						control: {
							type: "dropdown",
							key: "orientation",
							defaultValue: "horizontal",
							options: { horizontal: "Horizontal", vertical: "Vertical" },
						},
					},
					{
						name: "Strings",
						desc: "Default number of strings.",
						control: { type: "number", key: "strings", defaultValue: 6, min: 1, validate: positiveNumber },
					},
					{
						name: "Fret count",
						desc: "Default number of frets to draw when a block does not specify one.",
						control: {
							type: "number",
							key: "fretCount",
							defaultValue: 4,
							min: 1,
							validate: positiveNumber,
						},
					},
					{
						name: "String spacing (px)",
						control: {
							type: "number",
							key: "stringSpacing",
							defaultValue: 30,
							min: 1,
							validate: positiveNumber,
						},
					},
					{
						name: "Fret spacing (px)",
						control: {
							type: "number",
							key: "fretSpacing",
							defaultValue: 50,
							min: 1,
							validate: positiveNumber,
						},
					},
				],
			},
			{
				type: "group",
				heading: "Display & style",
				items: [
					{
						name: "Label mode",
						desc: "What to print inside each note dot by default.",
						control: {
							type: "dropdown",
							key: "labelMode",
							defaultValue: "interval",
							options: { interval: "Interval (degree)", note: "Note name", none: "None" },
						},
					},
					{
						name: "Accidental",
						desc: "Preferred spelling for note-name labels.",
						control: {
							type: "dropdown",
							key: "accidental",
							defaultValue: "sharp",
							options: { sharp: "Sharp (#)", flat: "Flat (b)" },
						},
					},
					{
						name: "Naming mode",
						desc: 'Auto-generated title: name a chord (e.g. "Am7") or, when the notes exactly match a known scale, name the scale instead (e.g. "A Minor Pentatonic").',
						control: {
							type: "dropdown",
							key: "namingMode",
							defaultValue: "chord",
							options: { chord: "Chord", scale: "Scale" },
						},
					},
					{
						name: "Chord symbol style",
						desc: 'Notation convention for auto-generated chord suffixes, e.g. minor: "m" / "-" / "-"; major 7th: "maj7" / "maj7" / "Δ7"; half-diminished: "m7b5" / "-7b5" / "ø7".',
						control: {
							type: "dropdown",
							key: "chordSymbolStyle",
							defaultValue: "standard",
							options: { standard: "Standard (pop)", berklee: "Berklee", jazz: "Jazz (Real Book)" },
						},
					},
					{
						name: "Default shape",
						desc: '"None" draws no outline — just the label on a borderless filled backdrop.',
						control: {
							type: "dropdown",
							key: "defaultShape",
							defaultValue: "circle",
							options: { circle: "Circle", square: "Square", triangle: "Triangle", none: "None" },
						},
					},
					{
						name: "Fill style",
						control: {
							type: "dropdown",
							key: "fillStyle",
							defaultValue: "outlined",
							options: {
								filled: "Filled (dark dot, light text)",
								outlined: "Outlined (light dot, dark text)",
							},
						},
					},
					{
						name: "Nut style",
						desc: "How the fret-0 line is drawn.",
						control: {
							type: "dropdown",
							key: "nutStyle",
							defaultValue: "thick",
							options: { thick: "Thick line", double: "Double line" },
						},
					},
					{
						name: "Fret numbering",
						desc: '"Inlay markers" shows only the standard fretboard inlay positions (3, 5, 7, 9, 12, 15, ...).',
						control: {
							type: "dropdown",
							key: "fretNumbering",
							defaultValue: "inlay",
							options: {
								all: "Show all",
								dotted: "Only fretted frets",
								inlay: "Inlay markers only",
								none: "Hide",
							},
						},
					},
				],
			},
			{
				type: "group",
				heading: "Note appearance",
				items: [
					{
						name: "Note size (px)",
						desc: "Base radius of each note dot. Per-note `sizeAdjust` (-5..5) nudges from this.",
						control: { type: "number", key: "noteSize", defaultValue: 10, min: 1, validate: positiveNumber },
					},
					{
						name: "Label font size (px)",
						desc: "Base font size for note labels. Per-note `labelSizeAdjust` (-5..5) nudges from this.",
						control: {
							type: "number",
							key: "labelFontSize",
							defaultValue: 10,
							min: 1,
							validate: positiveNumber,
						},
					},
				],
			},
			{
				type: "group",
				heading: "Tuning & fallback",
				items: [
					{
						name: "Default tuning",
						desc: "Comma separated absolute pitches, lowest string first (e.g. E,A,D,G,B,E).",
						control: { type: "text", key: "defaultTuning", defaultValue: "E,A,D,G,B,E" },
					},
					{
						name: "Omitted string behavior",
						desc: "How to render strings that are not mentioned in a block's notes.",
						control: {
							type: "dropdown",
							key: "omittedStringBehavior",
							defaultValue: "open",
							options: { open: "Treat as open (0)", muted: "Treat as muted (x)", none: "Draw nothing" },
						},
					},
				],
			},
		];
	}

	/** @deprecated Fallback for Obsidian < 1.13.0; see getSettingDefinitions(). */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const settings = this.plugin.settings;

		new Setting(containerEl).setName("Layout & dimensions").setHeading();

		new Setting(containerEl)
			.setName("Orientation")
			.setDesc("Direction the fretboard is drawn in.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("horizontal", "Horizontal")
					.addOption("vertical", "Vertical")
					.setValue(settings.orientation)
					.onChange(async (value) => {
						settings.orientation = value as typeof settings.orientation;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Strings")
			.setDesc("Default number of strings.")
			.addText((text) =>
				text
					.setValue(String(settings.strings))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (!Number.isNaN(n) && n > 0) {
							settings.strings = n;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Fret count")
			.setDesc("Default number of frets to draw when a block does not specify one.")
			.addText((text) =>
				text
					.setValue(String(settings.fretCount))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (!Number.isNaN(n) && n > 0) {
							settings.fretCount = n;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("String spacing (px)")
			.addText((text) =>
				text
					.setValue(String(settings.stringSpacing))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (!Number.isNaN(n) && n > 0) {
							settings.stringSpacing = n;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Fret spacing (px)")
			.addText((text) =>
				text
					.setValue(String(settings.fretSpacing))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (!Number.isNaN(n) && n > 0) {
							settings.fretSpacing = n;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl).setName("Display & style").setHeading();

		new Setting(containerEl)
			.setName("Label mode")
			.setDesc("What to print inside each note dot by default.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("interval", "Interval (degree)")
					.addOption("note", "Note name")
					.addOption("none", "None")
					.setValue(settings.labelMode)
					.onChange(async (value) => {
						settings.labelMode = value as typeof settings.labelMode;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Accidental")
			.setDesc("Preferred spelling for note-name labels.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("sharp", "Sharp (#)")
					.addOption("flat", "Flat (b)")
					.setValue(settings.accidental)
					.onChange(async (value) => {
						settings.accidental = value as typeof settings.accidental;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Naming mode")
			.setDesc(
				'Auto-generated title: name a chord (e.g. "Am7") or, when the notes exactly match a known scale, name the scale instead (e.g. "A Minor Pentatonic").'
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("chord", "Chord")
					.addOption("scale", "Scale")
					.setValue(settings.namingMode)
					.onChange(async (value) => {
						settings.namingMode = value as typeof settings.namingMode;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Chord symbol style")
			.setDesc(
				'Notation convention for auto-generated chord suffixes, e.g. minor: "m" / "-" / "-"; major 7th: "maj7" / "maj7" / "Δ7"; half-diminished: "m7b5" / "-7b5" / "ø7".'
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("standard", "Standard (pop)")
					.addOption("berklee", "Berklee")
					.addOption("jazz", "Jazz (Real Book)")
					.setValue(settings.chordSymbolStyle)
					.onChange(async (value) => {
						settings.chordSymbolStyle = value as typeof settings.chordSymbolStyle;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default shape")
			.setDesc('"None" draws no outline — just the label on a borderless filled backdrop.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption("circle", "Circle")
					.addOption("square", "Square")
					.addOption("triangle", "Triangle")
					.addOption("none", "None")
					.setValue(settings.defaultShape)
					.onChange(async (value) => {
						settings.defaultShape = value as typeof settings.defaultShape;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Fill style")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("filled", "Filled (dark dot, light text)")
					.addOption("outlined", "Outlined (light dot, dark text)")
					.setValue(settings.fillStyle)
					.onChange(async (value) => {
						settings.fillStyle = value as typeof settings.fillStyle;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Nut style")
			.setDesc("How the fret-0 line is drawn.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("thick", "Thick line")
					.addOption("double", "Double line")
					.setValue(settings.nutStyle)
					.onChange(async (value) => {
						settings.nutStyle = value as typeof settings.nutStyle;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Fret numbering")
			.setDesc('"Inlay markers" shows only the standard fretboard inlay positions (3, 5, 7, 9, 12, 15, ...).')
			.addDropdown((dropdown) =>
				dropdown
					.addOption("all", "Show all")
					.addOption("dotted", "Only fretted frets")
					.addOption("inlay", "Inlay markers only")
					.addOption("none", "Hide")
					.setValue(settings.fretNumbering)
					.onChange(async (value) => {
						settings.fretNumbering = value as typeof settings.fretNumbering;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Note appearance").setHeading();

		new Setting(containerEl)
			.setName("Note size (px)")
			.setDesc("Base radius of each note dot. Per-note `sizeAdjust` (-5..5) nudges from this.")
			.addText((text) =>
				text
					.setValue(String(settings.noteSize))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (!Number.isNaN(n) && n > 0) {
							settings.noteSize = n;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Label font size (px)")
			.setDesc("Base font size for note labels. Per-note `labelSizeAdjust` (-5..5) nudges from this.")
			.addText((text) =>
				text
					.setValue(String(settings.labelFontSize))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (!Number.isNaN(n) && n > 0) {
							settings.labelFontSize = n;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl).setName("Tuning & fallback").setHeading();

		new Setting(containerEl)
			.setName("Default tuning")
			.setDesc("Comma separated absolute pitches, lowest string first (e.g. E,A,D,G,B,E).")
			.addText((text) =>
				text
					.setValue(settings.defaultTuning)
					.onChange(async (value) => {
						settings.defaultTuning = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Omitted string behavior")
			.setDesc("How to render strings that are not mentioned in a block's notes.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("open", "Treat as open (0)")
					.addOption("muted", "Treat as muted (x)")
					.addOption("none", "Draw nothing")
					.setValue(settings.omittedStringBehavior)
					.onChange(async (value) => {
						settings.omittedStringBehavior = value as typeof settings.omittedStringBehavior;
						await this.plugin.saveSettings();
					})
			);
	}
}
