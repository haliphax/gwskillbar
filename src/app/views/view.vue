<script lang="ts" setup>
import ProfessionIcon from "@/app/components/profession-icon.vue";
import SkillIcon from "@/app/components/skill-icon.vue";
import WikiLink from "@/app/components/wiki-link.vue";
import allegiance from "@/app/data/allegiance.json";
import attributeData from "@/app/data/attribute-data.json";
import attributes from "@/app/data/attributes.json";
import professions from "@/app/data/professions.json";
import pveOnly from "@/app/data/pve-only.json";
import skills from "@/app/data/skills.json";
import store from "@/app/store";
import { onBeforeMount, ref, Ref } from "vue";
import Toggle from "../components/toggle.vue";

type AttributeData = {
	[p: string]: {
		desc: string;
		vars: {
			[p: string]: number[];
		};
	};
};

type LookupArray = { [p: string]: boolean };

const CHAR_MAP =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const allegianceSkills: LookupArray = {};
const pveSkills: LookupArray = {};
const pvpSkills: LookupArray = {};

const pvp = ref(false);
const hasInvalidPvpSkills = ref(false);
const primary = ref("");
const secondary = ref("");
const attribs: Ref<{ [p: string]: number }> = ref({});
const attribDesc: Ref<{ [p: string]: string }> = ref({});
const skillBar: Ref<string[]> = ref([]);

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

const invalidSkillClass = (skill: string) =>
	pvp.value && pveSkills.hasOwnProperty(skill.replace(/"/g, "%22"))
		? "invalid"
		: "";

const extract = (bits: string[], count: number): number =>
	parseInt(bits.splice(0, count).reverse().join(""), 2);

const clear = () => {
	attribs.value = {};
	attribDesc.value = {};
	skillBar.value = [];
	hasInvalidPvpSkills.value = false;
	primary.value = "";
	secondary.value = "";
	pvp.value = location.hash.endsWith("/pvp");
};

const error = async (text: string) => {
	clear();
	await store.dispatch("alert", { text });
	throw text;
};

const load = async () => {
	clear();
	const code = location.hash.slice(2).replace(/\/pvp$/, "");

	if (!code) {
		return;
	}

	const decoded = Array.from(code).map((v) => CHAR_MAP.indexOf(v));
	const bits = decoded.flatMap((v) =>
		Array.from((v >>> 0).toString(2).padStart(6, "0")).reverse(),
	);
	const templateType = extract(bits, 4);

	if (templateType !== 14) {
		await error("Invalid template type");
	}

	const templateVersion = extract(bits, 4);

	if (templateVersion !== 0) {
		await error("Invalid template version");
	}

	const professionBits = extract(bits, 2) * 2 + 4;

	try {
		primary.value = professions[extract(bits, professionBits)];
		secondary.value = professions[extract(bits, professionBits)];

		if (
			primary.value == secondary.value ||
			!primary.value ||
			!secondary.value
		) {
			throw "Invalid profession";
		}
	} catch (ex) {
		await error("Invalid profession");
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

			attribs.value[attribute] = score;

			const attribData = (attributeData as AttributeData)[attribute];

			if (attribData) {
				const repl = (_: string, group: string) =>
					`<strong>${attribData.vars[group][score].toString()}</strong>`;
				const desc = attribData.desc.replace(/\{([^}]+)\}/g, repl);
				attribDesc.value[attribute] = desc;
			}
		}
	} catch (ex) {
		await error("Invalid attribute");
	}

	const skillBits = extract(bits, 4) + 8;

	try {
		for (let i = 0; i < 8; i++) {
			const skillsList = skills as { [p: string]: string };
			const skillID = extract(bits, skillBits).toString();
			let skillName = skillsList[skillID];

			if (skillName === undefined) {
				throw "Invalid skill";
			}

			if (pvp.value && pvpSkills.hasOwnProperty(skillName)) {
				skillName += " (PvP)";
			} else if (
				pvp.value &&
				!hasInvalidPvpSkills.value &&
				pveSkills.hasOwnProperty(skillName)
			) {
				hasInvalidPvpSkills.value = true;
			}

			skillBar.value.push(decodeURIComponent(skillName));
		}
	} catch (ex) {
		await error("Invalid skill");
	}
};

const updatePvp = async () => {
	pvp.value = !pvp.value;

	if (pvp.value && !location.hash.endsWith("/pvp")) {
		location.href += "/pvp";
	} else if (!pvp.value && location.hash.endsWith("/pvp")) {
		location.href = location.href.replace(/\/pvp$/, "");
	}

	await load();
};

