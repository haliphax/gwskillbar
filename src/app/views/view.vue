<script lang="ts" setup>
import ProfessionIcon from "@/app/components/profession-icon.vue";
import SkillIcon from "@/app/components/skill-icon.vue";
import Toggle from "@/app/components/toggle.vue";
import WikiLink from "@/app/components/wiki-link.vue";
import store from "@/app/store";
import { allegianceSkills, pveSkills, pvpSkills } from "@/app/util/skills";
import attributeData from "@/data/attribute-data.json";
import skillsData from "@/data/skills-data.json";
import { onBeforeMount, ref, Ref } from "vue";
import { decode } from "../util/template";

const pvp = ref(false);
const hasInvalidPvpSkills = ref(false);
const build: Ref<BuildTemplate> = ref({
	primary: "",
	secondary: "",
	attributes: {},
	skills: [],
});
const primary = ref("");
const secondary = ref("");
const attribs: Ref<{ [p: string]: number }> = ref({});
const attribDesc: Ref<{ [p: string]: string }> = ref({});
const skillBar: Ref<string[]> = ref([]);

const invalidSkillClass = (skill: string) =>
	pvp.value && pveSkills.hasOwnProperty(skill.replace(/"/g, "%22"))
		? "invalid"
		: "";

const clear = () => {
	build.value = {
		primary: "",
		secondary: "",
		attributes: {},
		skills: [],
	};
	attribDesc.value = {};
	hasInvalidPvpSkills.value = false;
	pvp.value = location.hash.endsWith("/pvp");
};

const error = async (text: string) => {
	clear();
	await store.dispatch("alert", { text, title: "Error" });
	throw text;
};

const load = async () => {
	clear();
	const code = location.hash.slice(2).replace(/\/pvp$/, "");

	if (!code) {
		return;
	}

	try {
		build.value = decode(code);

		for (let i = 0; i < build.value.skills.length; i++) {
			const skill = build.value.skills[i];

			if (
				pvp.value &&
				!hasInvalidPvpSkills.value &&
				pveSkills.hasOwnProperty(skill)
			) {
				hasInvalidPvpSkills.value = true;
			} else if (pvp.value && pvpSkills.hasOwnProperty(skill)) {
				build.value.skills[i] += " (PvP)";
			}
		}
	} catch (ex) {
		await error((ex as any).toString());
	}

	for (const [attribute, score] of Object.entries(build.value.attributes)) {
		const attribData = (attributeData as AttributeData)[attribute];

		if (attribData) {
			const repl = (_: string, group: string) =>
				`<strong>${attribData.vars[group][score].toString()}</strong>`;
			const desc = attribData.desc.replace(/\{([^}]+)\}/g, repl);
			attribDesc.value[attribute] = desc;
		}
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

const statDisplay = (stat: string, amount: number | null) => {
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
		<li class="ib" style="margin-right: var(--space-l);">
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

const skillDescription = async (skill: string, event: Event) => {
	event.preventDefault();
	const data = (skillsData as SkillsData)[skill];
	const desc = data.desc.replace(
		/((?:\d+\.\.\.)+\d+)/g,
		'<em style="color: var(--color-em)">$1</em>',
	);
	await store.dispatch("alert", {
		html: true,
		text: /* html */ `
			<div style="margin-top: var(--space-m)">
				<div class="fl ib" style="width: 50%;">
					<img
						alt=""
						class="vam"
						src="/images/professions/${data.profession ?? "None"}.png"
						style="height: 1.4em; width: 1.4em;"
						title="${data.profession ?? "Any profession"}"
					/>
					${data.attribute ?? "No Attribute"}
				</div>
				<div class="fr ib" style="text-align: right; width: 50%;">
					<span class="sr">Skill stats:</span>
					<ul class="x">
						${data.adrenaline ? statDisplay("adrenaline", data.adrenaline) : ""}
						${data.energy ? statDisplay("energy", data.energy) : ""}
						${data.health ? statDisplay("health", data.health) : ""}
						${data.overcast ? statDisplay("overcast", data.overcast) : ""}
						${data.activate ? statDisplay("activate", data.activate) : ""}
						${data.recharge ? statDisplay("recharge", data.recharge) : ""}
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

addEventListener("hashchange", async () => await load());
onBeforeMount(async () => await load());
</script>

<template>
	<h2 v-show="build.primary && build.secondary">
		<ProfessionIcon :name="build.primary"></ProfessionIcon>
		<ProfessionIcon :name="build.secondary"></ProfessionIcon>
		{{ build.primary == "None" ? "Any" : build.primary }}
		<span class="slash">/</span>
		{{ build.secondary == "None" ? "Any" : build.secondary }}
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
			<li v-for="(score, attribute) of build.attributes" :key="attribute">
				<span class="attr">
					<WikiLink :path="attribute" :title="attribute">
						{{ attribute }}
					</WikiLink>
				</span>
				<span class="score">{{ score }}</span>
			</li>
		</ul>
		<div v-show="Object.keys(attribDesc).length">
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
			<li v-for="(skill, idx) in build.skills" :key="idx">
				<a
					href="#"
					class="ib"
					@click="skillDescription(skill, $event)"
					:path="skill"
					:title="skill"
					v-show="skill != 'No Skill'"
				>
					<SkillIcon
						:class="invalidSkillClass(skill)"
						:name="skill"
						:allegianceSkill="isAllegianceSkill(skill)"
					></SkillIcon>
				</a>
				<SkillIcon :name="skill" v-show="skill == 'No Skill'"></SkillIcon>
			</li>
		</ul>
		<ol class="skills">
			<li v-for="(skill, idx) in build.skills" :key="idx">
				<SkillIcon
					:class="invalidSkillClass(skill)"
					:name="skill"
					:allegianceSkill="isAllegianceSkill(skill)"
				></SkillIcon>
				<a
					href="#"
					@click="skillDescription(skill, $event)"
					:class="invalidSkillClass(skill)"
					:path="skill"
					v-show="skill != 'No Skill'"
				>
					{{ skill }}
				</a>
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
