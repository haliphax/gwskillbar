export type SessionSettings = {
	darkMode: boolean;
};

export type SessionState = {
	id: string;
	settings: SessionSettings;
};

export type StoreState = {
	session: SessionState;
};
