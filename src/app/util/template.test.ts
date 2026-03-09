import { DEFAULT_BUILD } from "@/app/constants";
import { pvpSkills } from "@/app/util/skills";
import attributes from "@/data/attributes.json";
import professions from "@/data/professions.json";
import skills from "@/data/skills.json";
import { describe, expect, it } from "vitest";
import { decode, encode } from "./template";

const CHAR_MAP =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const appendBits = (bits: number[], value: number, count: number): void => {
	for (let i = 0; i < count; i++) {
		bits.push((value >>> i) & 1);
	}
};

const packBits = (bits: number[]): string => {
	let out = "";
	for (let i = 0; i < bits.length; i += 6) {
		const group = bits.slice(i, i + 6);
		while (group.length < 6) group.push(0);
		group.reverse();
		out += CHAR_MAP[parseInt(group.join(""), 2)];
	}
	return out;
};

const templateCodeToBits = (code: string): number[] => {
	const decoded = Array.from(code).map((v) => CHAR_MAP.indexOf(v));
	return decoded.flatMap((v) =>
		Array.from((v >>> 0).toString(2).padStart(6, "0"))
			.reverse()
			.map((bit) => Number(bit)),
	);
};

const withModifiedTemplateVersion = (code: string, version: number): string => {
	const bits = templateCodeToBits(code);
	for (let i = 0; i < 4; i++) {
		bits[4 + i] = (version >>> i) & 1;
	}
	return packBits(bits);
};

const withEqualProfessions = (code: string): string => {
	const bits = templateCodeToBits(code);
	const encodedProfessionBits = bits[8] + bits[9] * 2;
	const professionBits = encodedProfessionBits * 2 + 4;
	const primaryOffset = 10;
	const secondaryOffset = primaryOffset + professionBits;

	for (let i = 0; i < professionBits; i++) {
		bits[secondaryOffset + i] = bits[primaryOffset + i];
	}

	return packBits(bits);
};

const withOutOfRangePrimaryProfession = (code: string): string => {
	const bits = templateCodeToBits(code);
	const encodedProfessionBits = bits[8] + bits[9] * 2;
	const professionBits = encodedProfessionBits * 2 + 4;
	const primaryOffset = 10;

	const professionsData = professions as {
		name: string;
		primaryAttribute: string | null;
	}[];
	const invalidIndex = professionsData.length;

	for (let i = 0; i < professionBits; i++) {
		bits[primaryOffset + i] = (invalidIndex >>> i) & 1;
	}

	return packBits(bits);
};

const attributesList = attributes as Record<string, string>;
const skillsList = skills as Record<string, string>;

const makeTemplateWithInvalidAttributeId = (): string => {
	const bits: number[] = [];

	appendBits(bits, 14, 4); // templateType
	appendBits(bits, 0, 4); // templateVersion

	appendBits(bits, 0, 2); // professionBits (4)
	appendBits(bits, 0, 4); // primary profession index 0
	appendBits(bits, 1, 4); // secondary profession index 1

	const attrIds = Object.keys(attributesList).map((id) => parseInt(id, 10));
	const maxAttrId = Math.max(...attrIds);
	const invalidAttrId = maxAttrId + 1;
	const attributeBits = Math.max(4, Math.ceil(Math.log2(invalidAttrId + 1)));

	appendBits(bits, 1, 4); // attributesCount = 1
	appendBits(bits, attributeBits - 4, 4); // attributeBits
	appendBits(bits, invalidAttrId, attributeBits); // invalid attribute id
	appendBits(bits, 0, 4); // attribute score (unused because id is invalid)

	return packBits(bits);
};

const makeTemplateWithInvalidAttributeScore = (): string => {
	const bits: number[] = [];

	appendBits(bits, 14, 4); // templateType
	appendBits(bits, 0, 4); // templateVersion

	appendBits(bits, 0, 2); // professionBits (4)
	appendBits(bits, 0, 4); // primary profession index 0
	appendBits(bits, 1, 4); // secondary profession index 1

	const attrIds = Object.keys(attributesList).map((id) => parseInt(id, 10));
	const minAttrId = Math.min(...attrIds);
	const attributeBits = Math.max(4, Math.ceil(Math.log2(minAttrId + 1)));

	appendBits(bits, 1, 4); // attributesCount = 1
	appendBits(bits, attributeBits - 4, 4); // attributeBits
	appendBits(bits, minAttrId, attributeBits); // valid attribute id
	appendBits(bits, 13, 4); // invalid score (> 12)

	return packBits(bits);
};

const makeTemplateWithInvalidSkill = (): string => {
	const bits: number[] = [];

	appendBits(bits, 14, 4); // templateType
	appendBits(bits, 0, 4); // templateVersion

	appendBits(bits, 0, 2); // professionBits (4)
	appendBits(bits, 0, 4); // primary profession index 0
	appendBits(bits, 1, 4); // secondary profession index 1

	appendBits(bits, 0, 4); // attributesCount = 0
	appendBits(bits, 0, 4); // attributeBits (ignored when count is 0)

	const skillIds = Object.keys(skillsList).map((id) => parseInt(id, 10));
	const minSkillId = Math.min(...skillIds);
	const maxSkillId = Math.max(...skillIds);
	const invalidSkillId = maxSkillId + 1;
	const skillBits = Math.max(8, Math.ceil(Math.log2(invalidSkillId + 1)));

	appendBits(bits, skillBits - 8, 4); // skillBits

	for (let i = 0; i < 8; i++) {
		const id = i === 0 ? invalidSkillId : minSkillId;
		appendBits(bits, id, skillBits);
	}

	return packBits(bits);
};

