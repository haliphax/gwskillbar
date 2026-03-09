/**
 * Guild Wars attribute point costs (wiki.guildwars.com/wiki/Attribute_point).
 * Cumulative points required to reach each rank (0–12).
 */
const POINTS_TO_REACH_RANK = [0, 1, 3, 6, 10, 15, 21, 28, 37, 48, 61, 77, 97];

export function pointsToReachRank(rank: number): number {
	if (rank <= 0) return 0;
	if (rank > 12) return POINTS_TO_REACH_RANK[12];
	return POINTS_TO_REACH_RANK[rank];
}

export function pointsSpent(attributes: Record<string, number>): number {
	let total = 0;
	for (const rank of Object.values(attributes)) {
		total += pointsToReachRank(rank);
	}
	return total;
}

export const ATTRIBUTE_POINTS_MAX = 200;

type ProfessionEntry = {
	name: string;
	primaryAttribute: string | null;
	secondaryAttributes: string[];
};

export function getAvailableAttributes(
	professions: ProfessionEntry[],
	primaryName: string,
	secondaryName: string,
): string[] {
	const primary = professions.find((p) => p.name === primaryName);
	const secondary = professions.find((p) => p.name === secondaryName);
	if (
		!primary ||
		!secondary ||
		primary.name === "None" ||
		secondary.name === "None"
	) {
		return [];
	}

	const primaryAttrs =
		primary.primaryAttribute != null
			? [primary.primaryAttribute, ...primary.secondaryAttributes]
			: [...primary.secondaryAttributes];

	const secondaryPrimary = secondary.primaryAttribute;
	const secondaryAttrs = secondary.secondaryAttributes.filter(
		(attr) => attr !== secondaryPrimary,
	);

	const seen = new Set<string>();
	const result: string[] = [];
	for (const attr of [...primaryAttrs, ...secondaryAttrs]) {
		if (!seen.has(attr)) {
			seen.add(attr);
			result.push(attr);
		}
	}
	return result;
}
