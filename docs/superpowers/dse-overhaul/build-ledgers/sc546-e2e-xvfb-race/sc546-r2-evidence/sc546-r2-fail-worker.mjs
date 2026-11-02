// SC-546 r2: one failure-path case per process. argv: <case>. Private range :5340-:5379 only.
// Prints "RESULT <json>" then lets the event loop drain on its own (no process.exit) so the
// orchestrator can see whether anything (a pipe fd, a child handle) keeps node alive.
import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
const H = '/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/scripts/xvfb-owned.mjs';
const { startOwnedXvfb } = await import(H);
const XVFB = '/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const S = '/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARGS = ['-screen', '0', '640x480x24', '-nolisten', 'tcp'];
const kase = process.argv[2];
const kids = [];
const onSpawn = (c, n) => kids.push({ pid: c.pid, n });
const fdsBefore = fs.readdirSync('/proc/self/fd').length;
const pipesNow = () => fs.readdirSync('/proc/self/fd').map((f) => { try { return fs.readlinkSync(`/proc/self/fd/${f}`); } catch { return ''; } }).filter((l) => l.startsWith('pipe:')).length;
const pipesBefore = pipesNow();
const extra = []; // helper processes of the probe itself (old-style holders), killed at the end
const startOld = async (n, displayfd = false) => {
	const c = spawn(XVFB, [`:${n}`, ...ARGS, ...(displayfd ? ['-displayfd', '3'] : [])], { stdio: ['ignore', 'ignore', 'ignore', displayfd ? 'pipe' : 'ignore'] });
	extra.push(c);
	for (let i = 0; i < 50 && !fs.existsSync(`/tmp/.X11-unix/X${n}`); i++) await sleep(50);
	if (displayfd) c.stdio[3]?.destroy();
	return c;
};
const t0 = Date.now();
let got = null;
let note = '';
switch (kase) {
	case 'badarg':
		got = await startOwnedXvfb({ bin: XVFB, candidates: [5340, 5341], args: [...ARGS, '-sc546-no-such-option'], onSpawn });
		break;
	case 'missing':
		got = await startOwnedXvfb({ bin: '/nonexistent/sc546-r2/Xvfb', candidates: [5342, 5343], args: ARGS, onSpawn });
		break;
	case 'noexec': {
		const f = `${S}/sc546-r2-noexec-xvfb`;
		fs.writeFileSync(f, '#!/bin/sh\nexit 0\n', { mode: 0o644 });
		fs.chmodSync(f, 0o644);
		got = await startOwnedXvfb({ bin: f, candidates: [5342, 5343], args: ARGS, onSpawn });
		break;
	}
	case 'hang': {
		const f = `${S}/sc546-r2-hang-xvfb.sh`;
		fs.writeFileSync(f, '#!/bin/sh\nexec sleep 60\n', { mode: 0o755 });
		got = await startOwnedXvfb({ bin: f, candidates: [5351, 5352], args: ARGS, onSpawn, startTimeoutMs: 1500 });
		break;
	}
	case 'hang-default': {
		const f = `${S}/sc546-r2-hang-xvfb.sh`;
		fs.writeFileSync(f, '#!/bin/sh\nexec sleep 60\n', { mode: 0o755 });
		got = await startOwnedXvfb({ bin: f, candidates: Array.from({ length: 40 }, (_, i) => 5340 + i), args: ARGS, onSpawn });
		break;
	}
	case 'alltaken': {
		await startOld(5344);
		await startOld(5345);
		await startOld(5346, true);
		const t1 = Date.now();
		got = await startOwnedXvfb({ bin: XVFB, candidates: [5344, 5345, 5346], args: ARGS, onSpawn });
		note = `precheck-only ms=${Date.now() - t1}`;
		const t2 = Date.now();
		const got2 = await startOwnedXvfb({ bin: XVFB, candidates: [5344, 5345, 5346], args: ARGS, onSpawn, isTaken: () => false });
		note += ` | no-precheck (bind arbitration) got=${got2?.display ?? null} ms=${Date.now() - t2}`;
		if (got2) { got2.child.kill('SIGTERM'); }
		break;
	}
	case 'stalelock': {
		const dead = spawnSync('true').pid;
		fs.writeFileSync('/tmp/.X5347-lock', `${String(dead).padStart(10)}\n`);
		got = await startOwnedXvfb({ bin: XVFB, candidates: [5347, 5348], args: ARGS, onSpawn });
		note = `default precheck -> ${got?.display}`;
		got?.child.kill('SIGTERM');
		await sleep(300);
		const g2 = await startOwnedXvfb({ bin: XVFB, candidates: [5347], args: ARGS, onSpawn, isTaken: () => false });
		note += ` | isTaken=false on stale-lock :5347 -> ${g2?.display ?? null}; lock after=${fs.existsSync('/tmp/.X5347-lock')}`;
		g2?.child.kill('SIGTERM');
		await sleep(300);
		fs.unlinkSync('/tmp/.X5347-lock');
		got = null;
		break;
	}
	case 'stalesocket': {
		const c = await startOld(5349, true);
		c.kill('SIGKILL');
		await sleep(300);
		note = `after SIGKILL of -displayfd Xvfb: socket=${fs.existsSync('/tmp/.X11-unix/X5349')} lock=${fs.existsSync('/tmp/.X5349-lock')}`;
		const g1 = await startOwnedXvfb({ bin: XVFB, candidates: [5349, 5350], args: ARGS, onSpawn });
		note += ` | default precheck -> ${g1?.display}`;
		g1?.child.kill('SIGTERM');
		await sleep(300);
		const g2 = await startOwnedXvfb({ bin: XVFB, candidates: [5349], args: ARGS, onSpawn, isTaken: () => false });
		note += ` | isTaken=false on stale socket :5349 -> ${g2?.display ?? null}`;
		g2?.child.kill('SIGTERM');
		await sleep(300);
		note += ` | socket after SIGTERM=${fs.existsSync('/tmp/.X11-unix/X5349')}`;
		break;
	}
	case 'livelock': {
		const holder = spawn('sleep', ['60'], { stdio: 'ignore' });
		extra.push(holder);
		fs.writeFileSync('/tmp/.X5353-lock', `${String(holder.pid).padStart(10)}\n`);
		const g1 = await startOwnedXvfb({ bin: XVFB, candidates: [5353, 5354], args: ARGS, onSpawn });
		note = `default precheck -> ${g1?.display}`;
		g1?.child.kill('SIGTERM');
		await sleep(300);
		const g2 = await startOwnedXvfb({ bin: XVFB, candidates: [5353], args: ARGS, onSpawn, isTaken: () => false });
		note += ` | isTaken=false on live-foreign-lock :5353 -> ${g2?.display ?? null}`;
		g2?.child.kill('SIGTERM');
		await sleep(300);
		fs.unlinkSync('/tmp/.X5353-lock');
		break;
	}
	case 'success': {
		got = await startOwnedXvfb({ bin: XVFB, candidates: [5355], args: ARGS, onSpawn });
		note = `pipes during success=${pipesNow() - pipesBefore} childStdio3Destroyed=${got?.child.stdio[3]?.destroyed}`;
		break;
	}
	default:
		throw new Error('unknown case ' + kase);
}
const ms = Date.now() - t0;
if (got) got.child.kill('SIGTERM');
for (const c of extra) { try { c.kill('SIGTERM'); } catch {} }
await sleep(500);
const leakedKids = kids.filter((k) => fs.existsSync(`/proc/${k.pid}`) && !/^Z/.test(fs.readFileSync(`/proc/${k.pid}/stat`, 'utf8').split(') ')[1] ?? '')).map((k) => k.pid);
console.log('RESULT ' + JSON.stringify({ kase, display: got?.display ?? null, ms, spawned: kids.map((k) => k.n), leakedKids, extraPipes: pipesNow() - pipesBefore, fdsDelta: fs.readdirSync('/proc/self/fd').length - fdsBefore, note }));
console.log('RETURNED_AT ' + Date.now());
