import skills from "@/data/skills.json";

type StringTree = {
	[p: string]: string[] | StringTree;
};

const buildTree = (data: string[]): StringTree => {
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
						pos[letter] = [];
					}
				}

				(pos as StringTree | string[]) = pos[letter] as string[];
			}

			(pos as unknown as string[]).push(value);
		}
	}

	return tree;
};

const searchTree = (tree: StringTree, search: string): string[] => {
	const sub = search.toLowerCase();
	const head = sub.slice(0, 3);

	if (head.length < 3) {
		throw "Must be at least 3 characters";
	}

	let pos = tree;

	for (let j = 0; j < 3; j++) {
		const letter = sub[j];
		(pos as StringTree | string[]) = pos[letter];

		if (pos === undefined) {
			return [];
		}
	}

	if (sub.length === 3) {
		return pos as unknown as string[];
	}

	return (pos as unknown as string[]).filter(
		(v) => v.toLowerCase().indexOf(sub) >= 0,
	);
};

const tree = buildTree(Object.values(skills).map((v) => decodeURIComponent(v)));
const sub = process.argv[2];
console.log(searchTree(tree, sub));
