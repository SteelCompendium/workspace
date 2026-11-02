# SC-539 r4 fix report

**Executive summary**
- STATUS: DONE. Plugin head `88cb7db9` = `c34f6904` (the r2 change, rebased) + the r4 fix commit, on `origin/develop` `ad018cda` (as required). Not pushed.
- Folded M1 (comment now says Xvfb resets on LAST-CLIENT disconnect and the held connection keeps the pointer parked), `-noreset` on the Xvfb args (connection kept as the primary mechanism), INFO 1 (refusal reason read per status), INFO 2 (explicit "setup reply too short").
- Gates at ad018cda baselines: tsc + lint clean; jest 6244 passed / 2 skipped / 249 of 250 (fresh-worktree shape); lifecycle 45/45 (21 + 16 + 8); e2e full x2 124/124, 87/87, each with the parked line; churn-150 proof at the new head 4/4, 0 foreign leaves.
- `main.js` / `styles.css` byte-identical to a build of `ad018cda` (sha256 below), so shots/freeze/parity carry.
- No package.json change from `fb24f8a2` to `ad018cda` (no `npm ci` needed). Proposal file updated (M1 wording, INFO 6 clause, `-noreset`, CURRENT line at ad018cd with the new head).

## Commits
- `c34f6904` test(e2e): park the private Xvfb pointer outside every Obsidian window (SC-539) (was `ec576f5b`, rebased unchanged).
- `88cb7db9` test(e2e): correct the pointer-park comment (reset on last-client disconnect), add -noreset, harden X11 setup errors (SC-539). Files: `e2e/x11-pointer.mjs`, `e2e/run.mjs` (the `-noreset` arg plus a one-line comment). Diff vs `ad018cda` is only `e2e/README.md`, `e2e/run.mjs`, `e2e/x11-pointer.mjs`.

## What changed in `88cb7db9`
- M1: the "THE KEEPER" paragraph is now "THE HELD CONNECTION": Xvfb resets and recentres the pointer when its last client disconnects; a one-shot warp is lost at once and again between spec files; the returned handle holds the connection for the whole run; the 1x1 InputOnly window is only a harmless marker; with the client attached the private Xvfb no longer resets between spec files; `-noreset` is the backstop. The header line describing the window as the "keeper" is still present as the description of what is created.
- `-noreset` added to the Xvfb args in `startXvfb()` (`run.mjs`), with a one-line comment. The e2e runs below show no effect (124/124).
- INFO 1: a Failed (0) refusal reads the reason with the length in byte 1; an Authenticate (2) refusal reads the additional data and trims the NUL padding.
- INFO 2: `if (total < 40) throw new Error('setup reply too short')` before the fixed-header reads, and the existing screen-length check keeps its own message path (also "setup reply too short").
- Checked against a fake X server on a throwaway socket (probe `sc539-r4-setup-error-probe.mjs`): authenticate -> `X server refused the connection (authenticate: need cookie)`; failed -> `(failed: no go)`; short success reply -> `setup reply too short`. The socket file was removed afterwards. Each of these rejections is the WARN path in `run.mjs`.

## Gates (plugin head `88cb7db9`)
- `npm run tsc` (+ `tsc -p e2e`): clean, rc 0. `npm run lint` (+ `e2e/`): clean, rc 0.
- jest (`main.js`/`styles.css` removed first): `Tests: 2 skipped, 6244 passed, 6246 total`, `Test Suites: 1 skipped, 249 passed, 249 of 250 total`. Fresh-worktree shape (6245 / 1 once the shots cache exists).
- lifecycle (`DSE_LIFECYCLE_PORT=9287`): `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed` (G-S7a..G-S9a); `16/16 ok, 0 failed` (G-S9b..G-S40); `8/8 ok, 0 failed` (G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S56). Union 45/45. Slip to disclose: I put parts 2 and 3 in one Bash call, which hit the 598 s tool timeout and was moved to the background by the harness; both parts completed on their own (rc 0, logs complete). No result was affected.
- e2e full, two separate calls, rc 0: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (x2), each preceded by `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)`.
- Churn-150 proof at the new head (r1 flipper applied temporarily from `sc539-r2-proof-churn-instrumentation.diff.txt`, reverted; `git status` clean): CHR-F02, CHR-F03, CHR-L01, INIT-DEF-E04 = 4/4 pass, leave=0 in every test.
- Byte identity (`npm run build-no-check`), `ad018cda` vs `88cb7db9`:
  - `a37fbb6f298698f797db60e7c1b7fcb63df3509d21a1717fee9ffdcfbe133c24  main.js` (both)
  - `ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0  styles.css` (both)

## Drive-by fixes:
none.

## Follow-ups:
none new (SC-546 startXvfb race and the CHR-L01 re-hover loop remain out of scope).

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/`)
- `sc539-r4-fix-report.md`, `sc539-dse-verify-proposal.md` (updated)
- `sc539-r4-gate-tsc.log`, `sc539-r4-gate-lint.log`, `sc539-r4-gate-jest.log`, `sc539-r4-gate-lifecycle-a.log`, `sc539-r4-gate-lifecycle-b.log`, `sc539-r4-gate-lifecycle-c.log`, `sc539-r4-gate-e2e-1.log`, `sc539-r4-gate-e2e-2.log`, `sc539-r4-gate-churn150-head.log`
- `sc539-r4-sha256.txt` (head then base), `sc539-r4-setup-error-probe.mjs`
