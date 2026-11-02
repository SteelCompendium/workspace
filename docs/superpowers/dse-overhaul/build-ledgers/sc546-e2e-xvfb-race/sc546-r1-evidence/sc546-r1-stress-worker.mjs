// Helper-level stress worker. argv: barrierEpochMs. Races for :5300-:5339 through startOwnedXvfb.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { startOwnedXvfb, displayRange } = await import(process.env.SC546_HELPER);
const bin = spawnSync('which', ['Xvfb'], { encoding: 'utf8' }).stdout.trim();
const barrier = Number(process.argv[2]);
const allKids = [];
while (Date.now() < barrier - 5) await sleep(1);
while (Date.now() < barrier) {}
const got = await startOwnedXvfb({ bin, candidates: displayRange(5300, 5339), args: ['-screen', '0', '1600x1200x24', '-nolisten', 'tcp', '-noreset'], onSpawn: (c) => allKids.push(c.pid) });
await sleep(300);
let listening = [];
if (got) {
	const inodes = new Set();
	for (const f of fs.readdirSync(`/proc/${got.child.pid}/fd`)) { try { const m = /^socket:\[(\d+)\]$/.exec(fs.readlinkSync(`/proc/${got.child.pid}/fd/${f}`)); if (m) inodes.add(m[1]); } catch {} }
	for (const line of fs.readFileSync('/proc/net/unix', 'utf8').split('\n').slice(1)) { const p = line.trim().split(/\s+/); if (p.length >= 8 && inodes.has(p[6]) && p[5] === '01') listening.push(p[7]); }
}
console.log('RESULT ' + JSON.stringify({ pid: process.pid, display: got?.display ?? null, alive: got ? got.child.exitCode === null : null, ownSocketsListening: listening.length, kids: allKids }));
try { got?.child.kill('SIGTERM'); } catch {}
await new Promise((r) => got ? got.child.once('exit', r) : r());
process.exit(0);
