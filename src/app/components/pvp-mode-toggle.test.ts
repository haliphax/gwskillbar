import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PvpModeToggle from "./pvp-mode-toggle.vue";
import Toggle from "./toggle.vue";

describe("PvpModeToggle component", () => {
	let pvpModeToggle: VueWrapper;

	beforeEach(() => {
		pvpModeToggle = mount(PvpModeToggle, {
			props: { pvp: false, id: "pvp-toggle-id" },
		});
	});

	afterEach(() => {
		pvpModeToggle.unmount();
	});

	it("renders a label and toggle wired to the provided id", () => {
		const label = pvpModeToggle.find("label");
		const toggle = pvpModeToggle.findComponent(Toggle);

		expect(label.attributes("for")).toBe("pvp-toggle-id");
		expect(toggle.exists()).toBe(true);
		expect(toggle.props("id")).toBe("pvp-toggle-id");
	});

	it("defaults the id when none is provided", () => {
		pvpModeToggle.unmount();
		pvpModeToggle = mount(PvpModeToggle, {
			props: { pvp: false },
		});

		const label = pvpModeToggle.find("label");
		const toggle = pvpModeToggle.findComponent(Toggle);

		expect(label.attributes("for")).toBe("pvp-toggle");
		expect(toggle.props("id")).toBe("pvp-toggle");
	});

	it("shows only the correct label for PvE and PvP modes", async () => {
		const spans = pvpModeToggle.findAll(".pvp-icon");
		const [pvpSpan, pveSpan] = spans;

		// Check that the rendered text contents are correct
		expect(pvpSpan.text()).toContain("PvP");
		expect(pveSpan.text()).toContain("PvE");

		// Check display state using the actual inline style attribute
		expect(pveSpan.attributes("style") || "").not.toContain("display: none");
		expect(pvpSpan.attributes("style") || "").toContain("display: none");

		await pvpModeToggle.setProps({ pvp: true });

		expect(pveSpan.attributes("style") || "").toContain("display: none");
		expect(pvpSpan.attributes("style") || "").not.toContain("display: none");
	});

	it("emits a change event when the inner toggle changes", async () => {
		const toggle = pvpModeToggle.findComponent(Toggle);

		toggle.vm.$emit("update:checked", true);

		expect(pvpModeToggle.emitted().change).toEqual([[true]]);
	});
});
