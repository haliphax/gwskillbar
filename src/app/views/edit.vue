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

const headpieceAttribute = ref<string | "">("");

const primaryHeadpieceAttributes = computed(() => {
	const primary = professionsData.find(
		(p) => p.name === primaryProfession.value,
	);

	if (!primary) return [];

	const result: string[] = [];

	if (primary.primaryAttribute != null) {
		result.push(primary.primaryAttribute);
	}

	result.push(...primary.secondaryAttributes);

	return result;
});

const availableAttributes = computed(() =>
	getAvailableAttributes(
		professionsData,
		primaryProfession.value,
		secondaryProfession.value,
	),
);

const attributeRanks: Ref<Record<string, number>> = ref({});
const attributeRunes: Ref<Record<string, number>> = ref({});
watch(
	availableAttributes,
	(attrs) => {
		const next: Record<string, number> = {};
		const nextRunes: Record<string, number> = {};
		for (const attr of attrs) {
			next[attr] = attributeRanks.value[attr] ?? 0;
			nextRunes[attr] = attributeRunes.value[attr] ?? 0;
		}
		attributeRanks.value = next;
		attributeRunes.value = nextRunes;
	},
	{ immediate: true },
);

const remainingPoints = computed(
	() => ATTRIBUTE_POINTS_MAX - pointsSpent(attributeRanks.value),
);

const getDisplayRank = (attr: string): number => {
	const base = attributeRanks.value[attr] ?? 0;
	const headpieceBonus = headpieceAttribute.value === attr ? 1 : 0;
	const runeBonus = attributeRunes.value[attr] ?? 0;
	return base + headpieceBonus + runeBonus;
};

const getDisplayMin = (attr: string): number => {
	const headpieceBonus = headpieceAttribute.value === attr ? 1 : 0;
	const runeBonus = attributeRunes.value[attr] ?? 0;
	return headpieceBonus + runeBonus;
};

const getDisplayMax = (attr: string): number => {
	const headpieceBonus = headpieceAttribute.value === attr ? 1 : 0;
	const runeBonus = attributeRunes.value[attr] ?? 0;
	return 12 + headpieceBonus + runeBonus;
};

const onAttributeRankInput = (attr: string, e: Event) => {
	const raw = parseInt((e.target as HTMLInputElement).value, 10);
	const v = Number.isNaN(raw) ? 0 : raw;

	const displayMin = getDisplayMin(attr);
	const displayMax = getDisplayMax(attr);

	const effective =
		v < displayMin ? displayMin : v > displayMax ? displayMax : v;

	const headpieceBonus = headpieceAttribute.value === attr ? 1 : 0;
	const runeBonus = attributeRunes.value[attr] ?? 0;
	const base = effective - headpieceBonus - runeBonus;

	attributeRanks.value[attr] = base < 0 ? 0 : base > 12 ? 12 : base;
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
	const existingIndex = slots.value.indexOf(skill);
	const targetSkill = slots.value[slotIndex];

	// If moving a skill that is already on the bar onto another
	// occupied slot, just swap the two. This preserves elites and
	// PvE counts since we're only changing positions.
	if (
		existingIndex !== -1 &&
		existingIndex !== slotIndex &&
		targetSkill !== "No Skill"
	) {
		slots.value[existingIndex] = targetSkill;
		slots.value[slotIndex] = skill;
		return;
	}

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

watch(
	primaryProfession,
	() => {
		if (
			headpieceAttribute.value &&
			!primaryHeadpieceAttributes.value.includes(headpieceAttribute.value)
		) {
			headpieceAttribute.value = "";
		}
	},
	{ immediate: true },
);

const loadFromRoute = () => {
	const route = router.currentRoute.value;
	if (route.name !== "edit") return;

	const templateParam = route.params.template;
	const code = Array.isArray(templateParam)
		? templateParam.join("/")
		: String(templateParam ?? "");
	const pvp = route.params.mode === "pvp";

	if (!code || code === "new") return;

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
watch(
	() => router.currentRoute.value,
	() => {
		loadFromRoute();
	},
);

const currentBuild = computed((): BuildTemplate => {
	const attrs = availableAttributes.value;
	const attributes: Record<string, number> = {};
	for (const attr of attrs) {
		const rank = attributeRanks.value[attr] ?? 0;
		if (rank > 0) attributes[attr] = rank;
	}
	return {
		primary: primaryProfession.value,
		secondary: secondaryProfession.value,
		attributes,
		skills: [...slots.value],
	};
});

const generateTemplate = async () => {
	const code = encode(currentBuild.value);
	try {
		await navigator.clipboard.writeText(code);
		store.dispatch("alert", {
			text: "Template code has been copied to the clipboard.",
			title: "Template code",
		});
	} catch {
		store.dispatch("alert", { text: code, title: "Template code" });
	}
};

watch(
	() => [
		primaryProfession.value,
		secondaryProfession.value,
		attributeRanks.value,
		slots.value,
	],
	() => {
		const route = router.currentRoute.value;
		if (route.name !== "edit") return;
		const code = encode(currentBuild.value);
		const templateParam = route.params.template;
		const currentTemplate = Array.isArray(templateParam)
			? templateParam.join("/")
			: String(templateParam ?? "");
		const currentMode = route.params.mode === "pvp" ? "pvp" : undefined;
		const params: { template: string; mode?: string } = { template: code };
		if (currentMode === "pvp") params.mode = "pvp";
		if (currentTemplate === code && currentMode === params.mode) return;
		router.push({ name: "edit", params });
	},
	{ deep: true },
);
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
				><span aria-hidden="true">⏪</span> View build</router-link
			>
		</li>
		<li>
			<a href="#" class="btn" @click.prevent="generateTemplate">
				<span aria-hidden="true">📋</span> Template code
			</a>
		</li>
	</ul>
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
			<div class="attr-headpiece">
				<label for="headpiece-attr">Headpiece rune:</label>
				<select id="headpiece-attr" v-model="headpieceAttribute">
					<option value="">None</option>
					<option
						v-for="attr in primaryHeadpieceAttributes"
						:key="attr"
						:value="attr"
					>
						{{ attr }}
					</option>
				</select>
			</div>
			<hr />
			<div class="attr-list">
				<span v-for="attr in availableAttributes" :key="attr" class="attr-row">
					<label :for="`attr-${attr}`">{{ attr }}</label>
					<select
						v-if="primaryHeadpieceAttributes.includes(attr)"
						:id="`rune-${attr}`"
						v-model.number="attributeRunes[attr]"
					>
						<option v-for="n in [0, 1, 2, 3]" :key="n" :value="n">
							+{{ n }}
						</option>
					</select>
					<input
						:id="`attr-${attr}`"
						type="number"
						:min="getDisplayMin(attr)"
						:max="getDisplayMax(attr)"
						:value="getDisplayRank(attr)"
						@input="onAttributeRankInput(attr, $event)"
					/>
				</span>
			</div>
		</div>
	</details>
	<fieldset class="skillbar-fieldset">
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

.skillbar-fieldset {
	align-items: center;
	display: flex;
	flex-direction: column;
}

.section summary {
	font-size: var(--font-heading);
	font-weight: bold;
}

.section span.b {
	margin-bottom: var(--space-l);
}

.attr-headpiece {
	align-items: center;
	display: flex;
	gap: var(--space-m);
	margin-top: var(--space-m);
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
