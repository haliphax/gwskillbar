<script lang="ts" setup>
import ProfessionIcon from "@/app/components/profession-icon.vue";
import SkillIcon from "@/app/components/skill-icon.vue";
import WikiLink from "@/app/components/wiki-link.vue";
import attributes from "@/app/data/attributes.json";
import professions from "@/app/data/professions.json";
import pveOnly from "@/app/data/pve-only.json";
import skills from "@/app/data/skills.json";
import { onBeforeMount, ref, Ref } from "vue";
import Toggle from "../components/toggle.vue";

const CHAR_MAP =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const pveSkills: { [p: string]: boolean } = {};
const pvpSkills: { [p: string]: boolean } = {};

const pvp = ref(false);
const hasInvalidPvpSkills = ref(false);
const primary = ref("");
const secondary = ref("");
const attribs: Ref<{ [p: string]: number }> = ref({});
const skillBar: Ref<string[]> = ref([]);

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

const load = () => {
	attribs.value = {};
	skillBar.value = [];
	hasInvalidPvpSkills.value = false;

	const code = location.hash.slice(2).replace(/\/pvp$/, "");

	if (!code) {
		return;
	}

	pvp.value = location.hash.endsWith("/pvp");

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
		throw "Invalid template type";
	}

	const professionBits = extract(bits, 2) * 2 + 4;

	try {
		primary.value = professions[extract(bits, professionBits)];
		secondary.value = professions[extract(bits, professionBits)];
	} catch (ex) {
		throw "Invalid profession";
	}

	const attributesCount = extract(bits, 4);
	const attributeBits = extract(bits, 4) + 4;

	try {
		for (let i = 0; i < attributesCount; i++) {
			const attribute = (attributes as { [p: string]: string })[
				extract(bits, attributeBits).toString()
			];
			const score = extract(bits, 4);

			attribs.value[attribute] = score;
		}
	} catch (ex) {
		throw "Invalid attribute";
	}

	const skillBits = extract(bits, 4) + 8;

	try {
		for (let i = 0; i < 8; i++) {
			const skillsList = skills as { [p: string]: string };
			const skillID = extract(bits, skillBits).toString();
			let skillName = skillsList[skillID];

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
		throw "Invalid skill";
	}
};

const updateHash = () => {
	pvp.value = !pvp.value;

	if (pvp.value && !location.hash.endsWith("/pvp")) {
		location.href += "/pvp";
		load();
		return;
	}

	if (!pvp.value && location.hash.endsWith("/pvp")) {
		location.href = location.href.replace(/\/pvp$/, "");
		load();
		return;
	}
};

addEventListener("hashchange", () => load());
onBeforeMount(() => load());
</script>

<template>
	<h2>
		<ProfessionIcon :name="primary"></ProfessionIcon>
		<ProfessionIcon :name="secondary"></ProfessionIcon>
		{{ primary == "None" ? "Any" : primary }}
		<span class="slash">/</span>
		{{ secondary == "None" ? "Any" : secondary }}
	</h2>
	<p>
		<label for="pvp-toggle">
			<Toggle id="pvp-toggle" :checked="pvp" @click="updateHash"></Toggle>
			<small>
				<span aria-hidden="true" v-show="pvp">⚔️ PvP</span>
				<span aria-hidden="true" v-show="!pvp">️🌎 PvE</span>
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
	</fieldset>
	<fieldset>
		<legend>Skills</legend>
		<ul class="skillbar x g">
			<li v-for="(skill, idx) in skillBar" :key="idx">
				<WikiLink :path="skill" :title="skill" v-show="skill != 'No Skill'">
					<SkillIcon
						:class="invalidSkillClass(skill) + ' vam'"
						:name="skill"
						:size="64"
					></SkillIcon>
				</WikiLink>
				<SkillIcon
					:name="skill"
					:size="64"
					v-show="skill == 'No Skill'"
				></SkillIcon>
			</li>
		</ul>
		<ol class="skills">
			<li v-for="(skill, idx) in skillBar" :key="idx">
				<SkillIcon
					:class="invalidSkillClass(skill) + ' vam'"
					:name="skill"
					:size="24"
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

fieldset {
	--icon-size: 48px;
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

	li img {
		height: var(--icon-size);
		width: var(--icon-size);
	}
}

.skills img {
	margin-right: var(--space-m);
}

img.invalid {
	opacity: 0.1;
}

a.invalid {
	text-decoration: line-through;
}

#pve-warn {
	color: var(--color-fg-subtle);
	text-align: center;
}

@media @breakpoint_m {
	fieldset {
		--icon-size: 56px;
	}
	.attributes,
	.skills {
		column-count: 2;
	}
}

@media @breakpoint_l {
	fieldset {
		--icon-size: 64px;
	}
}
</style>
