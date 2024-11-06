import "dotenv/config";
import "./wss/index.js";
import server from "./server/index.js";

// Only purge rooms if we are on a hosted platform.
if (process.env.IS_RUNNING_LOCAL === "no") {
	const twentyFourHoursInMinutes = 1440;
	purgeRooms(twentyFourHoursInMinutes);
}

/**
 *
 * Iterates over each member in each room and closes the socket.
 * After that we reset the server.ROOMS to an empty object.
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

		// Purge rooms after closing all connections
		for (const members of Object.values(server.ROOMS)) {
			for (const member of Object.values(members)) {
				if (member?.socket) {
					member.socket.close(1000, "purge");
				}
			}
		}

		server.ROOMS = {};
	}, 1000 * 60 * everyMinutes);
}
