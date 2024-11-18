/** @type {import('ts-jest').JestConfigWithTsJest} **/
const tsconfig = require("./tsconfig.json");
const { pathsToModuleNameMapper } = require("ts-jest");

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: "<rootDir>/" }),
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
