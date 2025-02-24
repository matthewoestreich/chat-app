import nodePath from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const IS_DEV = process.env.NODE_ENV === "development";

export default defineConfig({
  base: "/",
  root: nodePath.resolve(__dirname, "./src"),
  build: {
    outDir: nodePath.resolve(__dirname, IS_DEV ? "../www" : "../dist/www"),
    emptyOutDir: true,
    minify: "esbuild",
  },
  esbuild: {
    drop: IS_DEV ? undefined : ["console", "debugger"],
  },
  plugins: [
    react({
      include: "**/*.{ts,js,tsx}",
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    alias: {
      "@src": nodePath.resolve(__dirname, "../client/src"),
      "@client": nodePath.resolve(__dirname, "../client/"),
      "@server": nodePath.resolve(__dirname, "../server/"),
      "@components": nodePath.resolve(__dirname, "./src/components/index.ts"),
      "@pages": nodePath.resolve(__dirname, "./src/pages/"),
      "@hooks": nodePath.resolve(__dirname, "./src/hooks/index.ts"),
      "@styles": nodePath.resolve(__dirname, "./src/styles"),
      "@root": nodePath.resolve(__dirname, "../"),
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3001,
  },
});
