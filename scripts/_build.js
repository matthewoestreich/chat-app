import fs from "node:fs";
import path from "node:path";

console.log("~~~~~~~~~~ RUNNING _BUILD SCRIPT!");
console.log("~~~~~~~~~~ This script copies assets into build destination specified in tsconfig.json outDir\n");

const tsconfig = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../tsconfig.json"), "utf-8"));

const DESTINATION = path.resolve(import.meta.dirname, "../", tsconfig.compilerOptions.outDir);
const DIRS_TO_COPY = [path.resolve(import.meta.dirname, "../client"), path.resolve(import.meta.dirname, "../public")];

console.log(`** COPYING DIRS\n`);
for (const dir of DIRS_TO_COPY) {
  const destPath = `${DESTINATION}/${path.basename(dir)}`;
  console.log(`copy from ${dir}/* to ${destPath}`);
  fs.cpSync(dir, destPath, { recursive: true });
}

//console.log(`\n** COPYING DB\n`);
//fs.copyFileSync(path.resolve(import.meta.dirname, "../server/db/rtchat.db"), `${DESTINATION}/server/db/rtchat.db`);
