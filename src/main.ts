import { Notice, Plugin, TAbstractFile } from "obsidian";
import type { FretboardPluginSettings } from "./types";
import { DEFAULT_SETTINGS } from "./settings/settings";
import { FretboardSettingTab } from "./settings/settings-tab";
import { GLOBAL_CONFIG_PATH, parseVaultConfig } from "./settings/vault-config";
import { parseFretboardBlock } from "./parser/parse";
import { FretboardParseError } from "./parser/errors";
import { resolveFretboardModel } from "./model/fretboard-model";
import { renderFretboard, renderFretboardRow } from "./render/render-fretboard";
import { FretboardEditorSuggest } from "./completion/obsidian-suggest";

export default class FretboardRendererPlugin extends Plugin {
	/** System layer: plugin-wide defaults from the Settings UI. */
	settings: FretboardPluginSettings = DEFAULT_SETTINGS;
	/** Global layer: vault-wide overrides from GLOBAL_CONFIG_PATH, if present. */
	private globalConfig: Partial<FretboardPluginSettings> = {};

	async onload(): Promise<void> {
		await this.loadSettings();
		await this.loadGlobalConfig();
		this.addSettingTab(new FretboardSettingTab(this.app, this));
		this.registerEditorSuggest(new FretboardEditorSuggest(this.app));

		const watchGlobalConfig = (file: TAbstractFile) => {
			if (file.path === GLOBAL_CONFIG_PATH) void this.loadGlobalConfig();
		};
		this.registerEvent(this.app.vault.on("modify", watchGlobalConfig));
		this.registerEvent(this.app.vault.on("create", watchGlobalConfig));
		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file.path === GLOBAL_CONFIG_PATH) this.globalConfig = {};
			})
		);

		this.registerMarkdownCodeBlockProcessor("fretboard", (source, el) => {
			// display:inline-block (see styles.css) so consecutive blocks can sit side by side.
			el.addClass("fretboard-block");
			try {
				const parsed = parseFretboardBlock(source);
				// Local (block YAML) > Global (vault file) > System (plugin settings).
				const effectiveSettings: FretboardPluginSettings = { ...this.settings, ...this.globalConfig };
				if (parsed.kind === "single") {
					renderFretboard(el, resolveFretboardModel(parsed.config, effectiveSettings));
				} else {
					const models = parsed.diagrams.map((config) => resolveFretboardModel(config, effectiveSettings));
					renderFretboardRow(el, models);
				}
			} catch (e) {
				renderError(el, e);
			}
		});
	}

	async loadSettings(): Promise<void> {
		const saved = (await this.loadData()) as Partial<FretboardPluginSettings> | null | undefined;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async loadGlobalConfig(): Promise<void> {
		try {
			const exists = await this.app.vault.adapter.exists(GLOBAL_CONFIG_PATH);
			if (!exists) {
				this.globalConfig = {};
				return;
			}
			const source = await this.app.vault.adapter.read(GLOBAL_CONFIG_PATH);
			this.globalConfig = parseVaultConfig(source);
		} catch (e) {
			this.globalConfig = {};
			new Notice(`Fretboard Renderer: failed to load ${GLOBAL_CONFIG_PATH} — ${(e as Error).message}`);
		}
	}
}

function renderError(el: HTMLElement, error: unknown): void {
	el.empty();
	const message = error instanceof FretboardParseError ? error.message : String(error);
	const pre = el.createEl("pre", { cls: "fretboard-error" });
	pre.createEl("strong", { text: "Fretboard error: " });
	pre.createSpan({ text: message });
}
