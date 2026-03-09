<script lang="ts">
import { defineComponent } from "vue";

const Toggle = defineComponent({
	props: {
		checked: {
			default: null,
			type: Boolean,
		},
		id: {
			type: String,
			default: "",
		},
	},
	emits: ["update:checked"],
	data() {
		return { defaultChecked: false };
	},
	computed: {
		isChecked() {
			return this.checked ?? this.defaultChecked;
		},
	},
	methods: {
		onChange(e: Event) {
			const target = e.target as HTMLInputElement | null;
			const next = target ? target.checked : !this.isChecked;

			if (this.checked == null) {
				this.defaultChecked = next;
			}

			this.$emit("update:checked", next);
		},
		proxyClick(e: KeyboardEvent) {
			if (e.key != "Enter") return;
			(this.$refs.checkbox as HTMLInputElement).click();
		},
	},
});

export default Toggle;
</script>

<template>
	<span class="t">
		<input
			:id="id"
			ref="checkbox"
			:checked="isChecked"
			class="sr"
			tabindex="-1"
			type="checkbox"
			@change="onChange"
		/>
		<label :for="id" tabindex="0" @keypress="proxyClick($event)">
			<span class="sr">Toggle</span>
		</label>
	</span>
</template>

<style lang="less" scoped>
.t {
	--t-height: var(--space-l);
	--t-offset: var(--space-xs);
	display: inline-block;
	height: var(--t-height);
	position: relative;
	top: var(--space-xs);
	width: var(--space-xxl);
}

.t label {
	background: var(--color-fg);
	border-radius: var(--t-height);
	bottom: 0;
	cursor: pointer;
	display: block;
	left: 0;
	position: absolute;
	right: 0;
	top: 0;
}

.t label::before {
	--size: calc(var(--t-height) - (var(--t-offset) * 2));
	background: var(--color-bg);
	border-radius: 50%;
	content: "";
	height: var(--size);
	left: var(--t-offset);
	position: absolute;
	top: var(--t-offset);
	width: var(--size);
}

.t input:checked + label::before {
	left: auto;
	right: var(--t-offset);
}
</style>
