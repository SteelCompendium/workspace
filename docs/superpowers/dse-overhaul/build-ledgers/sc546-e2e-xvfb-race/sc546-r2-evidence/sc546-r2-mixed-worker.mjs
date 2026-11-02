// SC-546 r2 mixed-fleet worker. argv: <mode old-e2e|old-lc|new> <barrierMs> <releaseMs>. Range :5360-:5369.
// old-e2e / old-lc = the dabfb518 startXvfb logic of e2e/run.mjs / obsidian-lifecycle.mjs, verbatim
// except the range and the binary; new = scripts/xvfb-owned.mjs at the branch HEAD.
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const H = '/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/scripts/xvfb-owned.mjs';
const { startOwnedXvfb, displayRange } = await import(H);
const bin = '/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [mode, barrier, release] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4])];
const LO = 5360, HI = 5369;

async function oldE2e() {
	for (let n = LO; n <= HI; n++) {
		if (fs.existsSync(`/tmp/.X11-unix/X${n}`) || fs.existsSync(`/tmp/.X${n}-lock`)) continue;
		const child = spawn(bin, [`:${n}`, '-screen', '0', '640x480x24', '-nolisten', 'tcp', '-noreset'], { stdio: 'ignore' });
		child.on('error', () => {});
		for (let i = 0; i < 40; i++) {
			if (child.exitCode !== null) break;
			if (fs.existsSync(`/tmp/.X11-unix/X${n}`)) return { display: `:${n}`, child };
			await sleep(100);
		}
		try { child.kill('SIGKILL'); } catch {}
	}
	return null;
}
async function oldLc() {
	let num = -1;
	for (let n = LO; n <= HI; n++) {
		if (!fs.existsSync(`/tmp/.X11-unix/X${n}`) && !fs.existsSync(`/tmp/.X${n}-lock`)) { num = n; break; }
	}
	if (num < 0) return null;
	const child = spawn(bin, [`:${num}`, '-screen', '0', '640x480x24', '-nolisten', 'tcp'], { stdio: 'ignore' });
	child.on('error', () => {});
	for (let i = 0; i < 40; i++) {
		if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) return { display: `:${num}`, child };
		await sleep(250);
	}
	return { display: null, child };
}
async function nu() {
	return startOwnedXvfb({ bin, candidates: displayRange(LO, HI), args: ['-screen', '0', '640x480x24', '-nolisten', 'tcp', '-noreset'] });
}
function listening(pid) {
	const inodes = new Set();
	try {
		for (const f of fs.readdirSync(`/proc/${pid}/fd`)) { try { const m = /^socket:\[(\d+)\]$/.exec(fs.readlinkSync(`/proc/${pid}/fd/${f}`)); if (m) inodes.add(m[1]); } catch {} }
	} catch { return []; }
	const out = [];
	for (const line of fs.readFileSync('/proc/net/unix', 'utf8').split('\n').slice(1)) { const p = line.trim().split(/\s+/); if (p.length >= 8 && inodes.has(p[6]) && p[5] === '01') out.push(p[7]); }
	return out;
}
while (Date.now() < barrier - 5) await sleep(1);
while (Date.now() < barrier) {}
const got = mode === 'old-e2e' ? await oldE2e() : mode === 'old-lc' ? await oldLc() : await nu();
const at = Date.now() - barrier;
await sleep(Math.max(0, release - Date.now()));
const pid = got?.child.pid;
const r = { mode, display: got?.display ?? null, at, pid, alive: got ? got.child.exitCode === null && got.child.signalCode === null : null, listening: pid ? listening(pid) : [] };
console.log('RESULT ' + JSON.stringify(r));
if (got?.child && got.child.exitCode === null) { got.child.kill('SIGTERM'); await new Promise((res) => got.child.once('exit', res)); }
process.exit(0);
