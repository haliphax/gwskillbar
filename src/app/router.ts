import { createRouter, createWebHashHistory } from "vue-router";
import { ROOT_URI } from "./constants";
import Edit from "./views/edit.vue";
import Home from "./views/home.vue";
import Stats from "./views/stats.vue";
import View from "./views/view.vue";

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			path: `${ROOT_URI}`,
			component: Home,
			name: "home",
		},
		{
			path: `${ROOT_URI}:template+/:mode(pvp)/edit`,
			component: Edit,
			name: "edit",
		},
		{
			path: `${ROOT_URI}:template+/edit`,
			component: Edit,
			name: "edit",
		},
		{
			path: `${ROOT_URI}:template+/:mode(pvp)/stats`,
			component: Stats,
			name: "stats",
		},
		{
			path: `${ROOT_URI}:template+/stats`,
			component: Stats,
			name: "stats",
		},
		{
			path: `${ROOT_URI}:template+/:mode(pvp)`,
			component: View,
			name: "view",
		},
		{
			path: `${ROOT_URI}:template+`,
			component: View,
			name: "view",
		},
	],
});

export default router;
