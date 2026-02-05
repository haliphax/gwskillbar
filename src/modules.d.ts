type AttributeData = {
	[p: string]: {
		desc: string;
		vars: {
			[p: string]: number[];
		};
	};
};

type LookupArray = { [p: string]: boolean };

type SkillData = {
	adrenaline?: number;
	activate?: number;
	attribute?: string;
	desc: string;
	energy?: number;
	health?: number;
	overcast?: number;
	profession?: string;
	recharge?: number | null;
};

type SkillsData = {
	[p: string]: SkillData;
};

type BuildTemplate = {
	primary: string;
	secondary: string;
	attributes: { [p: string]: number };
	skills: string[];
};
