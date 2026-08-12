import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { DEFAULT_SETTINGS } from "../../src/settings/settings";
import { GLOBAL_CONFIG_PATH, parseVaultConfig } from "../../src/settings/vault-config";
import type { FretboardPluginSettings } from "../../src/types";

/**
 * System layer: VSCode's own Settings UI (`contributes.configuration` in package.json,
 * namespaced `fretboardRenderer.*`), one key per `FretboardPluginSettings` field. Reading
 * `inspect(key)` and falling back to `DEFAULT_SETTINGS[key]` only when the key is entirely
 * absent (rather than trusting `get`'s built-in default) keeps this in sync automatically
 * if `DEFAULT_SETTINGS` and package.json's declared defaults were ever to drift.
 */
function loadSystemSettings(): FretboardPluginSettings {
	const config = vscode.workspace.getConfiguration("fretboardRenderer");
	const key = <K extends keyof FretboardPluginSettings>(name: K): FretboardPluginSettings[K] =>
		config.get<FretboardPluginSettings[K]>(name) ?? DEFAULT_SETTINGS[name];

	return {
		orientation: key("orientation"),
		strings: key("strings"),
		fretCount: key("fretCount"),
		stringSpacing: key("stringSpacing"),
		fretSpacing: key("fretSpacing"),
		labelMode: key("labelMode"),
		accidental: key("accidental"),
		defaultShape: key("defaultShape"),
		fillStyle: key("fillStyle"),
		nutStyle: key("nutStyle"),
		fretNumbering: key("fretNumbering"),
		defaultTuning: key("defaultTuning"),
		omittedStringBehavior: key("omittedStringBehavior"),
		noteSize: key("noteSize"),
		labelFontSize: key("labelFontSize"),
		namingMode: key("namingMode"),
		chordSymbolStyle: key("chordSymbolStyle"),
		omitNotation: key("omitNotation"),
		showInversions: key("showInversions"),
	};
}

/**
 * Global layer is a `fretboard-renderer.yaml` at the first workspace folder's root,
 * reusing `parseVaultConfig` unchanged from the shared core — same override shape as
 * Obsidian's `main.ts` (`{ ...system, ...global }`). Local (per-block YAML) is handled
 * identically to Obsidian, inside `parseFretboardBlock`/`resolveFretboardModel` — nothing
 * platform-specific there at all.
 *
 * Both layers are re-read on every render rather than cached/watched — `getConfiguration`
 * always reflects live settings automatically, and the YAML file is a small synchronous
 * local read, not worth a file-watcher's complexity for this MVP.
 */
export function loadEffectiveSettings(): FretboardPluginSettings {
	const system = loadSystemSettings();

	const folders = vscode.workspace.workspaceFolders;
	if (!folders || folders.length === 0) return system;

	const globalConfigPath = path.join(folders[0].uri.fsPath, GLOBAL_CONFIG_PATH);
	if (!fs.existsSync(globalConfigPath)) return system;

	try {
		const source = fs.readFileSync(globalConfigPath, "utf8");
		return { ...system, ...parseVaultConfig(source) };
	} catch (e) {
		// Mirrors main.ts's Notice-based warning on the Obsidian side.
		void vscode.window.showWarningMessage(
			`Fretboard Renderer: failed to load ${GLOBAL_CONFIG_PATH} — ${(e as Error).message}`
		);
		return system;
	}
}
