import { CronJob } from "cron";

function keepaliveJob(host = `https://rtchat-a7ul.onrender.com`): CronJob {
  return new CronJob(
    "*/3 * * * *", // Every 3 minutes..
    function () {
      fetch(host)
        .then((resp) => resp.text())
        .then((result) => console.log(`[CronJob][Result]`, result))
        .catch((e) => console.error(`[CronJob][Error]`, e));
    },
  );
}

export default keepaliveJob();
