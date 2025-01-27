import "dotenv/config";
import nodeFs from "node:fs";
import appRootPath from "./appRootPath";
import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "t5349w",
  e2e: {
    baseUrl: `http://localhost:${process.env.EXPRESS_PORT}`,
    experimentalInteractiveRunEvents: true,
    setupNodeEvents(on, config) {
      on("before:run", async () => {
        if (nodeFs.existsSync(appRootPath + "/test.db")) {
          console.log("Database exists!");
        } else {
          console.log("Database does not exist!");
        }
      });

      return config;
    },
  },
});
