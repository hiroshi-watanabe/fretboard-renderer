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

	it("parses defaultShape: none", () => {
		expect(parseVaultConfig("defaultShape: none")).toEqual({ defaultShape: "none" });
	});

	it("parses omitNotation: true", () => {
		expect(parseVaultConfig("omitNotation: true")).toEqual({ omitNotation: true });
	});

	it("parses an explicit omitNotation: false (must not be dropped)", () => {
		expect(parseVaultConfig("omitNotation: false")).toEqual({ omitNotation: false });
	});

	it("rejects a non-boolean omitNotation", () => {
		expect(() => parseVaultConfig("omitNotation: yes")).toThrow();
	});

	it("parses showInversions: true", () => {
		expect(parseVaultConfig("showInversions: true")).toEqual({ showInversions: true });
	});

	it("rejects a non-boolean showInversions", () => {
		expect(() => parseVaultConfig("showInversions: yes")).toThrow();
	});
});
