// Throwaway: measure Xvfb -displayfd behaviour on explicit :n (private range :5300-:5339 only).
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bin = spawnSync('which', ['Xvfb'], { encoding: 'utf8' }).stdout.trim();
console.log('bin', bin);
const ver = spawnSync(bin, ['-version'], { encoding: 'utf8' }); console.log('version stderr:', (ver.stderr || '').split('\n').slice(0, 3).join(' | '));
const exists = (p) => fs.existsSync(p);
function start(n, extra = [], noFd = false) {
  const t0 = Date.now();
  const child = spawn(bin, [`:${n}`, '-screen', '0', '1600x1200x24', '-nolisten', 'tcp', '-noreset', ...(noFd ? [] : ['-displayfd', '3']), ...extra], { stdio: ['ignore', 'ignore', 'pipe', 'pipe'] });
  const r = { child, fdData: '', stderr: '', t0, tFd: null, tExit: null, code: undefined, sig: undefined };
  child.stdio[3].on('data', (d) => { r.fdData += d.toString(); if (r.tFd === null) r.tFd = Date.now() - t0; });
  child.stdio[2].on('data', (d) => { r.stderr += d.toString(); });
  child.on('exit', (c, s) => { r.tExit = Date.now() - t0; r.code = c; r.sig = s; });
  child.on('error', () => {});
  return r;
}
const lock = (n) => `/tmp/.X${n}-lock`, sock = (n) => `/tmp/.X11-unix/X${n}`;
const N = 5300;
// 1. single start
let a = start(N);
await sleep(1500);
console.log('--- 1. lone start :%d', N);
console.log(' fdData', JSON.stringify(a.fdData), 'tFd ms', a.tFd, 'exited?', a.tExit, 'pid', a.child.pid);
console.log(' lock exists', exists(lock(N)), 'content', JSON.stringify(exists(lock(N)) ? fs.readFileSync(lock(N), 'utf8') : null), 'size', exists(lock(N)) ? fs.statSync(lock(N)).size : null, 'mode', exists(lock(N)) ? (fs.statSync(lock(N)).mode & 0o777).toString(8) : null);
console.log(' socket exists', exists(sock(N)));
// 2. second start on same held n
let b = start(N);
await sleep(1500);
console.log('--- 2. second Xvfb on held :%d', N);
console.log(' fdData', JSON.stringify(b.fdData), 'tExit ms', b.tExit, 'code', b.code, 'sig', b.sig);
console.log(' stderr:', b.stderr.trim().split('\n').slice(-4).join(' | '));
console.log(' first still alive', a.tExit === null, 'lock content now', (exists(lock(N)) ? fs.readFileSync(lock(N), 'utf8').trim() : '(no lock file)'), 'socket', exists(sock(N)));
// 3. SIGTERM first
a.child.kill('SIGTERM'); await sleep(800);
console.log('--- 3. SIGTERM first: exit code', a.code, 'sig', a.sig, 'lock exists', exists(lock(N)), 'socket exists', exists(sock(N)));
// 4. SIGKILL
let c = start(N + 1);
await sleep(1200);
console.log('--- 4. :%d fdData', N + 1, JSON.stringify(c.fdData), 'tFd', c.tFd);
c.child.kill('SIGKILL'); await sleep(500);
console.log(' after SIGKILL: lock', exists(lock(N + 1)), 'socket', exists(sock(N + 1)));
// 5. restart on stale leftovers (lock with dead pid, socket present)
let d = start(N + 1);
await sleep(1500);
console.log('--- 5. start on stale leftovers :%d: fdData', N + 1, JSON.stringify(d.fdData), 'tFd', d.tFd, 'exited', d.tExit, 'code', d.code, 'stderr', d.stderr.trim().slice(0, 200));
d.child.kill('SIGTERM'); await sleep(800);
console.log(' after SIGTERM: lock', exists(lock(N + 1)), 'socket', exists(sock(N + 1)));
// 6. race: 2 simultaneous spawns on same n
let e1 = start(N + 2), e2 = start(N + 2);
await sleep(2000);
console.log('--- 6. simultaneous x2 on :%d', N + 2);
for (const [i, e] of [[1, e1], [2, e2]]) console.log(` #${i} pid ${e.child.pid} fdData ${JSON.stringify(e.fdData)} tFd ${e.tFd} exited ${e.tExit} code ${e.code} stderr ${JSON.stringify(e.stderr.trim().slice(0, 120))}`);
console.log(' lock content', (exists(lock(N + 2)) ? fs.readFileSync(lock(N + 2), 'utf8').trim() : '(no lock file)'));
for (const e of [e1, e2]) if (e.tExit === null) e.child.kill('SIGTERM');
await sleep(800);
console.log(' after: lock', exists(lock(N + 2)), 'socket', exists(sock(N + 2)));

// 7. control: no -displayfd -> lock file?
let f = start(N + 3, [], true);
await sleep(1200);
console.log('--- 7. control, NO -displayfd, :%d: lock', N + 3, exists(lock(N + 3)) ? JSON.stringify(fs.readFileSync(lock(N + 3), 'utf8')) + ' mode ' + (fs.statSync(lock(N + 3)).mode & 0o777).toString(8) : false, 'socket', exists(sock(N + 3)), 'pid', f.child.pid);
// 8. -displayfd Xvfb on a n held by a no-displayfd (old-code) Xvfb
let g = start(N + 3);
await sleep(1200);
console.log('--- 8. -displayfd Xvfb on :%d held by old-style Xvfb: fdData', N + 3, JSON.stringify(g.fdData), 'exit', g.tExit, 'code', g.code, 'stderr', JSON.stringify(g.stderr.trim().slice(0, 160)));
f.child.kill('SIGTERM'); await sleep(800);
console.log(' old-style after SIGTERM: lock', exists(lock(N + 3)), 'socket', exists(sock(N + 3)));
// 9. old-style (no displayfd) Xvfb on a n held by a -displayfd Xvfb
let h = start(N + 4);
await sleep(1000);
let i2 = start(N + 4, [], true);
await sleep(1200);
console.log('--- 9. old-style Xvfb on :%d held by -displayfd Xvfb: h fd', N + 4, JSON.stringify(h.fdData), '| old-style exit', i2.tExit, 'code', i2.code, 'stderr', JSON.stringify(i2.stderr.trim().slice(0, 160)));
h.child.kill('SIGTERM'); await sleep(800);
console.log(' after: lock', exists(lock(N + 4)), 'socket', exists(sock(N + 4)));
// 10. time to write fd, 10 sequential starts
const ts = [];
for (let k = 0; k < 10; k++) { const x = start(N + 5); await sleep(400); ts.push([x.tFd, JSON.stringify(x.fdData)]); x.child.kill('SIGTERM'); await sleep(300); }
console.log('--- 10. fd write latency ms x10', ts.map((t) => t[0]).join(','), 'values', [...new Set(ts.map((t) => t[1]))].join(','));
console.log(' leftovers: lock', exists(lock(N + 5)), 'socket', exists(sock(N + 5)));
