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
	});
});
