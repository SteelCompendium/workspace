import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bin = spawnSync('which', ['Xvfb'], { encoding: 'utf8' }).stdout.trim();
for (let round = 0; round < 6; round++) {
  const n = 5310 + round;
  const mk = () => { const c = spawn(bin, [`:${n}`, '-screen', '0', '1600x1200x24', '-nolisten', 'tcp', '-noreset'], { stdio: ['ignore', 'ignore', 'pipe'] }); c.err = ''; c.stderr.on('data', (d) => (c.err += d)); c.t0 = Date.now(); c.on('exit', (code) => { c.exited = Date.now() - c.t0; c.code = code; }); return c; };
  const a = mk(), b = mk();
  const sockAt = [];
  for (let i = 0; i < 30; i++) { await sleep(50); if (fs.existsSync(`/tmp/.X11-unix/X${n}`) && !sockAt.length) sockAt.push(Date.now() - a.t0); }
  console.log(`n=${n}: socketAt=${sockAt[0] ?? 'never'}ms; A pid ${a.pid} exited=${a.exited ?? 'alive'} code=${a.code}; B pid ${b.pid} exited=${b.exited ?? 'alive'} code=${b.code}; lock=${fs.existsSync(`/tmp/.X${n}-lock`) ? JSON.stringify(fs.readFileSync(`/tmp/.X${n}-lock`, 'utf8')) : 'none'}`);
  if (a.err) console.log('  A stderr tail:', a.err.trim().split('\n').slice(-2).join(' | '));
  if (b.err) console.log('  B stderr tail:', b.err.trim().split('\n').slice(-2).join(' | '));
  for (const c of [a, b]) if (c.exited === undefined) c.kill('SIGTERM');
  await sleep(500);
}
