# SC-442 round 7 — scoped re-review brief (the r3 fix delta, the rebase onto `957e4b11`, three markers turned into plain tests)

You review a DELTA on SC-442's branch (real-Obsidian e2e + jsdom functional coverage of
`ds-counter`, test-only). You wrote none of it. This is NOT a fresh full pass: the full review
was r2 (`sc442-r2-review-report.md`); you check that its findings were fixed as ruled, that the
rebase onto 46 newer develop commits did not break or hollow out anything, and that three markers
(CTR-U01, CTR-W01, CTR-W02) were correctly turned into plain tests now that their bugs (SC-671,
SC-672) are fixed on develop. Your final text goes to the SC-442 ticket-owner, not a
human. **You never call the tracker (Linear) — not to read, not to post. You never push. You do
not commit to the branch.**

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/decisions.md`
  — read all of it. The deciding parts for you: "Owner rulings on phase A" (what each marker may
  assert), "Owner rulings on r2" (what the fix round had to do — your checklist), and "Resume
  2026-11-23" (current state; it wins over anything it strikes through).
- Reports in the same dir (read the ≤10-line executive summaries, dive only where needed):
  `sc442-r2-review-report.md` (the findings M-1..M-3, L-1..L-3, I-1..I-4, P-1, P-2 by id),
  `sc442-r6-implementer-report.md` (the rebase round — two rebases, first onto `8c08bce2`, then onto
  `957e4b11`: conflicts, the CTR-U01 / W01 / W02 changes, the battery). Its briefs, if you need the
  instructions it worked to: `sc442-brief-r6-implementer-rebase.md`, `sc442-brief-r6b-implementer-second-rebase.md`.
  There is NO r3 report — the r3 fix round's only record is its two commits (see §2).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup`, submodule
  `draw-steel-elements/`, branch `sc442-e2e-counter-topup`. Head sha, base sha and the implementer's
  numbers are in the dispatch message. For probes, make a scratch `git worktree add` at an absolute
  path inside your scratch folder (symlink or `npm ci` its `node_modules` through devbox) and remove
  it with `git -C <dse dir> worktree remove <literal abs path>` when done.
- `draw-steel-elements/e2e/README.md`, and
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 490 KB with
  very long lines: never read it whole; grep and `cut -c1-1500`. Sections that matter: the battery
  table near lines 20-135, "Jest timeouts under load" (~158), "Lifecycle and e2e notes" (~197), the
  CURRENT paragraph of "Current expected numbers"). Don't edit it.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; ignore it.

## 2. What to review — execute and probe, don't just read

The delta, in three parts. On the rebased branch (`git -C <dse> log --oneline 957e4b11..HEAD`):
the two commits titled "r3 review fixes: …" and "CTR-W02 title names what the marker checks",
everything the r6 implementer committed after them, and the rebase itself (the first three commits
are r1's, already reviewed in r2 — re-read them only where the rebase or develop's new code could
have changed their meaning).

**A. The r2 findings, each against its ruling (quoted from the ledger — the ruling is the bar, not
my summary here):**

1. **M-1.** "SC-672 markers CTR-W01 / CTR-W02 must NOT pass on a raw JS error card. One shared
   check on the error card's message text (regex for raw JS errors: `Cannot read properties`,
   `Cannot destructure`, `is not a function`, `TypeError`, `undefined`/`null` property access),
   used by both markers; a friendly error card or a fresh counter still passes." SC-672 is now
   FIXED on develop, so W01 / W02 are plain tests (see C) and the probe runs the other way. In the
   scratch worktree: (a) undo SC-672's product fix (`src/model/Counter.ts` and whatever else its
   commits changed) — W01 and W02 must go red; (b) replace the fix with one that shows a raw
   TypeError card — both must still be red (the shared check must catch it); (c) on the real head
   both pass.
2. **M-2.** "Exclude `wrong-block` (and any other SC-672 fixture) from the jsdom census `RENDERS`
   list, so no plain census row pins SC-672 B4 as correct." Ruling 2026-11-23: `wrong-block` stays
   out of the list (an error card is not a counter surface). Confirm no plain jest test on this
   branch still pins the pre-fix B4 / B5 behavior, and none was bent beyond the ledger ruling
   "Matrix / census tests red after SC-672".
3. **M-3 / SC-680.** "The wheel is NOT a manifest pair … Add a manifest comment saying so, citing
   SC-680. Marker: e2e `knownBug('SC-680')` on `unbounded.md`, driven with a REAL wheel action …
   not a synthetic WheelEvent: after one wheel notch over the focused box and a click away, the
   note's value is unchanged. It must not record an undeclared coverage pair." Confirm it fails
   today for that reason, flips under a simulated fix (wheel does nothing), and coverage stays Y/Y.
