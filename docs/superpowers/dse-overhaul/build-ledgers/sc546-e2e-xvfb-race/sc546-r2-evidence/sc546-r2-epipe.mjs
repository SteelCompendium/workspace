// SC-546 r2: a -displayfd Xvfb whose fd-3 reader is gone before it writes (what an orphan sees after its runner exited).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const bin = '/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb';
const c = spawn(bin, [':5378', '-screen', '0', '640x480x24', '-nolisten', 'tcp', '-displayfd', '3'], { stdio: ['ignore', 'ignore', 'pipe', 'pipe'] });
let err = ''; c.stderr.on('data', (d) => (err += d));
c.stdio[3].destroy();
const t0 = Date.now();
c.on('exit', (code, sig) => console.log(`exit after ${Date.now() - t0} ms code=${code} sig=${sig}; socket=${fs.existsSync('/tmp/.X11-unix/X5378')} lock=${fs.existsSync('/tmp/.X5378-lock')}; stderr tail: ${err.trim().split('\n').slice(-2).join(' / ')}`));
setTimeout(() => { console.log(`at 1500 ms alive=${c.exitCode === null && c.signalCode === null} socket=${fs.existsSync('/tmp/.X11-unix/X5378')}`); if (c.exitCode === null) c.kill('SIGTERM'); setTimeout(() => process.exit(0), 300); }, 1500);
