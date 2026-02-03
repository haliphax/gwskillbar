<script lang="ts" setup>
import pkg from "@/../package.json";
import router from "@/app/router";
import { ref } from "vue";

const DEFAULT_BUILD = "OAVTEYDfG6GYCwmsOIm0GEAoqC";
const code = ref("");

const submit = () => {
	const trimmed = code.value.trim();
	const template = (trimmed.length > 0 ? trimmed : DEFAULT_BUILD).split("/");
	router.push({ name: "view", params: { template } });
};
</script>

<template>
	<h1>
		SkillBar
		<code>
			<a
				:href="`https://github.com/haliphax/gwskillbar/releases/tag/v${pkg.version}`"
				title="Release notes"
			>
				{{ pkg.version }}
			</a>
		</code>
		<small>Guild Wars Reforged skill template builder</small>
	</h1>
	<a name="main"></a>
	<form @submit.prevent="submit">
		<fieldset class="g">
			<legend>Template code parser</legend>
			<span>
				<label for="code">Code:</label>
				<input
					id="code"
					v-model="code"
					:placeholder="DEFAULT_BUILD"
					type="text"
				/>
			</span>
			<span>
				<button type="submit">
					<span aria-hidden="true">👀</span>
					View build
				</button>
			</span>
		</fieldset>
	</form>
</template>

<style lang="less" scoped>
@import "@/styles/breakpoints.less";

code {
	font-size: 0.75em;
	position: relative;
	top: -0.125em;

	a {
		color: inherit;
		text-decoration: none;

		&:hover,
		&:focus {
			text-decoration: underline;
		}
	}
}

small {
	color: var(--color-fg-subtle);
	display: block;
	font-size: 0.5em;
}

fieldset {
	padding: var(--space-xl);
}

@media @breakpoint_m {
	.g > span {
		grid-area: 1 / span 2;
	}
}
</style>
