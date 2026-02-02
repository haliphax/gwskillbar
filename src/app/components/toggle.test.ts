import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Toggle from "./toggle.vue";

describe("Toggle component", () => {
	let toggle: VueWrapper;

	beforeEach(() => {
		toggle = mount(Toggle);
	});

	afterEach(() => {
		toggle.unmount();
	});

	it("mounts as unchecked by default", () => {
		expect(
			(toggle.find("input[type='checkbox']").element as HTMLInputElement)
				.checked,
		).toBe(false);
	});

	it("mounts as checked when prop is provided", () => {
		toggle = mount(Toggle, { props: { checked: true } });

		expect(
			(toggle.find("input[type='checkbox']").element as HTMLInputElement)
				.checked,
		).toBe(true);
	});

	it.each([
		// name, key, checked
		["toggles when enter pressed on label", "Enter", true],
		["does not toggle when keypress on label is not Enter", "Escape", false],
	])("%s", (_name, key, expected) => {
		const checkbox = toggle.find("input[type='checkbox']")
			.element as HTMLInputElement;

		expect(checkbox.checked).toBe(false);
		(toggle.find("label").element as HTMLLabelElement).dispatchEvent(
			new KeyboardEvent("keypress", { key }),
		);
		expect(checkbox.checked).toBe(expected);
	});
});
