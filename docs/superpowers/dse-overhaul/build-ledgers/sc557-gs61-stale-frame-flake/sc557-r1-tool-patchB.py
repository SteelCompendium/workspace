p = '/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements/visual-harness/obsidian-lifecycle.mjs'
s = open(p).read()

# 1. page side: comment + recorder
a = s.index("\t\t\t\t/**\n\t\t\t\t * Every frame, two kinds of wrong card.")
b = s.index("\t\t\t\treturn true;\n\t\t\t})()`);\n\t\t\tconst A = 'window.__gs61.A';")
new = r"""				/**
				 * Every frame, two kinds of wrong card. (1) A card whose edit is pending but which sits on a block other than the one it was clicked on: never legitimate here
				 * (the bug showed it for 7-9 frames). (2) A card with nothing pending that shows another value than its block's in the editor's document (`cm.state.doc`).
				 * Kind (2) is judged against the note on DISK, read synchronously every frame (a build with the bug leaves the disk right and the card wrong, or the other way round):
				 *  - CATCHING UP: the document has not taken the block's disk value yet and the card shows that disk value (SC-557: under load the card, redrawn from the
				 *    write, is 1-4 frames ahead of the editor's document; the document took the disk value up to 46 ms after the write in the measured runs). It is not counted
				 *    as a stale frame in the run below; a run of catching-up frames is bounded in wall time instead (CATCH_UP_CAP_MS, from the page's rAF timestamps), so an
				 *    editor that never catches up still fails. A read that landed inside Obsidian's write (the file holds fewer values than the document) is also judged
				 *    catching up, for the same bound.
				 *  - STALE (counted): the document already holds the disk value and the card differs, or the card matches neither the document nor the disk. A run of 3 such
				 *    frames fails; a catching-up frame inside the run neither adds to it nor ends it, only a frame with no wrong card does.
				 */
				P.recStart = (leaf) => {
					const R = (P.rec = { frames: 0, pending: 0, stale: 0, hard: 0, run: 0, longest: 0, samples: [], stop: false, k: { cu: 0, u: 0, dd: 0, x: 0 }, odd: [], cuRun: { n: 0, t0: 0, max: 0, maxMs: 0 }, cuSinceMax: 0 });
					const fs = (window.require ?? require)('fs');
					const diskFile = app.vault.adapter.getFullPath(leaf.view.file.path);
					const valuesOf = (text) => { const out = []; text.replace(/current_value: (\\d+)/g, (_, v) => out.push(Number(v))); return out; };
					const tick = (ts) => {
						if (R.stop) return;
						R.frames++;
						const cm = leaf.view.editor.cm;
						const dv = valuesOf(cm.state.doc.toString());
						let dk = [];
						let since = null;
						try {
							dk = valuesOf(fs.readFileSync(diskFile, 'utf8'));
							since = Math.round(Date.now() - fs.statSync(diskFile).mtimeMs);
						} catch (e) {}
						const diskWhole = dk.length === dv.length;
						const live = reg.liveEntries();
						const pend = [];
						const stale = [];
						let counted = false;
						for (const c of P.cardsRaw(leaf)) {
							if (c.block < 0) continue;
							const e = live.find((x) => x.root === c.root);
							if (e && e.view.hasPendingWrite && e.view.hasPendingWrite()) {
								if (c.root.__gs61 !== undefined && P.clickBlock[c.root.__gs61] !== c.block) pend.push(c);
							} else if (c.value !== dv[c.block]) {
								stale.push(c);
								const kind = !diskWhole ? 'u' : dv[c.block] !== dk[c.block] ? (c.value === dk[c.block] ? 'cu' : 'x') : 'dd';
								R.k[kind]++;
								if (kind === 'cu' || kind === 'u') {
									if (since !== null) R.cuSinceMax = Math.max(R.cuSinceMax, since);
								} else {
									counted = true;
									if (R.odd.length < 6) R.odd.push(kind + ' b' + c.block + '=' + c.value + '/doc' + dv[c.block] + '/disk' + dk[c.block] + ' +' + since + 'ms');
								}
							}
						}
						if (pend.length) R.pending++;
						if (!stale.length) R.run = 0;
						else if (counted) R.longest = Math.max(R.longest, ++R.run);
						if (stale.length) R.stale++;
						if (counted) R.hard++;
						const catching = stale.length > 0 && !counted;
						if (catching) {
							if (!R.cuRun.n) R.cuRun.t0 = ts;
							R.cuRun.n++;
							R.cuRun.max = Math.max(R.cuRun.max, R.cuRun.n);
							R.cuRun.maxMs = Math.max(R.cuRun.maxMs, ts - R.cuRun.t0);
						} else if (R.cuRun.n) {
							R.cuRun.maxMs = Math.max(R.cuRun.maxMs, ts - R.cuRun.t0);
							R.cuRun.n = 0;
						}
						if ((pend.length || stale.length) && R.samples.length < 4) R.samples.push([...pend.map((c) => 'pending b' + c.block + '=' + c.value + '/clicked' + P.clickBlock[c.root.__gs61]), ...stale.map((c) => 'b' + c.block + '=' + c.value + '/doc' + dv[c.block] + '/disk' + dk[c.block] + ' +' + since + 'ms')].join(' '));
						requestAnimationFrame(tick);
					};
					requestAnimationFrame(tick);
				};
				P.recStop = () => { const R = P.rec; if (!R) return null; R.stop = true; return { frames: R.frames, pending: R.pending, stale: R.stale, counted: R.hard, longest: R.longest, samples: R.samples, k: R.k, odd: R.odd, catchUp: { frames: R.cuRun.max, ms: Math.round(R.cuRun.maxMs) }, cuSinceMax: R.cuSinceMax }; };
"""
s = s[:a] + new + s[b:]