describe("template", () => {
	describe("decode", () => {
		it("decodes placeholder template code into expected build object", () => {
			const build = decode(DEFAULT_BUILD, false);

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
			const invalidCode = `A${DEFAULT_BUILD.slice(1)}`;

			expect(() => decode(invalidCode, false)).toThrow("Invalid template type");
		});

		it("throws for invalid template version", () => {
			const invalidCode = withModifiedTemplateVersion(DEFAULT_BUILD, 1);

			expect(() => decode(invalidCode, false)).toThrow(
				"Invalid template version",
			);
		});

		it("throws for invalid profession when primary and secondary professions are identical", () => {
			const invalidCode = withEqualProfessions(DEFAULT_BUILD);

			expect(() => decode(invalidCode, false)).toThrow("Invalid profession");
		});

		it("throws for invalid profession when profession index is out of range", () => {
			const invalidCode = withOutOfRangePrimaryProfession(DEFAULT_BUILD);

			expect(() => decode(invalidCode, false)).toThrow("Invalid profession");
		});

		it("throws for invalid attribute id", () => {
			const invalidCode = makeTemplateWithInvalidAttributeId();

			expect(() => decode(invalidCode, false)).toThrow("Invalid attribute");
		});

		it("throws for invalid attribute score", () => {
			const invalidCode = makeTemplateWithInvalidAttributeScore();

			expect(() => decode(invalidCode, false)).toThrow("Invalid attribute");
		});

		it("throws for invalid skill id", () => {
			const invalidCode = makeTemplateWithInvalidSkill();

			expect(() => decode(invalidCode, false)).toThrow("Invalid skill");
		});
	});

	describe("encode/decode round-trip", () => {
		it("produces template code that decodes back to the same build (placeholder)", () => {
			const build = decode(DEFAULT_BUILD, false);
			const encoded = encode(build);
			const roundTripped = decode(encoded, false);

			expect(roundTripped).toEqual(build);
		});

		it("produces template code that decodes back to the same build (PvP mode)", () => {
			const build = decode(DEFAULT_BUILD, true);
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

		it("round-trips builds with no attributes", () => {
			const base = decode(DEFAULT_BUILD, false);
			const build: BuildTemplate = {
				...base,
				attributes: {},
			};

			const encoded = encode(build);
			const decoded = decode(encoded, false);

			expect(decoded).toEqual(build);
		});

		it("pads missing skills up to eight entries", () => {
			const base = decode(DEFAULT_BUILD, false);
			const build: BuildTemplate = {
				...base,
				skills: base.skills.slice(0, 3),
			};

			const encoded = encode(build);
			const decoded = decode(encoded, false);

			expect(decoded.skills).toHaveLength(8);
			expect(decoded.skills.slice(0, 3)).toEqual(build.skills);
			expect(decoded.skills.slice(3)).toEqual(Array(5).fill("No Skill"));
		});

		it("falls back to default professions when encoding unknown profession names", () => {
			const professionsData = professions as {
				name: string;
				primaryAttribute: string | null;
			}[];
			const base = decode(DEFAULT_BUILD, false);
			const build: BuildTemplate = {
				...base,
				primary: "UnknownPrimary",
				secondary: "UnknownSecondary",
			};

			const encoded = encode(build);
			const decoded = decode(encoded, false);

			expect(decoded.primary).toBe(professionsData[1].name);
			expect(decoded.secondary).toBe(professionsData[2].name);
		});

		it("encodes and decodes builds with PvP-suffixed skills", () => {
			const base = decode(DEFAULT_BUILD, false);
			const basePvpSkillName = Object.keys(pvpSkills)[0];
			const build: BuildTemplate = {
				...base,
				skills: [`${basePvpSkillName} (PvP)`, ...base.skills.slice(1)],
			};

			const encoded = encode(build);
			const decodedNonPvp = decode(encoded, false);
			const decodedPvp = decode(encoded, true);

			expect(decodedNonPvp.skills[0]).toBe(basePvpSkillName);
			expect(decodedPvp.skills[0]).toBe(`${basePvpSkillName} (PvP)`);
		});

		it("falls back to skill id 0 when encoding an unknown skill name", () => {
			const base = decode(DEFAULT_BUILD, false);
			const build: BuildTemplate = {
				...base,
				skills: ["Unknown Skill Name", ...base.skills.slice(1)],
			};

			const encoded = encode(build);
			const decoded = decode(encoded, false);

			const expectedFirstSkill = decodeURIComponent(skillsList["0"]);

			expect(decoded.skills[0]).toBe(expectedFirstSkill);
			expect(decoded.skills.slice(1)).toEqual(base.skills.slice(1));
		});
	});
});
