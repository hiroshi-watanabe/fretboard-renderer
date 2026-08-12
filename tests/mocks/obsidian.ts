import { parse } from "yaml";

// Minimal stand-in for the real Obsidian runtime, used only by unit tests so pure
// logic modules can be tested outside the Obsidian app. The real "obsidian" npm
// package ships type declarations only; Obsidian itself injects the implementation.
export function parseYaml(input: string): unknown {
	return parse(input);
}
