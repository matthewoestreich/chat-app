import { CronJob } from "cron";
import backupDatabaseToGist from "./backupDatabaseToGist";

export const keepAliveJob = keepAlive();
export const backupDatabaseJob = backupDatabase();

function keepAlive(host = `https://rtchat-a7ul.onrender.com`): CronJob {
  return new CronJob(
    "*/3 * * * *", // Every 3 minutes..
    function () {
      fetch(host)
        .then((resp) => resp.text())
        .then(() => console.log(`[CronJob][Result] Success!`))
        .catch((e) => console.error(`[CronJob][Error]`, e));
    },
  );
}

function backupDatabase() {
  return new CronJob(
    "0 * * * *", // Every hour
    backupDatabaseToGist,
  );
}
