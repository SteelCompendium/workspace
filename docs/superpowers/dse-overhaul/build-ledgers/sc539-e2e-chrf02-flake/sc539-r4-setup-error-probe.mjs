import net from 'node:net';
import fs from 'node:fs';
import { parkPointer } from '/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake/draw-steel-elements/e2e/x11-pointer.mjs';
const NUM = 5390;
const path = `/tmp/.X11-unix/X${NUM}`;
function reply(kind) {
	if (kind === 'auth') {
		const msg = Buffer.from('need cookie\0\0\0\0\0');
		const b = Buffer.alloc(8 + 12);
		b[0] = 2;
		b.writeUInt16LE(11, 2);
		b.writeUInt16LE(3, 6);
		msg.copy(b, 8, 0, 12);
		return b;
	}
	if (kind === 'failed') {
		const why = 'no go';
		const b = Buffer.alloc(8 + 8);
		b[0] = 0;
		b[1] = why.length;
		b.writeUInt16LE(2, 6);
		b.write(why, 8, 'latin1');
		return b;
	}
	if (kind === 'short') {
		const b = Buffer.alloc(8);
		b[0] = 1;
		return b;
	}
}
for (const kind of ['auth', 'failed', 'short']) {
	try { fs.unlinkSync(path); } catch {}
	const srv = net.createServer((c) => c.once('data', () => c.write(reply(kind))));
	await new Promise((r) => srv.listen(path, r));
	try {
		await parkPointer(`:${NUM}`);
		console.log(kind, 'UNEXPECTED OK');
	} catch (e) {
		console.log(kind, '->', e.message);
	}
	srv.close();
	try { fs.unlinkSync(path); } catch {}
}
