<script setup lang="ts">
import SkillIcon from "@/app/components/skill-icon.vue";
import { allegianceSkills, skillDescription } from "@/app/util/skills";

const props = defineProps<{ skills: SkillsData }>();
const barHeight = (value: number, scale = 100) => (value / scale) * 100;
const barStyles = (value: number, scale = 100) =>
	`--v:${scale === 100 ? value : barHeight(value, scale)}%;`;
const compensate = (stack1?: number | null, stack2?: number | null) =>
	barHeight(stack1 && stack2 ? stack1 : 0);

const bg = [];
for (let i = 0; i < 13; bg.push(i++));

const totalAct = (s: SkillData) => (s.activate ?? 0) + (s.recharge ?? 0);
</script>

<template>
	<div role="figure" class="📊">
		<div class="bg">
			<div v-for="_ in bg"></div>
		</div>
		<div v-for="(data, skill) of skills">
			<div
				v-if="data?.energy"
				class="en"
				:style="barStyles(data.energy, 65)"
				:title="`Energy: ${data.energy}`"
			></div>
			<div
				v-if="data?.health"
				class="hp"
				:style="barStyles(data.health, 100)"
				:title="`Health: ${data.health}%`"
			></div>
			<div
				v-if="data?.adrenaline"
				class="ad"
				:style="barStyles(data.adrenaline, 65)"
				:title="`Adrenaline: ${data.adrenaline}`"
			></div>
			<div
				v-if="data && (data.recharge || data.activate)"
				:style="`height: 100%;--com:${barHeight(
					compensate(data.activate, data.recharge),
					65,
				)}%;`"
			>
				<div
					v-if="data.activate"
					class="act"
					:style="barStyles(data.activate ?? 0, 65)"
					:title="`Activation time: ${data.activate ?? 0} (total ${totalAct(
						data,
					)})`"
				></div>
				<div
					class="re"
					:style="barStyles(data.recharge ?? 0, 65)"
					:title="`Recharge time: ${data.recharge ?? 0} (total ${totalAct(
						data,
					)})`"
				></div>
			</div>
			<a href="#" @click.prevent="skillDescription(skill)" :title="skill">
				<SkillIcon
					:name="skill"
					:allegiance-skill="allegianceSkills[skill]"
				></SkillIcon>
			</a>
		</div>
	</div>
</template>

<style lang="less" scoped>
@import "@/styles/breakpoints.less";

.📊 {
	--lines: 13;
	--column: 2.75em;
	display: inline-block;
	height: calc(var(--lines) * var(--column) * 0.25);
	margin-bottom: var(--space-l);
	width: auto;

	.bg {
		display: block;
		margin-bottom: calc(var(--lines) * var(--column) * -1 * 0.25);
		position: relative;
		width: 100%;

		> div {
			border-bottom: 1px solid var(--color-fg-subtle);
			display: block;
			height: calc(100% / var(--lines));
			opacity: 0.5;
			padding: 0;
			width: 100%;
			margin: 0 !important;
		}
	}
}

.icon {
	display: block;
	clear: both;
	max-height: 64px;
	max-width: 64px;
	width: var(--column);
	height: var(--column);
}

.📊 > div {
	display: inline-block;
	height: 100%;

	&:not(:last-child) {
		margin-right: calc(var(--column) / 8);
	}

	> div {
		margin-right: 1px;
		display: inline-block;

		&,
		div {
			position: relative;
			height: var(--v);
			width: 0.6em;
		}

		div:first-child {
			top: calc(100% - var(--v));
		}

		div:last-child {
			top: calc(100% - (var(--v) + (var(--com) * 2)));
		}
	}
}

.en {
	background-color: #5af;
}

.ad {
	background-color: #b7775d;
}

.hp {
	background-color: #f55;
}

.act {
	background-color: #a50;
}

.re {
	background-color: #fa0;
}

@media @breakpoint_s {
	.📊 {
		--column: 3em;
	}
}

@media @breakpoint_m {
	.📊 {
		--column: 3.6em;
	}
}

@media @breakpoint_l {
	.📊 {
		--column: 4em;
	}
}
</style>
