export default function getRandomLightColor() {
	let color = "#";
	for (let i = 0; i < 6; i++) {
		// Generate a random hex digit (0-F)
		const digit = Math.floor(Math.random() * 16).toString(16);

		// Ensure the color is light by biasing towards higher values (A-F)
		if (Math.random() < 0.5) {
			color += digit;
		} else {
			color += Math.floor(Math.random() * 6 + 10).toString(16); // A-F
		}
	}
	return color;
}
