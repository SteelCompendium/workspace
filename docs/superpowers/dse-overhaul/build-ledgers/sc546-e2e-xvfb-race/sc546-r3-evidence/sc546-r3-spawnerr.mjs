// Function-level: each caller's own startXvfb text (extracted) with an unexecutable / missing binary.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const root = process.env.SC546_TREE;
const H = await import(process.env.SC546_HELPER);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const t = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const slice = (txt, startRe) => { const i = txt.search(startRe); return txt.slice(i, txt.indexOf('\n}\n', txt.indexOf('async function startXvfb', i)) + 3); };
for (const bin of [process.env.SC546_NOEXEC, process.env.SC546_MISSING]) {
	for (const v of ['e2e', 'lifecycle', 'docs']) {
		let text, params;
		if (v === 'e2e') { text = slice(t('e2e/run.mjs'), /^async function startXvfb/m); params = { XVFB_RANGE: [5300, 5339], spawned: [], runId: 'x', xvfbPid: 0, interrupted: false, resolveXvfb: () => bin, EnvError: class EnvError extends Error {} }; }
		if (v === 'lifecycle') { text = slice(t('visual-harness/obsidian-lifecycle.mjs'), /^async function startXvfb/m).replace('displayRange(160, 199)', 'displayRange(5300, 5339)'); params = { resolveXvfb: () => bin, envFail: (m) => { throw new Error('envFail: ' + m); }, liveXvfb: null, shuttingDownOnSignal: false }; }
		if (v === 'docs') { const tx = t('visual-harness/docs-shots.mjs'); const i = tx.indexOf('const socketTaken'); text = tx.slice(i, tx.indexOf('\n}\n', tx.indexOf('async function startXvfb')) + 3).replace('displayRange(99, 129)', 'displayRange(5301, 5339)'); process.env.DSE_DOCS_DISPLAY = ':5300'; params = { resolveXvfb: () => bin }; }
		const fn = new AsyncFunction('spawn', 'sleep', 'process', 'fs', 'displayRange', 'startOwnedXvfb', 'XvfbSpawnError', ...Object.keys(params), text + '\nreturn startXvfb();');
		const t0 = Date.now(); let res, err = null;
		try { res = await fn(spawn, sleep, process, fs, H.displayRange, H.startOwnedXvfb, H.XvfbSpawnError, ...Object.values(params)); } catch (e) { err = `${e.constructor.name}: ${e.message}`; }
		console.log(`${v} bin=${path.basename(bin)}: ${Date.now() - t0} ms; returned=${res === null ? 'null' : res ? 'display ' + res.display : 'undefined'}; thrown=${err}`);
	}
}
