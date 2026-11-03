// SC-551 r2: obsidian-camera.mjs when another Obsidian owns DSE_CAMERA_PORT from just after the camera's
// spawn (adapted from the survey's probe P4; deterministic simulation of the window between the camera's
// port pre-check and our Obsidian's own bind).
//   - DECOY: a real Obsidian (private udd, vault "FOREIGN-VAULT") on its own DevTools port Q, own display.
//   - PROXY: starts listening on [::]:P only when the camera prints "spawned obsidian pid=" (after its
//     pre-check, so the pre-check passes); every connection is piped to Q. It also keeps the camera's own
//     Obsidian from binding P, exactly like the real race.
//   - The camera runs from the worktree with DSE_CAMERA_PORT=P and a private DSE_CAMERA_TMP.
// R2_MODE=stale: no proxy, no DSE_CAMERA_PORT (port 0); the camera's persistent udd holds a STALE DevToolsActivePort that names the live decoy
//   (port Q + the decoy's real browser id). Verdict = camera exits 0, attached to its own vault, never to FOREIGN-VAULT.
// usage: node r2-camera-repro.mjs <worktree dse dir> <label> <P> <Q> <display base> [--element=stamina-bar --bg=dark]
// BASE verdict = camera prints `attached: ... vault "FOREIGN-VAULT"`. FIX verdict = camera exits 2, proxy saw 0 connections.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const [wt, label, Pa, Qa, dbase] = process.argv.slice(2);
const P = Number(Pa);
const Q = Number(Qa);
const camArgs = process.argv.slice(7).length ? process.argv.slice(7) : ['--element=stamina-bar', '--bg=dark'];
const { displayRange, startOwnedXvfb } = await import(`${wt}/scripts/xvfb-owned.mjs`);
const BIN = '/usr/bin/obsidian';
const XVFB_BIN = `${wt}/.devbox/nix/profile/default/bin/Xvfb`;
const ASAR = '/tmp/claude-1000/dse-obsidian-camera/obsidian-harness-udd/obsidian-1.14.5.asar';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mine = [];
const log = (s) => console.log(`[${label} ${new Date().toISOString().slice(11, 23)}] ${s}`);
const getJson = (port, p) => fetch(`http://127.0.0.1:${port}${p}`).then((r) => r.json()).catch(() => null);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sc551-r2-repro-'));

const xvfb = async (base) => {
	const x = await startOwnedXvfb({ bin: XVFB_BIN, candidates: displayRange(base, base + 4), args: ['-screen', '0', '1600x1200x24', '-nolisten', 'tcp'] });
	mine.push(x.child);
	return x.display;
};
const seed = (udd, vaultPath, id) => {
	fs.mkdirSync(udd, { recursive: true });
	fs.copyFileSync(ASAR, path.join(udd, path.basename(ASAR)));
	if (vaultPath) fs.writeFileSync(path.join(udd, 'obsidian.json'), JSON.stringify({ vaults: { [id]: { path: vaultPath, ts: Date.now(), open: true } } }));
};

