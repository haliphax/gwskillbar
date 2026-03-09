/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import View from "./view.vue";

const { mockRouter, mockDecode, mockStoreDispatch, mockPveSkills } = vi.hoisted(
	() => {
		const route = {
			name: "view",
			params: { template: "CODE" },
			query: {},
		};

		return {
			mockRouter: {
				currentRoute: { value: route },
				push: vi.fn(),
			},
			mockDecode: vi.fn(),
			mockStoreDispatch: vi.fn(),
			mockPveSkills: {} as Record<string, boolean>,
		};
	},
);

// Wrap the router's currentRoute in a Vue ref so that
// computed properties and watchers in the view respond
// to route changes similarly to the real router.
import { ref } from "vue";
mockRouter.currentRoute = ref(mockRouter.currentRoute.value);

vi.mock("@/app/router", () => ({
	default: mockRouter,
}));

vi.mock("@/app/util/template", () => ({
	decode: (code: string, isPvp: boolean) => mockDecode(code, isPvp),
}));

vi.mock("@/app/store", () => ({
	default: {
		dispatch: mockStoreDispatch,
	},
}));

vi.mock("@/app/util/skills", () => ({
	invalidSkillClass: vi.fn((skill: string, pvp: boolean) =>
		pvp && mockPveSkills[skill] ? "invalid" : "",
	),
	isAllegianceSkill: vi.fn().mockReturnValue(false),
	pveSkills: mockPveSkills,
	skillDescription: vi.fn(),
}));

vi.mock("@/data/attributes-data.json", () => ({
	default: {
		Strength: {
			desc: "Gain {x} damage",
			vars: {
				x: [0, 1, 2, 3, 4, 5],
			},
		},
	},
}));