# 2. harness side helpers (replace the measurement helper)
a = s.index("\t\t\t// SC-557 measurement:")
b = s.index("\t\t\tconst T3 = 'Lifecycle/twin-callouts-3.md';")
helper = """\t\t\t// SC-557: the longest wall time a card may be AHEAD of the editor's document (the card shows the disk value, the document has not taken it yet). Measured on the
\t\t\t// green build under a loadavg of 14-27 on 12 cores: at most 3 frames / 50 ms (the document 46 ms behind the disk); 500 ms is ten times that.
\t\t\tconst CATCH_UP_CAP_MS = 500;
\t\t\tconst staleStats = (rec) => ` [catching up: longest ${rec.catchUp.frames} frame(s) / ${rec.catchUp.ms} ms, document behind the disk up to ${rec.cuSinceMax} ms after the write; stale cards: catching up ${rec.k.cu + rec.k.u}, document had the disk value ${rec.k.dd}, neither ${rec.k.x}${rec.odd.length ? '; ' + rec.odd.join(', ') : ''}]`;
\t\t\t/** The problem the recorder found, or null. */
\t\t\tconst wrongCards = (rec) => {
\t\t\t\tconst seen = `${rec.pending} frame(s) of ${rec.frames} with a pending edit on a block the card was not clicked on, ${rec.counted} frame(s) (${rec.longest} in a row) with a card that did not match its block and was not catching up (${rec.samples.join(' | ')})`;
\t\t\t\tif (rec.pending > 0 || rec.longest >= 3) return `wrong cards on screen - ${seen}`;
\t\t\t\tif (rec.catchUp.ms > CATCH_UP_CAP_MS) return `the editor document did not catch up with the write within ${CATCH_UP_CAP_MS} ms: a card showed the note's new value for ${rec.catchUp.frames} frame(s) / ${rec.catchUp.ms} ms while the document still held the old one (${rec.samples.join(' | ')})`;
\t\t\t\treturn null;
\t\t\t};
"""
s = s[:a] + helper + s[b:]

# 3. the two outcome / problem sites
old_o = "if (rec) outcomes.push(`${label}: wrong-card frames: pending-on-another-block ${rec.pending}, stale ${rec.stale} (longest run ${rec.longest}) of ${rec.frames}${staleStats(rec)}`);"
new_o = "if (rec) outcomes.push(`${label}: wrong-card frames: pending-on-another-block ${rec.pending}, stale ${rec.stale} (counted ${rec.counted}, longest counted run ${rec.longest}) of ${rec.frames}${staleStats(rec)}`);"
assert s.count(old_o) == 2
s = s.replace(old_o, new_o)
old_p1 = "if (rec && (rec.pending > 0 || rec.longest >= 3)) problems.push(`${label}: wrong cards on screen - ${rec.pending} frame(s) of ${rec.frames} with a pending edit on a block the card was not clicked on, ${rec.stale} frame(s) (${rec.longest} in a row) with a card that did not match its block (${rec.samples.join(' | ')})`);"
assert s.count(old_p1) == 2
s = s.replace(old_p1, "if (rec && wrongCards(rec)) problems.push(`${label}: ${wrongCards(rec)}`);")
open(p, 'w').write(s)
