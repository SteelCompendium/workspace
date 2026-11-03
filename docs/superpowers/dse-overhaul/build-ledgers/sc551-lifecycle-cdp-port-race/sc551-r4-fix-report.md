# SC-551 r4 fix report (rebase + R11/R12/R13 + land-ready battery)

## Executive summary
- Verdict: DONE. Final sha `38b4f856` (full sha in the final message), 3 commits on `origin/develop` = `711f740d` (rebased twice: eafe76e1 -> f7c9c7ce -> 711f740d, both clean, no conflict; no package.json change, no `npm ci`). Tree clean.
- H-1 fixed (R11): `proveCdpOwned` now also requires the LISTEN socket on the reported port to be one of OUR child's (inode in `/proc/net/tcp{,6}` found under `/proc/<child.pid>/fd`), else `CdpOwnershipError('foreign-listener')` -> exit 2; unreadable procfs fails closed (`unverifiable`). GUID check kept.
- H-1 repro, two cameras on one shared `DSE_CAMERA_TMP`: BEFORE (code at 5fc0fec2-equivalent) 6/6 pairs (offsets 0 and 300 ms) one run wrong-instance, both rc 0; AFTER 9/9 pairs (offsets 0 x4, 300 x3, 600 x2) winner rc 0 / loser rc 2 with an env message, 0 wrong-instance. Helper-alone shared-udd probe, 10 tries: 0 wrong-instance (before: 10/10 per the r3 review).
- Measured: the DevTools LISTEN socket is always owned by the spawned pid itself (`child.pid`), 10/10 + 9 camera pairs: no descendant walk needed.
- L-1/L-2/L-3 and R13 text done (below). Gates on `711f740d`+SC-551: tsc 0, lint 0, jest `Tests: 2 skipped, 6321 passed, 6323 total` / `252 of 253`, lifecycle 48/48 (21+16+7+4), e2e `128/128 ok ... 89/89 pairs`, obsidian-shots `all 61 shots written` rc 0, main.js/styles.css byte-identical to a build at 711f740d.

## Changes
- `scripts/cdp-owned.mjs`: `listenInodes(port, readProc)`, `servesBrowser(port, guid, fetchImpl)`, the socket-owner check between the port check and the `/json/version` GUID check (seams `readProc`, `fdLinks`), new reasons `foreign-listener` / `unverifiable`; header rewritten (R13): the endpoint is "ours" only with the socket-owner proof, and the udd-exclusive precondition and the shared-udd failure it closes are stated.
- `visual-harness/obsidian-lifecycle.mjs` (L-3): `servesBrowser(PORT, BROWSER_ID)` once right before `Cdp.connect`, else `envFail`. `visual-harness/obsidian-camera.mjs` (L-1): the `!child.alive` throw is an `EnvFailure` (exit 2); `jsonList()` uses `servesBrowser`. `visual-harness/docs-shots.mjs` (L-2): the camera's exit 2 is remembered and docs-shots exits 2 when it is the only failure (cleanup unchanged).
- `test/unit/build/cdpOwned.test.ts`: 11 -> 15 tests (+4): foreign-pid socket rejected with 0 requests to the stranger; nothing listening / unreadable /proc / unreadable fds; real `/proc` (own pid ours, parent pid foreign); `listenInodes` (LISTEN only, tcp+tcp6, port filter) + `servesBrowser`. Existing tests got a fake procfs in the harness. Mutation: disabling the owner check fails 3 tests.
- Proposal `sc551-r1-dse-verify-proposal.md` §4 rewritten (private `DSE_CAMERA_TMP` required, no "concurrent runs are safe" claim, ports below 32768) and §5 added.

