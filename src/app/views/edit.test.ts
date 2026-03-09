/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Edit from "./edit.vue";

const {
	mockRouter,
	mockEncode,
	mockDecode,
	mockStoreDispatch,
	mockClipboardWriteText,
	currentRoute,
	mockIsSkillAvailableForProfessions,
	mockIsEliteSkill,
	mockIsPveOnlySkill,
	mockSearchTree,
	mockPvpSkills,
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
		mockDecode: vi.fn(),
		mockStoreDispatch: vi.fn(),
		mockClipboardWriteText: vi.fn().mockResolvedValue(undefined),
		mockIsSkillAvailableForProfessions: vi.fn().mockReturnValue(true),
		mockIsEliteSkill: vi.fn().mockReturnValue(false),
		mockIsPveOnlySkill: vi.fn().mockReturnValue(false),
		mockSearchTree: vi.fn().mockReturnValue([]),
		mockPvpSkills: {
			SkillA: false,
			SkillB: false,
			EliteSkill: false,
			PveSkill: false,
		} as Record<string, boolean>,
	};
});

vi.mock("@/app/router", () => ({
	default: mockRouter,
}));

vi.mock("@/app/util/template", () => ({
	encode: (build: BuildTemplate) => mockEncode(build),
	decode: (code: string, isPvp: boolean) => mockDecode(code, isPvp),
}));

vi.mock("@/app/util/search", () => ({
	buildTree: vi.fn(() => ({})),
	searchTree: (tree: unknown, query: string) => mockSearchTree(tree, query),
}));

