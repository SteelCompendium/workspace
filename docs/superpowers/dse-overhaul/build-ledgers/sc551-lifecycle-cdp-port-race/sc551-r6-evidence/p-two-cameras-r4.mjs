// SC-551 r3 probe: two UNMODIFIED 5fc0fec2 cameras started together with the SAME DSE_CAMERA_TMP (what the default
// env gives every camera / docs-shots run on the machine) and the default port 0. Does each talk CDP only to its own
// Obsidian? Evidence per run: its `spawned obsidian pid=` and `cdp: port N (reported by our obsidian pid=...)`
// lines, and the real owner of port N (ss -ltnp) at the moment the line is printed.
// Private: display :5462, scratch DSE_CAMERA_TMP, a private clone. Every process killed by recorded PID.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// r4 adaptation: usage node p-two-cameras-r4.mjs <wt dse dir> <label> <display> ; env TRIES, OFFSET, SCRATCH (private dir for the shared DSE_CAMERA_TMP dirs)
const wt = process.argv[2];
const LABEL = process.argv[3];
const here = process.env.SCRATCH;
const ASAR = '/tmp/claude-1000/dse-obsidian-camera/obsidian-harness-udd/obsidian-1.14.5.asar';
const XVFB_BIN = '/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const TRIES = Number(process.env.TRIES ?? 3);
const OFFSET = Number(process.env.OFFSET ?? 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (s) => console.log(`[two-cams ${LABEL} ${new Date().toISOString().slice(11, 23)}] ${s}`);
const mine = [];
const x = spawn(XVFB_BIN, [process.argv[4], '-screen', '0', '1600x1200x24', '-nolisten', 'tcp', '-displayfd', '3'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe'] });
mine.push(x);
const display = await new Promise((r) => x.stdio[3].on('data', (d) => r(`:${d.toString().trim()}`)));
const listenerPid = (port) => Number(/pid=(\d+)/.exec(spawnSync('ss', ['-ltnpH', `sport = :${port}`], { encoding: 'utf8' }).stdout)?.[1] ?? 0);

let wrong = 0;
for (let t = 1; t <= TRIES; t++) {
	const ctmp = path.join(here, `two-cams-tmp-${LABEL}-${t}`); // fresh shared DSE_CAMERA_TMP per pair (never removed by this script)
	fs.mkdirSync(path.join(ctmp, 'obsidian-harness-udd'), { recursive: true });
	fs.copyFileSync(ASAR, path.join(ctmp, 'obsidian-harness-udd', path.basename(ASAR))); // no warm-up launch
	const runs = [];
	for (const tag of ['A', 'B']) {
		if (tag === 'B' && OFFSET) await sleep(OFFSET);
		const c = spawn(process.execPath, [path.join(wt, 'visual-harness', 'obsidian-camera.mjs'), '--element=stamina-bar', '--bg=dark'], {
			cwd: wt,
			env: { ...process.env, DSE_CAMERA_DISPLAY: display, DSE_CAMERA_TMP: ctmp, DSE_CAMERA_BIN: '/usr/bin/obsidian', DSE_CAMERA_PORT: undefined },
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		delete c.spawnargs;
		mine.push(c);
		const run = { tag, c, lines: [], own: 0, proven: 0, owner: 0, rc: null };
		const on = (d) => {
			for (const l of d.toString().split('\n').filter(Boolean)) {
				run.lines.push(l);
				let m = /spawned obsidian pid=(\d+)/.exec(l);
				if (m) run.own = Number(m[1]);
				m = /^cdp: port (\d+)/.exec(l);
				if (m) {
					run.proven = Number(m[1]);
					run.owner = listenerPid(run.proven);
				}
			}
		};
		c.stdout.on('data', on);
		c.stderr.on('data', on);
		c.on('exit', (code) => (run.rc = code));
		runs.push(run);
	}
	const t0 = Date.now();
	while (runs.some((r) => r.rc === null) && Date.now() - t0 < 150000) await sleep(250);
	for (const r of runs) if (r.rc === null) { process.kill(r.c.pid, 'SIGTERM'); await sleep(3000); }
	for (const r of runs) {
		const verdict = !r.proven ? 'no proof line' : r.owner === r.own ? 'own Obsidian' : `WRONG-INSTANCE (port ${r.proven} is owned by pid ${r.owner}, ours is ${r.own})`;
		if (r.proven && r.owner !== r.own) wrong++;
		log(`try ${t} ${r.tag}: rc=${r.rc} own obsidian pid ${r.own}; proven port ${r.proven || '-'} -> ${verdict}`);
		for (const l of r.lines.filter((l) => /spawned|^cdp:|attached:|environment|exited before|Error|BLOCKED|shots written|FAIL/.test(l)).slice(0, 8)) log(`    ${r.tag}> ${l.slice(0, 220)}`);
	}
	await sleep(1500);
}
log(`SUMMARY: ${wrong} wrong-instance camera run(s) in ${TRIES} pairs (offset ${OFFSET} ms)`);
for (const c of mine.reverse()) if (c.exitCode === null && c.signalCode === null) process.kill(c.pid, 'SIGTERM');
await sleep(800);
process.exit(0);
