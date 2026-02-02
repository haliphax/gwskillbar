<script lang="ts">
import pkg from "@/../package.json";
import { defineComponent } from "vue";

const Home = defineComponent({
	data() {
		return {
			version: pkg.version,
		};
	},
});

export default Home;
</script>

<template>
	<h1>
		Skillbar
		<code>
			<a
				:href="`https://github.com/haliphax/gwskillbar/releases/tag/v${version}`"
				title="Release notes"
			>
				{{ version }}
			</a>
		</code>
		<small>Guild Wars 1 skill builder</small>
	</h1>
	<a name="main"></a>
	<p>Lorem ipsum dolor samet</p>
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
