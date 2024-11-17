/** @type {import('ts-jest').JestConfigWithTsJest} **/
import tsconfig from "./tsconfig.json" with { type: "json" };
import { pathsToModuleNameMapper } from "ts-jest";

export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: "<rootDir>/" }),
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
