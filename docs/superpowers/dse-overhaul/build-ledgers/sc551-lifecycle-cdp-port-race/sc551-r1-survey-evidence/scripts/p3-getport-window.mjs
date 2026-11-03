// SC-551 survey probe P3: (a) the number space get-port() (no options, = bind(0)) draws from on this
// kernel, (b) how long the check-then-use window is between get-port returning and chromedriver
// actually listening (what @wdio/utils node.js:387 -> :417 -> :481 does), measured 10x.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const getPort = (await import(path.join(here, 'dse/node_modules/get-port/index.js'))).default;
const CD = process.env.HOME + '/.cache/dse-e2e-obsidian/electron-chromedriver/linux-x64/43.7.7/chromedriver';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
console.log(`ip_local_port_range: ${fs.readFileSync('/proc/sys/net/ipv4/ip_local_port_range', 'utf8').trim()}`);

const seen = [];
for (let i = 0; i < 2000; i++) seen.push(await getPort());
const odd = seen.filter((p) => p % 2).length;
console.log(`get-port x2000: min ${Math.min(...seen)} max ${Math.max(...seen)}, odd ${odd}/2000, distinct ${new Set(seen).size}`);

const canConnect = (port) =>
	new Promise((r) => {
		const s = net.connect(port, '127.0.0.1');
		s.on('connect', () => (s.destroy(), r(true)));
		s.on('error', () => r(false));
	});
const windows = [];
for (let i = 0; i < 10; i++) {
	const port = await getPort();
	const t0 = performance.now();
	const c = spawn(CD, [`--port=${port}`, '--allowed-origins=*'], { stdio: 'ignore' });
	while (!(await canConnect(port))) await sleep(1);
	windows.push(Math.round(performance.now() - t0));
	c.kill('SIGTERM');
	await new Promise((r) => c.on('exit', r));
}
console.log(`window get-port-return -> chromedriver listening (ms, 10 runs): ${windows.join(' ')}`);
process.exit(0);
