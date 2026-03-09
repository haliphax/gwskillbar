import { describe, expect, it, vi } from "vitest";
import Edit from "./views/edit.vue";
import Home from "./views/home.vue";
import Stats from "./views/stats.vue";
import View from "./views/view.vue";

const { mockCreateRouter, mockCreateHistory, mockDefineComponent } = vi.hoisted(
	() => ({
		mockCreateRouter: vi.fn(),
		mockCreateHistory: vi.fn(() => "mockCreateHistory"),
		mockDefineComponent: vi.fn(),
	}),
);

vi.mock("vue", () => ({
	Component: "Component",
	defineComponent: mockDefineComponent,
}));
vi.mock("vue-router", () => ({
	createRouter: mockCreateRouter,
	createWebHashHistory: mockCreateHistory,
}));
vi.mock("./views/edit.vue", () => ({ default: "Edit" }));
vi.mock("./views/home.vue", () => ({ default: "Home" }));
vi.mock("./views/stats.vue", () => ({ default: "Stats" }));
vi.mock("./views/view.vue", () => ({ default: "View" }));

await import("./router");

describe("router", () => {
	it("creates a router instance", () => {
		expect(mockCreateRouter).toHaveBeenCalled();
	});

	it("uses web history", () => {
		expect(mockCreateHistory).toHaveBeenCalled();
		expect(mockCreateRouter.mock.lastCall![0].history).toBe(
			"mockCreateHistory",
		);
	});

	it("assigns routes for main views", () => {
		const routes: { component: unknown }[] =
			mockCreateRouter.mock.lastCall![0].routes;
		const components = routes.map((c) => c.component);

		expect(components).toContain(Edit);
		expect(components).toContain(Home);
		expect(components).toContain(View);
		expect(components).toContain(Stats);
	});
});
