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
	]),
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.js"],
				},
				// tsconfigRootDir omitted — defaults to process.cwd(), which is already
				// the repo root for every way this runs (npm script, CI, the bot's own
				// scan). Explicitly assigning it from import.meta.dirname is what
				// triggered no-unsafe-assignment: that property only types as `string`
				// (not `any`) when @types/node's ambient ImportMeta augmentation is
				// available, which isn't guaranteed in every environment that lints
				// this file — better to just not assign it at all.
			},
		},
	},
	...obsidianmd.configs.recommended
);
