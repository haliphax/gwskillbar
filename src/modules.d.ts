type AttributeData = {
	[p: string]: {
		desc: string;
		vars: {
			[p: string]: number[];
		};
	};
};

type BuildTemplate = {
	primary: string;
	secondary: string;
	attributes: { [p: string]: number };
	skills: string[];
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

type StatTotals = {
	activate: number;
	adrenaline: number;
	attribute: { [p: string]: number };
	energy: number;
	health: number;
	overcast: number;
	profession: { [p: string]: number };
	recharge: number;
};

type Stats = {
	average: {
		activate: number;
		adrenaline: number;
		energy: number;
		health: number;
		overcast: number;
		recharge: number;
	};
	percentage: {
		attribute: { [p: string]: number };
		profession: { [p: string]: number };
	};
	total: StatTotals;
};

type StringMap = { [p: string]: string };
