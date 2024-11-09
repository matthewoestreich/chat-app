import "dotenv/config";
import "./wss/index.js";
import { CHAT_ROOMS } from "./server/index.js";

// Only purge rooms if we are on a hosted platform.
if (process.env.IS_RUNNING_LOCAL === "no") {
	const twentyFourHoursInMinutes = 1440;
	purgeRooms(twentyFourHoursInMinutes);
}

/**
 *
 * Iterates over each member in each room and closes the socket.
 * After that we reset the rooms and members (in memory).
 *
 * This is bc all room related data is held in memory, so if
 * we are hosted somewhere I don't want to chew up RAM.
 *
 * @param {number} everyMinutes every N minutes we purge (where N=everyMinutes)
 *
 */
function purgeRooms(everyMinutes) {
	console.log(`[INFO][WARN] Purging is active!`);

	setInterval(() => {
		console.log(`\n*\n*\n*\n
      ~~~~~~~~~~~~~~~~~~~~
      ~~ PURGING ROOMS ~~~
      ~~~~~~~~~~~~~~~~~~~~
      \n*\n*\n*\n`);

		CHAT_ROOMS.purgeAll();
	}, 1000 * 60 * everyMinutes);
}
