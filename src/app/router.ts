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
			path: `${ROOT_URI}:template+/pvp/edit`,
			component: Edit,
			name: "edit-pvp",
		},
		{
			path: `${ROOT_URI}:template+/edit`,
			component: Edit,
			name: "edit",
		},
		{
			path: `${ROOT_URI}:template+/pvp/stats`,
			component: Stats,
			name: "stats-pvp",
		},
		{
			path: `${ROOT_URI}:template+/stats`,
			component: Stats,
			name: "stats",
		},
		{
			path: `${ROOT_URI}:template+/pvp`,
			component: View,
			name: "view-pvp",
		},
		{
			path: `${ROOT_URI}:template+`,
			component: View,
			name: "view",
		},
	],
});

export default router;
