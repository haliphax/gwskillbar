<script lang="ts" setup>
import { buildTree, searchTree } from "@/app/util/search";
import { skillDescription } from "@/app/util/skills";
import skills from "@/data/skills.json";
import { Ref, ref } from "vue";

const search = ref("");
const results: Ref<string[]> = ref([]);

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
</script>

<template>
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
				<a href="#" @click.prevent="skillDescription(result)">
					{{ result }}
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
