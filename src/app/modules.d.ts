import Vue from "vue";
import { Store } from "vuex";
import { StoreState } from "./store/types";

declare module "*.vue" {
	export default Vue;
}

declare module "@vue/runtime-core" {
	interface ComponentCustomProperties {
		$store: Store<StoreState>;
	}
}
