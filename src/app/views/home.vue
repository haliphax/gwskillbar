<script lang="ts" setup>
import pkg from "@/../package.json";
import Skillbar from "@/app/components/skillbar.vue";
import router from "@/app/router";

const code = () => {
	return (
		(router.currentRoute.value.params.template as string | undefined) ??
		"OQZSA4ATvAIg5ZkA2gAAAAIDA"
	);
};

addEventListener("hashchange", () => location.reload());
</script>

<template>
	<h1>
		Skillbar
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
	<Skillbar :code="code()"></Skillbar>
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
