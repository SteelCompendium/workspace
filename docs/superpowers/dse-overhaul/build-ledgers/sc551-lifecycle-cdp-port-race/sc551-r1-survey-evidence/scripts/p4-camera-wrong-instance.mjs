// SC-551 survey probe P4: obsidian-camera.mjs (obsidian-shots / docs-shots' Obsidian half) when
// another Obsidian takes DSE_CAMERA_PORT between the camera's one-shot check (:635) and its spawn
// (:660). Deterministic simulation of that window:
//   - FOREIGN: a real Obsidian (ours, private udd, vault "FOREIGN-VAULT") on DevTools port Q, own display.
//   - P holder: listens on [::]:P. Its FIRST connection is reset (= nothing there when the camera
//     checks, so the check passes); every later connection is piped to Q (= "the other instance now
//     owns P"). It also keeps the camera's own Obsidian from binding P, exactly like the real race.
//   - The camera runs unmodified from a throwaway eafe76e1 worktree with DSE_CAMERA_PORT=P.
// Pass = the camera prints `attached: ... vault "FOREIGN-VAULT"` (a Runtime.evaluate answered by
// the foreign Obsidian). Every process is spawned here and killed by recorded PID.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const wt = path.join(here, 'dse');
const BIN = '/usr/bin/obsidian';
const ASAR = '/tmp/claude-1000/dse-obsidian-camera/obsidian-harness-udd/obsidian-1.14.5.asar';
const XVFB_BIN = '/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const P = 48301;
const Q = 48302;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mine = [];
const log = (s) => console.log(`[p4 ${new Date().toISOString().slice(11, 23)}] ${s}`);

