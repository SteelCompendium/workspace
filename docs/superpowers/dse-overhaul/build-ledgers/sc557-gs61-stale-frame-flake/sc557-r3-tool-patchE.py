p = '/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements/visual-harness/obsidian-lifecycle.mjs'
s = open(p).read()


def sub(a, b):
    global s
    assert s.count(a) == 1, f'anchor matched {s.count(a)}: {a[:90]}'
    s = s.replace(a, b, 1)


sub("""				 * A disk read that lands inside Obsidian's write holds fewer values than the document (torn): it is read again (up to 8 times, 1 ms apart; the write finishes on
				 * another thread). A read that is still torn, or that throws, leaves the card judged against nothing: it is COUNTED (never exempt, so it can not lower the
				 * count), and a read that throws fails the phase (the check would otherwise be silently off). Judging a torn frame against the last whole read instead would count
				 * a card that is merely ahead of the document: measured, 2 such frames in a row under load.
""", """				 * A disk read can land inside Obsidian's write: the file is opened (emptied) and written only when the main thread gets to it, so under load it can hold fewer
				 * values than the document for a frame or two, and reading it again in the same frame does not help (the write needs this thread). Such a TORN frame can not be
				 * judged against the disk: it adds to a counted run that is already going (so a torn frame can not lower the count of a wrong card) and is otherwise judged
				 * catching up (bounded by the cap like any other). Judging it against the last whole read instead counted a card that is merely ahead of the document (measured:
				 * 2 such frames in a row under load). A read that THROWS leaves every stale card judged against nothing: they are counted, and the phase fails
				 * (readErr), because the check would otherwise be silently off.
""")
sub("""						let ref = null;
						let failed = false;
						for (let tries = 0; tries < 9 && ref === null; tries++) {
							if (tries) for (const t1 = performance.now(); performance.now() - t1 < 1; ) { /* wait 1 ms */ }
							try {
								const read = valuesOf(fs.readFileSync(diskFile, 'utf8'));
								since = Math.round(Date.now() - fs.statSync(diskFile).mtimeMs);
								if (read.length === dv.length) ref = read;
								else if (!tries) R.torn++;
							} catch (e) {
								R.readErr++;
								failed = true;
								break;
							}
						}
						if (ref === null && !failed) R.tornLeft++;
""", """						let ref = null;
						let torn = false;
						try {
							const read = valuesOf(fs.readFileSync(diskFile, 'utf8'));
							since = Math.round(Date.now() - fs.statSync(diskFile).mtimeMs);
							if (read.length === dv.length) ref = read;
							else {
								torn = true;
								R.torn++;
							}
						} catch (e) {
							R.readErr++;
						}
""")
sub("""								const kind = ref === null ? 'x' : dv[c.block] !== ref[c.block] ? (c.value === ref[c.block] ? 'cu' : 'x') : 'dd';
								R.k[kind]++;
								if (kind === 'cu') {""", """								const kind = torn ? (R.run > 0 ? 'x' : 'u') : ref === null ? 'x' : dv[c.block] !== ref[c.block] ? (c.value === ref[c.block] ? 'cu' : 'x') : 'dd';
								R.k[kind]++;
								if (kind === 'cu' || kind === 'u') {""")
sub("k: { cu: 0, dd: 0, x: 0 }, torn: 0, tornLeft: 0, readErr: 0, odd:", "k: { cu: 0, u: 0, dd: 0, x: 0 }, torn: 0, readErr: 0, odd:")
sub("k: R.k, torn: R.torn, tornLeft: R.tornLeft, readErr: R.readErr, odd:", "k: R.k, torn: R.torn, readErr: R.readErr, odd:")
sub("stale cards: catching up ${rec.k.cu}, document had the disk value ${rec.k.dd}, neither ${rec.k.x}; disk reads: torn ${rec.torn} frame(s) (read again), still torn ${rec.tornLeft}, failed ${rec.readErr}",
    "stale cards: catching up ${rec.k.cu}, on a torn disk read ${rec.k.u}, document had the disk value ${rec.k.dd}, neither ${rec.k.x}; disk reads: torn in ${rec.torn} frame(s), failed in ${rec.readErr}")
open(p, 'w').write(s)
