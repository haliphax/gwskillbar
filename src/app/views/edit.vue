<script lang="ts" setup>
import SkillIcon from "@/app/components/skill-icon.vue";
import store from "@/app/store";
import { buildTree, searchTree } from "@/app/util/search";
import { isAllegianceSkill, skillDescription } from "@/app/util/skills";
import { encode } from "@/app/util/template";
import skills from "@/data/skills.json";
import { Ref, ref } from "vue";

const search = ref("");
const results: Ref<string[]> = ref([]);
const slots = ref<string[]>(Array(8).fill("No Skill"));

const tree = buildTree(
	Object.values(skills)
		.filter((v) => !v.includes("(PvP)"))
		.map((v) => decodeURIComponent(v)),
);

const submit = () => {
	if (search.value.length < 3) {
		results.value = [];
		return;
	}

	results.value = searchTree(tree, search.value);
};

const onDragStart = (skill: string, e: DragEvent) => {
	if (!e.dataTransfer) return;
	e.dataTransfer.setData("text/plain", skill);
	e.dataTransfer.effectAllowed = "copy";
};

const onDrop = (slotIndex: number, e: DragEvent) => {
	e.preventDefault();
	const skill = e.dataTransfer?.getData("text/plain");
	if (skill) slots.value[slotIndex] = skill;
};

const generateTemplate = () => {
	const build: BuildTemplate = {
		primary: "Warrior",
		secondary: "Ranger",
		attributes: {},
		skills: [...slots.value],
	};
	const code = encode(build, false);
	store.dispatch("alert", { text: code, title: "Template code" });
};
</script>

<template>
	<fieldset>
		<legend>Skill bar</legend>
		<ul class="skillbar x g">
			<li
				v-for="(skill, idx) in slots"
				:key="idx"
				@dragover.prevent
				@drop="onDrop(idx, $event)"
			>
				<a
					v-if="skill !== 'No Skill'"
					href="#"
					class="ib"
					:title="skill"
					@click.prevent="skillDescription(skill)"
				>
					<SkillIcon
						:name="skill"
						:allegianceSkill="isAllegianceSkill(skill)"
					></SkillIcon>
				</a>
				<SkillIcon v-else name="No Skill"></SkillIcon>
			</li>
		</ul>
		<button type="button" class="btn" @click="generateTemplate">
			Generate template code
		</button>
	</fieldset>
	<form @submit.prevent="submit">
		<fieldset class="g">
			<legend>Skill search</legend>
			<span>
				<label for="search">Skill:</label>
				<input
					id="search"
					v-model="search"
					placeholder="Skill name, 3 character minimum"
					type="text"
					@keyup="submit"
				/>
			</span>
		</fieldset>
		<ul>
			<li v-for="result in results" :key="result">
				<a
					href="#"
					class="ib"
					draggable="true"
					:title="result"
					@click.prevent="skillDescription(result)"
					@dragstart="onDragStart(result, $event)"
				>
					<SkillIcon
						:name="result"
						:allegianceSkill="isAllegianceSkill(result)"
					></SkillIcon>
				</a>
			</li>
		</ul>
	</form>
</template>

<style lang="less" scoped>
@import "@/styles/breakpoints.less";

fieldset {
	margin-top: var(--space-xl);
	padding: var(--space-xl);
}
</style>
