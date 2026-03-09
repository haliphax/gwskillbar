import { describe, expect, it } from "vitest";
import {
	ATTRIBUTE_POINTS_MAX,
	getAvailableAttributes,
	pointsSpent,
	pointsToReachRank,
} from "./attributes";

describe("attributes util", () => {
	describe("pointsToReachRank", () => {
		it("returns 0 for non-positive ranks", () => {
			expect(pointsToReachRank(0)).toBe(0);
			expect(pointsToReachRank(-1)).toBe(0);
		});

		it("returns correct cumulative points for ranks 1 through 12", () => {
			const expected = [0, 1, 3, 6, 10, 15, 21, 28, 37, 48, 61, 77, 97];

			for (let rank = 0; rank <= 12; rank++) {
				expect(pointsToReachRank(rank)).toBe(expected[rank]);
			}
		});

		it("clamps ranks above 12 to the maximum table value", () => {
			expect(pointsToReachRank(13)).toBe(pointsToReachRank(12));
			expect(pointsToReachRank(20)).toBe(pointsToReachRank(12));
		});
	});

	describe("pointsSpent", () => {
		it("returns 0 for an empty attribute map", () => {
			expect(pointsSpent({})).toBe(0);
		});

		it("sums the cumulative points for each attribute rank", () => {
			const attrs = {
				"Air Magic": 0,
				"Fire Magic": 3,
				"Earth Magic": 12,
			};

			// 0 -> 0, 3 -> 6, 12 -> 97
			expect(pointsSpent(attrs)).toBe(0 + 6 + 97);
		});

		it("does not exceed ATTRIBUTE_POINTS_MAX for typical maxed-out builds", () => {
			const attrs = {
				"Fire Magic": 12,
				"Air Magic": 12,
			};

			expect(pointsSpent(attrs)).toBeLessThanOrEqual(ATTRIBUTE_POINTS_MAX);
		});
	});

	describe("getAvailableAttributes", () => {
		const professions = [
			{
				name: "None",
				primaryAttribute: null,
				secondaryAttributes: [],
			},
			{
				name: "Elementalist",
				primaryAttribute: "Energy Storage",
				secondaryAttributes: ["Air Magic", "Fire Magic"],
			},
			{
				name: "Mesmer",
				primaryAttribute: null,
				secondaryAttributes: ["Illusion Magic", "Domination Magic"],
			},
		];

		it("returns an empty array when primary or secondary is missing", () => {
			expect(
				getAvailableAttributes(professions, "Elementalist", "Nonexistent"),
			).toEqual([]);
			expect(
				getAvailableAttributes(professions, "Nonexistent", "Mesmer"),
			).toEqual([]);
		});

		it('returns an empty array when either profession name is "None"', () => {
			expect(
				getAvailableAttributes(professions, "None", "Elementalist"),
			).toEqual([]);
			expect(
				getAvailableAttributes(professions, "Elementalist", "None"),
			).toEqual([]);
		});

		it("returns deduplicated attributes including the primary profession primaryAttribute first", () => {
			const result = getAvailableAttributes(
				professions,
				"Elementalist",
				"Mesmer",
			);

			expect(result).toEqual([
				"Energy Storage",
				"Air Magic",
				"Fire Magic",
				"Illusion Magic",
				"Domination Magic",
			]);
		});

		it("handles primary professions without a primaryAttribute", () => {
			const result = getAvailableAttributes(
				professions,
				"Mesmer",
				"Elementalist",
			);

			// No primaryAttribute for Mesmer, just its secondaryAttributes,
			// followed by Elementalist secondary attributes (excluding its primaryAttribute).
			expect(result).toEqual([
				"Illusion Magic",
				"Domination Magic",
				"Air Magic",
				"Fire Magic",
			]);
		});
	});
});
