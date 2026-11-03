// SC-551 probe: two raw Obsidians started in the same instant on the SAME pinned port: who writes DevToolsActivePort / prints the stderr line?
// usage: node measure-b.mjs <port> <tries> <display-base>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [portArg, triesArg, dispArg] = process.argv.slice(2);
const WT = '/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements';
const { displayRange, startOwnedXvfb } = await import(`${WT}/scripts/xvfb-owned.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cfg = path.join(os.homedir(), '.config', 'obsidian');
const asar = fs.readdirSync(cfg).filter((f) => /^obsidian-.*\.asar$/.test(f)).sort().at(-1);
const x = await startOwnedXvfb({ bin: process.env.XVFB_BIN, candidates: displayRange(Number(dispArg), Number(dispArg) + 9), args: ['-screen', '0', '1600x1200x24', '-nolisten', 'tcp'] });
const mk = () => {
	const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sc551-probe-'));
	const vault = path.join(work, 'vault');
	const udd = path.join(work, 'udd');
	fs.mkdirSync(path.join(vault, '.obsidian'), { recursive: true });
	fs.writeFileSync(path.join(vault, 'a.md'), '# a\n');
	fs.mkdirSync(udd, { recursive: true });
	fs.writeFileSync(path.join(udd, 'obsidian.json'), JSON.stringify({ vaults: { v1: { path: vault, ts: Date.now(), open: true } } }));
	fs.writeFileSync(path.join(udd, 'v1.json'), JSON.stringify({ x: 0, y: 0, width: 1440, height: 1100, isMaximized: false, devTools: false, zoom: 0 }));
	fs.copyFileSync(path.join(cfg, asar), path.join(udd, asar));
	return { work, udd };
};
for (let i = 1; i <= Number(triesArg); i++) {
	const runs = ['A', 'B'].map((tag) => ({ tag, ...mk() }));
	const t0 = Date.now();
	for (const r of runs) {
		r.err = '';
		r.child = spawn('/usr/bin/obsidian', [`--user-data-dir=${r.udd}`, `--remote-debugging-port=${portArg}`, '--window-size=1440,1100'], { env: { ...process.env, DISPLAY: x.display }, stdio: ['ignore', 'ignore', 'pipe'] });
		r.child.stderr.on('data', (d) => (r.err += d));
	}
	await sleep(7000);
	const res = runs.map((r) => ({ tag: r.tag, file: fs.existsSync(path.join(r.udd, 'DevToolsActivePort')) ? fs.readFileSync(path.join(r.udd, 'DevToolsActivePort'), 'utf8') : null, stderrLine: /DevTools listening[^\n]*/.exec(r.err)?.[0] ?? null, devtoolsErr: r.err.split('\n').filter((l) => /devtools|bind|address in use/i.test(l) && !/listening/.test(l)).slice(0, 3), alive: r.child.exitCode === null }));
	console.log(`try ${i}: ${JSON.stringify(res)}`);
	for (const r of runs) {
		r.child.kill('SIGKILL');
		fs.rmSync(r.work, { recursive: true, force: true });
	}
	await sleep(1000);
}
x.child.kill('SIGTERM');
