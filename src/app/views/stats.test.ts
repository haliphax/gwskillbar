/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import StatsView from "./stats.vue";

const {
	mockRouter,
	mockDecode,
	mockStatistics,
	mockStoreDispatch,
	currentRoute,
} = vi.hoisted(() => {
	const route = {
		name: "stats",
		params: { template: "CODE" },
	};

	return {
		currentRoute: route,
		mockRouter: {
			currentRoute: { value: route },
			push: vi.fn(),
		},
		mockDecode: vi.fn(
			(_code: string, isPvp: boolean): BuildTemplate => ({
				primary: isPvp ? "PvpPrimary" : "Primary",
				secondary: "Secondary",
				attributes: {},
				skills: ["SkillOne", "No Skill"],
			}),
		),
		mockStatistics: vi.fn(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(_build: BuildTemplate): Stats => ({
				average: {
					activate: 0,
					adrenaline: 0,
					energy: 10,
					health: 0,
					overcast: 0,
					recharge: 0,
				},
				percentage: {
					attribute: {},
					profession: {},
				},
				total: {
					activate: 0,
					adrenaline: 0,
					attribute: {
						"Illusion Magic": 60,
						"Deadly Arts": 0,
					},
					energy: 0,
					health: 0,
					overcast: 0,
					profession: {
						Mesmer: 40,
						Assassin: 0,
					},
					recharge: 0,
				},
			}),
		),
		mockStoreDispatch: vi.fn(),
	};
});

mockRouter.currentRoute = ref(mockRouter.currentRoute.value);

vi.mock("@/app/router", () => ({
	default: mockRouter,
}));

vi.mock("@/app/util/template", () => ({
	decode: (code: string, isPvp: boolean) => mockDecode(code, isPvp),
}));

vi.mock("@/app/util/skills", () => ({
	statistics: (build: BuildTemplate) => mockStatistics(build),
}));

vi.mock("@/data/skills-data.json", () => ({
	default: {
		SkillOne: {
			profession: "Mesmer",
			attribute: "Illusion Magic",
		},
	} as unknown as SkillsData,
}));

vi.mock("@/app/store", () => ({
	default: {
		dispatch: mockStoreDispatch,
	},
}));

// Stub heavy child components to focus on view logic.
vi.mock("./stats/bar-chart.vue", () => ({
	default: {
		name: "BarChart",
		props: ["skills"],
		template: "<div class='bar-chart-stub'></div>",
	},
}));

vi.mock("./stats/pie-chart.vue", () => ({
	default: {
		name: "PieChart",
		props: ["data"],
		template: "<div class='pie-chart-stub'></div>",
	},
}));

vi.mock("@/app/components/pvp-mode-toggle.vue", () => ({
	default: {
		name: "PvpModeToggle",
		props: ["pvp"],
		template: "<button type='button'></button>",
	},
}));

