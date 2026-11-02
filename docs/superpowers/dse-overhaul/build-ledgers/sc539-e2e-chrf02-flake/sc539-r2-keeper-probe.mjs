import { spawnSync, spawn } from 'node:child_process';
import { parkPointer } from '/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake/draw-steel-elements/e2e/x11-pointer.mjs';
const d = process.argv[2];
const loc = () => spawnSync('xdotool', ['getmouselocation'], { env: { ...process.env, DISPLAY: d }, encoding: 'utf8' }).stdout.trim();
console.log('before', loc());
let h;
try {
	h = await parkPointer(d);
} catch (e) {
	console.log('REJECT', e.message);
	process.exit(0);
}
console.log('parked; external read', loc());
const x = spawn('xlogo', ['-geometry', '200x200+500+500'], { env: { ...process.env, DISPLAY: d }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
console.log('with xlogo', loc());
x.kill();
await new Promise((r) => setTimeout(r, 500));
console.log('after xlogo gone', loc());
h.release();
await new Promise((r) => setTimeout(r, 500));
console.log('after release', loc());