const isAllegianceSkill = (skill: string) =>
	allegianceSkills[skill.replace(/"/g, "%22")] ?? false;

addEventListener("hashchange", async () => await load());
onBeforeMount(async () => await load());
</script>

<template>
	<h2 v-show="primary && secondary">
		<ProfessionIcon :name="primary"></ProfessionIcon>
		<ProfessionIcon :name="secondary"></ProfessionIcon>
		{{ primary == "None" ? "Any" : primary }}
		<span class="slash">/</span>
		{{ secondary == "None" ? "Any" : secondary }}
	</h2>
	<p>
		<label for="pvp-toggle">
			<Toggle id="pvp-toggle" :checked="pvp" @click="updatePvp"></Toggle>
			<small>
				<span aria-hidden="true" v-show="pvp">⚔️ PvP</span>
				<span aria-hidden="true" v-show="!pvp">️🧸 PvE</span>
				mode
			</small>
		</label>
	</p>
	<fieldset>
		<legend>Attributes</legend>
		<ul class="attributes">
			<li v-for="(score, attribute) of attribs" :key="attribute">
				<span class="attr">
					<WikiLink :path="attribute" :title="attribute">
						{{ attribute }}
					</WikiLink>
				</span>
				<span class="score">{{ score }}</span>
			</li>
		</ul>
		<div v-show="Object.keys(attribDesc)">
			<hr />
			<ul class="attribute-effects">
				<li v-for="(desc, attrib) in attribDesc" :key="attrib">
					<small v-html="desc"></small>
				</li>
			</ul>
		</div>
	</fieldset>
	<fieldset>
		<legend>Skills</legend>
		<ul class="skillbar x g">
			<li v-for="(skill, idx) in skillBar" :key="idx">
				<WikiLink
					class="ib"
					:path="skill"
					:title="skill"
					v-show="skill != 'No Skill'"
				>
					<SkillIcon
						:class="invalidSkillClass(skill)"
						:name="skill"
						:allegianceSkill="isAllegianceSkill(skill)"
					></SkillIcon>
				</WikiLink>
				<SkillIcon :name="skill" v-show="skill == 'No Skill'"></SkillIcon>
			</li>
		</ul>
		<ol class="skills">
			<li v-for="(skill, idx) in skillBar" :key="idx">
				<SkillIcon
					:class="invalidSkillClass(skill)"
					:name="skill"
					:allegianceSkill="isAllegianceSkill(skill)"
				></SkillIcon>
				<WikiLink
					:class="invalidSkillClass(skill)"
					:path="skill"
					v-show="skill != 'No Skill'"
				>
					{{ skill }}
				</WikiLink>
				<span v-show="skill == 'No Skill'">(Optional)</span>
			</li>
		</ol>
		<p v-show="hasInvalidPvpSkills" id="pve-warn">
			<small>
				<span aria-hidden="true">⚠️</span>
				This build contains PvE-only skills
			</small>
		</p>
	</fieldset>
</template>

<style lang="less" scoped>
@import "@/styles/breakpoints.less";

.prof-icon {
	width: 1.5em;
}

fieldset {
	--icon-size: 40px;
	--gap: 2px;
}

.slash {
	color: var(--color-fg-subtle);
}

.attr {
	margin-right: var(--space-m);
}

.score {
	color: var(--color-fg-subtle);
}

label[for="pvp-toggle"] small {
	margin-left: var(--space-m);
}

.skillbar {
	column-gap: var(--gap);
	grid-template-columns: repeat(8, minmax(var(--icon-size), 1fr));
	margin: 0 auto;
	max-width: 100%;
	width: calc((var(--icon-size) * 8) + (var(--gap) * 7));

	li {
		&,
		a,
		span,
		img {
			height: var(--icon-size);
			width: var(--icon-size);
		}
	}
}

.skills .icon {
	margin-right: var(--space-m);
	position: relative;
	width: 1em;
	top: 0.45em;
	margin-top: -0.215em;
}

a.invalid {
	text-decoration: line-through;
}

#pve-warn {
	color: var(--color-fg-subtle);
	text-align: center;
}

@media @breakpoint_s {
	fieldset {
		--icon-size: 52px;
	}
}

@media @breakpoint_m {
	fieldset {
		--icon-size: 64px;
	}
	.attributes,
	.skills {
		column-count: 2;
	}
}
</style>
