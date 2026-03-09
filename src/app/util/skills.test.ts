import store from "@/app/store";
import { describe, expect, it, vi } from "vitest";
import {
	allegianceSkills,
	invalidSkillClass,
	isAllegianceSkill,
	isEliteSkill,
	isPveOnlySkill,
	isSkillAvailableForProfessions,
	skillDescHtml,
	skillDescription,
	skillStatsFragment,
	statDisplay,
	statistics,
} from "./skills";

describe("skills util", () => {
	describe("isSkillAvailableForProfessions", () => {
		it("returns true when skill profession matches primary or secondary", () => {
			expect(
				isSkillAvailableForProfessions("Healing Signet", "Warrior", "Mesmer"),
			).toBe(true);
			expect(
				isSkillAvailableForProfessions("Healing Signet", "Mesmer", "Warrior"),
			).toBe(true);
		});

		it("returns false when skill profession matches neither primary nor secondary", () => {
			expect(
				isSkillAvailableForProfessions(
					"Healing Signet",
					"Elementalist",
					"Monk",
				),
			).toBe(false);
		});

		it("always returns true for skills with no or universal profession", () => {
			expect(
				isSkillAvailableForProfessions("Resurrection Signet", "Monk", "None"),
			).toBe(true);
		});
	});

	describe("isAllegianceSkill and isPveOnlySkill", () => {
		it("recognizes allegiance skills using encoded names", () => {
			expect(isAllegianceSkill('"Save Yourselves!"')).toBe(true);
			expect(isAllegianceSkill("Nonexistent Skill")).toBe(false);
		});

		it("recognizes PvE-only skills", () => {
			expect(isPveOnlySkill("Signet of Capture")).toBe(true);
			expect(isPveOnlySkill("Healing Signet")).toBe(false);
		});
	});

	describe("isEliteSkill", () => {
		it("returns true for skills whose description starts with 'Elite '", () => {
			expect(isEliteSkill("Power Block")).toBe(true);
		});

		it("returns false for non-elite skills", () => {
			expect(isEliteSkill("Healing Signet")).toBe(false);
		});
	});

	describe("statDisplay", () => {
		it("renders 'morale boost' when amount is null", () => {
			const html = statDisplay("health", null);

			expect(html).toContain("morale boost");
			expect(html).toContain('alt="health"');
		});

		it("renders fraction HTML entities for .25, .5, and .75 suffixes", () => {
			expect(statDisplay("energy", 1.25)).toContain("&frac14;");
			expect(statDisplay("energy", 2.5)).toContain("&frac12;");
			expect(statDisplay("energy", 3.75)).toContain("&frac34;");
		});

		it("appends % for health stats with numeric amount", () => {
			const html = statDisplay("health", 10);

			expect(html).toContain("10%");
		});

		it("includes an img tag with the given stat name and src", () => {
			const html = statDisplay("energy", 5);

			expect(html).toContain('alt="energy"');
			expect(html).toContain("/images/ui/energy.png");
		});
	});

	describe("skillDescHtml", () => {
		it("highlights numeric ranges inside the description", () => {
			const html = skillDescHtml("Mantra of Recovery");

			expect(html).toContain(
				'<span style="color: var(--color-em)">5...17...20</span>',
			);
		});

		it("returns an empty string for skills without a description", () => {
			expect(skillDescHtml("Nonexistent Skill")).toBe("");
		});
	});

	describe("skillStatsFragment", () => {
		it("includes statDisplay fragments for all non-null stats", () => {
			const html = skillStatsFragment("Healing Signet");

			expect(html).toContain("activate");
			// Healing Signet has a recharge but no energy in the test data snippet.
			expect(html).toContain("recharge");
		});

		it("returns an empty string for unknown skills", () => {
			expect(skillStatsFragment("Nonexistent Skill")).toBe("");
		});
	});

	describe("skillDescription", () => {
		it("dispatches an alert with HTML content and title", async () => {
			const dispatchSpy = vi
				.spyOn(store, "dispatch")
				.mockResolvedValue(undefined);

			await skillDescription("Power Block");

			expect(dispatchSpy).toHaveBeenCalledWith("alert", expect.any(Object));
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const payload: any = dispatchSpy.mock.calls[0][1]!;

			expect(payload.html).toBe(true);
			expect(payload.text).toContain("Guild Wars Wiki");
			// Link URL should contain the wiki page for the skill.
			expect(payload.text).toContain(
				"https://wiki.guildwars.com/wiki/Power_Block",
			);
			expect(payload.title).toContain("/images/skills/Power%20Block.jpg");

			dispatchSpy.mockRestore();
		});
	});

	describe("invalidSkillClass", () => {
		it("returns an empty string when not in PvP mode", () => {
			expect(invalidSkillClass("Signet of Capture", false)).toBe("");
		});

		it("returns 'invalid' for PvE-only skills in PvP mode", () => {
			expect(invalidSkillClass("Signet of Capture", true)).toBe("invalid");
		});

		it("returns an empty string for non-PvE-only skills in PvP mode", () => {
			expect(invalidSkillClass("Healing Signet", true)).toBe("");
		});
	});

	describe("statistics", () => {
		it("computes totals, averages, and percentage breakdowns for a build", () => {
			const build: BuildTemplate = {
				primary: "Mesmer",
				secondary: "Necromancer",
				attributes: {
					"Illusion Magic": 12,
					"Soul Reaping": 9,
				},
				skills: [
					"Healing Signet",
					"Power Block",
					"Fragility",
					"Nonexistent Skill", // optional
					"Mantra of Recovery",
					"Resurrection Signet",
					"No Skill",
					"Illusionary Weaponry",
				],
			};

			const stats = statistics(build);

			// At least one profession and attribute breakdown should be present.
			expect(Object.keys(stats.total.profession).length).toBeGreaterThan(0);
			expect(Object.keys(stats.total.attribute).length).toBeGreaterThan(0);

			// Averages are rounded to two decimals.
			expect(stats.average.activate).toBeCloseTo(
				Number(stats.average.activate.toFixed(2)),
				5,
			);
			expect(stats.average.recharge).toBeCloseTo(
				Number(stats.average.recharge.toFixed(2)),
				5,
			);

			// Percentages are between 0 and 100.
			for (const value of Object.values(stats.percentage.attribute)) {
				expect(value).toBeGreaterThanOrEqual(0);
				expect(value).toBeLessThanOrEqual(100);
			}
			for (const value of Object.values(stats.percentage.profession)) {
				expect(value).toBeGreaterThanOrEqual(0);
				expect(value).toBeLessThanOrEqual(100);
			}
		});
	});

	describe("re-exports", () => {
		it("exposes allegianceSkills lookup for known allegiance skill", () => {
			// Stored keys are URL-encoded in the JSON data (%22 is a quote).
			expect(allegianceSkills["%22Save Yourselves!%22"]).toBe(true);
		});
	});
});
