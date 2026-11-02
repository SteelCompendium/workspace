# SC-539 r2 implementation report

**Executive summary**
- STATUS: DONE. Plugin head `ec576f5b` (one commit on dse `develop` `fb24f8a2`, which was still `origin/develop`; no rebase). Not pushed; superproject pointer untouched.
- Built the course-corrected design (message from a7b3f0bb7a28da640, matching the ledger): no xdotool, no devbox change, a raw X11 client `e2e/x11-pointer.mjs` called from the headless branch of `e2e/run.mjs`; warn-and-continue on any failure.
- Regression proof (150 ms foreign-window churn, CHR-F02/F03/L01 + INIT-DEF-E04): head 12/12 pass in 3 runs, 0 foreign leaves; base behaviour 0/8 in 2 runs (all fail, same messages as r1).
- Battery: tsc clean, lint clean, jest 6227 passed / 2 skipped / 249 of 250 suites (fresh worktree, no shots cache), lifecycle 44/44 (22 + 22), e2e 124/124 x3 with the parked line, coverage 87/87.
- `main.js` and `styles.css` byte-identical base vs head (sha256 below), so shots/freeze/parity were not needed.
- Important measured finding: the plan "park once after Xvfb starts" does NOT work on its own (see below); the module keeps a 1x1 window open.

## Commits (plugin `draw-steel-elements`, branch `sc539-e2e-chrf02-flake`)

- `ec576f5b` test(e2e): park the private Xvfb pointer outside every Obsidian window (SC-539). Files: `e2e/x11-pointer.mjs` (new, 149 lines), `e2e/run.mjs` (+14), `e2e/README.md` (+8).
- An earlier xdotool commit pair (devbox.json/devbox.lock) was made and then removed by `git reset --hard fb24f8a2` before this commit, per the course change. `devbox.json` and `devbox.lock` are unchanged versus base. (The local `.devbox/` profile still has xdotool installed from that attempt: gitignored, harmless.)

## What was built

- `e2e/x11-pointer.mjs`: `parkPointer(display, {timeoutMs = 2000})`. Node `net` on `/tmp/.X11-unix/X<n>` (derived from the private display name only). Setup (little-endian, no auth) gives the root window id; then in one write: CreateWindow (1x1 InputOnly at 0,0, "keeper"), MapWindow, core WarpPointer (opcode 41) to root 0,0, QueryPointer (opcode 38). The reply must read 0,0 or it rejects. Every failure is a rejected Error with a reason (bad display name, ENOENT, setup refused, X error code, wrong readback, timeout/close); a 2 s timer bounds everything. The socket is `unref()`ed so it never holds the runner open. Returns `{ release() }`.
- `e2e/run.mjs`, headless branch only, after `startXvfb()` and before wdio: `await parkPointer(display)`; success logs `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)`; failure logs `OBSIDIAN-E2E WARN pointer NOT parked: <reason> — hover tests may flake (SC-539)` and continues (never exit 2). The same WARN line is repeated right after the `done:` line. `--headed` is untouched (the call is in the Xvfb `else` branch only). The header comment of run.mjs gained two lines; the WHY comment (shared display, no WM, window at +288+200 1440x1100 containing the centre where Xvfb starts the pointer, `driver/session.ts` `setWindowSize`, SC-539/529/534) is at the top of `x11-pointer.mjs`.
- `e2e/README.md` "Headless vs headed": one paragraph (shared display, park at 0,0, OK line, WARN line).

## Finding that shaped the design: the warp needs a mapped window

Measured on a throwaway Xvfb (devbox Xvfb 21.1.24, same flags as the runner), with xdotool 3.2016 and 4.2026 and with the raw client:
- On a bare Xvfb (no window mapped) WarpPointer is a no-op: the pointer stays at 800,600. The first version of this change (xdotool called from run.mjs before wdio) therefore failed its own readback: `x:800 y:600`.
- With a window mapped the warp sticks; when the LAST mapped window goes away the pointer snaps back to 800,600 (observed with xlogo as the window). Obsidian windows come and go between spec files, so a one-shot park would be lost.
- Hence the 1x1 InputOnly keeper window at 0,0, held by the runner's connection for the whole run. Probe `sc539-r2-keeper-probe.mjs`: before 800,600; after park external `xdotool getmouselocation` reads 0,0; still 0,0 with another window mapped and after it is gone; after `release()` back to 800,600. A 1x1 window at 0,0 cannot cover an Obsidian window (+288+200).
- Whether r1's temporary validation worked was therefore down to parking inside the session `before` hook, when a window existed. In the real full runs the keeper makes this irrelevant.

