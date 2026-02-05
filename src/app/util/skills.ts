import allegiance from "@/data/allegiance.json";
import pveOnly from "@/data/pve-only.json";
import skills from "@/data/skills.json";

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

export { allegianceSkills, pveSkills, pvpSkills };
