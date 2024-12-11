import dotenv from "dotenv";
dotenv.config({ path: nodePath.resolve(__dirname, "../.env") });
import nodePath from "node:path";
import nodeFs from "node:fs";
import { BACKUP_FILE_PATH, BACKUP_FILE_NAME, DATABASE_PATH } from "./database";
import { getGistFiles } from "./gist";
import { restoreDatabase } from "./database";

const { log, error } = console;

(async () => {
  if (!process.env.GH_GISTS_API_KEY) {
    error("[restoreDatabaseFromGist] gists api key not found.");
    return;
  }
  if (!process.env.GIST_ID) {
    error("[restoreDatabaseFromGist] gist id not found");
    return;
  }

  try {
    log(`[restoreDatabaseFromGist][BEGIN]`);
    console.log(` -> Getting Gist`);
    const files = await getGistFiles(process.env.GIST_ID, process.env.GH_GISTS_API_KEY);
    console.log(`  -> Got Gist`);

    console.log(` -> Writing contents to file`);
    const file = files.find((f) => f.filename === BACKUP_FILE_NAME);
    if (!file) {
      const errMsg = `[restoreDbFromGist] backup file not found in gist.`;
      return console.error(errMsg);
    }
    const tempBackupPath = nodePath.resolve(__dirname, `./${BACKUP_FILE_NAME}`);
    const tempDbPath = nodePath.resolve(__dirname, "./testrestore.db");

    nodeFs.writeFileSync(tempBackupPath, file.content);
    console.log(`  -> Wrote contents to file`);

    console.log(` -> Starting restore`);
    await restoreDatabase(tempDbPath, tempBackupPath);
    console.log(`\n[restoreDatabaseFromGist][SUCCESS] Database restored.\n`);
  } catch (e) {
    console.error(`[restoreDatabaseFromGist] something went wrong restoring db from gist`, e);
  }
})();
