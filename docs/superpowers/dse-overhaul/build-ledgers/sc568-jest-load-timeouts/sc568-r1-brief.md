# SC-568 r1 brief — implementer: stop jest suites timing out on a loaded host

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc568-jest-load-timeouts/decisions.md`
  (ticket text verbatim + owner decisions D1–D4). It is your spec.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 1–220
  (battery table, devbox wrapping, stale `main.js`, "Load-sensitive jest suites", lifecycle/e2e
  notes, THE exit-code footgun). It is ~430 KB: read only those line ranges, plus the
  "Current expected numbers" CURRENT entry (starts at the `## Current expected numbers` heading,
  first paragraph only).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc568-jest-load-timeouts`, plugin at
  `.../draw-steel-elements` on branch `sc568-jest-load-timeouts` @ dse develop `1cc54eac`. Verify
  `pwd`/branch before any write. First: `git -C <plugin> fetch origin` and confirm
  `origin/develop` is still `1cc54eac`; if it moved, rebase onto it and say so.
- **Workers never call the tracker** (Linear) — not to read, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; ignore it, never touch
  the main checkout at all.

## 2. The task

Ticket fix line (verbatim): "Fix: raise those tests' timeouts or make them cheaper; check for
other suites near the 5 s limit." Implement owner decision D2 (a)–(d) from the ledger, within D1
(test setup only; `main.js` and `styles.css` must build byte-identical to `1cc54eac`).

Steps:

1. **Measure (base).** Quiet-ish host check `/proc/loadavg` first and record it. Full jest with
   `--json --outputFile=<your private dir>/sc568-base.json` (remember `rm -f main.js styles.css`
   in the plugin root before jest — stale-bundle footgun). From the JSON list: the 30 slowest
   tests and every test > 1000 ms, and the slowest suites. Note which tests use real timers /
   real waits (`setTimeout`-based sleeps, `waitFor` with real time, `Date.now()` windows).
2. **Reproduce under deterministic contention (base).** Pin jest to few cores, e.g.
   `taskset -c 0,1 npx jest` (default workers) — try `-c 0` or `-c 0,1` until the base shows
   timeout reds in the full run; record which tests fail and the failure messages (timeout vs
   assertion). Do this at least twice. If you cannot redden the base at all, say so with what you
   tried; do not invent a repro.
3. **Fix**, per D2:
   (a) `testTimeout: 30000` applying to BOTH projects (`unit`, `dom`) in `jest.config.ts`, with an
       SC-568 comment. Prove it applies to both projects (e.g. a throwaway test that sleeps 6 s in
       each project passes, then delete the throwaway — do not commit it).
   (b) grep for explicit per-test timeouts / `jest.setTimeout` below 30 s; raise load-shaped
       ones, list intentional tight ones unchanged with a one-line reason.
   (c) tests whose verdict depends on REAL elapsed time — at minimum `test/dom/framework/chromeFocusHandoff.test.ts`
       "SC-505 r3 LOW-A" (windows `SETTLE_MS` 1500 / `REQUEST_TTL_MS` 5000 in
       `src/.../chrome/focusHandoff.ts`) — made clock-independent (jest fake timers or an injected
       clock) while asserting the same thing. A test seam in `src/` is allowed only if it does not
       change the built bundle's behaviour; flag it explicitly if you add one.
   (d) obvious cheap wins (expensive per-test setup that can be per-suite without changing what is
       tested) — optional; report separately.
   Do NOT put a bracketed ticket id (e.g. `[SC-568]`) in any test title — the e2e runner reads test
   titles for scenario ids. Commit after each coherent step.
4. **Verify the fix**: same contention repro on the branch, at least 3 full runs, 0 failed; then a
   quiet full jest. Also run `twin-reuse`, `initiative-default-keys`, `chromeFocusHandoff` alone
   under `taskset -c 0` x5 each.
5. **Bundle identity**: `npm run build` (or the battery's build step) and sha256 `main.js` and
   `styles.css`; compare to a build of `1cc54eac` (expected `main.js` `825bd341…fbd7`,
   `styles.css` `18730938…f1f9`).
6. **Docs proposal** (D4): write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc568-jest-load-timeouts/sc568-skill-proposal.md`
   with replacement text for dse-verify's "### Load-sensitive jest suites" section reflecting the
   new 30 s default (keep it short; what still is load-sensitive, if anything). Do NOT edit
   SKILL.md. If the plugin's own `AGENTS.md`/docs mention the 5 s timeout, update them in the
   branch.

## 3. Gates (dse-verify battery, in your worktree)

tsc clean, lint clean, jest **11794 passed / 2 skipped** fresh without the shots cache (+ any
tests you add; state the delta). Lifecycle and e2e are required to land every dse change:
lifecycle **62/62** in SEVEN `--only=` parts (comma-separated ids), one part per Bash call,
output to a log:
`G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` 9;
`G-S57,G-S62,G-S61,G-S56` 4; `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` 7;
`G-S92,G-S96,G-S97,G-S99` 4; `G-S108` 1 (take the exact id lists for parts 1–2 from the
SCENARIOS order in `visual-harness/obsidian-lifecycle.mjs`). e2e:
`OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs
SC-257, SC-355, SC-384). If G-S97 fails, first check `demo-vault/.obsidian/appearance.json` in
YOUR worktree is clean (`git -C <plugin> status`) and restore it (SC-622) before blaming a change.
A G-S91 FAIL is a real signal unless it says the host was too slow after two re-runs.
Shots/freeze/parity carry if bundle is byte-identical (do not run them); if not identical, STOP and
report — that violates D1.

## 4. Report path

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc568-jest-load-timeouts/sc568-r1-report.md`
— opens with a ≤10-line executive summary. Keep raw logs/JSON in a private scratch folder
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r1-impl/`
with uniquely named files.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — verdict, final branch sha,
commit list, measured numbers (base vs branch under contention, quiet jest, lifecycle per part,
e2e line, bundle shas, loadavg at each run), plus the absolute path of every evidence artifact.
Sections `Drive-by fixes:` and `Follow-ups:` if any.

## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions. Read the process's own output or a per-run unique path.
- Redirect long-running output to a file rather than streaming it.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and
  the question. If you ever message anyway, the first word must be `SC-568:`.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc568-jest-load-timeouts/draw-steel-elements -- bash /abs/script.sh`.
  Never `cd X && …` compound commands; `git -C <abs path>` for every git command. Devbox eats
  `$?`: record exit codes inside a script FILE (written with the Write tool), and read each gate's
  own summary line.
- Run each gate as a blocking foreground call. The Bash tool backgrounds any call over 180 s and
  notifies on completion; for a lifecycle part, one part per call, log to a file; while waiting a
  read-only wait is `timeout 175 tail --pid=<pid> -f /dev/null` on YOUR OWN node pid (its
  `/proc/<pid>/cwd` is your worktree). No `Monitor`, no self-started background jobs you then
  wait on.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is in your
  worktree. Never `rm -rf` / `rm -f` a glob (in /tmp, the scratchpad, or `.superpowers/`); no
  `rm` with a shell-variable path; delete only literal paths you created. Never touch other
  efforts' dirs.
- Private scratch folder only (the session scratchpad is shared): use
  `.../scratchpad/sc568-r1-impl/` and unique script names (`sc568-r1-jest.sh`, …).
- `npm ci` if `package.json`'s obsidian version differs from `node_modules` (stale modules give
  phantom tsc errors).
- taskset contention runs make jest slow; keep each under the 10-minute tool timeout (split by
  `--selectProjects unit|dom` if needed) and log to files.