// Stub child components that are not relevant to these tests.
vi.mock("@/app/components/profession-icon.vue", () => ({
	default: {
		name: "ProfessionIcon",
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

vi.mock("@/app/components/skill-icon.vue", () => ({
	default: {
		name: "SkillIcon",
		props: ["name", "allegianceSkill"],
		template: "<span><slot /></span>",
	},
}));

vi.mock("@/app/components/wiki-link.vue", () => ({
	default: {
		name: "WikiLink",
		props: ["path", "title"],
		template: "<a><slot /></a>",
	},
}));

describe("View view", () => {
	let view: VueWrapper<any>;

	beforeEach(() => {
		mockRouter.push.mockClear();
		mockDecode.mockReset();
		mockStoreDispatch.mockClear();
		Object.keys(mockPveSkills).forEach((key) => {
			delete mockPveSkills[key];
		});

		mockDecode.mockImplementation(
			() =>
				({
					primary: "Warrior",
					secondary: "Ranger",
					attributes: {},
					skills: Array(8).fill("No Skill"),
				}) as BuildTemplate,
		);

		mockRouter.currentRoute.value = {
			name: "view",
			params: { template: "CODE" },
			query: {},
		} as any;

		view = mount(View);
	});

	afterEach(() => {
		view.unmount();
	});

	describe("loadFromRoute", () => {
		it("does nothing when route name is not view or view-pvp", async () => {
			const vm = view.vm as any;

			mockDecode.mockClear();
			mockStoreDispatch.mockClear();

			mockRouter.currentRoute.value = {
				name: "home",
				params: {},
				query: {},
			} as any;

			await vm.loadFromRoute();
			await vm.$nextTick();

			expect(mockDecode).not.toHaveBeenCalled();
			expect(mockStoreDispatch).not.toHaveBeenCalled();
		});

		it("parses string template param and decodes build", async () => {
			const vm = view.vm as any;

			const decoded: BuildTemplate = {
				primary: "Elementalist",
				secondary: "Mesmer",
				attributes: { Strength: 3 },
				skills: ["SkillA", "SkillB"],
			};

			mockDecode.mockReset();
			mockDecode.mockReturnValue(decoded);

			mockRouter.currentRoute.value = {
				name: "view",
				params: { template: "STRINGCODE" },
				query: {},
			} as any;

			await vm.loadFromRoute();
			await vm.$nextTick();

			expect(mockDecode).toHaveBeenCalledWith("STRINGCODE", false);
			expect(vm.build.primary).toBe("Elementalist");
			expect(vm.build.secondary).toBe("Mesmer");
			expect(vm.build.attributes).toEqual({ Strength: 3 });
			expect(vm.build.skills).toEqual(decoded.skills);
		});

		it("joins array template param with '/' before decoding", async () => {
			const vm = view.vm as any;

			const decoded: BuildTemplate = {
				primary: "Elementalist",
				secondary: "Mesmer",
				attributes: {},
				skills: [],
			};

			mockDecode.mockReset();
			mockDecode.mockReturnValue(decoded);

			mockRouter.currentRoute.value = {
				name: "view-pvp",
				params: { template: ["PART1", "PART2"] },
				query: {},
			} as any;

			await vm.loadFromRoute();
			await vm.$nextTick();

			expect(mockDecode).toHaveBeenCalledWith("PART1/PART2", true);
		});

		it("generates attribute descriptions from attributes-data.json", async () => {
			const vm = view.vm as any;

			const decoded: BuildTemplate = {
				primary: "Warrior",
				secondary: "Ranger",
				attributes: { Strength: 3 },
				skills: [],
			};

			mockDecode.mockReset();
			mockDecode.mockReturnValue(decoded);

			mockRouter.currentRoute.value = {
				name: "view",
				params: { template: "ATTR" },
				query: {},
			} as any;

			await vm.loadFromRoute();
			await vm.$nextTick();

			expect(vm.attribDesc.Strength).toContain("<strong>");
			expect(vm.attribDesc.Strength).toContain("3");
		});

		it("does not set hasInvalidPvpSkills when all skills are valid in PvP", async () => {
			const vm = view.vm as any;

			const decoded: BuildTemplate = {
				primary: "Warrior",
				secondary: "Ranger",
				attributes: {},
				skills: ["SkillA", "SkillB"],
			};

			mockDecode.mockReset();
			mockDecode.mockReturnValue(decoded);

			mockRouter.currentRoute.value = {
				name: "view-pvp",
				params: { template: "PVP" },
				query: {},
			} as any;

			await vm.loadFromRoute();
			await vm.$nextTick();

			expect(vm.hasInvalidPvpSkills).toBe(false);
		});

		it("sets hasInvalidPvpSkills when decoded skills contain PvE-only skills", async () => {
			const vm = view.vm as any;

			const decoded: BuildTemplate = {
				primary: "Warrior",
				secondary: "Ranger",
				attributes: {},
				skills: ["SkillA", "SkillB"],
			};

			mockDecode.mockReset();
			mockDecode.mockReturnValue(decoded);
			mockPveSkills.SkillA = true;

			mockRouter.currentRoute.value = {
				name: "view-pvp",
				params: { template: "PVP" },
				query: {},
			} as any;

			await vm.loadFromRoute();
			await vm.$nextTick();

			expect(vm.hasInvalidPvpSkills).toBe(true);
		});

		it("dispatches an alert and clears state when decode throws", async () => {
			const vm = view.vm as any;

			mockDecode.mockReset();
			mockDecode.mockImplementation(() => {
				throw new Error("Bad template");
			});

			// Mutate the existing route object in place so that the
			// route watcher does not re-run loadFromRoute and cause
			// an unhandled rejection in the background.
			mockRouter.currentRoute.value.name = "view";
			mockRouter.currentRoute.value.params = { template: "BAD" } as any;
			mockRouter.currentRoute.value.query = {};

			await vm.loadFromRoute().catch(() => {});
			await vm.$nextTick();

			expect(mockStoreDispatch).toHaveBeenCalledWith("alert", {
				text: "Error: Bad template",
				title: "Error",
			});

			expect(vm.build.primary).toBe("");
			expect(vm.build.secondary).toBe("");
			expect(vm.build.attributes).toEqual({});
			expect(vm.build.skills).toEqual([]);
			expect(vm.attribDesc).toEqual({});
			expect(vm.hasInvalidPvpSkills).toBe(false);
		});
	});

	describe("pvp computed and updatePvp", () => {
		it("computes pvp based on current route name", async () => {
			const vm = view.vm as any;

			mockRouter.currentRoute.value = {
				name: "view",
				params: {},
				query: {},
			} as any;
			await vm.$nextTick();
			expect(vm.pvp).toBe(false);

			mockRouter.currentRoute.value = {
				name: "view-pvp",
				params: {},
				query: {},
			} as any;
			await vm.$nextTick();
			expect(vm.pvp).toBe(true);
		});

		it("does nothing when toggling PvP from a non-view route", () => {
			const vm = view.vm as any;

			mockRouter.currentRoute.value = {
				name: "home",
				params: { template: "CODE" },
				query: { q: "1" },
			} as any;
			mockRouter.push.mockClear();

			vm.updatePvp(true);

			expect(mockRouter.push).not.toHaveBeenCalled();
		});

		it("routes between view and view-pvp while preserving params and query", () => {
			const vm = view.vm as any;

			const params = { template: "CODE123" };
			const query = { q: "1" };

			mockRouter.currentRoute.value = {
				name: "view",
				params,
				query,
			} as any;

			mockRouter.push.mockClear();
			vm.updatePvp(true);

			expect(mockRouter.push).toHaveBeenCalledWith({
				name: "view-pvp",
				params,
				query,
			});

			mockRouter.currentRoute.value = {
				name: "view-pvp",
				params,
				query,
			} as any;

			mockRouter.push.mockClear();
			vm.updatePvp(false);

			expect(mockRouter.push).toHaveBeenCalledWith({
				name: "view",
				params,
				query,
			});
		});
	});

	describe("route watcher", () => {
		it("reloads when the current route object changes", async () => {
			const vm = view.vm as any;

			mockDecode.mockReset();
			mockDecode.mockImplementation(
				(code: string): BuildTemplate => ({
					primary: "Elementalist",
					secondary: "Mesmer",
					attributes: {},
					skills: Array(8).fill(code),
				}),
			);

			mockRouter.currentRoute.value = {
				name: "view",
				params: { template: "ROUTE1" },
				query: {},
			} as any;

			await vm.$nextTick();

			expect(mockDecode).toHaveBeenCalledWith("ROUTE1", false);
			expect(vm.build.skills[0]).toBe("ROUTE1");

			mockDecode.mockClear();
			mockRouter.currentRoute.value = {
				name: "view",
				params: { template: "ROUTE2" },
				query: {},
			} as any;

			await vm.$nextTick();

			expect(mockDecode).toHaveBeenCalledWith("ROUTE2", false);
			expect(vm.build.skills[0]).toBe("ROUTE2");
		});
	});

	describe("DOM tied to logic", () => {
		it("shows PvE warning only when in PvP and has invalid PvP skills", async () => {
			const vm = view.vm as any;

			const decoded: BuildTemplate = {
				primary: "Warrior",
				secondary: "Ranger",
				attributes: {},
				skills: ["SkillA"],
			};

			mockDecode.mockReset();
			mockDecode.mockReturnValue(decoded);
			mockPveSkills.SkillA = true;

			mockRouter.currentRoute.value = {
				name: "view-pvp",
				params: { template: "PVP" },
				query: {},
			} as any;

			await vm.loadFromRoute();
			await vm.$nextTick();

			const warn = view.find("#pve-warn");
			expect(warn.exists()).toBe(true);
			expect(warn.isVisible()).toBe(true);
		});
	});
});
