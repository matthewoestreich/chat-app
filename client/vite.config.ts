import nodePath from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const OUTPUT_PATH: string = process.env.VITE_ENV === "dev" ? "../www" : "../dist/www";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ include: "**/*.{ts,js,tsx}" })],
  base: "./",
  root: nodePath.resolve(__dirname, "./src"),
  build: {
    outDir: nodePath.resolve(__dirname, OUTPUT_PATH),
    emptyOutDir: true,
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
