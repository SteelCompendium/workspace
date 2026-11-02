// SC-546 r2: what does startOwnedXvfb do when its in-flight child is SIGTERMed (as a caller's signal cleanup does)?
// argv: <bin>. Logs every spawn with a timestamp, kills the first child at 700 ms, then waits 1.5 s and reports.
const { startOwnedXvfb } = await import('/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements/scripts/xvfb-owned.mjs');
const t0 = Date.now();
const kids = [];
const p = startOwnedXvfb({ bin: process.argv[2], candidates: [5375, 5376, 5377], args: ['-screen', '0', '640x480x24', '-nolisten', 'tcp'], onSpawn: (c, n) => { kids.push(c); console.log(`+${Date.now() - t0}ms spawn :${n} pid ${c.pid}`); c.once('exit', (code, sig) => console.log(`+${Date.now() - t0}ms exit pid ${c.pid} code=${code} sig=${sig}`)); } });
setTimeout(() => { console.log(`+${Date.now() - t0}ms SIGTERM pid ${kids[0].pid}`); kids[0].kill('SIGTERM'); }, 700);
setTimeout(() => {
	console.log(`+${Date.now() - t0}ms spawned so far: ${kids.length}; alive: ${kids.filter((k) => k.exitCode === null && k.signalCode === null).map((k) => k.pid)}`);
	for (const k of kids) try { k.kill('SIGKILL'); } catch {}
	process.exit(0);
}, 2200);
p.then((g) => console.log(`+${Date.now() - t0}ms helper resolved ${g?.display ?? null}`));