4. **P-2.** "No marker, and no plain test may pin either behavior" (ArrowDown on 25-of-max-20).
   Grep the e2e specs and the matrix.
5. **L-1.** "Every new e2e marker (SC-671, SC-672 ×2, SC-673 ×2, SC-674, SC-680) pins `failsWith`
   to its stated reason." (SC-671's and SC-672's are now gone — see C. Remaining markers: SC-673
   e2e + the jsdom `test.failing`, SC-674, SC-680.) Check each `failsWith` matches the real
   failure text and is not so loose that an unrelated failure satisfies it.
6. **L-2 / L-3 / I-1.** CTR-E04 reads as what it does (named constant or select-all + Backspace);
   the manifest `rows` notes are right ("no T06; separate dec / inc lists; S04 listed" — check
   against the ids that actually exist now); one Live Preview typed-value e2e test exists (type +
   Enter, asserting note AND screen) — mutation-probe it (break the Enter commit; it must go red).

**B. The rebase onto `957e4b11`** (46 commits past the old base `129beb18`: SC-434, SC-443 (1),
SC-462, SC-641, SC-644, SC-671, SC-675, SC-679, SC-672):

7. Conflicts resolved correctly: `e2e/README.md` keeps every row from both sides (the SC-671 and
   SC-672 owners' asks, verbatim in the ledger). The fixtures `e2e/vaults/shipped/Counter/empty-block.md`
   and `wrong-block.md` were add/add conflicts with SC-672: the ruling is "develop's copy wins, byte
   for byte" — `git -C <dse> diff 957e4b11 HEAD -- <those two files>` must be empty, and this
   branch's tests that use them must still test what they claim against develop's content. `git -C <dse> range-diff` (or a diff of the pre-rebase head `ed7130d9` against
   the rebased commits) shows no unintended change.
8. SC-671 changed `src/elements/counter/model.ts` and added `e2e/specs/counter/own-keys.e2e.ts`
   (CTR-O01..O04), `e2e/vaults/shipped/Counter/own-keys.md`, `test/dom/elements/counter-own-keys.test.ts`.
   Check: the counter manifest and both censuses still describe the surface as it is now; this
   branch's fixtures and SC-671's do not collide (file names, shared notes mutated by two specs);
   no matrix test was bent to fit — the owner ruling (ledger, "Matrix after SC-671") allows a
   matrix change ONLY where a test had been written around B1. The same for SC-672: it changed
   `src/model/Counter.ts` and added `e2e/specs/counter/counter-wrong-block.e2e.ts` (CTR-W03..W16),
   seven more Counter fixtures, `test/dom/elements/counter-wrong-block.test.ts` and
   `test/unit/model/counter-wrong-block.test.ts`; check this branch's specs and SC-672's do not
   mutate the same shipped note in ways that depend on run order.
9. SC-662 overlap (owner note of 2026-11-15 in the ledger, still open): `e2e/specs/sidebar/pending-saves.e2e.ts`
   pins a `ds-counter` and clicks `counter.inc` in the sidebar and in the note. Check (a)
   `[CENSUS-18]` / `[CENSUS-19]` and the jsdom counter census behave with a counter pinned to the
   sidebar (a sidebar card carries `chrome.unpin`; the census must neither miss a sidebar counter's
   un-id'd node nor flag shared chrome), and (b) the SC-442 specs and that spec do not disturb each
   other in a full run (shared note state, pinned panels left open).
10. SC-685 (Backlog, filed by SC-671): two identical counters that become identical again after a +
    trip the e2e "view registry collisions" check. Does any twin test on this branch depend on
    avoiding that shape by luck (order, timing)? Cite, don't re-report.
11. Scenario ids unique across develop and the live parallel branches (read-only):
    `/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert` (CENSUS-30..34). develop now
    holds CTR-O01..O04 (SC-671) and CTR-W03..W16 (SC-672, which left W01 / W02 to this branch). Literal ids in titles; no bracketed ticket id in any test title.
12. `src/` diff against `957e4b11` is empty.

**C. Three markers are now plain tests** (ledger rulings "CTR-U01 → plain test" and "CTR-W01 /
CTR-W02 → plain tests"):

13. CTR-U01: no `knownBug` / `failsWith` left on it; the assertion is still the ruled one (new
    value AND `note_to_self: keep me` AND `extra: {a: 1}`, parsed values, not key order); it passes.
    Mutation probe: in the scratch worktree, undo SC-671's product fix (or otherwise make a write
    drop unknown keys) — CTR-U01 must go red.
    CTR-W01 / CTR-W02: no `knownBug` / `failsWith`; each keeps its ruled assertion (W01 — the
    user's text is still in the note after the user tries a press, a card with no button is fine;
    W02 — the card never shows a raw JavaScript error) and the shared raw-JS-error check; probes as
    in item 1. Say plainly if either is now vacuous as a plain test (passes with the SC-672 fix
    undone) — that is a finding.
    No comment, manifest note or README row on this branch still calls SC-671 or SC-672 an open bug.

**D. Gates — re-run yourself on the branch head:** tsc, lint, jest (report loadavg), the full
`npm run e2e` twice (flake check; report wall time and both summary lines). Lifecycle (seven
`--only=` parts) and shots / freeze / parity: re-run only if the implementer's numbers look off —
the branch is test-only. After e2e, `git -C <dse> status --porcelain` must be empty (the tracked
`e2e/vaults/plugin-data.shipped.json` is never written by a run).

Baseline at develop `957e4b11`: tsc/lint clean · jest 14013 passed / 2 skipped fresh (one more
passed / 1 skipped with the shots css cache) · lifecycle 64/64 · e2e `682/687 ok, 0 failed, 5
known-bug, coverage: 418/418 pairs` · shots 592 · freeze 280/280 · parity 0/0/24. Expected on the
branch: coverage 428/428, 0 failed; known-bug = 5 + this branch's remaining markers (SC-673 e2e
markers, SC-674 ×1, SC-680 ×1 — count them and say which).

Flakes (ledger): INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657), NEGO-R05 / NEGO-R08 under load — a
re-run passes; a red that repeats is real. G-S115 (g) suspected flake (SC-633) — one re-run of
part 7. G-S63 flaked once on part 3 at `957e4b11` (SC-689) — one re-run. A G-S91 FAIL is real unless it says the host was too slow after two re-runs. Restore
`demo-vault/.obsidian/appearance.json` if dirty before blaming a G-S97 FAIL (SC-622). Never set
`DSE_LIFECYCLE_PORT`. Private `DSE_CAMERA_TMP` per run under your scratch folder. Jest's timeout is
30 s (SC-568): an "Exceeded timeout" is a real hang until the suite passes alone.

