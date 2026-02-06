<script setup lang="ts">
import router from "@/app/router";
import store from "@/app/store";
import { statistics } from "@/app/util/skills";
import { decode } from "@/app/util/template";
import skillsData from "@/data/skills-data.json";
import { onBeforeMount, onUnmounted, Ref, ref } from "vue";
import BarChart from "./stats/bar-chart.vue";
import PieChart from "./stats/pie-chart.vue";

const pvp = ref(false);
const code = ref("");
const build: Ref<BuildTemplate> = ref({
	primary: "",
	secondary: "",
	attributes: {},
	skills: [],
});
const stats: Ref<Stats> = ref({
	average: {
		activate: 0,
		adrenaline: 0,
		energy: 0,
		health: 0,
		overcast: 0,
		recharge: 0,
	},
	percentage: {
		attribute: {},
		profession: {},
	},
	total: {
		activate: 0,
		adrenaline: 0,
		attribute: {},
		energy: 0,
		health: 0,
		overcast: 0,
		profession: {},
		recharge: 0,
	},
});
const skillsByAttribute = ref(new Map<string, number>());
const skillsByProfession = ref(new Map<string, number>());
const skills: Ref<SkillsData> = ref({});

const clear = () => {
	skillsByAttribute.value.clear();
	skillsByProfession.value.clear();
	skills.value = {};
};

const error = async (text: string) => {
	clear();
	await store.dispatch("alert", { text, title: "Error" });
	throw text;
};

const load = async () => {
	if (router.currentRoute.value.name != "stats") {
		return;
	}

	const codeFromHash = location.hash
		.replace(/(?:\/(?:pvp|stats))+/g, "")
		.slice(2);

	if (codeFromHash == code.value) {
		return;
	}

	clear();
	code.value = codeFromHash;
	pvp.value = !!location.hash.match(/\/pvp/);

	try {
		build.value = decode(code.value, pvp.value);
	} catch (ex) {
		await error((ex as any).toString());
	}

	for (const skill of build.value.skills) {
		if (!skill || skill == "No Skill") {
			continue;
		}

		skills.value[skill] = (skillsData as SkillsData)[skill];
	}

	stats.value = statistics(build.value);

	for (const [attribute, percentage] of Object.entries(
		stats.value.total.attribute,
	)) {
		if (percentage === 0) {
			continue;
		}

		skillsByAttribute.value.set(attribute, percentage);
	}

	for (const [profession, percentage] of Object.entries(
		stats.value.total.profession,
	)) {
		if (percentage === 0) {
			continue;
		}

		skillsByProfession.value.set(profession, percentage);
	}
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
					name: 'view',
					params: { template: router.currentRoute.value.params.template },
				}"
				><span aria-hidden="true">⏪</span> Back to build</router-link
			>
		</li>
	</ul>
	<fieldset class="stats">
		<legend>Skill statistics</legend>
		<BarChart :skills="skills"></BarChart>
		<table>
			<tbody>
				<tr v-if="stats.average.energy > 0">
					<th scope="row">Average energy cost</th>
					<td>
						{{ stats.average.energy }}
						<img :src="'/images/ui/energy.png'" alt="" />
					</td>
				</tr>
				<tr v-if="stats.average.adrenaline > 0">
					<th scope="row">Average adrenaline cost</th>
					<td>
						{{ stats.average.adrenaline }}
						<img :src="'/images/ui/adrenaline.png'" alt="" />
					</td>
				</tr>
				<tr v-if="stats.average.health > 0">
					<th scope="row">Average health sacrifice</th>
					<td>
						{{ stats.average.health }}%
						<img :src="'/images/ui/health.png'" alt="" />
					</td>
				</tr>
				<tr v-if="stats.average.overcast > 0">
					<th scope="row">Average overcast</th>
					<td>
						{{ stats.average.overcast }}
						<img :src="'/images/ui/overcast.png'" alt="" />
					</td>
				</tr>
				<tr v-if="stats.average.activate > 0">
					<th scope="row">Average activation time</th>
					<td>
						{{ stats.average.activate }}
						<img :src="'/images/ui/activate.png'" alt="" />
					</td>
				</tr>
				<tr v-if="stats.average.recharge > 0">
					<th scope="row">Average recharge time</th>
					<td>
						{{ stats.average.recharge }}
						<img :src="'/images/ui/recharge.png'" alt="" />
					</td>
				</tr>
			</tbody>
		</table>
	</fieldset>
	<fieldset>
		<legend>Skills by attribute</legend>
		<div class="stats-chart">
			<PieChart :data="skillsByAttribute"></PieChart>
		</div>
	</fieldset>
	<fieldset>
		<legend>Skills by profession</legend>
		<div class="stats-chart">
			<PieChart :data="skillsByProfession"></PieChart>
		</div>
	</fieldset>
</template>

<style lang="less" scoped>
p a {
	margin-left: var(--space-m);
}

h2:not(:first-of-type) {
	margin-block: var(--space-xxl);
}

tbody th {
	text-align: left;
}

tr td {
	text-align: right;
}

td img {
	display: inline-block;
	height: 1em;
	vertical-align: middle;
	width: 1em;
}
</style>

<style lang="less">
@import "@/styles/breakpoints.less";

.stats-chart > .🥧 {
	margin: var(--space-xl) auto;

	label {
		padding: 0;
	}

	label span {
		max-width: 12em;
		font-size: 1.25rem;
		margin-top: 12.5%;
	}
}

fieldset {
	overflow: hidden;
	max-width: 100%;
}

.stats {
	text-align: center;

	legend {
		text-align: left;
	}

	table {
		margin-top: var(--space-l);
	}
}

.stats-chart > .🥧 > div:first-child {
	overflow: hidden;
}

@media @breakpoint_l {
	.stats-chart > .🥧 {
		max-width: 60%;

		label span {
			font-size: 1.8rem;
		}
	}
}
</style>
