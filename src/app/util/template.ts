import attributes from "@/data/attributes.json";
import professions from "@/data/professions.json";
import skills from "@/data/skills.json";

const CHAR_MAP =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const extract = (bits: string[], count: number): number =>
	parseInt(bits.splice(0, count).reverse().join(""), 2);

export const decode = (code: string): BuildTemplate => {
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
			const attribute = (attributes as { [p: string]: string })[
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
			const skillsList = skills as { [p: string]: string };
			const skillID = extract(bits, skillBits).toString();
			const skillName = skillsList[skillID];

			if (skillName === undefined) {
				throw "Invalid skill";
			}

			build.skills.push(decodeURIComponent(skillName));
		}
	} catch {
		throw "Invalid skill";
	}

	return build;
};
