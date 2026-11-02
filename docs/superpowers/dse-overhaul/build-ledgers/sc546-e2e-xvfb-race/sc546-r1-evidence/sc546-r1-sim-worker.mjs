// Worker for ground-truth simultaneity probe. argv: mode(fd|nofd) n barrierEpochMs
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
const [mode, n, barrier] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4])];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bin = spawnSync('which', ['Xvfb'], { encoding: 'utf8' }).stdout.trim();
while (Date.now() < barrier - 5) await sleep(1);
while (Date.now() < barrier) {}
const args = [`:${n}`, '-screen', '0', '1600x1200x24', '-nolisten', 'tcp', '-noreset', ...(mode === 'fd' ? ['-displayfd', '3'] : [])];
const c = spawn(bin, args, { stdio: ['ignore', 'ignore', 'ignore', ...(mode === 'fd' ? ['pipe'] : [])] });
const T0 = Date.now();
let fdData = '', exit = null;
if (mode === 'fd') c.stdio[3].on('data', (d) => (fdData += d));
c.on('exit', (code, sig) => (exit = { code, sig, at: Date.now() - T0 }));
await sleep(900);
// ground truth: listening unix sockets owned by this child
const inodes = new Set();
try { for (const f of fs.readdirSync(`/proc/${c.pid}/fd`)) { try { const l = fs.readlinkSync(`/proc/${c.pid}/fd/${f}`); const m = /^socket:\[(\d+)\]$/.exec(l); if (m) inodes.add(m[1]); } catch {} } } catch {}
const listening = [];
for (const line of fs.readFileSync('/proc/net/unix', 'utf8').split('\n').slice(1)) { const p = line.trim().split(/\s+/); if (p.length >= 8 && inodes.has(p[6]) && p[5] === '01' && /X\d+$/.test(p[7] ?? '')) listening.push(p[7]); }
console.log('RESULT ' + JSON.stringify({ mode, pid: c.pid, fdData, exit, alive: exit === null, listening }));
try { c.kill('SIGTERM'); } catch {}
await sleep(400);
process.exit(0);
