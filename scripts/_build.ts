import fs from "node:fs";
import path from "node:path";

console.log("~~~~~~~~~~ RUNNING _BUILD SCRIPT!");
console.log("~~~~~~~~~~ This script copies assets into build destination specified in tsconfig.json outDir\n");

try {
  const CWD = __dirname;
  const tsconfig = JSON.parse(fs.readFileSync(path.resolve(CWD, "../tsconfig.json"), "utf-8"));

  const COPY_MAP = [
    {
      isDir: true,
      isRecursive: true,
      from: "../www",
      to: tsconfig.compilerOptions.outDir,
    },
    {
      isDir: false,
      isRecursive: false,
      from: "../server/db/rtchat",
      to: `${tsconfig.compilerOptions.outDir}/server/db`,
    },
  ];

  for (const job of COPY_MAP) {
    try {
      const dirname = path.basename(job.from);
      const src = path.resolve(CWD, job.from);
      const dest = path.resolve(CWD, "..", job.to, dirname);

      if (job.isDir) {
        fs.cpSync(src, dest, { recursive: job.isRecursive });
        console.log(`Copied:\n\t${src}\ninto\n\t${dest}`);
      } else {
        fs.copyFileSync(src, dest);
        console.log(`Copied:\n\t${src}\nto\n\t${dest}`);
      }
    } catch (e) {
      console.error(`[_build.js][ERROR] Error during copy.`, e);
      process.exit(1);
    }
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
