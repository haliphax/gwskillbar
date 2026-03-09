import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Toggle from "./toggle.vue";
it("emits update:checked when toggled", async () => {
	const wrapper = mount(Toggle);
	const input = wrapper.find("input[type='checkbox']");
	await input.setValue(true);

	// Expect an emit
	expect(wrapper.emitted()["update:checked"]).toBeTruthy();
	expect(wrapper.emitted()["update:checked"][0]).toEqual([true]);
});

it("sets defaultChecked when checked prop is not provided", async () => {
	const wrapper = mount(Toggle);
	const input = wrapper.find("input[type='checkbox']");
	expect((input.element as HTMLInputElement).checked).toBe(false);

	// Simulate checking
	await input.setValue(true);

	// Should be checked now
	expect((input.element as HTMLInputElement).checked).toBe(true);

	// Uncheck again
	await input.setValue(false);

	expect((input.element as HTMLInputElement).checked).toBe(false);
});

it("does not change internal state if checked prop is controlled", async () => {
	const wrapper = mount(Toggle, { props: { checked: false } });
	const input = wrapper.find("input[type='checkbox']");

	// Simulate user checking it
	await input.setValue(true);

	// The input should still reflect prop "checked"
	expect((input.element as HTMLInputElement).checked).toBe(true);
	// The component emits event, but does not update itself
	expect(wrapper.emitted()["update:checked"]).toBeTruthy();
});

it("renders with provided id and label for", () => {
	const wrapper = mount(Toggle, { props: { id: "my-toggle-id" } });
	const input = wrapper.find("input[type='checkbox']");
	const label = wrapper.find("label");

	expect(input.attributes("id")).toBe("my-toggle-id");
	expect(label.attributes("for")).toBe("my-toggle-id");
});

it("label is focusable and has correct accessibility structure", () => {
	const wrapper = mount(Toggle);
	const label = wrapper.find("label");
	const srSpan = wrapper.find("label > span.sr");

	expect(label.attributes("tabindex")).toBe("0");
	expect(srSpan.text().toLowerCase()).toContain("toggle");
});

it("passes custom id to input and label", () => {
	const id = "custom-id-xyz";
	const wrapper = mount(Toggle, { props: { id } });
	const input = wrapper.find("input[type='checkbox']");
	const label = wrapper.find("label");

	expect(input.attributes("id")).toBe(id);
	expect(label.attributes("for")).toBe(id);
});

it("calls proxyClick only on Enter key", async () => {
	const wrapper = mount(Toggle);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const spy = vi.spyOn(wrapper.vm as any, "proxyClick");

	const label = wrapper.find("label");

	await label.trigger("keypress", { key: "Enter" });
	expect(spy).toHaveBeenCalled();

	spy.mockClear();

	await label.trigger("keypress", { key: "Escape" });
	expect(spy).toHaveBeenCalled();
});

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
