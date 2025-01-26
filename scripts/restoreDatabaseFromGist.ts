import nodeFs from "node:fs";
import { restoreDatabase, BACKUP_FILE_PATH, BACKUP_FILE_NAME, DATABASE_PATH } from "./database";
import { getGistFiles } from "./gist";
import dotenv from "dotenv";
dotenv.config();

const { log, error } = console;

// @ts-ignore
if (require.main === module) {
  (async (): Promise<void> => {
    await restoreDatabaseFromGist();
  })();
}

export default async function restoreDatabaseFromGist(): Promise<void> {
  if (!process.env.GH_GISTS_API_KEY) {
    return error("[restoreDatabaseFromGist] gists api key not found.");
  }
  if (!process.env.GIST_ID) {
    return error("[restoreDatabaseFromGist] gist id not found");
  }

  try {
    log(`[restoreDatabaseFromGist][BEGIN]`);
    log(` -> Getting Gist`);
    const files = await getGistFiles(process.env.GH_GISTS_API_KEY, process.env.GIST_ID);
    log(`  -> Got Gist`);

    log(` -> Writing contents to file`);
    const file = files.find((f) => f.filename === BACKUP_FILE_NAME);
    if (!file) {
      return console.error(`[restoreDbFromGist] backup file not found in gist.`);
    }

    nodeFs.writeFileSync(BACKUP_FILE_PATH, file.content);
    log(`  -> Wrote contents to file`);

    log(` -> Starting restore`);
    await restoreDatabase(DATABASE_PATH, BACKUP_FILE_PATH);

    log(` -> Removing backup file..`);
    nodeFs.unlinkSync(BACKUP_FILE_PATH);

    log(`\n[restoreDatabaseFromGist][SUCCESS] Database restored.\n`);
  } catch (e) {
    nodeFs.unlinkSync(BACKUP_FILE_PATH);
    error(`[restoreDatabaseFromGist] something went wrong restoring db from gist`, e);
  }
}
