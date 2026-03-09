import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import WikiLink from "./wiki-link.vue";

describe("WikiLink component", () => {
	let wikiLink: VueWrapper;

	beforeEach(() => {
		wikiLink = mount(WikiLink, {
			props: { path: "Some Path Name", title: "Some title" },
		});
	});

	afterEach(() => {
		wikiLink.unmount();
	});

	it("renders an anchor to the Guild Wars wiki with a cleaned path", () => {
		const anchor = wikiLink.find("a");

		expect(anchor.exists()).toBe(true);
		expect(anchor.attributes("href")).toBe(
			"https://wiki.guildwars.com/wiki/Some_Path_Name",
		);
		expect(anchor.attributes("title")).toBe("Some title");
	});

	it("updates the href when the path prop changes", async () => {
		const anchor = wikiLink.find("a");

		await wikiLink.setProps({ path: "Other Path" });

		expect(anchor.attributes("href")).toBe(
			"https://wiki.guildwars.com/wiki/Other_Path",
		);
	});
});
