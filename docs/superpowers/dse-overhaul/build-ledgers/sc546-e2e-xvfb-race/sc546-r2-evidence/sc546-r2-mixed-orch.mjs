// SC-546 r2 mixed-fleet orchestrator. Sequential facts on :5370-:5373, then races on :5360-:5369.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const bin = '/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const worker = new URL('./sc546-r2-mixed-worker.mjs', import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARGS = ['-screen', '0', '640x480x24', '-nolisten', 'tcp'];
const sock = (n) => `/tmp/.X11-unix/X${n}`;
const lock = (n) => `/tmp/.X${n}-lock`;
const files = (n) => `socket=${fs.existsSync(sock(n))} lock=${fs.existsSync(lock(n))}${fs.existsSync(lock(n)) ? ` lockText=${JSON.stringify(fs.readFileSync(lock(n), 'utf8'))}` : ''}`;

function start(n, fd) {
	const t0 = Date.now();
	const c = spawn(bin, [`:${n}`, ...ARGS, ...(fd ? ['-displayfd', '3'] : [])], { stdio: ['ignore', 'ignore', 'pipe', fd ? 'pipe' : 'ignore'] });
	let err = '', out = '';
	c.stderr.on('data', (d) => (err += d));
	c.stdio[3]?.on('data', (d) => (out += d));
	const exited = new Promise((r) => c.once('exit', (code, sig) => r({ code, sig, ms: Date.now() - t0 })));
	return { c, exited, err: () => err.trim().split('\n').filter((l) => /server already|Cannot establish|already active|lock/i.test(l)).join(' / '), fdOut: () => out };
}
async function waitUp(n) { for (let i = 0; i < 60 && !fs.existsSync(sock(n)); i++) await sleep(50); }
async function stop(h) { if (h.c.exitCode === null && h.c.signalCode === null) { h.c.kill('SIGTERM'); } await h.exited; }
const verdict = async (h, ms = 1500) => Promise.race([h.exited, sleep(ms).then(() => null)]);

console.log('== M1: new-style (-displayfd) holds :5370, then an old-style Xvfb :5370 starts');
{
	const a = start(5370, true); await waitUp(5370);
	console.log(`  holder fd=${JSON.stringify(a.fdOut())} ${files(5370)}`);
	const b = start(5370, false); const v = await verdict(b);
	console.log(`  old-style second: ${v ? `exited code=${v.code} in ${v.ms} ms` : 'STILL ALIVE after 1500 ms'} stderr="${b.err()}"; after: ${files(5370)}`);
	if (!v) await stop(b);
	await stop(a); await sleep(200);
	console.log(`  after both gone: ${files(5370)}`);
}
console.log('== M2: old-style holds :5371, then a new-style (-displayfd) Xvfb :5371 starts');
{
	const a = start(5371, false); await waitUp(5371);
	console.log(`  holder ${files(5371)}`);
	const b = start(5371, true); const v = await verdict(b);
	console.log(`  new-style second: ${v ? `exited code=${v.code} in ${v.ms} ms` : 'STILL ALIVE after 1500 ms'} fd=${JSON.stringify(b.fdOut())} stderr="${b.err()}"`);
	if (!v) await stop(b);
	await stop(a); await sleep(200);
	console.log(`  after both gone: ${files(5371)}`);
}
console.log('== M3: SIGKILLed new-style on :5372 (stale socket, no lock); then old-style and new-style start there directly');
{
	const a = start(5372, true); await waitUp(5372); a.c.kill('SIGKILL'); await a.exited; await sleep(100);
	console.log(`  after SIGKILL: ${files(5372)}`);
	const b = start(5372, false); const v = await verdict(b, 1000);
	console.log(`  old-style on stale socket: ${v ? `exited code=${v.code} in ${v.ms} ms stderr="${b.err()}"` : 'up (alive after 1000 ms)'}; ${files(5372)}`);
	if (!v) await stop(b); await sleep(200);
	const a2 = start(5372, true); await waitUp(5372); a2.c.kill('SIGKILL'); await a2.exited; await sleep(100);
	const c = start(5372, true); const v2 = await verdict(c, 1000);
	console.log(`  new-style on stale socket: ${v2 ? `exited code=${v2.code}` : 'up (alive after 1000 ms)'} fd=${JSON.stringify(c.fdOut())}`);
	if (!v2) await stop(c); await sleep(200);
	console.log(`  end: ${files(5372)}`);
}
console.log('== M4: SIGKILLed old-style on :5373 (stale lock + socket); then new-style starts there directly');
{
	const a = start(5373, false); await waitUp(5373); a.c.kill('SIGKILL'); await a.exited; await sleep(100);
	console.log(`  after SIGKILL: ${files(5373)}`);
	const c = start(5373, true); const v = await verdict(c, 1000);
	console.log(`  new-style: ${v ? `exited code=${v.code} stderr="${c.err()}"` : 'up (alive after 1000 ms)'} fd=${JSON.stringify(c.fdOut())}`);
	if (!v) await stop(c); await sleep(200);
	console.log(`  end: ${files(5373)}`);
	if (fs.existsSync(lock(5373))) { fs.unlinkSync('/tmp/.X5373-lock'); console.log('  removed stale /tmp/.X5373-lock (probe cleanup)'); }
}

const rounds = Number(process.argv[2] ?? 20);
for (const pairing of [['old-e2e', 'new'], ['old-lc', 'new'], ['new', 'new'], ['old-e2e', 'old-lc']]) {
	let shared = 0, sharedWhoAdopted = [], staleLocks = 0;
	for (let r = 1; r <= rounds; r++) {
		const barrier = Date.now() + 600, release = barrier + 2600;
		const run = (m) => new Promise((res) => { const c = spawn(process.execPath, [worker, m, String(barrier), String(release)], { stdio: ['ignore', 'pipe', 'inherit'] }); let o = ''; c.stdout.on('data', (d) => (o += d)); c.on('exit', () => res(JSON.parse(o.split('\n').find((x) => x.startsWith('RESULT ')).slice(7)))); });
		const rs = await Promise.all(pairing.map(run));
		const dup = rs[0].display && rs[0].display === rs[1].display;
		if (dup) { shared++; sharedWhoAdopted.push(rs.filter((x) => !x.listening.length || !x.alive).map((x) => x.mode).join('+') || '?'); }
		await sleep(300);
		for (let n = 5360; n <= 5369; n++) if (fs.existsSync(lock(n))) { staleLocks++; fs.unlinkSync(lock(n)); }
		const left = []; for (let n = 5360; n <= 5369; n++) if (fs.existsSync(sock(n))) left.push(n);
		console.log(`  ${pairing.join(' vs ')} round ${r}: ${rs.map((x) => `${x.mode}=${x.display}@${x.at}ms alive=${x.alive} listen=${x.listening.length}`).join(' | ')}${dup ? '  <== SHARED' : ''}${left.length ? ` leftoverSockets=${left}` : ''}`);
	}
	console.log(`SUMMARY ${pairing.join(' vs ')}: rounds=${rounds} shared=${shared} adopter(s)=${JSON.stringify(sharedWhoAdopted)} staleLocksRemovedAfterRounds=${staleLocks}`);
}
const leftS = [], leftL = [];
for (let n = 5360; n <= 5379; n++) { if (fs.existsSync(sock(n))) leftS.push(n); if (fs.existsSync(lock(n))) leftL.push(n); }
console.log(`END leftover sockets=${JSON.stringify(leftS)} locks=${JSON.stringify(leftL)}`);
