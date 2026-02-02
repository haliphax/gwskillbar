import { LOCALSTORAGE_GLOBAL_PREFIX } from "@/app/constants";
import { v4 } from "uuid";
import { Module } from "vuex";
import { SessionSettings, SessionState, StoreState } from "./types";

const SESSION_PREFIX = `${LOCALSTORAGE_GLOBAL_PREFIX}session.`;

const keys = {
	darkMode: `${SESSION_PREFIX}darkMode`,
	sessionId: `${SESSION_PREFIX}sessionId`,
};

const session: Module<SessionState, StoreState> = {
	mutations: {
		session(state, payload: Partial<SessionState>) {
			state = {
				...state,
				...payload,
			};

			if (payload.id) {
				localStorage.setItem(keys.sessionId, payload.id);
			}

			if (payload.settings) {
				localStorage.setItem(
					keys.darkMode,
					payload.settings.darkMode.toString(),
				);
			}
		},
		"session.settings"(state, payload: Partial<SessionSettings>) {
			state.settings = {
				...state.settings,
				...payload,
			};

			if (payload.darkMode != undefined) {
				localStorage.setItem(keys.darkMode, payload.darkMode.toString());
			}
		},
	},
	state() {
		let sessionId = localStorage.getItem(keys.sessionId);

		if (!sessionId) {
			sessionId = v4();
			localStorage.setItem(keys.sessionId, sessionId);
		}

		const darkModeDetected = matchMedia("(prefers-color-scheme:dark)").matches;

		return {
			id: sessionId,
			settings: {
				darkMode: JSON.parse(
					localStorage.getItem(keys.darkMode) ?? darkModeDetected.toString(),
				),
			},
		};
	},
};

export default session;
