<script lang="ts" setup>
import ProfessionIcon from "@/app/components/profession-icon.vue";
import SkillIcon from "@/app/components/skill-icon.vue";
import WikiLink from "@/app/components/wiki-link.vue";
import attributes from "@/app/data/attributes.json";
import professions from "@/app/data/professions.json";
import skills from "@/app/data/skills.json";
import { onBeforeMount, ref, Ref } from "vue";

const CHAR_MAP =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const primary: Ref<string> = ref("");
const secondary: Ref<string> = ref("");
const attribs: Ref<{ [p: string]: number }> = ref({});
const skillBar: Ref<string[]> = ref([]);

const extract = (bits: string[], count: number): number =>
	parseInt(bits.splice(0, count).reverse().join(""), 2);

const load = () => {
	attribs.value = {};
	skillBar.value = [];
	const code = location.hash.slice(2);

	if (!code) {
		return;
	}

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
			const skillID = extract(bits, skillBits).toString();
			skillBar.value.push(
				decodeURIComponent((skills as { [p: string]: string })[skillID]),
			);
		}
	} catch (ex) {
		throw "Invalid skill";
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
				<WikiLink :path="skill" :title="skill" v-if="skill != 'No Skill'">
					<SkillIcon :name="skill" :size="64"></SkillIcon>
				</WikiLink>
				<SkillIcon :name="skill" :size="64" v-else></SkillIcon>
			</li>
		</ul>
		<ol class="skills">
			<li v-for="(skill, idx) in skillBar" :key="idx">
				<SkillIcon :name="skill" :size="24"></SkillIcon>
				<WikiLink :path="skill" v-if="skill != 'No Skill'">
					{{ skill == "No Skill" ? "(Optional)" : skill }}
				</WikiLink>
				<span v-else>{{ skill == "No Skill" ? "(Optional)" : skill }}</span>
			</li>
		</ol>
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
