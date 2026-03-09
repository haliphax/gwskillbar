import SkillIcon from "@/app/components/skill-icon.vue";
import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BarChart from "./bar-chart.vue";

const { mockSkillDescription } = vi.hoisted(() => ({
	mockSkillDescription: vi.fn(),
}));

vi.mock("@/app/util/skills", () => ({
	allegianceSkills: {
		Fireball: true,
	},
	skillDescription: mockSkillDescription,
}));

describe("BarChart component", () => {
	let barChart: VueWrapper;

	const fullSkillData: SkillsData = {
		Fireball: {
			energy: 10,
			health: 15,
			adrenaline: 4,
			overcast: 2,
			activate: 1,
			recharge: 5,
			desc: "A fiery spell.",
		},
	};

	beforeEach(() => {
		barChart = mount(BarChart, {
			props: {
				skills: fullSkillData,
			},
		});
	});

	afterEach(() => {
		barChart.unmount();
	});

	it("renders background grid and outer figure container", () => {
		const figure = barChart.get('[class*="📊"]');

		expect(figure.attributes("role")).toBe("figure");

		const bgRows = barChart.findAll(".bg > div");

		expect(bgRows.length).toBe(13);
	});

	it("renders all cost bars with correct titles when stats are present", () => {
		const energyBar = barChart.get(".en");
		const healthBar = barChart.get(".hp");
		const adrenalineBar = barChart.get(".ad");
		const overcastBar = barChart.get(".oc");
		const activateBar = barChart.get(".act");
		const rechargeBar = barChart.get(".re");

		expect(energyBar.attributes("title")).toBe("Energy: 10");
		expect(healthBar.attributes("title")).toBe("Health: 15%");
		expect(adrenalineBar.attributes("title")).toBe("Adrenaline: 4");
		expect(overcastBar.attributes("title")).toBe("Overcast: 2");
		expect(activateBar.attributes("title")).toBe(
			"Activation time: 1 (total 6)",
		);
		expect(rechargeBar.attributes("title")).toBe("Recharge time: 5 (total 6)");
	});

	it("only renders bars for stats that are present", () => {
		barChart.unmount();

		const partialSkills: SkillsData = {
			Fireball: {
				energy: 10,
				recharge: 3,
				desc: "Partial stats.",
			},
		};

		barChart = mount(BarChart, {
			props: {
				skills: partialSkills,
			},
		});

		expect(barChart.find(".en").exists()).toBe(true);
		expect(barChart.find(".re").exists()).toBe(true);

		expect(barChart.find(".hp").exists()).toBe(false);
		expect(barChart.find(".ad").exists()).toBe(false);
		expect(barChart.find(".oc").exists()).toBe(false);
		expect(barChart.find(".act").exists()).toBe(false);
	});

	it("wires SkillIcon props and triggers skillDescription on click", async () => {
		const icon = barChart.findComponent(SkillIcon);

		expect(icon.exists()).toBe(true);
		expect(icon.props("name")).toBe("Fireball");
		expect(icon.props("allegianceSkill")).toBe(true);

		const link = barChart.get("a");

		await link.trigger("click");

		expect(mockSkillDescription).toHaveBeenCalledTimes(1);
		expect(mockSkillDescription).toHaveBeenCalledWith("Fireball");
	});
});
