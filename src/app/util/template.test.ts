import { describe, expect, it } from "vitest";
import { decode, encode } from "./template";

/** Placeholder template code from home.vue DEFAULT_BUILD */
const PLACEHOLDER_TEMPLATE_CODE = "OAVTEYDfG6GYCwmsOIm0GEAoqC";

describe("template", () => {
	describe("decode", () => {
		it("decodes placeholder template code into expected build object", () => {
			const build = decode(PLACEHOLDER_TEMPLATE_CODE, false);

			expect(build.primary).toBe("Necromancer");
			expect(build.secondary).toBe("Mesmer");
			expect(build.attributes).toEqual({
				Curses: 3,
				"Illusion Magic": 12,
				"Soul Reaping": 12,
			});
			expect(build.skills).toEqual([
				"Fevered Dreams",
				"Fragility",
				'"You Move Like a Dwarf!"',
				"Enfeeble",
				'"Finish Him!"',
				"Cry of Pain",
				"No Skill",
				"Signet of Lost Souls",
			]);
		});

		it("throws for invalid template type", () => {
			// Corrupt the first character so templateType !== 14.
			const invalidCode = `A${PLACEHOLDER_TEMPLATE_CODE.slice(1)}`;

			expect(() => decode(invalidCode, false)).toThrow("Invalid template type");
		});
	});

	describe("encode/decode round-trip", () => {
		it("produces template code that decodes back to the same build (placeholder)", () => {
			const build = decode(PLACEHOLDER_TEMPLATE_CODE, false);
			const encoded = encode(build);
			const roundTripped = decode(encoded, false);

			expect(roundTripped).toEqual(build);
		});

		it("produces template code that decodes back to the same build (PvP mode)", () => {
			const build = decode(PLACEHOLDER_TEMPLATE_CODE, true);
			const encoded = encode(build);
			const roundTripped = decode(encoded, true);

			expect(roundTripped).toEqual(build);
		});

		it("throws when encoding a build with an unknown attribute", () => {
			const build: BuildTemplate = {
				primary: "Necromancer",
				secondary: "Mesmer",
				attributes: {
					"Nonexistent Attribute": 12,
				},
				skills: [],
			};

			expect(() => encode(build)).toThrow("Invalid attribute");
		});

		it("round-trips builds with large profession and skill ids", () => {
			const build: BuildTemplate = {
				primary: "Dervish",
				secondary: "Paragon",
				attributes: {
					Mysticism: 12,
					Leadership: 12,
				},
				skills: [
					"Decapitate",
					"Triple Chop",
					"Whirling Axe",
					"Defy Pain",
					"Primal Rage",
					"Illusionary Weaponry",
					"Power Block",
					"Mantra of Recovery",
				],
			};

			const encoded = encode(build);
			const decoded = decode(encoded, false);

			expect(decoded).toEqual(build);
		});
	});
});
