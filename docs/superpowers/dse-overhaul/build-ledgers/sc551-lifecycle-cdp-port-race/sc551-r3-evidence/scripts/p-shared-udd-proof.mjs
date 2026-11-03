// SC-551 r3 probe: can proveCdpOwned (5fc0fec2) accept ANOTHER Obsidian's DevTools server as ours when two
// Obsidians share one --user-data-dir (the camera's default DSE_CAMERA_TMP is one machine-wide path, SC-554)?
// Both spawns follow the camera's order: clearStaleReport(udd) then spawn with --remote-debugging-port=0, then prove.
// The Obsidian that loses Chromium's process singleton hands off and exits (~0.8 s); if its proof reads the
// winner's freshly written DevToolsActivePort while it is still alive, the proof passes for a browser it did not start.
// Ground truth: which PID actually owns the listening socket (ss -ltnp). Private display :5461, scratch udd.
// Every process is spawned here and killed by recorded PID.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const { proveCdpOwned, clearStaleReport } = await import(path.join(here, 'fixwt/scripts/cdp-owned.mjs'));
const BIN = '/usr/bin/obsidian';
const ASAR = '/tmp/claude-1000/dse-obsidian-camera/obsidian-harness-udd/obsidian-1.14.5.asar';
const XVFB_BIN = '/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (s) => console.log(`[shared-udd ${new Date().toISOString().slice(11, 23)}] ${s}`);
const mine = [];

const x = spawn(XVFB_BIN, [':5461', '-screen', '0', '1600x1200x24', '-nolisten', 'tcp', '-displayfd', '3'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe'] });
mine.push(x);
const display = await new Promise((r, j) => {
	x.stdio[3].on('data', (d) => r(`:${d.toString().trim()}`));
	x.on('exit', (c) => j(new Error(`Xvfb exited ${c}`)));
});
log(`display ${display}`);

const listenerPid = (port) => {
	const out = spawnSync('ss', ['-ltnpH', `sport = :${port}`], { encoding: 'utf8' }).stdout;
	return Number(/pid=(\d+)/.exec(out)?.[1] ?? 0);
};

const udd = path.join(here, 'shared-udd');
let holes = 0;
const offsets = (process.env.OFFSETS ?? '0,0,50,100,150,200,250,300,400,600').split(',').map(Number);
for (const [i, off] of offsets.entries()) {
	fs.rmSync(udd, { recursive: true, force: true });
	fs.mkdirSync(udd, { recursive: true });
	fs.copyFileSync(ASAR, path.join(udd, path.basename(ASAR)));
	const start = () => {
		clearStaleReport(udd);
		const c = spawn(BIN, [`--user-data-dir=${udd}`, '--remote-debugging-port=0', '--window-size=1440,1100'], { env: { ...process.env, DISPLAY: display }, stdio: 'ignore' });
		mine.push(c);
		return c;
	};
	const a = start();
	const pa = proveCdpOwned({ child: a, userDataDir: udd }).then((r) => ({ r }), (e) => ({ e: e.reason }));
	await sleep(off);
	const b = start();
	const pb = proveCdpOwned({ child: b, userDataDir: udd }).then((r) => ({ r }), (e) => ({ e: e.reason }));
	const [ra, rb] = await Promise.all([pa, pb]);
	const row = [];
	for (const [tag, c, res] of [['A', a, ra], ['B', b, rb]]) {
		if (res.r) {
			const owner = listenerPid(res.r.port);
			const ok = owner === c.pid;
			if (!ok) holes++;
			row.push(`${tag} pid ${c.pid}: PROVEN port ${res.r.port}, real listener pid ${owner} -> ${ok ? 'correct' : 'WRONG-INSTANCE (proof passed for a browser it did not start)'}`);
		} else row.push(`${tag} pid ${c.pid}: proof failed (${res.e})`);
	}
	log(`try ${i + 1} offset ${off} ms: ${row.join(' | ')}`);
	for (const c of [a, b]) if (c.exitCode === null && c.signalCode === null) c.kill('SIGTERM');
	await sleep(2000);
	for (const c of [a, b]) if (c.exitCode === null && c.signalCode === null) c.kill('SIGKILL');
}
log(`SUMMARY: ${holes} wrong-instance proof(s) in ${offsets.length} tries`);
for (const c of mine.reverse()) if (c.exitCode === null && c.signalCode === null) process.kill(c.pid, 'SIGTERM');
await sleep(800);
process.exit(0);
