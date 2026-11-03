// SC-551 survey probe: hold a TCP port on the given hosts and answer any HTTP request with a
// marker body, so a client that reaches us instead of the process it meant is visible.
// usage: node holder.mjs <port> <host>[,<host>...] <tag>
import net from 'node:net';

const [port, hosts, tag] = [Number(process.argv[2]), process.argv[3].split(','), process.argv[4] ?? 'HOLDER'];
let up = 0;
for (const host of hosts) {
	const srv = net.createServer((s) => {
		console.log(`${tag} connection on ${host}:${port} from ${s.remoteAddress}:${s.remotePort}`);
		s.on('data', (d) => {
			const first = d.toString('latin1').split('\r\n')[0];
			console.log(`${tag} request: ${first}`);
			const body = JSON.stringify({ value: { error: 'wrong-instance', message: `answered by ${tag}` } });
			s.end(`HTTP/1.1 500 X\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\nConnection: close\r\n\r\n${body}`);
		});
		s.on('error', () => {});
	});
	srv.on('error', (e) => {
		console.log(`${tag} listen ${host}:${port} FAILED ${e.code}`);
		process.exit(3);
	});
	srv.listen({ port, host, ipv6Only: host === '::1' || host === '::' ? false : undefined }, () => {
		console.log(`${tag} listening ${host}:${port}`);
		if (++up === hosts.length) console.log(`${tag} READY pid=${process.pid}`);
	});
}
setTimeout(() => process.exit(0), Number(process.env.HOLD_MS ?? 60000));
