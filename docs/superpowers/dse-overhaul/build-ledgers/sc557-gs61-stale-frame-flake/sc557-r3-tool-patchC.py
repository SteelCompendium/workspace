p = '/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements/visual-harness/obsidian-lifecycle.mjs'
s = open(p).read()


def sub(a, b):
    global s
    assert s.count(a) == 1, f'anchor matched {s.count(a)}: {a[:90]}'
    s = s.replace(a, b, 1)


# LOW-3: the cap comment, each measurement set with its own loadavg and maximum
sub("""			// green build, 10 runs at a loadavg of 14-26 on 12 cores and 6 on a quiet machine: at most 6 frames / 117 ms (the document up to 117 ms behind the disk); 1000 ms is
			// about eight times that, and still far below what an editor that never catches up would show.
""", """			// green build (12 cores, 12-16 busy loops): 10 runs before the rebase onto SC-552 at a loadavg of 7-26: at most 6 frames / 117 ms (the document up to 117 ms behind
			// the disk); 10 runs after it at 0.8-13.9: at most 4 frames / 83 ms (71 ms behind); 6 more at 0.5-18.2: 4 frames / 67 ms; quiet machine: 1 frame / 17 ms. 1000 ms
			// is about eight times the worst of them, and still far below what an editor that never catches up would show.
""")

# stats line and problem text
sub("""stale cards: catching up ${rec.k.cu + rec.k.u}, document had the disk value ${rec.k.dd}, neither ${rec.k.x}${rec.odd.length ? '; ' + rec.odd.join(', ') : ''}]`;""",
    """stale cards: catching up ${rec.k.cu}, document had the disk value ${rec.k.dd}, neither ${rec.k.x}; disk reads: torn ${rec.torn} (judged against the last whole read), failed ${rec.readErr}${rec.odd.length ? '; counted: ' + rec.odd.join(', ') : ''}]`;""")
sub("""				const seen = `${rec.pending} frame(s) of ${rec.frames} with a pending edit on a block the card was not clicked on, ${rec.counted} frame(s) (${rec.longest} in a row) with a card that did not match its block and was not catching up (${rec.samples.join(' | ')})`;
				if (rec.pending > 0 || rec.longest >= 3) return `wrong cards on screen - ${seen}`;
""", """				// The counted frames come first in the message: the first samples of the run are usually catching-up frames.
				const seen = `${rec.pending} frame(s) of ${rec.frames} with a pending edit on a block the card was not clicked on, ${rec.counted} frame(s) (${rec.longest} in a row) with a card that did not match its block and was not catching up (${[...rec.odd, ...rec.samples].join(' | ')})`;
				// A recorder that cannot read the note cannot tell a card that is ahead from a card that is wrong: it fails the phase rather than judge without the disk.
				if (rec.readErr > 0) return `the recorder could not read the note from disk in ${rec.readErr} frame(s), so its stale-frame check did not run (${seen})`;
				if (rec.pending > 0 || rec.longest >= 3) return `wrong cards on screen - ${seen}`;
""")

# recorder comment
sub("""				 *    editor that never catches up still fails. A read that landed inside Obsidian's write (the file holds fewer values than the document) is also judged
				 *    catching up, for the same bound.
""", """				 *    editor that never catches up still fails.
""")
sub("""				 *    frames fails; a catching-up frame inside the run neither adds to it nor ends it, only a frame with no wrong card does.
				 */""", """				 *    frames fails; a catching-up frame inside the run neither adds to it nor ends it, only a frame with no wrong card does.
				 * A disk read that lands inside Obsidian's write holds fewer values than the document (torn): that frame is judged against the last whole read, by the same
				 * rules, so it never lowers the count. A read that throws, or a torn read before any whole one, leaves the card judged against nothing: it is counted, and a
				 * failed read fails the phase (the check would otherwise be silently off).
				 */""")

# recorder state and read
sub("k: { cu: 0, u: 0, dd: 0, x: 0 }, odd: [], cuRun:", "k: { cu: 0, dd: 0, x: 0 }, torn: 0, readErr: 0, lastDisk: null, odd: [], cuRun:")
sub("""						let dk = [];
						let since = null;
						try {
							dk = valuesOf(fs.readFileSync(diskFile, 'utf8'));
							since = Math.round(Date.now() - fs.statSync(diskFile).mtimeMs);
						} catch (e) {}
						const diskWhole = dk.length === dv.length;
""", """						let since = null;
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
""")
sub("""								const kind = !diskWhole ? 'u' : dv[c.block] !== dk[c.block] ? (c.value === dk[c.block] ? 'cu' : 'x') : 'dd';
								R.k[kind]++;
								if (kind === 'cu' || kind === 'u') {""", """								const kind = ref === null ? 'x' : dv[c.block] !== ref[c.block] ? (c.value === ref[c.block] ? 'cu' : 'x') : 'dd';
								R.k[kind]++;
								if (kind === 'cu') {""")
sub("""'/doc' + dv[c.block] + '/disk' + dk[c.block] + ' +' + since + 'ms');
								}""", """'/doc' + dv[c.block] + '/disk' + (ref ? ref[c.block] : 'unread') + ' +' + since + 'ms');
								}""")
sub("""'/doc' + dv[c.block] + '/disk' + dk[c.block] + ' +' + since + 'ms')].join(' '));""", """'/doc' + dv[c.block] + '/disk' + (ref ? ref[c.block] : 'unread') + ' +' + since + 'ms')].join(' '));""")
sub("k: R.k, odd: R.odd, catchUp:", "k: R.k, torn: R.torn, readErr: R.readErr, odd: R.odd, catchUp:")
open(p, 'w').write(s)
