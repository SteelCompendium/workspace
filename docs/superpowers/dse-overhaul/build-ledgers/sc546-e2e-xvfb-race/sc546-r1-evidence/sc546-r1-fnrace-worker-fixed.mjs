// Worker: runs the BASE (97284051) startXvfb logic of one caller, extracted verbatim from the
// source file text with only the display range swapped for a private one (:5300-:5339).
// argv: variant barrierEpochMs
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
const [variant, barrier] = [process.argv[2], Number(process.argv[3])];
const root = process.env.SC546_TREE;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bin = spawnSync('which', ['Xvfb'], { encoding: 'utf8' }).stdout.trim();
const grab = (file, startRe, endMarker = '\n}\n') => {
	const t = fs.readFileSync(path.join(root, file), 'utf8');
	const i = t.search(startRe);
	if (i < 0) throw new Error('no ' + startRe);
	return t.slice(i, t.indexOf(endMarker, i) + endMarker.length);
};
let fnText, params, extraEnv = {};
const state = { xvfbPid: 0 };
const helper = await import(process.env.SC546_HELPER);
const H = { startOwnedXvfb: helper.startOwnedXvfb, displayRange: helper.displayRange, fs };
if (variant === 'e2e') {
	fnText = grab('e2e/run.mjs', /^async function startXvfb/m);
	params = { XVFB_RANGE: [5300, 5339], spawned: [], runId: 'sc546probe', xvfbPid: 0, resolveXvfb: () => bin, EnvError: Error, ...H };
} else if (variant === 'lifecycle') {
	fnText = grab('visual-harness/obsidian-lifecycle.mjs', /^async function startXvfb/m).replace('displayRange(160, 199)', 'displayRange(5300, 5339)');
	params = { resolveXvfb: () => bin, envFail: (m) => { throw new Error(m); }, liveXvfb: null, ...H };
} else if (variant === 'docs') {
	fnText = grab('visual-harness/docs-shots.mjs', /^const socketTaken/m, '\n}\n') ;
	const t = fs.readFileSync(path.join(root, 'visual-harness/docs-shots.mjs'), 'utf8');
	const i = t.indexOf('const socketTaken'); const j = t.indexOf('\n}\n', t.indexOf('async function startXvfb')) + 3;
	fnText = t.slice(i, j).replace('displayRange(99, 129)', 'displayRange(5301, 5339)');
	process.env.DSE_DOCS_DISPLAY = ':5300';
	params = { resolveXvfb: () => bin, ...H };
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const names = ['spawn', 'sleep', 'process', ...Object.keys(params)];
const body = fnText.replace(/^async function startXvfb\(\)/m, 'async function startXvfb()') + '\nreturn startXvfb();';
const fn = new AsyncFunction(...names, body);
// barrier: coarse sleep then spin to the exact instant
while (Date.now() < barrier - 5) await sleep(1);
while (Date.now() < barrier) { /* spin */ }
const T0 = Date.now();
const allKids = [];
const spawnLogged = (...a) => { const c = spawn(...a); const ts = Date.now() - T0; c.on('exit', (code, sig) => allKids.push({ pid: c.pid, spawnedAtMs: ts, exitAtMs: Date.now() - T0, code, sig })); return c; };
const t0 = Date.now();
let res, err = null;
try { res = await fn(spawnLogged, sleep, process, ...Object.values(params)); } catch (e) { err = String(e.message ?? e); }
const display = res?.display ?? null;
const child = res?.child ?? null;
await sleep(400);
const out = { variant, pid: process.pid, display, err, ownChildPid: child?.pid ?? null, ownChildAlive: child ? child.exitCode === null && child.signalCode === null : null, ownChildExit: child?.exitCode ?? null, ownSig: child?.signalCode ?? null, tookMs: Date.now() - t0, kids: allKids };
console.log('RESULT ' + JSON.stringify(out));
// cleanup: only Xvfb children this process spawned
for (const c of [child, ...(params.spawned ?? [])]) { try { c?.kill('SIGTERM'); } catch {} }
await sleep(300);
process.exit(0);
