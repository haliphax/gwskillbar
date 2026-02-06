<script setup lang="ts">
import DarkMode from "./components/dark-mode.vue";
import Dialogs from "./components/dialogs.vue";
import { ROOT_URI } from "./constants";
import store from "./store";

document.cookie = [
	`skillbarClient=${store.state.session.id}`,
	`path=${ROOT_URI}`,
	"samesite=strict",
	"secure",
].join(";");
</script>

<template>
	<Dialogs></Dialogs>
	<div class="📦">
		<header class="g">
			<div>
				<router-link :to="{ name: 'home' }" class="ib">SkillBar</router-link>
			</div>
			<div class="r">
				<DarkMode class="ib"></DarkMode>
			</div>
		</header>
		<main aria-live="assertive">
			<router-view></router-view>
		</main>
		<footer>
			<ul class="x">
				<li><a href="https://github.com/haliphax/gwskillbar">source</a></li>
			</ul>
		</footer>
	</div>
</template>

<style lang="less" scoped>
@import "@/styles/breakpoints.less";

.📦 {
	margin: 0 auto;
	max-width: 960px;
	padding: var(--space-m);
	width: 100%;
}

header {
	border-bottom: 1px solid var(--color-fg-subtle);
	grid-auto-flow: column;
	padding-bottom: var(--space-m);
}

header a {
	font-weight: 900;
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

@media @breakpoint_m {
	.📦 {
		padding-left: var(--space-xxl);
		padding-right: var(--space-xxl);
	}
}
</style>
