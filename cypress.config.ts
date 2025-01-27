import "dotenv/config";
import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "t5349w",
  e2e: {
    baseUrl: `http://localhost:${process.env.EXPRESS_PORT}`,
    experimentalInteractiveRunEvents: true,
    setupNodeEvents(on, config) {
      on("before:run", async () => {});

      return config;
    },
  },
});
