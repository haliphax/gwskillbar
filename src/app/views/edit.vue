<script lang="ts" setup>
import SkillIcon from "@/app/components/skill-icon.vue";
import router from "@/app/router";
import store from "@/app/store";
import {
	ATTRIBUTE_POINTS_MAX,
	getAvailableAttributes,
	pointsSpent,
} from "@/app/util/attributes";
import { buildTree, searchTree } from "@/app/util/search";
import {
	isAllegianceSkill,
	isEliteSkill,
	isPveOnlySkill,
	isSkillAvailableForProfessions,
	skillDescHtml,
	skillsData,
	skillStatsFragment,
} from "@/app/util/skills";
import { decode, encode } from "@/app/util/template";
import professions from "@/data/professions.json";
import skills from "@/data/skills.json";
import { computed, onBeforeMount, Ref, ref, watch } from "vue";

type ProfessionEntry = {
	name: string;
	primaryAttribute: string | null;
	secondaryAttributes: string[];
};

const professionsData = professions as ProfessionEntry[];
const professionList = professionsData.map((p) => p.name);
const primaryProfession = ref("Warrior");
const secondaryProfession = ref("Ranger");
const secondaryProfessionOptions = computed(() =>
	professionList.filter((p) => p !== primaryProfession.value),
);

const availableAttributes = computed(() =>
	getAvailableAttributes(
		professionsData,
		primaryProfession.value,
		secondaryProfession.value,
	),
);

const attributeRanks: Ref<Record<string, number>> = ref({});
watch(
	availableAttributes,
	(attrs) => {
		const next: Record<string, number> = {};
		for (const attr of attrs) {
			next[attr] = attributeRanks.value[attr] ?? 0;
		}
		attributeRanks.value = next;
	},
	{ immediate: true },
);

const remainingPoints = computed(
	() => ATTRIBUTE_POINTS_MAX - pointsSpent(attributeRanks.value),
);

const onAttributeRankInput = (attr: string, e: Event) => {
	const raw = parseInt((e.target as HTMLInputElement).value, 10);
	const v = Number.isNaN(raw) ? 0 : Math.min(12, Math.max(0, raw));
	attributeRanks.value[attr] = v;
};

const search = ref("");
const results: Ref<string[]> = ref([]);
const slots = ref<string[]>(Array(8).fill("No Skill"));
const draggedSkill = ref<string | null>(null);

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

const filteredResults = computed(() =>
	results.value.filter((skill) =>
		isSkillAvailableForProfessions(
			skill,
			primaryProfession.value,
			secondaryProfession.value,
		),
	),
);

const onDragStart = (skill: string, e: DragEvent) => {
	if (!e.dataTransfer) return;
	e.dataTransfer.setData("text/plain", skill);
	e.dataTransfer.effectAllowed = "copy";
};

const placeSkillInSlot = (skill: string, slotIndex: number) => {
	if (skill !== "No Skill") {
		for (let i = 0; i < slots.value.length; i++) {
			if (i !== slotIndex && slots.value[i] === skill) {
				slots.value[i] = "No Skill";
			}
		}

		if (isEliteSkill(skill)) {
			for (let i = 0; i < slots.value.length; i++) {
				if (i !== slotIndex && isEliteSkill(slots.value[i])) {
					slots.value[i] = "No Skill";
				}
			}
		}

		if (isPveOnlySkill(skill)) {
			const pveIndices = slots.value
				.map((s, i) => (isPveOnlySkill(s) ? i : -1))
				.filter((i) => i >= 0 && i !== slotIndex);
			if (pveIndices.length >= 3) {
				slots.value[Math.min(...pveIndices)] = "No Skill";
			}
		}
	}
	slots.value[slotIndex] = skill;
};

const onDrop = (slotIndex: number, e: DragEvent) => {
	e.preventDefault();
	const skill = e.dataTransfer?.getData("text/plain");
	if (skill) placeSkillInSlot(skill, slotIndex);
};

const onResultIconClick = (skill: string) => {
	draggedSkill.value = draggedSkill.value === skill ? null : skill;
};

const onSlotClick = (slotIndex: number, e: MouseEvent) => {
	if (draggedSkill.value) {
		placeSkillInSlot(draggedSkill.value, slotIndex);
		draggedSkill.value = null;
		e.preventDefault();
		e.stopPropagation();
	}
};

const onPrimaryProfessionChange = () => {
	if (primaryProfession.value === secondaryProfession.value) {
		secondaryProfession.value = secondaryProfessionOptions.value[0] ?? "";
	}
};

const loadFromRoute = () => {
	const route = router.currentRoute.value;
	if (route.name !== "edit") return;

	const templateParam = route.params.template;
	const code = Array.isArray(templateParam)
		? templateParam.join("/")
		: String(templateParam ?? "");
	const pvp = route.params.mode === "pvp";

	if (!code) return;

	try {
		const build = decode(code, pvp);
		primaryProfession.value = build.primary;
		secondaryProfession.value = build.secondary;
		attributeRanks.value = { ...build.attributes };
		slots.value = [...build.skills];
	} catch (ex) {
		store.dispatch("alert", {
			text: (ex as Error).toString(),
			title: "Error",
		});
	}
};

onBeforeMount(loadFromRoute);

const generateTemplate = () => {
	const attrs = availableAttributes.value;
	const attributes: Record<string, number> = {};
	for (const attr of attrs) {
		const rank = attributeRanks.value[attr] ?? 0;
		if (rank > 0) attributes[attr] = rank;
	}
	const build: BuildTemplate = {
		primary: primaryProfession.value,
		secondary: secondaryProfession.value,
		attributes,
		skills: [...slots.value],
	};
	const code = encode(build);
	store.dispatch("alert", { text: code, title: "Template code" });
};
</script>

