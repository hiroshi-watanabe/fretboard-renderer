import obsidianmd from "eslint-plugin-obsidianmd";
import { globalIgnores, defineConfig } from "eslint/config";

/** @type {string} */
const tsconfigRootDir = import.meta.dirname;

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
				tsconfigRootDir,
			},
		},
	},
	...obsidianmd.configs.recommended
);
