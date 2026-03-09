import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ProfessionIcon from "./profession-icon.vue";

describe("ProfessionIcon component", () => {
	let professionIcon: VueWrapper;

	beforeEach(() => {
		professionIcon = mount(ProfessionIcon, {
			props: { name: "Monk" },
		});
	});

	afterEach(() => {
		professionIcon.unmount();
	});

	it("renders the profession icon image with the correct attributes", () => {
		const img = professionIcon.find("img");

		expect(img.attributes("alt")).toBe("[Monk profession icon]");
		expect(img.attributes("src")).toBe("images/professions/Monk.png");
		expect(img.attributes("class")).toContain("prof-icon");
	});

	it("uses the provided class on the img element while keeping the prof-icon class", async () => {
		await professionIcon.setProps({ class: "custom-class" });

		const img = professionIcon.find("img");

		expect(img.attributes("class")).toContain("custom-class prof-icon");
	});
});
