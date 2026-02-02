import store from "@/app/store";
import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import DarkMode from "./darkmode.vue";
import Toggle from "./toggle.vue";

describe("DarkMode component", () => {
	let darkMode: VueWrapper;

	beforeEach(() => {
		store.state.session.settings.darkMode = false;
		darkMode = mount(DarkMode, { global: { plugins: [store] } });
	});

	afterEach(() => {
		darkMode.unmount();
	});

	it("toggles settings.darkmode", () => {
		const toggle = darkMode.findComponent(Toggle);

		expect(store.state.session.settings.darkMode).toBe(false);
		toggle.vm.$emit("click");
		expect(store.state.session.settings.darkMode).toBe(true);
	});

	it("reacts to settings state changes", () => {
		const data = darkMode.vm.$data as { enabled: boolean };

		expect(data.enabled).toBe(false);
		store.commit("session", { settings: { darkMode: true } });
		expect(data.enabled).toBe(true);
	});

	it("reacts to settings.darkmode state changes", () => {
		const data = darkMode.vm.$data as { enabled: boolean };

		expect(data.enabled).toBe(false);
		store.commit("session.settings", { darkMode: true });
		expect(data.enabled).toBe(true);
	});
});
