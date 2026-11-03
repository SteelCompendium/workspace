p = '/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements/visual-harness/obsidian-lifecycle.mjs'
s = open(p).read()


def sub(a, b):
    global s
    assert s.count(a) == 1, f'anchor matched {s.count(a)}: {a[:90]}'
    s = s.replace(a, b, 1)


sub("""				 * A disk read that lands inside Obsidian's write holds fewer values than the document (torn): that frame is judged against the last whole read, by the same
				 * rules, so it never lowers the count. A read that throws, or a torn read before any whole one, leaves the card judged against nothing: it is counted, and a
				 * failed read fails the phase (the check would otherwise be silently off).
""", """				 * A disk read that lands inside Obsidian's write holds fewer values than the document (torn): it is read again (up to 8 times, 1 ms apart; the write finishes on
				 * another thread). A read that is still torn, or that throws, leaves the card judged against nothing: it is COUNTED (never exempt, so it can not lower the
				 * count), and a read that throws fails the phase (the check would otherwise be silently off). Judging a torn frame against the last whole read instead would count
				 * a card that is merely ahead of the document: measured, 2 such frames in a row under load.
""")
sub("""						let since = null;
						let ref = null;
						try {
							const read = valuesOf(fs.readFileSync(diskFile, 'utf8'));
							since = Math.round(Date.now() - fs.statSync(diskFile).mtimeMs);
							if (read.length === dv.length) ref = R.lastDisk = read;
							else {
								R.torn++;
								if (R.lastDisk && R.lastDisk.length === dv.length) ref = R.lastDisk;
							}
						} catch (e) {
							R.readErr++;
						}
""", """						let since = null;
						let ref = null;
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
""")
sub("torn: 0, readErr: 0, lastDisk: null, odd: [],", "torn: 0, tornLeft: 0, readErr: 0, odd: [],")
sub("k: R.k, torn: R.torn, readErr: R.readErr, odd:", "k: R.k, torn: R.torn, tornLeft: R.tornLeft, readErr: R.readErr, odd:")
sub("disk reads: torn ${rec.torn} (judged against the last whole read), failed ${rec.readErr}", "disk reads: torn ${rec.torn} frame(s) (read again), still torn ${rec.tornLeft}, failed ${rec.readErr}")
open(p, 'w').write(s)
