// SC-551 step A measurement: what does Obsidian 1.15.0 report for --remote-debugging-port=<0|n>?
// usage: node measure-a.mjs <mode: zero|busy> <port> <display-base>
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const [mode, portArg, dispArg] = process.argv.slice(2);
const PORT = Number(portArg);
const WT = '/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements';
const { displayRange, startOwnedXvfb } = await import(`${WT}/scripts/xvfb-owned.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sc551-measure-'));
const vault = path.join(work, 'vault');
const udd = path.join(work, 'udd');
fs.mkdirSync(path.join(vault, '.obsidian'), { recursive: true });
fs.writeFileSync(path.join(vault, 'a.md'), '# a\n');
fs.mkdirSync(udd, { recursive: true });
fs.writeFileSync(path.join(udd, 'obsidian.json'), JSON.stringify({ vaults: { v1: { path: vault, ts: Date.now(), open: true } } }));
fs.writeFileSync(path.join(udd, 'v1.json'), JSON.stringify({ x: 0, y: 0, width: 1440, height: 1100, isMaximized: false, devTools: false, zoom: 0 }));
const cfg = path.join(os.homedir(), '.config', 'obsidian');
const asars = fs.readdirSync(cfg).filter((f) => /^obsidian-.*\.asar$/.test(f)).sort();
fs.copyFileSync(path.join(cfg, asars.at(-1)), path.join(udd, asars.at(-1)));

const xv = spawnSync('bash', ['-c', 'command -v Xvfb || ls /home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb'], { encoding: 'utf8' });
const bin = process.env.XVFB_BIN || xv.stdout.trim().split('\n')[0];
const x = await startOwnedXvfb({ bin, candidates: displayRange(Number(dispArg), Number(dispArg) + 9), args: ['-screen', '0', '1600x1200x24', '-nolisten', 'tcp'] });
console.log('xvfb', x?.display, 'bin', bin);

let blocker = null;
if (mode === 'busy') {
	blocker = net.createServer((s) => s.end());
	await new Promise((r) => blocker.listen(PORT, process.env.BLOCK_HOST || undefined, r));
	console.log('blocker listening', PORT);
}

const t0 = Date.now();
const child = spawn('/usr/bin/obsidian', [`--user-data-dir=${udd}`, `--remote-debugging-port=${PORT}`, '--window-size=1440,1100'], { env: { ...process.env, DISPLAY: x.display }, stdio: ['ignore', 'pipe', 'pipe'] });
let out = '', err = '';
let stderrLineAt = null, fileAt = null, fileContent = null, exited = null;
child.stdout.on('data', (d) => (out += d));
child.stderr.on('data', (d) => {
	err += d;
	if (stderrLineAt === null && /DevTools listening/.test(err)) stderrLineAt = Date.now() - t0;
});
child.once('exit', (c, s) => (exited = { code: c, sig: s, at: Date.now() - t0 }));
const dtap = path.join(udd, 'DevToolsActivePort');
while (Date.now() - t0 < 25000) {
	if (fileAt === null && fs.existsSync(dtap)) {
		fileAt = Date.now() - t0;
		await sleep(50);
		fileContent = fs.readFileSync(dtap, 'utf8');
	}
	if (exited) break;
	await sleep(20);
}
const ports = [PORT];
let versions = [];
if (fileContent) {
	const p = Number(fileContent.split('\n')[0]);
	try {
		versions.push({ port: p, v: await (await fetch(`http://127.0.0.1:${p}/json/version`)).json() });
	} catch (e) {
		versions.push({ port: p, err: String(e) });
	}
}
if (mode === 'busy') {
	try {
		const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
		versions.push({ port: PORT, status: r.status, body: (await r.text()).slice(0, 200) });
	} catch (e) {
		versions.push({ port: PORT, err: String(e.cause?.code ?? e) });
	}
}
console.log(JSON.stringify({ mode, PORT, stderrLineAt, fileAt, fileContent, exited, alive: child.exitCode === null, stderrTail: err.split('\n').slice(0, 30), stdoutTail: out.slice(0, 300), versions }, null, 1));
child.kill('SIGTERM');
await sleep(1500);
if (child.exitCode === null) child.kill('SIGKILL');
x.child.kill('SIGTERM');
blocker?.close();
