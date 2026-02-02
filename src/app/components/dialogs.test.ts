import store from "@/app/store";
import { VueWrapper, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Dialogs, { DialogsState, DialogsStoreState } from "./dialogs.vue";

describe("Dialogs component", () => {
	let dialogs: VueWrapper;
	let dialogsState: DialogsState;

	beforeEach(() => {
		dialogs = mount(Dialogs, { global: { plugins: [store] } });
		dialogsState = (dialogs.vm.$store.state as unknown as DialogsStoreState)
			.dialogs;
	});

	afterEach(() => {
		dialogs.unmount();
	});

	it("registers the dialogs vuex store module", () => {
		expect(store.hasModule("dialogs")).toBe(true);
	});

	it("sets dialog props on alert action dispatch", async () => {
		await store.dispatch("alert", { text: "alert" });
		expect(dialogsState.dialogText).toBe("alert");
	});

	it("sets dialog props on confirm action dispatch", async () => {
		await store.dispatch("confirm", { id: "id", text: "confirm" });
		expect(dialogsState.responseId).toBe("id");
		expect(dialogsState.dialogText).toBe("confirm");
	});

	it("dispatches close action when dialog is closed", async () => {
		const dialog = dialogs.vm.$refs.confirm as HTMLDialogElement;
		let closed = false;

		store.subscribeAction((o) => {
			if (o.type == "close") {
				closed = true;
			}
		});

		dialog.dispatchEvent(new Event("close"));

		expect(closed).toBe(true);
	});

	it("dispatches confirmed action when OK is clicked", async () => {
		const dialog = dialogs.vm.$refs.confirm as HTMLDialogElement;
		const ok = dialog.querySelector("button[value='OK']")!;
		let confirmed = false;

		store.subscribeAction((o) => {
			if (o.type == "confirmed") {
				confirmed = true;
			}
		});

		ok.dispatchEvent(new Event("click"));

		expect(confirmed).toBe(true);
	});
});
