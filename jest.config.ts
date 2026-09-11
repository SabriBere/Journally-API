import type { Config } from "jest";

const config: Config = {
    testEnvironment: "node",
    testMatch: ["**/?(*.)+(spec|test).ts"],
    maxWorkers: 1,
    watchman: false,
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { diagnostics: { ignoreCodes: [151002] } }],
    },
    collectCoverageFrom: [
        "src/controllers/**/*.ts",
        "src/services/**/*.ts",
        "src/middlewares/**/*.ts",
    ],
};

export default config;
