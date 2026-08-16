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
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	...obsidianmd.configs.recommended
);
