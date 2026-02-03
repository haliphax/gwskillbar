import { createRouter, createWebHashHistory } from "vue-router";
import { ROOT_URI } from "./constants";
import Home from "./views/home.vue";
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
			path: `${ROOT_URI}:template+`,
			component: View,
			name: "view",
		},
	],
});

export default router;
