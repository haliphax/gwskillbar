import skills from "@/app/data/skills.json";
import { existsSync, writeFileSync } from "fs";
import { setTimeout } from "timers/promises";

const headers = {
	"User-Agent":
		"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
};

for (let skill of Object.values(skills).slice(1)) {
	skill = decodeURIComponent(skill);
	const filename = `src/images/${skill}.jpg`;

	if (existsSync(filename)) {
		console.log(`Already have ${skill}`);
		continue;
	}

	if (skill.endsWith("(PvP)")) {
		console.log(`Skipping ${skill}`);
		continue;
	}

	console.log(`Downloading ${skill}`);

	await fetch(
		`https://wiki.guildwars.com/wiki/File:${skill.replace(" ", "_")}.jpg`,
		{ headers },
	)
		.then((r) => r.text())
		.then(async (t) => {
			const match = t.match(/<img alt="File:[^"]+.jpg" src="([^"]+)"/);

			if (!match) {
				throw "Couldn't find image";
			}

			await fetch(`https://wiki.guildwars.com${match[1]}`, { headers })
				.then((r) => r.bytes())
				.then((b) => writeFileSync(`src/images/${skill}.jpg`, b));
		});

	// don't be a jerk with other people's bandwidth
	await setTimeout(250);
}
