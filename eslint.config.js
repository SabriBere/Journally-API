// eslint.config.js
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
    js.configs.recommended, // incluye eslint:recommended
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2024,
            sourceType: "module",
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            eqeqeq: "error",
            "no-var": "error",
            "no-console": "off",
            "require-await": "warn",
            "no-unused-vars": "warn",
            "no-inline-comments": "off",
            "no-duplicate-imports": "warn",
            "array-callback-return": "off",
        },
    },
    {
        name: "prettier",
        ...prettier,
    },
];
