/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
		query: { q: "1" },
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
		mockDecode.mockClear();
		mockStatistics.mockClear();
		mockStoreDispatch.mockClear();

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