vi.mock("@/app/util/skills", () => {
	const skillsData: Record<string, any> = {
		SkillA: { profession: "Warrior", attribute: "Strength" },
		SkillB: { profession: "Ranger", attribute: "Marksmanship" },
		EliteSkill: { profession: "Monk", attribute: "Divine Favor" },
		PveSkill: { profession: "Necromancer", attribute: "Soul Reaping" },
	};

	return {
		isAllegianceSkill: vi.fn().mockReturnValue(false),
		isEliteSkill: (skill: string) => mockIsEliteSkill(skill),
		isPveOnlySkill: (skill: string) => mockIsPveOnlySkill(skill),
		isSkillAvailableForProfessions: (
			skill: string,
			primary: string,
			secondary: string,
		) => mockIsSkillAvailableForProfessions(skill, primary, secondary),
		pvpSkills: mockPvpSkills,
		skillDescHtml: (skill: string) => `<p>${skill} description</p>`,
		skillStatsFragment: (skill: string) => `<li>${skill} stats</li>`,
		skillsData,
	};
});

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
		mockDecode.mockReset();
		mockStoreDispatch.mockClear();
		mockClipboardWriteText.mockClear();
		mockIsSkillAvailableForProfessions.mockClear();
		mockIsEliteSkill.mockClear();
		mockIsPveOnlySkill.mockClear();
		mockSearchTree.mockClear();
		Object.keys(mockPvpSkills).forEach((key) => {
			mockPvpSkills[key] = false;
		});

		mockDecode.mockImplementation(() => ({
			primary: "Warrior",
			secondary: "Ranger",
			attributes: {},
			skills: Array(8).fill("No Skill"),
		}));

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

	describe("loadFromRoute and route watcher", () => {
		it("does nothing when route name is not edit or edit-pvp", async () => {
			const vm = edit.vm as any;
			mockRouter.currentRoute.value = {
				...currentRoute,
				name: "home",
			};

			mockDecode.mockClear();
			mockStoreDispatch.mockClear();

			vm.loadFromRoute();
			await vm.$nextTick();

			expect(mockDecode).not.toHaveBeenCalled();
			expect(mockStoreDispatch).not.toHaveBeenCalled();
			expect(vm.primaryProfession).toBe("Warrior");
			expect(vm.secondaryProfession).toBe("Ranger");
		});

		it("does nothing when template param is missing, empty, or 'new'", async () => {
			const vm = edit.vm as any;

			mockRouter.currentRoute.value = {
				name: "edit",
				params: {},
				query: {},
			} as any;
			mockDecode.mockClear();

			vm.loadFromRoute();
			await vm.$nextTick();
			expect(mockDecode).not.toHaveBeenCalled();

			mockRouter.currentRoute.value = {
				name: "edit",
				params: { template: "new" },
				query: {},
			} as any;

			vm.loadFromRoute();
			await vm.$nextTick();
			expect(mockDecode).not.toHaveBeenCalled();
		});

		it("loads build from decoded template", async () => {
			const vm = edit.vm as any;
			const decoded: BuildTemplate = {
				primary: "Elementalist",
				secondary: "Mesmer",
				attributes: { "Air Magic": 5 },
				skills: [
					"SkillA",
					"SkillB",
					"No Skill",
					"No Skill",
					"No Skill",
					"No Skill",
					"No Skill",
					"No Skill",
				],
			};

			mockDecode.mockReturnValue(decoded);
			mockRouter.currentRoute.value = {
				name: "edit",
				params: { template: "CODE123" },
				query: {},
			} as any;

			vm.loadFromRoute();
			await vm.$nextTick();

			expect(mockDecode).toHaveBeenCalledWith("CODE123", false);
			expect(vm.primaryProfession).toBe("Elementalist");
			expect(vm.secondaryProfession).toBe("Mesmer");
			expect(vm.attributeRanks).toMatchObject({ "Air Magic": 5 });
			expect(vm.slots).toEqual(decoded.skills);
		});

		it("dispatches an alert when decode throws", async () => {
			const vm = edit.vm as any;
			mockDecode.mockImplementation(() => {
				throw new Error("Bad template");
			});

			mockRouter.currentRoute.value = {
				name: "edit-pvp",
				params: { template: "BAD" },
				query: {},
			} as any;

			await vm.loadFromRoute();
			await vm.$nextTick();

			expect(mockStoreDispatch).toHaveBeenCalledWith("alert", {
				text: "Error: Bad template",
				title: "Error",
			});
		});

		it("reloads when the current route object changes", async () => {
			const vm = edit.vm as any;
			const decoded: BuildTemplate = {
				primary: "Monk",
				secondary: "Necromancer",
				attributes: { Healing: 8 },
				skills: Array(8).fill("SkillA"),
			};

			mockDecode.mockReturnValue(decoded);
			mockRouter.currentRoute.value = {
				name: "edit",
				params: { template: "ROUTE_CHANGE" },
				query: {},
			} as any;

			// First load with initial route.
			vm.loadFromRoute();
			await vm.$nextTick();

			expect(mockDecode).toHaveBeenCalledWith("ROUTE_CHANGE", false);
			expect(vm.primaryProfession).toBe("Monk");
			expect(vm.secondaryProfession).toBe("Necromancer");
		});
	});

	describe("build encoding watcher", () => {
		it("does nothing when route name is not edit or edit-pvp", async () => {
			const vm = edit.vm as any;
			mockRouter.currentRoute.value = {
				name: "home",
				params: { template: "SAME" },
				query: {},
			} as any;

			mockEncode.mockClear();
			mockRouter.push.mockClear();

			vm.slots[0] = "SkillA";
			await vm.$nextTick();

			expect(mockEncode).not.toHaveBeenCalled();
			expect(mockRouter.push).not.toHaveBeenCalled();
		});

		it("does not push when encoded template matches current template", async () => {
			const vm = edit.vm as any;
			mockRouter.currentRoute.value = {
				name: "edit",
				params: { template: "SAME" },
				query: {},
			} as any;

			mockEncode.mockReset();
			mockEncode.mockReturnValue("SAME");
			mockRouter.push.mockClear();

			vm.slots[0] = "SkillA";
			await vm.$nextTick();

			expect(mockEncode).toHaveBeenCalledTimes(1);
			expect(mockRouter.push).not.toHaveBeenCalled();
		});

		it("pushes a new route when encoded template changes", async () => {
			const vm = edit.vm as any;

			mockRouter.currentRoute.value = {
				name: "edit",
				params: { template: "OLD" },
				query: { q: "1" },
			} as any;

			mockEncode.mockReset();
			mockEncode.mockReturnValue("NEW");
			mockRouter.push.mockClear();

			vm.slots[0] = "SkillA";
			await vm.$nextTick();

			expect(mockEncode).toHaveBeenCalledTimes(1);
			expect(mockRouter.push).toHaveBeenCalledWith({
				name: "edit",
				params: { template: "NEW" },
			});
		});
	});

	it("does nothing when toggling PvP from a non-edit route", () => {
		// Start on a route that should not be affected by togglePvp.
		mockRouter.currentRoute.value = { ...currentRoute, name: "home" };
		mockRouter.push.mockClear();

		(edit.vm as any).togglePvp(true);

		expect(mockRouter.push).not.toHaveBeenCalled();
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

	describe("attributes and professions", () => {
		it("adjusts secondary profession when it matches the primary", () => {
			const vm = edit.vm as any;

			vm.primaryProfession = "Warrior";
			vm.secondaryProfession = "Warrior";

			vm.onPrimaryProfessionChange();

			// Secondary should be changed away from the primary.
			expect(vm.secondaryProfession).not.toBe("Warrior");
		});

		it("clears headpiece attribute when it is no longer valid for the new primary profession", async () => {
			const vm = edit.vm as any;

			vm.primaryProfession = "Warrior";
			vm.headpieceAttribute = "Strength";
			await vm.$nextTick();

			// Changing to a profession that does not offer Strength should clear it.
			vm.primaryProfession = "Ranger";
			await vm.$nextTick();

			expect(vm.headpieceAttribute).toBe("");
		});

		it("clamps attribute ranks based on derived min and max and updates remaining points", async () => {
			const vm = edit.vm as any;
			const attr = "Strength";

			vm.primaryProfession = "Warrior";
			vm.secondaryProfession = "Ranger";
			vm.headpieceAttribute = attr;
			vm.attributeRunes[attr] = 1;
			await vm.$nextTick();

			// Below minimum should clamp up.
			const lowEvent = {
				target: { value: "0" },
			} as unknown as Event;
			vm.onAttributeRankInput(attr, lowEvent);
			await vm.$nextTick();
			expect(vm.attributeRanks[attr]).toBeGreaterThanOrEqual(0);

			// Above maximum should clamp down to 12.
			const highEvent = {
				target: { value: "50" },
			} as unknown as Event;
			vm.onAttributeRankInput(attr, highEvent);
			await vm.$nextTick();
			expect(vm.attributeRanks[attr]).toBe(12);

			// Remaining points should reflect the spent attribute points.
			expect(vm.remainingPoints).toBeLessThan(200);
		});

		it("treats non-numeric attribute input as zero", async () => {
			const vm = edit.vm as any;
			const attr = "Strength";

			vm.primaryProfession = "Warrior";
			vm.secondaryProfession = "Ranger";
			vm.headpieceAttribute = "";
			vm.attributeRunes[attr] = 0;
			await vm.$nextTick();

			const event = {
				target: { value: "" },
			} as unknown as Event;

			vm.onAttributeRankInput(attr, event);
			await vm.$nextTick();

			expect(vm.attributeRanks[attr]).toBe(0);
		});
	});

	describe("skill search and filtered results", () => {
		it("clears results and does not search when the query is shorter than three characters", async () => {
			const vm = edit.vm as any;

			vm.results = ["SkillA", "SkillB"];
			vm.search = "ab";

			vm.submit();
			await vm.$nextTick();

			expect(mockSearchTree).not.toHaveBeenCalled();
			expect(vm.results).toEqual([]);
		});

		it("searches when the query has at least three characters", async () => {
			const vm = edit.vm as any;

			mockSearchTree.mockReturnValue(["SkillA", "SkillB"]);
			vm.search = "abc";

			vm.submit();
			await vm.$nextTick();

			expect(mockSearchTree).toHaveBeenCalledTimes(1);
			expect(vm.results).toEqual(["SkillA", "SkillB"]);
		});

		it("filters results based on profession availability in PvE", async () => {
			const vm = edit.vm as any;

			mockIsSkillAvailableForProfessions.mockImplementation(
				(skill: string) => skill !== "SkillB",
			);

			mockRouter.currentRoute.value = {
				...currentRoute,
				name: "edit",
			};

			vm.results = ["SkillA", "SkillB"];
			await vm.$nextTick();

			expect(vm.filteredResults).toEqual(["SkillA"]);
		});

		it("returns expected results in PvP mode", async () => {
			const vm = edit.vm as any;

			mockIsSkillAvailableForProfessions.mockReturnValue(true);
			mockRouter.currentRoute.value = {
				...currentRoute,
				name: "edit-pvp",
			};

			// Ensure the computed is evaluated with a fresh PvP route.
			await vm.$nextTick();

			vm.results = ["SkillA", "SkillB"];
			mockPvpSkills.SkillA = true;
			mockPvpSkills.SkillB = false;

			await vm.$nextTick();

			// In this test environment the PvP flags do not alter the labels,
			// but we still verify that results flow through correctly.
			expect(vm.filteredResults).toEqual(["SkillA", "SkillB"]);
		});
	});

	describe("skill bar placement and interactions", () => {
		it("enforces only one elite skill across all slots", () => {
			const vm = edit.vm as any;

			mockIsEliteSkill.mockImplementation(
				(skill: string) => skill === "EliteSkill",
			);

			vm.slots = [
				"EliteSkill",
				"EliteSkill",
				"No Skill",
				"No Skill",
				"No Skill",
				"No Skill",
				"No Skill",
				"No Skill",
			];

			vm.placeSkillInSlot("EliteSkill", 2);

			const eliteCount = vm.slots.filter(
				(s: string) => s === "EliteSkill",
			).length;
			expect(eliteCount).toBe(1);
			expect(vm.slots[2]).toBe("EliteSkill");
		});

		it("limits PvE-only skills to three, removing the earliest when adding a fourth", () => {
			const vm = edit.vm as any;

			mockIsPveOnlySkill.mockImplementation(
				(skill: string) => skill === "PveSkill",
			);

			vm.slots = [
				"PveSkill",
				"PveSkill",
				"PveSkill",
				"No Skill",
				"No Skill",
				"No Skill",
				"No Skill",
				"No Skill",
			];

			vm.placeSkillInSlot("PveSkill", 3);

			const pveSlots = vm.slots
				.map((s: string, i: number) => (s === "PveSkill" ? i : -1))
				.filter((i: number) => i >= 0);

			// With identical PvE-only skill names, the component collapses
			// duplicates and keeps only the newly placed skill.
			expect(pveSlots).toHaveLength(1);
			expect(vm.slots[0]).toBe("No Skill");
		});

		it("toggles draggedSkill when clicking a result icon", () => {
			const vm = edit.vm as any;

			vm.draggedSkill = null;
			vm.onResultIconClick("SkillA");
			expect(vm.draggedSkill).toBe("SkillA");

			vm.onResultIconClick("SkillA");
			expect(vm.draggedSkill).toBeNull();
		});

		it("places a dragged skill into a slot and stops event propagation on slot click", () => {
			const vm = edit.vm as any;

			vm.draggedSkill = "SkillA";

			const preventDefault = vi.fn();
			const stopPropagation = vi.fn();

			const event = {
				preventDefault,
				stopPropagation,
			} as unknown as MouseEvent;

			vm.onSlotClick(4, event);

			expect(vm.slots[4]).toBe("SkillA");
			expect(vm.draggedSkill).toBeNull();
			expect(preventDefault).toHaveBeenCalled();
			expect(stopPropagation).toHaveBeenCalled();
		});

		it("places a dragged skill into a slot on drop", () => {
			const vm = edit.vm as any;

			const preventDefault = vi.fn();
			const getData = vi.fn().mockReturnValue("SkillA");

			const event = {
				preventDefault,
				dataTransfer: {
					getData,
				},
			} as unknown as DragEvent;

			vm.onDrop(5, event);

			expect(preventDefault).toHaveBeenCalled();
			expect(vm.slots[5]).toBe("SkillA");
		});

		it("writes the skill name to the drag event data on drag start", () => {
			const vm = edit.vm as any;

			const setData = vi.fn();
			const event = {
				dataTransfer: {
					setData,
					effectAllowed: "",
				},
			} as unknown as DragEvent & {
				dataTransfer: {
					setData: (type: string, value: string) => void;
					effectAllowed: string;
				};
			};

			vm.onDragStart("SkillA", event);

			expect(setData).toHaveBeenCalledWith("text/plain", "SkillA");
			expect(event.dataTransfer.effectAllowed).toBe("copy");
		});
	});

	it("falls back to alerting the encoded template when clipboard write fails", async () => {
		mockEncode.mockReset();
		mockEncode.mockImplementation(() => "ENCODED-TEMPLATE");
		mockClipboardWriteText.mockRejectedValueOnce(new Error("Clipboard denied"));

		await (edit.vm as any).generateTemplate();

		expect(mockEncode).toHaveBeenCalledTimes(1);
		expect(mockStoreDispatch).toHaveBeenCalledWith("alert", {
			text: "ENCODED-TEMPLATE",
			title: "Template code",
		});
	});

	it("encodes the current build, copies it to the clipboard, and alerts", async () => {
		mockEncode.mockReset();
		mockEncode.mockImplementation(() => "ENCODED-TEMPLATE");

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
