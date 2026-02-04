import skills from "@/data/skills.json";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { parse } from "node-html-parser";
import { setTimeout } from "timers/promises";
import headers from "./headers";

const filename = "src/data/skills-data.json";
const skillsData: SkillsData = existsSync(filename)
	? JSON.parse(readFileSync(filename, { encoding: "utf-8" }))
	: {};

for (let skill of Object.values(skills).slice(1)) {
	skill = decodeURIComponent(skill);

	if (Object.prototype.hasOwnProperty.call(skillsData, skill)) {
		console.log(`Already have ${skill}`);
		continue;
	}

	console.log(`Fetching data for ${skill}`);

	await fetch(`https://wiki.guildwars.com/wiki/${skill}`, { headers })
		.then((r) => {
			if (r.status !== 200) {
				throw "HTTP error";
			}

			return r.text();
		})
		.then((t) => {
			const d = parse(t);
			const desc = d
				.querySelectorAll("dt")
				.filter((v) => v.innerText.trim() == "Concise description")[0]
				.parentNode!.parentNode!.innerText.replace("Concise description", "")
				.trim();
			const data: SkillData = { desc };

			Array.from(
				d.querySelectorAll(".skill-box .skill-stats > ul > li"),
			).forEach((v) => {
				const amount = parseFloat(
					(v.querySelector("> span[style]") ?? v).innerText
						.replace("%", "")
						.trim(),
				);
				const type_ = (v.querySelector("a") ??
					v.querySelector("img"))!.getAttribute("title")!;

				switch (type_) {
					case "Activation":
						data.activate = amount;
						break;
					case "Adrenaline":
						data.adrenaline = amount;
						break;
					case "Energy":
						data.energy = amount;
						break;
					case "Overcast":
						data.overcast = amount;
						break;
					case "Recharge":
						data.recharge = amount;
						break;
					case "Sacrifice":
						data.health = amount;
						break;
				}
			});

			skillsData[skill] = data;
		});

	writeFileSync(filename, JSON.stringify(skillsData));
	await setTimeout(100);
}