## Proofs
- H-1 (`sc551-r4-evidence/`): probes adapted from `sc551-r3-evidence/scripts/` (`p-two-cameras-r4.mjs`, `p-shared-udd-r4.mjs`; fresh shared `DSE_CAMERA_TMP` per pair under my scratch, private displays :5460-:5463).
  - Before (throwaway worktree at ff6e39d6 = the pre-r4 code, rebased): `H1-before-offset0.log` 3/3 pairs and `H1-before-offset300.log` 3/3 pairs: one run per pair `WRONG-INSTANCE (port N is owned by pid P, ours is Q)`, both cameras rc 0.
  - After: `H1-after-offset0.log` (4 pairs), `H1-after-offset300.log` (3), `H1-after-offset600.log` (2): every pair winner rc 0 + loser rc 2, `OBSIDIAN-CAMERA environment: port N: the listening socket there is not our Obsidian's (our pid P) - another instance owns it` (7 pairs) or `Obsidian exited during start-up` (the 2 pairs at 600 ms); summaries `0 wrong-instance`.
  - Helper alone, real Obsidians, shared udd, offsets 0/0/50/100/150/200/250/300/400/600 ms (`H1-helper-shared-udd-after.log`): 0 wrong; each try exactly one proof passes and its real `ss` listener pid equals the spawned pid; the other fails `foreign-listener` (9) or `exited` (1, at 600 ms). The winner was never rejected for reading the loser's file in these 19 pairs.
- Regression (run on f7c9c7ce-based code, before the last rebase; the rebase added only unrelated lifecycle scenario/src changes): lifecycle default-port pairs 3/3 both rc 0 with distinct ports, all `OWN` (`r4-reg.out`, `R4D-try*`); pinned-port pairs 3/3 one rc 0 + one rc 2 env message (`R4P-try*`); camera decoy 2/2 exit 2, 0 proxy connections (`R4-camera-decoy-1/2.log`).

## Gates (load average at start in parens)
- 711f740d + SC-551: tsc rc=0, lint rc=0 (`r4-gate-tsc.log`, `r4-gate-lint.log`); jest rc=0 `Test Suites: 1 skipped, 252 passed, 252 of 253 total`, `Tests: 2 skipped, 6321 passed, 6323 total` (6306 fresh baseline + 15) (`r4-gate-jest.log`, load 8.81).
- lifecycle, four `--only` parts, each own port (logs `gate-lc{1..4}-r4b.log`): part 1 :47511 rc=0 186 s `done: 21/21 ok, 0 failed` (11.25); part 2 :47512 rc=0 326 s `16/16` (2.23); part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52` :47513 rc=0 252 s `7/7` (1.64); part 4 `G-S57 G-S62 G-S61 G-S56` :47514 rc=0 295 s `4/4` (2.32). Union 48/48.
- Earlier battery on f7c9c7ce (pre second rebase): jest `6311 passed / 2 skipped`, `252 of 253`; lifecycle 21/21 :47501, 16/16 :47502, 10/10 :47503 (part 3 with G-S62, 453 s) = 47/47 (`gate-lc{1,2,3}-r4.log`, `f7c9c7ce-r4-gate-*.log`).
- e2e (`gate-e2e.log`... file `gate-e2e.log` in this dir, load 2.77): rc=0 `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
- obsidian-shots (private `DSE_CAMERA_DISPLAY=:5433`, private `DSE_CAMERA_TMP`, no port env, load 4.35): rc=0 75 s `all 61 shots written`, `cdp: port 36145 (reported by our obsidian pid=2317920, browser id verified)`, `attached ... vault "demo-vault"` (`R4C1.log`).
- Byte identity: build at `711f740d` in a throwaway worktree (removed): `main.js` sha256 `1bb51153578959d07403388265a986e35775c147d8e9a1eff65103eb6fd1882e`, `styles.css` `93be34afd907377071ec75801119dfe38e894c3c6ae774687712a526eaf1174b`; the branch build gives the same two hashes.

## Drive-by fixes:
- None.

## Follow-ups:
- SC-554 (udd lock), SC-553 (e2e chromedriver port), SC-555 (docs-shots gif) cited only, not touched.
- With a shared udd the winner could in principle read the LOSER's file (last write wins) and then fail `foreign-listener` itself; not seen in 19 pairs (winner always passed). If it ever shows, derive the port from our own pid's listening socket instead of the file.
- An older `DevToolsActivePort` check order note: the socket check runs before any HTTP request, so a foreign process on the reported port is never contacted.

## Files
Evidence `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r4-evidence/` (probes `p-two-cameras-r4.mjs`, `p-shared-udd-r4.mjs`; drivers `r4-before.sh` `r4-after.sh` `r4-udd.sh` `r4-reg.sh` `pair-r4.sh` `gate-lc-r4.sh` `gate-camera-r4.sh` `r4-hash.sh`; logs `H1-*`, `R4*`, `gate-*`, `r4-gate-*`). Proposal `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r1-dse-verify-proposal.md`.
