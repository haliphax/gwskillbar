<script lang="ts">
import { defineComponent } from "vue";
import DarkMode from "./components/darkmode.vue";
import Dialogs from "./components/dialogs.vue";
import { ROOT_URI } from "./constants";

const App = defineComponent({
	components: {
		DarkMode,
		Dialogs,
	},
	async beforeCreate() {
		document.cookie = [
			`skillbarClient=${this.$store.state.session.id}`,
			`path=${ROOT_URI}`,
			"samesite=strict",
			"secure",
		].join(";");
	},
});

export default App;
</script>

<template>
	<Dialogs></Dialogs>
	<a class="btn ⏩" href="#main">
		<span aria-hidden="true">⏩</span>
		Skip to main
	</a>
	<div class="📦">
		<header class="g">
			<div>
				<router-link :to="{ name: 'home' }" class="ib">Skillbar</router-link>
			</div>
			<div class="r">
				<DarkMode class="ib"></DarkMode>
			</div>
		</header>
		<main aria-live="assertive">
			<router-view></router-view>
		</main>
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

.⏩ {
	left: 0;
	margin: var(--space-l);
	position: absolute;
	top: -100%;
	transition: top 0.25s ease-in-out;
}

.⏩:focus {
	top: 0;
}

header {
	border-bottom: 1px solid var(--color-fg-subtle);
	grid-auto-flow: column;
	padding-bottom: var(--space-m);
}

header a {
	font-weight: 900;
}

@media @breakpoint_m {
	.📦 {
		padding-left: var(--space-xxl);
		padding-right: var(--space-xxl);
	}
}
</style>
