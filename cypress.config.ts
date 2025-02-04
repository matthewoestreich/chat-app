import "dotenv/config";
import { defineConfig } from "cypress";
import viteConfig from "./client/vite.config.ts";

export default defineConfig({
  projectId: "t5349w",

  e2e: {
    baseUrl: `http://localhost:${process.env.EXPRESS_PORT}`,
    experimentalInteractiveRunEvents: true,
    setupNodeEvents(_on, config) {
      //_on("before:run", async () => {});

      return config;
    },
  },

  component: {
    devServer: {
      viteConfig,
      framework: "react",
      bundler: "vite",
    },
  },
});
