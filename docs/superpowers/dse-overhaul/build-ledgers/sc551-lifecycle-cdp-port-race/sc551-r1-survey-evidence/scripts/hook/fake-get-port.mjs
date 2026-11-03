export default async function getPort() {
	const p = Number(process.env.FORCE_PORT);
	console.log(`[fake get-port] returning ${p} (the number another process grabbed after the real check)`);
	return p;
}
export const portNumbers = () => [];
