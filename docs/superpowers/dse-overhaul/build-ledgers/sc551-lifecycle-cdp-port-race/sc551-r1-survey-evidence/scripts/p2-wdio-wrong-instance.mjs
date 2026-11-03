// SC-551 survey probe P2: the e2e session path end to end (webdriverio 9.32 remote() ->
// @wdio/utils startWebDriver -> chromedriver -> Obsidian 1.14.4 installer), with get-port forced to
// a port a FOREIGN chromedriver already holds. Questions:
//   (1) does our chromedriver die, and does wdio notice, or does the session land on the foreign one?
//   (2) whose child is the Obsidian that runs our session, and on whose display is its window?
//   (3) what debugging port does chromedriver give Obsidian (and is it read back from OUR udd)?
// Everything here is private: displays :5447 (foreign) / :5448 (ours), port 48201, udd under scratch.
// Every process is spawned here and killed by recorded PID.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const { remote } = await import(path.join(here, 'dse/node_modules/webdriverio/build/node.js'));
const CD = process.env.HOME + '/.cache/dse-e2e-obsidian/electron-chromedriver/linux-x64/43.7.7/chromedriver';
const OBS = process.env.HOME + '/.cache/dse-e2e-obsidian/obsidian-installer/linux-x64/Obsidian-1.14.4/obsidian';
const XVFB = path.join(here, 'dse/.devbox/nix/profile/default/bin/Xvfb');
const XVFB_BIN = fs.existsSync(XVFB) ? XVFB : '/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const PORT = Number(process.env.FORCE_PORT);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mine = [];

function xvfb(n) {
	const c = spawn(XVFB_BIN, [`:${n}`, '-screen', '0', '1280x800x24', '-nolisten', 'tcp', '-displayfd', '3'], {
		stdio: ['ignore', 'ignore', 'ignore', 'pipe'],
	});
	mine.push(c);
	return new Promise((res, rej) => {
		c.stdio[3].on('data', (d) => res({ child: c, display: `:${d.toString().trim()}` }));
		c.on('exit', (code) => rej(new Error(`Xvfb :${n} exited ${code}`)));
	});
}
const ps = (pid) => {
	try {
		const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
		const ppid = Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1]);
		return { pid, ppid, argv: fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean) };
	} catch {
		return null;
	}
};
const childrenOf = (ppid) =>
	fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d)).map((d) => ps(Number(d))).filter((p) => p && p.ppid === ppid);

let browser;
try {
	const foreignX = await xvfb(5447);
	const ourX = await xvfb(5448);
	console.log(`FOREIGN display ${foreignX.display} (Xvfb pid ${foreignX.child.pid}); OUR display ${ourX.display} (Xvfb pid ${ourX.child.pid})`);

	const foreign = spawn(CD, [`--port=${PORT}`, '--allowed-origins=*'], { env: { ...process.env, DISPLAY: foreignX.display }, stdio: ['ignore', 'pipe', 'pipe'] });
	mine.push(foreign);
	await new Promise((r) => foreign.stdout.on('data', (d) => /started successfully/.test(d) && r()));
	console.log(`FOREIGN chromedriver pid ${foreign.pid} up on ${PORT} (env DISPLAY=${foreignX.display})`);

	// OUR side: env exactly like an e2e wdio worker (explicit DISPLAY = our private display)
	process.env.DISPLAY = ourX.display;
	const udd = path.join(here, 'p2-udd');
	fs.rmSync(udd, { recursive: true, force: true });
	fs.mkdirSync(udd);
	const t0 = Date.now();
	browser = await remote({
		logLevel: 'info',
		capabilities: {
			browserName: 'chrome',
			browserVersion: '150.0.7871.250',
			'goog:chromeOptions': { binary: OBS, windowTypes: ['app', 'webview'], args: [`--user-data-dir=${udd}`, '--no-sandbox'] },
			'wdio:chromedriverOptions': { binary: CD, allowedIps: [] },
			'wdio:enforceWebDriverClassic': true,
		},
	});
	console.log(`SESSION CREATED in ${Date.now() - t0} ms: ${browser.sessionId}; wdio thinks driver is localhost:${browser.options.port}`);
	const href = await browser.execute(() => location.href);
	console.log(`page: ${href}`);

	// whose Obsidian is it?
	const all = fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d)).map((d) => ps(Number(d))).filter((p) => p && p.argv.some((a) => a.includes(udd)) && !p.argv.some((a) => a.startsWith('--type=')));
	for (const p of all) console.log(`  process with OUR udd on its command line: pid ${p.pid} ppid ${p.ppid} (${p.ppid === foreign.pid ? 'FOREIGN chromedriver' : p.ppid === process.pid ? 'THIS process' : 'other'}) ${path.basename(p.argv[0])}`);
	const kids = all.filter((p) => p.ppid === foreign.pid);
	console.log(`Obsidian main process(es) parented by the FOREIGN chromedriver (pid ${foreign.pid}): ${kids.map((k) => k.pid).join(',') || 'none'}`);
	const myKids = childrenOf(process.pid).map((p) => `${p.pid}:${path.basename(p.argv[0])}`);
	console.log(`live children of THIS (our wdio) process: ${myKids.join(' ')}`);
	for (const k of kids) {
		console.log(`  obsidian ${k.pid} debug flags: ${k.argv.filter((a) => /remote-debugging|user-data-dir/.test(a)).join(' ')}`);
	}
	const dtap = path.join(udd, 'DevToolsActivePort');
	console.log(`OUR udd DevToolsActivePort: ${fs.existsSync(dtap) ? JSON.stringify(fs.readFileSync(dtap, 'utf8')) : 'absent'}`);
	for (const [who, d] of [['FOREIGN', foreignX.display], ['OUR', ourX.display]]) {
		const t = spawnSync('xwininfo', ['-root', '-children', '-display', d], { encoding: 'utf8' });
		const wins = (t.stdout.match(/^\s+0x[0-9a-f]+ .*$/gm) ?? []).filter((l) => !/has no name/.test(l));
		console.log(`windows on ${who} display ${d}: ${wins.length ? wins.map((w) => w.trim()).join(' | ') : 'none'}`);
	}
} catch (e) {
	console.log(`PROBE ERROR: ${e.stack ?? e}`);
} finally {
	try {
		await browser?.deleteSession();
	} catch (e) {
		console.log(`deleteSession: ${e.message}`);
	}
	await sleep(1000);
	for (const c of mine.reverse()) if (c.exitCode === null && c.signalCode === null) process.kill(c.pid, 'SIGTERM');
	await sleep(500);
	process.exit(0);
}
