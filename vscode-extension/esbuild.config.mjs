import esbuild from "esbuild";
import process from "process";
import { builtinModules } from "node:module";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
	entryPoints: ["src/extension.ts"],
	bundle: true,
	external: ["vscode", ...builtinModules],
	format: "cjs",
	platform: "node",
	target: "node16",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "dist/extension.js",
	minify: prod,
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}
