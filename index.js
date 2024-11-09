import "dotenv/config";
import "./wss/index.js";
import server, { CHAT_ROOMS } from "./server/index.js";

process.env.EXPRESS_PORT = process.env.EXPRESS_PORT || 3000;

if (process.env.WSS_URL.endsWith("onrender.com")) {
	// Only purge rooms if we are on a hosted platform.
	const twentyFourHoursInMinutes = 1440;
	purgeRooms(twentyFourHoursInMinutes);
} else {
	// Add port to wss url if we are running local.
	process.env.WSS_URL += `:${process.env.EXPRESS_PORT}`;
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
