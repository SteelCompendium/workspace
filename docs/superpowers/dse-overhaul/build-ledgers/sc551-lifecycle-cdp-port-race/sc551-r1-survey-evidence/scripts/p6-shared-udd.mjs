// SC-551 survey probe P6 (adjacent): two camera-style Obsidians on DIFFERENT ports but the SAME
// --user-data-dir (the camera's default DSE_CAMERA_TMP is one fixed path for every checkout).
// Does the second one exit (Chromium process singleton) or run? Private display :5452, ports
// 48501/48502, scratch udd; every process killed by recorded PID.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const BIN = '/usr/bin/obsidian';
const ASAR = '/tmp/claude-1000/dse-obsidian-camera/obsidian-harness-udd/obsidian-1.14.5.asar';
const XVFB_BIN = '/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (s) => console.log(`[p6 ${new Date().toISOString().slice(11, 23)}] ${s}`);
const mine = [];
const x = spawn(XVFB_BIN, [':5452', '-screen', '0', '1600x1200x24', '-nolisten', 'tcp', '-displayfd', '3'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe'] });
mine.push(x);
const display = await new Promise((r) => x.stdio[3].on('data', (d) => r(`:${d.toString().trim()}`)));
const udd = path.join(here, 'p6-udd');
fs.rmSync(udd, { recursive: true, force: true });
fs.mkdirSync(udd, { recursive: true });
fs.copyFileSync(ASAR, path.join(udd, path.basename(ASAR)));
const list = (p) => fetch(`http://127.0.0.1:${p}/json/list`).then((r) => r.json()).catch(() => null);
const start = (port) => {
	const c = spawn(BIN, [`--user-data-dir=${udd}`, `--remote-debugging-port=${port}`, '--window-size=1440,1100'], { env: { ...process.env, DISPLAY: display }, stdio: 'ignore' });
	mine.push(c);
	c.on('exit', (code, sig) => log(`obsidian pid ${c.pid} (port ${port}) EXITED code=${code} sig=${sig}`));
	return c;
};
const a = start(48501);
for (let i = 0; i < 60 && !(await list(48501))?.some((t) => t.type === 'page'); i++) await sleep(250);
log(`A pid ${a.pid}: 48501 targets ${JSON.stringify(((await list(48501)) ?? []).map((t) => t.url))}`);
const b = start(48502);
await sleep(6000);
log(`B pid ${b.pid}: alive=${b.exitCode === null && b.signalCode === null}; 48502 serving=${!!(await list(48502))}`);
log(`A after B: 48501 page targets ${JSON.stringify(((await list(48501)) ?? []).filter((t) => t.type === 'page').map((t) => t.url))}`);
for (const c of mine.reverse()) if (c.exitCode === null && c.signalCode === null) process.kill(c.pid, 'SIGTERM');
await sleep(1500);
process.exit(0);
