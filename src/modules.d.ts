type SkillData = {
	adrenaline?: number;
	activate?: number;
	desc: string;
	energy?: number;
	health?: number;
	overcast?: number;
	recharge?: number | null;
};

type SkillsData = {
	[p: string]: SkillData;
};
