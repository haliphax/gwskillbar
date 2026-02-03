<script lang="ts" setup>
import pkg from "@/../package.json";
import SkillBar from "@/app/components/skill-bar.vue";
import router from "@/app/router";

const code = () => {
	if (!router.currentRoute.value.params.template) {
		// fallback template
		return "OQZSA4ATvAIg5ZkA2gAAAAIDA";
	}

	if (Array.isArray(router.currentRoute.value.params.template)) {
		return router.currentRoute.value.params.template.join("/");
	}

	return router.currentRoute.value.params.template;
};

addEventListener("hashchange", () => location.reload());
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
		<small>Guild Wars 1 skill builder</small>
	</h1>
	<a name="main"></a>
	<SkillBar :code="code()"></SkillBar>
	<footer>
		<ul class="x">
			<li><a href="https://github.com/haliphax/gwskillbar">source</a></li>
		</ul>
	</footer>
</template>

<style lang="less" scoped>
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

footer {
	display: block;
	border-top: 0.3em dotted var(--color-bg);
	margin-top: calc(var(--space-l) * 2);
	padding-top: var(--space-l);
	text-align: center;

	li {
		display: inline-block;
	}

	li:not(:last-child) {
		margin-right: var(--space-xl);
	}
}
</style>
