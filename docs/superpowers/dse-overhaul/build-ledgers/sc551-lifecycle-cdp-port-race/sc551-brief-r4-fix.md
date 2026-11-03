# SC-551 r4 — fix round on the r3 review, rebase onto develop f7c9c7ce, land-ready battery

You are the SC-551 implementer (you wrote r1 and r2). Your final text goes to the ticket-owner: raw facts, shas,
gate lines, absolute paths. Everything in `sc551-brief-r1-impl.md` §1 (context, worktree rules, never call Linear)
and §5 (footguns) still applies — re-read both. **Added footgun (dispatcher relay, 2026-11-02):** never use a glob or
wildcard `rm` under `/tmp` or anywhere else; delete only your own run's dirs by literal absolute path. If a lifecycle
or camera run fails with a missing vault / user-data-dir / kept-FAIL dir, treat it as environmental and re-run it
once, and report both runs.

## Context

- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/decisions.md`:
  read rulings **R11–R15** and the dispatcher entry about `f7c9c7ce`.
- Review: `.../sc551-r3-review-report.md` (same dir) — read H-1, L-1, L-2, L-3 in full; its probe scripts are in
  `.../sc551-r3-evidence/scripts/` (`p-two-cameras`, `p-shared-udd*`) — reuse them for the H-1 repro.
- Branch head now `5fc0fec2`, worktree unchanged since you left it.

## The task — in this order

1. **Rebase first.** `git -C <plugin> fetch origin`; confirm `origin/develop` = `f7c9c7ce` (if it moved again, rebase
   onto the new tip and say so). `git -C <plugin> rebase origin/develop`. SC-540 touched
   `visual-harness/obsidian-lifecycle.mjs` near G-S62 phase (d) — resolve any conflict keeping BOTH sides intact; do
   not alter G-S62 or any scenario code. `npm ci` again if `package.json`/lockfile changed.
2. **Findings, verbatim rulings:**

> R11 — H-1 FOLD, fix (a): the helper additionally requires that the LISTEN socket on `127.0.0.1:<report.port>` belongs
> to OUR child — its inode from `/proc/net/tcp` (and `tcp6`) found as `socket:[inode]` under `/proc/<child.pid>/fd`;
> otherwise `CdpOwnershipError('foreign-listener')` → exit 2. Keep the GUID check. Unit test with a socket owned by a
> different pid (injectable `/proc` reader seam). Applies to lifecycle and camera alike. Fix (b) (exclusive udd lock) is
> NOT in this effort — it belongs to SC-554 (ticket updated with the reviewer's lock proposal).

> R12 — fold L-1 (`obsidian-camera.mjs:700` → `EnvFailure`, exit 2), L-2 (`docs-shots.mjs:318-319, 357` passes the
> camera's exit 2 through as 2), L-3 (one `/json/version` GUID re-check right before lifecycle's `Cdp.connect`).

> R13 — fold the text corrections: helper header ("ours exactly when…" must state the precondition: the udd belongs to
> our child alone, and now the socket-owner proof); proposal §4 must not claim concurrent cameras are safe without a
> private `DSE_CAMERA_TMP`; add I-1's note "pin ports below 32768 (outside the ephemeral range)" to the proposal.

   Check before relying on it: is `child.pid` really the process holding the socket (`/usr/bin/obsidian` could be a
   wrapper that forks)? The reviewer saw the `ss` owner always equal the spawned pid — re-measure once on this build
   and, if it is ever a descendant instead, accept our child's descendants (walk `/proc/<pid>/task/*/children` or
   `PPid`) — but never any process outside our child's tree. Out of scope, cite only: SC-554 (udd lock), SC-553 (e2e
   chromedriver), SC-555 (docs-shots gif). Dropped (R14): I-1 cause hunt, I-2 mutants, I-3, I-4.
3. **Prove H-1 is fixed**: the reviewer's two-cameras-same-`DSE_CAMERA_TMP` repro (private `DSE_CAMERA_TMP` under your
   scratch, private displays/ports), 3+ pairs at 0 ms offset and a few at 0–600 ms: before your fix (on `5fc0fec2`
   rebased, or the reviewer's logs as the base) both drive one Obsidian; after, the loser exits 2 with a
   `foreign-listener` (or equivalent) env message and the winner exits 0. Also the helper-alone shared-udd probe
   (10 tries). Re-run the lifecycle pinned-port pair (3 tries) and default-port pair (3 tries) and the camera decoy
   (2 tries) to show nothing regressed.

## Gates — full land-ready battery on the rebased head (dse-verify skill, CURRENT as relayed for `f7c9c7ce`)

One gate per blocking foreground call, output to uniquely named files, exit codes from a script FILE via
`devbox run -c <plugin abs path> -- bash <script>`.
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: `f7c9c7ce` baseline 6297 passed / 1 skipped / 251 of 252 after a shots run → fresh worktree (no shots) 6296 / 2;
  plus your 11 tests so far + the new ones, +1 suite → about `6307+N passed / 2 skipped`, `252 of 253`. Report exactly.
- lifecycle **47/47** as THREE `--only` parts, each with its own explicit private port (47xxx): part 1 the 21 ids and
  part 2 the 16 ids from skill row 4, part 3 = `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S62 G-S56` (10,
  ~450 s; G-S56 last). Each `done: n/n ok, 0 failed`.
- e2e full: `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`, exit 0.
- obsidian-shots once on the rebased head: private `DSE_CAMERA_DISPLAY`, private `DSE_CAMERA_TMP`, no port env →
  `all 61 shots written`, rc 0.
- `main.js` and `styles.css` sha256 byte-identical to a build at `f7c9c7ce` (build that sha in a throwaway
  `git worktree add` under your scratch, removed afterwards by literal path) → shots/freeze/parity carry.

## Report

`.../sc551-lifecycle-cdp-port-race/sc551-r4-fix-report.md` opening with a ≤10-line executive summary (final sha,
rebase base, H-1 repro before/after counts, gate lines). Evidence in `.../sc551-r4-evidence/`. Update
`sc551-r1-dse-verify-proposal.md` per R13. `Drive-by fixes:` / `Follow-ups:` at the end. Commit after each coherent
step; final tree clean.
