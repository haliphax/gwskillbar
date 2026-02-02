import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import vue from "eslint-plugin-vue";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import parser from "vue-eslint-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default defineConfig([
	globalIgnores(["**/dist/"]),
	{
		extends: compat.extends(
			"eslint:recommended",
			"plugin:@typescript-eslint/recommended",
			"plugin:prettier/recommended",
		),

		plugins: {
			vue,
			"@typescript-eslint": typescriptEslint,
			prettier,
		},

		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},

			parser: parser,
			ecmaVersion: "latest",
			sourceType: "module",

			parserOptions: {
				parser: "@typescript-eslint/parser",
			},
		},

		rules: {
			indent: [
				"error",
				"tab",
				{
					ignoredNodes: ["PropertyDefinition"],
					offsetTernaryExpressions: true,
					SwitchCase: 1,
				},
			],

			"vue/multi-word-component-names": "off",
		},
	},
]);