## Regression proof (the churn harness: r1's temporary foreign-window flipper, xlogo 1600x1200 flipped every 150 ms on the private display; `--only=CHR-F02,CHR-F03,CHR-L01,INIT-DEF-E04 --shards=1`; instrumentation applied from r1's diff and reverted)

| Variant | Runs | Result | Foreign leaves |
|---|---|---|---|
| HEAD (park in) | 3 | 4/4, 4/4, 4/4 pass = 12/12 | 0 in every test |
| BASE behaviour (park call replaced by a throw so the WARN path ran; reverted) | 2 | 0/4, 0/4 = 0/8 pass | 28-29 (CHR-F03), 53-54 (CHR-L01) |

Base failure messages match r1: `chrome.collapse still not displayed after 8000ms` (CHR-F02, CHR-F03), `init.reset-encounter` not displayed / click intercepted (INIT-DEF-E04), `timed out waiting for the chrome panel to stay revealed with the pointer on Collapse` and `… to be revealed by the hover` (CHR-L01).

Warn path proven twice: (1) the base runs above printed `OBSIDIAN-E2E WARN pointer NOT parked: SC539 TEMP base behaviour — hover tests may flake (SC-539)` at the start and again in the summary, and the run carried on to a normal tally; (2) the module against a non-existent display (`:237`) rejects `/tmp/.X11-unix/X237: ENOENT (connect)`; against a bad name rejects `unrecognised display name "bogus"`.

After the proof, `git status` was clean apart from the commit; instrumentation and the temporary throw are gone (`command grep -c "SC539 TEMP"` on run.mjs = 0).

## Battery (plugin head `ec576f5b`)

- `npm run tsc` (incl. `tsc -p e2e`): clean, rc 0.
- `npm run lint` (incl. `e2e/`): clean, rc 0 (only the known `.eslintignore` deprecation warning).
- jest: `Tests: 2 skipped, 6227 passed, 6229 total`, `Test Suites: 1 skipped, 249 passed, 249 of 250 total` (fresh worktree without the shots cache: one fewer passed / 2 skipped than CURRENT, as the brief anticipates). `main.js`/`styles.css` were removed before the run.
- lifecycle (`DSE_LIFECYCLE_PORT=9287`): first half `OBSIDIAN-LIFECYCLE done: 22/22 ok, 0 failed`; second half (through G-S56) `22/22 ok, 0 failed`; union 44/44. Load 5-6.
- e2e full, three separate calls, each rc 0: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (x3), each preceded by `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)`, 16 spec files, 4 shards.
- Byte identity (`npm run build-no-check`, base `fb24f8a2` vs head `ec576f5b`):
  - `dcbe5f58b37bbd76c39524bd702cce60d943a4cc5fdf896058b449b857977515  main.js` (both)
  - `ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0  styles.css` (both)
  - `git diff --stat fb24f8a2 HEAD`: only the three files above. Shots/freeze/parity not run.

## CI check

`draw-steel-elements/.github/workflows/` contains `ci.yml` and `plugin-ci.yml`; a case-insensitive search for `e2e`, `xvfb`, `devbox` finds nothing in either, so CI neither runs e2e nor needs any dependency from this change. No CHANGELOG entry (not user-facing).

## Proposal file

`sc539-dse-verify-proposal.md` (e2e bullet with the OK and WARN lines and the keeper note, the `command grep -a` agent note, CURRENT numbers: unchanged).

## Drive-by fixes:
none.

## Follow-ups:
- `chrome-live-preview.e2e.ts:43-48` re-hover loop and its "Live Preview may still be laying out" comment: probably this same cause (r1); left alone (SC-520/529/534 territory); SC-529/534 owners can simplify after this lands.
- Optional diagnostic belt from r1 (page-side counter of trusted `mouseleave` with null `relatedTarget` in the failure bundle): not needed now; would turn a future regression of this cause into a named failure.
- The xdotool-free park depends on Xvfb behaviour measured on this host (warp needs a mapped window). A different Xvfb build that behaves differently would show as the WARN line (the readback check), not silently.
- Lifecycle and obsidian-shots gates run one window per display and were not touched (r1 ruling: drop).

## Artifacts (all absolute, in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/`)

- `sc539-r2-impl-report.md` (this), `sc539-dse-verify-proposal.md`
- Gate logs: `sc539-r2-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-a.log`, `-lifecycle-b.log`, `-e2e-1.log`, `-e2e-2.log`, `-e2e-3.log`
- Proof logs: `sc539-r2-proof-head-churn150-run{1,2,3}.log`, `sc539-r2-proof-base-churn150-run{1,2}.log`, `sc539-r2-proof-churn-instrumentation.diff.txt` (r1's harness, applied temporarily)
- `sc539-r2-sha256.txt` (head then base), `sc539-r2-keeper-probe.mjs` (the keeper experiment)
