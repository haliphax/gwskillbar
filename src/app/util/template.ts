import { pvpSkills } from "@/app/util/skills";
import attributes from "@/data/attributes.json";
import professions from "@/data/professions.json";
import skills from "@/data/skills.json";

const CHAR_MAP =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const skillsList = skills as StringMap;
const attributesList = attributes as StringMap;
const professionsData = professions as {
	name: string;
	primaryAttribute: string | null;
}[];

/** Extract bits from template code */
const extract = (bits: string[], count: number): number =>
	parseInt(bits.splice(0, count).reverse().join(""), 2);

/** Push low `count` bits of `value` LSB-first (inverse of extract) */
const appendBits = (bits: number[], value: number, count: number): void => {
	for (let i = 0; i < count; i++) {
		bits.push((value >>> i) & 1);
	}
};

/** Pack bit array into template string (6 bits per char, each group reversed) */
const pack = (bits: number[]): string => {
	let out = "";
	for (let i = 0; i < bits.length; i += 6) {
		const group = bits.slice(i, i + 6);
		while (group.length < 6) group.push(0);
		group.reverse();
		out += CHAR_MAP[parseInt(group.join(""), 2)];
	}
	return out;
};

/** Skill name (no PvP suffix) -> skill ID string. Prefer non-PvP when duplicates exist. */
const skillNameToId = ((): StringMap => {
	const map: StringMap = {};
	for (const [id, name] of Object.entries(skillsList)) {
		if (name.endsWith(" (PvP)")) continue;
		const normalized = decodeURIComponent(name);
		map[normalized] = id;
	}
	return map;
})();

/** Profession name -> array index */
const professionNameToIndex = ((): Record<string, number> => {
	const map: Record<string, number> = {};
	professionsData.forEach((p, index) => {
		map[p.name] = index;
	});
	return map;
})();

/** Attribute name -> attribute ID string */
const attributeNameToId = ((): StringMap => {
	const map: StringMap = {};
	for (const [id, name] of Object.entries(attributesList)) {
		map[name] = id;
	}
	return map;
})();

const SKILL_BITS_MIN = 8;

/** Smallest professionBits (4, 6, 8, or 10) that can represent the given index */
const professionBitsFor = (maxIndex: number): number => {
	const minBits = Math.ceil(Math.log2(Math.max(maxIndex, 1) + 1));
	return Math.min(10, 4 + 2 * Math.max(0, Math.ceil((minBits - 4) / 2)));
};

/** Parse template code into BuildTemplate object */
export const decode = (code: string, pvp: boolean): BuildTemplate => {
	const build: BuildTemplate = {
		primary: "",
		secondary: "",
		attributes: {},
		skills: [],
	};
	const decoded = Array.from(code).map((v) => CHAR_MAP.indexOf(v));
	const bits = decoded.flatMap((v) =>
		Array.from((v >>> 0).toString(2).padStart(6, "0")).reverse(),
	);
	const templateType = extract(bits, 4);

	if (templateType !== 14) {
		throw "Invalid template type";
	}

	const templateVersion = extract(bits, 4);

	if (templateVersion !== 0) {
		throw "Invalid template version";
	}

	const professionBits = extract(bits, 2) * 2 + 4;

	try {
		build.primary = professionsData[extract(bits, professionBits)].name;
		build.secondary = professionsData[extract(bits, professionBits)].name;

		if (
			build.primary == build.secondary ||
			!build.primary ||
			!build.secondary
		) {
			throw "Invalid profession";
		}
	} catch {
		throw "Invalid profession";
	}

	const attributesCount = extract(bits, 4);
	const attributeBits = extract(bits, 4) + 4;

	try {
		for (let i = 0; i < attributesCount; i++) {
			const attribute = (attributes as StringMap)[
				extract(bits, attributeBits).toString()
			];

			if (!attribute) {
				throw "Invalid attribute";
			}

			const score = extract(bits, 4);

			if (score < 0 || score > 12) {
				throw "Invalid attribute";
			}

			build.attributes[attribute] = score;
		}
	} catch {
		throw "Invalid attribute";
	}

	const skillBits = extract(bits, 4) + 8;

	try {
		for (let i = 0; i < 8; i++) {
			const skillID = extract(bits, skillBits).toString();
			let skillName = skillsList[skillID];

			if (skillName === undefined) {
				throw "Invalid skill";
			}

			if (pvp && pvpSkills[skillName] !== undefined) {
				skillName += " (PvP)";
			}

			build.skills.push(decodeURIComponent(skillName));
		}
	} catch {
		throw "Invalid skill";
	}

	return build;
};

/** Encode BuildTemplate to template code (inverse of decode). Bit widths are derived from the build. */
export const encode = (build: BuildTemplate): string => {
	const bits: number[] = [];

	appendBits(bits, 14, 4);
	appendBits(bits, 0, 4);

	const primaryIdx = professionNameToIndex[build.primary] ?? 1;
	const secondaryIdx = professionNameToIndex[build.secondary] ?? 2;
	const professionBits = professionBitsFor(Math.max(primaryIdx, secondaryIdx));
	appendBits(bits, (professionBits - 4) / 2, 2);
	appendBits(bits, primaryIdx, professionBits);
	appendBits(bits, secondaryIdx, professionBits);

	const attrEntries = Object.entries(build.attributes);
	appendBits(bits, attrEntries.length, 4);
	const attributeBits = (() => {
		if (!attrEntries.length) return 4;
		const ids = attrEntries
			.map(([name]) => attributeNameToId[name])
			.filter((id): id is string => id !== undefined)
			.map((id) => parseInt(id, 10));
		const maxAttrId = Math.max(...ids);
		return Math.max(4, Math.ceil(Math.log2(maxAttrId + 1)));
	})();
	appendBits(bits, attributeBits - 4, 4);
	for (const [name, score] of attrEntries) {
		const id = attributeNameToId[name];
		if (id === undefined) throw "Invalid attribute";
		appendBits(bits, parseInt(id, 10), attributeBits);
		appendBits(bits, score, 4);
	}

	const skillsPadded = [...build.skills];
	while (skillsPadded.length < 8) skillsPadded.push("No Skill");
	const skillIds = skillsPadded.map((skill) => {
		const normalized = skill.replace(/ \(PvP\)$/, "");
		return parseInt(skillNameToId[normalized] ?? "0", 10);
	});
	const maxSkillIdInBuild = Math.max(...skillIds);
	const skillBits = Math.max(
		SKILL_BITS_MIN,
		Math.ceil(Math.log2(maxSkillIdInBuild + 1)),
	);
	appendBits(bits, skillBits - SKILL_BITS_MIN, 4);
	for (const id of skillIds) {
		appendBits(bits, id, skillBits);
	}

	return pack(bits);
};
