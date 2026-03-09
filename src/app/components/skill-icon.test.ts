import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import SkillIcon from "./skill-icon.vue";

describe("SkillIcon component", () => {
	let skillIcon: VueWrapper;

	beforeEach(() => {
		skillIcon = mount(SkillIcon, {
			props: { name: "Fireball" },
		});
	});

	afterEach(() => {
		skillIcon.unmount();
	});

	it("renders the skill icon image with the correct attributes", () => {
		const img = skillIcon.find("img");

		expect(img.attributes("alt")).toBe("[Fireball skill icon]");
		expect(img.attributes("src")).toBe("images/skills/Fireball.jpg");
		expect(img.attributes("draggable")).toBe("true");
	});

	it("uses the provided class on the img element", async () => {
		await skillIcon.setProps({ class: "custom-class" });

		const img = skillIcon.find("img");

		expect(img.attributes("class")).toBe("custom-class");
	});

	it("does not allow dragging when the name is 'No Skill'", async () => {
		await skillIcon.setProps({ name: "No Skill" });

		const img = skillIcon.find("img");

		expect(img.attributes("draggable")).toBe("false");
	});

	it("marks allegiance skills with an ally class and increased height", async () => {
		await skillIcon.setProps({ allegianceSkill: true });

		const span = skillIcon.find("span");
		const img = skillIcon.find("img");

		expect(span.classes()).toContain("ally");
		expect(img.attributes("height")).toBe("200%");
	});
});
