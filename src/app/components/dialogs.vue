<script lang="ts">
import { StoreState } from "@/client/app/store/types";
import { defineComponent } from "vue";
import { Module } from "vuex";

export type DialogPayload = {
	id: string | undefined;
	text: string;
};

export type DialogsState = {
	responseId: string;
	dialogText: string;
};

export type DialogsStoreState = {
	dialogs: DialogsState;
};

const Dialogs = defineComponent({
	data() {
		return {
			stateModule: {
				actions: {
					alert: (_ctx, payload) => this.alert(payload),
					confirm: (_ctx, payload) => this.confirm(payload),
					// other components should subscribe to the actions below
					close: () => {},
					confirmed: () => {},
				},
				mutations: {
					dialogText: (state, payload) => (state.dialogText = payload),
					responseId: (state, payload) => (state.responseId = payload),
				},
				state() {
					return {
						dialogText: "",
						responseId: "",
					};
				},
			} as Module<DialogsState, DialogsStoreState | StoreState>,
		};
	},
	computed: {
		alertDialog() {
			return this.$refs.alert as HTMLDialogElement;
		},
		confirmDialog() {
			return this.$refs.confirm as HTMLDialogElement;
		},
		dialogsState() {
			return (this.$store.state as unknown as DialogsStoreState).dialogs;
		},
	},
	created() {
		this.$store.registerModule("dialogs", this.stateModule);
	},
	mounted() {
		for (const d of [this.alertDialog, this.confirmDialog]) {
			d.addEventListener(
				"close",
				async () =>
					await this.$store.dispatch("close", this.dialogsState.responseId),
			);
		}
	},
	unmounted() {
		this.$store.unregisterModule("dialogs");
	},
	methods: {
		alert(payload: DialogPayload) {
			this.$store.commit("responseId", payload.id ?? "");
			this.$store.commit("dialogText", payload.text);
			this.alertDialog.showModal();
		},
		confirm(payload: DialogPayload) {
			this.$store.commit("responseId", payload.id!);
			this.$store.commit("dialogText", payload.text);
			this.confirmDialog.showModal();
		},
		async confirmClick() {
			this.confirmDialog.close("OK");
			await this.$store.dispatch("confirmed", this.dialogsState.responseId);
		},
	},
});

export default Dialogs;
</script>

<template>
	<span>
		<dialog ref="alert">
			<form method="dialog">
				<fieldset>
					<legend>Alert</legend>
					<p>{{ dialogsState.dialogText }}</p>
					<div>
						<button class="fr" type="submit">
							<span aria-hidden="true">✅</span>
							OK
						</button>
					</div>
				</fieldset>
			</form>
		</dialog>
		<dialog ref="confirm">
			<form method="dialog">
				<fieldset>
					<legend>Confirm</legend>
					<p>{{ dialogsState.dialogText }}</p>
					<div>
						<button type="submit" value="Cancel">
							<span aria-hidden="true">🚫</span>
							Cancel
						</button>
						<button class="fr" value="OK" @click.prevent="confirmClick">
							<span aria-hidden="true">✅</span>
							OK
						</button>
					</div>
				</fieldset>
			</form>
		</dialog>
	</span>
</template>

<style lang="less" scoped>
dialog {
	background-color: var(--color-bg-global);
	border: 1px solid #000;
	color: var(--color-fg-global);
	margin: auto;
	max-width: 40rem;
	padding: var(--space-l);
	width: 100%;
}

dialog::backdrop {
	backdrop-filter: blur(8px);
	background-color: rgba(0, 0, 0, 0.2);
}
</style>
