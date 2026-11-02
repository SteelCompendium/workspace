import { spawn } from 'node:child_process';
const [mode, rounds, base] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4])];
const worker = new URL('./sc546-r1-sim-worker.mjs', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let doubleAlive = 0, bothFd = 0, noneAlive = 0;
for (let r = 0; r < rounds; r++) {
	const n = base + r, barrier = Date.now() + 700;
	const run = () => new Promise((res) => { const c = spawn(process.execPath, [worker, mode, String(n), String(barrier)], { stdio: ['ignore', 'pipe', 'inherit'] }); let o = ''; c.stdout.on('data', (d) => (o += d)); c.on('exit', () => res(o)); });
	const outs = await Promise.all([run(), run()]);
	const rs = outs.map((o) => JSON.parse(o.split('\n').find((x) => x.startsWith('RESULT ')).slice(7)));
	const alive = rs.filter((x) => x.alive).length;
	if (alive === 2) doubleAlive++;
	if (alive === 0) noneAlive++;
	if (rs.filter((x) => x.fdData).length === 2) bothFd++;
	console.log(`n=${n} ${mode}: ` + rs.map((x) => `[pid ${x.pid} alive=${x.alive} exit=${JSON.stringify(x.exit)} fd=${JSON.stringify(x.fdData)} listening=${JSON.stringify(x.listening)}]`).join(' '));
	await sleep(300);
}
console.log(`SUMMARY ${mode}: rounds=${rounds} bothXvfbAliveAfter900ms=${doubleAlive} noneAlive=${noneAlive} bothWroteDisplayfd=${bothFd}`);
