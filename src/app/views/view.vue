<script lang="ts" setup>
import ProfessionIcon from "@/app/components/profession-icon.vue";
import SkillIcon from "@/app/components/skill-icon.vue";
import Toggle from "@/app/components/toggle.vue";
import WikiLink from "@/app/components/wiki-link.vue";
import router from "@/app/router";
import store from "@/app/store";
import {
	invalidSkillClass,
	isAllegianceSkill,
	pveSkills,
	skillDescription,
} from "@/app/util/skills";
import { decode } from "@/app/util/template";
import attributesData from "@/data/attributes-data.json";
import { onBeforeMount, onUnmounted, ref, Ref } from "vue";

const code = ref("");
const pvp = ref(false);
const hasInvalidPvpSkills = ref(false);
const build: Ref<BuildTemplate> = ref({
	primary: "",
	secondary: "",
	attributes: {},
	skills: [],
});
const attribDesc: Ref<StringMap> = ref({});

const clear = () => {
	build.value = {
		primary: "",
		secondary: "",
		attributes: {},
		skills: [],
	};
	attribDesc.value = {};
	hasInvalidPvpSkills.value = false;
};

const error = async (text: string) => {
	clear();
	await store.dispatch("alert", { text, title: "Error" });
	throw text;
};

const load = async (_?: Event, force = false) => {
	if (router.currentRoute.value.name != "view") {
		return;
	}

	const codeFromHash = location.hash.replace(/(?:\/(?:pvp))+/g, "").slice(2);
	const pvpFromHash = location.hash.endsWith("/pvp");

	if (!force && codeFromHash == code.value && pvpFromHash == pvp.value) {
		return;
	}

	clear();
	code.value = codeFromHash;
	pvp.value = pvpFromHash;

	try {
		build.value = decode(code.value, pvp.value);
	} catch (ex) {
		await error((ex as any).toString());
	}

	for (const [attribute, score] of Object.entries(build.value.attributes)) {
		const attribData = (attributesData as AttributeData)[attribute];

		if (attribData) {
			const repl = (_: string, group: string) =>
				`<strong>${attribData.vars[group][score].toString()}</strong>`;
			const desc = attribData.desc.replace(/\{([^}]+)\}/g, repl);
			attribDesc.value[attribute] = desc;
		}
	}

	for (const skill of build.value.skills) {
		if (pveSkills[skill] !== undefined) {
			hasInvalidPvpSkills.value = true;
			break;
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

	await load(undefined, true);
};

addEventListener("hashchange", load);
onBeforeMount(load);
onUnmounted(() => removeEventListener("hashchange", load));
</script>

<template>
	<ul class="x control">
		<li>
			<router-link
				class="btn"
				:to="{
					name: 'stats',
					params: { template: router.currentRoute.value.params.template },
				}"
				><span aria-hidden="true">📊</span> Statistics</router-link
			>
		</li>
		<li>
			<label for="pvp-toggle">
				<Toggle id="pvp-toggle" :checked="pvp" @click="updatePvp"></Toggle>
				<span aria-hidden="true" v-show="pvp" class="pvp-icon">⚔️ PvP</span>
				<span aria-hidden="true" v-show="!pvp" class="pvp-icon">️🧸 PvE</span>
				mode
			</label>
		</li>
	</ul>
	<h2 v-show="build.primary && build.secondary">
		<ProfessionIcon :name="build.primary"></ProfessionIcon>
		<ProfessionIcon :name="build.secondary"></ProfessionIcon>
		{{ build.primary == "None" ? "Any" : build.primary }}
		<span class="slash">/</span>
		{{ build.secondary == "None" ? "Any" : build.secondary }}
	</h2>
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
					@click.prevent="skillDescription(skill)"
					:path="skill"
					:title="skill"
					v-show="skill != 'No Skill'"
				>
					<SkillIcon
						:class="invalidSkillClass(skill, pvp)"
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
					:class="invalidSkillClass(skill, pvp)"
					:name="skill"
					:allegianceSkill="isAllegianceSkill(skill)"
				></SkillIcon>
				<a
					href="#"
					@click.prevent="skillDescription(skill)"
					:class="invalidSkillClass(skill, pvp)"
					:path="skill"
					v-show="skill != 'No Skill'"
				>
					{{ skill }}
				</a>
				<span v-show="skill == 'No Skill'">(Optional)</span>
			</li>
		</ol>
		<p v-show="pvp && hasInvalidPvpSkills" id="pve-warn">
			<small>
				<span aria-hidden="true">⚠️</span>
				This build contains PvE-only skills
			</small>
		</p>
	</fieldset>
</template>

<style lang="less" scoped>
@import "@/styles/breakpoints.less";

.pvp-icon {
	margin-left: var(--space-s);
}

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

	&.ally {
		height: 1em;
		top: 0.215em;
		margin-top: 0;
	}
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
