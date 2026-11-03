F='/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements/visual-harness/obsidian-lifecycle.mjs'
s=open(F).read()
def rep(old,new):
    global s
    assert s.count(old)==1, old
    s=s.replace(old,new,1)
rep("displayRange(160, 199)","displayRange(5400, 5439)")
a="		if (!Number.isInteger(REQUESTED_PORT)"
rep(a,"		if (process.env.TMP_BARRIER) while (Date.now() < Number(process.env.TMP_BARRIER)) await sleep(2); // TEMP SC-551\n"+a)
b="		const cfg = path.join(os.homedir(), '.config', 'obsidian');\n"
rep(b,"""		if (process.env.TMP_FAKE_CDP) { // TEMP SC-551: a stranger starts listening after the pre-check, before our Obsidian spawns
			const http = await import('node:http');
			const ws = `ws://127.0.0.1:${REQUESTED_PORT}/devtools/browser/99999999-9999-4999-8999-999999999999`;
			const srv = http.createServer((req, res) => {
				console.log(`TMPLOG FAKE request ${req.url}`);
				res.setHeader('content-type', 'application/json');
				res.end(req.url === '/json/version' ? JSON.stringify({ webSocketDebuggerUrl: ws }) : JSON.stringify([{ type: 'page', url: 'app://obsidian.md/index.html', webSocketDebuggerUrl: `ws://127.0.0.1:${REQUESTED_PORT}/devtools/page/X` }]));
			});
			srv.on('upgrade', (req, sock) => { console.log(`TMPLOG FAKE UPGRADE ${req.url}`); sock.destroy(); });
			await new Promise((r) => srv.listen(REQUESTED_PORT, '127.0.0.1', r));
			console.log('TMPLOG FAKE listening');
		}
"""+b)
c="		liveObsidian = child; // tracked now"
rep(c,"		console.log(`TMPLOG ${process.env.TMP_TAG} spawned obsidian pid=${child.pid} vault=${vault} t=${Date.now()}`); // TEMP SC-551\n"+c)
d="		const version = await t.ev('require(\"electron\").ipcRenderer.sendSync(\"version\")');\n"
rep(d,d+"		console.log(`TMPLOG ${process.env.TMP_TAG} attached port=${PORT} basePath=${await t.ev('app.vault.adapter.basePath')} ownVault=${vault} ${(await t.ev('app.vault.adapter.basePath')) === vault ? 'OWN' : 'FOREIGN'}`); // TEMP SC-551\n")
open(F,'w').write(s)
