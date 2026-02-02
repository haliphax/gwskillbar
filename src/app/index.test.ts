import { describe, expect, it, vi } from "vitest";
import App from "./app.vue";
import router from "./router";
import store from "./store";

const { mockCreate, mockMount, mockUse } = vi.hoisted(() => ({
	mockCreate: vi.fn(() => ({
		mount: mockMount,
		use: mockUse,
	})),
	mockMount: vi.fn(),
	mockUse: vi.fn(),
}));

vi.mock("vue", () => ({ createApp: mockCreate }));
vi.mock("./app.vue", () => ({ default: "App" }));
vi.mock("./router", () => ({ default: "router" }));
vi.mock("./store", () => ({ default: "store" }));

await import("./index");

describe("entry point", () => {
	it("creates an application instance", () => {
		expect(mockCreate).toHaveBeenCalledWith(App);
	});

	it("uses plugins", () => {
		expect(mockUse).toHaveBeenCalledWith(router);
		expect(mockUse).toHaveBeenCalledWith(store);
	});

	it("mounts application", () => {
		expect(mockMount).toHaveBeenCalled();
	});
});
