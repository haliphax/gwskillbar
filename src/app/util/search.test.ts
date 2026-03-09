import { describe, expect, it } from "vitest";
import { buildTree, searchTree } from "./search";

describe("search util", () => {
	describe("buildTree and searchTree integration", () => {
		const values = ["Fireball", "Firestorm", "Ice Spike"];
		const tree = buildTree(values);

		it("supports case-insensitive prefix search of length 3", () => {
			const results = searchTree(tree, "fir");

			expect(results).toEqual(
				expect.arrayContaining(["Fireball", "Firestorm"]),
			);
			expect(results).not.toContain("Ice Spike");
		});

		it("supports case-insensitive search with longer substrings", () => {
			const results = searchTree(tree, "storm");

			expect(results).toEqual(["Firestorm"]);
		});

		it("returns all matches for a 3-character prefix regardless of original casing", () => {
			const results = searchTree(tree, "ICE");

			expect(results).toEqual(["Ice Spike"]);
		});

		it("returns an empty array when no entries match the 3-character prefix", () => {
			const results = searchTree(tree, "xyz");

			expect(results).toEqual([]);
		});
	});

	describe("searchTree error and edge cases", () => {
		const tree = buildTree(["Fireball"]);

		it("throws when the search string has fewer than 3 characters", () => {
			expect(() => searchTree(tree, "fi")).toThrow(
				"Must be at least 3 characters",
			);
			expect(() => searchTree(tree, "")).toThrow(
				"Must be at least 3 characters",
			);
		});

		it("returns all values in the leaf when search length is exactly 3", () => {
			const results = searchTree(tree, "fir");

			expect(results).toEqual(["Fireball"]);
		});
	});
});