<template>
	<details class="g section" open>
		<summary>Professions</summary>
		<div>
			<span class="b">
				<label for="primary-profession">Primary:</label>
				<select
					id="primary-profession"
					v-model="primaryProfession"
					@change="onPrimaryProfessionChange"
				>
					<option v-for="p in professionList" :key="p" :value="p">
						{{ p }}
					</option>
				</select>
			</span>
			<span>
				<label for="secondary-profession">Secondary:</label>
				<select id="secondary-profession" v-model="secondaryProfession">
					<option v-for="p in secondaryProfessionOptions" :key="p" :value="p">
						{{ p }}
					</option>
				</select>
			</span>
		</div>
	</details>
	<details class="g section" open>
		<summary>Attributes</summary>
		<div>
			<span>Remaining: {{ remainingPoints }} / {{ ATTRIBUTE_POINTS_MAX }}</span>
			<hr />
			<div class="attr-list">
				<span v-for="attr in availableAttributes" :key="attr" class="attr-row">
					<label :for="`attr-${attr}`">{{ attr }}</label>
					<input
						:id="`attr-${attr}`"
						type="number"
						min="0"
						max="12"
						:value="attributeRanks[attr] ?? 0"
						@input="onAttributeRankInput(attr, $event)"
					/>
				</span>
			</div>
		</div>
	</details>
	<fieldset>
		<legend>Skill bar</legend>
		<ul class="skillbar x g">
			<li
				v-for="(skill, idx) in slots"
				:key="idx"
				@click.capture="onSlotClick(idx, $event)"
				@dragover.prevent
				@drop="onDrop(idx, $event)"
			>
				<a
					v-if="skill !== 'No Skill'"
					href="#"
					class="ib"
					:class="{ 'drag-pending': draggedSkill === skill }"
					:title="skill"
					@click.prevent="onResultIconClick(skill)"
					@dragstart="onDragStart(skill, $event)"
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
		<ul class="x results">
			<li v-for="result in filteredResults" :key="result">
				<a
					href="#"
					class="ib"
					:class="{ 'drag-pending': draggedSkill === result }"
					draggable="true"
					:title="result"
					@click.prevent="onResultIconClick(result)"
					@dragstart="onDragStart(result, $event)"
				>
					<SkillIcon
						:name="result"
						:allegianceSkill="isAllegianceSkill(result)"
					></SkillIcon>
				</a>
				<div class="result-meta">
					<div class="result-head">
						<span class="result-name">{{ result }}</span>
						<template v-if="(skillsData as SkillsData)[result]">
							<div class="result-attr-line">
								<img
									:alt="''"
									class="vam"
									:src="`/images/professions/${(skillsData as SkillsData)[result].profession ?? 'None'}.png`"
									:title="
										(skillsData as SkillsData)[result].profession ??
										'Any profession'
									"
								/>
								<span class="result-attribute">
									{{
										(skillsData as SkillsData)[result].attribute ??
										"No Attribute"
									}}
								</span>
							</div>
							<ul
								v-if="skillStatsFragment(result)"
								class="x result-stats"
								v-html="skillStatsFragment(result)"
							></ul>
						</template>
					</div>
					<small
						v-if="skillDescHtml(result)"
						class="result-desc"
						v-html="skillDescHtml(result)"
					></small>
				</div>
			</li>
		</ul>
	</form>
</template>

<style lang="less" scoped>
@import "@/styles/breakpoints.less";

fieldset,
.section {
	margin-top: var(--space-xl);
}

fieldset {
	padding: var(--space-xl);
}

.section summary {
	font-size: var(--font-heading);
	font-weight: bold;
}

.section span.b {
	margin-bottom: var(--space-l);
}

.attr-list {
	display: grid;
	gap: var(--space-m);
	grid-column: 1 / -1;
}

.attr-list .attr-row {
	align-items: center;
	display: flex;
	gap: var(--space-m);
	margin-inline: calc(-1 * var(--space-m));
	padding-inline: var(--space-m);

	&:nth-child(2n) {
		background-color: var(--color-bg);
	}

	label {
		flex: 1 1 auto;
		min-width: 0;
	}

	input {
		flex: 0 1 auto;
	}
}

.results li {
	align-items: flex-start;
	display: flex;
	gap: var(--space-m);
	padding-bottom: var(--space-l);
	padding-top: var(--space-l);

	&:first-child {
		padding-top: 0;
	}

	&:last-child {
		padding-bottom: 0;
	}

	&:not(:last-child) {
		border-bottom: 1px solid var(--color-fg-subtle);
	}

	> a:first-child {
		height: 64px;
		margin-bottom: 0;
		padding-bottom: 0;
		width: 64px;

		span,
		img {
			height: 64px;
			width: 64px;
		}
	}
}

.result-meta {
	display: flex;
	flex-direction: column;
	flex: 1;
	gap: var(--space-s);
	min-width: 0;
}

.result-head {
	align-items: center;
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-m);
	justify-content: space-between;
}

.result-name {
	font-weight: bold;
}

.result-attr-line {
	align-items: center;
	display: flex;
	gap: var(--space-s);

	img {
		height: 1.4em;
		width: 1.4em;
	}
}

.result-attribute {
	color: var(--color-fg-subtle);
	font-size: 0.9em;
}

.result-stats {
	display: flex;
	flex-wrap: wrap;
	font-size: 0.9em;
	gap: var(--space-s);
}

.result-desc {
	color: var(--color-fg-subtle);
	margin: 0;
}

a.drag-pending {
	outline: 2px solid var(--color-em);
	outline-offset: 2px;
}
</style>
