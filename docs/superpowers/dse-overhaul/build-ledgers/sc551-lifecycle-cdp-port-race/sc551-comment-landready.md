Ready to land: two lifecycle runs started together no longer end up in the same Obsidian. Each run now uses a DevTools port that its own Obsidian reported, and a run that cannot prove that stops with exit 2 instead of failing every scenario. Nothing is needed from you.

**What changed (test harness only; the plugin's `main.js` and `styles.css` are byte-identical to develop):**

- By default lifecycle starts Obsidian with port 0, so the system picks a free port, and reads the number back from that Obsidian's own `DevToolsActivePort` file. Two runs can no longer pick the same port, so nobody needs to set `DSE_LIFECYCLE_PORT` any more.
- Before it sends Obsidian a single command, the run checks two things. The browser id on that port must match the one our Obsidian wrote. The listening socket must belong to our Obsidian's process. If either check fails, the run exits 2 with a message that names the port, and it never touches the other Obsidian.
- `DSE_LIFECYCLE_PORT=<n>` still pins a port, with the same checks.

**Also fixed, because it had the same bug and did more damage:** the obsidian-shots camera, which docs-shots also uses to drive Obsidian. A test run showed it enabling plugins inside another Obsidian, and the same run would have gone on to delete notes there and quit that Obsidian. It now uses the same checks. docs-shots passes the camera's exit 2 through.

**Checked and left alone:** e2e's Obsidian port was already safe, because chromedriver uses port 0 the same way.

**Filed in Backlog, not part of this fix:**
- SC-553: e2e's chromedriver port has the same kind of race, but the window is about 20 ms (roughly one in a million runs).
- SC-554: two camera runs at once share one Obsidian settings folder.
- SC-555: docs-shots' `initiative-tracker-conditions.gif` already fails at step 8, with or without this change.

**Proof:**

| Test | Before | After |
|---|---|---|
| Two lifecycle runs, same port | 11 of 11 pairs: one run attached to the other's Obsidian | one pass and one exit 2, 0 attached |
| Two lifecycle runs, default port | — | both pass on different ports, every time |
| Two cameras, same settings folder | one run per pair drove the other's Obsidian | 9 of 9 pairs: the second exits 2 |
| A fake DevTools server that appears after the start-up check | camera attached to it | exit 2, the fake saw 0 connections |

All reproductions used private ports (47000+, 48000+) and private screens (:5400+), never another session's Obsidian.

A launcher script that does not `exec` Obsidian (for example `flatpak run`) also works: the socket may belong to a process our launcher started.

**Gates** at dse `367a2f1d` on develop `711f740d` (lifecycle and shots measured at `45eef821`; the one commit since only changes a test file):
- tsc and lint clean.
- jest 6325 passed / 2 skipped, 252 of 253 suites (fresh worktree; 19 new tests in `test/unit/build/cdpOwned.test.ts`).
- lifecycle 48/48 in four parts (21 + 16 + 7 + 4).
- e2e 128/128 ok, coverage 89/89 pairs (measured at `38b4f856`; e2e files and imports are unchanged since).
- obsidian-shots wrote all 61 shots.
- `main.js` and `styles.css` are byte-identical to develop, so shots, freeze and parity carry.

Files changed: new `scripts/cdp-owned.mjs` and its test; the start-up blocks of `visual-harness/obsidian-lifecycle.mjs` and `visual-harness/obsidian-camera.mjs`; the camera's exit code in `visual-harness/docs-shots.mjs`. Scenario code is untouched.