function xvfb(n) {
	const c = spawn(XVFB_BIN, [`:${n}`, '-screen', '0', '1600x1200x24', '-nolisten', 'tcp', '-displayfd', '3'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe'] });
	mine.push(c);
	return new Promise((res, rej) => {
		c.stdio[3].on('data', (d) => res(`:${d.toString().trim()}`));
		c.on('exit', (code) => rej(new Error(`Xvfb :${n} exited ${code}`)));
	});
}
function seed(udd, vaultPath, id) {
	fs.rmSync(udd, { recursive: true, force: true });
	fs.mkdirSync(udd, { recursive: true });
	fs.copyFileSync(ASAR, path.join(udd, path.basename(ASAR)));
	if (vaultPath) fs.writeFileSync(path.join(udd, 'obsidian.json'), JSON.stringify({ vaults: { [id]: { path: vaultPath, ts: Date.now(), open: true } } }));
}
const getJson = (port, p) => fetch(`http://127.0.0.1:${port}${p}`).then((r) => r.json()).catch(() => null);

let camera = null;
try {
	const foreignX = await xvfb(5449);
	const ourX = await xvfb(5450);
	log(`FOREIGN display ${foreignX}; camera display ${ourX}`);

	// --- the FOREIGN Obsidian on Q
	const fvault = path.join(here, 'p4-foreign', 'FOREIGN-VAULT');
	fs.rmSync(path.join(here, 'p4-foreign'), { recursive: true, force: true });
	fs.mkdirSync(fvault, { recursive: true });
	fs.writeFileSync(path.join(fvault, 'foreign note.md'), '# I belong to another session\n');
	const fudd = path.join(here, 'p4-foreign', 'udd');
	seed(fudd, fvault, 'foreignvault01');
	const foreign = spawn(BIN, [`--user-data-dir=${fudd}`, `--remote-debugging-port=${Q}`], { env: { ...process.env, DISPLAY: foreignX }, stdio: 'ignore' });
	mine.push(foreign);
	let ft = null;
	for (let i = 0; i < 120 && !ft; i++) {
		ft = ((await getJson(Q, '/json/list')) ?? []).find((t) => t.type === 'page' && t.url.startsWith('app://obsidian.md'));
		if (!ft) await sleep(250);
	}
	if (!ft) throw new Error('foreign Obsidian never served a page target');
	const fver = await getJson(Q, '/json/version');
	log(`FOREIGN Obsidian pid ${foreign.pid} on ${Q}: target ${ft.url}; browser ${fver?.webSocketDebuggerUrl}`);

	// --- the P holder (reset first connection, then pipe to Q)
	let conns = 0;
	const holder = net.createServer((s) => {
		const n = ++conns;
		if (n === 1) {
			log(`P holder: connection #1 (the camera's one-shot check) -> reset, so the check sees "free"`);
			s.destroy();
			return;
		}
		s.once('data', (d) => log(`P holder: connection #${n} -> piped to FOREIGN :${Q}: ${d.toString('latin1').split('\r\n')[0]}`));
		const up = net.connect(Q, '127.0.0.1');
		s.pipe(up).pipe(s);
		s.on('error', () => up.destroy());
		up.on('error', () => s.destroy());
	});
	await new Promise((r) => holder.listen({ port: P, host: '::' }, r));
	log(`P holder listening on [::]:${P}`);

	// --- the camera, unmodified, from the throwaway worktree
	const ctmp = path.join(here, 'p4-camtmp');
	seed(path.join(ctmp, 'obsidian-harness-udd'), null); // pre-seeded asar = no warm-up launch (camera :611)
	camera = spawn(process.execPath, [path.join(wt, 'visual-harness', 'obsidian-camera.mjs'), '--element=stamina-bar', '--bg=dark'], {
		cwd: wt,
		env: { ...process.env, DSE_CAMERA_PORT: String(P), DSE_CAMERA_DISPLAY: ourX, DSE_CAMERA_TMP: ctmp, DSE_CAMERA_BIN: BIN },
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	mine.push(camera);
	let out = '';
	let ourObsidianPid = 0;
	const onOut = (d) => {
		for (const l of d.toString().split('\n').filter(Boolean)) {
			out += l + '\n';
			log(`camera> ${l}`);
			const m = /spawned obsidian pid=(\d+)/.exec(l);
			if (m) ourObsidianPid = Number(m[1]);
		}
	};
	camera.stdout.on('data', onOut);
	camera.stderr.on('data', onOut);
	const t0 = Date.now();
	while (Date.now() - t0 < 60000 && camera.exitCode === null && !/attached:|Error/.test(out)) await sleep(200);
	await sleep(3000); // let it run a few more evaluates in the wrong instance
	const alive = ourObsidianPid && fs.existsSync(`/proc/${ourObsidianPid}`);
	log(`camera's OWN Obsidian pid ${ourObsidianPid}: alive=${alive}; DevToolsActivePort in its udd: ${fs.existsSync(path.join(ctmp, 'obsidian-harness-udd', 'DevToolsActivePort'))}`);
	log(`VERDICT: ${/attached:.*vault "FOREIGN-VAULT"/.test(out) ? 'WRONG-INSTANCE (camera evaluated inside the FOREIGN Obsidian)' : /attached:/.test(out) ? 'attached to its own (unexpected)' : 'did not attach'}`);
	const fl = (await getJson(Q, '/json/list')) ?? [];
	log(`FOREIGN Obsidian targets after the camera: ${fl.map((t) => `${t.type}:${t.url}`).join(', ')}`);
	holder.close();
} catch (e) {
	log(`PROBE ERROR: ${e.stack ?? e}`);
} finally {
	if (camera && camera.exitCode === null) {
		process.kill(camera.pid, 'SIGTERM'); // its handler kills its own Obsidian child, restores data.json
		for (let i = 0; i < 40 && camera.exitCode === null; i++) await sleep(250);
		log(`camera exited ${camera.exitCode} ${camera.signalCode}`);
	}
	for (const c of mine.reverse()) if (c.exitCode === null && c.signalCode === null) process.kill(c.pid, 'SIGTERM');
	await sleep(1500);
	process.exit(0);
}
