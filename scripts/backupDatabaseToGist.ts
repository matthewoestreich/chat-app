import nodeFs from "node:fs";
import { BACKUP_FILE_PATH, DATABASE_PATH } from "./database";
import { updateGist } from "./gist";
import { backupDatabase } from "./database";

const { log, error } = console;

if (require.main === module) {
  (async () => {
    await backupDatabaseToGist();
  })();
}

export default async function backupDatabaseToGist() {
  if (!process.env.GH_GISTS_API_KEY) {
    error("[backupDbAndUploadGist] gists api key not found.");
    return;
  }
  if (!process.env.GIST_ID) {
    error("[backupDbAndUploadGist] gist id not found");
    return;
  }

  try {
    log("[backupDbAndUploadGist][BEGIN]");
    // Backup db to file
    log(" -> Database backup started");
    await backupDatabase(DATABASE_PATH, BACKUP_FILE_PATH);
    log("  -> Database backup complete");
    log(" -> Uploading gist.");
    // Update our gist with new data
    await updateGist([BACKUP_FILE_PATH], process.env.GIST_ID, process.env.GH_GISTS_API_KEY);
    log("  -> Uploaded gist.");
    // Delete local backup file after uploading gist
    log("-> Removing backup file.");
    nodeFs.unlinkSync(BACKUP_FILE_PATH);
    log("\n[backupDbAndUploadGist][SUCCESS] Done.\n");
  } catch (e) {
    nodeFs.unlinkSync(BACKUP_FILE_PATH);
    error(`[backupDbAndUploadGist][ERROR]`, e);
  }
}
