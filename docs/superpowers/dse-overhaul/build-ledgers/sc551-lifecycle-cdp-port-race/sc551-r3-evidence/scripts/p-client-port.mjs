// SC-551 r3 probe (D2a-try1 hypothesis): a pinned DSE_LIFECYCLE_PORT inside ip_local_port_range can be held by an
// ordinary loopback CLIENT socket (some process's outgoing connection whose ephemeral source port happens to be n).
// That is not a listener, so portInUse() reports "free", but Chromium's bind() of 127.0.0.1:n fails -> both runs of a
// pair (or a lone run) lose with "another instance owns it". Here: a client socket bound to 127.0.0.1:48631 and
// connected to a private listener on 48632, then ONE pinned lifecycle run (private clone, :5440-:5454) on 48631.
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const N = 48631;
const srv = net.createServer(() => {});
await new Promise((r) => srv.listen(48632, '127.0.0.1', r));
const client = net.connect({ port: 48632, host: '127.0.0.1', localAddress: '127.0.0.1', localPort: N });
await new Promise((r, j) => (client.once('connect', r), client.once('error', j)));
console.log(`client socket ${client.localAddress}:${client.localPort} -> 127.0.0.1:48632 established (not a listener)`);
const t0 = Date.now();
const lc = spawn(process.execPath, [path.join(here, 'fixwt/visual-harness/obsidian-lifecycle.mjs'), '--only=G-S6b'], {
	env: { ...process.env, DSE_LIFECYCLE_PORT: String(N), TMP_TAG: 'solo', XVFB_BIN: '/home/scott/code/steelCompendium/workspace/draw-steel-elements/.devbox/nix/profile/default/bin/Xvfb' },
	stdio: ['ignore', 'pipe', 'pipe'],
});
const on = (d) => d.toString().split('\n').filter((l) => /OBSIDIAN-LIFECYCLE|TMPLOG/.test(l)).forEach((l) => console.log(`lifecycle> ${l.slice(0, 240)}`));
lc.stdout.on('data', on);
lc.stderr.on('data', on);
const rc = await new Promise((r) => lc.on('exit', (c) => r(c)));
console.log(`lifecycle rc=${rc} after ${Math.round((Date.now() - t0) / 1000)} s`);
client.destroy();
srv.close();
process.exit(0);
