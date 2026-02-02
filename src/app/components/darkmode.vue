<script lang="ts">
import { SessionSettings, SessionState } from "@/client/app/store/types";
import { defineComponent } from "vue";
import Toggle from "./toggle.vue";

const DarkMode = defineComponent({
	components: { Toggle },
	data() {
		return { enabled: this.$store.state.session.settings.darkMode };
	},
	watch: {
		enabled() {
			this.bodyClass(this.enabled);
		},
	},
	created() {
		this.bodyClass(this.enabled);
		this.$store.subscribe((mutation) => {
			const keys = Object.getOwnPropertyNames(mutation.payload ?? {});

			if (mutation.type == "session" && keys.includes("settings"))
				this.enabled = (mutation.payload as SessionState).settings.darkMode;
			else if (
				mutation.type == "session.settings" &&
				keys.includes("darkMode")
			) {
				this.enabled = (mutation.payload as SessionSettings).darkMode;
			}
		});
	},
	methods: {
		bodyClass(force: boolean) {
			document.body.classList.toggle("dm", force);
		},
		toggle() {
			this.$store.commit("session.settings", { darkMode: !this.enabled });
		},
	},
});

export default DarkMode;
</script>

<template>
	<label for="dm-toggle" title="Toggle dark mode">
		<span aria-hidden="true">
			<span class="☀️">☀️</span>
			<span class="🌙">🌙</span>
		</span>
		<Toggle
			id="dm-toggle"
			ref="toggle"
			:checked="enabled"
			@click="toggle"
		></Toggle>
	</label>
</template>

<style type="less" scoped>
body.dm .🌙 {
	display: inline;
}

body.dm .☀️ {
	display: none;
}

label {
	float: right;
}

label > span:first-child {
	margin-right: var(--space-m);
}

.🌙 {
	display: none;
}
</style>