describe("Stats view", () => {
	let stats: VueWrapper;

	beforeEach(async () => {
		mockRouter.push.mockClear();
		mockDecode.mockReset();
		mockStatistics.mockReset();
		mockStoreDispatch.mockClear();

		mockRouter.currentRoute.value = {
			name: "stats",
			params: { template: "CODE" },
		} as any;

		mockDecode.mockImplementation(
			(_code: string, isPvp: boolean): BuildTemplate => ({
				primary: isPvp ? "PvpPrimary" : "Primary",
				secondary: "Secondary",
				attributes: {},
				skills: ["SkillOne", "No Skill"],
			}),
		);

		mockStatistics.mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(_build: BuildTemplate): Stats => ({
				average: {
					activate: 0,
					adrenaline: 0,
					energy: 10,
					health: 0,
					overcast: 0,
					recharge: 0,
				},
				percentage: {
					attribute: {},
					profession: {},
				},
				total: {
					activate: 0,
					adrenaline: 0,
					attribute: {
						"Illusion Magic": 60,
						"Deadly Arts": 0,
					},
					energy: 0,
					health: 0,
					overcast: 0,
					profession: {
						Mesmer: 40,
						Assassin: 0,
					},
					recharge: 0,
				},
			}),
		);

		stats = mount(StatsView);
		// Allow onBeforeMount/load watchers to run.
		await stats.vm.$nextTick();
	});

	afterEach(() => {
		stats.unmount();
	});

	it("decodes the template and populates stats and skill maps", () => {
		expect(mockDecode).toHaveBeenCalledWith("CODE", false);
		expect(mockStatistics).toHaveBeenCalledTimes(1);

		const vm = stats.vm as any;

		// Skills map should include SkillOne from the decoded build.
		expect(Object.keys(vm.skills)).toEqual(["SkillOne"]);

		// Only non-zero totals should be present in the maps.
		expect(Array.from(vm.skillsByAttribute.entries())).toEqual([
			["Illusion Magic", 60],
		]);
		expect(Array.from(vm.skillsByProfession.entries())).toEqual([
			["Mesmer", 40],
		]);
	});

	it("does nothing when load is called for a non-stats route", async () => {
		const vm = stats.vm as any;

		const beforeAttributes = Array.from(vm.skillsByAttribute.entries());
		const beforeProfessions = Array.from(vm.skillsByProfession.entries());

		mockRouter.currentRoute.value = { ...currentRoute, name: "home" };
		mockDecode.mockClear();
		mockStatistics.mockClear();

		await vm.load();
		await vm.$nextTick();

		expect(mockDecode).not.toHaveBeenCalled();
		expect(mockStatistics).not.toHaveBeenCalled();
		expect(Array.from(vm.skillsByAttribute.entries())).toEqual(
			beforeAttributes,
		);
		expect(Array.from(vm.skillsByProfession.entries())).toEqual(
			beforeProfessions,
		);
	});

	it("dispatches an error and clears maps when decode throws", async () => {
		const vm = stats.vm as any;

		vm.skillsByAttribute.set("Test Attribute", 10);
		vm.skillsByProfession.set("Test Profession", 20);
		vm.skills = { DummySkill: {} };

		mockDecode.mockReset();
		mockDecode.mockImplementation(() => {
			throw new Error("Bad stats template");
		});

		await vm.load().catch(() => {});
		await vm.$nextTick();

		expect(mockStoreDispatch).toHaveBeenCalledWith("alert", {
			text: "Error: Bad stats template",
			title: "Error",
		});

		expect(Array.from(vm.skillsByAttribute.entries())).toEqual([]);
		expect(Array.from(vm.skillsByProfession.entries())).toEqual([]);
		expect(vm.skills).toEqual({});
	});

	it("uses PvP decoding and sets pvp when on stats-pvp route", async () => {
		const vm = stats.vm as any;

		mockRouter.currentRoute.value = { ...currentRoute, name: "stats-pvp" };
		mockDecode.mockClear();

		await vm.load();
		await vm.$nextTick();

		expect(mockDecode).toHaveBeenCalledWith("CODE", true);
		expect(vm.pvp).toBe(true);
	});

	it("joins array template params before decoding", async () => {
		const vm = stats.vm as any;

		mockRouter.currentRoute.value = {
			...currentRoute,
			name: "stats",
			params: { template: ["PART1", "PART2"] as any },
		};
		mockDecode.mockClear();

		await vm.load();
		await vm.$nextTick();

		expect(mockDecode).toHaveBeenCalledWith("PART1/PART2", false);
	});

	it("renders average rows only for positive averages", () => {
		const rows = stats.findAll("tbody tr");
		const texts = rows.map((row) => row.text());

		// Only energy average is non-zero in the mock, so only that row should render.
		expect(texts.some((t) => t.includes("Average energy cost"))).toBe(true);
		expect(texts.some((t) => t.includes("Average overcast"))).toBe(false);
		expect(texts.some((t) => t.includes("Average activation time"))).toBe(
			false,
		);
	});

	it("does not render average rows when all averages are zero", async () => {
		const zeroStats: Stats = {
			average: {
				activate: 0,
				adrenaline: 0,
				energy: 0,
				health: 0,
				overcast: 0,
				recharge: 0,
			},
			percentage: {
				attribute: {},
				profession: {},
			},
			total: {
				activate: 0,
				adrenaline: 0,
				attribute: {},
				energy: 0,
				health: 0,
				overcast: 0,
				profession: {},
				recharge: 0,
			},
		};

		mockStatistics.mockImplementationOnce(() => zeroStats);

		const vm = stats.vm as any;
		await vm.load();
		await vm.$nextTick();

		const rows = stats.findAll("tbody tr");
		const texts = rows.map((row) => row.text());

		expect(texts.some((t) => t.includes("Average energy cost"))).toBe(false);
		expect(rows.length).toBe(0);
	});

	it("does nothing when updatePvp is called from a non-stats route", async () => {
		mockRouter.currentRoute.value = { ...currentRoute, name: "home" };
		mockRouter.push.mockClear();

		(await (stats.vm as any).updatePvp(true)) as void;

		expect(mockRouter.push).not.toHaveBeenCalled();
	});

	it("routes between stats and stats-pvp while preserving params and query", async () => {
		// Start on the non-PvP route.
		mockRouter.currentRoute.value = { ...currentRoute, name: "stats" };

		(await (stats.vm as any).updatePvp(true)) as void;

		expect(mockRouter.push).toHaveBeenCalledWith({
			name: "stats-pvp",
			params: currentRoute.params,
			query: currentRoute.query,
		});

		// Switch to PvP route and toggle back to PvE.
		mockRouter.currentRoute.value = { ...currentRoute, name: "stats-pvp" };
		mockRouter.push.mockClear();

		(await (stats.vm as any).updatePvp(false)) as void;

		expect(mockRouter.push).toHaveBeenCalledWith({
			name: "stats",
			params: currentRoute.params,
			query: currentRoute.query,
		});
	});
});
