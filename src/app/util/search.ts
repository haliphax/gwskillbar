export const buildTree = (data: string[]): StringTree => {
	const tree: StringTree = {};

	for (const value of data) {
		const lower = value.toLowerCase();

		for (let i = 0; i < lower.length - 3; i++) {
			let pos = tree;

			for (let j = 0; j < 3; j++) {
				const letter = lower[i + j];

				if (!pos[letter]) {
					if (j < 2) {
						pos[letter] = {};
					} else {
						pos[letter] = new Set<string>();
					}
				}

				(pos as StringTreeLeaf) = pos[letter];
			}

			(pos as StringTreeLeaf as Set<string>).add(value);
		}
	}

	return tree;
};

export const searchTree = (tree: StringTree, search: string): string[] => {
	const sub = search.toLowerCase();

	if (sub.length < 3) {
		throw "Must be at least 3 characters";
	}

	let pos = tree;

	for (let i = 0; i < 3; i++) {
		const letter = sub[i];
		(pos as StringTreeLeaf) = pos[letter];

		if (pos === undefined) {
			return [];
		}
	}

	const leaf = Array.from((pos as StringTreeLeaf as Set<string>).values());

	if (sub.length === 3) {
		return leaf;
	}

	return leaf.filter((v) => v.toLowerCase().indexOf(sub) >= 0);
};
