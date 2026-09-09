import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/?(*.)+(spec|test).ts"],
    watchman: false,
    globals: {
        "ts-jest": { diagnostics: { ignoreCodes: [151002] } },
    },
};

export default config;
