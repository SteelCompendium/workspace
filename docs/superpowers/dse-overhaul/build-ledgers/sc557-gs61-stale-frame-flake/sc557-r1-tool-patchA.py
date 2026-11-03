import re,sys
p='/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements/visual-harness/obsidian-lifecycle.mjs'
s=open(p).read()
a=s.index("\t\t\t\tP.recStart = (leaf) => {")
b=s.index("\t\t\t\treturn true;\n\t\t\t})()`);\n\t\t\tconst A = 'window.__gs61.A';")
new = r"""				P.recStart = (leaf) => {
					const R = (P.rec = { frames: 0, pending: 0, stale: 0, run: 0, longest: 0, samples: [], stop: false, k: { cu: 0, dd: 0, x: 0 }, cuFrames: 0, hardFrames: 0, odd: [], runs: { any: { n: 0, t0: 0, max: 0, maxMs: 0 }, cu: { n: 0, t0: 0, max: 0, maxMs: 0 }, hard: { n: 0, t0: 0, max: 0, maxMs: 0 } }, cuSinceMax: 0 });
					const fs = (window.require ?? require)('fs');
					const diskFile = app.vault.adapter.getFullPath(leaf.view.file.path);
					const stepRun = (r, on, ts) => {
						if (on) {
							if (!r.n) r.t0 = ts;
							r.n++;
							r.max = Math.max(r.max, r.n);
							r.maxMs = Math.max(r.maxMs, ts - r.t0);
						} else if (r.n) {
							r.maxMs = Math.max(r.maxMs, ts - r.t0);
							r.n = 0;
						}
					};
					const tick = (ts) => {
						if (R.stop) return;
						R.frames++;
						const cm = leaf.view.editor.cm;
						const dv = [];
						cm.state.doc.toString().replace(/current_value: (\\d+)/g, (_, v) => dv.push(Number(v)));
						const dk = [];
						let since = null;
						try {
							fs.readFileSync(diskFile, 'utf8').replace(/current_value: (\\d+)/g, (_, v) => dk.push(Number(v)));
							since = Math.round(Date.now() - fs.statSync(diskFile).mtimeMs);
						} catch (e) {}
						const live = reg.liveEntries();
						const pend = [];
						const stale = [];
						let hard = false;
						for (const c of P.cardsRaw(leaf)) {
							if (c.block < 0) continue;
							const e = live.find((x) => x.root === c.root);
							if (e && e.view.hasPendingWrite && e.view.hasPendingWrite()) {
								if (c.root.__gs61 !== undefined && P.clickBlock[c.root.__gs61] !== c.block) pend.push(c);
							} else if (c.value !== dv[c.block]) {
								stale.push(c);
								const kind = dv[c.block] !== dk[c.block] ? (c.value === dk[c.block] ? 'cu' : 'x') : 'dd';
								R.k[kind]++;
								c.kind = kind;
								if (kind !== 'cu') {
									hard = true;
									if (R.odd.length < 6) R.odd.push(kind + ' b' + c.block + '=' + c.value + '/doc' + dv[c.block] + '/disk' + dk[c.block] + ' +' + since + 'ms');
								} else if (since !== null) R.cuSinceMax = Math.max(R.cuSinceMax, since);
							}
						}
						if (pend.length) R.pending++;
						if (stale.length) R.longest = Math.max(R.longest, ++R.run);
						else R.run = 0;
						if (stale.length) R.stale++;
						if (stale.length) hard ? R.hardFrames++ : R.cuFrames++;
						stepRun(R.runs.any, stale.length > 0, ts);
						stepRun(R.runs.cu, stale.length > 0 && !hard, ts);
						stepRun(R.runs.hard, hard, ts);
						if ((pend.length || stale.length) && R.samples.length < 4) R.samples.push([...pend.map((c) => 'pending b' + c.block + '=' + c.value + '/clicked' + P.clickBlock[c.root.__gs61]), ...stale.map((c) => 'b' + c.block + '=' + c.value + '/doc' + dv[c.block] + '/disk' + dk[c.block] + ' +' + since + 'ms')].join(' '));
						requestAnimationFrame(tick);
					};
					requestAnimationFrame(tick);
				};
				P.recStop = () => { const R = P.rec; if (!R) return null; R.stop = true; const f = (r) => ({ max: r.max, maxMs: Math.round(r.maxMs) }); return { frames: R.frames, pending: R.pending, stale: R.stale, longest: R.longest, samples: R.samples, k: R.k, cuFrames: R.cuFrames, hardFrames: R.hardFrames, odd: R.odd, any: f(R.runs.any), cu: f(R.runs.cu), hard: f(R.runs.hard), cuSinceMax: R.cuSinceMax }; };
"""
s=s[:a]+new+s[b:]
old="if (rec) outcomes.push(`${label}: wrong-card frames: pending-on-another-block ${rec.pending}, stale ${rec.stale} (longest run ${rec.longest}) of ${rec.frames}`);"
assert s.count(old)==2
s=s.replace(old,"if (rec) outcomes.push(`${label}: wrong-card frames: pending-on-another-block ${rec.pending}, stale ${rec.stale} (longest run ${rec.longest}) of ${rec.frames}${staleStats(rec)}`);")
anchor="\t\t\tconst T3 = 'Lifecycle/twin-callouts-3.md';"
assert s.count(anchor)==1
helper="""\t\t\t// SC-557 measurement: how the stale frames split (cu = the editor document is behind the disk and the card shows the disk value; dd = the document already holds the disk value; x = neither).
\t\t\tconst staleStats = (rec) => ` [stale cards cu ${rec.k.cu} dd ${rec.k.dd} x ${rec.k.x}; frames cu ${rec.cuFrames} hard ${rec.hardFrames}; longest any ${rec.any.max}f/${rec.any.maxMs}ms, cu ${rec.cu.max}f/${rec.cu.maxMs}ms (doc behind disk up to ${rec.cuSinceMax}ms after the write), hard ${rec.hard.max}f/${rec.hard.maxMs}ms${rec.odd.length ? '; odd: ' + rec.odd.join(', ') : ''}]`;
"""
s=s.replace(anchor,helper+anchor)
open(p,'w').write(s)
