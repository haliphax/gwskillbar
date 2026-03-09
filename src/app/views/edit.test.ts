/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Edit from "./edit.vue";

const {
	mockRouter,
	mockEncode,
	mockStoreDispatch,
	mockClipboardWriteText,
	currentRoute,
} = vi.hoisted(() => {
	const route = {
		name: "edit",
		params: { template: "CODE" },
		query: { q: "1" },
	};

	return {
		currentRoute: route,
		mockRouter: {
			currentRoute: { value: route },
			push: vi.fn(),
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		mockEncode: vi.fn((_) => "ENCODED-TEMPLATE"),
		mockStoreDispatch: vi.fn(),
		mockClipboardWriteText: vi.fn().mockResolvedValue(undefined),
	};
});

vi.mock("@/app/router", () => ({
	default: mockRouter,
}));

vi.mock("@/app/util/template", () => ({
	encode: (build: BuildTemplate) => mockEncode(build),
	decode: vi.fn(),
}));

vi.mock("@/app/store", () => ({
	default: {
		dispatch: mockStoreDispatch,
	},
}));

// Stub child components that are not relevant to these tests.
vi.mock("@/app/components/skill-icon.vue", () => ({
	default: {
		name: "SkillIcon",
		template: "<span><slot /></span>",
	},
}));

vi.mock("@/app/components/pvp-mode-toggle.vue", () => ({
	default: {
		name: "PvpModeToggle",
		props: ["pvp"],
		template: "<button type='button'></button>",
	},
}));

describe("Edit view", () => {
	let edit: VueWrapper;

	beforeEach(() => {
		mockRouter.push.mockClear();
		mockEncode.mockClear();
		mockStoreDispatch.mockClear();
		mockClipboardWriteText.mockClear();

		// Ensure navigator.clipboard is available for generateTemplate().
		globalThis.navigator = {
			...globalThis.navigator,
			clipboard: {
				writeText: mockClipboardWriteText,
				read: vi.fn(),
				readText: vi.fn(),
				write: vi.fn(),
				addEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
				removeEventListener: vi.fn(),
			},
		};

		edit = mount(Edit);
	});

	afterEach(() => {
		edit.unmount();
	});

	it("routes between edit and edit-pvp while preserving params and query", () => {
		// Start on the non-PvP route.
		mockRouter.currentRoute.value = { ...currentRoute, name: "edit" };

		(edit.vm as any).togglePvp(true);

		expect(mockRouter.push).toHaveBeenCalledWith({
			name: "edit-pvp",
			params: currentRoute.params,
			query: currentRoute.query,
		});

		// Switch to PvP route and toggle back to PvE.
		mockRouter.currentRoute.value = { ...currentRoute, name: "edit-pvp" };
		mockRouter.push.mockClear();

		(edit.vm as any).togglePvp(false);

		expect(mockRouter.push).toHaveBeenCalledWith({
			name: "edit",
			params: currentRoute.params,
			query: currentRoute.query,
		});
	});

	it("encodes the current build, copies it to the clipboard, and alerts", async () => {
		await (edit.vm as any).generateTemplate();

		expect(mockEncode).toHaveBeenCalledTimes(1);

		// Ensure the build passed to encode has eight skills as in the default slots.
		const [build] = mockEncode.mock.calls[0] as [BuildTemplate];
		expect(build.skills).toHaveLength(8);

		expect(mockClipboardWriteText).toHaveBeenCalledWith("ENCODED-TEMPLATE");
		expect(mockStoreDispatch).toHaveBeenCalledWith("alert", {
			text: "Template code has been copied to the clipboard.",
			title: "Template code",
		});
	});

	it("swaps skills when moving an existing skill onto an occupied slot", () => {
		const vm = edit.vm as any;
		// Directly control the internal slots ref.
		vm.slots = [
			"SkillA",
			"SkillB",
			"No Skill",
			"No Skill",
			"No Skill",
			"No Skill",
			"No Skill",
			"No Skill",
		];

		vm.placeSkillInSlot("SkillA", 1);

		expect(vm.slots[0]).toBe("SkillB");
		expect(vm.slots[1]).toBe("SkillA");
	});

	it("removes duplicate skills when placing a skill in a new slot", () => {
		const vm = edit.vm as any;
		vm.slots = [
			"SkillA",
			"SkillA",
			"No Skill",
			"No Skill",
			"No Skill",
			"No Skill",
			"No Skill",
			"No Skill",
		];

		vm.placeSkillInSlot("SkillA", 2);

		const occurrences = vm.slots.filter((s: string) => s === "SkillA").length;
		expect(occurrences).toBe(1);
		expect(vm.slots[2]).toBe("SkillA");
	});
});
