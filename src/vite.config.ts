import inject from "@rollup/plugin-inject";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { viteSingleFile } from "vite-plugin-singlefile";
import { viteStaticCopy } from "vite-plugin-static-copy";
import pkg from "../package.json";

export default defineConfig({
	build: {
		emptyOutDir: true,
		outDir: resolve(__dirname, "..", "dist"),
		rollupOptions: {
			plugins: [inject({ Buffer: ["buffer", "Buffer"] })],
		},
	},
	define: {
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
	},
	plugins: [
		createHtmlPlugin({ minify: true }),
		viteSingleFile({ removeViteModuleLoader: true }),
		viteStaticCopy({
			targets: [
				{
					src: "images",
					dest: "./",
				},
			],
		}),
		vue(),
	],
	resolve: {
		alias: {
			"@": resolve(__dirname),
		},
	},
});
