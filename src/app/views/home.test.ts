import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./home.vue";

const { mockRouter } = vi.hoisted(() => ({
	mockRouter: {
		push: vi.fn(),
	},
}));

vi.mock("@/app/router", () => ({
	default: mockRouter,
}));

describe("Home view", () => {
	const originalImportMeta = import.meta.env.VITE_APP_VERSION;
	let home: VueWrapper;

	beforeEach(() => {
		import.meta.env.VITE_APP_VERSION = "1.2.3-test";
		mockRouter.push.mockClear();

		home = mount(Home);
	});

	afterEach(() => {
		home.unmount();
		import.meta.env.VITE_APP_VERSION = originalImportMeta;
	});

	it("renders the header and version link", async () => {
		const heading = home.get("h1");
		expect(heading.text()).toContain("SkillBar");

		const link = home.get("code a");

		expect(link.text()).toBe("1.2.3-test");
		expect(link.attributes("href")).toBe(
			"https://github.com/haliphax/gwskillbar/releases/tag/v1.2.3-test",
		);
	});

	it("uses the placeholder build when the input is empty", async () => {
		const input = home.get("input#code");
		const form = home.get("form");

		// Ensure the model is empty so the placeholder is used.
		await input.setValue("");

		const placeholder = input.attributes("placeholder")!;

		await form.trigger("submit.prevent");

		expect(mockRouter.push).toHaveBeenCalledTimes(1);
		expect(mockRouter.push).toHaveBeenCalledWith({
			name: "view",
			params: { template: placeholder.split("/") },
		});
	});

	it("uses the entered code when present", async () => {
		const input = home.get("input#code");
		const form = home.get("form");

		await input.setValue("asdf/hjkl");
		await form.trigger("submit.prevent");

		expect(mockRouter.push).toHaveBeenCalledTimes(1);
		expect(mockRouter.push).toHaveBeenCalledWith({
			name: "view",
			params: { template: ["asdf", "hjkl"] },
		});
	});
});
