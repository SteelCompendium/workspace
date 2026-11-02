// argv: procs rounds
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const [procs, rounds] = [Number(process.argv[2]), Number(process.argv[3])];
const worker = new URL('./sc546-r1-stress-worker.mjs', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let shared = 0, noDisplay = 0, notListening = 0, total = 0;
const allPids = new Set();
for (let r = 1; r <= rounds; r++) {
	const barrier = Date.now() + 700;
	const run = () => new Promise((res) => { const c = spawn(process.execPath, [worker, String(barrier)], { stdio: ['ignore', 'pipe', 'inherit'] }); let o = ''; c.stdout.on('data', (d) => (o += d)); c.on('exit', () => res(o)); });
	const outs = await Promise.all(Array.from({ length: procs }, run));
	const rs = outs.map((o) => JSON.parse(o.split('\n').find((x) => x.startsWith('RESULT ')).slice(7)));
	for (const x of rs) for (const k of x.kids) allPids.add(k);
	const ds = rs.map((x) => x.display);
	const dup = new Set(ds).size !== ds.length;
	total += ds.length;
	if (dup) shared++;
	noDisplay += rs.filter((x) => !x.display).length;
	notListening += rs.filter((x) => x.display && (x.ownSocketsListening < 2 || !x.alive)).length;
	console.log(`round ${r}: ${ds.join(' ')}${dup ? '  <== SHARED' : ''} listening=${rs.map((x) => x.ownSocketsListening).join('')}`);
	await sleep(150);
}
await sleep(500);
const leakedProcs = [...allPids].filter((p) => fs.existsSync(`/proc/${p}`)).length;
const leakedFiles = fs.readdirSync('/tmp/.X11-unix').filter((f) => /^X53\d\d$/.test(f)).length + fs.readdirSync('/tmp').filter((f) => /^\.X53\d\d-lock$/.test(f)).length;
console.log(`SUMMARY stress: procs=${procs} rounds=${rounds} displaysReturned=${total} roundsWithSharedDisplay=${shared} noDisplay=${noDisplay} returnedButNotListeningOrDead=${notListening} spawnedXvfbPids=${allPids.size} leakedXvfbProcs=${leakedProcs} leakedLockOrSocketFiles=${leakedFiles}`);
