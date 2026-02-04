import professions from "@/data/professions.json";
import skills from "@/data/skills.json";
import { existsSync, writeFileSync } from "fs";
import { setTimeout } from "timers/promises";
import headers from "./headers";

const getFile = async (
	folder: string,
	filename: string,
	extension: string = "jpg",
	suffix: string = "",
): Promise<boolean> => {
	if (existsSync(`${folder}/${filename}.${extension}`)) {
		console.log(`Already have ${folder}/${filename}`);
		return false;
	}

	console.log(`Downloading ${folder}/${filename}`);

	await fetch(
		`https://wiki.guildwars.com/wiki/File:${filename.replace(/ /g, "_")}${suffix}.${extension}`,
		{ headers },
	)
		.then((r) => {
			if (r.status !== 200) {
				throw "HTTP error";
			}

			return r.text();
		})
		.then(async (t) => {
			const match = t.match(/<img alt="File:[^"]+.(?:jpg|png)" src="([^"]+)"/);

			if (!match) {
				throw "Couldn't find image";
			}

			await fetch(`https://wiki.guildwars.com${match[1]}`, { headers })
				.then((r) => {
					if (r.status !== 200) {
						throw "HTTP error";
					}

					return r.bytes();
				})
				.then((b) => writeFileSync(`${folder}/${filename}.${extension}`, b));
		});

	return true;
};

console.log("=== Professions ===");

for (const profession of professions.slice(1)) {
	if (
		await getFile(
			"src/images/professions",
			profession,
			"png",
			"-tango-icon-200",
		)
	) {
		// don't be a jerk with other people's bandwidth
		await setTimeout(250);
	}
}

console.log("=== Skills ===");

for (let skill of Object.values(skills).slice(1)) {
	skill = decodeURIComponent(skill);

	if (skill.endsWith("(PvP)")) {
		console.log(`Skipping ${skill}`);
		continue;
	}

	if (await getFile("src/images/skills", skill)) {
		await setTimeout(250);
	}
}
