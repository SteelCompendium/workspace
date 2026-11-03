// SC-551 survey probe P1: what does the e2e chromedriver do when the port wdio's get-port chose
// is already taken by someone else, and where do wdio's wait-port + HTTP calls land then?
// Every process here is spawned by this script and killed by its recorded PID.
import { spawn } from 'node:child_process';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const CD = process.env.HOME + '/.cache/dse-e2e-obsidian/electron-chromedriver/linux-x64/43.7.7/chromedriver';
const waitPort = (await import(path.join(here, 'dse/node_modules/wait-port/lib/wait-port.js'))).default;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function start(cmd, args, tag) {
	const c = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, HOLD_MS: '20000' } });
	c.log = [];
	c.exitInfo = null;
	const on = (d) => {
		for (const l of d.toString().split('\n').filter(Boolean)) {
			c.log.push(l);
			console.log(`  [${tag} ${c.pid}] ${l}`);
		}
	};
	c.stdout.on('data', on);
	c.stderr.on('data', on);
	c.on('exit', (code, sig) => {
		c.exitInfo = { code, sig };
		console.log(`  [${tag} ${c.pid}] EXIT code=${code} sig=${sig}`);
	});
	return c;
}
async function until(fn, ms) {
	const t0 = Date.now();
	while (Date.now() - t0 < ms) {
		if (fn()) return true;
		await sleep(50);
	}
	return false;
}

const cases = [
	{ port: 48101, hosts: ['127.0.0.1'], what: 'foreign listener on 127.0.0.1 only' },
	{ port: 48102, hosts: ['::1'], what: 'foreign listener on ::1 only' },
	{ port: 48103, hosts: ['127.0.0.1', '::1'], what: 'foreign listener on 127.0.0.1 and ::1' },
	{ port: 48104, hosts: ['::'], what: 'foreign listener on :: (dual-stack, node default)' },
	{ port: 48105, foreignChromedriver: true, what: 'FOREIGN CHROMEDRIVER already on the port' },
];
for (const k of cases) {
	console.log(`\n=== case ${k.port}: ${k.what}`);
	const holder = k.foreignChromedriver
		? start(CD, [`--port=${k.port}`, '--allowed-origins=*'], 'FOREIGN-chromedriver')
		: start(process.execPath, [path.join(here, 'holder.mjs'), String(k.port), k.hosts.join(','), 'FOREIGN'], 'holder');
	await until(() => holder.log.some((l) => /READY|started successfully/.test(l)), 5000);
	// exactly the e2e flags (observed on a live e2e chromedriver: --port --binary --allowed-origins=*)
	const ours = start(CD, [`--port=${k.port}`, `--binary=${CD}`, '--allowed-origins=*'], 'OUR-chromedriver');
	await until(() => ours.exitInfo || ours.log.some((l) => /started successfully/.test(l)), 5000);
	await sleep(500);
	console.log(`  our chromedriver alive after start: ${ours.exitInfo === null}`);
	// wait-port exactly as @wdio/utils calls it (node.js:481: { port, output: 'silent' }, host default)
	const wp = await waitPort({ port: k.port, output: 'silent', timeout: 3000, interval: 100 }).then(
		(r) => `resolved ${JSON.stringify(r)}`,
		(e) => `rejected ${e.message}`,
	);
	console.log(`  wait-port({port:${k.port}}): ${wp}`);
	// the WebDriver client then talks to http://localhost:<port>
	for (const ep of ['/status']) {
		const r = await fetch(`http://localhost:${k.port}${ep}`).then(
			async (x) => `${x.status} ${(await x.text()).slice(0, 160)}`,
			(e) => `fetch error ${e.cause?.code ?? e.message}`,
		);
		console.log(`  GET http://localhost:${k.port}${ep} -> ${r}`);
	}
	for (const c of [ours, holder]) if (c.exitInfo === null) process.kill(c.pid, 'SIGTERM');
	await until(() => ours.exitInfo && holder.exitInfo, 3000);
}
process.exit(0);
