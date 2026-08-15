import obsidianmd from "eslint-plugin-obsidianmd";
import { globalIgnores, defineConfig } from "eslint/config";

export default defineConfig(
	globalIgnores([
		"node_modules",
		"main.js",
		"data.json",
		"versions.json",
		"manifest.json",
		"package.json",
		"package-lock.json",
		"tsconfig.json",
		"esbuild.config.mjs",
		"vitest.config.ts",
		// A separate, unrelated VSCode-extension project lives alongside the Obsidian
		// plugin in this repo (its own package.json/tsconfig/@types-vscode, published
		// independently to the VSCode Marketplace) — it isn't part of the shipped
		// Obsidian plugin, so Obsidian-specific rules (e.g. guarding node:fs for
		// mobile) don't apply to it.
		"vscode-extension",
	]),
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.js"],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	...obsidianmd.configs.recommended
);
