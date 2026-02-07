import allegiance from "@/data/allegiance.json";
import pveOnly from "@/data/pve-only.json";
import skillsData from "@/data/skills-data.json";
import skills from "@/data/skills.json";
import store from "../store";

const allegianceSkills: LookupArray = {};
const pveSkills: LookupArray = {};
const pvpSkills: LookupArray = {};

for (const skill of allegiance) {
	allegianceSkills[skill] = true;
}

for (const skill of pveOnly) {
	pveSkills[skill] = true;
}

for (const skill of Object.values(skills)) {
	if (!skill.endsWith(" (PvP)")) {
		continue;
	}

	pvpSkills[skill.replace(/ \(PvP\)$/, "")] = true;
}

/** If provided skill is Kurzick/Luxon */
export const isAllegianceSkill = (skill: string) =>
	allegianceSkills[skill.replace(/"/g, "%22")] ?? false;

/** Formatted skill statistic display */
export const statDisplay = (stat: string, amount: number | null) => {
	let amountDisplay: string = amount?.toString() ?? "";

	if (amountDisplay == "") {
		amountDisplay = "morale boost";
	} else {
		if (amountDisplay.endsWith(".25")) {
			amountDisplay = "&frac14;";
		} else if (amountDisplay.endsWith(".5")) {
			amountDisplay = "&frac12;";
		} else if (amountDisplay.endsWith(".75")) {
			amountDisplay = "&frac34;";
		}

		if (stat == "health") {
			amountDisplay += "%";
		}
	}

	return /* html */ `
		<li class="ib" style="margin-left: var(--space-m);">
			${amountDisplay}
			<img
				alt="${stat}"
				class="ib vab"
				src="/images/ui/${stat}.png"
				style="height: 1em; width: 1em;"
				title="${stat}"
			/>
		</li>`;
};

/** Formatted skill description display */
export const skillDescription = async (skill: string) => {
	const data = (skillsData as SkillsData)[skill];
	const desc = data.desc.replace(
		/((?:\d+\.\.\.)+\d+)/g,
		'<span style="color: var(--color-em)">$1</span>',
	);
	await store.dispatch("alert", {
		html: true,
		text: /* html */ `
			<div style="margin-top: var(--space-m)">
				<div class="fl ib" style="width: auto;">
					<img
						alt=""
						class="vam"
						src="/images/professions/${data.profession ?? "None"}.png"
						style="height: 1.4em; width: 1.4em;"
						title="${data.profession ?? "Any profession"}"
					/>
					<span style="color: var(--color-fg-subtle)">
						${data.attribute ?? "No Attribute"}
					</span>
				</div>
				<div class="fr ib" style="text-align: right; width: auto;">
					<span class="sr">Skill stats:</span>
					<ul class="x">
						${data.adrenaline ? statDisplay("adrenaline", data.adrenaline) : ""}
						${data.energy ? statDisplay("energy", data.energy) : ""}
						${data.health ? statDisplay("health", data.health) : ""}
						${data.overcast ? statDisplay("overcast", data.overcast) : ""}
						${data.activate ? statDisplay("activate", data.activate) : ""}
						${data.recharge ? statDisplay("recharge", data.recharge) : ""}
						${data.upkeep ? statDisplay("upkeep", data.upkeep) : ""}
					</ul>
				</div>
			</div>
			<p>${desc}</p>
			<small>
				<a
					href="https://wiki.guildwars.com/wiki/${skill.replace(/ /g, "_")}"
					target="_blank"
				>
					Guild Wars Wiki
				</a>
			</small>`,
		title: /* html */ `
			<img
				src="/images/skills/${encodeURIComponent(skill.replace(" (PvP)", ""))}.jpg"
				class="vam"
				style="height: 1em; width: 1em;"
			/>
			${skill}`,
	});
};

/** If skill is valid for current PvP mode */
export const invalidSkillClass = (skill: string, pvp: boolean) =>
	pvp && pveSkills[skill.replace(/"/g, "%22")] !== undefined ? "invalid" : "";

/** Build statistics */
export const statistics = (build: BuildTemplate): Stats => {
	const totals: StatTotals = {
		activate: 0.0,
		adrenaline: 0,
		attribute: {},
		energy: 0.0,
		health: 0.0,
		overcast: 0,
		profession: {},
		recharge: 0.0,
	};
	let optionals = 0;

	for (const skill of build.skills) {
		const data = (skillsData as SkillsData)[skill];

		if (!data) {
			optionals++;
			continue;
		}

		const profession = data.profession ?? "Any";

		if (totals.profession[profession]) {
			totals.profession[profession] += 1;
		} else {
			totals.profession[profession] = 1;
		}

		totals.activate += data.activate ?? 0;
		totals.adrenaline += data.adrenaline ?? 0;
		totals.energy += data.energy ?? 0;
		totals.health += data.health ?? 0;
		totals.overcast += data.overcast ?? 0;
		totals.recharge += data.recharge ?? 0;

		const attribute = data.attribute ?? "No Attribute";

		if (totals.attribute[attribute]) {
			totals.attribute[attribute] += 1;
		} else {
			totals.attribute[attribute] = 1;
		}
	}

	totals.attribute["Optional"] = optionals;
	totals.profession["Optional"] = optionals;
	const skillCount = 8 - optionals;

	const calcAverage = (total: number) =>
		parseFloat((total / skillCount).toFixed(2));
	const calcPercentage = (total: number) =>
		parseFloat(((total / skillCount) * 100).toFixed(2));

	const stats: Stats = {
		average: {
			activate: calcAverage(totals.activate),
			adrenaline: calcAverage(totals.adrenaline),
			energy: calcAverage(totals.energy),
			health: calcAverage(totals.health),
			overcast: calcAverage(totals.overcast),
			recharge: calcAverage(totals.recharge),
		},
		percentage: {
			attribute: {},
			profession: {},
		},
		total: totals,
	};

	for (const [attribute, total] of Object.entries(totals.attribute)) {
		const pct = calcPercentage(total);
		stats.percentage.attribute[attribute] = pct;
	}

	for (const [profession, total] of Object.entries(totals.profession)) {
		const pct = calcPercentage(total);
		stats.percentage.profession[profession] = pct;
	}

	const pctOptional = calcPercentage(optionals);
	stats.percentage.attribute["Optional"] = pctOptional;
	stats.percentage.profession["Optional"] = pctOptional;

	return stats;
};

export { allegianceSkills, pveSkills, pvpSkills };
