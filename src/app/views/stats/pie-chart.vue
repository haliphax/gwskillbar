<script setup lang="ts">
import { onBeforeMount, ref, Ref } from "vue";

type slice = {
	key: string;
	percent: number;
	rotation: number;
	value: number;
};

const props = defineProps<{ data: Map<string, number>; width?: number }>();

const isNumber = /^\d+(\.\d+)?$/;
const slices: Ref<slice[]> = ref([]);

const calculate = () => {
	slices.value = [];
	const valIter = props.data.entries();

	let entry: IteratorResult<[string, number]>;
	let total = 0;
	let rotation = 0.0;

	while ((entry = valIter.next())) {
		if (entry.done) break;

		const [key, value] = entry.value;

		total += value;
		slices.value.push({
			key,
			percent: 0,
			rotation,
			value: value,
		});
	}

	slices.value.sort((a, b) => {
		const a1 = isNumber.test(a.key)
			? parseFloat(a.key)
			: Number.MAX_SAFE_INTEGER;
		const b1 = isNumber.test(b.key)
			? parseFloat(b.key)
			: Number.MAX_SAFE_INTEGER;

		return a.value === b.value ? a1 - b1 : b.value - a.value;
	});

	for (let i = 0; i < slices.value.length; i++) {
		const s = slices.value[i];

		s.percent = s.value / total;
		s.rotation = rotation;
		rotation += 360 * s.percent;
	}
};

const styles = (slice: slice) =>
	[`--p:${slice.percent}`, `--r:${slice.rotation}deg`].join(";");

addEventListener("hashchange", calculate);
onBeforeMount(calculate);
</script>

<template>
	<div class="🥧" role="figure">
		<div v-for="(s, idx) in slices" :key="s.key" :style="styles(s)">
			<div :class="`🍕 🌈${idx}`"></div>
		</div>
		<div v-for="(s, idx) in slices" :key="s.key" :style="styles(s)">
			<div :class="`📝 🌈${idx}`">
				<label>
					<span>{{ s.key }}</span>
				</label>
			</div>
		</div>
	</div>
	<div>
		<h3 class="sr">Legend</h3>
		<table>
			<thead>
				<tr>
					<th>Key</th>
					<th>Value</th>
					<th>Count</th>
					<th><abbr title="Percentage">%</abbr></th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(s, idx) in slices" :key="s.key">
					<td>
						<span
							:id="`🍕🌈${s.key}`"
							:class="`🌈 🌈${idx}`"
							:style="styles(s)"
						>
						</span>
					</td>
					<td>{{ s.key }}</td>
					<td>{{ s.value }}</td>
					<td>{{ (s.percent * 100).toFixed(2) }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style lang="less" scoped>
@import "@/styles/breakpoints.less";

label {
	cursor: default;
}

.🥧 {
	aspect-ratio: 1;
	gap: 0;
	isolation: isolate;
	margin: 0 auto;
	padding: 0;
	position: relative;
}

.🥧 > div {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
}

:is(.🍕, .📝) {
	aspect-ratio: 1;
	place-content: center;
	position: relative;
	transform: rotate(var(--r));
	top: 0;
}

.🍕::before {
	background-image: conic-gradient(var(--c) calc(var(--p) * 100%), #0000 0);
	background-position: 50%;
	border-radius: 50%;
	content: "";
	display: block;
	inset: 1px;
	position: absolute;
}

.📝 label {
	-webkit-text-stroke: 0.1em #000;
	bottom: 1px;
	color: #fff;
	display: block;
	font-size: 2rem;
	height: 100%;
	left: 1px;
	padding: var(--space-l);
	paint-order: stroke fill;
	position: absolute;
	right: 1px;
	stroke-width: 0.1em;
	stroke: 1px #000;
	text-align: center;
	top: 1px;
	transform: rotate(calc(var(--p) * 180deg));
	width: 100%;
	z-index: 999;
}

.📝 label span {
	display: inline-block;
	transform: rotate(calc(var(--p) * -180deg - var(--r)));
	max-width: 16rem;
}

.🌈 {
	background-color: var(--c);
	border: 1px solid var(--color-outline);
	display: block;
	height: var(--space-l);
	margin: 0 auto;
	width: var(--space-l);
}

.🌈0 {
	--c: #d33682;
}

.🌈1 {
	--c: #6c71c4;
}

.🌈2 {
	--c: #b58900;
}

.🌈3 {
	--c: #cb4b16;
}

.🌈4 {
	--c: #859900;
}

.🌈5 {
	--c: #268bd2;
}

.🌈6 {
	--c: #dc322f;
}

.🌈7 {
	--c: #2aa198;
}
</style>
