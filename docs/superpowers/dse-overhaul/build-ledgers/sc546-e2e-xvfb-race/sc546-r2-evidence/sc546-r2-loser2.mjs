// SC-546 r2: two plain (no -displayfd) Xvfb :5379 spawned in the same tick; how long does the race loser live, and how does it end?
import { spawn } from 'node:child_process';
const bin = '/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [r, off] of [0,1,2,3,4,5,6,8,10,12,15,20,25,30,40].map((o, i) => [i + 1, o])) {
	const t0 = Date.now();
	const mk = () => { const c = spawn(bin, [':5379', '-screen', '0', '640x480x24', '-nolisten', 'tcp'], { stdio: ['ignore', 'ignore', 'pipe'] }); let e = ''; c.stderr.on('data', (d) => (e += d)); c.done = new Promise((res) => c.once('exit', (code, sig) => res({ code, sig, ms: Date.now() - t0, why: e.split('\n').filter((l) => /already|lock|Cannot/i.test(l)).slice(0, 2).join(' / ') }))); return c; };
	const a = mk(); await sleep(off); const b = mk();
	const first = await Promise.race([a.done.then((x) => ['a', x]), b.done.then((x) => ['b', x]), sleep(12000).then(() => null)]);
	const alive900 = null;
	if (!first) { console.log(`round ${r}: neither exited in 12 s`); a.kill('SIGTERM'); b.kill('SIGTERM'); await Promise.all([a.done, b.done]); continue; }
	const winner = first[0] === 'a' ? b : a;
	console.log(`round ${r} offset ${off} ms: loser exited after ${first[1].ms} ms code=${first[1].code} sig=${first[1].sig} "${first[1].why}"`);
	winner.kill('SIGTERM'); await winner.done; await sleep(200);
}
