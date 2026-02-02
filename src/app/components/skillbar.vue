<script lang="ts" setup>
import attributes from "@/app/data/attributes.json";
import professions from "@/app/data/professions.json";
import skills from "@/app/data/skills.json";
import ProfessionIcon from "./profession-icon.vue";
import SkillIcon from "./skill-icon.vue";

const CHAR_MAP =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const props = defineProps<{
	code: string;
}>();

let primary: string;
let secondary: string;
const attribs: { [p: string]: number } = {};
let skillBar: string[] = [];

const extract = (bits: string[], count: number): number =>
	parseInt(bits.splice(0, count).reverse().join(""), 2);

const parse = (code: string) => {
	const decoded = Array.from(code).map((v) => CHAR_MAP.indexOf(v));
	const bits = decoded.flatMap((v) =>
		Array.from((v >>> 0).toString(2).padStart(6, "0")).reverse(),
	);
	const templateType = extract(bits, 4);

	if (templateType !== 14) {
		throw "Invalid template type";
	}

	const templateVersion = extract(bits, 4);

	if (templateVersion !== 0) {
		throw "Invalid template type";
	}

	const professionBits = extract(bits, 2) * 2 + 4;

	try {
		primary = professions[extract(bits, professionBits)];
		secondary = professions[extract(bits, professionBits)];
	} catch (ex) {
		throw "Invalid profession";
	}

	const attributesCount = extract(bits, 4);
	const attributeBits = extract(bits, 4) + 4;

	try {
		for (let i = 0; i < attributesCount; i++) {
			const attribute = attributes[extract(bits, attributeBits)];
			const score = extract(bits, 4);

			attribs[attribute] = score;
		}
	} catch (ex) {
		throw "Invalid attribute";
	}

	const skillBits = extract(bits, 4) + 8;

	try {
		for (let i = 0; i < 8; i++) {
			const skillID = extract(bits, skillBits).toString();
			skillBar.push(
				decodeURIComponent((skills as { [p: string]: string })[skillID]),
			);
		}
	} catch (ex) {
		throw "Invalid skill";
	}
};

parse(props.code);
</script>

<template>
	<h2>
		<ProfessionIcon :name="primary"></ProfessionIcon>
		{{ primary }} /
		<ProfessionIcon :name="secondary"></ProfessionIcon>
		{{ secondary }}
	</h2>
	<fieldset>
		<legend>Attributes</legend>
		<ul>
			<li v-for="(score, attribute) of attribs" :key="attribute">
				{{ attribute }}: {{ score }}
			</li>
		</ul>
	</fieldset>
	<fieldset>
		<legend>Skills</legend>
		<ol>
			<li v-for="skill in skillBar" :key="skill">
				<SkillIcon :name="skill" :size="24"></SkillIcon>
				{{ skill }}
			</li>
		</ol>
	</fieldset>
</template>

<style lang="less">
/* ... */
</style>
