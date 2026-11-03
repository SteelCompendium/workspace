p = '/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements/visual-harness/obsidian-lifecycle.mjs'
s = open(p).read()


def sub(a, b):
    global s
    assert s.count(a) == 1, f'anchor matched {s.count(a)}: {a[:90]}'
    s = s.replace(a, b, 1)


sub("""				 * (readErr), because the check would otherwise be silently off.
""", """				 * (readErr), because the check would otherwise be silently off. Likewise a read that is torn in 3 frames in a row (green: at most 2) fails the phase:
				 * every frame would be judged catching up and the check would be off.
""")
sub("torn: 0, readErr: 0, odd:", "torn: 0, tornRun: 0, tornLongest: 0, readErr: 0, odd:")
sub("""							else {
								torn = true;
								R.torn++;
							}
						} catch (e) {
							R.readErr++;
						}
""", """							else {
								torn = true;
								R.torn++;
							}
						} catch (e) {
							R.readErr++;
						}
						R.tornRun = torn ? R.tornRun + 1 : 0;
						R.tornLongest = Math.max(R.tornLongest, R.tornRun);
""")
sub("k: R.k, torn: R.torn, readErr: R.readErr, odd:", "k: R.k, torn: R.torn, tornLongest: R.tornLongest, readErr: R.readErr, odd:")
sub("disk reads: torn in ${rec.torn} frame(s), failed in ${rec.readErr}", "disk reads: torn in ${rec.torn} frame(s) (longest run ${rec.tornLongest}), failed in ${rec.readErr}")
sub("""				if (rec.pending > 0 || rec.longest >= 3) return `wrong cards on screen - ${seen}`;
""", """				if (rec.pending > 0 || rec.longest >= 3) return `wrong cards on screen - ${seen}`;
				if (rec.tornLongest >= 3) return `the recorder's disk read was torn in ${rec.tornLongest} frames in a row, so its stale-frame check did not run (${seen})`;
""")
open(p, 'w').write(s)
