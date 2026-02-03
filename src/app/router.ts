import { Component } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { ROOT_URI } from "./constants";
import Home from "./views/home.vue";

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			path: `${ROOT_URI}`,
			component: Home as unknown as Component,
			name: "home",
		},
		{
			path: `${ROOT_URI}:template+`,
			component: Home as unknown as Component,
			name: "template",
		},
	],
});

export default router;
