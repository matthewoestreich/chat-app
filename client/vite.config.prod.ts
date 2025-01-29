import nodePath from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ include: "**/*.{ts,js,tsx}" })],
  base: "./",
  root: nodePath.resolve(__dirname, "./src"),
  build: {
    outDir: nodePath.resolve(__dirname, "../dist/www"),
  },
  resolve: {
    alias: {
      "@client": nodePath.resolve(__dirname, "../client"),
      "@components": nodePath.resolve(__dirname, "./src/components/index.ts"),
      "@pages": nodePath.resolve(__dirname, "./src/pages/index.ts"),
      "@hooks": nodePath.resolve(__dirname, "./src/hooks/index.ts"),
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3001,
  },
});
