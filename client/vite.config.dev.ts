import nodePath from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ include: "**/*.{ts,js,tsx}" })],
  base: "",
  root: nodePath.resolve(__dirname, "./src"),
  build: {
    outDir: nodePath.resolve(__dirname, "../www"),
    emptyOutDir: true,
  },
});
