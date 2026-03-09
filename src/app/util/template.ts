import { pvpSkills } from "@/app/util/skills";
import attributes from "@/data/attributes.json";
import professions from "@/data/professions.json";
import skills from "@/data/skills.json";

const CHAR_MAP =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const skillsList = skills as StringMap;
const attributesList = attributes as StringMap;
const professionsList = professions as string[];

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

/** Skill name (no PvP suffix) -> skill ID string */
const skillNameToId = ((): StringMap => {
	const map: StringMap = {};
	for (const [id, name] of Object.entries(skillsList)) {
		const normalized = decodeURIComponent(name).replace(/ \(PvP\)$/, "");
		map[normalized] = id;
	}
	return map;
})();

/** Profession name -> array index */
const professionNameToIndex = ((): Record<string, number> => {
	const map: Record<string, number> = {};
	professionsList.forEach((name, index) => {
		map[name] = index;
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
const maxSkillId = Math.max(...Object.keys(skillsList).map(Number));
const defaultSkillBits = Math.max(
	SKILL_BITS_MIN,
	Math.ceil(Math.log2(maxSkillId + 1)),
);

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
		build.primary = professions[extract(bits, professionBits)];
		build.secondary = professions[extract(bits, professionBits)];

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

/** Encode BuildTemplate to template code (inverse of decode) */
export const encode = (build: BuildTemplate, _pvp: boolean): string => {
	const bits: number[] = [];

	appendBits(bits, 14, 4);
	appendBits(bits, 0, 4);

	const professionBits = 4;
	appendBits(bits, 0, 2);
	const primaryIdx = professionNameToIndex[build.primary] ?? 1;
	const secondaryIdx = professionNameToIndex[build.secondary] ?? 2;
	appendBits(bits, primaryIdx, professionBits);
	appendBits(bits, secondaryIdx, professionBits);

	const attrEntries = Object.entries(build.attributes);
	appendBits(bits, attrEntries.length, 4);
	const attributeBits = attrEntries.length
		? Math.max(
				4,
				Math.ceil(
					Math.log2(
						Math.max(
							...Object.keys(attributesList).map(Number),
						) + 1,
					),
				),
			)
		: 4;
	appendBits(bits, attributeBits - 4, 4);
	for (const [name, score] of attrEntries) {
		const id = attributeNameToId[name];
		if (id === undefined) throw "Invalid attribute";
		appendBits(bits, parseInt(id, 10), attributeBits);
		appendBits(bits, score, 4);
	}

	const skillBits = defaultSkillBits;
	appendBits(bits, skillBits - SKILL_BITS_MIN, 4);
	const skillsPadded = [...build.skills];
	while (skillsPadded.length < 8) skillsPadded.push("No Skill");
	for (const skill of skillsPadded) {
		const normalized = skill.replace(/ \(PvP\)$/, "");
		const id = skillNameToId[normalized] ?? "0";
		appendBits(bits, parseInt(id, 10), skillBits);
	}

	return pack(bits);
};