Out of scope (do not re-open): the r2 drops (I-2, I-4), the read-only real-Obsidian counter, the
`Edit <element>` chrome id (SC-444), SC-670 / SC-633 / SC-508 / SC-475 / SC-507. A NEW product bug
you trip over goes in its own section (title, repro, file:line, severity, nearest known ticket).

## 3. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. `git -C <abs path>` for every git command;
  `devbox run -c <abs path> -- bash <script-file>` for every devbox call, the script file `cd`ing in
  and running ONE gate with output to a unique log and the exit code to a unique rc file. Write
  scratch files with the Write tool.
- Private scratch folder (create it; nothing else in the scratchpad is yours):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc442-rev-r7/`
  — uniquely named scripts and logs. Never a generic `gate.sh`.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in `/tmp` or the scratchpad** (workers hung on
  the permission prompt). Leave throwaway files in place. The scratch git worktree is removed only
  with `git worktree remove <literal path>`. Never delete a shared `/tmp` glob.
- The Bash tool moves any call over 180 s to the background, and a backgrounded job never wakes
  you. For long gates: output to a log, then wait with
  `timeout 175 tail --pid=<the gate's own pid> -f /dev/null` (a pid whose `readlink /proc/<pid>/cwd`
  is inside your worktree or scratch worktree), repeated until it exits; then read the log and the
  rc file. Never wait for a completion notice; never a Monitor.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the process's
  own output, or write to a per-run unique path.
- Redirect long output to files (the 600 s stream watchdog kills silent agents). devbox's `sh`
  wrapper eats `$?` / `$PIPESTATUS`; `| tail` eats failures.
- Kill processes only by literal PID inside your worktree or scratch path. Never `pkill` / `killall`
  by pattern — other efforts (SC-443 and others) run the same gates concurrently.
- The worktree's superproject docs are stale (cut 2026-11-15). If `token-coverage.test.ts` goes red,
  compare the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's and
  use `DSE_TOKEN_MAP_PATH=/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md`.
  Not a code defect.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your
  completion notification and will resume you with the answer. If you ever do send a message
  anyway, its FIRST WORD must be your ticket key (`SC-442:`) — the dispatcher routes strays by that
  key and cannot judge content to guess.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/sc442-r7-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / NOT LAND-READY, counts by severity,
gate numbers, new-bug count). Then one line per checklist item 1-13 (PASS / FAIL + how you probed
it), then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each with file:line, the
failure scenario, how you probed it, and a prescribed fix. Product bugs in their own section. Then
every gate's log path and summary line.

## 5. Return contract

Your final text is for the ticket-owner: raw facts, no prose — verdict, counts by severity, each
finding's id + one line, each gate's measured summary line, and **the filesystem path of every
artifact you produced** (report, logs, probe outputs).
