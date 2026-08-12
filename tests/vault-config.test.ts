import { describe, expect, it } from "vitest";
import { parseVaultConfig } from "../src/settings/vault-config";

describe("parseVaultConfig", () => {
	it("returns an empty override for an empty file", () => {
		expect(parseVaultConfig("")).toEqual({});
	});

	it("parses known keys into a partial settings override", () => {
		const result = parseVaultConfig(`
orientation: vertical
fretCount: 5
labelMode: note
`);
		expect(result).toEqual({ orientation: "vertical", fretCount: 5, labelMode: "note" });
	});

	it("rejects an unknown key (e.g. a typo)", () => {
		expect(() => parseVaultConfig("notAThing: 42")).toThrow();
	});

	it("rejects an invalid enum value", () => {
		expect(() => parseVaultConfig("orientation: sideways")).toThrow();
	});

	it("rejects a non-mapping document", () => {
		expect(() => parseVaultConfig("- 1\n- 2")).toThrow();
	});

	it("parses noteSize and labelFontSize", () => {
		expect(parseVaultConfig("noteSize: 14\nlabelFontSize: 12")).toEqual({
			noteSize: 14,
			labelFontSize: 12,
		});
	});

	it("parses namingMode", () => {
		expect(parseVaultConfig("namingMode: scale")).toEqual({ namingMode: "scale" });
	});

	it("rejects an invalid namingMode", () => {
		expect(() => parseVaultConfig("namingMode: melody")).toThrow();
	});

	it("parses chordSymbolStyle", () => {
		expect(parseVaultConfig("chordSymbolStyle: jazz")).toEqual({ chordSymbolStyle: "jazz" });
	});

	it("rejects an invalid chordSymbolStyle", () => {
		expect(() => parseVaultConfig("chordSymbolStyle: pop")).toThrow();
	});
});
