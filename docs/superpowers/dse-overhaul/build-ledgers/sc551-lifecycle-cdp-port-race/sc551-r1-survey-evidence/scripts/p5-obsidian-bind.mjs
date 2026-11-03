// SC-551 survey probe P5: the camera's binary (/usr/bin/obsidian + a 1.14.5 app asar in the udd, the
// camera's normal state after warm-up). (a) --remote-debugging-port=P while P is held: does it die
// or keep running without DevTools? (b) --remote-debugging-port=0: what does OUR process report
// (stderr "DevTools listening on ..." and/or <udd>/DevToolsActivePort)? Private display :5451,
// private port 48401, scratch udd; every process killed by recorded PID.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const BIN = '/usr/bin/obsidian';
const ASAR = '/tmp/claude-1000/dse-obsidian-camera/obsidian-harness-udd/obsidian-1.14.5.asar';
const XVFB_BIN = '/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (s) => console.log(`[p5 ${new Date().toISOString().slice(11, 23)}] ${s}`);
const mine = [];

const x = spawn(XVFB_BIN, [':5451', '-screen', '0', '1600x1200x24', '-nolisten', 'tcp', '-displayfd', '3'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe'] });
mine.push(x);
const display = await new Promise((r) => x.stdio[3].on('data', (d) => r(`:${d.toString().trim()}`)));
log(`display ${display}`);

async function run(label, portArg) {
	const udd = path.join(here, `p5-udd-${label}`);
	fs.rmSync(udd, { recursive: true, force: true });
	fs.mkdirSync(udd, { recursive: true });
	fs.copyFileSync(ASAR, path.join(udd, path.basename(ASAR)));
	const c = spawn(BIN, [`--user-data-dir=${udd}`, `--remote-debugging-port=${portArg}`, '--window-size=1440,1100'], {
		env: { ...process.env, DISPLAY: display },
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	mine.push(c);
	const lines = [];
	const on = (d) => d.toString().split('\n').filter(Boolean).forEach((l) => lines.push(l));
	c.stdout.on('data', on);
	c.stderr.on('data', on);
	await sleep(8000);
	const alive = c.exitCode === null && c.signalCode === null;
	const dtap = path.join(udd, 'DevToolsActivePort');
	log(`${label}: pid ${c.pid} --remote-debugging-port=${portArg}: alive after 8 s = ${alive}`);
	log(`${label}: DevToolsActivePort = ${fs.existsSync(dtap) ? JSON.stringify(fs.readFileSync(dtap, 'utf8')) : 'absent'}`);
	for (const l of lines.filter((l) => /devtools|DevTools|bind|listen|9[0-9]{3}|48401/i.test(l))) log(`${label}: output> ${l.slice(0, 200)}`);
	log(`${label}: (${lines.length} output lines total)`);
	if (fs.existsSync(dtap)) {
		const [port, p2] = fs.readFileSync(dtap, 'utf8').split('\n');
		const v = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json()).catch((e) => ({ err: e.message }));
		log(`${label}: /json/version on ${port}: ${v.webSocketDebuggerUrl ?? JSON.stringify(v)} (file line 2: ${p2})`);
	}
	c.kill('SIGTERM');
	await sleep(1500);
}

// (a) port held
const holder = net.createServer((s) => s.destroy());
await new Promise((r) => holder.listen({ port: 48401, host: '::' }, r));
log('holder on [::]:48401');
await run('held', 48401);
holder.close();
// (b) port 0
await run('zero', 0);

for (const c of mine.reverse()) if (c.exitCode === null && c.signalCode === null) process.kill(c.pid, 'SIGTERM');
await sleep(800);
process.exit(0);
