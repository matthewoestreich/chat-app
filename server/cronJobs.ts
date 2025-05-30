import { CronJob } from "cron";
import { DatabaseProvider } from "@server/types";

export const keepAliveCronJob = keepAlive();
export const backupDatabaseCronJob = backupDatabase;

function keepAlive(host = `https://rtchat-a7ul.onrender.com`): CronJob {
  return new CronJob(
    "*/3 * * * *", // Every third minute
    function () {
      fetch(host)
        .then((resp) => resp.text())
        .then(() => console.log(`[CronJob][Result] Success!`))
        .catch((e) => console.error(`[CronJob][Error]`, e));
    },
  );
}

function backupDatabase<T>(provider: DatabaseProvider<T>): CronJob {
  return new CronJob(
    "0 * * * *", // Every hour
    async function () {
      await provider.backup();
    },
  );
}
