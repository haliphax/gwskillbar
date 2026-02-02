import { createStore } from "vuex";
import session from "./session";
import { StoreState } from "./types";

const store = createStore<StoreState>({ modules: { session } });

export default store;
