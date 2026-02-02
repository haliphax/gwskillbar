import { shallowMount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./app.vue";
import router from "./router";
import store from "./store";

describe("App component", () => {
	let app: VueWrapper;

	beforeEach(() => {
		app = shallowMount(App, { global: { plugins: [router, store] } });
	});

	afterEach(() => {
		app.unmount();
	});

	it("has Dialogs component", () => {
		expect(app.findComponent("DIALOGS-STUB").exists()).toBe(true);
	});
});
