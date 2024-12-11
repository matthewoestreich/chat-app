import nodeFs from "node:fs";
import { BACKUP_FILE_PATH, BACKUP_FILE_NAME, DATABASE_PATH } from "./database";
import { getGistFiles } from "./gist";
import { restoreDatabase } from "./database";

const { log, error } = console;

export default async function restoreDatabaseFromGist() {
  if (!process.env.GH_GISTS_API_KEY) {
    return error("[restoreDatabaseFromGist] gists api key not found.");
  }
  if (!process.env.GIST_ID) {
    return error("[restoreDatabaseFromGist] gist id not found");
  }

  try {
    log(`[restoreDatabaseFromGist][BEGIN]`);
    log(` -> Getting Gist`);
    const files = await getGistFiles(process.env.GIST_ID, process.env.GH_GISTS_API_KEY);
    log(`  -> Got Gist`);

    log(` -> Writing contents to file`);
    const file = files.find((f) => f.filename === BACKUP_FILE_NAME);
    if (!file) {
      const errMsg = `[restoreDbFromGist] backup file not found in gist.`;
      return console.error(errMsg);
    }

    nodeFs.writeFileSync(DATABASE_PATH, file.content);
    log(`  -> Wrote contents to file`);

    log(` -> Starting restore`);
    await restoreDatabase(DATABASE_PATH, BACKUP_FILE_PATH);

    log(` -> Removing backup file..`);
    nodeFs.unlinkSync(BACKUP_FILE_PATH);

    log(`\n[restoreDatabaseFromGist][SUCCESS] Database restored.\n`);
  } catch (e) {
    error(`[restoreDatabaseFromGist] something went wrong restoring db from gist`, e);
  }
}
