<script lang="ts" setup>
import ProfessionIcon from "@/app/components/profession-icon.vue";
import PvpModeToggle from "@/app/components/pvp-mode-toggle.vue";
import SkillIcon from "@/app/components/skill-icon.vue";
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
import { computed, onBeforeMount, ref, Ref, watch } from "vue";

const code = ref("");
const pvp = computed(() => router.currentRoute.value.name === "view-pvp");
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

const loadFromRoute = async () => {
	const route = router.currentRoute.value;
	if (route.name !== "view" && route.name !== "view-pvp") return;

	const templateParam = route.params.template;
	const codeFromRoute = Array.isArray(templateParam)
		? templateParam.join("/")
		: String(templateParam ?? "");
	const isPvp = route.name === "view-pvp";

	if (!codeFromRoute) return;

	clear();
	code.value = codeFromRoute;

	try {
		build.value = decode(code.value, isPvp);
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

const updatePvp = (nextPvp: boolean) => {
	const route = router.currentRoute.value;
	if (route.name !== "view" && route.name !== "view-pvp") return;

	const params = { ...route.params } as { [key: string]: string | string[] };

	router.push({
		name: nextPvp ? "view-pvp" : "view",
		params,
		query: route.query,
	});
};

onBeforeMount(loadFromRoute);
watch(
	() => router.currentRoute.value,
	() => {
		loadFromRoute();
	},
);
</script>

<template>
	<ul class="x control">
		<li>
			<router-link
				class="btn"
				:to="{
					name: pvp ? 'edit-pvp' : 'edit',
					params: {
						template: code,
					},
				}"
				><span aria-hidden="true">✏️</span> Edit</router-link
			>
		</li>
		<li>
			<router-link
				class="btn"
				:to="{
					name: pvp ? 'stats-pvp' : 'stats',
					params: { template: router.currentRoute.value.params.template },
				}"
				><span aria-hidden="true">📊</span> Stats</router-link
			>
		</li>
		<li>
			<PvpModeToggle id="pvp-toggle" :pvp="pvp" @change="updatePvp" />
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
	<fieldset class="skillbar-fieldset">
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

.skillbar-fieldset {
	align-items: center;
	display: flex;
	flex-direction: column;
}

.prof-icon {
	width: 1.5em;
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

.skills li {
	margin-right: 1em;
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

@media @breakpoint_m {
	.attributes,
	.skills {
		column-count: 2;
	}
}
</style>
