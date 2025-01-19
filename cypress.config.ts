// @ts-nocheck
import { defineConfig } from "cypress";
import { config } from "dotenv";
config();

console.log(process.env);

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${process.env.EXPRESS_PORT}`,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
