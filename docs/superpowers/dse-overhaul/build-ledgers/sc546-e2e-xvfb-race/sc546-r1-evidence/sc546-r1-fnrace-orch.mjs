// Orchestrator: ROUNDS rounds; each round spawns two workers that hit the barrier together.
// argv: variant rounds workerScript
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const [variant, rounds, worker] = [process.argv[2], Number(process.argv[3]), process.argv[4] ?? new URL('./sc546-r1-fnrace-worker.mjs', import.meta.url).pathname];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let shared = 0, bothOk = 0, ownDead = 0, other = 0;
for (let r = 1; r <= rounds; r++) {
	const barrier = Date.now() + 700;
	const run = () => new Promise((res) => { const c = spawn(process.execPath, [worker, variant, String(barrier)], { stdio: ['ignore', 'pipe', 'inherit'] }); let o = ''; c.stdout.on('data', (d) => (o += d)); c.on('exit', () => res(o)); });
	const outs = await Promise.all([run(), run()]);
	const rs = outs.map((o) => { const l = o.split('\n').find((x) => x.startsWith('RESULT ')); return l ? JSON.parse(l.slice(7)) : { raw: o }; });
	const [a, b] = rs;
	const same = a.display && a.display === b.display;
	if (same) shared++;
	if (a.display && b.display && !same) bothOk++;
	if (rs.some((x) => x.display && x.ownChildAlive === false)) ownDead++;
	if (rs.some((x) => x.err || x.raw !== undefined)) other++;
	console.log(JSON.stringify(rs)); console.log(`round ${r}: ${rs.map((x) => `${x.display ?? 'null'}${x.ownChildAlive === false ? '(own Xvfb DEAD)' : ''}${x.err ? ' ERR ' + x.err : ''}`).join(' | ')}${same ? '  <== SAME DISPLAY' : ''}`);
	await sleep(200);
}
console.log(`SUMMARY ${variant}: rounds=${rounds} sameDisplay=${shared} distinctDisplays=${bothOk} roundsWithReturnedDisplayWhoseOwnXvfbDied=${ownDead} roundsWithErrors=${other}`);