let camera = null;
let proxy = null;
let conns = 0;
let result = {};
try {
	const foreignX = await xvfb(Number(dbase));
	const ourX = await xvfb(Number(dbase) + 5);
	log(`decoy display ${foreignX}; camera display ${ourX}`);
	const fvault = path.join(root, 'FOREIGN-VAULT');
	fs.mkdirSync(fvault, { recursive: true });
	fs.writeFileSync(path.join(fvault, 'foreign note.md'), '# I belong to another session\n');
	const fudd = path.join(root, 'decoy-udd');
	seed(fudd, fvault, 'foreignvault01');
	const decoy = spawn(BIN, [`--user-data-dir=${fudd}`, `--remote-debugging-port=${Q}`], { env: { ...process.env, DISPLAY: foreignX }, stdio: 'ignore' });
	mine.push(decoy);
	let ft = null;
	for (let i = 0; i < 120 && !ft; i++) {
		ft = ((await getJson(Q, '/json/list')) ?? []).find((t) => t.type === 'page' && t.url.startsWith('app://obsidian.md'));
		if (!ft) await sleep(250);
	}
	if (!ft) throw new Error('decoy Obsidian never served a page target');
	log(`DECOY Obsidian pid ${decoy.pid} on ${Q}: ${ft.url}`);

	const ctmp = path.join(root, 'camtmp');
	seed(path.join(ctmp, 'obsidian-harness-udd'), null); // pre-seeded asar = no warm-up launch
	const STALE = process.env.R2_MODE === 'stale';
	if (STALE) {
		const v = await getJson(Q, '/json/version');
		const guid = v.webSocketDebuggerUrl.split('/').pop();
		fs.writeFileSync(path.join(ctmp, 'obsidian-harness-udd', 'DevToolsActivePort'), `${Q}\n/devtools/browser/${guid}`);
		log(`STALE DevToolsActivePort in the camera udd names the decoy: ${Q} ${guid}`);
	}
	let proxyUp = false;
	const startProxy = async () => {
		if (proxyUp) return;
		proxyUp = true;
		proxy = net.createServer((s) => {
			const n = ++conns;
			s.once('data', (d) => log(`PROXY connection #${n} -> piped to DECOY :${Q}: ${d.toString('latin1').split('\r\n')[0]}`));
			const up = net.connect(Q, '127.0.0.1');
			s.pipe(up).pipe(s);
			s.on('error', () => up.destroy());
			up.on('error', () => s.destroy());
		});
		await new Promise((r) => proxy.listen({ port: P, host: '::' }, r));
		log(`PROXY listening on [::]:${P} (the stranger now owns the port)`);
	};
	camera = spawn(process.execPath, [path.join(wt, 'visual-harness', 'obsidian-camera.mjs'), ...camArgs], {
		cwd: wt,
		env: { ...process.env, ...(STALE ? {} : { DSE_CAMERA_PORT: String(P) }), DSE_CAMERA_DISPLAY: ourX, DSE_CAMERA_TMP: ctmp, DSE_CAMERA_BIN: BIN },
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	mine.push(camera);
	let out = '';
	const onOut = (d) => {
		for (const l of d.toString().split('\n').filter(Boolean)) {
			out += `${l}\n`;
			log(`camera> ${l.slice(0, 220)}`);
			if (!STALE && /spawned obsidian pid=/.test(l)) void startProxy();
		}
	};
	camera.stdout.on('data', onOut);
	camera.stderr.on('data', onOut);
	const t0 = Date.now();
	while (Date.now() - t0 < 180000 && camera.exitCode === null && (STALE || !/attached:/.test(out))) await sleep(200);
	await sleep(3000);
	result = {
		cameraExit: camera.exitCode,
		attachedForeign: /attached:.*vault "FOREIGN-VAULT"/.test(out),
		attachedOther: /attached:/.test(out) && !/vault "FOREIGN-VAULT"/.test(out),
		envMessage: /environment: .*/.exec(out)?.[0] ?? null,
		proxyConnections: conns,
	};
	log(`RESULT ${JSON.stringify(result)}`);
	const fl = (await getJson(Q, '/json/list')) ?? [];
	log(`DECOY targets after the camera: ${fl.map((t) => `${t.type}:${t.url}`).join(', ')}`);
} catch (e) {
	log(`PROBE ERROR: ${e.stack ?? e}`);
} finally {
	if (camera && camera.exitCode === null) {
		process.kill(camera.pid, 'SIGTERM');
		for (let i = 0; i < 40 && camera.exitCode === null; i++) await sleep(250);
		log(`camera exited ${camera.exitCode} ${camera.signalCode} after SIGTERM`);
	}
	proxy?.close();
	for (const c of mine.reverse()) if (c.exitCode === null && c.signalCode === null) process.kill(c.pid, 'SIGTERM');
	await sleep(2000);
	for (const c of mine) if (c.exitCode === null && c.signalCode === null) process.kill(c.pid, 'SIGKILL');
	fs.rmSync(root, { recursive: true, force: true });
	process.exit(0);
}
